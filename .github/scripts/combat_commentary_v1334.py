from pathlib import Path
import re

combat=Path('js/combat.js')
s=combat.read_text()
marker='function renderCombat(){if(!combat)return;'
if 'function updateDesktopCombatCommentary()' not in s:
    helper=r'''function updateDesktopCombatCommentary(){
 if(!combat||window.matchMedia('(max-width:900px)').matches)return;
 const monsterStats=document.getElementById('monsterCombatStats');
 if(!monsterStats)return;
 const fighter=monsterStats.closest('.fighter');
 if(!fighter)return;
 let commentary=fighter.querySelector('.combatLatestCommentary');
 if(!commentary){
  commentary=document.createElement('div');
  commentary.className='combatLatestCommentary';
  fighter.appendChild(commentary);
 }
 const lines=document.querySelectorAll('#log .logline');
 const latest=lines.length?String(lines[lines.length-1].textContent||'').trim():'';
 if(!latest)return;
 if(commentary.dataset.message===latest)return;
 commentary.dataset.message=latest;
 commentary.textContent=latest;
 commentary.classList.remove('commentaryIn');
 void commentary.offsetWidth;
 commentary.classList.add('commentaryIn');
}

'''
    if marker not in s: raise SystemExit('renderCombat marker not found')
    s=s.replace(marker,helper+marker,1)

# Insert updater near the end of renderCombat by attaching to a stable line in that function.
needle="document.getElementById('monsterCombatStats').innerHTML='<div class=\"hearts combatHearts\">'+heartLine(m.health,m.maxHealth)+'</div><div>HP '+m.health+'/'+m.maxHealth+'</div><div>Combat '+m.dice+'d6+'+m.mod+'</div><div class=\"small\">Monsters never score critical hits.</div><div class=\"small\">'+(m.special||'')+'</div>';"
if needle not in s: raise SystemExit('monster stats line not found')
if 'updateDesktopCombatCommentary();const b=' not in s:
    s=s.replace(needle+"const b=document.getElementById('combatBtns');",needle+"updateDesktopCombatCommentary();const b=document.getElementById('combatBtns');",1)
combat.write_text(s)

css=Path('css/dark-combat.css')
c=css.read_text()
if '.combatLatestCommentary' not in c:
    c += r'''

/* v13.34 — desktop latest-action combat commentary under monster stats. */
@media(min-width:901px){
 body.combatActive .combatLatestCommentary{
  margin-top:13px;
  padding-top:11px;
  border-top:1px solid rgba(255,255,255,.26);
  color:#f3f3f3;
  font-family:"Alegreya Sans",Arial,sans-serif;
  font-size:15px;
  font-weight:600;
  line-height:1.25;
  text-align:left;
  text-shadow:0 1px 4px #000;
  opacity:1;
  transform:translateY(0);
  pointer-events:none;
 }
 body.combatActive .combatLatestCommentary.commentaryIn{
  animation:combatCommentaryIn .32s ease-out;
 }
 @keyframes combatCommentaryIn{
  from{opacity:0;transform:translateY(8px)}
  to{opacity:1;transform:translateY(0)}
 }
}
@media(max-width:900px){.combatLatestCommentary{display:none!important}}
'''
css.write_text(c)

h=Path('index.html')
t=h.read_text()
t=re.sub(r'data-build-version="v[0-9.]+"','data-build-version="v13.34"',t,count=1)
h.write_text(t)
