import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { World } from './original/src/engine/world.js';
import { Renderer } from './original/src/engine/renderer.js';
import { ARENA_LIST, loadArena } from './original/src/arenas/index.js';
const canvas=document.getElementById('gl'), select=document.getElementById('arena'), status=document.getElementById('status');
const characterSelect=document.getElementById('character');
const characterNames=["BaseCharacter.glb","BlueSoldier_Female.glb","BlueSoldier_Male.glb","Casual2_Female.glb","Casual2_Male.glb","Casual3_Female.glb","Casual3_Male.glb","Casual_Bald.glb","Casual_Female.glb","Casual_Male.glb","Chef_Female.glb","Chef_Hat.glb","Chef_Male.glb","Cow.glb","Cowboy_Female.glb","Cowboy_Hair.glb","Cowboy_Male.glb","Doctor_Female_Old.glb","Doctor_Female_Young.glb","Doctor_Male_Old.glb","Doctor_Male_Young.glb","Elf.glb","Goblin_Female.glb","Goblin_Male.glb","Kimono_Female.glb","Kimono_Male.glb","Knight_Golden_Female.glb","Knight_Golden_Male.glb","Knight_Male.glb","Ninja_Female.glb","Ninja_Male.glb","Ninja_Male_Hair.glb","Ninja_Sand.glb","Ninja_Sand_Female.glb","OldClassy_Female.glb","OldClassy_Male.glb","Pirate_Female.glb","Pirate_Male.glb","Pug.glb","Soldier_Female.glb","Soldier_Male.glb","Suit_Female.glb","Suit_Male.glb","VikingHelmet.glb","Viking_Female.glb","Viking_Male.glb","Witch.glb","Wizard.glb","Worker_Female.glb","Worker_Male.glb","Zombie_Female.glb","Zombie_Male.glb"];
for(const name of characterNames){const option=document.createElement('option');option.value=name;option.textContent=name.replace('.glb','').replaceAll('_',' ');characterSelect.append(option);}
characterSelect.value='Casual_Male.glb';
const gltfLoader=new GLTFLoader();let character=null,mixer=null,animations=[],characterLoad=0;
const renderer=new Renderer(canvas,'low');
const world=new World(renderer);renderer.attach(world.scene);
let yaw=0,pitch=.3,dist=42,target=new THREE.Vector3(),drag=null,loading=false,moveX=0,moveY=0,joystickPointer=null,joystickOrigin=null;
for(const a of ARENA_LIST){const o=document.createElement('option');o.value=a.id;o.textContent=a.name;select.append(o);}
async function openMap(id){
 if(loading)return;loading=true;status.textContent='Loading original map…';
 try{const a=await loadArena(id);await world.load(a.meta,a.build,'low');
 const spawn=a.meta.spawn||[0,0,0];target.set(spawn[0],spawn[1]+3,spawn[2]);
 dist=9;pitch=.28;yaw=.4;status.textContent=a.meta.name+' — original environment, no characters';
 history.replaceState(null,'','#'+id);await changeCharacter(characterSelect.value);
 }catch(e){console.error(e);status.textContent='Could not load map: '+e.message}
 finally{loading=false;}
}
select.addEventListener('change',()=>openMap(select.value));
async function changeCharacter(name){
 const ticket=++characterLoad;
 if(character){world.scene.remove(character);character=null;}mixer=null;
 status.textContent='Loading JOBBY character…';
 try{
 const gltf=await gltfLoader.loadAsync('./jobby-characters/'+encodeURIComponent(name));
 if(ticket!==characterLoad)return;
 character=gltf.scene;character.scale.setScalar(1);
 const bounds=new THREE.Box3().setFromObject(character),size=new THREE.Vector3();bounds.getSize(size);
 if(size.y>0)character.scale.multiplyScalar(2.5/size.y);
 const bb=new THREE.Box3().setFromObject(character);character.position.y=-bb.min.y;
 world.scene.add(character);
 if(gltf.animations.length){mixer=new THREE.AnimationMixer(character);animations=gltf.animations;const idle=animations.find(a=>/idle/i.test(a.name))||animations[0];mixer.clipAction(idle).play();}
 status.textContent='Ready — '+name.replace('.glb','');
 }catch(e){console.error(e);status.textContent='Character failed to load: '+e.message;}
}
characterSelect.addEventListener('change',()=>changeCharacter(characterSelect.value));
const stick=document.getElementById('stick'), knob=document.getElementById('knob');
function resetStick(){joystickPointer=null;moveX=0;moveY=0;knob.style.transform='translate(0px,0px)';}
stick.addEventListener('pointerdown',e=>{e.preventDefault();joystickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);const b=stick.getBoundingClientRect();joystickOrigin={x:b.left+b.width/2,y:b.top+b.height/2};});
stick.addEventListener('pointermove',e=>{if(e.pointerId!==joystickPointer)return;e.preventDefault();let x=e.clientX-joystickOrigin.x,y=e.clientY-joystickOrigin.y;const len=Math.hypot(x,y),radius=42;if(len>radius){x=x/len*radius;y=y/len*radius;}moveX=x/radius;moveY=y/radius;knob.style.transform=`translate(${x}px,${y}px)`;});
stick.addEventListener('pointerup',resetStick);stick.addEventListener('pointercancel',resetStick);
const keys=new Set();window.addEventListener('keydown',e=>keys.add(e.key.toLowerCase()));window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
const initial=location.hash.slice(1);select.value=ARENA_LIST.some(a=>a.id===initial)?initial:'palisade';
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;yaw-=dx*.006;pitch=Math.max(-.2,Math.min(1.25,pitch+dy*.006))});
canvas.addEventListener('pointerup',()=>drag=null);
canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('wheel',e=>{dist=Math.max(8,Math.min(160,dist+e.deltaY*.06))},{passive:true});
let last=performance.now();
function frame(t){requestAnimationFrame(frame);const dt=Math.min(.05,(t-last)/1000);last=t;world.update(dt);
 const forward=(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0)-moveY;
 const sideways=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+moveX;
 const speed=5.5*dt;target.x+=(Math.sin(yaw)*forward+Math.cos(yaw)*sideways)*speed;target.z+=(Math.cos(yaw)*forward-Math.sin(yaw)*sideways)*speed;
 if(character){character.position.x=target.x;character.position.z=target.z;if(Math.hypot(forward,sideways)>.08)character.rotation.y=Math.atan2(Math.sin(yaw)*forward+Math.cos(yaw)*sideways,Math.cos(yaw)*forward-Math.sin(yaw)*sideways);}
 mixer?.update(dt);
 const c=renderer.camera;c.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*dist,target.y+Math.sin(pitch)*dist,target.z+Math.cos(yaw)*Math.cos(pitch)*dist);c.lookAt(target);renderer.render(dt);}
requestAnimationFrame(frame);openMap(select.value);
