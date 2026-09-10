// Demo tabs, keyboard-navigable per the WAI-ARIA tabs pattern.
export function initDemo(): void {
  for (const root of document.querySelectorAll<HTMLElement>('[data-tabs]')) {
    const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-tab]'));
    const panels = Array.from(root.querySelectorAll<HTMLElement>('[data-panel]'));
    const select = (index: number, focus = false): void => {
      tabs.forEach((t, i) => {
        const on = i === index;
        t.classList.toggle('active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      panels.forEach((p, i) => {
        p.classList.toggle('active', i === index);
        p.hidden = i !== index;
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(i));
      t.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') select((i + 1) % tabs.length, true);
        else if (e.key === 'ArrowLeft') select((i - 1 + tabs.length) % tabs.length, true);
        else if (e.key === 'Home') select(0, true);
        else if (e.key === 'End') select(tabs.length - 1, true);
      });
    });
    select(Math.max(0, tabs.findIndex((t) => t.classList.contains('active'))));
  }
}
