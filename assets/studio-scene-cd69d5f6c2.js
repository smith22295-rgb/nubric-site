(() => {
  'use strict';
  const scene = document.querySelector('[data-studio-scene]');
  if (!scene) return;
  const image = scene.querySelector('[data-studio-image]');
  const buttons = [...scene.querySelectorAll('[data-scene-mode]')];
  const status = scene.querySelector('[data-scene-status]');
  let request = 0;
  const sources = {
    day: '/assets/demos/patio-v2/pergola-day.webp',
    evening: '/assets/demos/patio-v2/pergola-evening.webp'
  };
  buttons.forEach(button => button.addEventListener('click', async () => {
    const mode = button.dataset.sceneMode;
    const version = ++request;
    const preview = new Image();
    preview.src = sources[mode];
    scene.setAttribute('aria-busy', 'true');
    try {
      await preview.decode();
      if (version !== request) return;
      image.src = sources[mode];
      image.alt = 'Interactive concept of a Florida pool terrace with a pergola ' + (mode === 'day' ? 'in daylight' : 'with evening lighting');
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        image.animate([{opacity:0.5},{opacity:1}],{duration:280,easing:'ease-out'});
      }
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      status.textContent = mode === 'day' ? 'Daylight preview shown.' : 'Evening lighting preview shown.';
    } catch {
      if (version === request) status.textContent = 'This preview could not load. Please try again.';
    } finally {
      if (version === request) scene.setAttribute('aria-busy', 'false');
    }
  }));
  scene.querySelector('.scene-modes').hidden = false;
})();
