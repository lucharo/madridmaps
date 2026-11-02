(async()=>{
  // Replaces the browser's position provider so permission, movement and denial are deterministic.
  const $=id=>document.getElementById(id),v=window.madridViewer;
  const assert=(condition,message)=>{if(!condition)throw new Error(message);};
  const tick=()=>new Promise(r=>setTimeout(r,50));
  assert(v,'Viewer missing');
  const real=Object.getOwnPropertyDescriptor(Navigator.prototype,'geolocation');
  const watches=new Map();let next=0,started=0,cleared=0;
  const emit=coords=>{for(const w of watches.values())w.ok({coords:{accuracy:30,...coords}});};
  const fail=code=>{for(const w of watches.values())w.fail({code});};
  Object.defineProperty(navigator,'geolocation',{configurable:true,value:{
    watchPosition(ok,failure){started++;watches.set(++next,{ok,fail:failure});return next;},
    clearWatch(id){if(watches.delete(id))cleared++;},getCurrentPosition(){}
  }});
  const paths=()=>document.querySelectorAll('.leaflet-overlay-pane path').length;
  const pressed=()=>$('locate').getAttribute('aria-pressed');
  try{
    assert(started===0&&pressed()==='false','Location started before the button was tapped');
    $('locate').click();await tick();
    assert(started===1&&watches.size===1&&pressed()==='true','Tapping did not start watching');
    emit({latitude:40.4168,longitude:-3.7038});await tick();
    assert(paths()===2,'Dot and accuracy ring missing inside Madrid');
    assert(v.map.getCenter().distanceTo([40.4168,-3.7038])<5&&v.map.getZoom()>=16,'First fix did not centre the map');
    v.map.panBy([120,0],{animate:false});const centre=v.map.getCenter();
    emit({latitude:40.42,longitude:-3.70});await tick();
    assert(paths()===2&&v.map.getCenter().equals(centre),'Later fixes should move the dot without recentring');
    emit({latitude:51.5,longitude:-0.12});await tick();
    assert(paths()===0&&watches.size===0&&cleared===1&&pressed()==='false','Leaving Madrid did not clear the dot and stop watching');
    assert($('note-live').textContent.includes('Madrid')&&!$('view-note').hidden,'Out-of-area notice missing');
    $('locate').click();await tick();fail(1);await tick();
    assert(watches.size===0&&pressed()==='false'&&$('note-live').textContent.includes('permiso'),'Denied permission was not explained');
    $('locate').click();await tick();emit({latitude:40.4168,longitude:-3.7038});await tick();
    $('locate').click();await tick();
    assert(paths()===0&&watches.size===0&&pressed()==='false','Second tap did not stop location');
    return{noWatchBeforeTap:true,dot:true,follow:true,outside:true,denied:true,stop:true,watches:started};
  }finally{
    if(real)delete navigator.geolocation;
    $('view-note').hidden=true;
  }
})();
