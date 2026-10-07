(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const section = document.getElementById('services');
  if (section && !reduced.matches) {
    if ('IntersectionObserver' in window) {
      const reveal = new IntersectionObserver(entries => {
        if (entries.some(entry=>entry.isIntersecting)) {
          section.classList.add('is-scene-ready');
          reveal.disconnect();
        }
      }, {threshold:.12});
      reveal.observe(section);
    } else section.classList.add('is-scene-ready');
  }

  document.querySelectorAll('#services .service-route').forEach(card => {
    let frame = 0, pointer = null;
    const reset = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      pointer = null;
      card.style.removeProperty('--light-x');
      card.style.removeProperty('--light-y');
      card.style.removeProperty('--tilt-x');
      card.style.removeProperty('--tilt-y');
    };
    card.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse' || reduced.matches) return;
      pointer = {x:event.clientX,y:event.clientY};
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        if (!pointer || !card.isConnected || reduced.matches) return;
        const rect = card.getBoundingClientRect();
        const x = Math.max(0,Math.min(1,(pointer.x-rect.left)/rect.width));
        const y = Math.max(0,Math.min(1,(pointer.y-rect.top)/rect.height));
        card.style.setProperty('--light-x',`${x*100}%`);
        card.style.setProperty('--light-y',`${y*100}%`);
        card.style.setProperty('--tilt-x',`${(0.5-y)*4}deg`);
        card.style.setProperty('--tilt-y',`${(x-0.5)*4}deg`);
      });
    });
    card.addEventListener('pointerleave',reset);
    card.addEventListener('pointercancel',reset);
    card.addEventListener('blur',reset);
    if (reduced.addEventListener) reduced.addEventListener('change',reset);
  });
})();
