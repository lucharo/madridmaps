(async()=>{
  const $=id=>document.getElementById(id),frame=()=>new Promise(requestAnimationFrame);
  const assert=(condition,message)=>{if(!condition)throw new Error(message);};
  const settle=async()=>{await frame();await frame();await frame();};
  const viewer=window.madridViewer;assert(viewer,'Viewer missing');
  if($('info').open)$('close-info').click();
  if(document.body.classList.contains('expanded'))$('expand').click();
  if(viewer.state.mode!=='browse')$('end-compare').click();
  if(!$('map-search').hidden)$('search-close').click();
  $('compare-open').click();
  document.querySelector('.map-card[data-id="'+viewer.maps.find(m=>m.id!==viewer.state.a).id+'"]').click();
  $('gallery-apply').click();$('mode-overlay').click();$('search-toggle').click();await settle();
  const originalFetch=window.fetch,originalHeight=document.body.style.height,search=$('map-search');
  try{
    window.fetch=async url=>Response.json(String(url).includes('cartociudad.es')?[]:{features:[{geometry:{coordinates:[-3.7,40.42]},properties:{name:'Una calle de Madrid con un nombre suficientemente largo para ocupar varias líneas en el panel estrecho',city:'Madrid'}}]});
    $('search-input').value='prueba';$('search-form').dispatchEvent(new Event('submit',{cancelable:true}));
    const start=Date.now();while(!$('search-results').firstElementChild){assert(Date.now()-start<10000,'Search did not settle');await frame();}
    const minimum=()=>[...search.children].filter(child=>child.id!=='search-results').reduce((height,child)=>{
      const style=getComputedStyle(child);return height+child.offsetHeight+parseFloat(style.marginTop)+parseFloat(style.marginBottom);
    },0)+$('search-results').firstElementChild.offsetHeight;
    // Measure both text widths synchronously, before resize callbacks can run.
    search.classList.remove('viewport-search');const anchored=minimum();
    search.classList.add('viewport-search');const viewport=minimum();
    assert(anchored>viewport,'Fixture must wrap differently at anchored and viewport widths');
    const controls=document.querySelector('.explore-controls'),comparison=$('comparison-panel'),stage=$('map-stage');
    const target=controls.offsetTop+controls.offsetHeight+8+comparison.offsetHeight+8+(anchored+viewport)/2+8;
    // This creates the same map height as a short browser viewport without a second process.
    document.body.style.height=(document.body.clientHeight-stage.clientHeight+target)+'px';
    await settle();
    const states=[];
    for(let i=0;i<24;i++){await frame();states.push(search.classList.contains('viewport-search'));}
    assert(states.every(Boolean),'Search layout oscillates between anchored and viewport modes: '+states.map(Number).join(''));
    const input=$('search-input').getBoundingClientRect();
    assert(document.elementFromPoint(input.x+input.width/2,input.y+input.height/2)===$('search-input'),'Stable search input is not reachable');
    return{stableFrames:states.length,anchoredMinimum:anchored,viewportMinimum:viewport,mapHeight:stage.clientHeight};
  }finally{
    window.fetch=originalFetch;document.body.style.height=originalHeight;
    $('search-close').click();$('end-compare').click();await settle();
  }
})();
