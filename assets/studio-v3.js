(() => {
  'use strict';
  const filters=document.querySelector('[data-project-filters]');
  if(filters){
    const collection=filters.closest('.n-work-collection');
    const cards=[...collection.querySelectorAll('[data-project-category]')];
    const buttons=[...filters.querySelectorAll('[data-project-filter]')];
    const count=collection.querySelector('[data-project-count]');
    buttons.forEach(button=>button.addEventListener('click',()=>{
      const category=button.dataset.projectFilter;
      if(!['all','websites','shops','tools'].includes(category))return;
      buttons.forEach(item=>item.setAttribute('aria-pressed',String(item===button)));
      cards.forEach(card=>{card.hidden=category!=='all'&&card.dataset.projectCategory!==category;});
      collection.classList.toggle('is-filtered',category!=='all');
      const visible=cards.filter(card=>!card.hidden).length;
      count.textContent=`${visible} ${visible===1?'project':'projects'} shown`;
    }));
    filters.hidden=false;
  }
  const stage=document.querySelector('[data-studio-stage]');
  if(!stage)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobile=window.matchMedia('(max-width: 980px)');
  let frame=0,visible=true;
  const paint=()=>{
    frame=0;
    if(motion.matches||mobile.matches){stage.style.setProperty('--n-scroll','0');return;}
    const hero=stage.closest('.n-hero').getBoundingClientRect();
    const progress=Math.max(0,Math.min(1,-hero.top/(hero.height*.65)));
    stage.style.setProperty('--n-scroll',progress.toFixed(3));
  };
  const schedule=()=>{if(visible&&!frame)frame=requestAnimationFrame(paint);};
  window.addEventListener('scroll',schedule,{passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  motion.addEventListener('change',paint);mobile.addEventListener('change',paint);
  if('IntersectionObserver' in window){new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)schedule();},{rootMargin:'100px'}).observe(stage);}
  paint();
})();
