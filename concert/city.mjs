import * as T from './vendor/three.module.min.js';
const POS = [[-4.7,0,-2.8],[-1.8,0,-3.2],[1.1,0,-3.6]];
const targets = { venue:[1,0,3.2], data:[-2,0,-2.6], control:[5.7,0,-2.2] };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
export function city(canvas, markers, select) {
  let renderer;
  const stage = canvas.parentElement;
  canvas.dataset.art = 'fallback';
  function flatMap() {
    stage.dataset.flat = '';
    for (const marker of markers) {
      marker.style.removeProperty('--x');
      marker.style.removeProperty('--y');
    }
  }
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias:true, powerPreference:'low-power' });
  } catch {
    const note = document.createElement('p');
    note.className = 'fallback';
    note.textContent = 'نقشهٔ ساده فعال است. مقصد را روی دکمه‌های نقشه انتخاب کن.';
    canvas.after(note);
    flatMap();
    return { render() {} };
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.10;
  const scene = new T.Scene();
  scene.background = new T.Color(0x0b182c);
  scene.fog = new T.FogExp2(0x0b182c,.021);
  scene.add(new T.HemisphereLight(0xb9d9ff,0x6f4a46,2.50));
  const sun = new T.DirectionalLight(0xffd5a1,2.0);
  sun.position.set(4,10,8); scene.add(sun);
  const rim = new T.DirectionalLight(0x9fd0ff,.85);
  rim.position.set(-5,8,-8); scene.add(rim);
  const ortho = new T.OrthographicCamera();
  const look = new T.Vector3(), offset = new T.Vector3();
  let lastW = 0, lastH = 0;
  const markerPositions = {
    venue: [1, .52, 4.95],
    control: [5.7, 2.85, -2.2],
    rack0: [-4.7, 3.03, -2.8],
    rack1: [-1.8, 3.33, -3.2],
    rack2: [1.1, 3.03, -3.6],
  };
  const screenPoint = new T.Vector3();
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
    const markers = new T.Group();
    markers.position.copy(group.position);
    markers.add(ring, signal);
    scene.add(markers);
    return {group, panels, signal, ring};
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
  const drone = new T.Group(), droneShell = new T.Group();
  scene.add(drone);
  drone.add(droneShell);
  box(droneShell,0,0,0,.55,.21,.39,0xd3dcfa);
  for(const x of [-.42,.42]) for(const z of [-.30,.30]) {box(droneShell,x*.6,0,z*.6,.55,.07,.07,0x587489);beacon(droneShell,x,0,z,.28,0xf5bb67);}
  const shadow=new T.Mesh(new T.CircleGeometry(.45,12),new T.MeshBasicMaterial({color:0x111d31,transparent:true,opacity:.4}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.25;scene.add(shadow);
  // Project lightweight map controls over the same geometry used for ray picking.
  const paths = POS.map(([x, , z]) => new T.CatmullRomCurve3([
    [-.87, 1.46, 1.47], [-1.63, 1.02, 1.62],
    [x * .67 - .25, .43, .85], [x, .46, .22], [x, 1.05, z + .78],
  ].map(point => new T.Vector3(...point))));
  const wires = paths.map(path => {
    const wire = new T.Mesh(new T.TubeGeometry(path, 36, .075, 6, false),
      new T.MeshBasicMaterial({color: 0x89ffd8, transparent: true}));
    wire.visible = false;
    scene.add(wire);
    return wire;
  });
  const pulse = new T.Mesh(ball, new T.MeshBasicMaterial({color: 0xffe4a9}));
  pulse.scale.setScalar(.51);
  pulse.visible = false;
  scene.add(pulse);
  // Batch immovable boxes by material; leave raycast proxy geometry in place.
  const animated = new Set([screen,ctrlLight,...bars,...strip,...racks.flatMap(r=>r.panels)]);
  scene.updateMatrixWorld(true);
  const substitutes = [venue, ctrl, ...racks.map(rack => rack.group)];
  const substituteBatches = new T.Group();
  scene.add(substituteBatches);
  for (const [source, target] of [[scene, scene], ...substitutes.map(group => [group, substituteBatches])]) {
    const batches = new Map();
    for (const object of source.children) {
      if (!object.isMesh || object.geometry !== block || animated.has(object)) continue;
      if (!batches.has(object.material)) batches.set(object.material, []);
      batches.get(object.material).push(object);
    }
    for (const [material, boxes] of batches) {
      if (boxes.length < 3) continue;
      const batch = new T.InstancedMesh(block, material, boxes.length);
      boxes.forEach((object, index) => { batch.setMatrixAt(index, object.matrixWorld); object.visible = false; });
      target.add(batch);
      batch.computeBoundingSphere();
    }
  }

  let rich = null;
  const heroFiles = ['courtyard', 'audience', 'Node_Edge', 'Node_Origin', 'Node_Reserve', 'control', 'Drone_Pik'];
  const configured = document.documentElement.dataset.cityArt;
  if (configured && new URLSearchParams(location.search).get('art') !== 'off') {
    const base = new URL(configured, location.href);
    if (base.origin === location.origin) loadArt(base);
  }

  async function loadArt(base) {
    canvas.dataset.art = 'loading';
    const controller = new AbortController();
    let timer;
    const deadline = new Promise((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new Error('timeout'));
      }, 3200);
    });
    try {
      const assets = await Promise.race([prepareArt(base, controller.signal), deadline]);
      scene.add(assets.venue, assets.control, ...assets.stations);
      drone.add(assets.drone);
      for (const substitute of [...substitutes, substituteBatches, droneShell]) substitute.visible = false;
      rich = assets;
      canvas.dataset.art = 'blender';
      canvas.dataset.models = heroFiles.join(',');
    } catch (error) {
      controller.abort();
      canvas.dataset.art = 'fallback';
      canvas.dataset.artFailure = error.message === 'timeout' ? 'timeout' : 'invalid-or-missing';
    } finally {
      clearTimeout(timer);
    }
  }

  async function prepareArt(base, signal) {
    const {GLTFLoader} = await import(new URL('loaders/GLTFLoader.js', base).href);
    const loader = new GLTFLoader();
    const models = await Promise.all(heroFiles.map(async name => {
      const response = await fetch(new URL(name + '.glb', base), {mode: 'same-origin', signal});
      if (!response.ok) throw new Error('asset response');
      const blob = await response.arrayBuffer();
      const bytes = new DataView(blob);
      if (blob.byteLength < 24 || bytes.getUint32(0,true) !== 0x46546c67 ||
          bytes.getUint32(4,true) !== 2 || bytes.getUint32(8,true) !== blob.byteLength ||
          bytes.getUint32(16,true) !== 0x4e4f534a || bytes.getUint32(12,true) > blob.byteLength - 20) {
        throw new Error('invalid GLB');
      }
      const header = JSON.parse(new TextDecoder().decode(new Uint8Array(blob,20,bytes.getUint32(12,true))));
      if ((header.buffers ?? []).some(item => item.uri) || (header.images ?? []).some(item => item.uri)) {
        throw new Error('non-embedded GLB dependency');
      }
      const {scene: model} = await loader.parseAsync(blob, '');
      if (new T.Box3().setFromObject(model).isEmpty()) throw new Error('empty GLB');
      return model;
    }));
    const [venue, audience, edge, origin, reserve, control, flight] = models;
    const screenMeshes = [];
    const oldAudience = venue.getObjectByName('Audience');
    const display = venue.getObjectByName('Broadcast_Display');
    venue.getObjectByName('Venue_Stage')?.traverse(object => {
      if (object.isMesh && object.material.name === 'Screen') screenMeshes.push(object);
    });
    if (!oldAudience || !display || !screenMeshes.length || !audience.getObjectByName('Game_Audience') ||
        !venue.getObjectByName('Courtyard_Arcades') || !control.getObjectByName('Game_Control')) throw new Error('asset anchors');
    oldAudience.visible = false;
    venue.add(audience);
    venue.position.set(targets.venue[0], -.05, targets.venue[2]);
    venue.scale.set(1.13, 1, .76);
    const stations = [edge, origin, reserve].map((model, id) => fit(model, POS[id], [2.12, 2.30, 2.10]));
    const stationLights = stations.map(model => signalMeshes(model));
    if (stationLights.some(lights => !lights.length)) throw new Error('station lights');
    fit(control, targets.control, [3.1, 2.05, 2.85]);
    const controlSignals = signalMeshes(control);
    const controlPalette = {CeramicBlue: 0x416781, Alloy: 0x607d91, DarkPanel: 0x23364b,
      Roof: 0x2d4c61, Ink: 0x172337, Porcelain: 0x9aaab5};
    control.traverse(object => {
      if (object.isMesh && Object.hasOwn(controlPalette, object.material.name)) {
        object.material = mat(controlPalette[object.material.name]);
      }
    });
    fit(flight, [0, -.18, 0], [1.12, .58, .92]);
    return {venue, audience, display, screenMeshes, stations, stationLights, control, controlSignals, drone: flight};
  }

  function signalMeshes(model) {
    const lamps = [];
    model.traverse(object => {
      if (object.isMesh && object.material.name === 'Signal') lamps.push(object);
    });
    return lamps;
  }

  function fit(model, position, limits) {
    const bounds = new T.Box3().setFromObject(model);
    const size = bounds.getSize(new T.Vector3());
    const center = bounds.getCenter(new T.Vector3());
    const scale = Math.min(limits[0]/size.x, limits[1]/size.y, limits[2]/size.z);
    if (!(scale > 0 && Number.isFinite(scale))) throw new Error('asset bounds');
    model.scale.setScalar(scale);
    model.position.set(position[0]-center.x*scale, position[1]-bounds.min.y*scale, position[2]-center.z*scale);
    return model;
  }
  const ray = new T.Raycaster(), pointer = new T.Vector2();
  canvas.addEventListener('pointerup', e=>{
    if(e.button!==0)return;
    const r=canvas.getBoundingClientRect(); pointer.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1);
    ray.setFromCamera(pointer,ortho);
    const hit=ray.intersectObjects(pickable,false)[0]; if(hit) select(hit.object.userData.zone,hit.object.userData.node);
  });
  let lost = false;
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;flatMap();});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;lastW=0;delete stage.dataset.flat;});
  return {
    render(s, selected, seconds, anim, route, practice) {
      if (lost) return;
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      if (w !== lastW || h !== lastH) {
        renderer.setSize(w, h, false);
        lastW = w;
        lastH = h;
        const aspect = w / h, portrait = aspect < 1;
        look.set(portrait ? .35 : 0, 0, portrait ? -.65 : -.80);
        offset.set(portrait ? 6 : 12, portrait ? 27 : 16, portrait ? 22 : 21);
        const size = Math.max(portrait ? 8.4 : 7.55, (portrait ? 7.2 : 9.2) / aspect);
        Object.assign(ortho, {left: -size * aspect, right: size * aspect, top: size, bottom: -size, near: .1, far: 100});
        ortho.updateProjectionMatrix();
        ortho.position.copy(look).add(offset);
        ortho.lookAt(look);
        ortho.updateMatrixWorld(true);
        for (const marker of markers) {
          screenPoint.set(...markerPositions[marker.dataset.mark]).project(ortho);
          const x = Math.max(50, Math.min(w - 50, (screenPoint.x + 1) * w / 2));
          let y = (1 - screenPoint.y) * h / 2;
          if (portrait && marker.dataset.mark === 'rack1') y -= 31;
          marker.style.setProperty('--x', x.toFixed(1) + 'px');
          marker.style.setProperty('--y', Math.max(100, Math.min(h - 145, y)).toFixed(1) + 'px');
        }
      }
      if (reduced) anim = 0;
      const running=s.quality!==0, backup=s.backup.active;
      screen.material=mat(!running?0x22213e:backup?0xffb970:s.quality<70?0xf6989c:0x59e8d4,.55);
      ctrlLight.material=mat(s.backup.arrive&&!backup?0xffc482:backup?0x68f5d4:0x72a5dd,.53);
      bars.forEach((b,i)=>{b.visible=running;b.scale.y=.22+Math.abs(Math.sin(anim*3+i*.76))*.84;});
      strip.forEach(b=>b.material=mat(!running?0x6e5162:0x3b9caa,.35));
      racks.forEach((r,i)=>{
        const n=s.nodes[i], c=n.offline?0xf56982:n.heat>=72?0xffa952:n.work?0x84acff:0x59edca;
        r.panels.forEach(p=>p.material=mat(c,.4));
        r.signal.material=mat(c,.65);
        r.ring.visible=i===selected;
        if (rich) for (const lamp of rich.stationLights[i]) lamp.material = mat(c,.72);
      });
      if (rich) {
        rich.display.visible = running;
        for (const panel of rich.screenMeshes) panel.material = screen.material;
        for (const lamp of rich.controlSignals) lamp.material = ctrlLight.material;
      }
      for(let i=0;i<people.length;i++){
        const [x,z,phase]=people[i]; dummy.position.set(x,.36+(running?Math.max(0,Math.sin(anim*3+phase))*.12:0),z);
        dummy.scale.set(.21,.47,.21);dummy.rotation.y=phase;dummy.updateMatrix();crowd.setMatrixAt(i,dummy.matrix);
      }
      crowd.instanceMatrix.needsUpdate=true;
      const target=s.drone.target;
      if(target>=0){
        const portion=Math.max(0,Math.min(1,(seconds-(s.drone.arrive-5))/5));
        const [x,,z]=POS[target], t=portion*portion*(3-2*portion);
        const flight = reduced ? .50 : t;
        drone.position.set(5.7+(x-5.7)*flight,2+Math.sin(flight*Math.PI)*2.45,-2.2+(z+2.2)*flight);
        drone.rotation.y=-t;
      } else {drone.position.set(6.4,2.23,-.9);drone.rotation.y=0;}
      shadow.position.x=drone.position.x;shadow.position.z=drone.position.z;
      const inTransit = route && seconds - route.start < route.duration + 1;
      for (const [id, wire] of wires.entries()) {
        wire.visible = (practice && id !== 1) || Boolean(inTransit && id === route.id);
        wire.material.opacity = practice ? .55 : .95;
      }
      pulse.visible = Boolean(inTransit && seconds - route.start < route.duration);
      if (pulse.visible) paths[route.id].getPointAt(reduced ? .62 :
        Math.min(1, Math.max(0, (seconds - route.start) / route.duration)), pulse.position);
      renderer.render(scene,ortho);
      if (canvas.dataset.drawCalls !== String(renderer.info.render.calls)) {
        canvas.dataset.drawCalls = renderer.info.render.calls;
        canvas.dataset.triangles = renderer.info.render.triangles;
      }
    }
  };
}
