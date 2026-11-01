(async()=>{
  const $=id=>document.getElementById(id),v=window.madridViewer;
  const assert=(condition,message)=>{if(!condition)throw new Error(message);};
  const frame=()=>new Promise(requestAnimationFrame);
  const wait=async predicate=>{const start=Date.now();while(!predicate()){if(Date.now()-start>15000)throw new Error('UI did not settle');await new Promise(r=>setTimeout(r,80));}};
  assert(v,'Viewer missing');
  assert(document.documentElement.lang==='es'&&document.title==='Madrid a través del tiempo','Page language is not Spanish');
  if($('info').open)$('close-info').click();
  if(v.state.mode!=='browse')$('end-compare').click();
  if(document.body.classList.contains('expanded'))$('expand').click();
  await frame();await frame();
  const expected=['Mapas','Comparar','Pantalla completa','Información'];
  assert(JSON.stringify([...document.querySelectorAll('header .labelled-button')].slice(0,4).map(b=>b.textContent.trim()))===JSON.stringify(expected),'Primary action labels changed or missing');
  for(const id of ['catalogue-toggle','compare-open','fullscreen','info-toggle','theme','expand','search-toggle','fit','whole']){
    const b=$(id),box=b.getBoundingClientRect();
    assert(b.querySelector('svg')&&b.querySelector('span')?.textContent.trim(),'Icon and visible label missing: '+id);
    assert(box.height>=44&&box.width>=44,'Small primary touch target: '+id);
  }
  $('retry').hidden=false;assert($('retry').getBoundingClientRect().height>=44,'Retry touch target is too small');$('retry').hidden=true;
  assert(document.querySelector('.leaflet-control-zoom-in').getAttribute('aria-label')==='Acercar','Zoom label remains English');
  assert(document.querySelector('.leaflet-control-zoom-out').getAttribute('aria-label')==='Alejar','Zoom label remains English');
  const themeBefore=$('theme').textContent;
  for(let i=0;i<3;i++){$('theme').click();assert(/^Tema: (sistema|claro|oscuro)$/.test($('theme').textContent.trim()),'Theme label is not Spanish');}
  assert($('theme').textContent===themeBefore,'Theme cycle did not return to its starting value');
  $('expand').click();await frame();await frame();
  const actions=[...document.querySelectorAll('.explore-controls button')].filter(b=>b.getClientRects().length);
  const overlaps=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
  for(let i=0;i<actions.length;i++){
    const a=actions[i].getBoundingClientRect();assert(a.left>=0&&a.right<=innerWidth,'Expanded control leaves viewport');
    for(let j=0;j<i;j++)assert(!overlaps(a,actions[j].getBoundingClientRect()),'Expanded action buttons overlap');
  }
  $('search-toggle').click();await frame();await frame();
  const searchBox=$('map-search').getBoundingClientRect();
  assert(searchBox.top>=Math.max(...actions.map(b=>b.getBoundingClientRect().bottom))+5,'Search covers the action buttons');
  $('search-input').value='ab';$('search-form').dispatchEvent(new Event('submit',{cancelable:true}));
  assert($('search-status').textContent.includes('Escribe al menos 3 letras'),'Short-query message is not Spanish');
  const original=window.fetch;
  try{
    window.fetch=async()=>{throw new TypeError('Simulated offline');};
    $('search-input').value='prueba';$('search-form').dispatchEvent(new Event('submit',{cancelable:true}));
    await wait(()=>$('search-status').textContent.includes('no está disponible'));
    assert($('search-status').textContent==='La búsqueda no está disponible. Inténtalo de nuevo.','Offline message is not Spanish');
  }finally{window.fetch=original;$('search-close').click();}
  $('expand').click();await frame();await frame();
  $('info-toggle').click();
  assert($('faq-question').tagName==='STRONG'&&Number(getComputedStyle($('faq-question')).fontWeight)>=600,'FAQ question is not visibly bold');
  assert($('faq-question').parentElement.nextElementSibling===$('faq-answer'),'FAQ answer is not under its question');
  const cacheDetails=$('clear-tiles').closest('details');cacheDetails.open=true;$('clear-tiles').click();
  await wait(()=>$('clear-tiles').disabled===false);
  assert(['Se han borrado las imágenes guardadas.','Este navegador no está guardando imágenes del mapa.'].includes($('cache-status').textContent),'Cache feedback is not Spanish');
  const english=/\b(All maps|Compare maps|Search|Choose|Loading|Retry|Theme|Today|Original scans|Clear saved|Close search|Zoom in|Zoom out)\b/i;
  const labels=[...document.querySelectorAll('[aria-label],[title],[placeholder]')].flatMap(e=>['aria-label','title','placeholder'].map(a=>e.getAttribute(a)||''));
  assert(!labels.some(s=>english.test(s)),'English accessibility text remains');
  assert(!english.test(document.body.innerText),'English interface text remains');
  assert(document.documentElement.scrollWidth===innerWidth,'Translated interface overflows the page');
  $('close-info').click();
  return{spanish:true,visibleActionLabels:true,faq:true,searchFeedback:true,cacheFeedback:true,touchTargets:true,expandedControls:actions.length,width:innerWidth};
})();
