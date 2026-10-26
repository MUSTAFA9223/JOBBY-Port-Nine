import * as THREE from 'three';
import { World } from './original/src/engine/world.js';
import { Renderer } from './original/src/engine/renderer.js';
import { ARENA_LIST, loadArena } from './original/src/arenas/index.js';
const canvas=document.getElementById('gl'), select=document.getElementById('arena'), status=document.getElementById('status');
const renderer=new Renderer(canvas,'low');
const world=new World(renderer);renderer.attach(world.scene);
let yaw=0,pitch=.3,dist=42,target=new THREE.Vector3(),drag=null,loading=false;
for(const a of ARENA_LIST){const o=document.createElement('option');o.value=a.id;o.textContent=a.name;select.append(o);}
async function openMap(id){
 if(loading)return;loading=true;status.textContent='Loading original map…';
 try{const a=await loadArena(id);await world.load(a.meta,a.build,'low');
 const spawn=a.meta.spawn||[0,0,0];target.set(spawn[0],spawn[1]+3,spawn[2]);
 dist=55;pitch=.38;yaw=.4;status.textContent=a.meta.name+' — original environment, no characters';
 history.replaceState(null,'','#'+id);
 }catch(e){console.error(e);status.textContent='Could not load map: '+e.message}
 finally{loading=false;}
}
select.addEventListener('change',()=>openMap(select.value));
const initial=location.hash.slice(1);select.value=ARENA_LIST.some(a=>a.id===initial)?initial:'palisade';
canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId)});
canvas.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;yaw-=dx*.006;pitch=Math.max(-.2,Math.min(1.25,pitch+dy*.006))});
canvas.addEventListener('pointerup',()=>drag=null);
canvas.addEventListener('pointercancel',()=>drag=null);
canvas.addEventListener('wheel',e=>{dist=Math.max(8,Math.min(160,dist+e.deltaY*.06))},{passive:true});
let last=performance.now();
function frame(t){requestAnimationFrame(frame);const dt=Math.min(.05,(t-last)/1000);last=t;world.update(dt);
 const c=renderer.camera;c.position.set(target.x+Math.sin(yaw)*Math.cos(pitch)*dist,target.y+Math.sin(pitch)*dist,target.z+Math.cos(yaw)*Math.cos(pitch)*dist);c.lookAt(target);renderer.render(dt);}
requestAnimationFrame(frame);openMap(select.value);
