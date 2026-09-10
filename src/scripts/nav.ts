// Floating nav: the link list collapses behind a button on narrower viewports.
export function initNav(): void {
  const links = document.querySelector<HTMLElement>('.nav-links');
  const btn = document.querySelector<HTMLButtonElement>('.mobile-menu');
  if (!links || !btn) return;

  const set = (open: boolean): void => {
    links.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? '✕' : '☰';
  };
  btn.addEventListener('click', () => set(!links.classList.contains('open')));
  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => set(false)));
  document.addEventListener('click', (e) => {
    if (!links.classList.contains('open')) return;
    const t = e.target as Node;
    if (links.contains(t) || btn.contains(t)) return;
    set(false);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
}
