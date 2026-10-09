// Sharing opens a composer; the visitor chooses recipients and sends the message.
(() => {
  const trigger = document.getElementById('share');
  const dialog = document.getElementById('share-dialog');
  const status = document.getElementById('share-status');
  const manual = document.getElementById('manual-copy');
  const urlField = document.getElementById('share-url');
  // Always share the public landing page, including from a private preview.
  const url = 'https://siyoung4557.github.io/BBOSONGI/';
  const title = '우리집 청정구역 지킴이, 복돼지 뽀송이';
  let cancelLaunch = () => {};
  let sharing = false;
  const notifyDialog = () => document.dispatchEvent(new Event('bbosongi:dialogchange'));
  trigger.addEventListener('click', () => {
    status.textContent = '';
    manual.hidden = true;
    dialog.showModal();
    notifyDialog();
  });
  dialog.querySelector('.share-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    cancelLaunch();
    trigger.focus({ preventScroll: true });
    notifyDialog();
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
  const error = (message, button) => showNotice(message, button);
  async function copy(button) {
    let copied = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        copied = true;
      }
    } catch { /* Older in-app browsers can reject clipboard permissions. */ }
    if (!copied) {
      manual.hidden = false;
      urlField.value = url;
      urlField.focus();
      urlField.select();
      try { copied = document.execCommand('copy'); } catch { /* Keep selectable URL. */ }
    }
    if (copied) {
      manual.hidden = true;
      button.focus({ preventScroll: true });
      status.textContent = '링크를 복사했어요! 원하는 곳에 붙여넣어 주세요.';
    } else {
      status.textContent = '자동 복사를 사용할 수 없어요.';
    }
  }
  function launch(uri, label, button) {
    cancelLaunch();
    let timer;
    const clear = () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', clear);
    };
    const onVisibility = () => { if (document.hidden) clear(); };
    cancelLaunch = clear;
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', clear);
    // A timeout is only a best-effort handoff check, never an installation test.
    timer = setTimeout(() => {
      clear();
      if (!document.hidden && dialog.open) error(`${label} 앱을 열지 못했어요. 앱 설치 여부를 확인하거나 링크 복사를 이용해 주세요.`, button);
    }, 2500);
    status.textContent = `${label} 앱에서 받는 사람을 선택해 주세요.`;
    try { window.location.href = uri; }
    catch { clear(); error(`${label} 앱을 열 수 없어요. 링크 복사를 이용해 주세요.`, button); }
  }
  async function kakao(button) {
    // Until a Kakao JavaScript key/domain is configured, use the OS share sheet.
    // Web Share cannot choose an app or tell us which targets are installed.
    if (!navigator.share) {
      error('이 브라우저에서는 카카오톡 공유창을 열 수 없어요. 링크를 복사해 카카오톡에 붙여넣어 주세요.', button);
      return;
    }
    status.textContent = '공유 화면에서 카카오톡을 선택해 주세요. 목록에 없으면 앱 설치를 확인하거나 링크 복사를 이용해 주세요.';
    sharing = true;
    try { await navigator.share({ title, text: title, url }); }
    catch (err) {
      if (err.name === 'AbortError') status.textContent = '공유를 취소했어요. 앱이 목록에 없으면 설치 여부를 확인하거나 링크를 복사해 주세요.';
      else error('공유창을 열지 못했어요. 링크 복사를 이용해 주세요.', button);
    } finally { sharing = false; }
  }
  dialog.querySelectorAll('[data-share]').forEach(button => button.addEventListener('click', async () => {
    if (sharing) return;
    cancelLaunch();
    const action = button.dataset.share;
    if (action === 'copy') return copy(button);
    if (!isMobile) {
      error('앱으로 공유하기는 휴대폰에서 이용해 주세요. PC에서는 링크 복사를 이용할 수 있어요.', button);
      return;
    }
    if (action === 'kakao') return kakao(button);
    const body = encodeURIComponent(`${title}\n${url}`);
    if (action === 'sms') launch(`sms:${isAndroid ? '?' : '&'}body=${body}`, '문자', button);
    if (action === 'telegram') launch(`tg://msg_url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '텔레그램', button);
  }));
})();
