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
  const make = (tag, cls, text) => {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  };
  const stage = make('div', 'flow-stage');
  stage.setAttribute('role','group');
  stage.setAttribute('aria-label','Project covers. Use left and right arrows to browse.');
  covers.forEach((card, i) => {
    card.classList.add('flow-cover');
    card.style.setProperty('--flow-image',`url("${records[i].image}")`);
    stage.append(card);
  });
  player.prepend(stage);
  const controls = make('div','flow-controls');
  const prev = make('button','flow-arrow','←');
  const next = make('button','flow-arrow','→');
  prev.type = next.type = 'button';
  prev.setAttribute('aria-label','Previous project');
  next.setAttribute('aria-label','Next project');
  const count = make('span','flow-count');
  count.setAttribute('aria-hidden','true');
  controls.append(prev,count,next);
  const pages = make('nav','flow-pagination');
  pages.setAttribute('aria-label','Choose a project');
  const dots = records.map(record => {
    const dot = make('button','flow-dot');
    dot.type = 'button';
    dot.setAttribute('aria-label',record.name);
    dot.title = record.name;
    pages.append(dot);
    return dot;
  });
  const caption = make('div','flow-caption');
  caption.setAttribute('aria-live','polite');
  caption.setAttribute('aria-atomic','true');
  const info = make('div','flow-info');
  const status = make('span','flow-status');
  const title = make('h2','flow-title');
  const description = make('p','flow-description');
  const price = make('p','flow-price');
  const open = make('a','button flow-open','Open project');
  info.append(status,title,description,price);
  caption.append(info,open);
  player.append(controls,pages,make('p','flow-hint','Drag, swipe or use the arrows to explore.'),caption);
  player.classList.add('portfolio-player','is-coverflow');
  player.setAttribute('aria-roledescription','carousel');
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
  dots.forEach((dot,i) => dot.addEventListener('click',() => select(i)));
  prev.addEventListener('click',() => select(current-1));
  next.addEventListener('click',() => select(current+1));
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
