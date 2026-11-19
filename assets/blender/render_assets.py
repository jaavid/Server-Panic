"""Blender CLI exporter; builds editable .blend files and transparent sprite frames.
blender --background --python assets/blender/render_assets.py -- --out public/assets --source assets/generated
"""
from pathlib import Path
import sys, argparse, math
import bpy
BASE=Path(__file__).resolve().parent
sys.path.insert(0,str(BASE.parent))
from blender.common import reset_scene
from blender.generate_servers import create_server
from blender.generate_drone import create_drone
from blender.generate_environment import create_environment

def parse():
    args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
    p=argparse.ArgumentParser();p.add_argument('--out',type=Path,required=True);p.add_argument('--source',type=Path,required=True)
    return p.parse_args(args)

def render(scene,out,path):
    scene.render.filepath=str(out/path)
    bpy.ops.render.render(write_still=True)
    print('[server-panic] rendered',path,flush=True)

def main():
    opts=parse();opts.out.mkdir(parents=True,exist_ok=True);opts.source.mkdir(parents=True,exist_ok=True)
    for variant in range(3):
        for state in ('idle','processing','overheating','critical','offline','recovery'):
            scene=reset_scene((240,310),target=(0,0,1.35),ortho=4.9)
            create_server(variant,state)
            if state=='idle':bpy.ops.wm.save_as_mainfile(filepath=str(opts.source/f'server-{variant}.blend'))
            render(scene,opts.out,f'rack-{variant}-{state}.png')
    for mode in ('hover','repair'):
        for frame in range(8):
            scene=reset_scene((200,190),target=(0,0,1.3),ortho=3.6)
            create_drone(frame,mode)
            if mode=='hover' and frame==0:
                bpy.ops.wm.save_as_mainfile(filepath=str(opts.source/'drone.blend'))
                render(scene,opts.out,'drone.png')
            render(scene,opts.out,f'drone-{mode}-{frame}.png')
    scene=reset_scene((840,920),orbit=(9,-13,13),target=(0,0,0),ortho=11.9)
    create_environment()
    bpy.ops.wm.save_as_mainfile(filepath=str(opts.source/'environment.blend'))
    render(scene,opts.out,'floor.png')
if __name__=='__main__':main()
