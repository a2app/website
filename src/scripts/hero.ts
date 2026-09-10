// The hero: a typed prompt on the left, the generated app assembling on the
// right. The left column is scroll-driven. The build itself is time-driven —
// once the prompt has been answered it plays through on its own so the reader
// never has to keep scrolling to watch it finish, and it never rewinds. The
// final takeover (app breaking out of its column while the copy leaves) stays
// tied to scroll so scrolling back restores the headline.
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { clamp, range, lerp, outCubic, outBack, STATIC } from './motion';
import { setBoost } from './field';

const PROMPT = 'Build me a sales analytics dashboard with charts and KPIs';
const REGIONS = [
  { w: .86, c: 'var(--mint)', p: 86 },
  { w: .62, c: 'var(--indigo)', p: 62 },
  { w: .44, c: 'var(--pink)', p: 44 },
  { w: .28, c: 'rgba(255,255,255,.3)', p: 28 },
];
const TRIGGER = .38;
const BUILD_S = 4.3;
const AUTO_DELAY_S = 3.2;
const AUTO_S = 2.3;
const AUTO_TO = .42;
const B = {
  frame: [0, .085], live: [.06, .11], scan: [.05, .58],
  cmp: [.10, .15, .20, .25, .33, .44, .53], cmpDur: .09,
  line: [.37, .51], area: [.45, .55], head: [.50, .55],
  row0: .47, rowStep: .017, rowDur: .09,
  copyOut: [.62, .76], climax: [.62, .88], verdict: [.80, .95],
  bloom: [.10, .72], boost: [.05, .80],
};
const FMT: Array<(t: number) => string> = [
  (t) => `$${(1.24 * t).toFixed(2)}M`,
  (t) => `$${(3.8 * t).toFixed(1)}M`,
  (t) => `${(38.2 * t).toFixed(1)}%`,
  (t) => String(Math.round(412 * t)),
];

