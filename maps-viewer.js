// JOBBY Maps: mobile-first, independently deployed preview.
// This entry has no static imports: menus and errors remain visible even if WebGL fails.
const canvas = document.getElementById('gl');
const arenaPicker = document.getElementById('arena');
const characterPicker = document.getElementById('character');
const status = document.getElementById('status');
const alertBox = document.getElementById('error');
const errorText = document.getElementById('errorText');
const stick = document.getElementById('stick');
const knob = document.getElementById('knob');
const jump = document.getElementById('jump');
const preview=document.getElementById('preview');
arenaPicker.replaceChildren();characterPicker.replaceChildren();
const maps = [
 ['backrooms','THE BACKROOMS'],['neonmetro','NEON METRO'],
 ['cargoyard','PORT NINE'],['undercroft','THE UNDERCROFT'],
 ['aqueducts','THE AQUEDUCTS'],['frostwatch','FROSTWATCH'],
 ['orbital','HALO NINE'],['palisade','PALISADE MALL'],
 ['forge','THE FORGE'],['abbadon','ABBADON MANOR'],
 ['bazaar','DUST BAZAAR'],['static','THE STATIC']
];
const characterNames=["BaseCharacter.glb","BlueSoldier_Female.glb","BlueSoldier_Male.glb","Casual2_Female.glb","Casual2_Male.glb","Casual3_Female.glb","Casual3_Male.glb","Casual_Bald.glb","Casual_Female.glb","Casual_Male.glb","Chef_Female.glb","Chef_Hat.glb","Chef_Male.glb","Cow.glb","Cowboy_Female.glb","Cowboy_Hair.glb","Cowboy_Male.glb","Doctor_Female_Old.glb","Doctor_Female_Young.glb","Doctor_Male_Old.glb","Doctor_Male_Young.glb","Elf.glb","Goblin_Female.glb","Goblin_Male.glb","Kimono_Female.glb","Kimono_Male.glb","Knight_Golden_Female.glb","Knight_Golden_Male.glb","Knight_Male.glb","Ninja_Female.glb","Ninja_Male.glb","Ninja_Male_Hair.glb","Ninja_Sand.glb","Ninja_Sand_Female.glb","OldClassy_Female.glb","OldClassy_Male.glb","Pirate_Female.glb","Pirate_Male.glb","Pug.glb","Soldier_Female.glb","Soldier_Male.glb","Suit_Female.glb","Suit_Male.glb","VikingHelmet.glb","Viking_Female.glb","Viking_Male.glb","Witch.glb","Wizard.glb","Worker_Female.glb","Worker_Male.glb","Zombie_Female.glb","Zombie_Male.glb"];
for (const [id,label] of maps) {
 const option = document.createElement('option');
 option.value=id; option.textContent=label; arenaPicker.add(option);
}
for (const file of characterNames) {
 const option=document.createElement('option');
 option.value=file; option.textContent=file.slice(0,-4).replaceAll('_',' ');
 characterPicker.add(option);
}
characterPicker.value='Casual_Male.glb';
arenaPicker.value=maps.some(m=>m[0]===location.hash.slice(1))?location.hash.slice(1):'palisade';
const setStatus=(message)=>{status.textContent=message;};
function showError(message) {
 const text=String(message instanceof Error?message.message:message);
 console.error('[JOBBY MAPS]',message);
 setStatus('ERROR — '+text.slice(0,90));
 errorText.textContent=text;
 alertBox.hidden=false;
 preview.hidden=false;
}
window.addEventListener('error',e=>showError(e.error||e.message||'Script error'));
window.addEventListener('unhandledrejection',e=>showError(e.reason||'Module failed to load'));
let THREE, gl, camera, world, loader, mixer=null, avatar=null, mainModel=null;
let mapMeta=null, requestId=0, characterRequest=0;
let yaw=0.2, pitch=0.12, dist=3.2, moveX=0, moveY=0, joyPointer=null, viewPointer=null;
let x=0,z=0,y=0,jumpHeight=0,jumpSpeed=0;
let lastTime=0, started=false, loading=false, lastCameraCheck=0, safeCameraDistance=3.2;
let environmentMap=null, persistentLights=null;
let collidableMeshes=[];
const keys=new Set();
window.addEventListener('keydown',e=>{keys.add(e.key.toLowerCase());if(e.key===' '){e.preventDefault();doJump();}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
function doJump() {if(started && jumpHeight<=0.02)jumpSpeed=6.2;}
jump.addEventListener('pointerdown',e=>{e.preventDefault();doJump();});
function releaseJoy(){joyPointer=null;moveX=0;moveY=0;knob.style.transform='translate(0px,0px)';}
stick.addEventListener('pointerdown',e=>{
 e.preventDefault();joyPointer=e.pointerId;stick.setPointerCapture(e.pointerId);
 updateJoy(e);
});
function updateJoy(e) {
 if(e.pointerId!==joyPointer)return;
 const b=stick.getBoundingClientRect(),centerX=b.left+b.width/2,centerY=b.top+b.height/2;
 let dx=e.clientX-centerX,dy=e.clientY-centerY;
 const len=Math.hypot(dx,dy),radius=b.width*.34;
 if(len>radius){dx=dx/len*radius;dy=dy/len*radius;}
 moveX=dx/radius;moveY=dy/radius;
 knob.style.transform='translate('+dx+'px,'+dy+'px)';
}
stick.addEventListener('pointermove',e=>{e.preventDefault();updateJoy(e);});
stick.addEventListener('pointerup',releaseJoy);
stick.addEventListener('pointercancel',releaseJoy);
canvas.addEventListener('pointerdown',e=>{
 viewPointer={id:e.pointerId,x:e.clientX,y:e.clientY};
 canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove',e=>{
 if(!viewPointer||e.pointerId!==viewPointer.id)return;
 const dx=e.clientX-viewPointer.x,dy=e.clientY-viewPointer.y;
 viewPointer.x=e.clientX;viewPointer.y=e.clientY;
 yaw-=dx*.005;pitch=Math.max(-.1,Math.min(1.05,pitch+dy*.004));
});
canvas.addEventListener('pointerup',()=>viewPointer=null);
canvas.addEventListener('pointercancel',()=>viewPointer=null);
canvas.addEventListener('wheel',e=>dist=Math.max(4,Math.min(20,dist+e.deltaY*.015)),{passive:true});
window.addEventListener('resize',()=>{
 if(!gl||!camera)return;
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 gl.setSize(innerWidth,innerHeight,false);
});
async function loadCharacter(file) {
 if(!loader||!world)return;
 const ticket=++characterRequest;
 setStatus('Loading '+file.slice(0,-4)+'…');
 try {
  const gltf=await loader.loadAsync('./jobby-characters/'+encodeURIComponent(file));
  if(ticket!==characterRequest)return;
  if(avatar)world.scene.remove(avatar);
  avatar=new THREE.Group();mainModel=gltf.scene;avatar.add(mainModel);
  const size=new THREE.Vector3(),bounds=new THREE.Box3().setFromObject(mainModel);
  bounds.getSize(size);
  if(size.y>0.001&&isFinite(size.y))mainModel.scale.multiplyScalar(2.4/size.y);
  const newBounds=new THREE.Box3().setFromObject(mainModel);
  mainModel.position.y-=newBounds.min.y;
  world.scene.add(avatar);
  avatar.position.set(x,y,z);
  mixer=null;
  if(gltf.animations.length){
    mixer=new THREE.AnimationMixer(mainModel);
    const idle=gltf.animations.find(a=>/idle/i.test(a.name))||gltf.animations[0];
    mixer.clipAction(idle).play();
  }
  setStatus('Ready — '+file.slice(0,-4));
 }catch(e){
  if(ticket!==characterRequest)return;
  console.error(e);
  setStatus('Map ready · Could not load '+file.slice(0,-4));
  errorText.textContent='Character: '+String(e.message||e);
  alertBox.hidden=false;
 }
}
async function openMap(id) {
 if(!world)return;
 const ticket=++requestId;
 if(loading){setStatus('Finish loading current map first');return;}
 loading=true;alertBox.hidden=true;preview.hidden=false;
 setStatus('Building '+(maps.find(m=>m[0]===id)?.[1]||id)+'…');
 await new Promise(resolve=>requestAnimationFrame(resolve));
 try {
  const {loadArena}=await import('./original/src/arenas/index.js');
  const arena=await loadArena(id);
  if(ticket!==requestId)return;
  // Building this source arena may be CPU intensive on older phones.
  await world.load(arena.meta,arena.build,'low');
  mapMeta=arena.meta;
  preview.hidden=true;
  collidableMeshes=[];
  world.root.traverse(o=>{if(o.isMesh && o.userData.collide===true && !o.isInstancedMesh)collidableMeshes.push(o);});
  lastCameraCheck=0;safeCameraDistance=dist;
  const spawn=arena.meta.spawn||[0,0,0];
  [x,y,z]=[spawn[0],spawn[1],spawn[2]];
  jumpHeight=0;jumpSpeed=0;
  if(avatar)avatar.position.set(x,y,z);
  history.replaceState(null,'','#'+id);
  setStatus('Map ready · Loading character…');
  await loadCharacter(characterPicker.value);
 }catch(e){showError(e);}
 finally{loading=false;}
}
function tick(time){
 requestAnimationFrame(tick);
 const dt=Math.min(.04,Math.max(0,(time-lastTime)/1000));lastTime=time;
 if(!started)return;
 let f= -moveY+(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0);
 let side=moveX+(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
 const length=Math.hypot(f,side);if(length>1){f/=length;side/=length;}
 const forwardX=Math.sin(yaw),forwardZ=Math.cos(yaw),sideX=Math.cos(yaw),sideZ=-Math.sin(yaw);
 const vx=(forwardX*f+sideX*side),vz=(forwardZ*f+sideZ*side);
 const speed=5.5*dt;
 const limit=(mapMeta?.bounds||150);
 x=Math.max(-limit,Math.min(limit,x+vx*speed));
 z=Math.max(-limit,Math.min(limit,z+vz*speed));
 if(jumpHeight>0||jumpSpeed>0){
  jumpHeight=Math.max(0,jumpHeight+jumpSpeed*dt);
  jumpSpeed-=16*dt;
  if(jumpHeight===0)jumpSpeed=0;
 }
 if(avatar){
  avatar.position.set(x,y+jumpHeight,z);
  if(length>.05)avatar.rotation.y=Math.atan2(vx,vz);
 }
 mixer?.update(dt);
 const lookAt=new THREE.Vector3(x,y+1.4+jumpHeight,z);
 const backward=new THREE.Vector3(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch)+.17,-Math.cos(yaw)*Math.cos(pitch)).normalize();
 if(time-lastCameraCheck>180){
  lastCameraCheck=time;
  if(collidableMeshes.length){
   try{
    const ray=new THREE.Raycaster(lookAt,backward,0.18,dist);
    ray.firstHitOnly=true;
    const hits=ray.intersectObjects(collidableMeshes,false);
    safeCameraDistance=hits.length?Math.max(.65,hits[0].distance-.25):dist;
   }catch(e){safeCameraDistance=dist;}
  }else safeCameraDistance=dist;
 }
 camera.position.copy(lookAt).addScaledVector(backward,safeCameraDistance);
 camera.lookAt(lookAt);
 world.update(dt);
 gl.render(world.scene,camera);
}
async function boot(){
 const probe=document.createElement('canvas');
 if(!probe.getContext('webgl2')&&!probe.getContext('webgl')){
  throw new Error('WebGL disabled in this browser. Open in Chrome with hardware acceleration.');
 }
 setStatus('Loading 3D engine…');
 const mods=await Promise.all([
  import('three'),
  import('./original/src/engine/world.js'),
  import('./original/src/engine/textures.js'),
  import('three/addons/loaders/GLTFLoader.js'),
  import('./original/src/engine/assets.js'),
  import('three/addons/environments/RoomEnvironment.js')
 ]);
 [THREE]=mods;
 const [{World},{setTextureRenderer},{GLTFLoader},{setAssetRenderer},{RoomEnvironment}]=mods.slice(1);
 gl=new THREE.WebGLRenderer({canvas,antialias:false,alpha:false,powerPreference:'low-power'});
 gl.setPixelRatio(Math.min(0.85,devicePixelRatio||1));gl.setSize(innerWidth,innerHeight,false);
 gl.outputColorSpace=THREE.SRGBColorSpace;gl.toneMapping=THREE.ACESFilmicToneMapping;
 gl.toneMappingExposure=1.38;gl.shadowMap.enabled=false;
 camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.1,1000);
 setTextureRenderer(gl);setAssetRenderer(gl);
 let env=null;
 try{
  const pmrem=new THREE.PMREMGenerator(gl);
  pmrem.compileEquirectangularShader();
  env=pmrem.fromScene(new RoomEnvironment(),0.04).texture;
  environmentMap=env;
 }catch(e){console.warn('Environment lighting unavailable, using fallback lighting',e);}
 const adapter={roomEnv:env,setGrade(opts){if(typeof opts.exposure==='number')gl.toneMappingExposure=Math.max(1.1,opts.exposure);}};
 world=new World(adapter);
 // Persistent lights remain when a new arena clears only the arena root.
 const ambient=new THREE.AmbientLight(0xffffff,0.75);
 const hemi=new THREE.HemisphereLight(0xfff9e9,0x5e6177,1.05);
 const sun=new THREE.DirectionalLight(0xfff1d6,0.75);
 sun.position.set(6,11,8);
 world.scene.add(ambient,hemi,sun);
 persistentLights={ambient,hemi,sun};
 loader=new GLTFLoader();
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();started=false;showError('The phone lost its graphics context. Close other apps and press Retry.');});
 started=true;lastTime=performance.now();requestAnimationFrame(tick);
 arenaPicker.addEventListener('change',()=>openMap(arenaPicker.value));
 characterPicker.addEventListener('change',()=>loadCharacter(characterPicker.value));
 await openMap(arenaPicker.value);
}
boot().catch(showError);
