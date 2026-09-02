(() => {
  const workspace = document.getElementById('workspace');
  const canvas = document.getElementById('canvas');
  const nodesLayer = document.getElementById('nodes');
  const svg = document.getElementById('links');
  const hint = document.getElementById('hint');
  const editor = document.getElementById('editor');
  const editorHeading = document.getElementById('editorHeading');

  let state = { nodes: [], links: [], nextId: 1 };
  let mode = 'move';
  let linkStartId = null;
  let selectedLinkId = null;
  let editingId = null;
  let drag = null;
  const undoStack = [];
  const MAX_UNDOS = 20;

  const MIN_CANVAS_WIDTH = 3200;
  const MIN_CANVAS_HEIGHT = 2400;
  const CANVAS_GROW = 900;
  const ROUTE_CLEARANCE = 14;
  const ROUTE_EXIT = 26;
  const CORNER_RADIUS = 9;

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
    selectedLinkId = null;
    drag = null;
    editingId = null;
    editor.classList.add('hidden');
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
    toggleBtn.textContent = selected
      ? (selected.type === 'choice' ? 'Make Dotted' : 'Make Solid')
      : 'Change Line';
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
      state.nextId = Math.max(
        Number(state.nextId) || 1,
        ...state.nodes.map(n => Number(n.id) || 0)
      ) + 1;
      return true;
    } catch {
      return false;
    }
  }

  function ensureCanvasSize(extraX = 0, extraY = 0) {
    const maxNodeX = state.nodes.reduce((m, n) => Math.max(m, Number(n.x) || 0), 0);
    const maxNodeY = state.nodes.reduce((m, n) => Math.max(m, Number(n.y) || 0), 0);
    const wantedWidth = Math.max(MIN_CANVAS_WIDTH, maxNodeX + 800, extraX + 450);
    const wantedHeight = Math.max(MIN_CANVAS_HEIGHT, maxNodeY + 700, extraY + 350);
    const currentWidth = parseFloat(canvas.style.width) || MIN_CANVAS_WIDTH;
    const currentHeight = parseFloat(canvas.style.height) || MIN_CANVAS_HEIGHT;
    canvas.style.width = Math.max(currentWidth, wantedWidth) + 'px';
    canvas.style.height = Math.max(currentHeight, wantedHeight) + 'px';
  }

  function growCanvasIfNeeded(x, y, width, height) {
    let w = canvas.clientWidth;
    let h = canvas.clientHeight;
    let changed = false;
    if (x + width > w - 260) {
      w += CANVAS_GROW;
      changed = true;
    }
    if (y + height > h - 220) {
      h += CANVAS_GROW;
      changed = true;
    }
    if (changed) {
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    }
  }

  function render() {
    ensureCanvasSize();
    nodesLayer.innerHTML = '';
    state.nodes.forEach(n => {
      const el = document.createElement('div');
      el.className = 'node' + (n.map ? ' map' : '') + (n.id === linkStartId ? ' selected' : '');
      el.dataset.id = n.id;
      el.style.left = (Number(n.x) || 0) + 'px';
      el.style.top = (Number(n.y) || 0) + 'px';
      el.title = 'Double-click to edit the full story';
      el.innerHTML = `
        <div class="bubble">${escapeHtml(String(n.number))}</div>
        <div class="title">${escapeHtml(n.title || 'Untitled')}</div>`;
      el.addEventListener('pointerdown', onNodePointerDown);
      el.addEventListener('dblclick', e => {
        e.preventDefault();
        e.stopPropagation();
        openEditor(n.id);
      });
      nodesLayer.appendChild(el);
    });
    renderLinks();
    updateLineButtons();
  }

  function rectForElement(el, canvasRect, inflate = 0) {
    const r = el.getBoundingClientRect();
    return {
      left: r.left - canvasRect.left - inflate,
      top: r.top - canvasRect.top - inflate,
      right: r.right - canvasRect.left + inflate,
      bottom: r.bottom - canvasRect.top + inflate,
      width: r.width + inflate * 2,
      height: r.height + inflate * 2,
      cx: r.left - canvasRect.left + r.width / 2,
      cy: r.top - canvasRect.top + r.height / 2
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
    for (let i = 0; i < points.length - 1; i++) {
      total += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    }
    return total;
  }

  function simplifyPoints(points) {
    const deduped = [];
    for (const p of points) {
      const last = deduped[deduped.length - 1];
      if (!last || Math.abs(last.x - p.x) > 0.5 || Math.abs(last.y - p.y) > 0.5) {
        deduped.push({x:p.x, y:p.y});
      }
    }
    let changed = true;
    while (changed && deduped.length > 2) {
      changed = false;
      for (let i = 1; i < deduped.length - 1; i++) {
        const a = deduped[i - 1];
        const b = deduped[i];
        const c = deduped[i + 1];
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
      const inPoint = {
        x:cur.x + (prev.x - cur.x) * radius / len1,
        y:cur.y + (prev.y - cur.y) * radius / len1
      };
      const outPoint = {
        x:cur.x + (next.x - cur.x) * radius / len2,
        y:cur.y + (next.y - cur.y) * radius / len2
      };
      d += ` L ${inPoint.x} ${inPoint.y} Q ${cur.x} ${cur.y} ${outPoint.x} ${outPoint.y}`;
    }
    const last = pts[pts.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return d;
  }

  function preferredSidePenalty(side, fromRect, toRect) {
    const dx = toRect.cx - fromRect.cx;
    const dy = toRect.cy - fromRect.cy;
    const preferred = Math.abs(dx) >= Math.abs(dy)
      ? (dx >= 0 ? 'right' : 'left')
      : (dy >= 0 ? 'bottom' : 'top');
    return side === preferred ? 0 : 42;
  }

  function routeBetween(start, end, obstacles) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const candidates = [];

    const add = points => {
      const p = simplifyPoints(points);
      if (!pathClear(p, obstacles)) return;
      const bends = Math.max(0, p.length - 2);
      candidates.push({points:p, cost:pathLength(p) + bends * 22});
    };

    add([start, end]);
    if (candidates.length) return candidates[0].points;

    add([start, {x:end.x, y:start.y}, end]);
    add([start, {x:start.x, y:end.y}, end]);

    const xLanes = [10, width - 10];
    const yLanes = [10, height - 10];
    obstacles.forEach(r => {
      xLanes.push(Math.max(8, r.left - 8), Math.min(width - 8, r.right + 8));
      yLanes.push(Math.max(8, r.top - 8), Math.min(height - 8, r.bottom + 8));
    });

    const midX = (start.x + end.x) / 2;
    const midY = (start.y + end.y) / 2;
    const uniqX = [...new Set(xLanes.map(Math.round))]
      .sort((a,b) => Math.abs(a - midX) - Math.abs(b - midX))
      .slice(0, 30);
    const uniqY = [...new Set(yLanes.map(Math.round))]
      .sort((a,b) => Math.abs(a - midY) - Math.abs(b - midY))
      .slice(0, 30);

    for (const x of uniqX) add([start, {x, y:start.y}, {x, y:end.y}, end]);
    for (const y of uniqY) add([start, {x:start.x, y}, {x:end.x, y}, end]);

    if (!candidates.length) {
      for (const x of uniqX.slice(0, 10)) {
        for (const y of uniqY.slice(0, 10)) {
          add([start, {x, y:start.y}, {x, y}, {x:end.x, y}, end]);
          add([start, {x:start.x, y}, {x, y}, {x, y:end.y}, end]);
        }
      }
    }

    if (!candidates.length) return [start, end];
    candidates.sort((a,b) => a.cost - b.cost);
    return candidates[0].points;
  }

  function getBestRoute(aRect, bRect, obstacles) {
    const sides = ['left','right','top','bottom'];
    const otherObstacles = obstacles.filter(r => r.nodeId !== aRect.nodeId && r.nodeId !== bRect.nodeId);
    let best = null;

    for (const aSide of sides) {
      const aPort = getPort(aRect, aSide);
      for (const bSide of sides) {
        const bPort = getPort(bRect, bSide);
        if (!segmentClear(aPort.edge, aPort.outside, otherObstacles)) continue;
        if (!segmentClear(bPort.edge, bPort.outside, otherObstacles)) continue;
        if (otherObstacles.some(r => pointInsideRect(aPort.outside, r) || pointInsideRect(bPort.outside, r))) continue;

        const middle = routeBetween(aPort.outside, bPort.outside, otherObstacles);
        if (!pathClear(middle, otherObstacles)) continue;

        const points = simplifyPoints([
          aPort.edge,
          aPort.outside,
          ...middle.slice(1, -1),
          bPort.outside,
          bPort.edge
        ]);
        const cost = pathLength(points)
          + Math.max(0, points.length - 2) * 12
          + preferredSidePenalty(aSide, aRect, bRect)
          + preferredSidePenalty(bSide, bRect, aRect);
        if (!best || cost < best.cost) best = {points, cost};
      }
    }

    if (best) return best.points;

    const dx = bRect.cx - aRect.cx;
    const dy = bRect.cy - aRect.cy;
    const aSide = Math.abs(dx) >= Math.abs(dy)
      ? (dx >= 0 ? 'right' : 'left')
      : (dy >= 0 ? 'bottom' : 'top');
    const bSide = Math.abs(dx) >= Math.abs(dy)
      ? (dx >= 0 ? 'left' : 'right')
      : (dy >= 0 ? 'top' : 'bottom');
    return [getPort(aRect, aSide).edge, getPort(bRect, bSide).edge];
  }

  function renderLinks() {
    svg.innerHTML = '';
    const canvasRect = canvas.getBoundingClientRect();
    const rectMap = new Map();
    const obstacles = [];

    state.nodes.forEach(n => {
      const el = nodesLayer.querySelector(`[data-id="${n.id}"]`);
      if (!el) return;
      const base = rectForElement(el, canvasRect, 0);
      base.nodeId = n.id;
      rectMap.set(n.id, base);
      const inflated = rectForElement(el, canvasRect, ROUTE_CLEARANCE);
      inflated.nodeId = n.id;
      obstacles.push(inflated);
    });

    state.links.forEach(l => {
      const a = rectMap.get(l.from);
      const b = rectMap.get(l.to);
      if (!a || !b) return;
      const route = getBestRoute(a, b, obstacles);
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
    if (selected) {
      flash(selected.type === 'choice'
        ? 'Solid line selected. Click “Make Dotted” to change it.'
        : 'Dotted line selected. Click “Make Solid” to change it.');
    } else {
      updateModes();
    }
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
        flash(`Now click the destination box for the ${mode === 'choice' ? 'solid' : 'dotted'} line.`);
        render();
      } else if (linkStartId === id) {
        linkStartId = null;
        flash('Line cancelled.');
        render();
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
      return;
    }

    const node = state.nodes.find(n => n.id === id);
    if (!node) return;
    e.preventDefault();
    const canvasRect = canvas.getBoundingClientRect();
    drag = {
      id,
      before:cloneState(),
      moved:false,
      offsetX:e.clientX - canvasRect.left - node.x,
      offsetY:e.clientY - canvasRect.top - node.y,
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
    const canvasRect = canvas.getBoundingClientRect();
    const node = state.nodes.find(n => n.id === drag.id);
    if (!node) return;
    const nodeRect = drag.el.getBoundingClientRect();
    let nextX = Math.max(0, e.clientX - canvasRect.left - drag.offsetX);
    let nextY = Math.max(0, e.clientY - canvasRect.top - drag.offsetY);

    growCanvasIfNeeded(nextX, nextY, nodeRect.width, nodeRect.height);
    nextX = Math.min(canvas.clientWidth - nodeRect.width, nextX);
    nextY = Math.min(canvas.clientHeight - nodeRect.height, nextY);

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

  function nextUnusedNumber() {
    const used = new Set(state.nodes.map(n => Number(n.number)).filter(Number.isFinite));
    let number = 1;
    while (used.has(number)) number++;
    return number;
  }

  function addNode() {
    recordUndo();
    const id = state.nextId++;
    const number = nextUnusedNumber();
    const stagger = state.nodes.length % 5;
    const x = workspace.scrollLeft + 170 + stagger * 26;
    const y = workspace.scrollTop + 130 + stagger * 58;
    ensureCanvasSize(x, y);
    state.nodes.push({
      id,
      number,
      title:'New story node',
      text:'Double-click to edit this entry.',
      x,
      y,
      map:false
    });
    setMode('move');
    render();
    openEditor(id);
  }

  function deleteNode(id) {
    recordUndo();
    state.nodes = state.nodes.filter(n => n.id !== id);
    state.links = state.links.filter(l => l.from !== id && l.to !== id);
    if (linkStartId === id) linkStartId = null;
    if (editingId === id) {
      editingId = null;
      editor.classList.add('hidden');
    }
    selectedLinkId = null;
    render();
  }

  function openEditor(id) {
    const n = state.nodes.find(n => n.id === id);
    if (!n) return;
    editingId = id;
    editorHeading.textContent = `Edit: ${n.title || 'Untitled'}`;
    document.getElementById('nodeNumber').value = n.number;
    document.getElementById('nodeTitle').value = n.title;
    document.getElementById('nodeText').value = n.text;
    document.getElementById('mapNode').checked = !!n.map;
    editor.classList.remove('hidden');
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
      number: chosenNumber,
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
    editorHeading.textContent = `Edit: ${n.title}`;
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
      choice:'Solid line: click the starting title box, then the destination box.',
      read:'Dotted line: click the starting title box, then the destination box.',
      delete:'Delete mode: click a title box to remove it and its connections.',
      move:'Move mode: drag compact title boxes. Scroll the map to reach more space. Double-click a box to edit the full story.'
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
        state.nodes.forEach(n => {
          n.x = Math.max(0, Number(n.x) || 0);
          n.y = Math.max(0, Number(n.y) || 0);
        });
        ensureCanvasSize();
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
          hint.textContent = selected.type === 'choice'
            ? 'Solid line selected. Click “Make Dotted” to change it.'
            : 'Dotted line selected. Click “Make Solid” to change it.';
          return;
        }
      }
      updateModes();
    }, 2200);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>'"]/g, c => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#039;', '"':'&quot;'
    }[c]));
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
      editingId = null;
      editor.classList.add('hidden');
      canvas.style.width = MIN_CANVAS_WIDTH + 'px';
      canvas.style.height = MIN_CANVAS_HEIGHT + 'px';
      workspace.scrollTo(0, 0);
      render();
    }
  });
  document.getElementById('closeEditorBtn').addEventListener('click', () => editor.classList.add('hidden'));
  document.getElementById('applyNodeBtn').addEventListener('click', applyEditor);

  canvas.addEventListener('pointerdown', e => {
    if (e.target === canvas || e.target === nodesLayer || e.target === svg) {
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
  ensureCanvasSize();
  updateModes();
  render();
  updateUndoButton();
})();
