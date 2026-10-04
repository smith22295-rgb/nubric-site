(() => {
  'use strict';
  const effects = [...document.querySelectorAll('[data-home-effect]')];
  if (!effects.length) return;
  const clamp = n => Math.max(0, Math.min(1, n));
  const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const reduced = () => Boolean(preference?.matches);

  effects.forEach(effect => {
    const hint = effect.querySelector('[data-effect-hint]');
    const offer = effect.querySelector('[data-effect-offer]');
    let discovered = false;
    const discover = () => {
      if (discovered) return;
      discovered = true;
      hint.hidden = true;
      offer.hidden = false;
      offer.classList.add('is-revealed');
    };

    if (effect.hasAttribute('data-home-depth')) {
      const scene = effect.querySelector('.hero-showcase');
      const tryButton = effect.querySelector('[data-try-depth]');
      let frame = 0, position = null, alternate = false, autoPlayed = false;
      const paint = () => {
        frame = 0;
        if (!position) return;
        effect.style.setProperty('--depth-x', position.x * 100 + '%');
        effect.style.setProperty('--depth-y', position.y * 100 + '%');
        effect.style.setProperty('--depth-rx', reduced() ? '0deg' : (0.5 - position.y) * 5 + 'deg');
        effect.style.setProperty('--depth-ry', reduced() ? '0deg' : (position.x - 0.5) * 7 + 'deg');
      };
      const reset = () => {
        if (frame) window.cancelAnimationFrame(frame);
        frame = 0; position = null;
        effect.classList.remove('is-depth-active', 'is-depth-preview');
        tryButton.textContent = 'Replay effect';
        [['--depth-x','50%'],['--depth-y','35%'],['--depth-rx','0deg'],['--depth-ry','0deg']].forEach(([k,v]) => effect.style.setProperty(k,v));
      };
      scene.addEventListener('pointerenter', event => {
        if (event.pointerType === 'touch') return;
        effect.classList.add('is-depth-active'); discover();
      });
      scene.addEventListener('pointermove', event => {
        if (event.pointerType === 'touch') return;
        effect.classList.remove('is-depth-preview');
        const rect = scene.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        position = {x:clamp((event.clientX - rect.left) / rect.width),y:clamp((event.clientY - rect.top) / rect.height)};
        if (!frame) frame = window.requestAnimationFrame(paint);
      });
      scene.addEventListener('pointerleave', () => { if (!effect.classList.contains('is-depth-preview')) reset(); });
      scene.addEventListener('pointercancel', reset);
      effect.addEventListener('focusin', discover);
      const play = () => {
        if (effect.classList.contains('is-depth-preview')) { reset(); return; }
        autoPlayed = true;
        alternate = !alternate;
        if (frame) window.cancelAnimationFrame(frame);
        position = alternate ? {x:.78,y:.23} : {x:.22,y:.68};
        effect.classList.add('is-depth-active'); paint(); discover();
        if (!reduced()) {
          effect.classList.add('is-depth-preview');
          tryButton.textContent = 'Stop effect';
        } else tryButton.textContent = 'Preview lighting';
      };
      tryButton.addEventListener('click', play);
      scene.addEventListener('animationend', event => {
        if (event.target === scene && event.animationName === 'home-depth-preview') reset();
      });
      // One short demonstration when the mobile preview enters view. No looping or scroll capture.
      if (window.IntersectionObserver) {
        const observer = new window.IntersectionObserver(entries => {
          if (!entries.some(entry => entry.isIntersecting && entry.intersectionRatio >= .85)) return;
          if (!autoPlayed && !reduced() && window.matchMedia?.('(max-width: 850px), (hover: none)').matches) play();
          observer.disconnect();
        }, {threshold:.85});
        observer.observe(scene);
      }
      effect.addEventListener('focusout', event => { if (!effect.contains(event.relatedTarget)) reset(); });
      preference?.addEventListener?.('change', reset);
      tryButton.hidden = false;
    }

    if (effect.hasAttribute('data-home-compare')) {
      const stage = effect.querySelector('[data-home-compare-stage]');
      const range = effect.querySelector('input[type=range]');
      const output = effect.querySelector('output');
      let dragging = false;
      const update = () => {
        const value = Math.round(clamp(Number(range.value) / 100) * 100);
        effect.style.setProperty('--home-reveal', value + '%');
        output.textContent = value + '% after';
        range.setAttribute('aria-valuetext', value + '% of the after concept revealed');
      };
      const move = event => {
        const rect = stage.getBoundingClientRect();
        if (!rect.width) return;
        range.value = String(Math.round(clamp((event.clientX - rect.left) / rect.width) * 100));
        update(); discover();
      };
      stage.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') discover(); });
      stage.addEventListener('pointerdown', event => {
        if (event.button !== 0 || event.isPrimary === false) return;
        dragging = true;
        stage.setPointerCapture?.(event.pointerId);
        range.focus({preventScroll:true}); move(event);
      });
      stage.addEventListener('pointermove', event => { if (dragging) move(event); });
      ['pointerup','pointercancel','lostpointercapture'].forEach(type => stage.addEventListener(type, () => { dragging = false; }));
      range.addEventListener('input', () => { update(); discover(); });
      range.addEventListener('focus', discover);
      // Browsers restore range values after scripts run when navigating back.
      window.addEventListener('pageshow', update);
      update(); range.disabled = false;
    }

    hint.hidden = false; offer.hidden = true;
  });
})();
