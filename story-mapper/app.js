(() => {
  const workspace = document.getElementById('workspace');
  const nodesLayer = document.getElementById('nodes');
  const svg = document.getElementById('links');
  const hint = document.getElementById('hint');

  let state = {
    nodes: [],
    links: [],
    nextId: 1
  };
  let mode = 'choice'; // choice, read, move, delete
  let linkStartId = null;
  let editingId = null;
  let drag = null;
  const undoStack = [];
  const MAX_UNDOS = 20;

  function cloneState(value = state) {
    return JSON.parse(JSON.stringify(value));
  }

  function recordUndo() {
    undoStack.push(cloneState());
    if (undoStack.length > MAX_UNDOS) undoStack.shift();
    updateUndoButton();
  }

  function undo() {
    if (!undoStack.length) {
      flash('Nothing to undo.');
      return;
    }
    state = undoStack.pop();
    linkStartId = null;
    drag = null;
    editingId = null;
    document.getElementById('editor').classList.add('hidden');
    render();
    updateUndoButton();
    flash(`Undone. ${undoStack.length} undo${undoStack.length === 1 ? '' : 's'} remaining.`);
  }

  function updateUndoButton() {
    const btn = document.getElementById('undoBtn');
    if (!btn) return;
    btn.disabled = undoStack.length === 0;
    btn.textContent = undoStack.length ? `Undo (${undoStack.length})` : 'Undo';
    btn.title = `${undoStack.length} of ${MAX_UNDOS} undo steps available • Ctrl/Cmd + Z`;
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

  function saveLocal() {
    localStorage.setItem('bodStoryMapper', JSON.stringify(state));
    flash('Saved in this browser.');
  }

  function loadLocal() {
    const raw = localStorage.getItem('bodStoryMapper');
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.links)) return false;
      state = parsed;
      return true;
    } catch { return false; }
  }

  function render() {
    nodesLayer.innerHTML = '';
    state.nodes.forEach(n => {
      const el = document.createElement('div');
      el.className = 'node' + (n.map ? ' map' : '') + (n.id === linkStartId ? ' selected' : '');
      el.dataset.id = n.id;
      el.style.left = n.x + 'px';
      el.style.top = n.y + 'px';
      el.innerHTML = `
        <div class="bubble">${escapeHtml(String(n.number))}</div>
        <div class="title">${escapeHtml(n.title || 'Untitled')}</div>
        <div class="text">${escapeHtml(n.text || '')}</div>
        <div class="mapTag">ON DUNGEON MAP</div>`;
      el.addEventListener('pointerdown', onNodePointerDown);
      el.addEventListener('dblclick', () => openEditor(n.id));
      nodesLayer.appendChild(el);
    });
    renderLinks();
  }

  function renderLinks() {
    svg.innerHTML = `
      <defs>
        <marker id="arrowChoice" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#e2ddd3"></path>
        </marker>
        <marker id="arrowRead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
          <path d="M0,0 L0,6 L9,3 z" fill="#b8b1a6"></path>
        </marker>
      </defs>`;
    const workspaceRect = workspace.getBoundingClientRect();
    state.links.forEach(l => {
      const aEl = nodesLayer.querySelector(`[data-id="${l.from}"]`);
      const bEl = nodesLayer.querySelector(`[data-id="${l.to}"]`);
      if (!aEl || !bEl) return;
      const a = aEl.getBoundingClientRect();
      const b = bEl.getBoundingClientRect();
      const x1 = a.left - workspaceRect.left + a.width/2;
      const y1 = a.top - workspaceRect.top + a.height/2;
      const x2 = b.left - workspaceRect.left + b.width/2;
      const y2 = b.top - workspaceRect.top + b.height/2;
      const dx = Math.max(70, Math.abs(x2-x1)*0.45);
      const dir = x2 >= x1 ? 1 : -1;
      const d = `M ${x1} ${y1} C ${x1 + dx*dir} ${y1}, ${x2 - dx*dir} ${y2}, ${x2} ${y2}`;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('class', `link ${l.type}`);
      svg.appendChild(path);
    });
  }

  function onNodePointerDown(e) {
    if (e.button !== 0) return;
    const id = Number(e.currentTarget.dataset.id);

    if (mode === 'delete') {
      deleteNode(id);
      return;
    }

    if (mode === 'choice' || mode === 'read') {
      e.preventDefault();
      if (linkStartId == null) {
        linkStartId = id;
        flash(`Now click the destination node for the ${mode === 'choice' ? 'solid choice' : 'dotted read'} link.`);
      } else if (linkStartId === id) {
        linkStartId = null;
        flash('Link cancelled.');
      } else {
        const exists = state.links.some(l => l.from === linkStartId && l.to === id && l.type === mode);
        if (!exists) {
          recordUndo();
          state.links.push({ id:'l'+Date.now()+Math.random(), from:linkStartId, to:id, type:mode });
        }
        linkStartId = null;
        render();
      }
      render();
      return;
    }

    const node = state.nodes.find(n => n.id === id);
    if (!node) return;
    const rect = workspace.getBoundingClientRect();
    drag = {
      id,
      before: cloneState(),
      moved: false,
      offsetX: e.clientX - rect.left - node.x,
      offsetY: e.clientY - rect.top - node.y,
      pointerId: e.pointerId,
      el: e.currentTarget
    };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.addEventListener('pointermove', onDragMove);
    e.currentTarget.addEventListener('pointerup', onDragEnd, {once:true});
  }

  function onDragMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const rect = workspace.getBoundingClientRect();
    const node = state.nodes.find(n => n.id === drag.id);
    if (!node) return;
    const nodeRect = drag.el.getBoundingClientRect();
    const maxX = Math.max(0, rect.width - nodeRect.width);
    const maxY = Math.max(0, rect.height - nodeRect.height);
    const nextX = Math.max(0, Math.min(maxX, e.clientX - rect.left - drag.offsetX));
    const nextY = Math.max(0, Math.min(maxY, e.clientY - rect.top - drag.offsetY));
    if (nextX !== node.x || nextY !== node.y) drag.moved = true;
    node.x = nextX;
    node.y = nextY;
    drag.el.style.left = node.x + 'px';
    drag.el.style.top = node.y + 'px';
    renderLinks();
  }

  function onDragEnd(e) {
    if (!drag) return;
    drag.el.removeEventListener('pointermove', onDragMove);
    if (drag.moved) {
      undoStack.push(drag.before);
      if (undoStack.length > MAX_UNDOS) undoStack.shift();
      updateUndoButton();
    }
    drag = null;
  }

  function addNode() {
    recordUndo();
    const nums = state.nodes.map(n => Number(n.number) || 0);
    const number = nums.length ? Math.max(...nums) + 1 : 1;
    const id = state.nextId++;
    state.nodes.push({id, number, title:'New story node', text:'Double-click to edit this entry.', x:180 + (state.nodes.length%4)*45, y:130 + (state.nodes.length%5)*60, map:false});
    mode = 'move';
    updateModes();
    render();
    openEditor(id);
  }

  function deleteNode(id) {
    recordUndo();
    state.nodes = state.nodes.filter(n => n.id !== id);
    state.links = state.links.filter(l => l.from !== id && l.to !== id);
    if (linkStartId === id) linkStartId = null;
    render();
  }

  function openEditor(id) {
    const n = state.nodes.find(n => n.id === id);
    if (!n) return;
    editingId = id;
    document.getElementById('nodeNumber').value = n.number;
    document.getElementById('nodeTitle').value = n.title;
    document.getElementById('nodeText').value = n.text;
    document.getElementById('mapNode').checked = !!n.map;
    document.getElementById('editor').classList.remove('hidden');
  }

  function applyEditor() {
    const n = state.nodes.find(n => n.id === editingId);
    if (!n) return;
    const num = Number(document.getElementById('nodeNumber').value);
    const next = {
      number: Number.isFinite(num) && num > 0 ? Math.floor(num) : n.number,
      title: document.getElementById('nodeTitle').value.trim() || 'Untitled',
      text: document.getElementById('nodeText').value.trim(),
      map: document.getElementById('mapNode').checked
    };
    if (next.number === n.number && next.title === n.title && next.text === n.text && next.map === !!n.map) return;
    recordUndo();
    n.number = next.number;
    n.title = next.title;
    n.text = next.text;
    n.map = next.map;
    render();
  }

  function setMode(next) {
    mode = next;
    linkStartId = null;
    updateModes();
    render();
  }

  function updateModes() {
    ['choice','read','delete'].forEach(m => document.getElementById(m+'ModeBtn').classList.toggle('active', mode===m));
    const messages = {
      choice:'Choice mode: click one node, then another to draw a solid route.',
      read:'Read mode: click one node, then another to draw a dotted information/reveal route.',
      delete:'Delete mode: click a node to remove it and its links.',
      move:'Move mode: drag nodes. Double-click a node to edit it.'
    };
    hint.textContent = messages[mode];
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'book-of-dungeon-story-map.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result);
        if (!Array.isArray(obj.nodes) || !Array.isArray(obj.links)) throw new Error('Invalid story-map file');
        recordUndo();
        state = obj;
        state.nextId = Math.max(Number(state.nextId)||1, ...state.nodes.map(n => Number(n.id)||0)) + 1;
        setMode('move');
        render();
        flash('Story map imported.');
      } catch (err) { alert('Could not import this JSON file.'); }
    };
    reader.readAsText(file);
  }

  let flashTimer;
  function flash(text) {
    hint.textContent = text;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(updateModes, 2200);
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));
  }

  document.getElementById('addNodeBtn').addEventListener('click', addNode);
  document.getElementById('undoBtn').addEventListener('click', undo);
  document.getElementById('choiceModeBtn').addEventListener('click', () => setMode('choice'));
  document.getElementById('readModeBtn').addEventListener('click', () => setMode('read'));
  document.getElementById('deleteModeBtn').addEventListener('click', () => setMode('delete'));
  document.getElementById('resetModeBtn').addEventListener('click', () => setMode('move'));
  document.getElementById('saveBtn').addEventListener('click', saveLocal);
  document.getElementById('exportBtn').addEventListener('click', exportJson);
  document.getElementById('importInput').addEventListener('change', e => { if(e.target.files[0]) importJson(e.target.files[0]); e.target.value=''; });
  document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('Clear the whole story map?')) { recordUndo(); state = {nodes:[], links:[], nextId:1}; localStorage.removeItem('bodStoryMapper'); render(); }
  });
  document.getElementById('closeEditorBtn').addEventListener('click', () => document.getElementById('editor').classList.add('hidden'));
  document.getElementById('applyNodeBtn').addEventListener('click', applyEditor);
  window.addEventListener('resize', renderLinks);
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      undo();
    }
  });

  if (!loadLocal()) seed();
  updateModes();
  render();
  updateUndoButton();
})();
