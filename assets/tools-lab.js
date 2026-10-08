(() => {
  'use strict';
  const root = document.querySelector('.tools-studio');
  if (!root) return;
  const $ = selector => root.querySelector(selector);
  const $$ = selector => [...root.querySelectorAll(selector)];
  const money = new Intl.NumberFormat('en-US', {style:'currency', currency:'USD'});
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const demos = $$('input[name="studio-demo"]');
  const hashes = {product:'try-builder', assistant:'ai-examples', estimate:'calculators'};
  const legacy = {'ordering-examples':'product','try-builder':'product','ai-examples':'assistant','calculators':'estimate','content-sites':'estimate'};
  function switchDemo(value, focus = false) {
    const input = demos.find(demo => demo.value === value);
    if (!input) return;
    input.checked = true;
    try { history.replaceState(history.state, '', '#' + hashes[value]); } catch (_) { /* Native controls still work. */ }
    if (focus) input.focus({preventScroll:true});
  }
  function restoreHash() {
    const value = legacy[location.hash.slice(1)];
    if (value) demos.find(demo => demo.value === value).checked = true;
  }
  restoreHash();
  window.addEventListener('hashchange', restoreHash);
  demos.forEach(demo => demo.addEventListener('change', () => switchDemo(demo.value)));
  $$('form').forEach(form => form.addEventListener('submit', event => event.preventDefault()));
  $$('button[disabled],input[disabled],select[disabled]').forEach(control => { control.disabled = false; });

  const colors = {
    ocean:{name:'Ocean blue', stops:['#163b52','#3e7f9c','#39758f','#14364d']},
    forest:{name:'Forest green', stops:['#1b3b32','#528b70','#315d4e','#17382c']},
    sand:{name:'Champagne', stops:['#887054','#d4b98d','#bc9b72','#8c7254']},
    clay:{name:'Terracotta', stops:['#69382d','#c17b5b','#a3563e','#66392c']},
    graphite:{name:'Graphite', stops:['#1c252e','#626f7b','#343e49','#17212a']}
  };
  let color = 'ocean';
  let productState;
  function updateProduct() {
    const model = $('input[name="product-model"]:checked').value;
    const quantity = Number($('#studio-quantity').value);
    const text = $('#studio-engraving').value.trim() || 'Your brand';
    const font = $('#studio-typeface').value;
    const finish = colors[color];
    const discount = quantity >= 250 ? .25 : quantity >= 100 ? .2 : quantity >= 50 ? .15 : quantity >= 25 ? .1 : quantity >= 10 ? .05 : 0;
    const unitCents = Math.round((model === 'bottle' ? 2800 : 2500) * (1 - discount));
    const totalCents = unitCents * quantity;
    productState = {product:model === 'bottle' ? '24 oz bottle' : '20 oz tumbler', color:finish.name, text, lettering:font === 'modern' ? 'Modern' : 'Classic', quantity, unitCents, totalCents, discount};
    $$('[data-product-model]').forEach(group => group.toggleAttribute('hidden', group.dataset.productModel !== model));
    $$('[data-coat-stop]').forEach(stop => stop.setAttribute('stop-color', finish.stops[Number(stop.dataset.coatStop)]));
    const engraving = $('[data-product-text]');
    engraving.textContent = text;
    engraving.setAttribute('font-family', font === 'modern' ? 'Manrope,Arial,sans-serif' : 'Georgia,serif');
    engraving.setAttribute('font-size', String(Math.min(24, 155 / Math.max(text.length * .62, 1))));
    $('[data-color-name]').textContent = finish.name;
    $('[data-product-size]').textContent = productState.product;
    $('[data-product-caption]').textContent = finish.name + ' / ' + productState.product;
    $('#product-art-title').textContent = `Personalized ${finish.name.toLowerCase()} ${productState.product}, with ${text} engraving`;
    $('[data-product-total]').textContent = money.format(totalCents / 100);
    $('[data-product-unit]').textContent = money.format(unitCents / 100) + ' each';
    $('[data-product-discount]').textContent = discount ? `${Math.round(discount * 100)}% quantity saving` : 'Engraving included';
    $$('[data-product-color]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.productColor === color)));
  }
  $('[data-product-form]').addEventListener('input', updateProduct);
  $('[data-product-form]').addEventListener('change', updateProduct);
  $$('[data-product-color]').forEach(button => button.addEventListener('click', () => { color = button.dataset.productColor; updateProduct(); }));
  $('[data-product-reset]').addEventListener('click', () => { $('[data-product-form]').reset(); color = 'ocean'; updateProduct(); });
  updateProduct();

  const dialog = $('#studio-order-dialog');
  $('[data-product-review]').addEventListener('click', () => {
    updateProduct();
    const details = $('[data-order-details]');
    details.replaceChildren();
    const lines = [['Product', productState.product],['Finish', productState.color],['Design text', productState.text],['Lettering', productState.lettering],['Quantity', String(productState.quantity)],['Price per product', money.format(productState.unitCents / 100)],['Example order total', money.format(productState.totalCents / 100)]];
    lines.forEach(([label, value]) => {
      const row = document.createElement('div'), name = document.createElement('dt'), content = document.createElement('dd');
      name.textContent = label; content.textContent = value; row.append(name, content); details.append(row);
    });
    dialog.showModal(); document.body.classList.add('studio-modal-open');
  });
  $$('[data-order-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('close', () => document.body.classList.remove('studio-modal-open'));
  dialog.addEventListener('click', event => {
    const box = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
  });

  const materials = {wood:{name:'Pressure-treated wood', price:450, color:'#c69e75', edge:'#866c54'},cedar:{name:'Cedar',price:625,color:'#b47954',edge:'#794c34'},composite:{name:'Composite',price:850,color:'#7c8990',edge:'#4e5e69'}};
  const svgNS = 'http://www.w3.org/2000/svg';
  const svgElement = (tag, attrs) => { const element = document.createElementNS(svgNS, tag); Object.entries(attrs).forEach(([name,value]) => element.setAttribute(name, String(value))); return element; };
  function updateQuote() {
    const length = Number($('#studio-length').value), width = Number($('#studio-width').value);
    const material = materials[$('#studio-deck-material').value];
    const rail = $('#studio-railing').checked;
    const validLength = Number.isInteger(length) && length >= 8 && length <= 30;
    const validWidth = Number.isInteger(width) && width >= 8 && width <= 24;
    const valid = validLength && validWidth && Boolean(material);
    $('#studio-length').setAttribute('aria-invalid', String(!validLength));
    $('#studio-width').setAttribute('aria-invalid', String(!validWidth));
    $('[data-quote-error]').hidden = valid;
    $('[data-quote-error]').textContent = valid ? '' : 'Use whole feet: length 8–30 ft and width 8–24 ft.';
    $('[data-deck-scene]').toggleAttribute('hidden', !valid);
    $('[data-quote-rail-row]').hidden = !rail;
    if (!valid) {
      ['materials','labor','railing','total'].forEach(key => { $('[data-quote-' + key + ']').textContent = '—'; });
      $('[data-deck-dimensions]').textContent = 'Enter dimensions to preview your project';
      return;
    }
    const area = length * width, quantity = Math.ceil(area * 110 / 100);
    const materialCents = quantity * material.price, laborCents = area * 600 + 12000;
    const railCents = rail ? (length * 2 + width) * 1800 : 0;
    $('[data-quote-materials]').textContent = money.format(materialCents / 100);
    $('[data-quote-labor]').textContent = money.format(laborCents / 100);
    $('[data-quote-railing]').textContent = money.format(railCents / 100);
    $('[data-quote-total]').textContent = money.format((materialCents + laborCents + railCents) / 100);
    $('[data-deck-caption]').textContent = material.name;
    $('[data-deck-dimensions]').textContent = `${length} × ${width} ft / ${area} sq ft`;
    $('#deck-art-title').textContent = `${length} by ${width} foot ${material.name.toLowerCase()} deck${rail ? ' with railing on three sides' : ''}`;
    // Fit all permitted dimensions into the drawing without losing its proportions.
    const scale = Math.min(360 / length, 220 / width);
    const w = length * scale, h = width * scale, x = -w / 2, y = -h / 2;
    const project = (px, py, z = 0) => [320 + .85 * px - .85 * py, 250 + .38 * px + .38 * py - z];
    const points = values => values.map(point => project(...point).join(',')).join(' ');
    const edge = $('[data-deck-edge]'); edge.replaceChildren();
    const front = [[x,y+h],[x+w,y+h],[x+w,y]];
    edge.append(svgElement('polygon',{points:points([...front,...front.slice().reverse().map(([px,py])=>[px,py,-12])]),fill:material.edge}));
    const base = $('[data-deck-base]');
    Object.entries({x,y,width:w,height:h,fill:material.color,stroke:material.edge}).forEach(([name,value]) => base.setAttribute(name,String(value)));
    const planks = $('[data-deck-planks]'); planks.replaceChildren();
    for (let offset = 13; offset < h; offset += 13) planks.append(svgElement('path',{d:`M${x} ${y+offset}h${w}`,fill:'none',stroke:material.edge,'stroke-width':1,'stroke-opacity':.5}));
    const rails = $('[data-deck-rails]'); rails.replaceChildren();
    if (rail) {
      rails.append(svgElement('polyline',{points:points([[x,y+h,36],[x,y,36],[x+w,y,36],[x+w,y+h,36]]),fill:'none',stroke:material.edge,'stroke-width':5}));
      const post = (px,py) => rails.append(svgElement('polyline',{points:points([[px,py],[px,py,36]]),fill:'none',stroke:material.edge,'stroke-width':3}));
      for (let i = 0; i <= 8; i++) post(x + i*w/8,y);
      for (const side of [x,x+w]) for (let i = 0; i <= 5; i++) post(side,y+i*h/5);
    }
  }
  $('[data-quote-form]').addEventListener('input', updateQuote);
  $('[data-quote-form]').addEventListener('change', updateQuote);
  $('[data-quote-reset]').addEventListener('click', () => { $('[data-quote-form]').reset(); updateQuote(); });
  updateQuote();

  const transcript = $('[data-chat-transcript]'), choices = $('[data-chat-choices]');
  let chatTimer, chatVersion = 0;
  function bubble(text, customer = false) {
    const item = document.createElement('div'), paragraph = document.createElement('p');
    item.className = 'chat-bubble ' + (customer ? 'customer-bubble' : 'assistant-bubble');
    paragraph.textContent = text; item.append(paragraph); transcript.append(item); transcript.scrollTop = transcript.scrollHeight;
    return item;
  }
  function setChoices(items, focus = false) {
    choices.replaceChildren();
    items.forEach(([label, action, href]) => {
      const element = document.createElement(href ? 'a' : 'button');
      element.textContent = label;
      if (href) element.href = href;
      else { element.type = 'button'; element.dataset.chatAction = action; }
      choices.append(element);
    });
    if (focus && choices.firstElementChild) choices.firstElementChild.focus({preventScroll:true});
  }
  function restartChat(focus = false) {
    clearTimeout(chatTimer); chatVersion++; transcript.replaceChildren();
    bubble('Hi! What would you like help with?');
    setChoices([['Help me choose a product','products'],['Help me price a project','estimate'],['I’d like to speak to someone','person']],focus);
  }
  function result(title, description) {
    const card = document.createElement('div'), heading = document.createElement('h4'), paragraph = document.createElement('p');
    card.className = 'chat-result'; heading.textContent = title; paragraph.textContent = description; card.append(heading,paragraph); transcript.append(card); transcript.scrollTop = transcript.scrollHeight;
  }
  const conversations = {
    products:{reply:'Let’s find a useful fit. Are you choosing gifts for a team, or something for an outdoor event?', choices:[['Gifts for our team','team'],['An outdoor event','outdoor']]},
    team:{reply:'A personalized bottle is a good starting point in this example. Do you want one shared design or individual names?',choices:[['One shared design','shared'],['Individual names','names']]},
    outdoor:{reply:'In this example, an insulated bottle keeps the design simple and gives people something they can use again. Choose a finish and review the quantity pricing.',title:'Suggested starting point',description:'24 oz bottle · Forest green · Your event branding',choices:[['Try the recommended design','apply-product'],['Ask for a different option','person']]},
    shared:{reply:'We can carry the same design across the order. The configurator shows the finish, engraving and quantity price before the customer reviews it.',title:'A clear order to work from',description:'50 bottles · One shared design · Quantity pricing applied',choices:[['Try the recommended design','apply-product'],['Explore another question','restart']]},
    names:{reply:'A live tool can collect a list of names, pair each one with its product and prepare the details for production. For this walkthrough, try a shared design in the configurator.',title:'Personalization at scale',description:'Name lists · Individual previews · Structured production details',choices:[['Open the product studio','apply-product'],['Talk about bulk ordering',null,'/contact?service=custom&feature=Bulk%20personalization%20tool']]},
    estimate:{reply:'An estimator can ask for the measurements and options that affect your price. Let’s try a deck project where materials, installation and railing update together.',title:'One request. A useful estimate.',description:'Measurements · Material choices · A visible price breakdown',choices:[['Try the visual estimator','apply-estimate'],['Explore another question','restart']]},
    person:{reply:'For a request that needs personal attention, the assistant can hand the conversation to your team with the important details already gathered.',title:'Keep the conversation moving',description:'The customer’s question and choices can accompany the handoff.',choices:[['Talk to Nubric about an assistant',null,'/contact?service=custom&feature=Business%20assistant'],['Explore another question','restart']]}
  };
  choices.addEventListener('click', event => {
    const button = event.target.closest('button[data-chat-action]');
    if (!button || !choices.contains(button)) return;
    const action = button.dataset.chatAction, keyboard = event.detail === 0;
    if (action === 'restart') { restartChat(keyboard); return; }
    if (action === 'apply-product') {
      $('[data-product-form]').reset(); color = 'forest'; $('#studio-engraving').value = 'Summit Team'; $('#studio-quantity').value = '50'; updateProduct(); switchDemo('product',true); return;
    }
    if (action === 'apply-estimate') { switchDemo('estimate',true); return; }
    const conversation = conversations[action];
    if (!conversation) return;
    bubble(button.textContent,true);
    choices.replaceChildren();
    const pending = document.createElement('div'); pending.className = 'chat-thinking'; pending.setAttribute('aria-label','Preparing the guided example');
    for (let i = 0; i < 3; i++) pending.append(document.createElement('i'));
    transcript.append(pending); transcript.scrollTop = transcript.scrollHeight;
    const version = ++chatVersion;
    const finish = () => {
      if (version !== chatVersion) return;
      pending.remove(); bubble(conversation.reply);
      if (conversation.title) result(conversation.title,conversation.description);
      setChoices(conversation.choices,keyboard);
    };
    if (reducedMotion.matches) finish(); else chatTimer = setTimeout(finish,550);
  });
  $('[data-chat-reset]').addEventListener('click', event => restartChat(event.detail === 0));
  window.addEventListener('pagehide', () => { clearTimeout(chatTimer); restartChat(); if (dialog.open) dialog.close(); });
  restartChat();
})();
