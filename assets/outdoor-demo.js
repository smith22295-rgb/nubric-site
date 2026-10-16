(() => {
  'use strict';
  const demo = document.querySelector('[data-outdoor-demo]');
  if (!demo) return;
  const controls = demo.querySelector('.outdoor-controls');
  const stage = demo.querySelector('[data-photo-scene]');
  const finishes = {ivory:'Ivory', sand:'Sand', slate:'Slate'};
  const scenes = {
    'open-day':'/assets/demos/patio-v2/open-day.webp',
    'pergola-day':'/assets/demos/patio-v2/pergola-day.webp',
    'open-evening':'/assets/demos/patio-v2/open-evening.webp',
    'pergola-evening':'/assets/demos/patio-v2/pergola-evening.webp'
  };
  const pergola = demo.querySelector('[name="patio-pergola"]');
  const evening = demo.querySelector('[name="patio-evening"]');
  const review = demo.querySelector('.patio-review');
  const brief = demo.querySelector('#patio-brief');
  const status = demo.querySelector('[data-patio-status]');
  const caption = demo.querySelector('[data-scene-caption]');
  const errorMessage = demo.querySelector('[data-patio-error]');
  const pending = new Map();
  let current = {pergola:true, evening:false};
  let revision = 0;
  const sceneKey = (state) => `${state.pergola ? 'pergola' : 'open'}-${state.evening ? 'evening' : 'day'}`;

  // Decode a requested view before revealing it. Reuse loaded views and keep
  // the last good image visible if the connection is slow or a request fails.
  const loadScene = (key) => {
    if (pending.has(key)) return pending.get(key);
    const request = new Promise((resolve, reject) => {
      const photo = new Image();
      let settled = false;
      const timeout = window.setTimeout(() => fail(), 15000);
      function fail() {
        if (settled) return;
        settled = true;
        window.clearTimeout(timeout);
        photo.onload = photo.onerror = null;
        reject(new Error('Scene unavailable'));
      }
      photo.onload = async () => {
        try {
          await photo.decode();
          if (settled) return;
          window.clearTimeout(timeout);
          photo.onload = photo.onerror = null;
          let layer = stage.querySelector(`[data-scene="${key}"]`);
          if (!layer) {
            layer = document.createElement('div');
            layer.className = 'outdoor-photo';
            layer.dataset.scene = key;
            layer.setAttribute('aria-hidden', 'true');
            photo.alt = '';
            photo.width = 1536;
            photo.height = 1024;
            const surface = photo.cloneNode();
            surface.className = 'patio-surface';
            layer.append(photo, surface);
            stage.append(layer);
          }
          settled = true;
          resolve(layer);
        } catch { fail(); }
      };
      photo.onerror = fail;
      photo.src = scenes[key];
    }).catch((error) => { pending.delete(key); throw error; });
    pending.set(key, request);
    return request;
  };

  const describe = () => {
    const selected = demo.querySelector('[name="patio-finish"]:checked')?.value;
    const finish = Object.hasOwn(finishes, selected) ? selected : 'ivory';
    demo.dataset.finish = finish;
    demo.dataset.pergola = String(current.pergola);
    demo.dataset.evening = String(current.evening);
    const article = finish === 'ivory' ? 'an' : 'a';
    const description = `${finishes[finish]} terrace · ${current.pergola ? 'Pergola' : 'Open sky'} · ${current.evening ? 'Evening' : 'Daylight'}`;
    caption.textContent = description;
    stage.setAttribute('aria-label', `Florida patio with ${article} ${finishes[finish].toLowerCase()} stone terrace, ${current.pergola ? 'a pergola' : 'an open lounge'} and ${current.evening ? 'evening lighting' : 'daylight'}`);
    const choices = [`${article} ${finishes[finish].toLowerCase()} stone terrace`, 'poolside seating'];
    if (current.pergola) choices.push('a pergola');
    if (current.evening) choices.push('evening lighting');
    const list = choices.length === 2 ? choices.join(' and ') : `${choices.slice(0, -1).join(', ')}, and ${choices.at(-1)}`;
    demo.querySelector('[data-patio-brief]').textContent = `I’d like to discuss a patio with ${list}.${current.pergola ? '' : ' Please keep the lounge open to the sky.'} Please get in touch to talk through the options.`;
    return description;
  };
  const setBusy = (busy) => {
    stage.setAttribute('aria-busy', String(busy));
    demo.classList.toggle('is-loading', busy);
    review.disabled = busy;
  };
  const update = async (announce = true) => {
    const request = ++revision;
    errorMessage.hidden = true;
    const next = {pergola:pergola.checked, evening:evening.checked};
    const description = describe();
    if (sceneKey(next) === sceneKey(current)) {
      setBusy(false);
      if (announce) status.textContent = `Preview updated: ${description}.`;
      return;
    }
    setBusy(true);
    status.textContent = 'Loading your view…';
    try {
      const layer = await loadScene(sceneKey(next));
      // A faster second choice must never be overwritten by an older download.
      if (request !== revision) return;
      current = next;
      stage.querySelectorAll('.outdoor-photo').forEach((photo) => photo.classList.toggle('is-visible', photo === layer));
      status.textContent = `Preview updated: ${describe()}.`;
    } catch {
      if (request !== revision) return;
      pergola.checked = current.pergola;
      evening.checked = current.evening;
      describe();
      errorMessage.textContent = 'That view couldn’t load. Your previous view is still here; try the option again.';
      errorMessage.hidden = false;
    } finally {
      if (request === revision) setBusy(false);
    }
  };
  controls.addEventListener('change', () => update());
  review.addEventListener('click', () => {
    const open = brief.hidden;
    brief.hidden = !open;
    review.setAttribute('aria-expanded', String(open));
    review.textContent = open ? 'Close the inquiry' : 'Preview the inquiry';
    if (open) brief.scrollIntoView({behavior:'instant',block:'nearest'});
  });
  // Warm the alternate views only after someone approaches the controls.
  // Save-Data connections download just the view that was requested.
  const warmScenes = () => {
    if (navigator.connection?.saveData) return;
    Object.keys(scenes).filter((key) => key !== sceneKey(current)).forEach((key) => loadScene(key).catch(() => {}));
  };
  controls.addEventListener('pointerenter', warmScenes, {once:true});
  controls.addEventListener('focusin', warmScenes, {once:true});
  controls.hidden = false;
  demo.classList.add('is-ready');
  update(false);
})();
