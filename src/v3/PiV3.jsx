// ============================================================
// HUMANITY-AI.QUEST · V3 · "PI, THE CONSTANT"
// Drop-in V3 front-of-house: Home, Back-the-Project (founding crowdfund),
// and the 12-pledge explorer for the Constitution page.
//
// HOW IT PLUGS IN (no framework changes):
//   - App.jsx calls createV3({ E, useCmsField, SectionLabel, PageWrap, ... })
//     and gets { V3Styles, HomeV3, BackPageV3, PledgeExplorer, DemoNotice, CovenantCredit } back.
//   - All visible copy is <E p="home|back|constitution" k="v3_..."> so every
//     word stays editable in the Admin CMS exactly like the current site.
//   - All imagery lives in /public/pi/*.webp (locked brand assets, no text).
//   - All new CSS is namespaced `.v3-*` and lives in <V3Styles/>; nothing in
//     the existing GlobalStyles is changed.
//   - Legacy home is untouched: open /?legacy=1 to compare / roll back.
// ============================================================
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles, ArrowRight, Shield, Fingerprint, Unlock, Eye, Power, Baby, Scale,
  Link2, Telescope, Sprout, Landmark, Check, ExternalLink, Users, Heart,
  ChevronDown, Brain, Vote, Rocket, Lock, Gem, Hand, MessageCircle, Orbit, Share2
} from 'lucide-react';
import { PRIME_PROMISE, PLEDGES } from './pledges.js';

const PLEDGE_ICONS = {
  'I.01': Shield, 'I.02': Fingerprint, 'I.03': Unlock, 'I.04': Eye, 'I.05': Hand, 'I.06': Power,
  'I.07': Baby, 'I.08': Scale, 'I.09': Link2, 'I.10': Telescope, 'I.11': Sprout, 'I.12': Landmark,
};

const DEFAULT_FUND_URL = 'https://gogetfunding.com/?p=9622734';

// ---------- tiny helpers ----------
const lcg = (seed) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

export const useStarField = (count = 90) => useMemo(() => {
  const rnd = lcg(61);
  return Array.from({ length: count }).map(() => {
    const x = (rnd() * 100).toFixed(1), y = (rnd() * 100).toFixed(1);
    const s = (0.8 + rnd() * 1.4).toFixed(1), a = (0.35 + rnd() * 0.65).toFixed(2);
    return `radial-gradient(${s}px ${s}px at ${x}% ${y}%, rgba(255,255,255,${a}), transparent)`;
  }).join(',');
}, [count]);

