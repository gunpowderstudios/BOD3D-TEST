(() => {
  const workspace = document.getElementById('workspace');
  const nodesLayer = document.getElementById('nodes');
  const svg = document.getElementById('links');
  const hint = document.getElementById('hint');

  let state = { nodes: [], links: [], nextId: 1 };
  let mode = 'move';
  let linkStartId = null;
  let selectedLinkId = null;
  let editingId = null;
  let drag = null;
  const undoStack = [];
  const MAX_UNDOS = 20;

  function cloneState(value = state) { return JSON.parse(JSON.stringify(value)); }
  function recordUndo() {
    undoStack.push(cloneState());
    if (undoStack.length > MAX_UNDOS) undoStack.shift();
    updateUndoButton();
  }
  function undo() {
    if (!undoStack.length) { flash('Nothing to undo.'); return; }
    state = undoStack.pop();
    linkStartId = null; selectedLinkId = null; drag = null; editingId = null;
    document.getElementById('editor').classList.add('hidden');
    render(); updateUndoButton();
    flash(`Undone. ${undoStack.length} undo${undoStack.length === 1 ? '' : 's'} remaining.`);
  }
  function updateUndoButton() {
    const btn = document.getElementById('undoBtn');
    btn.disabled = undoStack.length === 0;
    btn.textContent = undoStack.length ? `Undo (${undoStack.length})` : 'Undo';
    btn.title = `${undoStack.length} of ${MAX_UNDOS} undo steps available • Ctrl/Cmd + Z`;
  }
  function updateLineButtons() {
    const toggleBtn = document.getElementById('toggleLineBtn');
    const deleteBtn = document.getElementById('deleteLineBtn');
    const selected = state.links.find(l => l.id === selectedLinkId);
    toggleBtn.disabled = !selected;
    toggleBtn.textContent = selected ? (selected.type === 'choice' ? 'Make Dotted' : 'Make Solid') : 'Change Line';
    deleteBtn.disabled = !selected;
  }
  function seed() {
    state = {
      nextId: 5,
      nodes: [
        { id:1, number:12, title:'Old Corridor', text:'You hear scratching behind the door.', x:110, y:150, map:true },
        { id:2, number:13, title:'Kitchen', text:'Three goblins sit around a cooking pot.', x:390, y:80, map:false },
        { id:3, number:27, title:'Stairs', text:'Cold air rises from the darkness below.', x:390, y:260, map:true },
        { id:4, number:61, title:'Secret Room', text:'Only accessible if you have the Iron Key.', x:680, y:80, map:false }
      ],
      links: [
        { id:'l1', from:1, to:2, type:'choice' },
        { id:'l2', from:1, to:3, type:'choice' },
        { id:'l3', from:2, to:4, type:'read' }
      ]
    };
  }
  function saveLocal() { localStorage.setItem('bodStoryMapper', JSON.stringify(state)); flash('Saved in this browser.'); }
  function loadLocal() {
    const raw = localStorage.getItem('bodStoryMapper'); if (!raw) return false;
    try { const parsed = JSON.parse(raw); if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.links)) return false; state = parsed; return true; }
    catch { return false; }
  }
  function render() {
    nodesLayer.innerHTML = '';
    state.nodes.forEach(n => {
      const el = document.createElement('div');
      el.className = 'node' + (n.map ? ' map' : '') + (n.id === linkStartId ? ' selected' : '');
      el.dataset.id = n.id; el.style.left = n.x + 'px'; el.style.top = n.y + 'px';
      el.innerHTML = `<div class="bubble">${escapeHtml(String(n.number))}</div><div class="title">${escapeHtml(n.title || 'Untitled')}</div><div class="text">${escapeHtml(n.text || '')}</div><div class="mapTag">ON DUNGEON MAP</div>`;
      el.addEventListener('pointerdown', onNodePointerDown);
      el.addEventListener('dblclick', () => openEditor(n.id));
      nodesLayer.appendChild(el);
    });
    renderLinks(); updateLineButtons();
  }

  function getEdgePoint(fromRect, toRect, workspaceRect) {
    const fx = fromRect.left - workspaceRect.left + fromRect.width / 2;
    const fy = fromRect.top - workspaceRect.top + fromRect.height / 2;
    const tx = toRect.left - workspaceRect.left + toRect.width / 2;
    const ty = toRect.top - workspaceRect.top + toRect.height / 2;
    const dx = tx - fx;
    const dy = ty - fy;
    const halfW = fromRect.width / 2;
    const halfH = fromRect.height / 2;
    if (dx === 0 && dy === 0) return { x: fx, y: fy };
    const scale = 1 / Math.max(Math.abs(dx) / halfW, Math.abs(dy) / halfH);
    return { x: fx + dx * scale, y: fy + dy * scale };
  }

  function renderLinks() {
    svg.innerHTML = `<defs><marker id="arrowChoice" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#e2ddd3"></path></marker><marker id="arrowRead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#b8b1a6"></path></marker></defs>`;
    const workspaceRect = workspace.getBoundingClientRect();
    state.links.forEach(l => {
      const aEl = nodesLayer.querySelector(`[data-id="${l.from}"]`); const bEl = nodesLayer.querySelector(`[data-id="${l.to}"]`);
      if (!aEl || !bEl) return;
      const a = aEl.getBoundingClientRect(); const b = bEl.getBoundingClientRect();
      const start = getEdgePoint(a, b, workspaceRect);
      const end = getEdgePoint(b, a, workspaceRect);
      const x1 = start.x; const y1 = start.y; const x2 = end.x; const y2 = end.y;
      const deltaX = x2 - x1;
      const deltaY = y2 - y1;
      const distance = Math.hypot(deltaX, deltaY);
      const dir = deltaX >= 0 ? 1 : -1;
      const pull = Math.max(55, Math.min(180, Math.abs(deltaX) * 0.38 + distance * 0.08));
      const sag = Math.max(28, Math.min(110, distance * 0.18));
      const curveDown = deltaY < -120 ? -sag * 0.35 : sag;
      const c1x = x1 + pull * dir;
      const c1y = y1 + curveDown;
      const c2x = x2 - pull * dir;
      const c2y = y2 + curveDown;
      const d = `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
      const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hit.setAttribute('d', d); hit.setAttribute('class', 'linkHit'); hit.dataset.linkId = l.id;
      hit.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); selectLink(l.id); });
      svg.appendChild(hit);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d); path.setAttribute('class', `link ${l.type}${l.id === selectedLinkId ? ' selectedLink' : ''}`); path.dataset.linkId = l.id;
      svg.appendChild(path);
    });
  }
  function selectLink(id) {
    selectedLinkId = selectedLinkId === id ? null : id; linkStartId = null;
    renderLinks(); updateLineButtons();
    const selected = state.links.find(l => l.id === selectedLinkId);
    if (selected) flash(selected.type === 'choice' ? 'Solid line selected. Click “Make Dotted” to change it.' : 'Dotted line selected. Click “Make Solid” to change it.');
    else updateModes();
  }
  function toggleSelectedLine() {
    const link = state.links.find(l => l.id === selectedLinkId); if (!link) return;
    recordUndo(); link.type = link.type === 'choice' ? 'read' : 'choice';
    renderLinks(); updateLineButtons(); flash(link.type === 'choice' ? 'Line changed to solid.' : 'Line changed to dotted.');
  }
  function deleteSelectedLine() {
    if (!selectedLinkId || !state.links.some(l => l.id === selectedLinkId)) return;
    recordUndo(); state.links = state.links.filter(l => l.id !== selectedLinkId); selectedLinkId = null; render(); flash('Line deleted.');
  }
  function onNodePointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const id = Number(e.currentTarget.dataset.id); selectedLinkId = null; updateLineButtons();
    if (mode === 'delete') { e.preventDefault(); deleteNode(id); return; }
    if (mode === 'choice' || mode === 'read') {
      e.preventDefault();
      if (linkStartId == null) { linkStartId = id; flash(`Now click the destination node for the ${mode === 'choice' ? 'solid choice' : 'dotted read'} link.`); }
      else if (linkStartId === id) { linkStartId = null; flash('Link cancelled.'); }
      else {
        const exists = state.links.some(l => l.from === linkStartId && l.to === id && l.type === mode);
        if (!exists) { recordUndo(); state.links.push({ id:'l'+Date.now()+Math.random(), from:linkStartId, to:id, type:mode }); }
        linkStartId = null; mode = 'move'; updateModes(); render();
      }
      render(); return;
    }
    const node = state.nodes.find(n => n.id === id); if (!node) return;
    e.preventDefault();
    const rect = workspace.getBoundingClientRect();
    drag = { id, before:cloneState(), moved:false, offsetX:e.clientX-rect.left-node.x, offsetY:e.clientY-rect.top-node.y, pointerId:e.pointerId, el:e.currentTarget };
    e.currentTarget.classList.add('dragging');
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    e.currentTarget.addEventListener('pointermove', onDragMove);
    e.currentTarget.addEventListener('pointerup', onDragEnd, {once:true});
    e.currentTarget.addEventListener('pointercancel', onDragEnd, {once:true});
  }
  function onDragMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return; e.preventDefault();
    const rect = workspace.getBoundingClientRect(); const node = state.nodes.find(n => n.id === drag.id); if (!node) return;
    const nodeRect = drag.el.getBoundingClientRect(); const maxX = Math.max(0, rect.width-nodeRect.width); const maxY = Math.max(0, rect.height-nodeRect.height);
    const nextX = Math.max(0, Math.min(maxX, e.clientX-rect.left-drag.offsetX)); const nextY = Math.max(0, Math.min(maxY, e.clientY-rect.top-drag.offsetY));
    if (Math.abs(nextX-node.x) > .5 || Math.abs(nextY-node.y) > .5) drag.moved = true;
    node.x = nextX; node.y = nextY; drag.el.style.left = node.x+'px'; drag.el.style.top = node.y+'px'; renderLinks();
  }
  function onDragEnd(e) {
    if (!drag || (e.pointerId !== undefined && e.pointerId !== drag.pointerId)) return;
    drag.el.removeEventListener('pointermove', onDragMove); drag.el.classList.remove('dragging');
    if (drag.moved) { undoStack.push(drag.before); if (undoStack.length > MAX_UNDOS) undoStack.shift(); updateUndoButton(); }
    drag = null;
  }
  function addNode() {
    recordUndo();
    const used = new Set(state.nodes.map(n => Number(n.number)).filter(Number.isFinite));
    let number = 1;
    while (used.has(number)) number++;
    const id = state.nextId++;
    state.nodes.push({id, number, title:'New story node', text:'Double-click to edit this entry.', x:180+(state.nodes.length%4)*45, y:130+(state.nodes.length%5)*60, map:false});
    setMode('move'); render(); openEditor(id);
  }
  function deleteNode(id) {
    recordUndo(); state.nodes = state.nodes.filter(n => n.id !== id); state.links = state.links.filter(l => l.from !== id && l.to !== id);
    if (linkStartId === id) linkStartId = null; selectedLinkId = null; render();
  }
  function openEditor(id) {
    const n = state.nodes.find(n => n.id === id); if (!n) return; editingId = id;
    document.getElementById('nodeNumber').value = n.number; document.getElementById('nodeTitle').value = n.title; document.getElementById('nodeText').value = n.text; document.getElementById('mapNode').checked = !!n.map;
    document.getElementById('editor').classList.remove('hidden');
  }
  function applyEditor() {
    const n = state.nodes.find(n => n.id === editingId); if (!n) return;
    const input = document.getElementById('nodeNumber');
    const num = Number(input.value);
    const chosenNumber = Number.isFinite(num) && num > 0 ? Math.floor(num) : n.number;
    const duplicate = state.nodes.find(other => other.id !== n.id && Number(other.number) === chosenNumber);
    if (duplicate) {
      input.focus();
      input.select();
      flash(`Number ${chosenNumber} is already used by “${duplicate.title || 'Untitled'}”. Choose another number.`);
      return;
    }
    const next = { number:chosenNumber, title:document.getElementById('nodeTitle').value.trim()||'Untitled', text:document.getElementById('nodeText').value.trim(), map:document.getElementById('mapNode').checked };
    if (next.number===n.number && next.title===n.title && next.text===n.text && next.map===!!n.map) return;
    recordUndo(); n.number=next.number; n.title=next.title; n.text=next.text; n.map=next.map; render();
    flash(`Saved story ${n.number}.`);
  }
  function setMode(next) { mode=next; linkStartId=null; selectedLinkId=null; updateModes(); render(); }
  function updateModes() {
    ['choice','read','delete','move'].forEach(m => { const id=m==='move'?'resetModeBtn':m+'ModeBtn'; const btn=document.getElementById(id); if (btn) btn.classList.toggle('active',mode===m); });
    const messages = {
      choice:'Solid link: click the starting box, then the destination box. It returns to Move afterwards.',
      read:'Dotted link: click the starting box, then the destination box. It returns to Move afterwards.',
      delete:'Delete mode: click a box to remove it and its links.',
      move:'Move mode: drag boxes freely. Double-click a box to edit it. Click a line to select/change it.'
    };
    hint.textContent = messages[mode];
  }
  function exportJson() {
    const blob = new Blob([JSON.stringify(state,null,2)], {type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='book-of-dungeon-story-map.json'; a.click(); URL.revokeObjectURL(url);
  }
  function importJson(file) {
    const reader = new FileReader(); reader.onload=()=>{ try { const obj=JSON.parse(reader.result); if(!Array.isArray(obj.nodes)||!Array.isArray(obj.links)) throw new Error('Invalid story-map file'); recordUndo(); state=obj; state.nextId=Math.max(Number(state.nextId)||1,...state.nodes.map(n=>Number(n.id)||0))+1; setMode('move'); render(); flash('Story map imported.'); } catch(err){ alert('Could not import this JSON file.'); } }; reader.readAsText(file);
  }
  let flashTimer;
  function flash(text) {
    hint.textContent=text; clearTimeout(flashTimer); flashTimer=setTimeout(()=>{
      if(selectedLinkId){ const selected=state.links.find(l=>l.id===selectedLinkId); if(selected){ hint.textContent=selected.type==='choice'?'Solid line selected. Click “Make Dotted” to change it.':'Dotted line selected. Click “Make Solid” to change it.'; return; } }
      updateModes();
    },2200);
  }
  function escapeHtml(str) { return str.replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c])); }

  document.getElementById('addNodeBtn').addEventListener('click',addNode);
  document.getElementById('undoBtn').addEventListener('click',undo);
  document.getElementById('choiceModeBtn').addEventListener('click',()=>setMode('choice'));
  document.getElementById('readModeBtn').addEventListener('click',()=>setMode('read'));
  document.getElementById('deleteModeBtn').addEventListener('click',()=>setMode('delete'));
  document.getElementById('resetModeBtn').addEventListener('click',()=>setMode('move'));
  document.getElementById('toggleLineBtn').addEventListener('click',toggleSelectedLine);
  document.getElementById('deleteLineBtn').addEventListener('click',deleteSelectedLine);
  document.getElementById('saveBtn').addEventListener('click',saveLocal);
  document.getElementById('exportBtn').addEventListener('click',exportJson);
  document.getElementById('importInput').addEventListener('change',e=>{ if(e.target.files[0]) importJson(e.target.files[0]); e.target.value=''; });
  document.getElementById('clearBtn').addEventListener('click',()=>{ if(confirm('Clear the whole story map?')){ recordUndo(); state={nodes:[],links:[],nextId:1}; localStorage.removeItem('bodStoryMapper'); selectedLinkId=null; render(); } });
  document.getElementById('closeEditorBtn').addEventListener('click',()=>document.getElementById('editor').classList.add('hidden'));
  document.getElementById('applyNodeBtn').addEventListener('click',applyEditor);
  workspace.addEventListener('pointerdown',e=>{ if(e.target===workspace||e.target===nodesLayer||e.target===svg){ if(selectedLinkId){ selectedLinkId=null; renderLinks(); updateLineButtons(); updateModes(); } } });
  window.addEventListener('resize',renderLinks);
  document.addEventListener('keydown',e=>{
    if((e.ctrlKey||e.metaKey)&&!e.shiftKey&&e.key.toLowerCase()==='z'){ const tag=document.activeElement&&document.activeElement.tagName; if(tag==='INPUT'||tag==='TEXTAREA') return; e.preventDefault(); undo(); }
    if(e.key==='Escape'){ linkStartId=null; selectedLinkId=null; setMode('move'); }
  });

  if(!loadLocal()) seed(); updateModes(); render(); updateUndoButton();
})();