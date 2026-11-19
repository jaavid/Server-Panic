#!/usr/bin/env python3
"""Deterministic self-contained procedural SVG -> transparent WebP/PNG art pipeline.
The output is original 2.5D illustrated artwork, NOT Blender-rendered 3D.
"""
from pathlib import Path
import cairosvg
from PIL import Image
from io import BytesIO
import json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT/'public/assets'
SOURCE = ROOT/'assets/source'
OUT.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)

PAL = [('#30D9E8','#14769D','#122D4D'),('#FFC857','#B76B4F','#30284B'),('#9475FF','#594AB2','#252048')]
STATUSES = ['idle','processing','overheating','critical','offline','recovery']

def save(svg, name, size=None):
    (SOURCE/f'{name}.svg').write_text(svg, encoding='utf-8')
    rendered = cairosvg.svg2png(bytestring=svg.encode(), output_width=size[0] if size else None, output_height=size[1] if size else None)
    im=Image.open(BytesIO(rendered)).convert('RGBA')
    im.save(OUT/f'{name}.png', optimize=True)
    im.save(OUT/f'{name}.webp', 'WEBP', quality=86, method=2)
    return im

def rack(idx, state):
    glow, side, dark = PAL[idx]
    offline = state == 'offline'
    hot = state in ('overheating','critical')
    critical = state == 'critical'
    busy = state == 'processing'
    recovery = state == 'recovery'
    primary = '#FF4D6D' if critical else ('#FF8757' if hot else ('#586879' if offline else ('#67E6B5' if recovery else glow)))
    eye = '#748298' if offline else primary
    if recovery:
        eyes = f'<path d="M94 126 q9 -9 18 0 M130 126 q9 -9 18 0" stroke="{eye}" stroke-width="7" fill="none" stroke-linecap="round"/>'
    elif critical:
        eyes = f'<path d="M91 126 l23 6 M131 132 l23 -6" stroke="{eye}" stroke-width="6" stroke-linecap="round"/>'
    elif offline:
        eyes = f'<path d="M93 126 h19 M133 126 h19" stroke="{eye}" stroke-width="5" stroke-linecap="round"/>'
    else:
        eyes = f'<rect x="94" y="120" width="15" height="15" rx="6" fill="{eye}"/><rect x="135" y="120" width="15" height="15" rx="6" fill="{eye}"/>'

    mouth = '<path d="M115 150 q10 9 20 0" stroke="#8BA9C0" stroke-width="3" fill="none" stroke-linecap="round"/>' if offline else ('<path d="M115 151 l7 -6 7 6 7 -6" stroke="#FF8EA2" fill="none" stroke-width="3" stroke-linejoin="round"/>' if hot else '<path d="M112 149 q10 10 23 0" fill="none" stroke="#92F6D8" stroke-width="3" stroke-linecap="round"/>')
    vents = ''.join(f'<rect x="76" y="{180+y*20}" width="88" height="7" rx="3" fill="#0B1626" stroke="#435571" stroke-width="1"/><rect x="81" y="{182+y*20}" width="{38+(idx%3)*9}" height="3" rx="1.5" fill="{primary}" opacity="{0.37 if offline else 0.75}"/>' for y in range(3))
    personality = ['<circle cx="76" cy="87" r="11" fill="#102A40" stroke="#30D9E8" stroke-width="4"/><path d="M76 82 v10 M71 87 h10" stroke="#30D9E8" stroke-width="2"/>',
       '<path d="M92 66 l-10 -19 h18 l10 18" fill="#FFC857" stroke="#FFE6AC" stroke-width="2"/><circle cx="91" cy="49" r="4" fill="#FFF0CF"/>',
       '<path d="M160 78 l14 -20 8 12 -10 16" fill="#9475FF" stroke="#D2C4FF" stroke-width="2"/>'][idx]
    heatfx = ''.join(f'<path d="M{77+j*32} 64 q-12 -16 0 -30 q9 -10 1 -22" stroke="{primary}" opacity="{0.55+j*.15}" stroke-width="4" fill="none" stroke-linecap="round"/>' for j in range(3)) if hot else ''
    bars = ''.join(f'<rect x="{76+j*19}" y="94" width="11" height="5" rx="2" fill="{primary}" opacity="{0.3 + j*0.2}"/>' for j in range(5))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="240" height="310" viewBox="0 0 240 310">
    <defs><linearGradient id="front" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#3C506E"/><stop offset=".50" stop-color="{dark}"/><stop offset="1" stop-color="#101827"/></linearGradient>
      <linearGradient id="side" x1="0" y1="0" x2="1" y2=".9"><stop stop-color="{side}"/><stop offset="1" stop-color="#17263E"/></linearGradient>
      <linearGradient id="top" x1="0" x2=".7" y1="0" y2="1"><stop stop-color="#7388A5"/><stop offset="1" stop-color="#344969"/></linearGradient>
      <filter id="light"><feGaussianBlur stdDeviation="6"/></filter></defs>
    <ellipse cx="126" cy="285" rx="82" ry="13" fill="#000" opacity=".25"/>
    <path d="M167 53 L190 70 Q198 74 198 88 L198 247 Q198 259 187 265 L169 273 Z" fill="url(#side)" stroke="#53647C" stroke-width="2"/>
    <path d="M47 70 Q47 58 60 56 L166 48 Q176 48 176 65 L176 261 Q176 274 163 275 L60 275 Q47 275 47 261 Z" fill="url(#front)" stroke="#6A7B98" stroke-width="3"/>
    <path d="M49 69 Q49 55 62 54 L158 43 Q173 41 188 59 L194 70 L174 81 L60 91 Z" fill="url(#top)" stroke="#8DA0BA" stroke-width="2"/>
    <path d="M64 96 L159 86 Q168 86 168 99 L168 168 Q168 178 159 180 L74 185 Q64 185 64 173 Z" fill="#101B2D" stroke="{primary}" stroke-opacity=".53" stroke-width="2"/>
    <path d="M71 106 l87 -8" stroke="{primary}" opacity=".34" stroke-width="2"/>
    {personality}
    <ellipse cx="119" cy="132" rx="46" ry="24" fill="{primary}" opacity=".08" filter="url(#light)"/>
    {bars}{eyes}{mouth}
    <rect x="70" y="177" width="99" height="72" rx="10" fill="#27354A" stroke="#52627B" stroke-width="2"/>
    {vents}
    <rect x="73" y="257" width="88" height="6" rx="3" fill="{primary}" opacity=".8"/>
    <circle cx="164" cy="68" r="6" fill="{primary}"/><circle cx="164" cy="68" r="12" fill="{primary}" opacity=".15"/>
    <path d="M58 100 L58 248" stroke="#9AB4D0" stroke-width="3" stroke-linecap="round" opacity=".25"/>
    {heatfx}
    <path d="M62 274 v8 h29 v-8 M147 274 v8 h25 v-8" fill="#1C2637" stroke="#415570" stroke-width="2"/>
    </svg>'''

for i in range(3):
    for s in STATUSES:
        save(rack(i,s), f'rack-{i}-{s}')

drone = '''<svg xmlns="http://www.w3.org/2000/svg" width="200" height="190" viewBox="0 0 200 190">
<defs><linearGradient id="b" x2=".7" y2="1"><stop stop-color="#B9F4FF"/><stop offset=".4" stop-color="#63C9E8"/><stop offset="1" stop-color="#30557C"/></linearGradient><filter id="g"><feGaussianBlur stdDeviation="7"/></filter></defs>
<ellipse cx="99" cy="158" rx="54" ry="10" fill="#30D9E8" opacity=".30" filter="url(#g)"/>
<path d="M47 83 L24 74 L17 86 L34 98 L51 102" fill="#4D7095" stroke="#9CB6DA" stroke-width="3"/>
<path d="M151 83 L175 74 L183 86 L165 98 L148 102" fill="#4D7095" stroke="#9CB6DA" stroke-width="3"/>
<circle cx="19" cy="82" r="12" fill="#1B3857" stroke="#30D9E8" stroke-width="5"/><circle cx="182" cy="82" r="12" fill="#1B3857" stroke="#30D9E8" stroke-width="5"/>
<path d="M56 60 Q66 43 96 40 Q142 34 153 66 L157 111 Q148 133 104 137 Q55 136 45 112 Z" fill="url(#b)" stroke="#C9F9FF" stroke-width="4"/>
<rect x="57" y="66" width="91" height="52" rx="23" fill="#12243C" stroke="#386C8F" stroke-width="2"/>
<rect x="75" y="83" width="16" height="15" rx="7" fill="#30D9E8"/><rect x="114" y="83" width="16" height="15" rx="7" fill="#30D9E8"/>
<path d="M93 104 Q102 111 113 104" stroke="#67E6B5" stroke-width="3" fill="none" stroke-linecap="round"/>
<rect x="88" y="24" width="21" height="20" rx="8" fill="#447A9F"/><circle cx="98" cy="21" r="8" fill="#FFC857" stroke="#F4E5A5" stroke-width="3"/>
<path d="M65 130 L57 147 M138 129 L146 146" stroke="#A8CDE3" stroke-width="8" stroke-linecap="round"/>
<path d="M82 142 h40" stroke="#67E6B5" stroke-width="5" stroke-linecap="round" opacity=".65"/>
</svg>'''
save(drone,'drone')

# Eight deterministic hover and repair frames; maintained as editable sources in SVG.
for mode in ('hover','repair'):
    for frame in range(8):
        oscillation = [-2,-4,-5,-4,-2,0,1,0][frame]
        beam = (f'<path d="M72 139 L58 187 L143 187 L127 139 Z" fill="#67E6B5" opacity=".18"/><path d="M80 146 v34 M120 146 v34" stroke="#A6FFF0" stroke-width="3" stroke-dasharray="5 5" opacity=".6"/>' if mode=='repair' else '')
        current=drone.replace('<ellipse cx="99" cy="158"', f'{beam}<g transform="translate(0 {oscillation})"><ellipse cx="99" cy="158"').replace('</svg>','</g></svg>')
        save(current,f'drone-{mode}-{frame}')

# Wide vector diorama scene: original perspective floor, conduits, cores and tiny decorative props.
floor = ['''<svg xmlns="http://www.w3.org/2000/svg" width="840" height="920" viewBox="0 0 840 920">
<defs><linearGradient id="deck" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#283D59"/><stop offset="1" stop-color="#15263D"/></linearGradient><linearGradient id="edge" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#172D49"/><stop offset="1" stop-color="#091625"/></linearGradient><filter id="glow"><feGaussianBlur stdDeviation="17"/></filter></defs>
<ellipse cx="416" cy="700" rx="362" ry="100" fill="#30D9E8" opacity=".085" filter="url(#glow)"/>
<path d="M39 508 L406 287 L805 503 L806 598 L417 830 L38 610 Z" fill="url(#edge)" stroke="#2E5370" stroke-width="5"/>
<path d="M39 504 L403 279 L805 501 L420 731 Z" fill="url(#deck)" stroke="#6D8BAB" stroke-width="4"/>
<path d="M52 505 L405 297 L785 502 L419 711 Z" fill="none" stroke="#30D9E8" stroke-opacity=".30" stroke-width="4"/>''']
for j in range(1,7):
    # grid lines between opposite edges on diamond
    t=j/7
    x1=39+(403-39)*t; y1=504+(279-504)*t
    x2=420+(805-420)*t; y2=731+(501-731)*t
    floor.append(f'<path d="M{x1:.1f} {y1:.1f} L{x2:.1f} {y2:.1f}" stroke="#57718B" stroke-opacity=".17" stroke-width="2"/>')
    x1=39+(420-39)*t; y1=504+(731-504)*t
    x2=403+(805-403)*t; y2=279+(501-279)*t
    floor.append(f'<path d="M{x1:.1f} {y1:.1f} L{x2:.1f} {y2:.1f}" stroke="#57718B" stroke-opacity=".17" stroke-width="2"/>')
for x,y in ((213,492),(420,388),(634,497)):
    floor.append(f'<ellipse cx="{x}" cy="{y+74}" rx="104" ry="38" fill="#080F1B" opacity=".45"/>')
    floor.append(f'<path d="M{x-87} {y+66} l85 -48 l96 48 l-88 52 Z" fill="#18283E" stroke="#4A6E84" stroke-width="3"/>')
    floor.append(f'<path d="M{x-58} {y+65} l60 -32 l66 32 l-64 36 Z" fill="none" stroke="#30D9E8" stroke-opacity=".22" stroke-width="3"/>')
floor.append('''<path d="M152 598 Q232 680 411 670 Q612 675 724 585" stroke="#FBBF62" stroke-opacity=".55" stroke-width="11" fill="none"/>
<path d="M153 598 Q232 680 411 670 Q612 675 724 585" stroke="#473754" stroke-width="5" fill="none" stroke-dasharray="15 9"/>
<path d="M669 411 L709 387 L763 415 L723 439 Z" fill="#1B344C" stroke="#6683A0" stroke-width="2"/>
<path d="M709 387 v-64 l54 28 v64" fill="#344B67"/><path d="M709 387 v-64 l-40 24 v64" fill="#20324F"/>
<circle cx="735" cy="379" r="7" fill="#67E6B5"/><circle cx="751" cy="389" r="5" fill="#FFC857"/>
<path d="M74 507 l64 -37 l56 29 l-65 38Z" fill="#172C44" stroke="#6180A0" stroke-width="3"/>
<path d="M85 502 l47 -26 l48 26 l-48 26Z" fill="#384F67"/><circle cx="130" cy="501" r="13" fill="#30D9E8" opacity=".6"/>
<path d="M399 731 L420 744 L438 731" fill="none" stroke="#30D9E8" stroke-width="6" stroke-linecap="round"/>
</svg>''')
save(''.join(floor),'floor')

# Original logo mark, used as favicon and splash branding
logo = '''<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect x="8" y="8" width="112" height="112" rx="29" fill="#1C2940" stroke="#30D9E8" stroke-width="5"/><rect x="30" y="28" width="68" height="72" rx="13" fill="#253B57" stroke="#7597B6" stroke-width="4"/><rect x="39" y="42" width="51" height="31" rx="12" fill="#101827"/><rect x="47" y="51" width="10" height="11" rx="5" fill="#30D9E8"/><rect x="72" y="51" width="10" height="11" rx="5" fill="#30D9E8"/><path d="M48 84 h33" stroke="#67E6B5" stroke-width="5" stroke-linecap="round"/></svg>'''
save(logo,'icon')
(OUT/'manifest.json').write_text(json.dumps({'origin':'original-procedural-2d','states':STATUSES,'racks':3,'format':'WebP/PNG','blenderRendered':False},indent=2))
print('Created', len(list(OUT.glob('*.webp'))), 'transparent original 2.5D WebP assets in',OUT)
