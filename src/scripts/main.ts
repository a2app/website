import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { STATIC } from './motion';
import { initField } from './field';
import { initNav } from './nav';
import { initHero } from './hero';
import { initRail, initDevices } from './stages';
import { initProgress, initReveal, initPalettes } from './reveal';
import { initEmbeds } from './embed';
import { initBrandDraw } from './brand';

gsap.registerPlugin(ScrollTrigger);

// html.static must be set before anything measures the layout
document.documentElement.classList.toggle('static', STATIC);

initField();
initNav();
initEmbeds();
initHero();
initRail();
initDevices();
initReveal();
initPalettes();
initProgress();
initBrandDraw();

addEventListener('load', () => {
  ScrollTrigger.refresh();
  // A cross-page anchor (e.g. /demos#showcase, or /#demo from the nav) can lose
  // its landing to the refresh above, which re-lays out the pinned stages. The
  // test used to be `scrollY === 0`, but the refresh usually leaves a few dozen
  // pixels of drift, so the correction skipped itself and the visitor arrived at
  // the hero instead. Anything still within a screen of the top means the landing
  // did not take; the target is a screen or more below, so this cannot fight
  // someone who has already scrolled to it.
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id ? document.getElementById(id) : null;
  if (target && scrollY < innerHeight && target.getBoundingClientRect().top > innerHeight) target.scrollIntoView();
});
