const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const URL = 'https://siyoung-lim-B.github.io/BBOSONGI/';
function setup({ mobile = true, android = false, clipboardFails = false, nativeShare } = {}) {
  function el(extra = {}) { return Object.assign({ events: {}, hidden: true, textContent: '', addEventListener(t,f){(this.events[t]??=new Set()).add(f)}, removeEventListener(t,f){this.events[t]?.delete(f)}, async emit(t,e={}){for(const f of [...this.events[t]??[]]) await f(e)}, focus(){}, select(){}, showModal(){this.open=true}, close(){this.open=false;return this.emit('close')} },extra); }
  const nodes = Object.fromEntries(['share','share-dialog','share-status','manual-copy','share-url'].map(x=>[x,el()]));
  const buttons = Object.fromEntries(['copy','kakao','sms','telegram'].map(x=>[x,el({dataset:{share:x}})]));
  const close = el(); const dialog=nodes['share-dialog'];dialog.querySelector=()=>close;dialog.querySelectorAll=()=>Object.values(buttons);
  const document = el({ hidden:false, getElementById:id=>nodes[id],querySelector:()=>({content:'https://preview.example/'}),execCommand:()=>false,dispatchEvent(){} });
  const window = el({location:{href:''}});let n=0;const timers=new Map(), notices=[],copies=[],shares=[];
  const navigator={clipboard:{writeText:async text=>{if(clipboardFails)throw Error();copies.push(text)}}};
  if(nativeShare)navigator.share=async data=>{shares.push(data);return nativeShare(data)};
  vm.runInNewContext(fs.readFileSync('share.js','utf8'),{document,window,navigator,isMobile:mobile,isAndroid:android,showNotice:message=>notices.push(message),Event:class{},setTimeout:f=>{timers.set(++n,f);return n},clearTimeout:n=>timers.delete(n)});
  return {nodes,buttons,dialog,document,window,timers,notices,copies,shares,open:()=>nodes.share.emit('click'),click:x=>buttons[x].emit('click'),tick:()=>{for(const [id,f] of [...timers]){timers.delete(id);f()}}};
}
test('copies canonical link and offers manual copy if permission is denied',async()=>{const s=setup();await s.open();await s.click('copy');assert.deepEqual(s.copies,[URL]);assert.match(s.nodes['share-status'].textContent,/복사했어요/);const denied=setup({clipboardFails:true});await denied.open();await denied.click('copy');assert.equal(denied.nodes['manual-copy'].hidden,false);assert.equal(denied.nodes['share-url'].value,URL);assert.doesNotMatch(denied.nodes['share-status'].textContent,/복사했어요/)});
test('all PC app options show existing notice without navigating',async()=>{const s=setup({mobile:false});await s.open();for(const x of ['kakao','sms','telegram'])await s.click(x);assert.equal(s.notices.length,3);assert.equal(s.window.location.href,'')});
test('SMS preserves Korean title and URL on Android and iOS',async()=>{for(const android of [false,true]){const s=setup({android});await s.open();await s.click('sms');assert.ok(s.window.location.href.startsWith(android?'sms:?body=':'sms:&body='));assert.ok(decodeURIComponent(s.window.location.href).includes(URL));assert.ok(decodeURIComponent(s.window.location.href).includes('복돼지 뽀송이'))}});
test('failed app launch shows notice, successful background handoff cancels timer',async()=>{const s=setup();await s.open();await s.click('telegram');assert.match(s.window.location.href,/^tg:\/\/msg_url\?url=/);s.tick();assert.equal(s.notices.length,1);await s.click('telegram');s.document.hidden=true;await s.document.emit('visibilitychange');s.tick();assert.equal(s.notices.length,1);s.document.hidden=false;await s.click('telegram');await s.dialog.close();s.tick();assert.equal(s.notices.length,1)});
test('Kakao fallback shares the link through OS sheet and cancellation is not success',async()=>{const s=setup({nativeShare:()=>{const e=Error();e.name='AbortError';throw e}});await s.open();await s.click('kakao');assert.equal(s.shares[0].url,URL);assert.match(s.nodes['share-status'].textContent,/취소/);assert.equal(s.notices.length,0);const noApi=setup();await noApi.open();await noApi.click('kakao');assert.equal(noApi.notices.length,1)});
