import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { STATIC } from './motion';
import { initField } from './field';
import { initNav } from './nav';
import { initDemo } from './demo';
import { initHero } from './hero';
import { initRail, initDevices } from './stages';
import { initProgress, initReveal, initPalettes } from './reveal';

gsap.registerPlugin(ScrollTrigger);

// html.static must be set before anything measures the layout
document.documentElement.classList.toggle('static', STATIC);

initField();
initNav();
initDemo();
initHero();
initRail();
initDevices();
initReveal();
initPalettes();
initProgress();

addEventListener('load', () => ScrollTrigger.refresh());