export function initHero(): void {
  const wrap = document.querySelector<HTMLElement>('[data-hero]');
  if (!wrap) return;
  const q = <T extends Element>(sel: string): T => {
    const el = wrap.querySelector<T>(sel);
    if (!el) throw new Error(`hero: missing ${sel}`);
    return el;
  };
  const all = <T extends Element>(sel: string): T[] => Array.from(wrap.querySelectorAll<T>(sel));

  const rowsEl = q<HTMLElement>('#rows');
  for (const r of REGIONS) {
    const d = document.createElement('div');
    d.className = 'row';
    d.innerHTML = `<span class="nm"></span><span class="track"><i style="width:${r.w * 100}%;background:${r.c}"></i></span><span class="pc mono">0%</span>`;
    rowsEl.appendChild(d);
  }

  const els = {
    inner: q<HTMLElement>('[data-hero-inner]'),
    copy: q<HTMLElement>('[data-copy]'),
    typed: q<HTMLElement>('#typed'),
    caret: q<HTMLElement>('#caret'),
    agent: q<HTMLElement>('#agentBubble'),
    frame: q<HTMLElement>('#frame'),
    bloom: q<HTMLElement>('#bloom'),
    stage: q<HTMLElement>('.stage'),
    idle: q<HTMLElement>('#idle'),
    lens: q<HTMLElement>('#lens'),
    scan: q<HTMLElement>('#scan'),
    cue: q<HTMLElement>('#cue'),
    liveTag: q<HTMLElement>('#liveTag'),
    verdict: q<HTMLElement>('#verdict'),
    cmps: all<HTMLElement>('[data-cmp]'),
    vals: all<HTMLElement>('.kpi .val'),
    sparks: all<SVGPathElement>('.spark path'),
    line: q<SVGPathElement>('#line'),
    area: q<SVGPathElement>('#area'),
    head: q<SVGCircleElement>('#head'),
    rowEls: Array.from(rowsEl.children) as HTMLElement[],
    v: [q<HTMLElement>('#v0'), q<HTMLElement>('#v1'), q<HTMLElement>('#v2')],
  };

  // split the headline into characters; they light up on load, not on scroll
  all<HTMLElement>('[data-split]').forEach((el, gi) => {
    const txt = el.textContent ?? '';
    el.innerHTML = Array.from(txt)
      .map((ch, i) => `<span class="ch" style="transition-delay:${(.15 + gi * .09 + i * .032).toFixed(3)}s">${ch === ' ' ? '&nbsp;' : ch}</span>`)
      .join('');
  });
  requestAnimationFrame(() => els.copy.classList.add('lit'));

  // the finished app breaks out of its column at the climax
  const EX = { colLeft: 0, colW: 0, wrapCentre: 0, k: 1 };
  const measure = (): void => {
    const prev = els.frame.style.transform;
    els.frame.style.transform = 'none';
    els.frame.style.setProperty('--k', '1');
    els.stage.style.height = 'auto';
    const fh = els.frame.offsetHeight;
    els.stage.style.height = `${fh}px`;
    const sr = els.stage.getBoundingClientRect();
    const wr = els.inner.getBoundingClientRect();
    EX.colLeft = sr.left;
    EX.colW = sr.width;
    EX.wrapCentre = wr.left + wr.width / 2;
    // capped so the enlarged app still clears the verdict line beneath it
    EX.k = Math.max(1, Math.min(wr.width / sr.width, (innerHeight * .70) / fh));
    els.frame.style.transform = prev;
  };

  let heroP = 0;
  let autoP = 0;
  let gate = 0;
  let built = false;
  let lastT = 0;

  // scroll-driven: prompt + agent reply
  const left = (p: number): void => {
    const t = range(p, .05, .32);
    els.typed.textContent = PROMPT.slice(0, Math.round(t * PROMPT.length));
    els.caret.style.opacity = p > .01 && p < .38 ? '1' : '0';
    const ag = range(p, .30, .40);
    els.agent.style.opacity = String(ag);
    els.agent.style.transform = `translateY(${lerp(8, 0, outCubic(ag))}px)`;
    els.cue.style.opacity = String(1 - range(p, .02, .12));
  };
  const renderLeft = (): void => left(Math.max(heroP, autoP));

  // time-driven: the whole app generation
  const right = (t: number): void => {
    setBoost(range(t, B.boost[0], B.boost[1]));
    els.idle.style.opacity = String(1 - range(t, 0, .09));

    const fr = range(t, B.frame[0], B.frame[1]);
    const fe = outCubic(fr);
    els.frame.style.opacity = String(fr);

    const ce = outCubic(range(t, B.climax[0], B.climax[1])) * gate;
    const k = lerp(1, EX.k, ce);
    const dx = ce * (EX.wrapCentre - (EX.colLeft + EX.colW * k / 2));
    els.frame.style.setProperty('--k', String(k));
    els.frame.style.transform = `translateX(${dx}px) translateY(-50%) scale(${lerp(.93, 1, fe)}) rotateY(${lerp(8, 0, fe)}deg)`;
    els.bloom.style.opacity = String(lerp(0, .95, range(t, B.bloom[0], B.bloom[1])));
    els.bloom.style.transform = `translate(calc(-50% + ${dx}px),-50%) scale(${lerp(1, EX.k * .92, ce)})`;

    els.liveTag.style.opacity = String(range(t, B.live[0], B.live[1]) * (1 - range(t, .56, .62)));

    const sc = range(t, B.scan[0], B.scan[1]);
    els.scan.style.opacity = sc > 0 && sc < 1 ? '1' : '0';
    els.scan.style.transform = `translateY(${lerp(-160, els.frame.offsetHeight, sc)}px)`;

    // each component: dashed ghost → snap → filled
    els.cmps.forEach((c, i) => {
      const s = B.cmp[i];
      const tt = range(t, s, s + B.cmpDur);
      const e = outBack(tt);
      c.style.opacity = String(Math.min(1, tt * 3));
      c.style.transform = `translateY(${lerp(24, 0, e)}px) scale(${lerp(.9, 1, e)})`;
      const ghost = c.querySelector<HTMLElement>('.ghost');
      const real = c.querySelector<HTMLElement>('.real');
      if (ghost) ghost.style.opacity = String(tt <= 0 ? 0 : tt < .5 ? tt / .5 : Math.max(0, (1 - tt) / .5));
      if (real) real.style.opacity = String(range(t, s + B.cmpDur * .42, s + B.cmpDur));
      const flash = Math.max(0, 1 - Math.abs(tt - .62) / .26);
      c.style.boxShadow = flash > 0 ? `0 0 ${30 * flash}px rgba(110,231,183,${.5 * flash})` : 'none';
    });

    els.vals.forEach((v, i) => { v.textContent = FMT[i](outCubic(range(t, B.cmp[i] + .03, B.cmp[i] + .15))); });
    els.sparks.forEach((sp, i) => {
      sp.style.strokeDasharray = '1';
      sp.style.strokeDashoffset = String(1 - outCubic(range(t, B.cmp[i] + .04, B.cmp[i] + .15)));
    });

    els.line.style.strokeDasharray = '1';
    els.line.style.strokeDashoffset = String(1 - outCubic(range(t, B.line[0], B.line[1])));
    els.area.style.opacity = String(range(t, B.area[0], B.area[1]));
    els.head.style.opacity = String(range(t, B.head[0], B.head[1]));

    els.rowEls.forEach((rw, i) => {
      const a = outCubic(range(t, B.row0 + i * B.rowStep, B.row0 + i * B.rowStep + B.rowDur));
      const bar = rw.querySelector<HTMLElement>('i');
      const pc = rw.querySelector<HTMLElement>('.pc');
      if (bar) bar.style.transform = `scaleX(${a})`;
      if (pc) pc.textContent = `${Math.round(REGIONS[i].p * a)}%`;
    });

    const out = range(t, B.copyOut[0], B.copyOut[1]) * gate;
    els.copy.style.opacity = String(1 - out);
    els.copy.style.transform = `translateX(${-30 * out}px)`;

    const vv = range(t, B.verdict[0], B.verdict[1]);
    const ve = outCubic(vv);
    els.verdict.style.opacity = String(vv * gate);
    els.verdict.style.transform = `translateX(-50%) translateY(${lerp(16, 0, ve)}px)`;
    els.v[0].textContent = String(Math.round(7 * ve));
    els.v[1].textContent = `${(1.2 * ve).toFixed(1)}s`;
    els.v[2].textContent = '0';
  };

  if (STATIC) {
    // everything finished, nothing hidden
    built = true; lastT = 1; gate = 0; autoP = 1;
    left(1); right(1);
    els.copy.style.opacity = '1'; els.copy.style.transform = 'none';
    els.typed.textContent = PROMPT; els.caret.style.display = 'none';
    els.scan.style.opacity = '0'; els.cue.style.display = 'none'; els.bloom.style.opacity = '.6';
    els.idle.style.display = 'none';
    els.frame.classList.add('swept');
    els.verdict.style.opacity = '1'; els.verdict.style.transform = 'none';
    els.v[0].textContent = '7'; els.v[1].textContent = '1.2s'; els.v[2].textContent = '0';
    setBoost(.35);
    return;
  }

  const build = { t: 0 };
  const auto = { p: 0 };
  let autoTween: gsap.core.Tween | null = null;

  const startBuild = (): void => {
    if (built) return;
    built = true;
    autoTween?.kill();
    els.frame.classList.add('swept'); // one-shot sheen + single rim revolution
    gsap.to(build, {
      t: 1, duration: BUILD_S, ease: 'none',
      onUpdate: () => { lastT = build.t; right(lastT); },
    });
  };
  // If the reader never scrolls, nothing on the right would ever happen. After
  // a grace period, type the prompt and run the build anyway. autoP is a floor
  // under the scroll position so scrolling back never un-types it.
  const startAutopilot = (): void => {
    if (built) return;
    auto.p = clamp(heroP);
    autoTween = gsap.to(auto, {
      p: AUTO_TO, duration: AUTO_S, ease: 'none',
      onUpdate: () => { autoP = auto.p; renderLeft(); },
      onComplete: startBuild,
    });
  };

  const apply = (p: number): void => {
    heroP = p;
    renderLeft();
    gate = range(heroP, .55, .72);
    if (heroP >= TRIGGER) startBuild();
    // once the build has run to completion nothing else repaints it, so the
    // scroll-gated takeover has to be re-applied here
    if (built && lastT >= 1) right(1);
  };

  measure();
  right(0);
  ScrollTrigger.create({
    trigger: wrap, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => apply(self.progress),
    onRefresh: (self) => { measure(); apply(self.progress); },
  });
  addEventListener('load', () => { measure(); ScrollTrigger.refresh(); });
  gsap.delayedCall(AUTO_DELAY_S, startAutopilot);

  // the glass magnifies under the pointer
  els.frame.addEventListener('pointermove', (e) => {
    const r = els.frame.getBoundingClientRect();
    els.lens.style.left = `${((e.clientX - r.left) / r.width) * 100}%`;
    els.lens.style.top = `${((e.clientY - r.top) / r.height) * 100}%`;
    els.lens.style.opacity = '1';
  });
  els.frame.addEventListener('pointerleave', () => { els.lens.style.opacity = '0'; });
}
