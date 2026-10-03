(() => {
  'use strict';
  const clamp = n => Math.max(0, Math.min(1, n));

  document.querySelectorAll('[data-compare]').forEach(demo => {
    const range = demo.querySelector('input[type=range]');
    const output = demo.querySelector('output');
    const stage = demo.querySelector('.comparison-stage');
    const presets = [...demo.querySelectorAll('[data-reveal]')];
    const update = () => {
      const value = Math.round(clamp(Number(range.value) / 100) * 100);
      demo.style.setProperty('--reveal', value + '%');
      output.textContent = value + '%';
      presets.forEach(b => b.setAttribute('aria-pressed', String(Number(b.dataset.reveal) === value)));
    };
    let dragging = false;
    const move = event => {
      const rect = stage.getBoundingClientRect();
      if (!rect.width) return;
      range.value = String(Math.round(clamp((event.clientX - rect.left) / rect.width) * 100));
      update();
    };
    stage.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      dragging = true;
      stage.setPointerCapture?.(event.pointerId);
      move(event);
      range.focus({preventScroll: true});
    });
    stage.addEventListener('pointermove', event => { if (dragging) move(event); });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => stage.addEventListener(type, () => { dragging = false; }));
    presets.forEach(button => {
      button.disabled = false;
      button.addEventListener('click', () => { range.value = button.dataset.reveal; update(); });
    });
    range.disabled = false;
    range.addEventListener('input', update);
    update();
  });

  const preference = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const reduce = document.getElementById('reduce-effects');
  let manualReduced = false;
  const reduced = () => Boolean(preference?.matches || manualReduced);

  const lightStage = document.getElementById('light-stage');
  const light = document.getElementById('light-position');
  const angle = document.getElementById('card-angle');
  if (lightStage) {
    const reset = document.getElementById('reset-light');
    [light, angle, reset].forEach(control => { control.disabled = false; });
    const updateLight = () => {
      lightStage.style.setProperty('--light-x', light.value + '%');
      lightStage.style.setProperty('--light-y', '40%');
      lightStage.style.setProperty('--tilt-y', angle.value + 'deg');
      lightStage.style.setProperty('--tilt-x', '0deg');
    };
    light.addEventListener('input', updateLight);
    angle.addEventListener('input', updateLight);
    lightStage.addEventListener('pointermove', event => {
      if (event.pointerType === 'touch' || reduced()) return;
      const r = lightStage.getBoundingClientRect();
      const x = clamp((event.clientX - r.left) / r.width), y = clamp((event.clientY - r.top) / r.height);
      lightStage.style.setProperty('--light-x', x * 100 + '%');
      lightStage.style.setProperty('--light-y', y * 100 + '%');
      lightStage.style.setProperty('--tilt-y', (x - .5) * 18 + 'deg');
      lightStage.style.setProperty('--tilt-x', (.5 - y) * 12 + 'deg');
    });
    lightStage.addEventListener('pointerleave', updateLight);
    reset.addEventListener('click', () => { light.value = '50'; angle.value = '0'; updateLight(); });
    updateLight();
  }

  const stage = document.getElementById('motion-stage');
  if (!stage || !reduce) return;
  const play = document.getElementById('play-motion');
  const pause = document.getElementById('pause-motion');
  const timeline = document.getElementById('motion-timeline');
  const percent = document.getElementById('motion-percent');
  const status = document.getElementById('motion-status');
  const chapters = [...document.querySelectorAll('[data-chapter]')];
  const phaseNames = ['The foundation', 'The first impression', 'The finishing details'];
  const duration = 7200;
  let position = 1, frameId = null, origin = 0, state = 'ready', phase = -1;
  const ease = n => 1 - Math.pow(1 - clamp(n), 3);
  const part = (p, from, to) => ease((p - from) / (to - from));

  function render(p) {
    position = clamp(p);
    const layers = {
      frame: part(position, 0, .3),
      image: part(position, .14, .57),
      copy: part(position, .36, .73),
      details: part(position, .58, .93),
      settle: part(position, .76, 1),
      progress: position
    };
    Object.entries(layers).forEach(([key, value]) => stage.style.setProperty('--' + key, value.toFixed(4)));
    const value = Math.round(position * 100);
    timeline.value = String(value);
    percent.textContent = value + '%';
    const nextPhase = position < .32 ? 0 : position < .7 ? 1 : 2;
    timeline.setAttribute('aria-valuetext', value + '% — ' + phaseNames[nextPhase]);
    if (nextPhase !== phase) {
      phase = nextPhase;
      chapters.forEach((item, index) => {
        if (index === phase) item.setAttribute('aria-current', 'step');
        else item.removeAttribute('aria-current');
      });
    }
  }

  function stop() {
    if (frameId !== null) window.cancelAnimationFrame(frameId);
    frameId = null;
    stage.classList.remove('is-playing');
  }
  function tick(now) {
    if (state !== 'playing') return;
    render((now - origin) / duration);
    if (position >= 1) {
      stop(); state = 'complete'; pause.disabled = true; pause.textContent = 'Pause';
      play.textContent = 'Replay animation'; status.textContent = 'The scene is complete. Replay it, or move the timeline to explore a moment.';
    } else frameId = window.requestAnimationFrame(tick);
  }
  function start(p) {
    if (reduced()) return;
    stop(); render(p); state = 'playing'; origin = window.performance.now() - position * duration;
    stage.classList.add('is-playing'); pause.disabled = false; pause.textContent = 'Pause';
    play.textContent = 'Replay animation'; status.textContent = 'Playing the website build. Pause it or take control with the timeline.';
    frameId = window.requestAnimationFrame(tick);
  }
  function pauseAtCurrent(message) {
    stop(); state = 'paused'; pause.disabled = position >= 1; pause.textContent = 'Resume';
    status.textContent = message;
  }
  function applyPreference() {
    stop();
    const isReduced = reduced();
    document.body.classList.toggle('effects-reduced', isReduced);
    reduce.checked = isReduced;
    play.disabled = isReduced;
    timeline.disabled = isReduced;
    if (angle) angle.disabled = isReduced;
    state = isReduced ? 'reduced' : 'ready';
    render(1); pause.disabled = true; pause.textContent = 'Pause';
    status.textContent = isReduced
      ? 'Reduced motion is on. The complete design stays visible without movement.'
      : 'The finished concept is shown. Play the animation or explore it with the timeline.';
  }

  play.addEventListener('click', () => {
    start(0);
    if (!reduced()) stage.scrollIntoView?.({behavior: 'smooth', block: 'center'});
  });
  pause.addEventListener('click', () => {
    if (reduced()) return;
    if (state === 'playing') pauseAtCurrent('Animation paused. Resume or explore a different moment with the timeline.');
    else start(position >= 1 ? 0 : position);
  });
  timeline.addEventListener('input', () => {
    if (reduced()) return;
    stop(); render(Number(timeline.value) / 100);
    pauseAtCurrent('Timeline preview: ' + phaseNames[phase].toLowerCase() + '. Resume to play from here.');
  });
  reduce.disabled = false;
  reduce.addEventListener('change', () => { manualReduced = reduce.checked; applyPreference(); });
  preference?.addEventListener('change', applyPreference);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state === 'playing') pauseAtCurrent('Animation paused while this page was in the background.');
  });
  window.addEventListener('pagehide', stop);
  applyPreference();
})();
