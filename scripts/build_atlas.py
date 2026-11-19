#!/usr/bin/env python3
"""Pack deterministic WebP sprites to a transparent PNG atlas plus JSON frames."""
from pathlib import Path
import json, math
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]
FILES = sorted(f for f in (ROOT/'public/assets').glob('rack-*.png')) + sorted(f for f in (ROOT/'public/assets').glob('drone*.png'))
COLS=5; CELL_W=240; CELL_H=320
atlas = Image.new('RGBA',(COLS*CELL_W, math.ceil(len(FILES)/COLS)*CELL_H),(0,0,0,0))
frames={}
for n,fn in enumerate(FILES):
    im=Image.open(fn).convert('RGBA')
    x=(n%COLS)*CELL_W; y=(n//COLS)*CELL_H
    atlas.alpha_composite(im,(x,y))
    frames[fn.stem]={'frame':{'x':x,'y':y,'w':im.width,'h':im.height},'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':im.width,'h':im.height},'sourceSize':{'w':im.width,'h':im.height}}
atlas.save(ROOT/'public/assets/characters-atlas.png', optimize=True)
(ROOT/'public/assets/characters-atlas.json').write_text(json.dumps({'frames':frames,'meta':{'image':'characters-atlas.png','size':{'w':atlas.width,'h':atlas.height},'scale':'1'}},indent=2))
print('Atlas',atlas.size,'frames:',len(frames))
