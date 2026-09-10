import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { STATIC } from './motion';
import { initField } from './field';
import { initNav } from './nav';
import { initHero } from './hero';
import { initRail, initDevices } from './stages';
import { initProgress, initReveal, initPalettes } from './reveal';
import { initEmbeds } from './embed';

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

addEventListener('load', () => {
  ScrollTrigger.refresh();
  // A cross-page anchor (e.g. /demos#showcase) can lose its landing to the
  // refresh above; put it back when the page is still sitting at the top.
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id ? document.getElementById(id) : null;
  if (target && scrollY === 0 && target.getBoundingClientRect().top > innerHeight) target.scrollIntoView();
});
