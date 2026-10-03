(() => {
  'use strict';
  const menu = document.querySelector('.mobile-menu');
  menu?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menu.open = false; }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.open) { menu.open = false; menu.querySelector('summary').focus(); }
  });
  document.addEventListener('click', event => { if (menu?.open && !menu.contains(event.target)) menu.open = false; });

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

  const tabs = document.querySelector('.project-tabs');
  if (tabs) {
    const buttons = [...tabs.querySelectorAll('button')];
    const panels = [...document.querySelectorAll('[data-project-panel]')];
    function select(index, focus = false) {
      buttons.forEach((b,i) => { b.setAttribute('aria-selected',String(i === index)); b.tabIndex = i === index ? 0 : -1; panels[i].hidden = i !== index; });
      if (focus) buttons[index].focus();
    }
    tabs.setAttribute('role','tablist');
    buttons.forEach((button,index) => {
      button.setAttribute('role','tab'); button.setAttribute('aria-controls',panels[index].id);
      panels[index].setAttribute('role','tabpanel'); panels[index].setAttribute('aria-labelledby',button.id);
      button.addEventListener('click',() => select(index));
      button.addEventListener('keydown',event => {
        const targets = {ArrowRight:(index + 1) % buttons.length, ArrowLeft:(index + buttons.length - 1) % buttons.length, Home:0, End:buttons.length - 1};
        if (event.key in targets) { event.preventDefault(); select(targets[event.key],true); }
      });
    });
    document.querySelector('.work-grid').classList.add('portfolio-enhanced'); select(0); tabs.hidden = false;
  }

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
      document.getElementById('builder-inquiry').href = 'mailto:info@nubric.dev?subject=Custom%20product%20builder%20inquiry&body=' + encodeURIComponent(body);
    }
    builder.querySelectorAll('input,select').forEach(control => { control.disabled = false; control.addEventListener('input',update); control.addEventListener('change',update); });
    update();
  }

  const guide = document.getElementById('project-guide');
  const showGuide = setupDialog(guide,'[data-close-guide]');
  if (showGuide) {
    const conversation = document.getElementById('guide-conversation'), choices = document.getElementById('guide-choices'), result = document.getElementById('guide-result');
    let answers = [];
    function message(text,user = false) {
      const p = document.createElement('p'); p.className = 'guide-message' + (user ? ' user-message' : ''); p.textContent = text; conversation.append(p);
    }
    function question(text,options,focus = true) {
      message(text); choices.replaceChildren();
      options.forEach(([label,action]) => {
        const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
        b.addEventListener('click',() => { answers.push(label); message(label,true); action(); }); choices.append(b);
      });
      if (focus) choices.querySelector('button')?.focus({preventScroll:true});
    }
    function recommend(text,name) {
      choices.replaceChildren(); message(text); message('This is a starting point. We confirm the content, scope, timing, and any provider costs before work begins.'); result.hidden = false;
      const body = `Business name:\nCurrent website:\n\nProject guide answers:\n${answers.join('\n')}\n\nStarting point: ${name}\n\nExtra features or details:\nPreferred timing:\n`;
      const email = document.getElementById('guide-email');
      email.href = 'mailto:info@nubric.dev?subject=' + encodeURIComponent(name + ' inquiry') + '&body=' + encodeURIComponent(body); email.focus({preventScroll:true});
    }
    function website() { question('How much room does your website need?',[
      ['Up to 4 pages, using a prepared layout',() => recommend('QuickStart is $399 for up to four pages, supplied content, one contact form, and one revision round.','QuickStart — $399')],
      ['Up to 5 pages, with tailored sections',() => recommend('Standard is $799 for up to five pages, tailored sections, light editing of your supplied copy, and two revision rounds.','Standard — $799')],
      ['Up to 8 pages, more service detail or booking',() => recommend('Business Plus is $1,499 for up to eight pages, up to two forms, one existing booking-tool embed, and two revision rounds.','Business Plus — $1,499')],
      ['More pages, or I need help deciding',() => recommend('Let’s review your pages and features together and prepare a specific quote.','Website scope review')]
    ]); }
    function shop() { question('How many simple products should we load for launch?',[
      ['Up to 10 products',() => recommend('Shop 10 is $999. Setup includes a branded free theme, an agreed payment and domestic shipping setup, two revision rounds, testing, and handoff. Shopify fees are separate.','Shop 10 — $999')],
      ['Up to 25 products',() => recommend('Shop 25 is $1,499. We set up the store and load up to 25 simple products. Shopify subscriptions and payment fees are separate.','Shop 25 — $1,499')],
      ['Up to 50 products',() => recommend('Shop 50 is $2,199, following a catalog review. It covers initial product loading; you can add products afterward.','Shop 50 — $2,199')],
      ['Up to 100 products',() => recommend('Shop 100 is $3,299, following a catalog review. Data cleanup, complex variants, and integrations receive separate scope.','Shop 100 — $3,299')],
      ['More products, complex options, or migration',() => recommend('Let’s review the catalog and workflow before quoting your store.','Custom store scope review')]
    ]); }
    function start(focus = true) {
      answers = []; conversation.replaceChildren(); result.hidden = true;
      question('What are you looking to launch?',[
        ['A website for my business',website],
        ['A new business: website, logo & email',() => recommend('Business Launch is $699: the QuickStart website, a starter logo, domain connection, one business mailbox, and capped first-year domain and email credits. Renewals are paid directly to the providers.','Business Launch — $699')],
        ['An online store',shop],
        ['An ordering tool, AI, chat, or integration',() => recommend('These projects are scoped individually. Tell me what customers should be able to do and how the information should reach your business.','Custom system project')],
        ['Just a logo',() => recommend('Logo Essentials is $249 for one design direction, two revision rounds, an SVG master, PNG exports, and basic brand files.','Logo Essentials — $249')]
      ],focus);
    }
    document.querySelectorAll('[data-open-guide]').forEach(button => { button.hidden = false; button.addEventListener('click',() => { start(false); showGuide(button); }); });
    document.getElementById('guide-restart').addEventListener('click',() => start());
  }
})();
