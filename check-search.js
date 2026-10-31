(async()=>{
  const $=id=>document.getElementById(id),v=window.madridViewer;
  const assert=(yes,message)=>{if(!yes)throw new Error(message);};
  const wait=async fn=>{for(let i=0;i<100;i++){if(fn())return;await new Promise(r=>setTimeout(r,100));}throw new Error('Search did not settle: '+$('search-status').textContent);};
  const query=async text=>{if($('map-search').hidden)$('search-toggle').click();$('search-input').value=text;$('search-input').dispatchEvent(new Event('input'));await wait(()=>$('search-results').children.length>0);};
  await query('gran via 28');
  assert(document.querySelector('.search-result strong').textContent==='CALLE GRAN VIA 28, Madrid','House-number result was not first');
  document.querySelector('.search-result').click();await wait(()=>$('map-search').hidden);
  assert(document.activeElement===$('search-toggle'),'Selecting a result did not restore keyboard focus');
  assert(v.map.getCenter().distanceTo([40.42022995491958,-3.7019733413068066])<2,'Address pin has wrong coordinates');
  assert(document.querySelectorAll('.search-pin').length===1,'Address pin missing');
  await query('malasana');
  assert(document.querySelector('.search-result strong').textContent==='Malasaña','Unaccented neighbourhood search failed');
  document.querySelector('.search-result').click();await wait(()=>$('map-search').hidden);
  assert(v.map.getCenter().distanceTo([40.4267079,-3.7042311])<2,'Neighbourhood coordinates wrong');
  assert(document.querySelectorAll('.search-pin').length===1,'Selecting another result left duplicate pins');
  await query('calle alcala');
  const street=[...document.querySelectorAll('.search-result')].find(b=>b.querySelector('strong').textContent==='CALLE ALCALA, Madrid');
  assert(street,'Official street result missing');street.click();await wait(()=>$('map-search').hidden);
  assert(v.map.getCenter().lat>40&&v.map.getCenter().lng<-3,'Street candidate at 0,0 was not resolved');
  $('search-toggle').click();$('search-clear-pin').click();assert(!document.querySelector('.search-pin'),'Remove pin failed');
  // A provider that ignores AbortSignal must not restore an obsolete result list.
  const original=window.fetch;window.fetch=async url=>{const q=new URL(url).searchParams.get('q');if(q==='old query')await new Promise(r=>setTimeout(r,1200));return Response.json(String(url).includes('cartociudad.es')?[]:{features:[{geometry:{coordinates:[-3.7,40.42]},properties:{name:q,city:'Madrid'}}]});};
  try{
    $('search-input').value='old query';$('search-form').dispatchEvent(new Event('submit',{cancelable:true}));
    $('search-input').value='new query';$('search-form').dispatchEvent(new Event('submit',{cancelable:true}));
    await wait(()=>$('search-results').textContent.includes('new query'));
    await new Promise(r=>setTimeout(r,1400));
    assert(!$('search-results').textContent.includes('old query'),'Late obsolete search replaced current results');
  }finally{window.fetch=original;$('search-close').click();}
  return{address:true,neighbourhood:true,unaccentedQuery:true,streetResolved:true,onePin:true,removePin:true,staleResponseIgnored:true};
})();
