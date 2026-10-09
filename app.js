// Keep the normal HTTPS link usable even when JavaScript is disabled.
const watch = document.getElementById('watch');
const webUrl = watch.href;
const isAndroid = /Android/i.test(navigator.userAgent);
const isMobile = isAndroid || /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
if (isAndroid) {
  watch.href = 'intent://www.youtube.com/shorts/cUWyAyXWnHM#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=' + encodeURIComponent(webUrl) + ';end';
  watch.addEventListener('click', () => {
    document.getElementById('app-help').hidden = false;
  });
} else if (!isMobile) {
  watch.target = '_blank';
  watch.rel = 'noopener noreferrer';
}
// iOS uses the original YouTube Universal Link. The host browser controls app handoff.

const purchase = document.getElementById('purchase');
const purchaseDialog = document.getElementById('purchase-dialog');
let noticeReturnFocus = purchase;
function showNotice(message, trigger = document.activeElement) {
  noticeReturnFocus = trigger;
  document.getElementById('purchase-message').textContent = message;
  if (!purchaseDialog.open) purchaseDialog.showModal();
  document.dispatchEvent(new Event('bbosongi:dialogchange'));
}
purchase.addEventListener('click', () => showNotice('온라인 판매를 준비하고 있어요.', purchase));
purchaseDialog.addEventListener('close', () => noticeReturnFocus?.focus({ preventScroll: true }));
purchaseDialog.addEventListener('click', (event) => {
  if (event.target !== purchaseDialog) return;
  const rect = purchaseDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) purchaseDialog.close();
});

// Swipe or tap the photo; dots only indicate position.
const gallery = document.querySelector('.visual');
const photoStage = document.querySelector('.front-stage');
const frontSlides = [...document.querySelectorAll('.front-stage .photo-slide')];
const rearSlides = [...document.querySelectorAll('.rear-stage .photo-slide')];
const photoDots = [...document.querySelectorAll('.photo-dot')];
const desktopGallery = matchMedia('(min-width: 768px)');
const captions = ['우리 집에 뽀송이가 떴다!', '일상 속에서 만나는 뽀송이', '냉장고 속 작은 청정 지킴이'];
let photoIndex = 0;
let photoTimer;
let photoGesture = null;
function photoLoaded(slide) {
  const image = slide.querySelector('img');
  return image.complete && image.naturalWidth > 0;
}
function schedulePhoto() {
  clearTimeout(photoTimer);
  if (photoGesture || document.hidden || purchaseDialog.open || document.getElementById('share-dialog')?.open) return;
  photoTimer = setTimeout(() => { advancePhoto(); schedulePhoto(); }, 5000);
}
function advancePhoto(direction = 1) {
  // Skip unavailable photos without letting one failed image stop the gallery.
  for (let offset = 1; offset < frontSlides.length; offset++) {
    const next = (photoIndex + direction * offset + frontSlides.length) % frontSlides.length;
    if (photoLoaded(frontSlides[next])) {
      photoIndex = next;
      renderPhoto();
      return;
    }
  }
}
function renderPhoto() {
  let rearIndex = (photoIndex + frontSlides.length - 1) % frontSlides.length;
  for (let offset = 0; offset < rearSlides.length; offset++) {
    const candidate = (rearIndex - offset + rearSlides.length) % rearSlides.length;
    if (photoLoaded(rearSlides[candidate])) { rearIndex = candidate; break; }
  }
  for (const [slides, active] of [[frontSlides, photoIndex], [rearSlides, rearIndex]]) {
    slides.forEach((slide, index) => {
      slide.classList.toggle('is-active', index === active);
      slide.setAttribute('aria-hidden', String(index !== active));
    });
  }
  document.getElementById('photo-caption').textContent = captions[photoIndex];
  photoDots.forEach((dot, index) => dot.setAttribute('data-active', String(index === photoIndex)));
  photoStage.setAttribute('aria-label', captions[photoIndex] + '. 사진 ' + (photoIndex + 1) + '/3. 누르면 다음 사진, 좌우로 쓸면 이전·다음 사진');
}
photoStage.setAttribute('role', 'button');
photoStage.setAttribute('tabindex', '0');
photoStage.addEventListener('pointerdown', (event) => {
  if (!event.isPrimary || event.button !== 0) return;
  photoGesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
  photoStage.setPointerCapture(event.pointerId);
  clearTimeout(photoTimer);
});
photoStage.addEventListener('pointerup', (event) => {
  if (!photoGesture || photoGesture.id !== event.pointerId) return;
  const dx = event.clientX - photoGesture.x;
  const dy = event.clientY - photoGesture.y;
  photoGesture = null;
  if (Math.abs(dx) >= 40 && Math.abs(dx) > Math.abs(dy) * 1.25) advancePhoto(dx < 0 ? 1 : -1);
  else if (Math.abs(dx) <= 10 && Math.abs(dy) <= 10) advancePhoto();
  schedulePhoto();
});
function cancelPhotoGesture() {
  if (!photoGesture) return;
  photoGesture = null;
  schedulePhoto();
}
photoStage.addEventListener('pointercancel', cancelPhotoGesture);
photoStage.addEventListener('lostpointercapture', cancelPhotoGesture);
photoStage.addEventListener('dragstart', (event) => event.preventDefault());
photoStage.addEventListener('keydown', (event) => {
  if (!['Enter', ' ', 'ArrowLeft', 'ArrowRight'].includes(event.key)) return;
  event.preventDefault();
  advancePhoto(event.key === 'ArrowLeft' ? -1 : 1);
  schedulePhoto();
});
// Assistive technology may activate a button without pointer events.
photoStage.addEventListener('click', (event) => {
  if (event.detail !== 0) return;
  advancePhoto();
  schedulePhoto();
});
window.addEventListener('blur', cancelPhotoGesture);
document.addEventListener('visibilitychange', schedulePhoto);
document.addEventListener('bbosongi:dialogchange', schedulePhoto);
window.addEventListener('pageshow', schedulePhoto);
purchase.addEventListener('click', schedulePhoto);
purchaseDialog.addEventListener('close', schedulePhoto);
desktopGallery.addEventListener('change', () => {
  photoIndex = 0;
  renderPhoto();
  schedulePhoto();
});
// The initial markup always shows the suit image, including on mobile.
// Do not gate the timer on decoding every image: srcset switches can abort decode().
document.querySelector('.photo-controls').hidden = false;
renderPhoto();
schedulePhoto();
