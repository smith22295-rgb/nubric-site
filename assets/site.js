(() => {
  'use strict';
  function setupDialog(dialog, closeSelector) {
    if (!dialog || typeof dialog.showModal !== 'function') return null;
    let opener;
    dialog.querySelector(closeSelector).addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => { document.body.classList.remove('dialog-open'); opener?.focus(); });
    return element => { opener = element; dialog.showModal(); document.body.classList.add('dialog-open'); };
  }
  const showImage = setupDialog(document.getElementById('project-dialog'), '.dialog-close');
  if (showImage) document.querySelectorAll('[data-preview]').forEach(link => link.addEventListener('click', event => {
    event.preventDefault();
    const image = document.getElementById('dialog-image');
    image.src = link.href;
    image.alt = link.querySelector('img')?.alt || link.dataset.title;
    document.getElementById('dialog-title').textContent = link.dataset.title;
    document.getElementById('dialog-caption').textContent = link.dataset.caption;
    showImage(link);
  }));

  const builder = document.getElementById('builder-controls');
  if (builder) {
    builder.addEventListener('submit',event => event.preventDefault());
    const field = name => document.getElementById('demo-' + name);
    const money = value => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
    const materials = {
      blue:{name:'Blue acrylic',fill:'#2359b5',stroke:'#7395ce',text:'#fff',factor:1},
      graphite:{name:'Graphite acrylic',fill:'#35383e',stroke:'#777e89',text:'#fff',factor:1.1},
      metal:{name:'Brushed metal',fill:'url(#metal-finish)',stroke:'#c5c9ce',text:'#15181c',factor:1.45}
    };
    function update() {
      const text = field('text').value.trim().slice(0,24) || 'YOUR TEXT';
      const material = materials[field('material').value];
      const width = Number(field('width').value), height = Number(field('height').value), quantity = Number(field('quantity').value);
      const discount = quantity >= 250 ? .35 : quantity >= 100 ? .3 : quantity >= 50 ? .25 : quantity >= 25 ? .15 : quantity >= 10 ? .08 : 0;
      // Demo prices only. Production ordering tools validate prices on a server.
      const cents = Math.round((3.8 + width * height * .44) * material.factor * (1 - discount) * 100);
      const unit = cents / 100, scale = Math.min(480 / width,230 / height), w = width * scale, h = height * scale;
      const x = (640 - w) / 2, y = (350 - h) / 2;
      const shape = document.getElementById('label-shape');
      Object.entries({x,y,width:w,height:h,fill:material.fill,stroke:material.stroke}).forEach(([k,v]) => shape.setAttribute(k,String(v)));
      document.getElementById('label-hole-left').setAttribute('cx',String(x + 20));
      document.getElementById('label-hole-right').setAttribute('cx',String(x + w - 20));
      const label = document.getElementById('label-text');
      label.textContent = text; label.setAttribute('fill',material.text);
      label.setAttribute('font-size',String(Math.min(48,h * .32,(w - 70) / (text.length * .68))));
      document.getElementById('label-preview-title').textContent = `${material.name} label reading ${text}, ${width} by ${height} inches`;
      document.getElementById('demo-width-value').textContent = width + ' in';
      document.getElementById('demo-height-value').textContent = height + ' in';
      document.getElementById('builder-spec').textContent = `${width} × ${height} in · ${material.name} · ${quantity} ${quantity === 1 ? 'label' : 'labels'}`;
      document.getElementById('builder-total').textContent = money(unit * quantity);
      document.getElementById('builder-unit').textContent = `${money(unit)} each · ${discount ? Math.round(discount * 100) + '% quantity discount' : 'standard quantity pricing'}`;
      const body = `I'm interested in a product builder for my business.\n\nExample I tried:\nText: ${text}\nMaterial: ${material.name}\nDimensions: ${width} × ${height} in\nQuantity: ${quantity}\n\nMy products and pricing rules:\n\nBusiness name:\nPreferred timing:\n`;
      document.getElementById('builder-inquiry').setAttribute('href', 'mailto:info@nubric.dev?subject=Custom%20product%20builder%20inquiry&body=' + encodeURIComponent(body));
    }
    builder.querySelectorAll('input,select').forEach(control => { control.disabled = false; control.addEventListener('input',update); control.addEventListener('change',update); });
    update();
  }

  // Native details menus remain usable without JavaScript.
  const menus = [...document.querySelectorAll('.mobile-menu,.services-menu')];
  menus.forEach(menu => {
    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => { menu.open = false; }));
    menu.addEventListener('toggle', () => { if (menu.open) menus.filter(m => m !== menu).forEach(m => { m.open = false; }); });
  });
  document.addEventListener('click', e => menus.forEach(m => { if (m.open && !m.contains(e.target)) m.open = false; }));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') menus.forEach(m => { if (m.open) { m.open = false; m.querySelector('summary').focus(); } }); });

  const switcher = document.querySelector('.project-switcher');
  if (switcher) {
    const buttons = [...switcher.querySelectorAll('button')];
    const panels = [...document.querySelectorAll('[data-hero-panel]')];
    const select = (index, focus = false) => {
      buttons.forEach((b, i) => { b.setAttribute('aria-selected', String(i === index)); b.tabIndex = i === index ? 0 : -1; panels[i].hidden = i !== index; });
      if (focus) buttons[index].focus();
    };
    switcher.setAttribute('role', 'tablist');
    buttons.forEach((b,i) => {
      b.setAttribute('role', 'tab'); panels[i].setAttribute('role', 'tabpanel'); panels[i].setAttribute('aria-labelledby', b.id);
      b.addEventListener('click', () => select(i));
      b.addEventListener('keydown', e => {
        const keys = {ArrowRight:(i+1)%buttons.length,ArrowLeft:(i+buttons.length-1)%buttons.length,Home:0,End:buttons.length-1};
        if (e.key in keys) { e.preventDefault(); select(keys[e.key],true); }
      });
    });
    select(0); switcher.hidden = false;
  }

  const brief = document.getElementById('project-brief');
  if (brief) {
    const field = name => document.getElementById('brief-' + name);
    const service = field('service');
    const preset = new URLSearchParams(window.location.search).get('service');
    if ([...service.options].some(o => o.value === preset)) service.value = preset;
    document.getElementById('prepare-brief').disabled = false;
    brief.addEventListener('submit', e => {
      e.preventDefault();
      const selected = [...service.options].find(o => o.value === service.value)?.textContent || 'Not sure yet';
      const body = `Hello Nubric,\n\nBusiness: ${field('business').value.trim() || 'To discuss'}\nInterested in: ${selected}\n\nMy ideas:\n${field('notes').value.trim() || 'I would like to talk through a project.'}\n\nBudget or timing:\n${field('timing').value.trim() || 'To discuss'}\n`;
      field('output').value = body;
      const mail = field('email');
      const href = 'mailto:info@nubric.dev?subject=' + encodeURIComponent('Project inquiry: '+ selected) + '&body=' + encodeURIComponent(body);
      // Long drafts are copied into webmail; keep mailto URLs within practical limits.
      mail.setAttribute('href', href.length <= 1900 ? href : 'mailto:info@nubric.dev?subject=Project%20inquiry');
      mail.textContent = href.length <= 1900 ? 'Open email draft' : 'Open email (paste your draft)';
      document.getElementById('copy-status').textContent = href.length <= 1900 ? '' : 'This is a longer draft. Copy the text below into your email app.';
      field('result').hidden = false; field('output').focus();
    });
    document.getElementById('copy-brief').addEventListener('click', async () => {
      const status = document.getElementById('copy-status');
      try { await navigator.clipboard.writeText(field('output').value); status.textContent = 'Draft copied. Paste it into an email to info@nubric.dev.'; }
      catch { field('output').focus(); field('output').select(); status.textContent = 'Select and copy the draft text, then paste it into your email app.'; }
    });
  }
  // Keep earlier shared homepage anchors useful after the move to dedicated pages.
  if (window.location.pathname === '/') {
    const oldRoutes = {'#work':'/work/','#websites':'/websites','#shops':'/online-stores','#launch':'/branding','#logo':'/branding','#custom-tools':'/custom-solutions','#try-builder':'/custom-solutions#try-builder','#process':'/process','#care':'/care','#contact':'/contact','#apps':'/apps','#faq':'/process'};
    if (oldRoutes[window.location.hash]) window.location.replace(oldRoutes[window.location.hash]);
  }
})();
