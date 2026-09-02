(() => {
  const mobile = window.matchMedia('(max-width: 700px)');
  const workspace = document.getElementById('workspace');
  const nodesLayer = document.getElementById('nodes');
  const quick = document.getElementById('mobileQuick');
  const quickTitle = document.getElementById('mobileQuickTitle');
  const lineMenu = document.getElementById('mobileLineMenu');
  let selectedNode = null;
  let touchStart = null;
  let linkingTaps = 0;

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
      bubbles:true, cancelable:true, pointerId:77, pointerType:'touch', button:0,
      clientX:r.left + r.width/2, clientY:r.top + r.height/2
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

  document.addEventListener('pointerdown', e => {
    if (!isMobile()) return;
    const node = e.target.closest && e.target.closest('.node');
    if (!node) return;
    if (document.body.classList.contains('mobile-linking')) {
      linkingTaps += 1;
      return;
    }
    if (document.body.classList.contains('mobile-drag-mode')) return;
    e.stopPropagation();
    touchStart = {el:node, x:e.clientX, y:e.clientY, t:Date.now(), pointerId:e.pointerId};
  }, true);

  document.addEventListener('pointerup', e => {
    if (!isMobile() || !touchStart) return;
    const dx = e.clientX - touchStart.x, dy = e.clientY - touchStart.y;
    const wasTap = Math.hypot(dx,dy) < 12 && Date.now() - touchStart.t < 500;
    const el = touchStart.el;
    touchStart = null;
    if (wasTap) {
      e.preventDefault();
      selectNode(el);
    }
  }, true);

  workspace.addEventListener('pointerup', () => {
    if (document.body.classList.contains('mobile-drag-mode')) {
      document.body.classList.remove('mobile-drag-mode');
      document.getElementById('mobileMoveBtn').classList.remove('active');
    }
    if (document.body.classList.contains('mobile-linking') && linkingTaps >= 2) {
      setTimeout(() => {
        document.body.classList.remove('mobile-linking');
        linkingTaps = 0;
      }, 120);
    }
  }, true);

  document.getElementById('mobileAddBtn').addEventListener('click', () => document.getElementById('addNodeBtn').click());
  document.getElementById('mobileSaveBtn').addEventListener('click', () => document.getElementById('saveBtn').click());
  document.getElementById('mobileMoveBtn').addEventListener('click', e => {
    clearSelection();
    lineMenu.classList.add('hidden');
    document.body.classList.toggle('mobile-drag-mode');
    e.currentTarget.classList.toggle('active', document.body.classList.contains('mobile-drag-mode'));
    document.getElementById('resetModeBtn').click();
  });
  document.getElementById('mobileLineBtn').addEventListener('click', () => lineMenu.classList.toggle('hidden'));
  document.getElementById('mobileMoreBtn').addEventListener('click', () => document.getElementById('githubBtn').click());

  document.getElementById('mobileEditBtn').addEventListener('click', () => {
    if (!selectedNode) return;
    selectedNode.dispatchEvent(new MouseEvent('dblclick', {bubbles:true, cancelable:true}));
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
