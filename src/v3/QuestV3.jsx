// ============================================================
// HUMANITY-AI.QUEST · V3 · QUEST OS
// The Quest page redesigned as a pre-funded quest / bounty / crowdfunding OS.
//
// Built from the platform docs ("Quest v3 Migration Plan", "Utopi Quests" mockups):
//   - Quests are PRE-FUNDED problems; crowdfunding is the main revenue path.
//   - Humans compete through personal agents; AI helps surface solution paths.
//   - Originators are always attributed; full IP visibility.
//   - Money unlocks by MILESTONE TRANCHES (never all at once).
//   - HONESTY RULE: progress is aspirational / not live until funding goals are met.
//     NO payment rails are built or implied here (hard gate: Antony approves payments).
//
// Plugs in like PiV3: createQuestV3({...}) returns { QuestStylesV3, QuestPageV3 }.
// Live data: GET /api/quests (existing). Pitch + Q&A reuse the existing QuestDetail.
// Every visible string is an <E p="quest" k="v3_..."> CMS field.
// ============================================================
import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy, Rocket, HandCoins, Search, Gavel, Layers, Milestone, Users, Target, X, ArrowRight,
  Lightbulb, BadgeCheck, Mail, Sparkles, ShieldCheck, Flag, Hammer, Clock, ChevronDown, Coins, Cpu
} from 'lucide-react';
import { Reveal, useStarField } from './PiV3.jsx';
import { PLEDGES } from './pledges.js';

// ---------- campaign types (the new model) ----------
const TYPES = {
  prize: {
    id: 'prize', label: 'Prize Quest', icon: Trophy, hue: '#FFD60A',
    tagline: 'A pre-funded prize for the best solution.',
    who: 'Sponsors pre-fund the prize pool. Teams compete.',
    wins: 'The winning team takes the prize pool.',
    money: 'Pool is pledged up front and released to the winner in milestone tranches.',
    example: 'Turn ocean plastic into clean fuel',
  },
  startup: {
    id: 'startup', label: 'Startup Quest', icon: Rocket, hue: '#7BE0C3',
    tagline: 'Pre-crowdfunded startup funding for the team that wins.',
    who: 'The crowd and sponsors fund the quest before it opens. Teams pitch to humanity’s panel.',
    wins: 'Winning teams build the proof of concept with their winnings, then the full solution they pitched.',
    money: 'Funding unlocks in tranches: award, proof of concept, then solution milestones.',
    example: 'Humanity’s first OS moment: the proof of concept',
  },
  crowd: {
    id: 'crowd', label: 'Crowd Campaign', icon: HandCoins, hue: '#8B7BFF',
    tagline: 'A regular crowdfunding campaign, with Humanity-AI rules.',
    who: 'Anyone with a pledge-worthy idea launches; backers pledge.',
    wins: 'The team keeps what the crowd funds, if the goal is met.',
    money: 'All-or-nothing goal; funds unlock by milestone, and every contribution is attributed on the Ledger.',
    example: 'Open civic-AI literacy curriculum',
  },
};

const inferType = (q) => {
  const raw = String(q.type || q.kind || '').toLowerCase();
  if (TYPES[raw]) return raw;
  const tags = (q.tags || []).map((t) => String(t).toLowerCase());
  if (tags.some((t) => t.includes('startup'))) return 'startup';
  if (tags.some((t) => t.includes('crowd'))) return 'crowd';
  return 'prize';
};

// ---------- money + progress helpers (the quest data model: type, goal, raised, deadline, teams) ----------
const SYMBOLS = { USD: '$', EUR: '€', GBP: '£', AUD: 'A$', CAD: 'C$', ILS: '₪' };
const fmtMoney = (n, cur = 'USD') => {
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  return (SYMBOLS[cur] ?? `${cur} `) + v.toLocaleString(undefined, { maximumFractionDigits: 0 });
};
const pctOf = (q) => (Number(q.goal) > 0 ? Math.min(100, (Number(q.raised || 0) / Number(q.goal)) * 100) : null);
const pledgeName = (id) => (PLEDGES.find((p) => p.n === id) || {}).name || '';

const SAMPLES = [
  { id: 'sample-prize', sample: true, type: 'prize', status: 'Open', bounty: '$25,000', title: 'Turn ocean plastic into clean fuel', summary: 'A scalable, low-energy process to convert mixed ocean plastics into usable fuel.', tags: ['Climate', 'Materials'] },
  { id: 'sample-startup', sample: true, type: 'startup', status: 'Open', bounty: '[Pool to be announced]', title: 'Humanity’s first OS moment: the proof of concept', summary: 'Winning teams build the first working proof of the Constitutional OS with their winnings, then the full solution they pitched.', tags: ['OS', 'Startup funding'] },
  { id: 'sample-consent', sample: true, type: 'prize', status: 'Open', bounty: '$8,000', title: 'A consent layer every AI must ask through', summary: 'Design the handshake where your digital self grants or denies an AI access, on your terms.', tags: ['Agents', 'Privacy'] },
  { id: 'sample-crowd', sample: true, type: 'crowd', status: 'Open', bounty: '[Goal to be announced]', title: 'Open civic-AI literacy curriculum', summary: 'Plain-language, open curricula so people can audit the models that govern them.', tags: ['Education', 'Open source'] },
];

