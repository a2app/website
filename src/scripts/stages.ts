// The two pinned stages after the hero. Same split as the hero: headings are
// scroll-driven, the illustrations play themselves once the stage is reached.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { clamp, range, lerp, outCubic, outBack, STATIC } from './motion';

const DEV_S = 2.5;
const DEV_TRIGGER = .26;
const D = { src: [0, .12], beam: [.06, .24], in: [[.12, .42], [.40, .66], [.62, .88]] };

export function initRail(): void {
  const wrap = document.querySelector<HTMLElement>('[data-rail]');
  if (!wrap) return;
  const rc = Array.from(wrap.querySelectorAll<HTMLElement>('[data-rc]'));
  const live2 = wrap.querySelector<SVGLineElement>('#live2');
  const nodes = Array.from(wrap.querySelectorAll<HTMLElement>('[data-node]'));
  let current = 0;

  const rail = (p: number): void => {
    current = p;
    rc.forEach((el, i) => {
      const a = range(p, .03 + i * .045, .22 + i * .045);
      el.style.opacity = String(a);
      el.style.transform = `translateY(${lerp(26, 0, outCubic(a))}px)`;
    });
    const draw = range(p, .24, .82);
    live2?.setAttribute('stroke-dashoffset', String(810 * (1 - outCubic(draw))));
    nodes.forEach((nd, i) => {
      const s = .26 + i * .20;
      const a = range(p, s, s + .20);
      const e = outBack(a);
      nd.style.opacity = String(Math.min(1, a * 1.7));
      if (!nd.dataset.hover) nd.style.transform = `translateY(${lerp(40, 0, e)}px)`;
      const dot = nd.querySelector<HTMLElement>('.dot');
      if (dot) {
        dot.style.transform = `scale(${lerp(.45, 1, e)})`;
        dot.style.boxShadow = `0 0 ${26 * a}px rgba(110,231,183,${.4 * a})`;
      }
    });
  };

  if (STATIC) { rail(1); return; }

  ScrollTrigger.create({
    trigger: wrap, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => rail(self.progress),
    onRefresh: (self) => rail(self.progress),
  });
  rail(0);

  // magnetic tilt on the step cards
  for (const card of wrap.querySelectorAll<HTMLElement>('[data-tilt]')) {
    const inner = card.querySelector<HTMLElement>('.node-in');
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.dataset.hover = '1';
      card.style.transform = `perspective(900px) rotateX(${(.5 - py) * 8}deg) rotateY(${(px - .5) * 10}deg) translateY(-4px) scale(1.012)`;
      card.style.setProperty('--ang', `${px * 260}deg`);
      inner?.style.setProperty('--mx', `${px * 100}%`);
      inner?.style.setProperty('--my', `${py * 100}%`);
    });
    card.addEventListener('pointerleave', () => {
      delete card.dataset.hover;
      card.style.transform = '';
      rail(current);
    });
  }
}

export function initDevices(): void {
  const wrap = document.querySelector<HTMLElement>('[data-devices]');
  if (!wrap) return;
  const dc = Array.from(wrap.querySelectorAll<HTMLElement>('[data-dc]'));
  const devs = Array.from(wrap.querySelectorAll<HTMLElement>('[data-dev]'));
  const dcaps = Array.from(wrap.querySelectorAll<HTMLElement>('[data-dcap]'));
  const beam = wrap.querySelector<SVGElement>('#beam');
  const src = wrap.querySelector<HTMLElement>('#src');

  const devCopy = (p: number): void => {
    dc.forEach((el, i) => {
      const a = range(p, .02 + i * .05, .22 + i * .05);
      el.style.opacity = String(a);
      el.style.transform = `translateY(${lerp(24, 0, outCubic(a))}px)`;
    });
  };
  const devPlay = (t: number): void => {
    if (src) src.style.opacity = String(range(t, D.src[0], D.src[1]));
    if (beam) beam.style.opacity = String(range(t, D.beam[0], D.beam[1]));
    devs.forEach((d, i) => {
      const w = D.in[i];
      const a = range(t, w[0], w[1]);
      const e = outCubic(a);
      d.style.opacity = String(a);
      d.style.transform = i === 0
        ? `translateY(${lerp(44, 0, e)}px) scale(${lerp(.9, 1, e)})`
        : `translateX(${lerp(-96, 0, e)}px) translateY(${lerp(22, 0, e)}px) scale(${lerp(.6, 1, e)})`;
      if (dcaps[i]) dcaps[i].style.opacity = String(range(t, w[1] - .06, w[1] + .04));
    });
  };

  if (STATIC) { devCopy(1); devPlay(1); return; }

  let played = false;
  const play = { t: 0 };
  const startDevices = (): void => {
    if (played) return;
    played = true;
    gsap.to(play, { t: 1, duration: DEV_S, ease: 'none', onUpdate: () => devPlay(clamp(play.t)) });
  };
  const apply = (p: number): void => {
    devCopy(p);
    if (p >= DEV_TRIGGER) startDevices();
  };
  devPlay(0);
  ScrollTrigger.create({
    trigger: wrap, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => apply(self.progress),
    onRefresh: (self) => apply(self.progress),
  });
  apply(0);
}
