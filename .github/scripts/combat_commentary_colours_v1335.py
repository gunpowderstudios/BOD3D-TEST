from pathlib import Path
import re

combat=Path('js/combat.js')
s=combat.read_text()
old=""" const lines=document.querySelectorAll('#log .logline');
 const latest=lines.length?String(lines[lines.length-1].textContent||'').trim():'';
 if(!latest)return;
 if(commentary.dataset.message===latest)return;
 commentary.dataset.message=latest;
 commentary.textContent=latest;
 commentary.classList.remove('commentaryIn');
 void commentary.offsetWidth;
 commentary.classList.add('commentaryIn');
}"""
new=""" const lines=document.querySelectorAll('#log .logline');
 const latest=lines.length?String(lines[lines.length-1].textContent||'').trim():'';
 if(!latest)return;
 if(commentary.dataset.message===latest)return;
 commentary.dataset.message=latest;
 commentary.textContent=latest;
 const lower=latest.toLowerCase();
 commentary.classList.remove('heroHitComment','monsterHitComment','standOffComment','commentaryIn');
 const monsterName=String(combat?.tile?.monster?.name||'').toLowerCase();
 const heroHit=(
  /you (?:hit|strike|damage|deal|score|defeat|kill)/.test(lower)||
  /your .*?(?:deals|hits|strikes|defeats|kills)/.test(lower)||
  /(?:ranged attack|fireball|ice staff|flying daggers|bow|skull|bomb|vine).*?(?:damage|defeat|kill)/.test(lower)
 );
 const monsterHit=(
  /(?:hits|strikes|damages|deals).*?you/.test(lower)||
  /you (?:take|lose) [0-9]+/.test(lower)||
  (monsterName&&lower.includes(monsterName)&&/(?:hits|strikes|damages|deals)/.test(lower)&&!/you (?:hit|strike|damage|deal|score|defeat|kill)/.test(lower))
 );
 const standOff=/stand[- ]?off|standoff|both miss|draw|tie|tied|clash/.test(lower);
 if(standOff)commentary.classList.add('standOffComment');
 else if(monsterHit)commentary.classList.add('monsterHitComment');
 else if(heroHit)commentary.classList.add('heroHitComment');
 void commentary.offsetWidth;
 commentary.classList.add('commentaryIn');
}"""
if old not in s:
    raise SystemExit('commentary block not found')
s=s.replace(old,new,1)
combat.write_text(s)

css=Path('css/dark-combat.css')
c=css.read_text()
if 'heroHitComment' not in c:
    c += """

/* v13.35 — colour-code desktop combat commentary by outcome. */
@media(min-width:901px){
 body.combatActive .combatLatestCommentary.heroHitComment{color:#58d26f!important}
 body.combatActive .combatLatestCommentary.monsterHitComment{color:#ef4050!important}
 body.combatActive .combatLatestCommentary.standOffComment{color:#b8b8b8!important}
}
"""
css.write_text(c)

h=Path('index.html')
t=h.read_text()
t=re.sub(r'data-build-version="v[0-9.]+"','data-build-version="v13.35"',t,count=1)
h.write_text(t)
