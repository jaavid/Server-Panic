import * as T from './vendor/three.module.min.js';
const POS = [[-4.7,0,-2.8],[-1.8,0,-3.2],[1.1,0,-3.6]];
const targets = { venue:[1,0,3.2], data:[-2,0,-2.6], control:[5.7,0,-2.2] };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export function city(canvas, select) {
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias:true, powerPreference:'low-power' });
  } catch {
    const note = document.createElement('p');
    note.className = 'fallback';
    note.textContent = 'نمای سه‌بعدی در این مرورگر در دسترس نیست. مأموریت از دکمه‌های پایین قابل بازی است.';
    canvas.after(note);
    return { focus() {}, zoom() {}, render() {} };
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace = T.SRGBColorSpace;
  const scene = new T.Scene();
  scene.background = new T.Color(0x111f38);
  scene.fog = new T.FogExp2(0x111f38,.017);
  scene.add(new T.HemisphereLight(0xcde9ff,0x785356,2.35));
  const sun = new T.DirectionalLight(0xffd9aa,2.1);
  sun.position.set(4,10,8); scene.add(sun);
  const ortho = new T.OrthographicCamera();
  const home = new T.Vector3(0,0,0.1), anchor = home.clone(), look = home.clone();
  const offset = new T.Vector3(12,16,21);
  let zoom = false, currentZoom = 1, lastW = 0, lastH = 0;
  const block = new T.BoxGeometry(1,1,1), ball = new T.SphereGeometry(.5,9,7);
  const materials = new Map();
  const pickable = [];
  function mat(color, glow=0) {
    const k = color+':'+glow;
    if (!materials.has(k)) materials.set(k,new T.MeshStandardMaterial({color,emissive:glow?color:0,emissiveIntensity:glow,roughness:.85}));
    return materials.get(k);
  }
  function box(parent,x,y,z,w,h,d,c,g=0) {
    const b=new T.Mesh(block,mat(c,g)); b.scale.set(w,h,d); b.position.set(x,y,z); parent.add(b); return b;
  }
  function pick(mesh,zone,node) { mesh.userData={zone,node}; pickable.push(mesh); }
  function beacon(parent,x,y,z,r,c) {
    const m=new T.Mesh(ball,mat(c,.42)); m.position.set(x,y,z);m.scale.setScalar(r);parent.add(m);return m;
  }
  box(scene,0,-.66,0,17,.88,14,0x1f3950);
  box(scene,0,-.17,0,16.6,.20,13.6,0x264454);
  box(scene,0,-.04,.0,16.5,.04,1.3,0x172c3d);
  for(let i=0;i<14;i++) box(scene,-7.7+i*1.15,.003,0,.5,.018,.037,0x5e7b89);
  const strip = [];
  for(let i=0;i<17;i++) strip.push(box(scene,-6.9+i*.82,.02,-.44,.52,.025,.046,0x55d6de,.38));
  const venue = new T.Group(); venue.position.set(...targets.venue); scene.add(venue);
  pick(box(venue,0,.04,0,10,.18,5.2,0xb58163),'venue');
  for(let x=-4;x<=4;x++) for(let z=-2;z<=2;z++) if((x+z)%2===0) box(venue,x,.139,z,.97,.013,.94,0xd19d74);
  for(const side of [-1,1]) {
    for(let z=-1;z<=2;z++) {
      box(venue,side*4.8,.62,z,.25,1.2,.25,0xe5ac78);
      beacon(venue,side*4.8,1.28,z,.31,0xffb86a);
    }
    for(let x=1.9;x<4.9;x+=.75) {
      const arch = new T.Mesh(new T.TorusGeometry(.36,.10,5,12,Math.PI),mat(0xd19971)); arch.position.set(x*side,1.0,-2.21); venue.add(arch);
      box(venue,x*side-.33,.55,-2.21,.12,1.03,.27,0xd19971);
    }
  }
  pick(box(venue,0,.36,-1.2,3.9,.42,1.8,0x3b2d4f),'venue');
  box(venue,0,1.55,-1.98,4.35,2.35,.30,0x243358);
  const screen = box(venue,0,1.62,-1.80,3.67,1.55,.04,0x57efdb,.68);pick(screen,'venue');
  const bars = Array.from({length:9},(_,i)=>box(venue,(i-4)*.35,1.58,-1.75,.17,.55,.047,0xb6fff6,.65));
  for(const x of [-2.1,2.1]) box(venue,x,.84,-.76,.35,1,.42,0x19253a);
  const crowd = new T.InstancedMesh(ball,mat(0xffffff),54);
  const dummy = new T.Object3D(); const color = new T.Color();
  const people = Array.from({length:54},(_,i)=>[(i%9-4)*.65+Math.sin(i*9)*.11, -.07+Math.floor(i/9)*.34, i*.91]);
  people.forEach((_,i)=>crowd.setColorAt(i,color.setHex([0xffe1ad,0x6ae6db,0xf59cb6,0x9daff8][i%4]))); venue.add(crowd);
  const racks = POS.map(([x,y,z],i)=>{
    const group=new T.Group(); group.position.set(x,y,z); scene.add(group);
    pick(box(group,0,.12,0,2.25,.25,2.35,0x38546d),'data',i);
    pick(box(group,0,1.08,-.04,1.48,1.82,1.52,0x213554),'data',i);
    const panels=Array.from({length:5},(_,n)=>box(group,0,.42+n*.28,.74,1.14,.15,.045,0x58e6dd,.45));
    box(group,0,2.04,-.04,1.6,.14,1.61,0x5e789d);
    const signal=beacon(group,0,2.25,-.04,.38,0x58e6dd);
    const ring=new T.Mesh(new T.RingGeometry(.9,1.04,20),new T.MeshBasicMaterial({color:0xffd29b,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.255; group.add(ring);
    return {panels,signal,ring};
  });
  const ctrl = new T.Group(); ctrl.position.set(...targets.control); scene.add(ctrl);
  pick(box(ctrl,0,.14,0,3.25,.28,3.2,0x455574),'control');
  pick(box(ctrl,0,1,0,2.7,1.58,2.5,0x5b537a),'control');
  box(ctrl,0,1.86,0,2.92,.16,2.75,0xa47c9b);
  const ctrlLight=box(ctrl,0,1.15,1.27,2.29,.43,.06,0x69e5dc,.7);
  pick(ctrlLight,'control');
  const dish = new T.Mesh(new T.ConeGeometry(.68,.37,12),mat(0xd7b9da)); dish.rotation.x=1.0;dish.position.set(.55,2.38,-.15);ctrl.add(dish);
  box(ctrl,.55,2,-.15,.11,.52,.10,0x94afd6);
  for(let i=0;i<16;i++) {
    const x=(i%8-3.5)*2.05, z=-7.8-Math.floor(i/8)*2.2, h=.8+(i*13%17)/5;
    box(scene,x,h/2-.1,z,1.31,h,1.35,0x24395e);
    for(let j=0;j<4;j++) if(.42+j*.52<h) box(scene,x,.42+j*.52,z+.68,.72,.09,.032,0x6d90b8,.23);
  }
  const drone = new T.Group(); scene.add(drone);
  box(drone,0,0,0,.55,.21,.39,0xd3dcfa);
  for(const x of [-.42,.42]) for(const z of [-.30,.30]) {box(drone,x*.6,0,z*.6,.55,.07,.07,0x587489);beacon(drone,x,0,z,.28,0xf5bb67);}
  const shadow=new T.Mesh(new T.CircleGeometry(.45,12),new T.MeshBasicMaterial({color:0x111d31,transparent:true,opacity:.4}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.25;scene.add(shadow);
  // The opening links the concert screen to the first playable rack.
  const path = new T.CatmullRomCurve3([
    [-.87, 1.46, 1.47], [-1.63, 1.02, 1.62], [-2.44, .65, 1.58],
    [-3.72, .43, 1.12], [-4.65, .49, .28], [-4.7, 1.05, -2.02],
  ].map(point => new T.Vector3(...point)));
  const openingRoute = new T.Mesh(new T.TubeGeometry(path, 36, .092, 6, false),
    new T.MeshBasicMaterial({color: 0x68f5d4}));
  const firstPulse = new T.Mesh(ball, new T.MeshBasicMaterial({color: 0xffe0a3}));
  const signalSource = new T.Mesh(ball, new T.MeshBasicMaterial({color: 0xa7fff1}));
  signalSource.scale.setScalar(.44);
  signalSource.position.copy(path.getPointAt(0));
  firstPulse.scale.setScalar(.52);
  openingRoute.visible = firstPulse.visible = signalSource.visible = false;
  scene.add(openingRoute, signalSource, firstPulse);
  // Batch immovable boxes by material; leave raycast proxy geometry in place.
  const animated = new Set([screen,ctrlLight,...bars,...strip,...racks.flatMap(r=>r.panels)]);
  scene.updateMatrixWorld(true);
  const batches = new Map();
  scene.traverse(obj=>{
    if(!obj.isMesh||obj.geometry!==block||animated.has(obj)||obj.parent===drone)return;
    if(!batches.has(obj.material))batches.set(obj.material,[]);
    batches.get(obj.material).push(obj);
  });
  for(const [material,boxes] of batches){
    if(boxes.length<3)continue;
    const batch=new T.InstancedMesh(block,material,boxes.length);
    boxes.forEach((shape,i)=>{batch.setMatrixAt(i,shape.matrixWorld);shape.visible=false;});
    scene.add(batch);batch.computeBoundingSphere();
  }
  const ray = new T.Raycaster(), pointer = new T.Vector2();
  canvas.addEventListener('pointerup', e=>{
    if(e.button!==0)return;
    const r=canvas.getBoundingClientRect(); pointer.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);
    ray.setFromCamera(pointer,ortho);
    const hit=ray.intersectObjects(pickable,false)[0]; if(hit) select(hit.object.userData.zone,hit.object.userData.node);
  });
  let lost = false;
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;lastW=0;});
  return {
    focus(zone) { const p=targets[zone]; if(p) anchor.set(p[0]*.38,0,p[2]*.34); else anchor.copy(home); },
    zoom(value) { zoom=value; },
    render(s,selected,zone,seconds,anim,opening) {
      if(lost) return;
      const w=canvas.clientWidth,h=canvas.clientHeight;
      if(!w||!h)return;
      if(w!==lastW||h!==lastH){renderer.setSize(w,h,false);lastW=w;lastH=h;}
      look.lerp(anchor,reduced?1:.10);currentZoom+=(Number(zoom)*.24+1-currentZoom)*(reduced?1:.10);
      const a=w/h; const size=Math.max(7.7,9.2/a)/currentZoom;
      Object.assign(ortho,{left:-size*a,right:size*a,top:size,bottom:-size,near:.1,far:100});
      ortho.updateProjectionMatrix();ortho.position.copy(look).add(offset);ortho.lookAt(look);
      const running=s.quality!==0, backup=s.backup.active;
      screen.material=mat(!running?0x22213e:backup?0xffb970:s.quality<70?0xf6989c:0x59e8d4,.55);
      ctrlLight.material=mat(s.backup.arrive&&!backup?0xffc482:backup?0x68f5d4:0x72a5dd,.53);
      bars.forEach((b,i)=>{b.visible=running;b.scale.y=.22+Math.abs(Math.sin(anim*3+i*.76))*.84;});
      strip.forEach((b,i)=>b.material=mat(!running?0x6e5162:((Math.floor(anim*9)+i)%5===0?0xa0fff2:0x3b9caa),.35));
      racks.forEach((r,i)=>{
        const n=s.nodes[i], c=n.offline?0xcc7285:n.heat>=72?0xffb66d:n.work?0x82aafa:0x5de9d0;
        r.panels.forEach(p=>p.material=mat(c,.4));r.signal.material=mat(c,.65);r.ring.visible=zone==='data'&&i===selected;
      });
      for(let i=0;i<people.length;i++){
        const [x,z,phase]=people[i]; dummy.position.set(x,.36+(running?Math.max(0,Math.sin(anim*3+phase))*.12:0),z);
        dummy.scale.set(.21,.47,.21);dummy.rotation.y=phase;dummy.updateMatrix();crowd.setMatrixAt(i,dummy.matrix);
      }
      crowd.instanceMatrix.needsUpdate=true;
      const target=s.drone.target;
      if(target>=0){
        const portion=Math.max(0,Math.min(1,(seconds-(s.drone.arrive-5))/5));
        const [x,,z]=POS[target], t=portion*portion*(3-2*portion);
        drone.position.set(5.7+(x-5.7)*t,2+Math.sin(t*Math.PI)*2.45,-2.2+(z+2.2)*t);
        drone.rotation.y=-t;
      } else {drone.position.set(6.4,2.23,-.9);drone.rotation.y=0;}
      shadow.position.x=drone.position.x;shadow.position.z=drone.position.z;
      openingRoute.visible = signalSource.visible = Boolean(opening);
      firstPulse.visible = Boolean(opening && s.nodes[0].packet && seconds <= 3);
      if (firstPulse.visible) path.getPointAt(reduced ? .55 : Math.min(1, seconds / 3), firstPulse.position);
      renderer.render(scene,ortho);
    }
  };
}
