// Live demo embeds: swap the poster for an iframe running the real app.
export function initEmbeds(): void {
  for (const box of document.querySelectorAll<HTMLElement>('[data-embed]')) {
    const btn = box.querySelector<HTMLButtonElement>('[data-run]');
    if (!btn) continue;
    btn.addEventListener('click', () => {
      if (box.classList.contains('live')) return;
      const frame = document.createElement('iframe');
      frame.src = `/demos/run.html?app=${encodeURIComponent(box.dataset.embed ?? '')}`;
      frame.title = `${box.dataset.title ?? 'Live'} demo`;
      frame.setAttribute('allow', 'fullscreen');
      holdScroll(frame);
      box.classList.add('live');
      box.appendChild(frame);
    });
  }
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