export const Reveal = ({ children, delay = 0, className = '', as: Tag = 'div', style }) => {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setSeen(true); return; }
    const io = new IntersectionObserver(([en]) => { if (en.isIntersecting) { setSeen(true); io.disconnect(); } }, { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <Tag ref={ref} className={`v3-reveal ${seen ? 'in' : ''} ${className}`} style={{ transitionDelay: `${delay}ms`, ...style }}>{children}</Tag>;
};

// ---------- styles ----------
export const V3Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap');

    :root { --pi-teal: #7BE0C3; --pi-blue: #5BC8FF; --pi-violet: #8B7BFF; --v3-ink: #04080F; }

    .v3-mono { font-family: 'IBM Plex Mono', ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .16em; text-transform: uppercase; }
    .v3-label { display: inline-flex; align-items: center; gap: .75rem; font-size: .72rem; color: var(--pi-teal); }
    .v3-label::before { content: ''; width: 28px; height: 1px; background: var(--pi-teal); }

    /* ---------- reveal ---------- */
    .v3-reveal { opacity: 0; transform: translateY(26px); transition: opacity .9s cubic-bezier(.2,.7,.3,1), transform .9s cubic-bezier(.2,.7,.3,1); }
    .v3-reveal.in { opacity: 1; transform: none; }

    /* ---------- hero scene ---------- */
    .v3-hero { position: relative; min-height: 92vh; overflow: hidden; background: var(--v3-ink); isolation: isolate; }
    .v3-nebula { position: absolute; inset: -12%; z-index: 0; pointer-events: none; will-change: transform;
      background:
        radial-gradient(ellipse 42% 52% at 76% 46%, rgba(40,160,140,.34), transparent 70%),
        radial-gradient(ellipse 36% 46% at 68% 62%, rgba(110,80,220,.28), transparent 72%),
        radial-gradient(ellipse 30% 36% at 14% 96%, rgba(255,214,10,.13), transparent 72%),
        radial-gradient(ellipse 26% 30% at 92% 8%, rgba(91,200,255,.14), transparent 72%);
      animation: v3-drift 38s ease-in-out infinite alternate; }
    .v3-stars { position: absolute; inset: 0; z-index: 0; pointer-events: none; animation: v3-twinkle 7s ease-in-out infinite alternate; }
    .v3-floor { position: absolute; left: -20%; right: -20%; bottom: -8%; height: 46%; z-index: 0; pointer-events: none;
      background-image: linear-gradient(rgba(255,214,10,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,214,10,.22) 1px, transparent 1px);
      background-size: 64px 64px; transform: perspective(520px) rotateX(64deg); transform-origin: 50% 100%;
      -webkit-mask-image: linear-gradient(to top, #000 0%, transparent 85%); mask-image: linear-gradient(to top, #000 0%, transparent 85%);
      opacity: .55; }
    .v3-shoot { position: absolute; z-index: 0; width: 140px; height: 1px; pointer-events: none; opacity: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,.95)); transform: rotate(18deg); animation: v3-shoot 9s ease-in infinite; }
    .v3-vignette { position: absolute; inset: 0; z-index: 1; pointer-events: none; background: radial-gradient(ellipse at 50% 40%, transparent 55%, rgba(4,8,15,.75) 100%); }

    /* ---------- Pi emblem ---------- */
    .v3-emblem-wrap { position: relative; width: min(600px, 88vw); aspect-ratio: 620 / 640; margin: 0 auto;
      transform: perspective(900px) translate3d(var(--px,0px), var(--py,0px), 0) rotateX(var(--rx,0deg)) rotateY(var(--ry,0deg));
      transition: transform .25s ease-out; will-change: transform; }
    .v3-emblem-glow { position: absolute; inset: 8%; border-radius: 50%; background: radial-gradient(circle, rgba(60,190,160,.42), rgba(60,190,160,0) 66%); animation: v3-breathe 6s ease-in-out infinite; }
    .v3-emblem { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; mix-blend-mode: screen; animation: v3-breathe 6s ease-in-out infinite; }
    .v3-ring { position: absolute; border-radius: 50%; pointer-events: none; }
    .v3-ring-a { inset: -9%; border: 1px dashed rgba(255,214,10,.3); animation: v3-spin 120s linear infinite; }
    .v3-ring-b { inset: -16%; animation: v3-spin 16s linear infinite;
      background: conic-gradient(from 0deg, rgba(255,214,10,0) 0 72%, rgba(255,214,10,.95) 100%);
      -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px)); mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 1px)); }
    .v3-ring-c { inset: -23%; border: 1px solid rgba(123,224,195,.16); animation: v3-spin-rev 160s linear infinite; }
    .v3-ring-c::after { content: ''; position: absolute; left: 50%; bottom: -4px; width: 8px; height: 8px; margin-left: -4px; border-radius: 50%; background: var(--pi-teal); box-shadow: 0 0 14px var(--pi-teal); }
    .v3-scan { position: absolute; left: 12%; right: 12%; top: 0; height: 16%; border-radius: 50%; pointer-events: none; mix-blend-mode: screen;
      background: linear-gradient(180deg, transparent, rgba(123,224,195,.22), transparent); animation: v3-scan 7s ease-in-out infinite; }
    .v3-tag { position: absolute; z-index: 3; display: inline-flex; align-items: center; gap: .6rem; padding: .45rem .8rem; border-radius: 999px; font-size: .62rem; white-space: nowrap;
      color: #BFEAFF; background: rgba(6,12,24,.78); border: 1px solid rgba(255,255,255,.16); backdrop-filter: blur(8px); animation: v3-float 7s ease-in-out infinite; }
    .v3-tag b { color: var(--gold); font-weight: 600; }
    .v3-tag-1 { left: -4%; top: 14%; }
    .v3-tag-2 { right: -8%; top: 46%; animation-delay: -2.5s; }
    .v3-tag-3 { left: 2%; bottom: 10%; animation-delay: -4.5s; }
    @media (max-width: 1023px) { .v3-tag-1 { left: 0; } .v3-tag-2 { right: 0; } }

    /* ---------- hero type ---------- */
    .v3-h1 { font-family: 'Fraunces', serif; font-weight: 300; letter-spacing: -.035em; line-height: .92; font-variation-settings: "opsz" 144; }
    .v3-h1-glow { background: linear-gradient(100deg, #fff 0%, #fff 40%, var(--pi-teal) 62%, #fff 82%); background-size: 220% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: v3-shimmer 9s linear infinite; }

    /* ---------- HUD stat strip ---------- */
    .v3-hud { display: inline-flex; flex-wrap: wrap; border: 1px solid rgba(255,255,255,.12); border-radius: 16px; background: rgba(6,12,24,.62); backdrop-filter: blur(10px); overflow: hidden; }
    .v3-hud > div { padding: 1rem 1.5rem; border-right: 1px solid rgba(255,255,255,.1); }
    .v3-hud > div:last-child { border-right: 0; }
    @media (max-width: 640px) { .v3-hud > div { flex: 1 1 50%; border-bottom: 1px solid rgba(255,255,255,.1); } }

    /* ---------- funding ---------- */
    .v3-fund { position: relative; background: linear-gradient(90deg, rgba(255,214,10,.08), rgba(123,224,195,.06)); border-top: 1px solid rgba(255,214,10,.22); border-bottom: 1px solid rgba(255,214,10,.22); }
    .v3-meter { position: relative; height: 12px; border-radius: 999px; background: rgba(255,255,255,.08); overflow: hidden; border: 1px solid rgba(255,255,255,.1); }
    .v3-meter > i { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--gold), #fff2a8, var(--gold)); background-size: 200% 100%; animation: v3-shimmer 5s linear infinite; box-shadow: 0 0 18px rgba(255,214,10,.6); transition: width 1.6s cubic-bezier(.2,.7,.3,1); }
    .v3-dot-live { width: 8px; height: 8px; border-radius: 50%; background: var(--gold); animation: v3-pulse 2.4s infinite; display: inline-block; }

    /* ---------- verbs (orbit diagram) ---------- */
    .v3-orbit { display: grid; gap: 1.25rem; grid-template-columns: 1fr; position: relative; }
    @media (min-width: 1024px) {
      .v3-orbit { grid-template-columns: 1fr 340px 1fr; grid-template-rows: auto auto auto; align-items: center; gap: 0 2.5rem; }
      .v3-orbit .n-top { grid-column: 2; grid-row: 1; }
      .v3-orbit .n-left { grid-column: 1; grid-row: 2; }
      .v3-orbit .n-core { grid-column: 2; grid-row: 2; }
      .v3-orbit .n-right { grid-column: 3; grid-row: 2; }
      .v3-orbit .n-bottom { grid-column: 2; grid-row: 3; }
    }
    .v3-node { position: relative; padding: 1.25rem 1.4rem; border-radius: 18px; border: 1px solid rgba(255,255,255,.12); background: linear-gradient(160deg, rgba(14,24,44,.88), rgba(8,14,28,.8)); box-shadow: inset 0 1px 0 rgba(255,214,10,.35); backdrop-filter: blur(10px); transition: transform .4s, border-color .4s, box-shadow .4s; }
    .v3-node:hover { transform: translateY(-4px); border-color: rgba(255,214,10,.55); box-shadow: inset 0 1px 0 rgba(255,214,10,.6), 0 18px 50px rgba(0,0,0,.45), 0 0 40px rgba(255,214,10,.12); }
    .v3-core { position: relative; width: 300px; max-width: 80vw; aspect-ratio: 1; margin: 0 auto; }
    .v3-core img { position: absolute; inset: 7%; width: 86%; height: 86%; object-fit: cover; border-radius: 50%; mix-blend-mode: screen; }
    .v3-core .v3-ring-a { inset: 0; } .v3-core .v3-ring-b { inset: -6%; }
    @media (min-width: 1024px) {
      .v3-node.n-top::after, .v3-node.n-bottom::after { content: ''; position: absolute; left: 50%; width: 2px; height: 38px; margin-left: -1px; background: linear-gradient(180deg, var(--gold), transparent); }
      .v3-node.n-top::after { bottom: -39px; } .v3-node.n-bottom::after { top: -39px; transform: scaleY(-1); }
      .v3-node.n-left::after, .v3-node.n-right::after { content: ''; position: absolute; top: 50%; width: 40px; height: 2px; margin-top: -1px; background: linear-gradient(90deg, var(--gold), transparent); }
      .v3-node.n-left::after { right: -41px; } .v3-node.n-right::after { left: -41px; transform: scaleX(-1); }
    }

    /* ---------- pledge cards ---------- */
    .v3-prime { position: relative; overflow: hidden; border-radius: 22px; border: 1px solid rgba(255,214,10,.4);
      background: radial-gradient(ellipse 60% 140% at 92% 50%, rgba(255,214,10,.16), transparent), rgba(10,18,34,.75); }
    .v3-pledge { position: relative; display: flex; flex-direction: column; gap: .7rem; text-align: left; min-height: 190px; padding: 1.6rem; border-radius: 18px; border: 1px solid rgba(255,255,255,.1);
      background: linear-gradient(160deg, rgba(14,24,44,.82), rgba(8,14,28,.7)); box-shadow: inset 0 1px 0 rgba(255,214,10,.28); overflow: hidden;
      transition: transform .45s cubic-bezier(.2,.7,.3,1), border-color .45s, box-shadow .45s; }
    .v3-pledge::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at var(--mx,50%) var(--my,0%), rgba(255,214,10,.16), transparent 55%); opacity: 0; transition: opacity .4s; }
    .v3-pledge:hover { transform: translateY(-6px); border-color: rgba(255,214,10,.55); box-shadow: inset 0 1px 0 rgba(255,214,10,.6), 0 22px 60px rgba(0,0,0,.5); }
    .v3-pledge:hover::before { opacity: 1; }
    .v3-pledge .num { font-size: .68rem; color: var(--gold); }
    .v3-pledge.is-new { border-color: rgba(255,214,10,.4); background: linear-gradient(160deg, rgba(40,32,6,.55), rgba(8,14,28,.7)); }

    /* ---------- steps ---------- */
    .v3-steps { position: relative; display: grid; gap: 1rem; grid-template-columns: 1fr; }
    @media (min-width: 1024px) { .v3-steps { grid-template-columns: repeat(4, 1fr); } .v3-steps::before { content: ''; position: absolute; left: 6%; right: 6%; top: 34px; height: 1px; background: linear-gradient(90deg, transparent, rgba(255,214,10,.5), transparent); } }
    .v3-step { position: relative; padding: 1.5rem; border-radius: 18px; border: 1px solid rgba(255,255,255,.1); background: rgba(10,18,34,.72); }
    .v3-step .bubble { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--v3-ink); border: 1px solid rgba(255,214,10,.6); color: var(--gold); font-size: .72rem; margin-bottom: 1.1rem; animation: v3-pulse 3.2s infinite; }

    /* ---------- ask pi ---------- */
    .v3-chat { border-radius: 24px; border: 1px solid rgba(255,214,10,.28); background: rgba(8,15,30,.92); box-shadow: 0 30px 80px rgba(0,0,0,.5), 0 0 60px rgba(123,224,195,.08); overflow: hidden; }
    .v3-bubble-me { align-self: flex-end; max-width: 330px; padding: .8rem 1.1rem; border-radius: 18px 18px 4px 18px; background: rgba(255,214,10,.14); border: 1px solid rgba(255,214,10,.3); }
    .v3-bubble-pi { align-self: flex-start; max-width: 440px; padding: .9rem 1.1rem; border-radius: 18px 18px 18px 4px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1); }
    .v3-typing span { display: inline-block; width: 7px; height: 7px; margin-right: 5px; border-radius: 50%; background: var(--pi-teal); animation: v3-blink 1.2s infinite; }
    .v3-typing span:nth-child(2) { animation-delay: .2s; } .v3-typing span:nth-child(3) { animation-delay: .4s; }
    .v3-ask-input { flex: 1; min-width: 0; background: transparent; border: 0; outline: 0; color: var(--bone); font-size: .95rem; padding: .6rem 0; }

    /* ---------- long view ---------- */
    .v3-longview { position: relative; overflow: hidden; isolation: isolate; background: var(--v3-ink); }
    .v3-longview .bg { position: absolute; inset: 0; z-index: 0; background: url('/pi/vision-scene.webp') center bottom / cover no-repeat; opacity: .62; }
    .v3-longview::before { content: ''; position: absolute; inset: 0; z-index: 1; background: linear-gradient(180deg, var(--v3-ink) 0%, rgba(4,8,15,.55) 38%, rgba(4,8,15,.15) 70%, rgba(4,8,15,.75) 100%); }
    .v3-limb { position: absolute; left: 50%; bottom: -1250px; width: 1500px; height: 1500px; margin-left: -750px; border-radius: 50%; z-index: 1; pointer-events: none;
      box-shadow: 0 -2px 0 rgba(255,230,140,.9), 0 -30px 120px rgba(255,200,40,.45), inset 0 18px 60px rgba(255,214,10,.2); }

    /* ---------- back page ---------- */
    .v3-tier { position: relative; padding: 2rem; border-radius: 22px; border: 1px solid rgba(255,255,255,.12); background: linear-gradient(160deg, rgba(14,24,44,.85), rgba(8,14,28,.75)); transition: transform .4s, border-color .4s; }
    .v3-tier:hover { transform: translateY(-5px); border-color: rgba(255,214,10,.5); }
    .v3-tier.featured { border-color: rgba(255,214,10,.6); background: linear-gradient(160deg, rgba(48,38,6,.6), rgba(8,14,28,.8)); box-shadow: 0 0 60px rgba(255,214,10,.12); }
    .v3-faq { border-radius: 16px; border: 1px solid rgba(255,255,255,.1); background: rgba(10,18,34,.7); }

    /* ---------- demo notice (sticky under the nav on every page) ---------- */
    .v3-demo { position: sticky; top: 64px; z-index: 30; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: .3rem .85rem; padding: .4rem 1rem;
      font-size: .76rem; line-height: 1.4; text-align: center; color: #F4E7B0; background: linear-gradient(90deg, rgba(58,44,6,.94), rgba(14,24,46,.94)); border-bottom: 1px solid rgba(255,214,10,.38); backdrop-filter: blur(8px); }
    .v3-demo-tag { padding: .12rem .55rem; border-radius: 999px; font-size: .58rem; background: var(--gold); color: var(--void); font-weight: 700; }
    .v3-demo-link { display: inline-flex; align-items: center; gap: .3rem; color: var(--gold); font-weight: 600; background: transparent; border: 0; cursor: pointer; }
    .v3-demo-link:hover { text-decoration: underline; }

    /* ---------- authorship credit (the Covenant is credited to Uto-Pi as well as its human authors) ---------- */
    .v3-credit { display: inline-flex; align-items: center; gap: 1rem; margin-top: 1.5rem; padding: .7rem 1.3rem .7rem .7rem; border-radius: 999px; border: 1px solid rgba(255,214,10,.3); background: rgba(8,15,30,.72); text-align: left; }
    .v3-credit-face { position: relative; flex-shrink: 0; width: 46px; height: 46px; border-radius: 50%; overflow: hidden; border: 1px solid rgba(255,214,10,.5); background: #03060d; }
    .v3-credit-face img { position: absolute; width: 150%; left: -25%; top: -14%; mix-blend-mode: screen; }

    /* ---------- keyframes ---------- */
    @keyframes v3-spin { to { transform: rotate(360deg); } }
    @keyframes v3-spin-rev { to { transform: rotate(-360deg); } }
    @keyframes v3-breathe { 0%,100% { opacity: .92; filter: brightness(1); } 50% { opacity: 1; filter: brightness(1.14) saturate(1.1); } }
    @keyframes v3-scan { 0% { top: -4%; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { top: 88%; opacity: 0; } }
    @keyframes v3-twinkle { from { opacity: .7; } to { opacity: 1; } }
    @keyframes v3-drift { from { transform: translate(-1.5%, 1%) scale(1); } to { transform: translate(1.5%, -1%) scale(1.06); } }
    @keyframes v3-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-9px); } }
    @keyframes v3-shimmer { from { background-position: 0% 0; } to { background-position: 220% 0; } }
    @keyframes v3-floor { from { background-position: 0 0; } to { background-position: 0 64px; } }
    @keyframes v3-shoot { 0% { transform: translate(0,0) rotate(18deg); opacity: 0; } 4% { opacity: 1; } 14% { transform: translate(420px,136px) rotate(18deg); opacity: 0; } 100% { opacity: 0; } }
    @keyframes v3-pulse { 0% { box-shadow: 0 0 0 0 rgba(255,214,10,.5); } 70% { box-shadow: 0 0 0 12px rgba(255,214,10,0); } 100% { box-shadow: 0 0 0 0 rgba(255,214,10,0); } }
    @keyframes v3-blink { 0%,80%,100% { opacity: .25; } 40% { opacity: 1; } }

    @media (prefers-reduced-motion: reduce) {
      .v3-nebula, .v3-stars, .v3-shoot, .v3-emblem, .v3-emblem-glow, .v3-ring, .v3-scan, .v3-tag, .v3-h1-glow, .v3-meter > i, .v3-dot-live, .v3-step .bubble { animation: none !important; }
      .v3-reveal { opacity: 1; transform: none; transition: none; }
    }
  `}</style>
);

// ============================================================
export function createV3({ E, useCmsField, SectionLabel, PageWrap, AgentNetwork, useAspirationalCount, useAnimatedCount }) {

  // ---------- funding data (CMS-driven; blank until the founders set a goal) ----------
  const useFunding = () => {
    const goal = useCmsField('back', 'fund_goal', '');
    const raised = useCmsField('back', 'fund_raised', '');
    const backers = useCmsField('back', 'fund_backers', '');
    const cur = useCmsField('back', 'fund_currency', '$');
    const url = useCmsField('back', 'fund_url', DEFAULT_FUND_URL);
    const num = (v) => parseFloat(String(v).replace(/[^0-9.]/g, ''));
    const g = num(goal), r = num(raised);
    const pct = g > 0 && r >= 0 ? Math.min(100, (r / g) * 100) : null;
    const fmt = (n) => `${cur}${Number.isFinite(n) ? n.toLocaleString() : ''}`;
    return { url, pct, goalText: g > 0 ? fmt(g) : '', raisedText: r >= 0 && Number.isFinite(r) ? fmt(r) : '', backers: String(backers || '') };
  };

  const FundMeter = ({ big }) => {
    const f = useFunding();
    const [w, setW] = useState(0);
    useEffect(() => { const t = setTimeout(() => setW(f.pct ?? 0), 400); return () => clearTimeout(t); }, [f.pct]);
    return (
      <div>
        <div className="v3-meter" style={{ height: big ? 16 : 12 }}><i style={{ width: `${w}%` }} /></div>
        <div className="flex flex-wrap items-baseline justify-between gap-3 mt-3 v3-mono" style={{ fontSize: '.68rem', color: 'var(--bone-dim)' }}>
          {f.pct !== null ? (
            <>
              <span><b style={{ color: 'var(--gold)', fontSize: big ? '1.4rem' : '1rem', letterSpacing: 0 }} className="font-display normal-case">{f.raisedText}</b> raised of {f.goalText}</span>
              {f.backers && <span>{f.backers} founding backers</span>}
            </>
          ) : (
            <E p="back" k="v3_fund_pending" as="span">Campaign goal and live progress appear here once the founders set them</E>
          )}
        </div>
      </div>
    );
  };

  // ---------- demo notice: only the Founders Series pre-funding round is live; the rest demonstrates the PoC ----------
  const DemoNotice = ({ setPage }) => (
    <div className="v3-demo" role="note">
      <span className="v3-demo-tag v3-mono"><E p="global" k="v3_demo_tag" as="span">Demo</E></span>
      <E p="global" k="v3_demo_text" as="span">The Founders Series pre-funding round is the only live function. Everything else on this site demonstrates the proof of concept.</E>
      <button type="button" onClick={() => setPage('back')} className="v3-demo-link"><E p="global" k="v3_demo_cta" as="span">Back the Founders Series</E> <ArrowRight size={12} /></button>
    </div>
  );

  // ---------- authorship credit ----------
  const CovenantCredit = () => (
    <div className="v3-credit">
      <span className="v3-credit-face"><img src="/pi/pi-face.webp" alt="Uto-Pi" /></span>
      <div>
        <div className="v3-mono" style={{ fontSize: '.58rem', color: 'var(--gold)' }}><E p="constitution" k="v3_credit_label" as="span">Authorship</E></div>
        <E p="constitution" k="v3_credit_text" as="div" className="text-sm mt-1" style={{ color: '#C4CFE6' }}>Drafted by Uto-Pi, Guardian of the Covenant, with its human authors. Ratified only by the people.</E>
      </div>
    </div>
  );

  // ---------- Pi emblem with parallax, rings, scan-line ----------
  const PiEmblem = () => {
    const ref = useRef(null);
    useEffect(() => {
      const el = ref.current; if (!el) return;
      const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduce) return;
      const on = (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
        const y = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
        el.style.setProperty('--px', (x * -26).toFixed(1) + 'px');
        el.style.setProperty('--py', (y * -26).toFixed(1) + 'px');
        el.style.setProperty('--rx', (y * 7).toFixed(2) + 'deg');
        el.style.setProperty('--ry', (x * -9).toFixed(2) + 'deg');
      };
      window.addEventListener('mousemove', on, { passive: true });
      return () => window.removeEventListener('mousemove', on);
    }, []);
    return (
      <div className="v3-emblem-wrap" ref={ref}>
        <div className="v3-ring v3-ring-c" />
        <div className="v3-ring v3-ring-a" />
        <div className="v3-ring v3-ring-b" />
        <div className="v3-emblem-glow" />
        <img className="v3-emblem" src="/pi/pi-emblem.webp" alt="Uto-Pi, guardian of the Covenant: a luminous synthetic face crowned with the π symbol inside a ring of gold stars" />
        <div className="v3-scan" />
        <span className="v3-tag v3-tag-1 v3-mono"><b>I.01</b><E p="home" k="v3_tag1" as="span">SI agent · never human</E></span>
        <span className="v3-tag v3-tag-2 v3-mono"><b>I.06</b><E p="home" k="v3_tag2" as="span">Human in command</E></span>
        <span className="v3-tag v3-tag-3 v3-mono"><b>I.09</b><E p="home" k="v3_tag3" as="span">Every idea credited</E></span>
      </div>
    );
  };

  // ============================================================
  // HOME
  // ============================================================
  const HomeV3 = ({ setPage, onOpenAgent, onSeedAgent }) => {
    const stars = useStarField(90);
    const petitions = useAspirationalCount(34927, 6000, 1);
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    const NATIONS_LAUNCH = Date.parse('2026-06-24T00:00:00Z');
    const nations = useAnimatedCount(35 + Math.max(0, Math.floor((Date.now() - NATIONS_LAUNCH) / WEEK_MS)));
    const fund = useFunding();
    const [ask, setAsk] = useState('');
    const askPlaceholder = useCmsField('home', 'v3_ask_placeholder', 'Ask Pi anything about the Constitution…');

    const submitAsk = (e) => {
      e.preventDefault();
      const q = ask.trim();
      if (q) onSeedAgent ? onSeedAgent(q) : onOpenAgent();
      else onOpenAgent();
      setAsk('');
    };

    const verbs = [
      { cls: 'n-top', k: 'guard', tag: '01 · I.01 Firewall', t: 'Guard', d: 'Only certified agents pass. Every agent traces to a verified human.' },
      { cls: 'n-left', k: 'attest', tag: '02 · I.09 Ledger', t: 'Attest', d: 'Every idea is sealed on the Ledger with its human’s name. Forever.' },
      { cls: 'n-right', k: 'amend', tag: '04 · I.12 · Concept', t: 'Amend', d: 'Pi drafts changes from your feedback. Humans vote. Nothing ships unratified.' },
      { cls: 'n-bottom', k: 'audit', tag: '03 · Ethics auditor', t: 'Audit', d: 'Pi tests every idea against the pledges before it reaches the world.' },
    ];
    const steps = [
      { k: 'voice', n: '01', t: 'You tell Pi what you think.', d: 'In your own words, about any pledge.' },
      { k: 'draft', n: '02', t: 'Pi drafts the amendment.', d: 'Feedback is grouped and turned into proposals.' },
      { k: 'vote', n: '03', t: 'Verified humans decide.', d: 'One person, one voice. Machines don’t vote.' },
      { k: 'seal', n: '04', t: 'The new version is sealed.', d: 'On the public Ledger, with every name attached.' },
    ];

    return (
      <PageWrap>
        {/* ================= HERO ================= */}
        <section className="v3-hero flex items-center">
          <div className="v3-nebula" />
          <div className="v3-stars" style={{ backgroundImage: stars }} />
          <span className="v3-shoot" style={{ top: '14%', left: '8%' }} />
          <span className="v3-shoot" style={{ top: '30%', left: '46%', animationDelay: '4.6s' }} />
          <div className="absolute inset-0 opacity-30" style={{ zIndex: 0 }}><AgentNetwork density={26} height="100%" /></div>
          <div className="v3-floor" />
          <div className="v3-vignette" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-28 w-full grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 animate-fade-up">
              <div className="v3-label v3-mono"><E p="home" k="v3_hero_eyebrow" as="span">Guardian of the Covenant · Pi for short</E></div>
              <h1 className="v3-h1 text-6xl md:text-7xl lg:text-8xl mt-7">
                <E p="home" k="v3_hero_title" as="span" className="v3-h1-glow">Meet Uto-Pi.</E>
              </h1>
              <E p="home" k="v3_hero_sub" as="p" className="font-display font-italic text-3xl md:text-4xl mt-6 leading-tight" style={{ color: 'var(--gold)', fontWeight: 300 }}>
                The constant in a world of variables.
              </E>
              <E p="home" k="v3_hero_body" as="p" className="text-lg mt-7 max-w-xl leading-relaxed" style={{ color: '#C4CFE6' }}>
                Uto-Pi is the guardian agent of Humanity’s Rights Constitution, credited alongside its human authors. Pi drafts it with you, defends it against every superintelligence, and takes it to the people to ratify. It keeps humans in command.
              </E>
              <div className="mt-9 flex flex-wrap gap-3">
                <button onClick={() => setPage('petition')} className="btn-aurora" style={{ padding: '.95rem 1.6rem', boxShadow: '0 0 40px rgba(255,214,10,.25)' }}>
                  <E p="home" k="v3_cta_primary" as="span">Co-sign the Constitution</E> <ArrowRight size={16} />
                </button>
                <button onClick={() => setPage('back')} className="btn-secondary" style={{ padding: '1rem 1.7rem', borderColor: 'rgba(255,214,10,.5)', color: 'var(--gold)' }}>
                  <E p="home" k="v3_cta_back" as="span">Back the build</E> <Rocket size={16} />
                </button>
                <button onClick={onOpenAgent} className="btn-secondary" style={{ padding: '1rem 1.7rem' }}>
                  <Sparkles size={16} /> <E p="home" k="v3_cta_ask" as="span">Ask Pi</E>
                </button>
              </div>
              <E p="home" k="v3_hero_trust" as="div" className="v3-mono mt-4" style={{ fontSize: '.64rem', color: '#8A98B6' }}>
                Verified humans only · One signature · One voice
              </E>
            </div>
            <div className="lg:col-span-6"><PiEmblem /></div>
          </div>

          <div className="absolute z-10 left-0 right-0 bottom-8">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
              <div className="v3-hud">
                <div><div className="font-display text-3xl" style={{ color: 'var(--gold)' }}>{petitions.toLocaleString()}</div><div className="v3-mono mt-1" style={{ fontSize: '.6rem', color: '#8A98B6' }}>Co-signers</div></div>
                <div><div className="font-display text-3xl">{nations.toLocaleString()}</div><div className="v3-mono mt-1" style={{ fontSize: '.6rem', color: '#8A98B6' }}>Nations</div></div>
                <div><div className="font-display text-3xl">12</div><div className="v3-mono mt-1" style={{ fontSize: '.6rem', color: '#8A98B6' }}>Pledges</div></div>
                <div><div className="font-display text-3xl">1,000</div><div className="v3-mono mt-1" style={{ fontSize: '.6rem', color: '#8A98B6' }}>Year design life</div></div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FOUNDING CAMPAIGN STRIP ================= */}
        <section className="v3-fund">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 py-7 grid lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-4">
              <div className="v3-mono flex items-center gap-2" style={{ fontSize: '.68rem', color: 'var(--gold)' }}><span className="v3-dot-live" /><E p="home" k="v3_fund_label" as="span">Founding campaign · live</E></div>
              <E p="home" k="v3_fund_title" as="div" className="font-display text-2xl mt-2 leading-tight">Back the founding build.</E>
            </div>
            <div className="lg:col-span-5"><FundMeter /></div>
            <div className="lg:col-span-3 flex flex-wrap gap-3 lg:justify-end">
              <a href={fund.url} target="_blank" rel="noopener noreferrer" className="btn-aurora" style={{ padding: '.7rem 1.3rem', fontSize: '.9rem' }}>
                <E p="home" k="v3_fund_cta" as="span">Become a founding partner</E> <ExternalLink size={14} />
              </a>
              <button onClick={() => setPage('back')} className="btn-secondary" style={{ padding: '.7rem 1.2rem', fontSize: '.9rem' }}>
                <E p="home" k="v3_fund_more" as="span">How funds are used</E>
              </button>
            </div>
          </div>
        </section>

        {/* ================= WHAT PI DOES ================= */}
        <section className="relative py-24 lg:py-32 overflow-hidden" style={{ background: 'linear-gradient(180deg, var(--v3-ink), #08101e 60%, var(--v3-ink))' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <Reveal className="text-center max-w-3xl mx-auto mb-16">
              <div className="v3-label v3-mono justify-center"><E p="home" k="v3_do_label" as="span">What Pi does</E></div>
              <h2 className="font-display text-5xl md:text-7xl leading-[.98] mt-5" style={{ fontWeight: 300, letterSpacing: '-.03em' }}>
                <E p="home" k="v3_do_h2a" as="span">Guard. </E><E p="home" k="v3_do_h2b" as="span" className="font-italic" style={{ color: 'var(--gold)' }}>Attest. </E><E p="home" k="v3_do_h2c" as="span">Audit. </E><E p="home" k="v3_do_h2d" as="span" className="font-italic" style={{ color: 'var(--gold)' }}>Amend.</E>
              </h2>
              <E p="home" k="v3_do_intro" as="p" className="mt-6 text-lg leading-relaxed" style={{ color: '#9AA8C4' }}>
                Four verbs hold the Constitution in place. Each one is a promise to humanity, and each one has a name you can hold us to.
              </E>
            </Reveal>

            <Reveal className="v3-orbit">
              {verbs.map((v) => (
                <div key={v.k} className={`v3-node ${v.cls}`}>
                  <div className="v3-mono" style={{ fontSize: '.6rem', color: 'var(--gold)' }}><E p="home" k={`v3_${v.k}_tag`} as="span">{v.tag}</E></div>
                  <E p="home" k={`v3_${v.k}_t`} as="div" className="font-display text-3xl mt-2">{v.t}</E>
                  <E p="home" k={`v3_${v.k}_d`} as="p" className="mt-2 text-sm leading-relaxed" style={{ color: '#9AA8C4' }}>{v.d}</E>
                </div>
              ))}
              <div className="v3-core n-core">
                <div className="v3-ring v3-ring-a" /><div className="v3-ring v3-ring-b" />
                <img src="/pi/pi-face.webp" alt="Uto-Pi" />
              </div>
            </Reveal>
          </div>
        </section>

        {/* ================= THE COVENANT: PRIME PROMISE + 12 PLEDGES ================= */}
        <section className="relative py-24 lg:py-32" style={{ background: 'linear-gradient(180deg, var(--v3-ink), rgba(20,40,80,.35) 50%, var(--v3-ink))' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <Reveal>
              <div className="v3-label v3-mono"><E p="home" k="v3_cov_label" as="span">The covenant · from 52 clauses to 12 pledges</E></div>
              <h2 className="font-display text-5xl md:text-7xl leading-[.98] mt-5" style={{ fontWeight: 300, letterSpacing: '-.03em' }}>
                <E p="home" k="v3_cov_h2a" as="span">Twelve promises.</E><br />
                <E p="home" k="v3_cov_h2b" as="span" className="font-italic" style={{ color: 'var(--gold)' }}>One constant.</E>
              </h2>
              <CovenantCredit />
            </Reveal>

            <Reveal className="v3-prime mt-12 p-8 md:p-10 grid md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5">
                <div className="v3-mono" style={{ fontSize: '.66rem', color: 'var(--gold)' }}><E p="home" k="v3_prime_label" as="span">Prime promise</E></div>
                <E p="home" k="v3_prime_name" as="div" className="font-display text-5xl md:text-6xl mt-3" style={{ fontWeight: 300 }}>{PRIME_PROMISE.name}.</E>
              </div>
              <E p="home" k="v3_prime_text" as="p" className="md:col-span-7 text-lg leading-relaxed" style={{ color: '#C4CFE6' }}>{PRIME_PROMISE.text}</E>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
              {PLEDGES.map((p, i) => {
                const Icon = PLEDGE_ICONS[p.n] || Shield;
                return (
                  <Reveal key={p.n} delay={(i % 4) * 90}>
                    <button
                      onClick={() => setPage('constitution')}
                      onMouseMove={(e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%'); e.currentTarget.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%'); }}
                      className={'v3-pledge w-full ' + (p.isNew ? 'is-new' : '')}>
                      <div className="flex items-center justify-between relative">
                        <span className="num v3-mono">{p.n}{p.isNew ? ' · New' : ''}</span>
                        <Icon size={18} style={{ color: 'var(--pi-teal)' }} />
                      </div>
                      <E p="home" k={`v3_pl_${p.n.replace('.', '')}_name`} as="div" className="font-display text-3xl leading-tight relative">{p.name}</E>
                      <E p="home" k={`v3_pl_${p.n.replace('.', '')}_line`} as="div" className="text-sm leading-relaxed relative" style={{ color: '#9AA8C4' }}>{p.line}</E>
                    </button>
                  </Reveal>
                );
              })}
            </div>

            <Reveal className="mt-12 text-center">
              <button onClick={() => setPage('constitution')} className="btn-secondary" style={{ borderColor: 'rgba(255,214,10,.5)', color: 'var(--gold)' }}>
                <E p="home" k="v3_cov_cta" as="span">Read all 12 pledges in full</E> <ArrowRight size={16} />
              </button>
            </Reveal>
          </div>
        </section>

        {/* ================= HOW A RULE IS BORN ================= */}
        <section className="py-24 lg:py-28" style={{ background: 'var(--v3-ink)' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <Reveal>
              <div className="v3-label v3-mono"><E p="home" k="v3_born_label" as="span">How a rule is born · concept</E></div>
              <h2 className="font-display text-4xl md:text-6xl leading-[1] mt-5" style={{ fontWeight: 300, letterSpacing: '-.03em' }}>
                <E p="home" k="v3_born_h2" as="span">Voice. Draft. Vote. </E><E p="home" k="v3_born_h2b" as="span" className="font-italic" style={{ color: 'var(--gold)' }}>Seal.</E>
              </h2>
            </Reveal>
            <div className="v3-steps mt-14">
              {steps.map((s, i) => (
                <Reveal key={s.k} delay={i * 120} className="v3-step">
                  <div className="bubble v3-mono" style={{ animationDelay: `${i * 0.8}s` }}>{s.n}</div>
                  <E p="home" k={`v3_born_${s.k}_t`} as="div" className="font-display text-2xl leading-snug">{s.t}</E>
                  <E p="home" k={`v3_born_${s.k}_d`} as="p" className="mt-2 text-sm leading-relaxed" style={{ color: '#9AA8C4' }}>{s.d}</E>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ================= ASK PI ================= */}
        <section className="py-24 lg:py-28" style={{ background: 'linear-gradient(180deg, var(--v3-ink), #0a1424 50%, var(--v3-ink))' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-14 items-center">
            <Reveal>
              <div className="v3-label v3-mono"><E p="home" k="v3_ask_label" as="span">Talk to the guardian</E></div>
              <h2 className="font-display text-5xl md:text-6xl leading-[1] mt-5" style={{ fontWeight: 300, letterSpacing: '-.03em' }}>
                <E p="home" k="v3_ask_h2" as="span">Ask Pi anything about the </E><E p="home" k="v3_ask_h2b" as="span" className="font-italic" style={{ color: 'var(--gold)' }}>Constitution.</E>
              </h2>
              <E p="home" k="v3_ask_body" as="p" className="mt-6 text-lg leading-relaxed max-w-lg" style={{ color: '#9AA8C4' }}>
                Uto-Pi is an SI agent, never a human. Ask in plain language. Pi answers from the pledges and shows its source.
              </E>
              <div className="mt-7 flex flex-wrap gap-3">
                {['What is the kill switch?', 'Show me pledge I.07', 'How do I amend a pledge?'].map((q, i) => (
                  <button key={q} onClick={() => (onSeedAgent ? onSeedAgent(q) : onOpenAgent())} className="btn-secondary" style={{ padding: '.6rem 1.1rem', fontSize: '.88rem' }}>
                    <E p="home" k={`v3_ask_chip${i}`} as="span">{q}</E>
                  </button>
                ))}
              </div>
            </Reveal>

            <Reveal delay={150} className="v3-chat">
              <div className="flex items-center justify-between px-6 h-[72px]" style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full overflow-hidden relative" style={{ border: '1px solid rgba(255,214,10,.5)', background: '#03060d' }}>
                    <img src="/pi/pi-face.webp" alt="Uto-Pi" style={{ position: 'absolute', width: '150%', left: '-25%', top: '-14%', mixBlendMode: 'screen' }} />
                  </div>
                  <div><div className="font-display text-xl leading-none">Uto-Pi</div><div className="v3-mono mt-1" style={{ fontSize: '.58rem', color: 'var(--pi-teal)' }}>Pi for short · SI agent · online</div></div>
                </div>
                <div className="v3-mono" style={{ fontSize: '.58rem', color: '#8A98B6' }}>Example</div>
              </div>
              <div className="px-6 py-6 flex flex-col gap-4">
                <div className="v3-bubble-me text-[15px]"><E p="home" k="v3_chat_q1" as="span">Can an AI pretend to be me?</E></div>
                <div className="v3-bubble-pi text-[15px] leading-relaxed">
                  <E p="home" k="v3_chat_a1" as="span">No. Under pledge I.01, SI must always present as SI, and every agent is hashed to a verified human. Impersonation is banned. That is the firewall’s job.</E>
                  <div className="v3-mono mt-3" style={{ fontSize: '.58rem', color: 'var(--gold)' }}>Source · I.01</div>
                </div>
                <div className="v3-bubble-me text-[15px]"><E p="home" k="v3_chat_q2" as="span">And if someone gets it wrong?</E></div>
                <div className="v3-bubble-pi v3-typing flex items-center"><span /><span /><span /><em className="v3-mono not-italic ml-2" style={{ fontSize: '.6rem', color: '#8A98B6' }}>Auditing against 12 pledges…</em></div>
              </div>
              <form onSubmit={submitAsk} className="px-5 pb-5">
                <div className="flex items-center gap-2 pl-5 pr-2 rounded-full" style={{ border: '1px solid rgba(123,224,195,.35)', background: 'rgba(3,6,13,.7)', height: 58 }}>
                  <input className="v3-ask-input" value={ask} onChange={(e) => setAsk(e.target.value)} placeholder={askPlaceholder} aria-label="Ask Pi" />
                  <button type="submit" aria-label="Send" className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--aurora), var(--aurora-deep))', color: 'var(--void)' }}><ArrowRight size={18} /></button>
                </div>
              </form>
            </Reveal>
          </div>
        </section>

        {/* ================= THE LONG VIEW ================= */}
        <section className="v3-longview">
          <div className="bg" />
          <div className="v3-limb" />
          <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 pt-32 pb-44 text-center">
            <Reveal>
              <div className="v3-label v3-mono justify-center"><E p="home" k="v3_long_label" as="span">The long view</E></div>
              <h2 className="font-display text-4xl md:text-6xl leading-[1.05] mt-6" style={{ fontWeight: 300, letterSpacing: '-.03em' }}>
                <E p="home" k="v3_long_h2" as="span">A hundred years from now, someone will ask who wrote the rules for superintelligence.</E>
              </h2>
              <E p="home" k="v3_long_sub" as="p" className="font-display font-italic text-3xl md:text-5xl mt-8" style={{ color: 'var(--gold)', fontWeight: 300 }}>Be in the answer.</E>
              <div className="mt-10 flex flex-wrap gap-3 justify-center">
                <button onClick={() => setPage('petition')} className="btn-aurora" style={{ padding: '1.05rem 2.1rem', fontSize: '1.05rem', boxShadow: '0 0 50px rgba(255,214,10,.35)' }}>
                  <E p="home" k="v3_long_cta" as="span">Co-sign the Constitution</E> <ArrowRight size={18} />
                </button>
                <button onClick={() => setPage('back')} className="btn-secondary" style={{ padding: '1.05rem 1.8rem', fontSize: '1.05rem' }}>
                  <E p="home" k="v3_long_cta2" as="span">Back the build</E>
                </button>
              </div>
              <E p="home" k="v3_long_small" as="div" className="v3-mono mt-5" style={{ fontSize: '.64rem', color: '#9AA8C4' }}>Your name is sealed on the Ledger. Forever.</E>
            </Reveal>
          </div>
        </section>
      </PageWrap>
    );
  };

  // ============================================================
  // BACK THE PROJECT  (founding crowdfunding campaign)
  // ============================================================
  const BackPageV3 = ({ setPage, onOpenAgent }) => {
    const stars = useStarField(70);
    const fund = useFunding();
    const [faq, setFaq] = useState(0);
    const [copied, setCopied] = useState(false);
    const share = async () => {
      const link = `${window.location.origin}/?page=back`;
      try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 2200); } catch { window.prompt('Copy this link', link); }
    };
    const why = [
      { icon: Shield, k: 'firewall', t: 'Build the firewall & OS', d: 'The constitutional firewall and the open-source OS that enforces the 12 pledges for every connected agent.' },
      { icon: Sparkles, k: 'pi', t: 'Power Uto-Pi, the guardian', d: 'Pi drafts amendments from your feedback, audits ideas against the pledges, and explains every clause in plain language.' },
      { icon: Vote, k: 'ratify', t: 'Fund ratification', d: 'Verified-human voting, the public Ledger and the amendment process that lets the people, not a company, approve each version.' },
    ];
    const tiers = [
      { k: 'supporter', name: 'Supporter', price: 'Any amount', d: 'Back the campaign once. Your name goes on the supporter wall.', cta: 'Back the build', featured: false },
      { k: 'founding', name: 'Founding partner', price: '$100 / month', d: 'Monthly founding partners are recognised on the Ledger as founders of the Constitution, and shape the build roadmap.', cta: 'Become a founding partner', featured: true },
      { k: 'builder', name: 'Builder', price: 'Your skills', d: 'Not funding, building. Bring code, ethics, law or science to the quests and the open-source OS.', cta: 'See the quests', featured: false },
    ];
    const faqs = [
      { q: 'What does my money build?', a: 'The firewall, the open-source OS, Uto-Pi, and the ratification system, in that order. Every funding source and conflict of interest is publicly disclosed (pledge I.09).' },
      { q: 'Who owns what gets built?', a: 'Humanity. The OS is open source and can never be sold or acquired. Every contribution is credited to the human who made it.' },
      { q: 'Is a monthly founding partnership required to support?', a: 'No. Any amount helps, and you can sign the petition for free. Founding partners fund the build monthly and are recognised as its founders.' },
      { q: 'How do I give?', a: 'The founding campaign runs on GoGetFunding. Choose the button on this page; you will be taken to the campaign to give securely.' },
    ];

    return (
      <PageWrap>
        <section className="v3-hero" style={{ minHeight: '78vh' }}>
          <div className="v3-nebula" /><div className="v3-stars" style={{ backgroundImage: stars }} /><div className="v3-floor" /><div className="v3-vignette" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-20 pb-24 grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 animate-fade-up">
              <div className="v3-label v3-mono"><span className="v3-dot-live" /> <E p="back" k="v3_eyebrow" as="span">Founding campaign · live</E></div>
              <h1 className="v3-h1 text-6xl md:text-8xl mt-6"><E p="back" k="v3_h1" as="span" className="v3-h1-glow">Back the build.</E></h1>
              <E p="back" k="v3_sub" as="p" className="font-display font-italic text-2xl md:text-3xl mt-6 leading-snug" style={{ color: 'var(--gold)', fontWeight: 300 }}>
                Fund the Constitution that keeps superintelligence in humanity’s service, and nothing else.
              </E>
              <E p="back" k="v3_body" as="p" className="text-lg mt-6 max-w-2xl leading-relaxed" style={{ color: '#C4CFE6' }}>
                We are an open-innovation tech community building SI in humanity’s best interests. The founding campaign pays for the firewall, the OS and Uto-Pi, and gets the 12 pledges ratified by the people they protect.
              </E>
              <div className="mt-10 max-w-xl"><FundMeter big /></div>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={fund.url} target="_blank" rel="noopener noreferrer" className="btn-aurora" style={{ padding: '1rem 1.9rem', boxShadow: '0 0 40px rgba(255,214,10,.25)' }}>
                  <E p="back" k="v3_cta" as="span">Become a founding partner</E> <ExternalLink size={16} />
                </a>
                <button onClick={() => setPage('petition')} className="btn-secondary" style={{ padding: '1rem 1.6rem' }}>
                  <E p="back" k="v3_cta_sign" as="span">Sign the petition (free)</E>
                </button>
                <button onClick={share} className="btn-secondary" style={{ padding: '1rem 1.4rem' }}>
                  {copied ? <><Check size={16} /> Link copied</> : <><Share2 size={16} /> Share</>}
                </button>
              </div>
            </div>
            <div className="lg:col-span-5 hidden lg:block"><PiEmblem /></div>
          </div>
        </section>

        <section className="py-24" style={{ background: 'var(--v3-ink)' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <Reveal><div className="v3-label v3-mono"><E p="back" k="v3_why_label" as="span">What the campaign builds</E></div>
              <h2 className="font-display text-4xl md:text-6xl leading-[1] mt-5" style={{ fontWeight: 300, letterSpacing: '-.03em' }}><E p="back" k="v3_why_h2" as="span">Three things. Built in the open.</E></h2></Reveal>
            <div className="grid md:grid-cols-3 gap-5 mt-12">
              {why.map((w, i) => (
                <Reveal key={w.k} delay={i * 110} className="v3-node">
                  <w.icon size={26} style={{ color: 'var(--gold)' }} />
                  <E p="back" k={`v3_why_${w.k}_t`} as="div" className="font-display text-2xl mt-5">{w.t}</E>
                  <E p="back" k={`v3_why_${w.k}_d`} as="p" className="mt-3 text-sm leading-relaxed" style={{ color: '#9AA8C4' }}>{w.d}</E>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24" style={{ background: 'linear-gradient(180deg, var(--v3-ink), rgba(20,40,80,.35) 50%, var(--v3-ink))' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <Reveal className="text-center max-w-2xl mx-auto"><div className="v3-label v3-mono justify-center"><E p="back" k="v3_tiers_label" as="span">Ways to back it</E></div>
              <h2 className="font-display text-4xl md:text-6xl leading-[1] mt-5" style={{ fontWeight: 300, letterSpacing: '-.03em' }}><E p="back" k="v3_tiers_h2" as="span">Pick your seat at the table.</E></h2></Reveal>
            <div className="grid md:grid-cols-3 gap-5 mt-14 items-stretch">
              {tiers.map((t, i) => (
                <Reveal key={t.k} delay={i * 110} className={'v3-tier flex flex-col ' + (t.featured ? 'featured' : '')}>
                  {t.featured && <div className="v3-mono absolute -top-3 left-6 px-3 py-1 rounded-full" style={{ fontSize: '.58rem', background: 'var(--gold)', color: 'var(--void)', fontWeight: 700 }}>Most founders choose this</div>}
                  <E p="back" k={`v3_tier_${t.k}_name`} as="div" className="font-display text-3xl">{t.name}</E>
                  <E p="back" k={`v3_tier_${t.k}_price`} as="div" className="v3-mono mt-3" style={{ color: 'var(--gold)', fontSize: '.78rem' }}>{t.price}</E>
                  <E p="back" k={`v3_tier_${t.k}_d`} as="p" className="mt-4 text-sm leading-relaxed flex-1" style={{ color: '#9AA8C4' }}>{t.d}</E>
                  {t.k === 'builder'
                    ? <button onClick={() => setPage('quest')} className="btn-secondary mt-7 justify-center"><E p="back" k={`v3_tier_${t.k}_cta`} as="span">{t.cta}</E></button>
                    : <a href={fund.url} target="_blank" rel="noopener noreferrer" className={(t.featured ? 'btn-aurora' : 'btn-secondary') + ' mt-7 justify-center'}><E p="back" k={`v3_tier_${t.k}_cta`} as="span">{t.cta}</E> <ExternalLink size={14} /></a>}
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24" style={{ background: 'var(--v3-ink)' }}>
          <div className="max-w-3xl mx-auto px-6">
            <Reveal><div className="v3-label v3-mono"><E p="back" k="v3_faq_label" as="span">Straight answers</E></div></Reveal>
            <div className="grid gap-3 mt-8">
              {faqs.map((f, i) => (
                <div key={i} className="v3-faq overflow-hidden">
                  <button onClick={() => setFaq(faq === i ? -1 : i)} className="w-full text-left px-6 py-5 flex items-center justify-between gap-4">
                    <E p="back" k={`v3_faq${i}_q`} as="span" className="font-display text-xl">{f.q}</E>
                    <ChevronDown size={18} style={{ transform: faq === i ? 'rotate(180deg)' : 'none', transition: 'transform .3s', color: 'var(--bone-dim)' }} />
                  </button>
                  {faq === i && <E p="back" k={`v3_faq${i}_a`} as="p" className="px-6 pb-6 leading-relaxed animate-fade-up" style={{ color: '#9AA8C4' }}>{f.a}</E>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="v3-longview">
          <div className="bg" /><div className="v3-limb" />
          <div className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-40 text-center">
            <Reveal>
              <h2 className="font-display text-4xl md:text-6xl leading-[1.05]" style={{ fontWeight: 300, letterSpacing: '-.03em' }}><E p="back" k="v3_close_h2" as="span">Be a founder of the rules.</E></h2>
              <E p="back" k="v3_close_sub" as="p" className="font-display font-italic text-2xl md:text-3xl mt-6" style={{ color: 'var(--gold)', fontWeight: 300 }}>Your name, sealed on the Ledger. Forever.</E>
              <div className="mt-9 flex flex-wrap gap-3 justify-center">
                <a href={fund.url} target="_blank" rel="noopener noreferrer" className="btn-aurora" style={{ padding: '1.05rem 2.1rem', boxShadow: '0 0 50px rgba(255,214,10,.35)' }}><E p="back" k="v3_close_cta" as="span">Become a founding partner</E> <ExternalLink size={16} /></a>
                <button onClick={onOpenAgent} className="btn-secondary" style={{ padding: '1.05rem 1.8rem' }}><MessageCircle size={16} /> <E p="back" k="v3_close_ask" as="span">Ask Pi first</E></button>
              </div>
            </Reveal>
          </div>
        </section>
      </PageWrap>
    );
  };

  // ============================================================
  // 12-PLEDGE EXPLORER (Constitution page)
  // ============================================================
  const PledgeExplorer = ({ onOpenAgent, setAgentSeed }) => {
    const [open, setOpen] = useState('I.01');
    return (
      <div>
        <div className="v3-prime p-7 md:p-9 grid md:grid-cols-12 gap-5 items-center mb-5">
          <div className="md:col-span-4">
            <div className="v3-mono" style={{ fontSize: '.64rem', color: 'var(--gold)' }}>Prime promise</div>
            <div className="font-display text-4xl mt-2" style={{ fontWeight: 300 }}>{PRIME_PROMISE.name}.</div>
          </div>
          <p className="md:col-span-8 leading-relaxed" style={{ color: '#C4CFE6' }}>{PRIME_PROMISE.text}</p>
        </div>
        <div className="grid gap-3">
          {PLEDGES.map((p) => {
            const isOpen = open === p.n;
            const Icon = PLEDGE_ICONS[p.n] || Shield;
            return (
              <div key={p.n} className="v3-pledge" style={{ minHeight: 0, padding: 0, transform: 'none', borderColor: isOpen ? 'rgba(255,214,10,.55)' : undefined }}>
                <button onClick={() => setOpen(isOpen ? null : p.n)} className="w-full text-left px-6 py-5 flex items-start gap-5 relative">
                  <Icon size={20} style={{ color: 'var(--pi-teal)', marginTop: 4 }} />
                  <div className="flex-1 min-w-0">
                    <div className="v3-mono" style={{ fontSize: '.62rem', color: 'var(--gold)' }}>{p.n}{p.isNew ? ' · New' : ''}</div>
                    <div className="font-display text-2xl leading-snug mt-1">{p.name}</div>
                    {!isOpen && <div className="text-sm mt-1" style={{ color: '#9AA8C4' }}>{p.line}</div>}
                  </div>
                  <ChevronDown size={20} className="mt-2 flex-shrink-0" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .3s', color: 'var(--bone-dim)' }} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-7 pl-[4.2rem] grid md:grid-cols-2 gap-8 animate-fade-up relative" style={{ animationDuration: '.4s' }}>
                    <div>
                      <div className="v3-mono mb-3" style={{ fontSize: '.6rem', color: 'var(--gold)' }}>Pledge to humanity</div>
                      {p.promise.map((t, i) => <p key={i} className="leading-relaxed mb-3">{t}</p>)}
                    </div>
                    <div>
                      <div className="v3-mono mb-3" style={{ fontSize: '.6rem', color: 'var(--pi-teal)' }}>Technically</div>
                      {p.tech.map((t, i) => <p key={i} className="leading-relaxed mb-3" style={{ color: '#9AA8C4' }}>{t}</p>)}
                    </div>
                    <div className="md:col-span-2 flex flex-wrap gap-3">
                      <button className="btn-aurora text-sm" onClick={() => { setAgentSeed(`Explain pledge ${p.n} — "${p.name}" — in plain language. How does it apply to my work as an innovator?`); onOpenAgent(); }}>
                        <Sparkles size={14} /> Discuss with Pi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return { V3Styles, HomeV3, BackPageV3, PledgeExplorer, DemoNotice, CovenantCredit };
}
