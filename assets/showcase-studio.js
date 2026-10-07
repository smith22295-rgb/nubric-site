(() => {
  'use strict';
  const picker=document.querySelector('.showcase-picker');
  if (!picker) return;
  const choices=[...picker.querySelectorAll('.showcase-choice')];
  const aliases=new Map(choices.map(input=>['#'+input.value,input]));
  const pause=document.getElementById('pause-motion');
  const motion=document.getElementById('motion-stage');
  const remember=(input)=>{
    if (input.value!=='motion-story' && motion?.classList.contains('is-playing') && pause && !pause.disabled) pause.click();
    try { history.replaceState(history.state,'','#'+input.value); } catch (_) {}
  };
  choices.forEach(input=>input.addEventListener('change',()=>remember(input)));
  const chooseHash=()=>{
    const input=aliases.get(location.hash);
    if (!input) return;
    input.checked=true;
    remember(input);
  };
  window.addEventListener('hashchange',chooseHash);
  chooseHash();
  const colors={coast:'#77c8e250',sunset:'#ffc88870',electric:'#bd9aff80'};
  const light=document.getElementById('light-stage');
  const palettes=[...document.querySelectorAll('[data-light-palette]')];
  palettes.forEach(button=>{
    button.disabled=false;
    button.addEventListener('click',()=>{
      light.style.setProperty('--light-color',colors[button.dataset.lightPalette]);
      palettes.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
    });
  });
})();
