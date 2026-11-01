(async()=>{
  const assert=(value,message)=>{if(!value)throw new Error(message);};
  const $=id=>document.getElementById(id),viewer=window.madridViewer;
  const wait=async predicate=>{const started=Date.now();while(!predicate()){if(Date.now()-started>30000)throw new Error('Map did not settle');await new Promise(r=>setTimeout(r,100));}};
  assert(viewer,'Viewer missing');
  assert(viewer.maps.length===13,'Expected twelve historical maps and today');
  assert($('timeline').children.length===viewer.maps.length,'Timeline missing maps');
  const colubi=viewer.maps.find(m=>m.id==='ColubiMadrid');assert(colubi?.year==='1889','Colubi copy dated incorrectly');
  if(!$('info').open)$('info-toggle').click();
  for(const m of viewer.maps){
    const button=$('timeline').querySelector(`[data-map="${m.id}"]`);assert(button,'Timeline control missing');button.click();
    assert(viewer.state.a===m.id,'Timeline did not select '+m.id);
    assert($('info-context').textContent===m.context&&!!m.context,'Context missing for '+m.id);
    assert($('description').lang==='es','Wrong catalogue language: '+m.id);
    assert(Array.isArray(m.faqs)&&m.faqs.length>=2,'Multiple questions missing for '+m.id);
    const entries=[...$('map-faqs').children];
    assert(entries.length===m.faqs.length,'Questions left over or missing after selecting '+m.id);
    const rendered=entries.map(entry=>{
      const question=entry.querySelector('strong'),answer=entry.lastElementChild;
      assert(question&&Number(getComputedStyle(question).fontWeight)>=600,'Question is not bold for '+m.id);
      assert(question.parentElement.nextElementSibling===answer&&answer.tagName==='P','Answer is not directly below its question');
      return{question:question.textContent,answer:answer.textContent};
    });
    assert(JSON.stringify(rendered)===JSON.stringify(m.faqs),'Wrong questions or order for '+m.id);
    assert(new Set(rendered.map(faq=>faq.question)).size===rendered.length&&rendered.every(faq=>faq.question.startsWith('¿')&&faq.answer.length>30),'Question content is missing or repeated for '+m.id);
    assert($('map-select').value===m.id,'Select disagrees with timeline');
    assert($('timeline').querySelectorAll('[aria-pressed="true"]').length===1,'Ambiguous timeline selection');
  }
  const selected=$('timeline').querySelector('[data-map="ColubiMadrid"]');selected.click();
  await wait(()=>!viewer.historical.isLoading());
  const images=[...viewer.historical.getContainer().querySelectorAll('img')];
  assert(images.length>0&&images.every(i=>i.complete&&i.naturalWidth===256),'Colubi tiles did not decode');
  assert(viewer.historical instanceof L.TileLayer.WMS,'Colubi is not a WMS layer');
  const params=new URL(images[0].src).searchParams;
  assert(params.get('srs')==='EPSG:3857'&&params.get('layers')==='Carlos_Colubi_1889','Wrong WMS projection or layer');
  assert(document.querySelector('.leaflet-control-attribution').textContent.includes('Ayuntamiento de Madrid'),'Municipal attribution missing');
  assert($('downloads').textContent==='Índice de hojas (KML)'&&$('downloads').href.includes('Colubi.kml'),'Municipal source incorrectly points to CNIG');
  selected.focus();selected.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
  assert(document.activeElement.dataset.map==='FacundoMadrid','Arrow navigation failed');
  $('timeline').scrollLeft=0;$('timeline-next').click();await wait(()=>$('timeline').scrollLeft>0);
  assert(document.documentElement.scrollWidth===innerWidth,'Timeline overflows the page');
  $('close-info').click();
  return{maps:viewer.maps.length,questions:viewer.maps.reduce((n,m)=>n+m.faqs.length,0),colubiTiles:images.length,projection:params.get('srs'),context:$('info-context').textContent,scrolling:true,keyboard:true};
})();
