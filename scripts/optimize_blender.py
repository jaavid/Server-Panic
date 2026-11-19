#!/usr/bin/env python3
"""Export optimized WebP alongside Blender-rendered transparent PNGs."""
from pathlib import Path
from PIL import Image
root=Path(__file__).resolve().parents[1]/'public/assets'
for png in root.glob('*.png'):
    if png.stem.endswith('atlas'): continue
    Image.open(png).convert('RGBA').save(png.with_suffix('.webp'),'WEBP',quality=88,method=6)
print('WebP ready for',len(list(root.glob('*.webp'))),'sprites')
