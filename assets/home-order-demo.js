(() => {
  'use strict';
  const demo = document.querySelector('[data-order-demo]');
  if (!demo) return;
  const form = demo.querySelector('form');
  const label = form.elements.namedItem('label');
  const size = form.elements.namedItem('size');
  const quantity = form.elements.namedItem('quantity');
  const finishes = {
    silver: {name:'Brushed silver',fill:'url(#label-silver)',ink:'#16324f',premium:0},
    navy: {name:'Navy blue',fill:'url(#label-navy)',ink:'#fff',premium:.5},
    orange: {name:'Nubric orange',fill:'url(#label-orange)',ink:'#16324f',premium:.5}
  };
  const sizes = {'80':{name:'80 × 25 mm',price:7,scale:1},'100':{name:'100 × 35 mm',price:9,scale:1.06},'120':{name:'120 × 40 mm',price:11,scale:1.12}};
  const quantities = {'10':1,'25':.8,'50':.72,'100':.65};
  const money = value => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value);
  const review = demo.querySelector('[data-order-review]');
  const summary = demo.querySelector('#sample-order');
  const update = () => {
    const finish = finishes[form.elements.namedItem('finish').value] || finishes.silver;
    const option = sizes[size.value] || sizes['80'];
    const count = Object.hasOwn(quantities,quantity.value) ? Number(quantity.value) : 25;
    const each = Math.round((option.price+finish.premium)*quantities[String(count)]*100)/100;
    const words = label.value.trim().slice(0,24) || 'YOUR BUSINESS';
    const text = demo.querySelector('[data-label-words]');
    text.textContent=words;
    text.setAttribute('fill',finish.ink);
    text.setAttribute('font-size',String(words.length>18?15:words.length>13?18:22));
    demo.querySelector('[data-label-finish]').setAttribute('fill',finish.fill);
    demo.querySelector('[data-label-shape]').setAttribute('transform',`translate(220 95) scale(${option.scale}) translate(-220 -95)`);
    demo.querySelector('#order-label-title').textContent=`Preview of a ${finish.name.toLowerCase()} label reading ${words}`;
    demo.querySelector('[data-preview-caption]').textContent=`${finish.name} / ${option.name}`;
    demo.querySelector('[data-order-total]').textContent=money(each*count);
    demo.querySelector('[data-unit-price]').textContent=`${money(each)} per label`;
    demo.querySelector('[data-order-summary]').textContent=`${count} labels in ${finish.name.toLowerCase()}, ${option.name}, with “${words}”. Sample total: ${money(each*count)}.`;
  };
  form.addEventListener('submit',event=>event.preventDefault());
  form.addEventListener('input',update);
  form.addEventListener('change',update);
  review.addEventListener('click',()=>{
    const open=summary.hidden;
    summary.hidden=!open;
    review.setAttribute('aria-expanded',String(open));
    review.textContent=open?'Close sample order':'Review sample order';
  });
  update();
  demo.classList.add('is-ready');
})();
