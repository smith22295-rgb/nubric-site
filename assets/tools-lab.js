(() => {
  'use strict';
  const root = document.querySelector('.custom-tools-page');
  if (!root) return;
  const choices = [...root.querySelectorAll('input[name="capability"]')];
  const route = { 'ordering-examples':'orders', 'try-builder':'orders', 'ai-examples':'ai', 'calculators':'calculators', 'content-sites':'calculators' };
  const selectFromLink = () => {
    const match = choices.find(choice => choice.value === route[location.hash.slice(1)]);
    if (match) match.checked = true;
  };
  selectFromLink();
  window.addEventListener('hashchange', selectFromLink);
  choices.forEach(choice => choice.addEventListener('change', () => {
    const key = {orders:'try-builder',ai:'ai-examples',calculators:'calculators'}[choice.value];
    try { history.replaceState(history.state,'','#'+key); } catch (_) { /* Native radios still work. */ }
  }));

  const samples = {
    text:['Can I add my own engraving text?','Choose the size and material in the builder, then add your text. The preview changes as you customize your label.'],
    bulk:['I have a spreadsheet of labels. Where do I start?','A bulk request can start with a spreadsheet. You can review the label details before the order is prepared.'],
    person:['I need help with a special request.','I can help with the usual options. A special request can go to the business for a personal answer.']
  };
  const buttons = [...root.querySelectorAll('[data-chat-example]')];
  buttons.forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => {
      const sample = samples[button.dataset.chatExample];
      if (!sample) return;
      root.querySelector('[data-sample-question]').textContent = sample[0];
      root.querySelector('[data-sample-answer]').textContent = sample[1];
      buttons.forEach(b => b.setAttribute('aria-pressed',String(b === button)));
    });
  });

  const form = root.querySelector('[data-estimate-controls]');
  if (form) {
    form.addEventListener('submit', event => event.preventDefault());
    const number = new Intl.NumberFormat('en-US',{maximumFractionDigits:1});
    const money = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
    const update = () => {
      const length = Number(root.querySelector('#estimate-length').value);
      const width = Number(root.querySelector('#estimate-width').value);
      const allowance = Number(root.querySelector('#estimate-allowance').value);
      const valid = [length,width].every(n => Number.isFinite(n) && n >= 1 && n <= 100) && [0,10,15,20].includes(allowance);
      const area = valid ? length * width : 0;
      const quantity = valid ? Math.ceil(area * (100 + allowance) / 100) : 0;
      root.querySelector('[data-estimate-area]').textContent = valid ? `${number.format(area)} sq ft` : '—';
      root.querySelector('[data-estimate-quantity]').textContent = valid ? `${number.format(quantity)} sq ft` : '—';
      root.querySelector('[data-estimate-total]').textContent = valid ? money.format(quantity * 4.5) : '—';
      root.querySelector('[data-estimate-space]').textContent = valid ? `${number.format(length)} × ${number.format(width)} ft` : 'Your space';
      root.querySelector('[data-estimate-note]').textContent = valid ? 'Sample rate: $4.50 per sq ft. Order quantity rounded up to a whole square foot.' : 'Enter a length and width between 1 and 100 feet.';
      const ratio = valid ? length / width : 1;
      const h = Math.min(100,260 / ratio), w = h * ratio;
      const shape = root.querySelector('[data-estimate-shape]');
      Object.entries({x:(300-w)/2,y:(140-h)/2,width:w,height:h}).forEach(([key,value]) => shape.setAttribute(key,String(value)));
    };
    form.querySelectorAll('input,select').forEach(control => {
      control.disabled = false;
      control.addEventListener('input',update);
      control.addEventListener('change',update);
    });
    update();
  }

  const total = document.getElementById('builder-total');
  const summary = root.querySelector('[data-order-summary]');
  const sync = () => { if (total && summary) summary.textContent = total.textContent; };
  root.querySelectorAll('#builder-controls input,#builder-controls select').forEach(control => {
    control.addEventListener('input',sync);
    control.addEventListener('change',sync);
  });
  sync();

  const run = root.querySelector('[data-workflow-run]');
  const canvas = root.querySelector('.workflow-canvas');
  if (run && canvas) {
    let timer;
    run.disabled = false;
    run.addEventListener('click', () => {
      if (run.disabled) return;
      clearTimeout(timer);
      run.disabled = true;
      canvas.classList.add('is-running');
      const finish = () => {
        canvas.classList.remove('is-running');
        canvas.classList.add('is-complete');
        root.querySelector('[data-workflow-result]').textContent = 'Choices checked. Pricing applied. A quote ready for review.';
        run.disabled = false;
      };
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
      else timer = setTimeout(finish,1100);
    });
    window.addEventListener('pagehide',() => { clearTimeout(timer); canvas.classList.remove('is-running'); run.disabled = false; });
  }
})();
