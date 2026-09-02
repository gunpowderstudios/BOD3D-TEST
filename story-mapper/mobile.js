(() => {
  const mobile = window.matchMedia('(max-width: 700px)');
  const workspace = document.getElementById('workspace');
  const canvas = document.getElementById('canvas');
  const nodesLayer = document.getElementById('nodes');
  const quick = document.getElementById('mobileQuick');
  const quickTitle = document.getElementById('mobileQuickTitle');
  const lineMenu = document.getElementById('mobileLineMenu');

  let selectedNode = null;
  let nodeTapStart = null;
  let blankTapStart = null;
  let lastNodeTap = null;
  let lastBlankTap = null;
  let linkingTaps = 0;
  let activeDoubleDrag = false;
  let syntheticGesture = false;

  const DOUBLE_TAP_MS = 360;
  const TAP_MOVE_LIMIT = 14;

  function isMobile() { return mobile.matches; }

  function clearSelection() {
    if (selectedNode) selectedNode.classList.remove('mobileSelected');
    selectedNode = null;
    quick.classList.add('hidden');
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

  function firePointerDown(el) {
    const r = el.getBoundingClientRect();
    el.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles:true,
      cancelable:true,
      pointerId:77,
      pointerType:'touch',
      button:0,
      clientX:r.left + r.width / 2,
      clientY:r.top + r.height / 2
    }));
  }

  function beginConnection(type) {
    if (!selectedNode) return;
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
    document.getElementById('addNodeBtn').click();
    const el = newestNodeElement();
    if (!el) return;

    const r = el.getBoundingClientRect();
    syntheticGesture = true;
    try {
      el.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles:true,
        cancelable:true,
        pointerId:991,
        pointerType:'touch',
        button:0,
        clientX:r.left + r.width / 2,
        clientY:r.top + r.height / 2
      }));
      el.dispatchEvent(new PointerEvent('pointermove', {
        bubbles:true,
        cancelable:true,
        pointerId:991,
        pointerType:'touch',
        button:0,
        clientX,
        clientY
      }));
      el.dispatchEvent(new PointerEvent('pointerup', {
        bubbles:true,
        cancelable:true,
        pointerId:991,
        pointerType:'touch',
        button:0,
        clientX,
        clientY
      }));
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

      const now = Date.now();
      const id = node.dataset.id;
      const secondTap = lastNodeTap && lastNodeTap.id === id && now - lastNodeTap.t <= DOUBLE_TAP_MS;

      if (secondTap) {
        lastNodeTap = null;
        nodeTapStart = null;
        activeDoubleDrag = true;
        clearSelection();
        lineMenu.classList.add('hidden');
        document.body.classList.add('mobile-drag-mode');
        document.getElementById('resetModeBtn').click();
        return; // allow this second pointerdown to bubble into the mapper drag code
      }

      e.stopPropagation();
      nodeTapStart = {el:node, id, x:e.clientX, y:e.clientY, t:now};
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

    if (activeDoubleDrag) {
      activeDoubleDrag = false;
      document.body.classList.remove('mobile-drag-mode');
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
        lastNodeTap = {id:start.id, t:Date.now()};
        selectNode(start.el);
      } else {
        lastNodeTap = null;
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
      }
    }
  }, true);

  document.addEventListener('pointercancel', () => {
    nodeTapStart = null;
    blankTapStart = null;
    if (activeDoubleDrag) {
      activeDoubleDrag = false;
      document.body.classList.remove('mobile-drag-mode');
    }
  }, true);

  // Prevent the browser/app's normal double-click action from opening the editor on mobile.
  document.addEventListener('dblclick', e => {
    if (!isMobile()) return;
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
  document.getElementById('mobileLineBtn').addEventListener('click', () => lineMenu.classList.toggle('hidden'));
  document.getElementById('mobileMoreBtn').addEventListener('click', () => document.getElementById('githubBtn').click());

  document.getElementById('mobileEditBtn').addEventListener('click', () => {
    if (!selectedNode) return;
    const id = selectedNode.dataset.id;
    const desktopNode = nodesLayer.querySelector(`[data-id="${id}"]`);
    if (!desktopNode) return;
    syntheticGesture = true;
    try {
      desktopNode.dispatchEvent(new MouseEvent('dblclick', {bubbles:true, cancelable:true}));
    } finally {
      syntheticGesture = false;
    }
    quick.classList.add('hidden');
  });

  document.getElementById('mobileSolidBtn').addEventListener('click', () => beginConnection('choice'));
  document.getElementById('mobileDottedBtn').addEventListener('click', () => beginConnection('read'));
  document.getElementById('mobileDeleteBtn').addEventListener('click', () => {
    if (!selectedNode) return;
    if (!confirm('Delete this story box and its connections?')) return;
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
    lineMenu.classList.add('hidden');
    linkingTaps = 0;
    document.body.classList.add('mobile-linking');
    document.getElementById('choiceModeBtn').click();
  });
  document.getElementById('mobileDottedNew').addEventListener('click', () => {
    lineMenu.classList.add('hidden');
    linkingTaps = 0;
    document.body.classList.add('mobile-linking');
    document.getElementById('readModeBtn').click();
  });

  document.addEventListener('click', e => {
    if (!isMobile()) return;
    if (!e.target.closest('.mobileQuick') && !e.target.closest('.node') && !e.target.closest('.mobileBar')) clearSelection();
  });
})();
