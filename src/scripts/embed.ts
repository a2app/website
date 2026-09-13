// Live demo embeds: swap the poster for an iframe running the real app.
import { STATIC } from './motion';

export function initEmbeds(): void {
  for (const box of document.querySelectorAll<HTMLElement>('[data-embed]')) {
    const btn = box.querySelector<HTMLButtonElement>('[data-run]');
    if (!btn) continue;
    btn.addEventListener('click', () => start(box));
  }
  initAutostart();
}

function start(box: HTMLElement): void {
  if (box.classList.contains('live')) return;
  const frame = document.createElement('iframe');
  frame.src = `/demos/run.html?app=${encodeURIComponent(box.dataset.embed ?? '')}`;
  frame.title = `${box.dataset.title ?? 'Live'} demo`;
  frame.setAttribute('allow', 'fullscreen');
  holdScroll(frame);
  box.classList.add('live');
  box.appendChild(frame);
}

// The front page's demo starts itself once it settles in view, so the first
// thing a visitor sees of the product is a running app rather than a button.
// It is about 2 MB, so this is deliberately narrow: one embed, desktop only,
// never on a metered connection, and never while the page is still moving.
// Everywhere else the button stays the only way in.
function initAutostart(): void {
  const box = document.querySelector<HTMLElement>('[data-embed][data-autostart]');
  // STATIC covers phones and reduced motion, where an unasked 2 MB is rudest.
  if (!box || STATIC) return;
  if ((navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData) return;

  let timer = 0;
  const check = (): void => {
    clearTimeout(timer);
    // Debounced on scroll, so this only fires once the page has stopped: holdScroll
    // gives up on the first gesture, and starting mid-scroll would leave the boot
    // unprotected against the iframe-load jump it exists to absorb.
    timer = window.setTimeout(() => {
      const r = box.getBoundingClientRect();
      const shown = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
      if (r.height > 0 && shown / r.height >= 0.55) {
        removeEventListener('scroll', check);
        start(box);
      }
    }, 700);
  };
  addEventListener('scroll', check, { passive: true });
  check();
}

// Chromium quirk: once the page has been clicked, the next iframe that
// finishes loading makes the browser scroll the page toward the click point,
// or to the top. Hold the scroll position while the demo boots, and let go on
// the first deliberate scroll gesture or shortly after the frame has loaded.
function holdScroll(frame: HTMLIFrameElement): void {
  const y = window.scrollY;
  let held = true;
  const onScroll = (): void => {
    if (held && Math.abs(window.scrollY - y) > 1) window.scrollTo({ top: y, behavior: 'instant' });
  };
  const release = (): void => {
    held = false;
    removeEventListener('scroll', onScroll);
  };
  addEventListener('scroll', onScroll);
  for (const ev of ['wheel', 'touchstart', 'keydown']) addEventListener(ev, release, { once: true, passive: true });
  frame.addEventListener('load', () => setTimeout(release, 1500));
  setTimeout(release, 5000);
}