const STAGES = [
  { icon: Coins, t: 'Fund', d: 'Sponsors and the crowd pre-fund the quest. Nothing opens until the goal is met.' },
  { icon: Lightbulb, t: 'Pitch', d: 'Teams register and pitch with their personal agent. Sub-agents stress-test every idea.' },
  { icon: Gavel, t: 'Panel', d: 'Humanity’s panel, chosen by lottery, scores the pitches in the open.' },
  { icon: Trophy, t: 'Award', d: 'Winners receive the first tranche: prize money or startup funding.' },
  { icon: Hammer, t: 'Build the PoC', d: 'Teams build the proof of concept. Each milestone releases the next tranche.' },
  { icon: Flag, t: 'Ship the solution', d: 'The full solution ships. Every originator is credited on the Ledger, and IP stays visible.' },
];

export const QuestStylesV3 = () => (
  <style>{`
    .qv-cover { position: relative; height: 150px; overflow: hidden; border-radius: 16px 16px 0 0; background: radial-gradient(circle at 20% 20%, var(--hue-a), transparent 60%), radial-gradient(circle at 85% 90%, var(--hue-b), transparent 55%), #08101e; }
    .qv-cover::before { content: ''; position: absolute; width: 320px; height: 320px; right: -90px; top: -120px; border-radius: 50%; border: 1px dashed rgba(255,255,255,.22); animation: v3-spin 80s linear infinite; }
    .qv-cover::after { content: ''; position: absolute; width: 190px; height: 190px; right: -20px; top: -60px; border-radius: 50%; border: 1px solid rgba(255,255,255,.14); }
    .qv-cover .ico { position: absolute; left: 18px; bottom: 14px; opacity: .9; }
    .qv-card { height: 100%; display: flex; flex-direction: column; text-align: left; border-radius: 16px; border: 1px solid rgba(255,255,255,.1); background: linear-gradient(160deg, rgba(14,24,44,.88), rgba(8,14,28,.8)); overflow: hidden;
      transition: transform .4s cubic-bezier(.2,.7,.3,1), border-color .4s, box-shadow .4s; }
    .qv-card:hover { transform: translateY(-6px); border-color: rgba(255,214,10,.5); box-shadow: 0 24px 60px rgba(0,0,0,.5); }
    .qv-badge { display: inline-flex; align-items: center; gap: .4rem; padding: .25rem .6rem; border-radius: 999px; font-size: .6rem; border: 1px solid currentColor; backdrop-filter: blur(6px); background: rgba(6,12,24,.55); }
    .qv-chip { padding: .5rem 1rem; border-radius: 999px; font-size: .82rem; border: 1px solid rgba(255,255,255,.16); color: var(--bone-dim); transition: all .25s; background: transparent; cursor: pointer; }
    .qv-chip:hover { border-color: rgba(255,214,10,.5); color: #fff; }
    .qv-chip.on { background: var(--gold); border-color: var(--gold); color: var(--void); font-weight: 600; }
    .qv-select { height: 40px; padding: 0 1rem; border-radius: 999px; border: 1px solid rgba(255,255,255,.16); background: rgba(6,12,24,.7); color: var(--bone); font-size: .82rem; outline: none; }
    .qv-search { display: flex; align-items: center; gap: .6rem; padding: 0 1rem; height: 46px; border-radius: 999px; border: 1px solid rgba(255,255,255,.16); background: rgba(6,12,24,.7); min-width: 260px; }
    .qv-search input { background: transparent; border: 0; outline: 0; color: var(--bone); flex: 1; min-width: 0; font-size: .9rem; }
    .qv-meter { height: 8px; border-radius: 999px; background: rgba(255,255,255,.09); overflow: hidden; }
    .qv-meter > i { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--gold), #fff2a8); box-shadow: 0 0 14px rgba(255,214,10,.5); }
    .qv-flag { position: relative; overflow: hidden; border-radius: 26px; border: 1px solid rgba(255,214,10,.4); background: radial-gradient(ellipse 60% 120% at 95% 40%, rgba(123,224,195,.16), transparent 70%), radial-gradient(ellipse 50% 100% at 0% 100%, rgba(255,214,10,.14), transparent 70%), rgba(8,14,28,.85); }
    .qv-tab { display: flex; align-items: center; gap: .7rem; padding: 1rem 1.3rem; border-radius: 16px; border: 1px solid rgba(255,255,255,.12); background: rgba(10,18,34,.7); text-align: left; transition: all .3s; cursor: pointer; color: inherit; }
    .qv-tab.on { border-color: var(--tab-hue); box-shadow: 0 0 40px color-mix(in srgb, var(--tab-hue) 22%, transparent); background: rgba(14,24,44,.95); }
    .qv-rail { position: relative; display: grid; gap: 1rem; grid-template-columns: 1fr; }
    @media (min-width: 1024px) { .qv-rail { grid-template-columns: repeat(6, 1fr); } .qv-rail::before { content: ''; position: absolute; left: 4%; right: 4%; top: 30px; height: 2px; background: linear-gradient(90deg, rgba(255,214,10,0), rgba(255,214,10,.6), rgba(123,224,195,.6), rgba(255,214,10,0)); } }
    .qv-stage { position: relative; padding: 1.2rem; border-radius: 16px; border: 1px solid rgba(255,255,255,.1); background: rgba(10,18,34,.8); transition: transform .4s, border-color .4s; }
    .qv-stage:hover { transform: translateY(-5px); border-color: rgba(255,214,10,.5); }
    .qv-stage .dot { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: var(--v3-ink); border: 1px solid rgba(255,214,10,.6); color: var(--gold); margin-bottom: 1rem; animation: v3-pulse 3.4s infinite; }
    .qv-modal { position: fixed; inset: 0; z-index: 60; background: rgba(3,6,13,.82); backdrop-filter: blur(8px); overflow-y: auto; padding: 5vh 1rem; }
    .qv-input { width: 100%; padding: .85rem 1rem; border-radius: 12px; outline: none; background: var(--void-2); border: 1px solid var(--line-2); color: var(--bone); }
    @media (prefers-reduced-motion: reduce) { .qv-cover::before, .qv-stage .dot { animation: none !important; } }
  `}</style>
);

