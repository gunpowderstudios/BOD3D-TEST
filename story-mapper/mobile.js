(() => {
  const mobile = window.matchMedia('(max-width: 700px)');
  const workspace = document.getElementById('workspace');
  const canvas = document.getElementById('canvas');
  const nodesLayer = document.getElementById('nodes');
  const quick = document.getElementById('mobileQuick');
  const quickTitle = document.getElementById('mobileQuickTitle');
  const lineMenu = document.getElementById('mobileLineMenu');

  let selectedNode = null;
  let armedNode = null;
  let nodeTapStart = null;
  let blankTapStart = null;
  let lastBlankTap = null;
  let linkingTaps = 0;
  let draggingArmedNode = false;
  let syntheticGesture = false;

  const DOUBLE_TAP_MS = 420;
  const TAP_MOVE_LIMIT = 14;

  function isMobile() { return mobile.matches; }

  function clearSelection() {
    if (selectedNode) selectedNode.classList.remove('mobileSelected');
    selectedNode = null;
    quick.classList.add('hidden');
  }

  function clearArmed() {
    if (armedNode) armedNode.classList.remove('mobileMoveArmed');
    armedNode = null;
    document.body.classList.remove('mobile-drag-mode');
  }

  function selectNode(el) {
    clearSelection();
    selectedNode = el;
    el.classList.add('mobileSelected');
    const title = el.querySelector('.title')?.textContent || 'Story';
    const number = el.querySelector('.bubble')?.textContent || '';
    quickTitle.textContent = `${number} ${title}`.trim();
    quick.classList.remove('hidden');
  }

  function armSelectedNode() {
    if (!selectedNode) return;
    clearArmed();
    armedNode = selectedNode;
    armedNode.classList.remove('mobileSelected');
    armedNode.classList.add('mobileMoveArmed');
    selectedNode = null;
    quick.classList.add('hidden');
    lineMenu.classList.add('hidden');
    document.body.classList.add('mobile-drag-mode');
    document.getElementById('resetModeBtn').click();
    const hint = document.getElementById('hint');
    if (hint) hint.textContent = 'Move ready — touch the glowing box and drag it.';
  }

  function firePointerDown(el) {
    const r = el.getBoundingClientRect();
    el.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles:true, cancelable:true, pointerId:77, pointerType:'touch', button:0,
      clientX:r.left + r.width / 2, clientY:r.top + r.height / 2
    }));
  }

  function beginConnection(type) {
    if (!selectedNode) return;
    clearArmed();
    linkingTaps = 0;
    document.body.classList.add('mobile-linking');
    document.getElementById(type === 'choice' ? 'choiceModeBtn' : 'readModeBtn').click();
    firePointerDown(selectedNode);
    quick.classList.add('hidden');
    lineMenu.classList.add('hidden');
  }

  function isBlankTarget(target) {
    if (!target || !target.closest) return false;
    if (target.closest('.node, .linkHit, .mobileBar, .mobileQuick, .mobileLineMenu, .editor, .githubPanel')) return false;
    return target === workspace || target === canvas || target === nodesLayer || target === document.getElementById('links');
  }

  function newestNodeElement() {
    const nodes = [...nodesLayer.querySelectorAll('.node')];
    return nodes.sort((a,b) => Number(b.dataset.id || 0) - Number(a.dataset.id || 0))[0] || null;
  }

  function addNoteAt(clientX, clientY) {
    clearArmed();
    document.getElementById('addNodeBtn').click();
    const el = newestNodeElement();
    if (!el) return;
    const r = el.getBoundingClientRect();
    syntheticGesture = true;
    try {
      el.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true,cancelable:true,pointerId:991,pointerType:'touch',button:0,clientX:r.left+r.width/2,clientY:r.top+r.height/2}));
      el.dispatchEvent(new PointerEvent('pointermove', {bubbles:true,cancelable:true,pointerId:991,pointerType:'touch',button:0,clientX,clientY}));
      el.dispatchEvent(new PointerEvent('pointerup', {bubbles:true,cancelable:true,pointerId:991,pointerType:'touch',button:0,clientX,clientY}));
    } finally {
      syntheticGesture = false;
    }
    clearSelection();
  }

  document.addEventListener('pointerdown', e => {
    if (!isMobile() || syntheticGesture) return;
    const node = e.target.closest && e.target.closest('.node');

    if (node) {
      if (document.body.classList.contains('mobile-linking')) {
        linkingTaps += 1;
        return;
      }
      if (armedNode === node) {
        draggingArmedNode = true;
        return;
      }
      e.stopPropagation();
      nodeTapStart = {el:node, x:e.clientX, y:e.clientY, t:Date.now()};
      blankTapStart = null;
      return;
    }

    if (isBlankTarget(e.target)) {
      blankTapStart = {x:e.clientX, y:e.clientY, t:Date.now()};
      nodeTapStart = null;
    }
  }, true);

  document.addEventListener('pointerup', e => {
    if (!isMobile() || syntheticGesture) return;

    if (draggingArmedNode) {
      draggingArmedNode = false;
      clearArmed();
      return;
    }

    if (nodeTapStart) {
      const dx = e.clientX - nodeTapStart.x;
      const dy = e.clientY - nodeTapStart.y;
      const wasTap = Math.hypot(dx,dy) < TAP_MOVE_LIMIT && Date.now() - nodeTapStart.t < 500;
      const start = nodeTapStart;
      nodeTapStart = null;
      if (wasTap) {
        e.preventDefault();
        clearArmed();
        selectNode(start.el);
      }
      return;
    }

    if (blankTapStart) {
      const dx = e.clientX - blankTapStart.x;
      const dy = e.clientY - blankTapStart.y;
      const wasTap = Math.hypot(dx,dy) < TAP_MOVE_LIMIT && Date.now() - blankTapStart.t < 500;
      const start = blankTapStart;
      blankTapStart = null;
      if (!wasTap) {
        lastBlankTap = null;
        return;
      }
      const now = Date.now();
      const isDouble = lastBlankTap && now - lastBlankTap.t <= DOUBLE_TAP_MS && Math.hypot(e.clientX-lastBlankTap.x, e.clientY-lastBlankTap.y) < 42;
      if (isDouble) {
        e.preventDefault();
        lastBlankTap = null;
        addNoteAt(e.clientX, e.clientY);
      } else {
        lastBlankTap = {x:start.x, y:start.y, t:now};
        clearSelection();
        clearArmed();
      }
    }
  }, true);

  document.addEventListener('pointercancel', () => {
    nodeTapStart = null;
    blankTapStart = null;
    draggingArmedNode = false;
    clearArmed();
  }, true);

  document.addEventListener('dblclick', e => {
    if (!isMobile() || syntheticGesture) return;
    if (e.target.closest && e.target.closest('.node')) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  workspace.addEventListener('pointerup', () => {
    if (document.body.classList.contains('mobile-linking') && linkingTaps >= 2) {
      setTimeout(() => {
        document.body.classList.remove('mobile-linking');
        linkingTaps = 0;
      }, 120);
    }
  }, true);

  document.getElementById('mobileAddBtn').addEventListener('click', () => document.getElementById('addNodeBtn').click());
  document.getElementById('mobileSaveBtn').addEventListener('click', () => document.getElementById('saveBtn').click());
  document.getElementById('mobileMoveBtn').addEventListener('click', () => {
    clearSelection();
    clearArmed();
    document.body.classList.add('mobile-drag-mode');
    document.getElementById('mobileMoveBtn').classList.add('active');
    document.getElementById('resetModeBtn').click();
  });
  document.getElementById('mobileLineBtn').addEventListener('click', () => lineMenu.classList.toggle('hidden'));
  document.getElementById('mobileMoreBtn').addEventListener('click', () => document.getElementById('githubBtn').click());

  document.getElementById('mobileEditBtn').addEventListener('click', () => {
    if (!selectedNode) return;
    const node = selectedNode;
    syntheticGesture = true;
    try { node.dispatchEvent(new MouseEvent('dblclick', {bubbles:true, cancelable:true})); }
    finally { syntheticGesture = false; }
    quick.classList.add('hidden');
  });
  document.getElementById('mobileMoveNodeBtn').addEventListener('click', armSelectedNode);
  document.getElementById('mobileSolidBtn').addEventListener('click', () => beginConnection('choice'));
  document.getElementById('mobileDottedBtn').addEventListener('click', () => beginConnection('read'));
  document.getElementById('mobileDeleteBtn').addEventListener('click', () => {
    if (!selectedNode) return;
    if (!confirm('Delete this story box and its connections?')) return;
    clearArmed();
    document.body.classList.add('mobile-linking');
    linkingTaps = 0;
    document.getElementById('deleteModeBtn').click();
    firePointerDown(selectedNode);
    document.getElementById('resetModeBtn').click();
    document.body.classList.remove('mobile-linking');
    linkingTaps = 0;
    clearSelection();
  });
  document.getElementById('mobileCloseQuick').addEventListener('click', clearSelection);

  document.getElementById('mobileSolidNew').addEventListener('click', () => {
    clearArmed(); lineMenu.classList.add('hidden'); linkingTaps = 0;
    document.body.classList.add('mobile-linking');
    document.getElementById('choiceModeBtn').click();
  });
  document.getElementById('mobileDottedNew').addEventListener('click', () => {
    clearArmed(); lineMenu.classList.add('hidden'); linkingTaps = 0;
    document.body.classList.add('mobile-linking');
    document.getElementById('readModeBtn').click();
  });
})();
