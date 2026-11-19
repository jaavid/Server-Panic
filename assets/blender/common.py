"""Reusable deterministic Blender scene helpers for Server Panic original art.
Run from Blender's bundled Python. Works with Blender 3.6+ / 4.x.
"""
import bpy, math
from mathutils import Vector

def reset_scene(resolution=(240,310), orbit=(5.6,-8.3,7.1), target=(0,0,1.2), ortho=5.2):
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for material in list(bpy.data.materials):
        if material.users == 0: bpy.data.materials.remove(material)
    scene=bpy.context.scene
    scene.render.engine='CYCLES'  # deterministic cross-version material support
    scene.cycles.samples=24
    scene.render.resolution_x,scene.render.resolution_y=resolution
    scene.render.resolution_percentage=100
    scene.render.image_settings.file_format='PNG'
    scene.render.image_settings.color_mode='RGBA'
    scene.render.film_transparent=True
    scene.render.image_settings.color_depth='8'
    scene.view_settings.view_transform='Standard'
    scene.view_settings.look='Medium High Contrast'
    scene.render.filepath=''
    world=bpy.data.worlds.new('ServerPanic Studio World')
    scene.world=world
    world.use_nodes=True
    world.node_tree.nodes.get('Background').inputs['Color'].default_value=(.13,.19,.28,1)
    world.node_tree.nodes.get('Background').inputs['Strength'].default_value=.8
    camera_data=bpy.data.cameras.new('Iso Orthographic 35°')
    camera=bpy.data.objects.new('Iso Orthographic 35°',camera_data)
    scene.collection.objects.link(camera)
    camera.location=orbit
    direction=Vector(target)-camera.location
    camera.rotation_euler=direction.to_track_quat('-Z','Y').to_euler()
    camera_data.type='ORTHO'
    camera_data.ortho_scale=ortho
    scene.camera=camera
    light('Softbox Key',(1,-4,8),580,(1,.94,.84),size=6)
    light('Cyan Rim',(-4,3,5),520,(.25,.85,1),size=4)
    light('Purple Bounce',(5,3,3),330,(.56,.40,1),size=4)
    return scene

def light(name,where,power,color,size=4):
    data=bpy.data.lights.new(name,'AREA')
    data.energy=power;data.color=color;data.shape='DISK';data.size=size
    obj=bpy.data.objects.new(name,data)
    bpy.context.collection.objects.link(obj);obj.location=where
    obj.rotation_euler=(Vector((0,0,1))-obj.location).to_track_quat('-Z','Y').to_euler()
    return obj

def mat(name,rgba,metallic=0,roughness=.38,emission=0):
    material=bpy.data.materials.new(name)
    material.diffuse_color=(*rgba[:3],rgba[3] if len(rgba)>3 else 1)
    material.use_nodes=True
    bsdf=material.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value=material.diffuse_color
    bsdf.inputs['Metallic'].default_value=metallic
    bsdf.inputs['Roughness'].default_value=roughness
    if emission:
        bsdf.inputs['Emission Color'].default_value=(*rgba[:3],1)
        bsdf.inputs['Emission Strength'].default_value=emission
    return material

def cube(name,where,scale,material,bevel=.075):
    bpy.ops.mesh.primitive_cube_add(size=1,location=where)
    obj=bpy.context.object;obj.name=name
    obj.dimensions=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        modifier=obj.modifiers.new('Soft machined edges','BEVEL')
        modifier.width=bevel;modifier.segments=3
        if hasattr(modifier, 'affect'): modifier.affect='EDGES'
        modifier2=obj.modifiers.new('Smooth corners','WEIGHTED_NORMAL')
    obj.data.materials.append(material)
    return obj

def sphere(name,where,radius,material,segments=24,rings=12):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=radius,location=where)
    obj=bpy.context.object;obj.name=name;obj.data.materials.append(material)
    for poly in obj.data.polygons: poly.use_smooth=True
    return obj

def cylinder(name,where,radius,depth,material,vertices=32,rotation=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=radius,depth=depth,location=where)
    obj=bpy.context.object;obj.name=name;obj.data.materials.append(material)
    if rotation is not None:obj.rotation_euler=rotation
    bevel=obj.modifiers.new('Soft edges','BEVEL');bevel.width=.025;bevel.segments=2
    return obj

def make_palette(variant,state):
    accents=[(.08,.78,.92,1),(.99,.67,.24,1),(.56,.42,.99,1)]
    base=accents[variant]
    if state=='offline': base=(.20,.27,.35,1)
    elif state=='critical':base=(1,.13,.29,1)
    elif state=='overheating':base=(1,.42,.16,1)
    elif state=='recovery':base=(.33,1,.70,1)
    return {
      'body':mat('Porcelain midnight blue',(.075,.14,.24,1),.43,.34),
      'side':mat('Ceramic side',(.14,.23,.36,1),.35,.36),
      'face':mat('Face glass',(.02,.045,.085,1),.25,.12),
      'vent':mat('Vent graphite',(.025,.06,.12,1),.25,.55),
      'accent':mat('LED accent',base,.18,.22,3 if state!='offline' else .08),
      'white':mat('Trim alloy',(.45,.64,.78,1),.65,.32),
      'warning':mat('Warning amber',(1,.68,.17,1),.25,.26,2),
    }
