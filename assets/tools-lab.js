(() => {
  'use strict';
  const dollars = (cents) => new Intl.NumberFormat('en-US', {style:'currency', currency:'USD', minimumFractionDigits:0, maximumFractionDigits:2}).format(cents / 100);
  const homeSizes = {compact:{label:'up to 1,500 sq ft',cents:17900},standard:{label:'1,501–2,500 sq ft',cents:24900},large:{label:'2,501–3,500 sq ft',cents:32900}};
  function calculateEstimate(input) {
    const errors = {}, items = [];
    const area = Number(input.area), count = Number(input.windowCount);
    if (input.driveway === true) {
      if (!Number.isInteger(area) || area < 100 || area > 3000) errors.area = 'Enter a driveway area from 100 to 3,000 whole square feet.';
      else items.push({key:'driveway',label:`Driveway cleaning (${area.toLocaleString('en-US')} sq ft)`,cents:Math.max(15000,area * 22)});
    }
    if (input.house === true) {
      if (!Object.hasOwn(homeSizes,input.homeSize)) errors.homeSize = 'Choose a home size.';
      else items.push({key:'house',label:`House wash (${homeSizes[input.homeSize].label})`,cents:homeSizes[input.homeSize].cents});
    }
    if (input.windows === true) {
      if (!Number.isInteger(count) || count < 1 || count > 40) errors.windowCount = 'Enter between 1 and 40 whole windows.';
      else items.push({key:'windows',label:`Exterior windows (${count})`,cents:count * 800});
    }
    if (![input.driveway,input.house,input.windows].some(value => value === true)) errors.selection = 'Choose at least one service to build an estimate.';
    if (Object.keys(errors).length) return {valid:false,errors,items:[],totalCents:null,summary:''};
    const totalCents = items.reduce((total,item) => total + item.cents,0);
    return {valid:true,errors,items,totalCents,summary:`Requested work: ${items.map(item => item.label.toLowerCase()).join('; ')}. Sample estimate: ${dollars(totalCents)}.`};
  }
  const option = (id,label) => ({id,label});
  function startIntake() {
    return {step:'start',route:null,details:{},complete:false,reply:'Away for the season or getting ready to come back? What can I help you plan?',choices:[option('watch','Home watch while I’m away'),option('pool','Pool care'),option('return','Getting ready to return'),option('person','I’d rather talk to someone')]};
  }
  function intakeSummary(state) {
    const d=state.details;
    if (!state.complete) return 'Try the conversation to see the inquiry take shape.';
    if (state.route==='watch') return `Home watch for a ${d.Property.toLowerCase()}, with ${d.Visits.toLowerCase()}.${d.Extras ? ' Include pool care.' : ''}`;
    if (state.route==='pool') return `${d.Schedule} pool care for ${d.Pool==='Screened pool' ? 'a screened' : 'an open-air'} pool.`;
    if (state.route==='return') return `A pre-arrival home check. Arrival: ${d.Arrival.toLowerCase()}.${d.Extras ? ' Include a pool check.' : ''}`;
    return 'The customer would like a personal conversation about property care.';
  }
  function advanceIntake(previous,action) {
    if (!previous.choices.some(choice => choice.id===action)) return previous;
    if (action==='restart') return startIntake();
    if (action==='review') return previous;
    const state={...previous,details:{...previous.details},choices:[],complete:false};
    const finish=(reply) => {
      state.complete=true;state.step='complete';state.reply=reply;
      state.choices=[option('review','Review the inquiry'),option('restart','Start again')];
      if (state.route==='watch' && state.details.Property==='Single-family home' && !state.details.Extras) state.choices.unshift(option('add-pool','Include pool care'));
      return state;
    };
    if (action==='add-pool') {state.details.Extras='Pool care';return finish('Added pool care to your home-watch request.');}
    if (previous.step==='start') {
      state.route=action;
      if (action==='watch') {state.details.Service='Home watch';state.step='watch-property';state.reply='Home-watch visits can include checks for visible issues and photo updates. What type of property needs looking after?';state.choices=[option('condo','Condo'),option('house','Single-family home')];}
      if (action==='pool') {state.details.Service='Pool care';state.step='pool-type';state.reply='Let’s start with the pool setting. Is it screened or open to the air?';state.choices=[option('screened','Screened pool'),option('open','Open-air pool')];}
      if (action==='return') {state.details.Service='Pre-arrival check';state.step='arrival';state.reply='Let’s plan a check before you get back. When are you returning?';state.choices=[option('soon','Within a week'),option('later','In the next month')];}
      if (action==='person') {state.details.Service='Personal follow-up';return finish('Some questions are better handled by a person. A live assistant can pass your request to the team instead of making you repeat the conversation.');}
      return state;
    }
    if (previous.step==='watch-property') {state.details.Property=action==='condo'?'Condo':'Single-family home';state.step='watch-frequency';state.reply='How often would you like a visit?';state.choices=[option('weekly','Weekly visits'),option('twice','Twice a month')];return state;}
    if (previous.step==='watch-frequency') {state.details.Visits=action==='weekly'?'Weekly visits':'Twice-monthly visits';return finish('Your request is ready to review. The team can follow up about access, availability and pricing.');}
    if (previous.step==='pool-type') {state.details.Pool=action==='screened'?'Screened pool':'Open-air pool';state.step='pool-schedule';state.reply='Will you need care throughout the year, or while you’re away?';state.choices=[option('year','Year-round care'),option('seasonal','While I’m away')];return state;}
    if (previous.step==='pool-schedule') {state.details.Schedule=action==='year'?'Year-round':'Seasonal';return finish('Your pool setting and schedule are in the request. The team can follow up with the service details and a quote.');}
    if (previous.step==='arrival') {state.details.Arrival=action==='soon'?'Within a week':'In the next month';state.step='return-scope';state.reply='Would you like the pool checked before you arrive, too?';state.choices=[option('home-only','Home check only'),option('with-pool','Home and pool check')];return state;}
    if (previous.step==='return-scope') {if(action==='with-pool')state.details.Extras='Pool check';return finish('Your arrival window and requested checks are ready for the team. They can confirm availability and make the arrangements with you.');}
    return previous;
  }
  // Pure rules are also exercised by local Node tests, without a browser or network.
  if (typeof module !== 'undefined' && module.exports) {module.exports={calculateEstimate,startIntake,advanceIntake,intakeSummary};return;}
  const root=document.querySelector('.tools-page');
  if (!root) return;
  const $=selector=>root.querySelector(selector), $$=selector=>[...root.querySelectorAll(selector)];
  const tabs=$$('[data-tool-tab]'), panels=$$('[data-tool-panel]');
  const hashes={visual:'try-builder',estimate:'calculators',assistant:'ai-examples'};
  function selectTool(key,{focus=false,writeHash=false}={}) {
    if (!Object.hasOwn(hashes,key)) return;
    tabs.forEach(tab=>{const active=tab.dataset.toolTab===key;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus({preventScroll:true});});
    panels.forEach(panel=>{panel.hidden=panel.dataset.toolPanel!==key;});
    if(writeHash)try{history.replaceState(history.state,'','#'+hashes[key]);}catch{/* The controls work without history access. */}
  }
  function restoreHash() {
    const key=Object.keys(hashes).find(key=>hashes[key]===location.hash.slice(1));
    if(key){selectTool(key);$('#explore-tools').scrollIntoView({block:'start',behavior:'instant'});}
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>selectTool(tab.dataset.toolTab,{writeHash:true}));
    tab.addEventListener('keydown',event=>{const keys={ArrowRight:(index+1)%tabs.length,ArrowLeft:(index+tabs.length-1)%tabs.length,Home:0,End:tabs.length-1};if(Object.hasOwn(keys,event.key)){event.preventDefault();selectTool(tabs[keys[event.key]].dataset.toolTab,{focus:true,writeHash:true});}});
  });
  $('.tools-tabs').hidden=false;
  restoreHash();window.addEventListener('hashchange',restoreHash);
  // Initial native fragment scrolling can run after deferred scripts and font layout.
  // Re-align once after load, unless the visitor has already begun exploring.
  let visitorInteracted=false;
  ['pointerdown','keydown','wheel','touchstart'].forEach(type=>window.addEventListener(type,()=>{visitorInteracted=true;},{once:true,passive:true}));
  window.addEventListener('load',()=>requestAnimationFrame(()=>{if(!visitorInteracted)restoreHash();}),{once:true});

  const estimateForm=$('[data-estimate-form]'), estimateReview=$('[data-estimate-review]'), estimateRequest=$('#estimate-request');
  const checks={driveway:estimateForm.elements.driveway,house:estimateForm.elements.house,windows:estimateForm.elements.windows};
  const fields={driveway:estimateForm.elements.area,house:estimateForm.elements.homeSize,windows:estimateForm.elements.windowCount};
  function closeEstimate(){estimateRequest.hidden=true;estimateReview.setAttribute('aria-expanded','false');estimateReview.textContent='Review the sample request';}
  function updateEstimate(){
    Object.entries(checks).forEach(([key,checkbox])=>{fields[key].disabled=!checkbox.checked;$(`[data-estimate-field="${key}"]`).hidden=!checkbox.checked;const marker=$(`[data-estimate-marker="${key}"]`);marker.setAttribute('aria-pressed',String(checkbox.checked));marker.querySelector('span').textContent=checkbox.checked?'✓':'+';});
    const result=calculateEstimate({driveway:checks.driveway.checked,house:checks.house.checked,windows:checks.windows.checked,area:fields.driveway.value,homeSize:fields.house.value,windowCount:fields.windows.value});
    [['driveway','area'],['house','homeSize'],['windows','windowCount']].forEach(([key,error])=>fields[key].setAttribute('aria-invalid',String(Boolean(result.errors[error]))));
    const error=$('[data-estimate-error]');error.hidden=result.valid;error.textContent=Object.values(result.errors).join(' ');
    $('[data-estimate-total]').textContent=result.valid?dollars(result.totalCents):'—';
    Object.keys(checks).forEach(key=>{const item=result.items.find(item=>item.key===key);$(`[data-line-price="${key}"]`).textContent=item?dollars(item.cents):'';});
    estimateReview.disabled=!result.valid;$('[data-estimate-summary]').textContent=result.summary;
    if(!result.valid)closeEstimate();
  }
  estimateForm.addEventListener('submit',event=>event.preventDefault());
  estimateForm.addEventListener('input',updateEstimate);estimateForm.addEventListener('change',updateEstimate);
  $$('[data-estimate-marker]').forEach(marker=>marker.addEventListener('click',()=>{const control=checks[marker.dataset.estimateMarker];control.checked=!control.checked;updateEstimate();}));
  $('[data-estimate-reset]').addEventListener('click',()=>{estimateForm.reset();closeEstimate();updateEstimate();});
  estimateReview.addEventListener('click',()=>{const open=estimateRequest.hidden;estimateRequest.hidden=!open;estimateReview.setAttribute('aria-expanded',String(open));estimateReview.textContent=open?'Close the sample request':'Review the sample request';if(open)estimateRequest.scrollIntoView({block:'nearest',behavior:'instant'});});
  $('.estimate-markers').hidden=false;updateEstimate();

  let intake=startIntake();
  const transcript=$('[data-assistant-transcript]'), choices=$('[data-assistant-choices]');
  function addBubble(text,customer=false){const bubble=document.createElement('div'),p=document.createElement('p');bubble.className='assistant-bubble'+(customer?' is-customer':'');p.textContent=text;bubble.append(p);transcript.append(bubble);transcript.scrollTop=transcript.scrollHeight;}
  function renderIntake(focus=false){
    choices.replaceChildren();intake.choices.forEach(choice=>{const button=document.createElement('button');button.type='button';button.dataset.intakeAction=choice.id;button.textContent=choice.label;choices.append(button);});
    const details=$('[data-handoff-details]');details.replaceChildren();
    const entries=Object.entries(intake.details);if(!entries.length)entries.push(['Service','Waiting for a choice']);
    entries.forEach(([key,value])=>{const row=document.createElement('div'),name=document.createElement('dt'),content=document.createElement('dd');name.textContent=key;content.textContent=value;row.append(name,content);details.append(row);});
    $('[data-handoff-heading]').textContent=intake.complete?'One clear request.':'Your request takes shape.';
    $('[data-handoff-summary]').textContent=intakeSummary(intake);$('[data-handoff-ready]').hidden=!intake.complete;
    if(focus)choices.firstElementChild?.focus({preventScroll:true});
  }
  function restartIntake(focus=false){intake=startIntake();transcript.replaceChildren();addBubble(intake.reply);renderIntake(focus);}
  choices.addEventListener('click',event=>{
    const button=event.target.closest('button[data-intake-action]');if(!button||!choices.contains(button))return;
    const action=button.dataset.intakeAction;if(!intake.choices.some(choice=>choice.id===action))return;
    const keyboard=event.detail===0;
    if(action==='restart'){restartIntake(keyboard);return;}
    if(action==='review'){const handoff=$('[data-assistant-handoff]');handoff.focus({preventScroll:true});handoff.scrollIntoView({block:'nearest',behavior:'instant'});return;}
    const next=advanceIntake(intake,action);if(next===intake)return;
    addBubble(button.textContent,true);intake=next;addBubble(intake.reply);renderIntake(keyboard);
  });
  $('[data-assistant-reset]').addEventListener('click',event=>restartIntake(event.detail===0));
  restartIntake();
})();
