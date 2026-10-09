const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function setup({failed=[],mobile=false,reduced=false}={}) {
  function element(extra={}) {return Object.assign({events:{},attrs:{},addEventListener(type,fn){(this.events[type]??=[]).push(fn)},emit(type,event={}){for(const fn of this.events[type]??[])fn(event)},setAttribute(k,v){this.attrs[k]=v},firstElementChild:{textContent:''}},extra)}
  const slide=i=>{const img={complete:true,naturalWidth:failed.includes(i)?0:941};const s=element({img,active:i===0});s.classList={toggle:(name,value)=>s.active=value};s.querySelector=()=>img;return s};
  const front=[0,1,2].map(slide),rear=[0,1,2].map(slide);
  const stage=element({setPointerCapture:()=>{}});const gallery=element({contains:()=>true});const dots=[0,1,2].map(i=>element({attrs:{'data-active':String(i===0)}})),controls={hidden:true},caption={};
  const purchase=element(),purchaseDialog=element({open:false}),shareDialog=element({open:false});
  const desktop=element({matches:!mobile});const motion=element({matches:reduced});
  const document=element({hidden:false,activeElement:dots[0],querySelector:s=>s==='.visual'?gallery:s==='.front-stage'?stage:controls,querySelectorAll:s=>s==='.photo-dot'?dots:s.startsWith('.front')?front:rear,getElementById:id=>({'photo-caption':caption,'share-dialog':shareDialog})[id]});
  const window=element();let id=0;const timers=new Map();
  const source=fs.readFileSync('app.js','utf8');
  vm.runInNewContext(source.slice(source.indexOf('const gallery =')), {document,window,purchase,purchaseDialog,matchMedia:q=>q.includes('reduced')?motion:desktop,setTimeout:(fn,ms)=>{assert.equal(ms,5000);timers.set(++id,fn);return id},clearTimeout:id=>timers.delete(id)});
  const tick=()=>{assert.equal(timers.size,1);const [id,fn]=timers.entries().next().value;timers.delete(id);fn()};
  const gesture=(dx=0,dy=0)=>{stage.emit('pointerdown',{isPrimary:true,button:0,pointerId:1,clientX:150,clientY:150});stage.emit('pointerup',{pointerId:1,clientX:150+dx,clientY:150+dy})};
  return {stage,gesture,front,rear,gallery,dots,controls,document,window,purchase,purchaseDialog,shareDialog,desktop,timers,tick,index:()=>front.findIndex(s=>s.active)};
}
test('autoplay cycles suit, woman, fridge while pointer and focus stay in gallery',()=>{const g=setup();assert.equal(g.index(),0);g.gallery.emit('pointerenter',{pointerType:'mouse'});g.gallery.emit('focusin');g.tick();assert.equal(g.index(),1);g.tick();assert.equal(g.index(),2);g.tick();assert.equal(g.index(),0)});
test('tap advances once and dots only indicate position',()=>{const g=setup();g.gesture();g.stage.emit('click',{detail:1});assert.equal(g.index(),1);assert.equal(g.dots[1].attrs['data-active'],'true');g.dots[2].emit('click');assert.equal(g.index(),1);g.tick();assert.equal(g.index(),2)});
test('mobile starts at suit and autoplays, including reduced-motion setting',()=>{const g=setup({mobile:true,reduced:true});assert.equal(g.index(),0);assert.equal(g.controls.hidden,false);g.tick();assert.equal(g.index(),1);g.desktop.emit('change');assert.equal(g.index(),0);g.tick();assert.equal(g.index(),1)});
test('a failed image is skipped and does not disable autoplay',()=>{const g=setup({failed:[1]});g.tick();assert.equal(g.index(),2);assert.notEqual(g.rear.findIndex(s=>s.active),1);g.tick();assert.equal(g.index(),0)});
test('swipes skip unavailable photos in both directions',()=>{const g=setup({failed:[1]});g.gesture(-80);assert.equal(g.index(),2);g.gesture(80);assert.equal(g.index(),0)});
test('share dialog suspends automatic changes and closing it resumes them',()=>{const g=setup();g.shareDialog.open=true;g.document.emit('bbosongi:dialogchange');assert.equal(g.timers.size,0);g.shareDialog.open=false;g.document.emit('bbosongi:dialogchange');g.tick();assert.equal(g.index(),1)});
test('background tabs and purchase dialog suspend and then resume autoplay',()=>{const g=setup();g.document.hidden=true;g.document.emit('visibilitychange');assert.equal(g.timers.size,0);g.document.hidden=false;g.document.emit('visibilitychange');g.tick();assert.equal(g.index(),1);g.purchaseDialog.open=true;g.purchase.emit('click');assert.equal(g.timers.size,0);g.purchaseDialog.open=false;g.purchaseDialog.emit('close');g.tick();assert.equal(g.index(),2);g.window.emit('pageshow');assert.equal(g.timers.size,1)});

test('swipe left advances and right goes back with wrapping',()=>{const g=setup();g.gesture(80);assert.equal(g.index(),2);g.gesture(-80);assert.equal(g.index(),0);g.gesture(-80);assert.equal(g.index(),1);g.tick();assert.equal(g.index(),2)});
test('vertical scroll and canceled gestures never change photos',()=>{const g=setup();g.gesture(15,100);assert.equal(g.index(),0);g.stage.emit('pointerdown',{isPrimary:true,button:0,pointerId:1,clientX:10,clientY:10});assert.equal(g.timers.size,0);g.stage.emit('pointercancel');g.stage.emit('pointerup',{pointerId:1,clientX:100,clientY:10});assert.equal(g.index(),0);g.tick();assert.equal(g.index(),1)});
test('keyboard and assistive clicks work',()=>{const g=setup();g.stage.emit('keydown',{key:'ArrowLeft',preventDefault(){}});assert.equal(g.index(),2);g.stage.emit('keydown',{key:'Enter',preventDefault(){}});assert.equal(g.index(),0);g.stage.emit('click',{detail:0});assert.equal(g.index(),1)});
