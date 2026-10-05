(() => {
  'use strict';
  document.querySelectorAll('[data-case-tour]').forEach(tour => {
    const panels = [...tour.querySelectorAll('[data-tour-panel]')];
    const tabs = [...tour.querySelectorAll('[data-tour-tab]')];
    const thumbs = [...tour.querySelectorAll('[data-tour-thumb]')];
    const controls = tour.querySelector('.tour-controls');
    if (panels.length < 2 || panels.length !== tabs.length) return;
    let current = 0;
    const select = (next, focus = false, announce = true) => {
      current = (next + panels.length) % panels.length;
      panels.forEach((panel, i) => { panel.hidden = i !== current; });
      tabs.forEach((tab, i) => {
        tab.setAttribute('aria-selected', String(i === current));
        tab.tabIndex = i === current ? 0 : -1;
      });
      thumbs.forEach((button, i) => button.setAttribute('aria-pressed', String(i === current)));
      tour.querySelector('.tour-count').textContent = `${current + 1} / ${panels.length}`;
      if (announce) tour.querySelector('.tour-status').textContent = `View ${current + 1} of ${panels.length}: ${tabs[current].dataset.label}`;
      if (focus) tabs[current].focus({preventScroll:true});
      // Reveal the selected label in its horizontal strip without scrolling the page.
      const strip = tour.querySelector('.tour-selectors');
      const active = tabs[current];
      const left = active.getBoundingClientRect().left - strip.getBoundingClientRect().left + strip.scrollLeft;
      if (left < strip.scrollLeft) strip.scrollLeft = left;
      else if (left + active.offsetWidth > strip.scrollLeft + strip.clientWidth) strip.scrollLeft = left + active.offsetWidth - strip.clientWidth;
    };
    tour.querySelector('.tour-selectors').setAttribute('role','tablist');
    tabs.forEach((tab, i) => {
      tab.setAttribute('role','tab');
      tab.setAttribute('aria-controls',panels[i].id);
      panels[i].setAttribute('role','tabpanel');
      panels[i].setAttribute('aria-labelledby',tab.id);
      tab.addEventListener('click', e => { e.preventDefault(); select(i); });
      tab.addEventListener('keydown', e => {
        let next;
        if(e.key === 'ArrowRight') next = current + 1;
        if(e.key === 'ArrowLeft') next = current - 1;
        if(e.key === 'Home') next = 0;
        if(e.key === 'End') next = panels.length - 1;
        if(next !== undefined) { e.preventDefault(); select(next,true); }
      });
    });
    thumbs.forEach((button, i) => button.addEventListener('click', () => select(i)));
    tour.querySelector('[data-tour-prev]').addEventListener('click', () => select(current - 1));
    tour.querySelector('[data-tour-next]').addEventListener('click', () => select(current + 1));
    tour.classList.add('is-interactive');
    controls.hidden = false;
    select(0,false,false);
  });
})();