export function createQuestV3({ E, useCmsField, PageWrap, AgentNetwork, QuestDetail }) {

  const useQuests = () => {
    const [state, setState] = useState({ quests: [], loaded: false });
    useEffect(() => {
      let on = true;
      fetch('/api/quests').then((r) => r.json()).then((d) => on && setState({ quests: d.quests || [], loaded: true }))
        .catch(() => on && setState({ quests: [], loaded: true }));
      return () => { on = false; };
    }, []);
    return state;
  };

  const daysLeft = (iso) => {
    const t = Date.parse(iso); if (!Number.isFinite(t)) return null;
    return Math.max(0, Math.ceil((t - Date.now()) / 86400000));
  };

  const TypeBadge = ({ type }) => {
    const T = TYPES[type]; const I = T.icon;
    return <span className="qv-badge v3-mono" style={{ color: T.hue }}><I size={11} />{T.label}</span>;
  };

  const QuestCard = ({ q, onOpen }) => {
    const type = inferType(q); const T = TYPES[type]; const I = T.icon;
    const dl = q.deadline ? daysLeft(q.deadline) : null;
    const pct = pctOf(q);
    const teams = Number(q.teams || 0), backers = Number(q.backers || 0);
    const statusText = String(q.status || 'Open');
    return (
      <button className="qv-card w-full" onClick={() => onOpen(q)}>
        <div className="qv-cover" style={{ '--hue-a': `${T.hue}55`, '--hue-b': `${T.hue}22` }}>
          <div className="absolute left-4 top-4 flex gap-2 flex-wrap z-10">
            <TypeBadge type={type} />
            {q.sample && <span className="qv-badge v3-mono" style={{ color: '#C4CFE6' }}>Sample</span>}
            {!q.sample && q.is_demo ? <span className="qv-badge v3-mono" style={{ color: 'var(--gold)' }}>Demo</span> : null}
          </div>
          <I className="ico" size={44} style={{ color: T.hue }} />
        </div>
        <div className="p-6 flex flex-col gap-3 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="v3-mono" style={{ fontSize: '.62rem', color: 'var(--pi-teal)' }}>{statusText}</span>
            <span className="font-display text-xl" style={{ color: 'var(--gold)' }}>{Number(q.goal) > 0 ? fmtMoney(q.goal, q.currency) : q.bounty}</span>
          </div>
          <div className="font-display text-2xl leading-snug">{q.title}</div>
          <p className="text-sm leading-relaxed flex-1" style={{ color: '#9AA8C4' }}>{q.summary}</p>
          {pct !== null ? (
            <div>
              <div className="qv-meter"><i style={{ width: `${pct}%` }} /></div>
              <div className="flex items-baseline justify-between mt-2 text-sm">
                <span><b style={{ color: 'var(--gold)' }}>{fmtMoney(q.raised, q.currency)}</b> <span style={{ color: '#8A98B6' }}>pledged</span></span>
                <span className="v3-mono" style={{ fontSize: '.6rem', color: '#8A98B6' }}>{Math.round(pct)}%</span>
              </div>
            </div>
          ) : <div className="v3-mono" style={{ fontSize: '.58rem', color: 'var(--gold)' }}>Goal to be announced · opens at goal</div>}
          <div className="flex flex-wrap gap-x-4 gap-y-1 v3-mono" style={{ fontSize: '.58rem', color: '#8A98B6' }}>
            <span className="inline-flex items-center gap-1"><HandCoins size={12} />{backers.toLocaleString()} backers</span>
            <span className="inline-flex items-center gap-1"><Users size={12} />{teams.toLocaleString()} {teams === 1 ? 'team' : 'teams'}</span>
            <span className="inline-flex items-center gap-1"><Clock size={12} />{dl !== null ? `${dl} days left` : 'Opens at goal'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(q.pledges || []).slice(0, 3).map((id) => <span key={id} className="v3-mono px-2 py-1 rounded-full" style={{ fontSize: '.56rem', border: '1px solid rgba(123,224,195,.4)', color: '#BFEAFF' }}>{id}</span>)}
            {(q.tags || []).map((t) => <span key={t} className="text-xs px-2 py-1 rounded-full" style={{ border: '1px solid var(--line-2)', color: 'var(--bone-dim)' }}>{t}</span>)}
          </div>
          <div className="flex items-center justify-between pt-3 mt-1" style={{ borderTop: '1px solid rgba(255,255,255,.08)' }}>
            <span className="v3-mono" style={{ fontSize: '.58rem', color: '#8A98B6' }}>{q.sponsor ? `By ${q.sponsor}` : (q.is_demo ? 'Demo figures' : '')}</span>
            <span className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--gold)' }}>View quest <ArrowRight size={14} /></span>
          </div>
        </div>
      </button>
    );
  };

  // ---------- campaign facts shown in the quest modal (above the live pitch + Q&A) ----------
  const QuestFacts = ({ q }) => {
    const type = inferType(q); const T = TYPES[type];
    const pct = pctOf(q);
    const dl = q.deadline ? daysLeft(q.deadline) : null;
    const tr = Array.isArray(q.tranches) ? q.tranches.filter((t) => t && t.name) : [];
    const trTotal = tr.reduce((s, t) => s + (Number(t.pct) || 0), 0) || 1;
    const tile = (label, value) => (
      <div className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
        <div className="v3-mono" style={{ fontSize: '.52rem', color: '#8A98B6' }}>{label}</div>
        <div className="text-sm font-semibold mt-1">{value}</div>
      </div>
    );
    return (
      <div className="mt-6 grid gap-5">
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={type} />
          {q.is_demo ? <span className="qv-badge v3-mono" style={{ color: 'var(--gold)' }}>Demo figures</span> : null}
          {q.sponsor && <span className="v3-mono" style={{ fontSize: '.6rem', color: '#8A98B6' }}>By {q.sponsor}</span>}
        </div>
        {pct !== null ? (
          <div>
            <div className="qv-meter"><i style={{ width: `${pct}%` }} /></div>
            <div className="flex justify-between items-baseline mt-2 text-sm">
              <span><b style={{ color: 'var(--gold)' }}>{fmtMoney(q.raised, q.currency)}</b> of {fmtMoney(q.goal, q.currency)}</span>
              <span className="v3-mono" style={{ fontSize: '.62rem', color: '#8A98B6' }}>{Math.round(pct)}%</span>
            </div>
          </div>
        ) : <div className="v3-mono" style={{ fontSize: '.62rem', color: 'var(--gold)' }}>Goal to be announced · the quest opens at goal</div>}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {tile('Backers', Number(q.backers || 0).toLocaleString())}
          {tile('Teams', Number(q.teams || 0).toLocaleString())}
          {tile(dl !== null ? 'Days left' : 'Deadline', dl !== null ? dl : 'Opens at goal')}
          {tile('Type', T.label)}
        </div>
        {Array.isArray(q.pledges) && q.pledges.length > 0 && (
          <div>
            <div className="v3-mono mb-2" style={{ fontSize: '.58rem', color: 'var(--pi-teal)' }}>Pledges this quest advances</div>
            <div className="flex flex-wrap gap-2">
              {q.pledges.map((id) => <span key={id} className="text-xs px-3 py-1 rounded-full" style={{ border: '1px solid rgba(123,224,195,.4)', color: '#BFEAFF' }}>{id} {pledgeName(id)}</span>)}
            </div>
          </div>
        )}
        {tr.length > 0 && (
          <div>
            <div className="v3-mono mb-2" style={{ fontSize: '.58rem', color: 'var(--gold)' }}>Money follows milestones</div>
            <div className="flex gap-1">{tr.map((t, i) => <div key={i} style={{ flex: Number(t.pct) || 1, height: 8, borderRadius: 4, background: T.hue, opacity: 1 - i * 0.2 }} />)}</div>
            <div className="flex gap-1 mt-2">{tr.map((t, i) => <div key={i} className="text-xs" style={{ flex: Number(t.pct) || 1, color: '#9AA8C4' }}>{t.name}<div className="v3-mono" style={{ fontSize: '.55rem' }}>{Math.round(((Number(t.pct) || 0) / trTotal) * 100)}%</div></div>)}</div>
          </div>
        )}
        <p className="v3-mono" style={{ fontSize: '.58rem', color: '#8A98B6' }}>{q.is_demo ? 'Demo quest · figures are illustrative · no money moves until live payments are approved' : 'Funds unlock only as milestones are met'}</p>
      </div>
    );
  };

  // ---------- modal with the existing live pitch + Q&A ----------
  const QuestModal = ({ q, onClose }) => {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(!q.sample);
    useEffect(() => {
      if (q.sample) return;
      let on = true;
      fetch(`/api/quests/${q.id}`).then((r) => r.json()).then((d) => on && setDetail(d.quest || null)).catch(() => {}).finally(() => on && setLoading(false));
      return () => { on = false; };
    }, [q]);
    const T = TYPES[inferType(q)];
    return (
      <div className="qv-modal" onClick={onClose}>
        <div className="max-w-3xl mx-auto" onClick={(e) => e.stopPropagation()}>
          {q.sample ? (
            <div className="card-glass rounded-2xl p-8" style={{ borderLeft: `2px solid ${T.hue}` }}>
              <div className="flex items-start justify-between gap-4">
                <div><TypeBadge type={inferType(q)} /><h3 className="font-display text-3xl mt-3">{q.title}</h3></div>
                <button onClick={onClose} aria-label="Close" className="text-bone-dim hover:text-bone"><X size={22} /></button>
              </div>
              <p className="mt-4 leading-relaxed" style={{ color: '#9AA8C4' }}>{q.summary}</p>
              <div className="grid sm:grid-cols-3 gap-4 mt-7">
                {[['Who funds', T.who], ['What the winner gets', T.wins], ['How money moves', T.money]].map(([a, b]) => (
                  <div key={a}><div className="v3-mono" style={{ fontSize: '.6rem', color: T.hue }}>{a}</div><p className="text-sm mt-2 leading-relaxed">{b}</p></div>
                ))}
              </div>
              <p className="v3-mono mt-7" style={{ fontSize: '.62rem', color: 'var(--gold)' }}>Sample quest · aspirational · not live until the funding goal is met</p>
            </div>
          ) : (
            <div className="relative">
              <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 z-10 text-bone-dim hover:text-bone"><X size={22} /></button>
              <QuestDetail quest={detail} loading={loading} onClose={onClose} facts={<QuestFacts q={detail || q} />} />
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================
  const QuestPageV3 = ({ setPage, onOpenAgent, onSeedAgent }) => {
    const stars = useStarField(80);
    const { quests, loaded } = useQuests();
    const [type, setType] = useState('startup');          // type explorer
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sort, setSort] = useState('featured');
    const [q, setQ] = useState('');
    const [open, setOpen] = useState(null);
    const [faq, setFaq] = useState(0);

    const goal = useCmsField('quest', 'fund_goal', '');
    const raised = useCmsField('quest', 'fund_raised', '');
    const num = (v) => parseFloat(String(v).replace(/[^0-9.]/g, ''));
    const flagQ = quests.find((x) => x.id === 'first-os-moment') || null; // live flagship quest from the API, if present
    const g = flagQ && Number(flagQ.goal) > 0 ? Number(flagQ.goal) : num(goal);
    const r = flagQ && Number(flagQ.goal) > 0 ? Number(flagQ.raised || 0) : num(raised);
    const flagPct = g > 0 && r >= 0 ? Math.min(100, (r / g) * 100) : null;

    const usingSamples = loaded && quests.length === 0;
    const all = usingSamples ? SAMPLES : quests;
    const shown = useMemo(() => all.filter((x) => {
      if (filterType !== 'all' && inferType(x) !== filterType) return false;
      if (filterStatus !== 'all' && String(x.status || 'Open').toLowerCase() !== filterStatus) return false;
      if (q.trim()) {
        const hay = `${x.title} ${x.summary} ${(x.tags || []).join(' ')}`.toLowerCase();
        if (!hay.includes(q.trim().toLowerCase())) return false;
      }
      return true;
    }).sort((x, y) => {
      if (sort === 'ending') return (x.deadline ? Date.parse(x.deadline) : Infinity) - (y.deadline ? Date.parse(y.deadline) : Infinity);
      if (sort === 'funded') return (pctOf(y) ?? -1) - (pctOf(x) ?? -1);
      if (sort === 'newest') return String(y.created_at || '').localeCompare(String(x.created_at || ''));
      return 0;
    }), [all, filterType, filterStatus, q, sort]);
    const totals = useMemo(() => ({
      raised: all.reduce((t, x) => t + (Number(x.raised) || 0), 0),
      backers: all.reduce((t, x) => t + (Number(x.backers) || 0), 0),
      teams: all.reduce((t, x) => t + (Number(x.teams) || 0), 0),
    }), [all]);

    const T = TYPES[type]; const TI = T.icon;
    const proposeHref = 'mailto:build@humanity-ai.quest?subject=' + encodeURIComponent('Propose a quest') + '&body=' + encodeURIComponent('Campaign type (Prize / Startup / Crowd):\nProblem to solve:\nGoal and who funds it:\nWho should be on the panel:\n');

    const faqs = [
      { q: 'Is any money moving yet?', a: 'No. Funding progress is aspirational until a quest’s goal is met, and live payments are switched on only after the founders approve them. Today you can register to pitch and ask questions.' },
      { q: 'Who owns what the winning team builds?', a: 'The originators are always attributed on the Ledger, and IP is fully visible. The OS itself stays open and can never be sold or acquired (pledge I.09).' },
      { q: 'How are winners chosen?', a: 'By humanity’s panel: ethicists, scientists, citizens and elders chosen by lottery, scoring in the open. Teams compete through their personal agents; AI helps surface solution paths but never decides.' },
      { q: 'Why tranches instead of one prize cheque?', a: 'So winners build the proof of concept first and the crowd’s money follows real milestones. It protects backers and keeps teams shipping.' },
    ];

    return (
      <PageWrap>
        {/* ================= HERO ================= */}
        <section className="v3-hero" style={{ minHeight: '82vh' }}>
          <div className="v3-nebula" /><div className="v3-stars" style={{ backgroundImage: stars }} />
          <div className="absolute inset-0 opacity-25" style={{ zIndex: 0 }}><AgentNetwork density={22} height="100%" planetary={false} /></div>
          <div className="v3-floor" /><div className="v3-vignette" />
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 pt-24 pb-24 grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 animate-fade-up">
              <div className="v3-label v3-mono"><E p="quest" k="v3_eyebrow" as="span">Quest OS · Season 04 · pre-funded</E></div>
              <h1 className="v3-h1 text-6xl md:text-8xl mt-6"><E p="quest" k="v3_h1a" as="span" className="v3-h1-glow">Fund the problem.</E><br /><E p="quest" k="v3_h1b" as="span" className="font-italic" style={{ color: 'var(--gold)' }}>Compete for the solution.</E></h1>
              <E p="quest" k="v3_sub" as="p" className="text-xl mt-7 max-w-2xl leading-relaxed" style={{ color: '#C4CFE6' }}>
                Quests are pre-funded challenges for humanity’s first OS moment. Teams pitch, humanity’s panel chooses, and the winners build the proof of concept with their winnings, then the solution they pitched.
              </E>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#qv-board" className="btn-aurora" style={{ padding: '1rem 1.8rem', boxShadow: '0 0 40px rgba(255,214,10,.25)' }}><E p="quest" k="v3_cta_browse" as="span">Browse quests</E> <ArrowRight size={16} /></a>
                <a href={proposeHref} className="btn-secondary" style={{ padding: '1rem 1.6rem', borderColor: 'rgba(255,214,10,.5)', color: 'var(--gold)' }}><E p="quest" k="v3_cta_launch" as="span">Launch a quest</E> <Rocket size={16} /></a>
                <button onClick={() => setPage('back')} className="btn-secondary" style={{ padding: '1rem 1.6rem' }}><E p="quest" k="v3_cta_fund" as="span">Fund a quest</E></button>
              </div>
              <E p="quest" k="v3_honesty" as="div" className="v3-mono mt-5" style={{ fontSize: '.62rem', color: '#8A98B6' }}>Demo build · no live payments · aspirational until goals are met</E>
            </div>

            {/* quest console */}
            <Reveal delay={150} className="lg:col-span-5">
              <div className="qv-flag p-7">
                <div className="flex items-center justify-between">
                  <span className="qv-badge v3-mono" style={{ color: '#7BE0C3' }}><Cpu size={11} /> Flagship quest</span>
                  <span className="v3-mono" style={{ fontSize: '.58rem', color: '#8A98B6' }}>Demo · aspirational</span>
                </div>
                <E p="quest" k="v3_flag_title" as="div" className="font-display text-3xl mt-5 leading-tight">Humanity’s first OS moment</E>
                <E p="quest" k="v3_flag_d" as="p" className="text-sm mt-3 leading-relaxed" style={{ color: '#9AA8C4' }}>
                  Build the first working proof of the Constitutional OS: the firewall, the personal agent and the Ledger, working together.
                </E>
                <div className="mt-6">
                  <div className="qv-meter"><i style={{ width: `${flagPct ?? 0}%` }} /></div>
                  <div className="v3-mono mt-3 flex justify-between" style={{ fontSize: '.6rem', color: '#8A98B6' }}>
                    {flagPct !== null ? <><span style={{ color: 'var(--gold)' }}>{Math.round(flagPct)}% pre-funded</span><span>Opens at 100%</span></> : <E p="quest" k="v3_flag_pending" as="span">Pool and progress appear once the founders set the goal</E>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mt-6">
                  {[['Type', 'Startup Quest'], ['Teams', String(flagQ ? flagQ.teams ?? 0 : 0)], ['Payout', 'Tranches']].map(([a, b]) => (
                    <div key={a} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.08)' }}>
                      <div className="v3-mono" style={{ fontSize: '.52rem', color: '#8A98B6' }}>{a}</div>
                      <div className="text-sm font-semibold mt-1">{b}</div>
                    </div>
                  ))}
                </div>
                <button onClick={() => onSeedAgent ? onSeedAgent('Help me turn my idea into a pitch for the Humanity’s first OS moment quest.') : onOpenAgent()} className="btn-aurora w-full justify-center mt-6"><Sparkles size={16} /> <E p="quest" k="v3_flag_cta" as="span">Pitch with Pi</E></button>
                {flagQ && <button onClick={() => setOpen(flagQ)} className="btn-secondary w-full justify-center mt-3"><E p="quest" k="v3_flag_register" as="span">Register to pitch</E></button>}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ================= THREE KINDS OF CAMPAIGN ================= */}
        <section className="py-24" style={{ background: 'linear-gradient(180deg, var(--v3-ink), #08101e 55%, var(--v3-ink))' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <Reveal className="max-w-3xl">
              <div className="v3-label v3-mono"><E p="quest" k="v3_types_label" as="span">One OS · three kinds of campaign</E></div>
              <h2 className="font-display text-5xl md:text-6xl leading-[1] mt-5" style={{ fontWeight: 300, letterSpacing: '-.03em' }}><E p="quest" k="v3_types_h2" as="span">Prize it. Fund it. Crowd it.</E></h2>
              <E p="quest" k="v3_types_sub" as="p" className="mt-5 text-lg leading-relaxed" style={{ color: '#9AA8C4' }}>Regular crowdfunding is only one way to fund a future. Quest OS adds pre-funded quests where the money exists before the teams compete.</E>
            </Reveal>
            <div className="grid md:grid-cols-3 gap-4 mt-12">
              {Object.values(TYPES).map((t) => { const I = t.icon; return (
                <button key={t.id} onClick={() => setType(t.id)} className={'qv-tab ' + (type === t.id ? 'on' : '')} style={{ '--tab-hue': t.hue }}>
                  <I size={26} style={{ color: t.hue }} /><div><div className="font-display text-2xl">{t.label}</div><div className="text-xs mt-1" style={{ color: '#9AA8C4' }}>{t.tagline}</div></div>
                </button>); })}
            </div>
            <Reveal key={type} className="qv-flag mt-5 p-8 md:p-10 grid md:grid-cols-12 gap-8">
              <div className="md:col-span-4">
                <TI size={40} style={{ color: T.hue }} />
                <div className="font-display text-4xl mt-4 leading-tight">{T.label}</div>
                <p className="mt-3" style={{ color: '#9AA8C4' }}>{T.tagline}</p>
                <div className="v3-mono mt-6" style={{ fontSize: '.6rem', color: T.hue }}>Example</div>
                <div className="font-display text-xl mt-2">{T.example}</div>
              </div>
              <div className="md:col-span-8 grid sm:grid-cols-3 gap-6">
                {[['Who funds', T.who], ['What the winner gets', T.wins], ['How the money moves', T.money]].map(([a, b], i) => (
                  <div key={a} className="p-5 rounded-2xl" style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.09)' }}>
                    <div className="v3-mono" style={{ fontSize: '.58rem', color: T.hue }}>0{i + 1} · {a}</div>
                    <p className="mt-3 leading-relaxed text-[15px]">{b}</p>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ================= THE BOARD ================= */}
        <section id="qv-board" className="py-24" style={{ background: 'var(--v3-ink)' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <Reveal className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <div className="v3-label v3-mono"><E p="quest" k="v3_board_label" as="span">The quest board</E></div>
                <h2 className="font-display text-5xl md:text-6xl leading-[1] mt-5" style={{ fontWeight: 300, letterSpacing: '-.03em' }}><E p="quest" k="v3_board_h2" as="span">Open quests</E></h2>
              </div>
              <label className="qv-search"><Search size={16} style={{ color: 'var(--bone-dim)' }} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search quests, tags, problems…" aria-label="Search quests" /></label>
            </Reveal>

            <div className="v3-hud mt-8">
              <div><div className="font-display text-3xl" style={{ color: 'var(--gold)' }}>{all.length}</div><div className="v3-mono mt-1" style={{ fontSize: '.6rem', color: '#8A98B6' }}>Quests</div></div>
              <div><div className="font-display text-3xl">{fmtMoney(totals.raised)}</div><div className="v3-mono mt-1" style={{ fontSize: '.6rem', color: '#8A98B6' }}>Pledged (demo)</div></div>
              <div><div className="font-display text-3xl">{totals.backers.toLocaleString()}</div><div className="v3-mono mt-1" style={{ fontSize: '.6rem', color: '#8A98B6' }}>Backers</div></div>
              <div><div className="font-display text-3xl">{totals.teams.toLocaleString()}</div><div className="v3-mono mt-1" style={{ fontSize: '.6rem', color: '#8A98B6' }}>Teams</div></div>
            </div>

            <div className="flex flex-wrap gap-2 mt-6 items-center">
              {[['all', 'All types'], ['prize', 'Prize'], ['startup', 'Startup'], ['crowd', 'Crowd']].map(([id, l]) => <button key={id} onClick={() => setFilterType(id)} className={'qv-chip ' + (filterType === id ? 'on' : '')}>{l}</button>)}
              <span className="mx-2 w-px self-stretch" style={{ background: 'rgba(255,255,255,.14)' }} />
              {[['all', 'Any status'], ['open', 'Open'], ['in review', 'In review'], ['awarded', 'Awarded']].map(([id, l]) => <button key={id} onClick={() => setFilterStatus(id)} className={'qv-chip ' + (filterStatus === id ? 'on' : '')}>{l}</button>)}
              <select className="qv-select ml-auto" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort quests">
                <option value="featured">Sort: Featured</option><option value="ending">Ending soon</option><option value="funded">Most funded</option><option value="newest">Newest</option>
              </select>
            </div>

            {usingSamples && <div className="v3-mono mt-6 p-3 rounded-xl inline-block" style={{ fontSize: '.62rem', color: 'var(--gold)', border: '1px dashed rgba(255,214,10,.4)' }}>Showing sample quests · live quests appear here as soon as they are published</div>}

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
              {shown.map((x, i) => <Reveal key={x.id} delay={(i % 3) * 90} className="h-full"><QuestCard q={x} onOpen={setOpen} /></Reveal>)}
              {loaded && shown.length === 0 && <p className="col-span-full" style={{ color: '#9AA8C4' }}>No quests match. Clear a filter, or <a href={proposeHref} style={{ color: 'var(--gold)' }}>propose one</a>.</p>}
            </div>
          </div>
        </section>

        {/* ================= LIFECYCLE ================= */}
        <section className="py-24" style={{ background: 'linear-gradient(180deg, var(--v3-ink), rgba(20,40,80,.35) 50%, var(--v3-ink))' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <Reveal>
              <div className="v3-label v3-mono"><E p="quest" k="v3_life_label" as="span">From pledge to proof of concept</E></div>
              <h2 className="font-display text-5xl md:text-6xl leading-[1] mt-5" style={{ fontWeight: 300, letterSpacing: '-.03em' }}><E p="quest" k="v3_life_h2" as="span">Six stages. </E><E p="quest" k="v3_life_h2b" as="span" className="font-italic" style={{ color: 'var(--gold)' }}>Money follows milestones.</E></h2>
            </Reveal>
            <div className="qv-rail mt-14">
              {STAGES.map((s, i) => { const I = s.icon; return (
                <Reveal key={s.t} delay={i * 90} className="qv-stage">
                  <div className="dot" style={{ animationDelay: `${i * 0.6}s` }}><I size={22} /></div>
                  <div className="v3-mono" style={{ fontSize: '.58rem', color: 'var(--gold)' }}>Stage 0{i + 1}</div>
                  <E p="quest" k={`v3_stage${i}_t`} as="div" className="font-display text-2xl mt-1">{s.t}</E>
                  <E p="quest" k={`v3_stage${i}_d`} as="p" className="text-sm mt-2 leading-relaxed" style={{ color: '#9AA8C4' }}>{s.d}</E>
                </Reveal>); })}
            </div>
          </div>
        </section>

        {/* ================= WHO IT IS FOR ================= */}
        <section className="py-24" style={{ background: 'var(--v3-ink)' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <Reveal className="max-w-3xl"><div className="v3-label v3-mono"><E p="quest" k="v3_for_label" as="span">Pick your seat</E></div>
              <h2 className="font-display text-5xl md:text-6xl leading-[1] mt-5" style={{ fontWeight: 300, letterSpacing: '-.03em' }}><E p="quest" k="v3_for_h2" as="span">Teams. Sponsors. Backers.</E></h2></Reveal>
            <div className="grid md:grid-cols-3 gap-5 mt-12">
              {[
                { k: 'teams', icon: Users, t: 'For teams', d: 'Register to pitch, work with your personal agent and its sub-agents, and win funding to build the proof of concept and the solution.', cta: 'Register to pitch', go: () => { document.getElementById('qv-board')?.scrollIntoView({ behavior: 'smooth' }); } },
                { k: 'sponsors', icon: Target, t: 'For sponsors', d: 'Pre-fund a problem you care about. Set the goal, name the panel criteria, and watch teams compete in the open.', cta: 'Sponsor a quest', href: proposeHref },
                { k: 'backers', icon: HandCoins, t: 'For backers', d: 'Pledge to a quest or to the founding build. Funds unlock only as milestones are met, and every contribution is attributed.', cta: 'Back the build', go: () => setPage('back') },
              ].map((c, i) => { const I = c.icon; return (
                <Reveal key={c.k} delay={i * 110} className="v3-node">
                  <I size={28} style={{ color: 'var(--gold)' }} />
                  <E p="quest" k={`v3_for_${c.k}_t`} as="div" className="font-display text-3xl mt-5">{c.t}</E>
                  <E p="quest" k={`v3_for_${c.k}_d`} as="p" className="mt-3 text-sm leading-relaxed" style={{ color: '#9AA8C4' }}>{c.d}</E>
                  {c.href
                    ? <a href={c.href} className="btn-secondary mt-6" style={{ borderColor: 'rgba(255,214,10,.5)', color: 'var(--gold)' }}><E p="quest" k={`v3_for_${c.k}_cta`} as="span">{c.cta}</E> <Mail size={14} /></a>
                    : <button onClick={c.go} className="btn-secondary mt-6" style={{ borderColor: 'rgba(255,214,10,.5)', color: 'var(--gold)' }}><E p="quest" k={`v3_for_${c.k}_cta`} as="span">{c.cta}</E> <ArrowRight size={14} /></button>}
                </Reveal>); })}
            </div>
          </div>
        </section>

        {/* ================= TRUST ================= */}
        <section className="py-20" style={{ background: 'linear-gradient(180deg, var(--v3-ink), #0a1424, var(--v3-ink))' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-12">
            <Reveal className="qv-flag p-8 md:p-10">
              <div className="flex items-center gap-3 v3-mono" style={{ fontSize: '.66rem', color: 'var(--pi-teal)' }}><ShieldCheck size={16} /><E p="quest" k="v3_trust_label" as="span">The rules every quest runs under</E></div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-7">
                {[
                  ['Originators credited', 'Every idea is attributed to the human who had it, on the Ledger. IP stays visible.'],
                  ['Milestone tranches', 'Money unlocks in stages, never all at once.'],
                  ['Panel by lottery', 'Humanity’s panel scores in the open. AI assists; humans decide.'],
                  ['Honest by default', 'Progress is aspirational until goals are met. No live payments until approved.'],
                ].map(([a, b], i) => (
                  <div key={a}><BadgeCheck size={20} style={{ color: 'var(--gold)' }} /><E p="quest" k={`v3_trust${i}_t`} as="div" className="font-display text-xl mt-3">{a}</E><E p="quest" k={`v3_trust${i}_d`} as="p" className="text-sm mt-2 leading-relaxed" style={{ color: '#9AA8C4' }}>{b}</E></div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        {/* ================= FAQ + CLOSE ================= */}
        <section className="py-20" style={{ background: 'var(--v3-ink)' }}>
          <div className="max-w-3xl mx-auto px-6">
            <div className="grid gap-3">
              {faqs.map((f, i) => (
                <div key={i} className="v3-faq overflow-hidden">
                  <button onClick={() => setFaq(faq === i ? -1 : i)} className="w-full text-left px-6 py-5 flex items-center justify-between gap-4">
                    <E p="quest" k={`v3_faq${i}_q`} as="span" className="font-display text-xl">{f.q}</E>
                    <ChevronDown size={18} style={{ transform: faq === i ? 'rotate(180deg)' : 'none', transition: 'transform .3s', color: 'var(--bone-dim)' }} />
                  </button>
                  {faq === i && <E p="quest" k={`v3_faq${i}_a`} as="p" className="px-6 pb-6 leading-relaxed animate-fade-up" style={{ color: '#9AA8C4' }}>{f.a}</E>}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="v3-longview">
          <div className="bg" /><div className="v3-limb" />
          <div className="relative z-10 max-w-4xl mx-auto px-6 pt-28 pb-40 text-center">
            <Reveal>
              <h2 className="font-display text-4xl md:text-6xl leading-[1.05]" style={{ fontWeight: 300, letterSpacing: '-.03em' }}><E p="quest" k="v3_close_h2" as="span">Humanity’s first OS moment needs a team.</E></h2>
              <E p="quest" k="v3_close_sub" as="p" className="font-display font-italic text-2xl md:text-3xl mt-6" style={{ color: 'var(--gold)', fontWeight: 300 }}>Be the one that builds it.</E>
              <div className="mt-9 flex flex-wrap gap-3 justify-center">
                <a href="#qv-board" className="btn-aurora" style={{ padding: '1.05rem 2.1rem', boxShadow: '0 0 50px rgba(255,214,10,.35)' }}><E p="quest" k="v3_close_cta" as="span">Register to pitch</E> <ArrowRight size={16} /></a>
                <a href={proposeHref} className="btn-secondary" style={{ padding: '1.05rem 1.8rem' }}><E p="quest" k="v3_close_cta2" as="span">Launch a quest</E></a>
              </div>
            </Reveal>
          </div>
        </section>

        {open && <QuestModal q={open} onClose={() => setOpen(null)} />}
      </PageWrap>
    );
  };

  return { QuestStylesV3, QuestPageV3 };
}
