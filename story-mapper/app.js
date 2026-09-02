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

  const ROUTE_CLEARANCE = 14;
  const ROUTE_EXIT = 22;
  const CORNER_RADIUS = 10;

  function cloneState(value = state) { return JSON.parse(JSON.stringify(value)); }

  function recordUndo() {
    undoStack.push(cloneState());
    if (undoStack.length > MAX_UNDOS) undoStack.shift();
    updateUndoButton();
  }

  function undo() {
    if (!undoStack.length) { flash('Nothing to undo.'); return; }
    state = undoStack.pop();
    linkStartId = null;
    selectedLinkId = null;
    drag = null;
    editingId = null;
    document.getElementById('editor').classList.add('hidden');
    render();
    updateUndoButton();
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
    } catch {
      return false;
    }
  }

  function render() {
    nodesLayer.innerHTML = '';
    state.nodes.forEach(n => {
      const el = document.createElement('div');
      el.className = 'node' + (n.map ? ' map' : '') + (n.id === linkStartId ? ' selected' : '');
      el.dataset.id = n.id;
      el.style.left = n.x + 'px';
      el.style.top = n.y + 'px';
      el.innerHTML = `<div class="bubble">${escapeHtml(String(n.number))}</div><div class="title">${escapeHtml(n.title || 'Untitled')}</div><div class="text">${escapeHtml(n.text || '')}</div><div class="mapTag">ON DUNGEON MAP</div>`;
      el.addEventListener('pointerdown', onNodePointerDown);
      el.addEventListener('dblclick', () => openEditor(n.id));
      nodesLayer.appendChild(el);
    });
    renderLinks();
    updateLineButtons();
  }

  function rectForElement(el, workspaceRect, inflate = 0) {
    const r = el.getBoundingClientRect();
    return {
      left: r.left - workspaceRect.left - inflate,
      top: r.top - workspaceRect.top - inflate,
      right: r.right - workspaceRect.left + inflate,
      bottom: r.bottom - workspaceRect.top + inflate,
      width: r.width + inflate * 2,
      height: r.height + inflate * 2,
      cx: r.left - workspaceRect.left + r.width / 2,
      cy: r.top - workspaceRect.top + r.height / 2
    };
  }

  function getPort(rect, side) {
    if (side === 'left') return { edge:{x:rect.left, y:rect.cy}, outside:{x:rect.left - ROUTE_EXIT, y:rect.cy} };
    if (side === 'right') return { edge:{x:rect.right, y:rect.cy}, outside:{x:rect.right + ROUTE_EXIT, y:rect.cy} };
    if (side === 'top') return { edge:{x:rect.cx, y:rect.top}, outside:{x:rect.cx, y:rect.top - ROUTE_EXIT} };
    return { edge:{x:rect.cx, y:rect.bottom}, outside:{x:rect.cx, y:rect.bottom + ROUTE_EXIT} };
  }

  function pointInsideRect(p, r) {
    return p.x > r.left && p.x < r.right && p.y > r.top && p.y < r.bottom;
  }

  function segmentHitsRect(a, b, r) {
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const maxY = Math.max(a.y, b.y);

    if (maxX <= r.left || minX >= r.right || maxY <= r.top || minY >= r.bottom) return false;

    if (Math.abs(a.x - b.x) < 0.01) return a.x > r.left && a.x < r.right && maxY > r.top && minY < r.bottom;
    if (Math.abs(a.y - b.y) < 0.01) return a.y > r.top && a.y < r.bottom && maxX > r.left && minX < r.right;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    let t0 = 0;
    let t1 = 1;
    const tests = [
      [-dx, a.x - r.left],
      [ dx, r.right - a.x],
      [-dy, a.y - r.top],
      [ dy, r.bottom - a.y]
    ];
    for (const [p, q] of tests) {
      if (Math.abs(p) < 1e-9) {
        if (q < 0) return false;
      } else {
        const t = q / p;
        if (p < 0) {
          if (t > t1) return false;
          if (t > t0) t0 = t;
        } else {
          if (t < t0) return false;
          if (t < t1) t1 = t;
        }
      }
    }
    return t0 <= t1;
  }

  function segmentClear(a, b, obstacles) {
    return !obstacles.some(r => segmentHitsRect(a, b, r));
  }

  function pathClear(points, obstacles) {
    if (points.some(p => obstacles.some(r => pointInsideRect(p, r)))) return false;
    for (let i = 0; i < points.length - 1; i++) {
      if (!segmentClear(points[i], points[i + 1], obstacles)) return false;
    }
    return true;
  }

  function pathLength(points) {
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) total += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    return total;
  }

  function simplifyPoints(points) {
    const deduped = [];
    for (const p of points) {
      const last = deduped[deduped.length - 1];
      if (!last || Math.abs(last.x - p.x) > 0.5 || Math.abs(last.y - p.y) > 0.5) deduped.push({x:p.x, y:p.y});
    }
    let changed = true;
    while (changed && deduped.length > 2) {
      changed = false;
      for (let i = 1; i < deduped.length - 1; i++) {
        const a = deduped[i - 1], b = deduped[i], c = deduped[i + 1];
        const vertical = Math.abs(a.x - b.x) < 0.5 && Math.abs(b.x - c.x) < 0.5;
        const horizontal = Math.abs(a.y - b.y) < 0.5 && Math.abs(b.y - c.y) < 0.5;
        if (vertical || horizontal) {
          deduped.splice(i, 1);
          changed = true;
          break;
        }
      }
    }
    return deduped;
  }

  function roundedPath(points) {
    const pts = simplifyPoints(points);
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const prev = pts[i - 1];
      const cur = pts[i];
      const next = pts[i + 1];
      const len1 = Math.hypot(cur.x - prev.x, cur.y - prev.y);
      const len2 = Math.hypot(next.x - cur.x, next.y - cur.y);
      const radius = Math.min(CORNER_RADIUS, len1 / 3, len2 / 3);
      if (radius < 1) {
        d += ` L ${cur.x} ${cur.y}`;
        continue;
      }
      const inPoint = { x:cur.x + (prev.x - cur.x) * radius / len1, y:cur.y + (prev.y - cur.y) * radius / len1 };
      const outPoint = { x:cur.x + (next.x - cur.x) * radius / len2, y:cur.y + (next.y - cur.y) * radius / len2 };
      d += ` L ${inPoint.x} ${inPoint.y} Q ${cur.x} ${cur.y} ${outPoint.x} ${outPoint.y}`;
    }
    const last = pts[pts.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return d;
  }

  function preferredSidePenalty(side, fromRect, toRect) {
    const dx = toRect.cx - fromRect.cx;
    const dy = toRect.cy - fromRect.cy;
    const preferred = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'bottom' : 'top');
    return side === preferred ? 0 : 35;
  }

  function routeBetween(start, end, obstacles, workspaceRect) {
    const width = workspaceRect.width;
    const height = workspaceRect.height;
    const candidates = [];

    const addCandidate = points => {
      const p = simplifyPoints(points);
      if (!pathClear(p, obstacles)) return;
      const bends = Math.max(0, p.length - 2);
      candidates.push({ points:p, cost:pathLength(p) + bends * 18 });
    };

    addCandidate([start, end]);
    if (candidates.length) return candidates[0].points;

    addCandidate([start, {x:end.x, y:start.y}, end]);
    addCandidate([start, {x:start.x, y:end.y}, end]);
    if (candidates.length) {
      candidates.sort((a,b) => a.cost - b.cost);
      return candidates[0].points;
    }

    const xLanes = [8, width - 8];
    const yLanes = [8, height - 8];
    obstacles.forEach(r => {
      xLanes.push(Math.max(6, r.left - 6));
      xLanes.push(Math.min(width - 6, r.right + 6));
      yLanes.push(Math.max(6, r.top - 6));
      yLanes.push(Math.min(height - 6, r.bottom + 6));
    });

    const uniqX = [...new Set(xLanes.map(v => Math.round(v)))].sort((a,b) => Math.abs(a - (start.x + end.x) / 2) - Math.abs(b - (start.x + end.x) / 2)).slice(0, 24);
    const uniqY = [...new Set(yLanes.map(v => Math.round(v)))].sort((a,b) => Math.abs(a - (start.y + end.y) / 2) - Math.abs(b - (start.y + end.y) / 2)).slice(0, 24);

    for (const x of uniqX) addCandidate([start, {x, y:start.y}, {x, y:end.y}, end]);
    for (const y of uniqY) addCandidate([start, {x:start.x, y}, {x:end.x, y}, end]);
    if (candidates.length) {
      candidates.sort((a,b) => a.cost - b.cost);
      return candidates[0].points;
    }

    for (const x of uniqX.slice(0, 8)) {
      for (const y of uniqY.slice(0, 8)) {
        addCandidate([start, {x, y:start.y}, {x, y}, {x:end.x, y}, end]);
        addCandidate([start, {x:start.x, y}, {x, y}, {x, y:end.y}, end]);
      }
    }

    if (!candidates.length) return [start, end];
    candidates.sort((a,b) => a.cost - b.cost);
    return candidates[0].points;
  }

  function getBestRoute(aRect, bRect, obstacles, workspaceRect) {
    const sides = ['left','right','top','bottom'];
    let best = null;

    for (const aSide of sides) {
      const aPort = getPort(aRect, aSide);
      for (const bSide of sides) {
        const bPort = getPort(bRect, bSide);

        const otherObstacles = obstacles.filter(r => r.nodeId !== aRect.nodeId && r.nodeId !== bRect.nodeId);
        if (!segmentClear(aPort.edge, aPort.outside, otherObstacles)) continue;
        if (!segmentClear(bPort.edge, bPort.outside, otherObstacles)) continue;
        if (otherObstacles.some(r => pointInsideRect(aPort.outside, r) || pointInsideRect(bPort.outside, r))) continue;

        const routingObstacles = obstacles;
        const middle = routeBetween(aPort.outside, bPort.outside, routingObstacles, workspaceRect);
        if (!pathClear(middle, routingObstacles)) continue;

        const points = simplifyPoints([aPort.edge, aPort.outside, ...middle.slice(1, -1), bPort.outside, bPort.edge]);
        const cost = pathLength(points)
          + Math.max(0, points.length - 2) * 10
          + preferredSidePenalty(aSide, aRect, bRect)
          + preferredSidePenalty(bSide, bRect, aRect);

        if (!best || cost < best.cost) best = {points, cost};
      }
    }

    if (best) return best.points;

    const dx = bRect.cx - aRect.cx;
    const dy = bRect.cy - aRect.cy;
    const aSide = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'bottom' : 'top');
    const bSide = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'left' : 'right') : (dy >= 0 ? 'top' : 'bottom');
    return [getPort(aRect, aSide).edge, getPort(bRect, bSide).edge];
  }

  function renderLinks() {
    svg.innerHTML = '';
    const workspaceRect = workspace.getBoundingClientRect();
    const rectMap = new Map();
    const obstacles = [];

    state.nodes.forEach(n => {
      const el = nodesLayer.querySelector(`[data-id="${n.id}"]`);
      if (!el) return;
      const base = rectForElement(el, workspaceRect, 0);
      base.nodeId = n.id;
      rectMap.set(n.id, base);
      const inflated = rectForElement(el, workspaceRect, ROUTE_CLEARANCE);
      inflated.nodeId = n.id;
      obstacles.push(inflated);
    });

    state.links.forEach(l => {
      const a = rectMap.get(l.from);
      const b = rectMap.get(l.to);
      if (!a || !b) return;

      const route = getBestRoute(a, b, obstacles, workspaceRect);
      const d = roundedPath(route);

      const hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      hit.setAttribute('d', d);
      hit.setAttribute('class', 'linkHit');
      hit.dataset.linkId = l.id;
      hit.addEventListener('pointerdown', e => {
        e.preventDefault();
        e.stopPropagation();
        selectLink(l.id);
      });
      svg.appendChild(hit);

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('class', `link ${l.type}${l.id === selectedLinkId ? ' selectedLink' : ''}`);
      path.dataset.linkId = l.id;
      svg.appendChild(path);
    });
  }

  function selectLink(id) {
    selectedLinkId = selectedLinkId === id ? null : id;
    linkStartId = null;
    renderLinks();
    updateLineButtons();
    const selected = state.links.find(l => l.id === selectedLinkId);
    if (selected) flash(selected.type === 'choice' ? 'Solid line selected. Click “Make Dotted” to change it.' : 'Dotted line selected. Click “Make Solid” to change it.');
    else updateModes();
  }

  function toggleSelectedLine() {
    const link = state.links.find(l => l.id === selectedLinkId);
    if (!link) return;
    recordUndo();
    link.type = link.type === 'choice' ? 'read' : 'choice';
    renderLinks();
    updateLineButtons();
    flash(link.type === 'choice' ? 'Line changed to solid.' : 'Line changed to dotted.');
  }

  function deleteSelectedLine() {
    if (!selectedLinkId || !state.links.some(l => l.id === selectedLinkId)) return;
    recordUndo();
    state.links = state.links.filter(l => l.id !== selectedLinkId);
    selectedLinkId = null;
    render();
    flash('Line deleted.');
  }

  function onNodePointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    const id = Number(e.currentTarget.dataset.id);
    selectedLinkId = null;
    updateLineButtons();

    if (mode === 'delete') {
      e.preventDefault();
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
          state.links.push({ id:'l' + Date.now() + Math.random(), from:linkStartId, to:id, type:mode });
        }
        linkStartId = null;
        mode = 'move';
        updateModes();
        render();
      }
      render();
      return;
    }

    const node = state.nodes.find(n => n.id === id);
    if (!node) return;
    e.preventDefault();
    const rect = workspace.getBoundingClientRect();
    drag = {
      id,
      before:cloneState(),
      moved:false,
      offsetX:e.clientX - rect.left - node.x,
      offsetY:e.clientY - rect.top - node.y,
      pointerId:e.pointerId,
      el:e.currentTarget
    };
    e.currentTarget.classList.add('dragging');
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
    e.currentTarget.addEventListener('pointermove', onDragMove);
    e.currentTarget.addEventListener('pointerup', onDragEnd, {once:true});
    e.currentTarget.addEventListener('pointercancel', onDragEnd, {once:true});
  }

  function onDragMove(e) {
    if (!drag || e.pointerId !== drag.pointerId) return;
    e.preventDefault();
    const rect = workspace.getBoundingClientRect();
    const node = state.nodes.find(n => n.id === drag.id);
    if (!node) return;
    const nodeRect = drag.el.getBoundingClientRect();
    const maxX = Math.max(0, rect.width - nodeRect.width);
    const maxY = Math.max(0, rect.height - nodeRect.height);
    const nextX = Math.max(0, Math.min(maxX, e.clientX - rect.left - drag.offsetX));
    const nextY = Math.max(0, Math.min(maxY, e.clientY - rect.top - drag.offsetY));
    if (Math.abs(nextX - node.x) > 0.5 || Math.abs(nextY - node.y) > 0.5) drag.moved = true;
    node.x = nextX;
    node.y = nextY;
    drag.el.style.left = node.x + 'px';
    drag.el.style.top = node.y + 'px';
    renderLinks();
  }

  function onDragEnd(e) {
    if (!drag || (e.pointerId !== undefined && e.pointerId !== drag.pointerId)) return;
    drag.el.removeEventListener('pointermove', onDragMove);
    drag.el.classList.remove('dragging');
    if (drag.moved) {
      undoStack.push(drag.before);
      if (undoStack.length > MAX_UNDOS) undoStack.shift();
      updateUndoButton();
    }
    drag = null;
  }

  function addNode() {
    recordUndo();
    const used = new Set(state.nodes.map(n => Number(n.number)).filter(Number.isFinite));
    let number = 1;
    while (used.has(number)) number++;
    const id = state.nextId++;
    state.nodes.push({id, number, title:'New story node', text:'Double-click to edit this entry.', x:180 + (state.nodes.length % 4) * 45, y:130 + (state.nodes.length % 5) * 60, map:false});
    setMode('move');
    render();
    openEditor(id);
  }

  function deleteNode(id) {
    recordUndo();
    state.nodes = state.nodes.filter(n => n.id !== id);
    state.links = state.links.filter(l => l.from !== id && l.to !== id);
    if (linkStartId === id) linkStartId = null;
    selectedLinkId = null;
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
    const next = {
      number:chosenNumber,
      title:document.getElementById('nodeTitle').value.trim() || 'Untitled',
      text:document.getElementById('nodeText').value.trim(),
      map:document.getElementById('mapNode').checked
    };
    if (next.number === n.number && next.title === n.title && next.text === n.text && next.map === !!n.map) return;
    recordUndo();
    n.number = next.number;
    n.title = next.title;
    n.text = next.text;
    n.map = next.map;
    render();
    flash(`Saved story ${n.number}.`);
  }

  function setMode(next) {
    mode = next;
    linkStartId = null;
    selectedLinkId = null;
    updateModes();
    render();
  }

  function updateModes() {
    ['choice','read','delete','move'].forEach(m => {
      const id = m === 'move' ? 'resetModeBtn' : m + 'ModeBtn';
      const btn = document.getElementById(id);
      if (btn) btn.classList.toggle('active', mode === m);
    });
    const messages = {
      choice:'Solid link: click the starting box, then the destination box. It returns to Move afterwards.',
      read:'Dotted link: click the starting box, then the destination box. It returns to Move afterwards.',
      delete:'Delete mode: click a box to remove it and its links.',
      move:'Move mode: drag boxes freely. Connections automatically route around other boxes. Double-click a box to edit it.'
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
        state.nextId = Math.max(Number(state.nextId) || 1, ...state.nodes.map(n => Number(n.id) || 0)) + 1;
        setMode('move');
        render();
        flash('Story map imported.');
      } catch {
        alert('Could not import this JSON file.');
      }
    };
    reader.readAsText(file);
  }

  let flashTimer;
  function flash(text) {
    hint.textContent = text;
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => {
      if (selectedLinkId) {
        const selected = state.links.find(l => l.id === selectedLinkId);
        if (selected) {
          hint.textContent = selected.type === 'choice' ? 'Solid line selected. Click “Make Dotted” to change it.' : 'Dotted line selected. Click “Make Solid” to change it.';
          return;
        }
      }
      updateModes();
    }, 2200);
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
  document.getElementById('toggleLineBtn').addEventListener('click', toggleSelectedLine);
  document.getElementById('deleteLineBtn').addEventListener('click', deleteSelectedLine);
  document.getElementById('saveBtn').addEventListener('click', saveLocal);
  document.getElementById('exportBtn').addEventListener('click', exportJson);
  document.getElementById('importInput').addEventListener('change', e => {
    if (e.target.files[0]) importJson(e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById('clearBtn').addEventListener('click', () => {
    if (confirm('Clear the whole story map?')) {
      recordUndo();
      state = {nodes:[], links:[], nextId:1};
      localStorage.removeItem('bodStoryMapper');
      selectedLinkId = null;
      render();
    }
  });
  document.getElementById('closeEditorBtn').addEventListener('click', () => document.getElementById('editor').classList.add('hidden'));
  document.getElementById('applyNodeBtn').addEventListener('click', applyEditor);

  workspace.addEventListener('pointerdown', e => {
    if (e.target === workspace || e.target === nodesLayer || e.target === svg) {
      if (selectedLinkId) {
        selectedLinkId = null;
        renderLinks();
        updateLineButtons();
        updateModes();
      }
    }
  });

  window.addEventListener('resize', renderLinks);
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      e.preventDefault();
      undo();
    }
    if (e.key === 'Escape') {
      linkStartId = null;
      selectedLinkId = null;
      setMode('move');
    }
  });

  if (!loadLocal()) seed();
  updateModes();
  render();
  updateUndoButton();
})();