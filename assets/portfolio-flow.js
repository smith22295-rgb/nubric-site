(() => {
  'use strict';
  const player = document.querySelector('[data-portfolio-player]');
  if (!player) return;
  const covers = [...player.querySelectorAll('.portfolio-card')];
  if (covers.length < 2) return;
  const records = covers.map(card => ({
    name: card.querySelector('h2').textContent.trim(),
    description: card.querySelector('.portfolio-copy p:not(.eyebrow):not(.portfolio-price)').textContent.trim(),
    price: card.querySelector('.portfolio-price').textContent.trim(),
    status: card.querySelector('.eyebrow').textContent.trim(),
    url: card.querySelector('.portfolio-image').getAttribute('href'),
    image: card.querySelector('img').getAttribute('src')
  }));
  // The first frame is rendered in HTML. JavaScript only adds browsing behavior.
  const stage = player.querySelector('.flow-stage');
  const prev = player.querySelector('[data-flow-prev]');
  const next = player.querySelector('[data-flow-next]');
  const count = player.querySelector('.flow-count');
  const dots = [...player.querySelectorAll('[data-flow-dot]')];
  const status = player.querySelector('.flow-status');
  const title = player.querySelector('.flow-title');
  const description = player.querySelector('.flow-description');
  const price = player.querySelector('.flow-price');
  const open = player.querySelector('.flow-open');
  if (!stage || !prev || !next || dots.length !== covers.length) return;
  let current = 0, drag = null, suppressClickUntil = 0;
  const distance = value => ((value + covers.length / 2) % covers.length + covers.length) % covers.length - covers.length / 2;
  const paint = (fraction = 0) => {
    const step = Math.min(stage.clientWidth * .29, 300);
    covers.forEach((card,i) => {
      const d = distance(i - current - fraction), a = Math.abs(d);
      const hidden = a > 2.6;
      card.style.setProperty('--flow-x',`${d * step}px`);
      card.style.setProperty('--flow-z',`${-Math.min(a * 155, 450)}px`);
      card.style.setProperty('--flow-turn',`${-Math.sign(d) * Math.min(a * 58, 58)}deg`);
      card.style.setProperty('--flow-scale',String(1 - Math.min(a * .13,.3)));
      card.style.setProperty('--flow-opacity',hidden ? '0' : '1');
      card.style.setProperty('--flow-layer',String(100 - Math.round(a * 20)));
      card.inert = hidden;
      card.setAttribute('aria-hidden',String(hidden));
    });
  };
  const select = (index,focus=false) => {
    current = ((index % covers.length) + covers.length) % covers.length;
    const record = records[current];
    status.textContent = record.status;
    title.textContent = record.name;
    description.textContent = record.description;
    price.textContent = record.price;
    open.href = record.url;
    open.setAttribute('aria-label',`Open ${record.name} project`);
    count.textContent = `${current+1} / ${covers.length}`;
    try {
      const prior = history.state && typeof history.state==='object' ? history.state : {};
      history.replaceState({...prior,nubricPortfolio:record.url},'');
    } catch (_) { /* Browsing still works when the browser restricts history state. */ }
    covers.forEach((card,i) => {
      const link = card.querySelector('.portfolio-image');
      link.setAttribute('aria-pressed',String(i===current));
      link.tabIndex = i===current ? 0 : -1;
      dots[i].setAttribute('aria-pressed',String(i===current));
    });
    paint();
    if (focus) covers[current].querySelector('.portfolio-image').focus({preventScroll:true});
  };
  covers.forEach((card,i) => {
    const link = card.querySelector('.portfolio-image');
    link.setAttribute('role','button');
    link.setAttribute('aria-label',`Show ${records[i].name}`);
    link.addEventListener('click',event => {
      event.preventDefault();
      if (performance.now() < suppressClickUntil) return;
      select(i);
    });
    link.addEventListener('keydown',event => {
      if (event.key===' ') { event.preventDefault(); select(i); }
    });
  });
  const bindControl = (control, action) => {
    control.setAttribute('role','button');
    control.addEventListener('click',event => { event.preventDefault(); action(); });
    control.addEventListener('keydown',event => {
      if (event.key===' ') { event.preventDefault(); action(); }
    });
  };
  dots.forEach((dot,i) => bindControl(dot,() => select(i)));
  bindControl(prev,() => select(current-1));
  bindControl(next,() => select(current+1));
  stage.addEventListener('keydown',event => {
    let index;
    if (event.key==='ArrowLeft') index=current-1;
    if (event.key==='ArrowRight') index=current+1;
    if (event.key==='Home') index=0;
    if (event.key==='End') index=covers.length-1;
    if (index!==undefined) { event.preventDefault(); select(index,true); }
  });
  stage.addEventListener('dragstart',event=>event.preventDefault());
  stage.addEventListener('pointerdown',event => {
    if (event.button!==0 || !event.isPrimary) return;
    drag={id:event.pointerId,x:event.clientX,y:event.clientY,moved:false};
  });
  stage.addEventListener('pointermove',event => {
    if (!drag || drag.id!==event.pointerId) return;
    const dx=event.clientX-drag.x,dy=event.clientY-drag.y;
    if (!drag.moved && Math.abs(dx)>12 && Math.abs(dx)>Math.abs(dy)*1.2) {
      drag.moved=true;
      stage.setPointerCapture(event.pointerId);
      stage.classList.add('is-dragging');
    }
    if (drag.moved) paint(-dx/Math.min(stage.clientWidth*.29,300));
  });
  const finish = (event,cancelled=false) => {
    if (!drag || drag.id!==event.pointerId) return;
    const dx=event.clientX-drag.x;
    const moved=drag.moved;
    drag=null;
    stage.classList.remove('is-dragging');
    if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    if (moved) {
      suppressClickUntil=performance.now()+300;
      const step = Math.min(stage.clientWidth*.29,300);
      const offset = !cancelled && Math.abs(dx)>Math.min(stage.clientWidth*.1,70)
        ? Math.round(-dx/step) || (dx<0 ? 1 : -1) : 0;
      select(current+offset);
    }
  };
  stage.addEventListener('pointerup',event=>finish(event));
  stage.addEventListener('pointercancel',event=>finish(event,true));
  stage.addEventListener('lostpointercapture',event=>finish(event,true));
  stage.addEventListener('pointerleave',()=>{ if (drag && !drag.moved) drag=null; });
  window.addEventListener('blur',()=>{ if (drag) { drag=null; stage.classList.remove('is-dragging'); paint(); } });
  if ('ResizeObserver' in window) new ResizeObserver(()=>paint()).observe(stage);
  else window.addEventListener('resize',()=>paint());
  const remembered = records.findIndex(record=>record.url===history.state?.nubricPortfolio);
  select(remembered<0 ? 0 : remembered);
})();
