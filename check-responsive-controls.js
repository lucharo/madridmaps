(async()=>{
  const $=id=>document.getElementById(id),v=window.madridViewer,issues=[];
  const frame=()=>new Promise(requestAnimationFrame);
  const settle=async()=>{await frame();await frame();await frame();};
  const check=(condition,message)=>{if(!condition)issues.push(message);};
  const overlaps=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
  if(!v)throw new Error('Viewer missing');
  if($('info').open)$('close-info').click();
  if(document.body.classList.contains('expanded'))$('expand').click();
  if(v.state.mode!=='browse')$('end-compare').click();
  if(!$('map-search').hidden)$('search-close').click();
  await settle();
  const toolbar=document.querySelector('.toolbar'),picker=$('browse-picker').getBoundingClientRect(),style=getComputedStyle(toolbar);
  if(innerWidth<=760)check(picker.width>=toolbar.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight)-1,'Phone date selector does not have its own full-width row');
  const navigation=['previous','map-select','next','fit','whole'].map(id=>({id,box:$(id).getBoundingClientRect()}));
  for(let i=0;i<navigation.length;i++)for(let j=0;j<i;j++)check(!overlaps(navigation[i].box,navigation[j].box),'Toolbar controls overlap: '+navigation[i].id+' / '+navigation[j].id);
  const selectWidth=$('map-select').getBoundingClientRect().width;
  $('compare-open').click();
  document.querySelector('.map-card[data-id="'+v.maps.find(m=>m.id!==v.state.a).id+'"]').click();
  $('gallery-apply').click();
  for(const expanded of [false,true]){
    if(expanded)$('expand').click();
    $('search-toggle').click();
    for(const mode of ['slide','overlay']){
      $('mode-'+mode).click();await settle();
      const search=$('map-search').getBoundingClientRect(),panel=$('comparison-panel').getBoundingClientRect();
      check(!overlaps(search,panel),'Search covers comparison controls in '+mode+' mode, expanded='+expanded);
      for(const id of ['mode-slide','mode-overlay']){
        const box=$(id).getBoundingClientRect(),hit=document.elementFromPoint(box.x+box.width/2,box.y+box.height/2);
        check($(id).contains(hit),'Comparison button is not reachable: '+id+', expanded='+expanded);
      }
    }
    $('search-close').click();
    if(expanded)$('expand').click();
  }
  $('end-compare').click();await settle();
  if(issues.length)throw new Error(issues.join('; '));
  return{width:innerWidth,dateSelectWidth:selectWidth,toolbarNoOverlap:true,comparisonSearchModes:4};
})();
