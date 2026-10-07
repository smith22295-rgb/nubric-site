(() => {
  'use strict';
  document.querySelectorAll('[data-journey]').forEach(journey => {
    const tabs=[...journey.querySelectorAll('[data-journey-tab]')];
    const panels=[...journey.querySelectorAll('[data-journey-panel]')];
    if (tabs.length!==panels.length || tabs.length<2) return;
    let selected=0;
    const choose=(index,focus=false) => {
      selected=(index+tabs.length)%tabs.length;
      tabs.forEach((tab,i)=>{
        tab.setAttribute('aria-selected',String(i===selected));
        tab.tabIndex=i===selected ? 0 : -1;
        panels[i].hidden=i!==selected;
      });
      if(focus) tabs[selected].focus({preventScroll:true});
    };
    journey.querySelector('.journey-tabs').setAttribute('role','tablist');
    tabs.forEach((tab,i)=>{
      tab.setAttribute('role','tab');
      tab.setAttribute('aria-controls',panels[i].id);
      panels[i].setAttribute('role','tabpanel');
      panels[i].setAttribute('aria-labelledby',tab.id);
      tab.addEventListener('click',event=>{event.preventDefault();choose(i);});
      tab.addEventListener('keydown',event=>{
        const index={ArrowLeft:selected-1,ArrowRight:selected+1,Home:0,End:tabs.length-1}[event.key];
        if(index!==undefined){event.preventDefault();choose(index,true);}
      });
    });
    journey.classList.add('is-journey-ready');
    choose(0);
  });
  const guide=document.querySelector('[data-plan-guide]');
  if(guide){
    const note=guide.querySelector('p[data-plan-note]');
    const buttons=[...guide.querySelectorAll('[data-plan-match]')];
    buttons.forEach(button=>button.addEventListener('click',()=>{
      const id=button.dataset.planMatch;
      buttons.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
      document.querySelectorAll('.website-plans .plan-card').forEach(card=>card.classList.toggle('is-picked',card.id===id));
      note.textContent=button.dataset.planNote;
    }));
    guide.hidden=false;
  }
})();
