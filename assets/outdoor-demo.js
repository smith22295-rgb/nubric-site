(() => {
  'use strict';
  const demo = document.querySelector('[data-outdoor-demo]');
  if (!demo) return;
  const controls = demo.querySelector('.outdoor-controls');
  const finishes = {shellstone:'Shellstone', driftwood:'Driftwood', charcoal:'Charcoal'};
  const pergola = demo.querySelector('[name="patio-pergola"]');
  const evening = demo.querySelector('[name="patio-evening"]');
  const review = demo.querySelector('.patio-review');
  const brief = demo.querySelector('#patio-brief');
  const update = (announce = true) => {
    const selected = demo.querySelector('[name="patio-finish"]:checked')?.value;
    const finish = Object.hasOwn(finishes, selected) ? selected : 'shellstone';
    demo.dataset.finish = finish;
    demo.dataset.pergola = String(pergola.checked);
    demo.dataset.evening = String(evening.checked);
    const caption = `${finishes[finish]} · ${pergola.checked ? 'Pergola' : 'Open sky'} · ${evening.checked ? 'Evening' : 'Daylight'}`;
    demo.querySelector('[data-scene-caption]').textContent = caption;
    demo.querySelector('#outdoor-scene-title').textContent = `Outdoor space with ${finishes[finish].toLowerCase()} decking, ${pergola.checked ? 'a pergola' : 'an open lounge'} and ${evening.checked ? 'evening lighting' : 'daylight'}`;
    const choices = [`${finishes[finish].toLowerCase()} decking`, 'poolside seating'];
    if (pergola.checked) choices.push('a pergola');
    if (evening.checked) choices.push('evening lighting');
    const description = choices.length === 2 ? choices.join(' and ') : `${choices.slice(0, -1).join(', ')}, and ${choices.at(-1)}`;
    demo.querySelector('[data-patio-brief]').textContent = `I’d like to discuss a patio with ${description}.${pergola.checked ? '' : ' Please keep the lounge open to the sky.'} Please get in touch to talk through the options.`;
    if (announce) demo.querySelector('[data-patio-status]').textContent = `Preview updated: ${caption}.`;
  };
  controls.addEventListener('change', () => update());
  review.addEventListener('click', () => {
    const open = brief.hidden;
    brief.hidden = !open;
    review.setAttribute('aria-expanded', String(open));
    review.textContent = open ? 'Close the inquiry' : 'Preview the inquiry';
    if (open) brief.scrollIntoView({behavior:'instant',block:'nearest'});
  });
  update(false);
  controls.hidden = false;
  demo.classList.add('is-ready');
})();
