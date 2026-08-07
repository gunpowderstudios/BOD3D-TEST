from pathlib import Path
import re

scene=Path('js/scene3d.js')
s=scene.read_text()
old="""   const heroSwiping=(pulseType==='hero'||pulseType==='both')&&pulseProgress>0;
   const monsterSwiping=(pulseType==='monster'||pulseType==='both')&&pulseProgress>0;
   hero.rotation.y=yawTowards(hero.position,monster.position)+(heroSwiping?swipeAngle:0);
   // Monster faces the hero from the opposite direction, so mirror the swipe
   // angle to make its 45-degree attack read as the same visible strike.
   monster.rotation.y=yawTowards(monster.position,hero.position)-(monsterSwiping?swipeAngle:0);
"""
new="""   // Combat attack animation is now a pure tabletop lunge: both miniatures
   // stay facing one another while moving forward and back, with no swing rotation.
   hero.rotation.y=yawTowards(hero.position,monster.position);
   monster.rotation.y=yawTowards(monster.position,hero.position);
"""
if old not in s:
    raise SystemExit('combat rotation block not found')
s=s.replace(old,new,1)
scene.write_text(s)

index=Path('index.html')
h=index.read_text()
h=h.replace('data-build-version="v13.26"','data-build-version="v13.27"',1)
h=re.sub(r'js/scene3d\.js\?cache=[^"\']+', 'js/scene3d.js?cache=20260807-lunge-only-v1327', h, count=1)
index.write_text(h)
