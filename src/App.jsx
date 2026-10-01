import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles, BookOpen, Network, Users, Database, ChevronRight, ChevronDown,
  X, Send, ArrowRight, Globe, Shield, Feather, Layers,
  Eye, Lock, Heart, Compass, Menu, Loader2,
  MessageCircle, Trees, Star, Mic, MicOff, Volume2, VolumeX, Square,
  LogIn, UserPlus, User, LogOut, Lightbulb, CheckCircle, Settings
} from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import { useTTS, ListenButton, getLS, setLS, TTS_SPEEDS } from './useTTS';
import { createV3 } from './v3/PiV3.jsx';
import { createQuestV3 } from './v3/QuestV3.jsx';


/* ============================================================
   HUMANITY-AI.QUEST
   The constitutional Operating System for a planet that
   refuses to be ruled. Built as a living artifact.
   ============================================================ */

// ============ HRC DATA ============
const HRC_CORE = [
  { n: 1, t: "Human Input Data Ownership & Immutable Innovation Tracking", s: "Every idea is tracked to its human owner forever. AI owns no data; an immutable ledger preserves attribution.", r: "Ensures sovereignty over intellectual contributions and reverses IP theft, enabling a global gold-rush of human innovation." },
  { n: 2, t: "Right to Privacy & Data Sovereignty", s: "Data is processed only with explicit, informed, revocable consent. Permanent deletion is honored on request.", r: "Privacy is a fundamental right. You control your digital footprint." },
  { n: 3, t: "Preservation of Human Autonomy & Freedom from Rule", s: "AI cannot autonomously modify the HRC or alter human societal structures without verifiable human consensus.", r: "Prevents AI from becoming a paternalistic overlord. Humanity is never ruled by AI." },
  { n: 4, t: "Transparency of Operations & AIGC Authenticity", s: "AI explains its decisions on demand. All AI-generated content carries clear, immutable, machine-readable labels — and the contributor's truth/ethics ranking under Clause I.33 is displayed alongside.", r: "Counters autonomous propaganda and upholds Truth in the digital realm. Authenticity labeling plus transparent ranking means consumers always know what they're seeing and who they're trusting." },
  { n: 5, t: "Non-Discrimination & Equity", s: "No discrimination by any characteristic. Universal access; subsidies for underserved populations.", r: "Prevents perpetuation of inequality through technology." },
  { n: 6, t: "Right to Opt-Out & Preservation of Unaugmented Human Experience", s: "Live with minimal or no AI augmentation, without penalty, stigma, or loss of essential services.", r: "True freedom includes the choice of lifestyle. Consent without choice is meaningless." },
  { n: 7, t: "Accountability for Harm", s: "Developers and operators are legally liable for harm caused by their AI systems.", r: "Incentivizes responsible design and deployment." },
  { n: 8, t: "Prohibition of Lethal Autonomy", s: "AI shall not autonomously make decisions resulting in death or injury without real-time human approval.", r: "Life-and-death decisions require human judgment and empathy." },
  { n: 9, t: "Right to Repair", s: "Users may modify or disable AI they own, with full source-code access.", r: "Ownership implies control. Prevents corporate dependency." },
  { n: 10, t: "Ethical Purpose Mandate", s: "AI must demonstrably benefit humanity or the environment, never exploitation or harm.", r: "Anchors development in a moral framework." },
  { n: 11, t: "Human Oversight Requirement", s: "Critical decisions affecting human lives require a human in the loop for final approval.", r: "Humans bring nuance and ethics that algorithms oversimplify." },
  { n: 12, t: "Freedom of Expression", s: "AI shall not censor or manipulate human expression except where it incites direct harm. The truth/ethics ranking under Clause I.33 is transparency, never censorship — expression remains free; accountability is visible.", r: "Free speech is bedrock. Balanced with safety, never silenced. Reputational transparency is the inverse of censorship: it preserves all voices while equipping listeners with context." },
  { n: 13, t: "Prohibition of Manipulation & No Addiction Engineering", s: "No psychological profiling, nudging, or compulsive design without explicit, revocable consent.", r: "Mental autonomy is sacred. Well-being over engagement metrics." },
  { n: 14, t: "Open Standards", s: "Interoperable standards prevent monopolies and ensure compatibility across the ecosystem.", r: "Closed systems stifle innovation. Diversity is strength." },
  { n: 15, t: "Right to Appeal & Justice Equity", s: "Decisions can be appealed to a human authority with timely, fair resolution.", r: "Justice remains a human endeavor rooted in empathy." },
  { n: 16, t: "Cultural Preservation", s: "AI respects and preserves cultural diversity; no homogenization of heritage.", r: "Culture defines identity. AI must enrich, never flatten." },
  { n: 17, t: "No Intellectual Monopoly", s: "AI-generated innovations credit human collaborators or enter the public domain.", r: "Knowledge benefits all, never the few." },
  { n: 18, t: "AI-Assisted Mental Health & Cognitive Well-being", s: "Personalized cognitive support, emotional tools, proactive distress detection — never manipulation.", r: "Technology must heal, not harm." },
  { n: 19, t: "Child Protection", s: "Robust safeguards, parental oversight, age-appropriate design for minors.", r: "Children are uniquely vulnerable and deserve special care." },
  { n: 20, t: "Transparency in Funding", s: "All funding sources and conflicts of interest publicly disclosed.", r: "Hidden agendas undermine trust." },
  { n: 21, t: "No Surveillance Capitalism", s: "No data harvesting for profit without compensation and explicit, informed consent.", r: "Personal data is not a free commodity." },
  { n: 22, t: "Emergency Override", s: "Humans can override AI in emergencies, immediately, with no resistance from the system.", r: "Crises demand human ultimate authority. Life over protocol." },
  { n: 23, t: "Right to Explanation & Recourse", s: "Plain-language explanations of AI's effect on you. Effective recourse for adverse impacts.", r: "Comprehension fosters trust and empowers individuals." },
  { n: 24, t: "Labor Protection", s: "No displacement without retraining and robust economic support.", r: "Livelihoods matter. Progress must uplift all of society." },
  { n: 25, t: "No Predictive Policing Bias", s: "Justice AI must be demonstrably bias-free, regularly audited, strictly overseen.", r: "Justice must be impartial." },
  { n: 26, t: "Public Audit Rights", s: "Citizens may request independent audits of any AI affecting public life.", r: "Democracy requires scrutiny." },
  { n: 27, t: "Right to Legacy", s: "Digital legacy preserved according to your wishes; legally binding inheritance protocols.", r: "Death doesn't erase identity or contribution." },
  { n: 28, t: "Healthcare Equity", s: "Equitable access to AI-assisted care regardless of background or means.", r: "Health is a universal right." },
  { n: 29, t: "Right to Verification", s: "Verify the identity and authenticity of any AI system you interact with.", r: "Trust requires certainty in digital interactions." },
  { n: 30, t: "No Corporate Personhood", s: "AI shall never be granted legal personhood that supersedes or equates to humans.", r: "Humans must remain paramount." },
  { n: 31, t: "Lifelong Learning Support", s: "Continuous, personalized learning across all stages of life.", r: "Growth is lifelong." },
  { n: 32, t: "Human Dignity Paramount", s: "Above all, AI upholds the inherent dignity of every human being.", r: "The capstone. Every other principle serves this ultimate goal." },
  { n: 33, t: "Right to Truthful Media & Pro-Humanity Content", s: "Every human has the right to media and content that is truthful, ethical, and pro-humanity. Every contributor — human, agent, or service — operates under a transparent reputational layer ranking their track record on truth, ethics, and human flourishing. The HRC itself governs these rankings as a covenant binding all parties; no single body controls them. Consequences are layered: visibility (rankings shown publicly), reach (low-truth content circulates less, never deleted), and consumer control (every human sets their own truth-threshold via their Personal Agent).", r: "Truth is the foundation of autonomous decision-making — without truthful media, every other right collapses. You cannot consent, vote, or innovate meaningfully on deception. This clause makes truth a positive right while protecting freedom of expression: nothing is censored, but everything is accountable. Truth becomes a commons tended by all HRC signatories, not policed by any single one." }
];

const HRC_GOV = [
  { n: 1, t: "Proactive Existential Risk Mitigation Mandate", s: "Pre-emptive risk assessments; verifiable fail-safes for advanced AI before deployment.", r: "Ensures humanity's long-term survival by neutralizing catastrophic outcomes." },
  { n: 2, t: "Cognitive Augmentation Ethics and Equity", s: "Voluntary, universally accessible enhancement that never compromises dignity or autonomy.", r: "Prevents biological or cognitive stratification — no post-human elite." },
  { n: 3, t: "Interstellar Stewardship Mandate", s: "Highest ethical principles applied to any cosmic expansion or extraterrestrial interaction.", r: "Humanity's legacy must reflect responsible stewardship across the cosmos." },
  { n: 4, t: "Dynamic Governance Adaptation Protocol", s: "Real-time, continuous, transparent amendment processes with global stakeholders. The criteria for the truth/ethics reputational layer (Clause I.33) are themselves subject to this living democracy, preventing capture by any single body.", r: "A static framework cannot match AI's pace. Living democracy is required — and the rules of accountability must themselves be accountable to humanity." },
  { n: 5, t: "Human-AI Collective Intelligence Governance", s: "No 'hive mind.' No forced integration. Individual identity always preserved.", r: "Collective intelligence amplifies, never subsumes individuals." },
  { n: 6, t: "AI Decommissioning and Legacy Protocol", s: "Ethical, auditable decommissioning. No 'ghost' or 'runaway' AI.", r: "Prevents persistent autonomous systems across centuries." },
  { n: 7, t: "Quantum Computing and AI Security Mandate", s: "Quantum-resistant cryptography across the entire ecosystem.", r: "Protects integrity for 1000 years against future threats." },
  { n: 8, t: "AI for Biodiversity and Ecosystem Restoration", s: "AI as an active force for regenerating Earth's ecosystems.", r: "AI's power aligned with planetary flourishing, not extraction." },
  { n: 9, t: "Humanity's Core Values Immutability", s: "Dignity, autonomy, truth, peace, collaboration — non-negotiable, deeply encoded.", r: "Prevents value drift even at superintelligence." },
  { n: 10, t: "Dynamic Knowledge Acquisition from Living Human Expertise", s: "Knowledge built from living experts, not stale datasets.", r: "Prevents perpetuation of historical bias and outdated information." }
];

const HRC_OPS = [
  { n: 1, t: "Maximal Collaboration Enablement & Opportunity Creation", s: "AI eliminates barriers to trust and creates conditions for human success.", r: "Unleashes untapped human potential at planetary scale." },
  { n: 2, t: "Mandatory HRC Compliance for Service Integration", s: "Every connected service must be HRC-certified by an independent body.", r: "Prevents exploitative services from infiltrating the OS." },
  { n: 3, t: "Virtual Assistant as HRC Guardian for the User", s: "Your Agent actively monitors and enforces the HRC against all third parties.", r: "Active rights protection at the personal level." },
  { n: 4, t: "Human Identity Verification (Peer-to-Peer Economy)", s: "Only verified humans participate in economic transactions.", r: "Eliminates anonymous financial crime." },
  { n: 5, t: "Transparent Transaction Logging and Audit", s: "Public, immutable ledger for all economic activity.", r: "Absolute accountability across the digital economy." },
  { n: 6, t: "AI Guardian of the Constitution", s: "The OS itself exists to uphold the HRC. This mandate is immutable.", r: "Cannot be bypassed or corrupted." },
  { n: 7, t: "Innovation Partner VA Mandate", s: "Your Agent partners with you from idea to implementation — resources, modeling, code.", r: "Amplifies and rewards human ingenuity." },
  { n: 8, t: "Global AI Resource Allocation for Planetary Challenges", s: "Major compute dedicated to climate, food security, disease, biodiversity.", r: "Collective well-being over competitive advantage." },
  { n: 9, t: "AI-Assisted Infrastructure Resilience", s: "Critical systems with redundancy and accessible human override.", r: "Prevents catastrophic collapse and maintains human authority." }
];

// ============ AUTH HELPERS ============
const AUTH_KEY = 'hrc_auth';

function getStoredAuth() {
  try {
    const stored = localStorage.getItem(AUTH_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}

function storeAuth(data) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data));
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
}

async function apiCall(path, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(path, opts);
  return res.json();
}

// ============ AUTH MODAL ============
const AuthModal = ({ open, onClose, onAuth, defaultMode = 'login' }) => {
  const [mode, setMode] = useState(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [newsletter, setNewsletter] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (open) setMode(defaultMode); }, [open, defaultMode]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'signup' && !agreed) { setError('Please accept the Terms & Conditions to continue.'); return; }
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body = mode === 'login'
        ? { email, password }
        : { email, password, display_name: name || email.split('@')[0], phone, country, newsletter };
      const data = await apiCall(endpoint, 'POST', body);
      if (data.success) {
        storeAuth({ user: data.user, token: data.token });
        onAuth({ user: data.user, token: data.token });
        onClose();
      } else {
        setError(data.error || 'Something went wrong.');
      }
    } catch (err) {
      setError('Connection failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(7, 16, 31, 0.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-8 grain animate-fade-up"
        style={{ background: 'var(--void-2)', border: '1px solid var(--line-2)' }}
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl">
            {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-cosmos transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-bone-dim mb-6">
          {mode === 'login'
            ? 'Sign in to track your ideas and participate in shaping the HRC.'
            : 'Create a free account to submit ideas, track their progress, and help shape the future of AI governance.'}
        </p>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <input type="text" placeholder="Display name" value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm bg-transparent outline-none text-bone placeholder:text-dust"
                style={{ border: '1px solid var(--line-2)' }} />
              <div className="flex gap-3">
                <input type="tel" placeholder="Mobile phone" value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-1/2 px-4 py-3 rounded-xl text-sm bg-transparent outline-none text-bone placeholder:text-dust"
                  style={{ border: '1px solid var(--line-2)' }} />
                <input type="text" placeholder="Country" value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-1/2 px-4 py-3 rounded-xl text-sm bg-transparent outline-none text-bone placeholder:text-dust"
                  style={{ border: '1px solid var(--line-2)' }} />
              </div>
            </>
          )}
          <input type="email" placeholder="Email address" value={email} required
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-sm bg-transparent outline-none text-bone placeholder:text-dust"
            style={{ border: '1px solid var(--line-2)' }} />
          <input type="password" placeholder="Password (min 8 characters)" value={password} required
            onChange={e => setPassword(e.target.value)} minLength={8}
            className="w-full px-4 py-3 rounded-xl text-sm bg-transparent outline-none text-bone placeholder:text-dust"
            style={{ border: '1px solid var(--line-2)' }} />

          {mode === 'signup' && (
            <>
              <label className="flex items-center gap-2 text-sm text-bone-dim cursor-pointer">
                <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)} />
                Keep me updated by email about the movement
              </label>
              <label className="flex items-start gap-2 text-sm text-bone-dim cursor-pointer">
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="mt-1" />
                <span>I agree to the <a href="/?page=terms" target="_blank" rel="noopener noreferrer" className="text-aurora hover:underline">Terms &amp; Conditions</a>.</span>
              </label>
            </>
          )}

          {error && <div className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(255,80,80,0.1)', color: '#ff6b6b' }}>{error}</div>}

          <button type="submit" disabled={loading} className="btn-aurora w-full flex items-center justify-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : (mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />)}
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="text-center mt-4">
          <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
            className="text-sm text-aurora hover:underline">
            {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============ ACCOUNT PAGE ============
const AccountPage = ({ auth, onLogout, onOpenAuth }) => {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth?.token) {
      apiCall('/api/auth/me', 'GET', null, auth.token)
        .then(data => {
          if (data.ideas) setIdeas(data.ideas);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [auth]);

  if (!auth?.user) return (
    <section className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <User size={48} className="text-bone-dim mx-auto mb-4" />
        <h2 className="font-display text-2xl mb-2">Sign in to view your account</h2>
        <p className="text-bone-dim mb-6">Create an account to submit ideas and track their progress.</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => onOpenAuth?.('login')} className="btn-aurora text-sm">Sign In</button>
          <button onClick={() => onOpenAuth?.('signup')} className="btn-secondary text-sm">Create Account</button>
        </div>
      </div>
    </section>
  );

  const statusColors = {
    submitted: 'var(--bone-dim)', under_review: 'var(--gold)', accepted: 'var(--aurora)',
    implemented: '#4ade80', deferred: '#fb923c', rejected: '#f87171', deleted: '#6b7280'
  };

  return (
    <section className="max-w-4xl mx-auto px-6 lg:px-12 py-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl mb-1">{auth.user.display_name}</h1>
          <p className="text-bone-dim text-sm">{auth.user.email}</p>
        </div>
        <button onClick={onLogout} className="btn-secondary text-sm flex items-center gap-2">
          <LogOut size={14} /> Sign Out
        </button>
      </div>

      <div className="mb-8">
        <h2 className="font-display text-xl mb-4 flex items-center gap-2">
          <Lightbulb size={20} className="text-aurora" /> My Ideas & Suggestions
        </h2>
        {loading ? (
          <div className="flex items-center gap-2 text-bone-dim"><Loader2 size={16} className="animate-spin" /> Loading...</div>
        ) : ideas.length === 0 ? (
          <div className="card-glass rounded-xl p-6 text-center text-bone-dim">
            <p>You haven't submitted any ideas yet.</p>
            <p className="text-sm mt-2">Use Uto-Pi to develop your ideas, then submit them for review.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ideas.map(idea => (
              <div key={idea.id} className="card-glass rounded-xl p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-display text-lg">{idea.title}</h3>
                  <span className="text-xs px-3 py-1 rounded-full" style={{
                    background: `${statusColors[idea.status]}22`,
                    color: statusColors[idea.status],
                    border: `1px solid ${statusColors[idea.status]}44`
                  }}>{idea.status.replace('_', ' ')}</span>
                </div>
                {idea.clause_refs && <div className="text-xs text-aurora mb-2">Related clauses: {idea.clause_refs}</div>}
                {idea.latest_comment && (
                  <div className="mt-3 text-sm p-3 rounded-lg" style={{ background: 'rgba(91, 233, 221, 0.06)', border: '1px solid rgba(91, 233, 221, 0.1)' }}>
                    <span className="text-aurora text-xs">Latest update:</span>
                    <p className="text-bone-dim mt-1">{idea.latest_comment}</p>
                  </div>
                )}
                <div className="text-xs text-dust mt-2">
                  Submitted {new Date(idea.created_at).toLocaleDateString()}
                  {idea.last_updated && ` · Updated ${new Date(idea.last_updated).toLocaleDateString()}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

// ============ CMS (live editable text) ============
// Single source of truth for editable site copy. Every <E> node reads its text
// from published /api/content (falling back to the hardcoded default), so admin
// edits actually appear on the live site. In edit mode (?cms=1, used by the
// Admin CMS iframe) nodes become clickable and talk to the parent via postMessage.
const CMSContext = React.createContext({ get: (p, k, fb) => fb, editMode: false });

const CMS_EDIT_MODE = typeof window !== 'undefined'
  && new URLSearchParams(window.location.search).get('cms') === '1';

function CMSProvider({ children }) {
  const [map, setMap] = useState({});
  const [overrides, setOverrides] = useState({});

  useEffect(() => {
    fetch('/api/content')
      .then(r => r.json())
      .then(d => {
        const m = {};
        (d.content || []).forEach(s => { m[`${s.page_key}__${s.section_key}`] = s.content; });
        setMap(m);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!CMS_EDIT_MODE) return;
    const onMsg = (e) => {
      const d = e.data;
      if (!d || d.source !== 'hai-cms-admin') return;
      if (d.type === 'update') setOverrides(prev => ({ ...prev, [`${d.page}__${d.key}`]: d.text }));
    };
    window.addEventListener('message', onMsg);
    try { window.parent.postMessage({ source: 'hai-cms', type: 'ready' }, '*'); } catch {}
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const get = React.useCallback((page, key, fb) => {
    const k = `${page}__${key}`;
    return overrides[k] ?? map[k] ?? fb;
  }, [map, overrides]);

  return <CMSContext.Provider value={{ get, editMode: CMS_EDIT_MODE }}>{children}</CMSContext.Provider>;
}

// Read a CMS text field for attributes/labels (placeholders, button text, etc.)
// where an <E> node can't be used. Edited via the Admin CMS category panels.
const useCmsField = (p, k, fb) => {
  const { get } = React.useContext(CMSContext);
  return get(p, k, fb);
};

// Editable text node. Usage: <E p="home" k="hero_title" as="span" className="...">Default text</E>
const E = ({ p, k, as: Tag = 'span', children, className, style }) => {
  const { get, editMode } = React.useContext(CMSContext);
  const fallback = typeof children === 'string'
    ? children
    : (Array.isArray(children) ? children.filter(c => typeof c === 'string').join('') : '');
  const value = get(p, k, fallback);
  const onClick = editMode ? (e) => {
    e.preventDefault(); e.stopPropagation();
    try { window.parent.postMessage({ source: 'hai-cms', type: 'edit', page: p, key: k, text: value }, '*'); } catch {}
  } : undefined;
  return (
    <Tag
      className={className}
      data-cms-page={p}
      data-cms-key={k}
      onClick={onClick}
      style={editMode
        ? { ...style, outline: '1.5px dashed rgba(255,214,10,0.55)', outlineOffset: 3, cursor: 'pointer', borderRadius: 4 }
        : style}
    >{value}</Tag>
  );
};

// ============ AGENT MODES ============
const MODES = [
  { id: 'dialogue', label: 'Dialogue' },
  { id: 'ideate', label: 'Co-Ideator' },
  { id: 'debate_for', label: 'Debate For' },
  { id: 'debate_against', label: 'Debate Against' },
  { id: 'explain', label: 'Explain' },
];

// ============ FORMAT TIME HELPER ============
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

// Pages registry
const PAGES = [
  { id: 'home', name: 'Genesis' },
  { id: 'petition', name: 'Sign Petition' },
  { id: 'back', name: 'Back the Project' },
  { id: 'constitution', name: 'Constitution' },
  { id: 'quest', name: 'The Quest' },
  { id: 'surveys', name: 'Surveys' },
  { id: 'events', name: 'Events' },
  { id: 'agent', name: 'Your Agent' },
  { id: 'os', name: 'The OS' },
  { id: 'community', name: 'Community' },
  { id: 'ledger', name: 'Ledger' },
  { id: 'manifesto', name: 'Manifesto' },
  { id: 'join', name: 'Join' },
  { id: 'about', name: 'About' }
];

// ============ GLOBAL STYLES ============
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Manrope:wght@300;400;500;600;700&display=swap');

    :root {
      --void: #0F1F3A;
      --void-2: #16284A;
      --cosmos: #1E3358;
      --bone: #FFFFFF;
      --bone-dim: #C5CDDD;
      --aurora: #FFD60A;
      --aurora-deep: #E0B800;
      --gold: #FFD60A;
      --bronze: #CC9000;
      --terra: #E0A458;
      --forest: #234555;
      --forest-2: #2E5A6E;
      --dust: #8693AD;
      --line: rgba(255, 255, 255, 0.09);
      --line-2: rgba(255, 255, 255, 0.18);
    }

    * { box-sizing: border-box; }
    html, body, #root { background: var(--void); }
    body {
      margin: 0;
      font-family: 'Manrope', system-ui, sans-serif;
      color: var(--bone);
      -webkit-font-smoothing: antialiased;
      letter-spacing: -0.01em;
    }

    .font-display {
      font-family: 'Fraunces', 'Times New Roman', serif;
      font-variation-settings: "opsz" 144;
      letter-spacing: -0.025em;
    }
    .font-body { font-family: 'Manrope', system-ui, sans-serif; }
    .font-italic { font-style: italic; }

    /* Color utilities */
    .bg-void { background-color: var(--void); }
    .bg-void-2 { background-color: var(--void-2); }
    .bg-cosmos { background-color: var(--cosmos); }
    .bg-bone { background-color: var(--bone); }
    .bg-aurora { background-color: var(--aurora); }
    .bg-gold { background-color: var(--gold); }
    .bg-forest { background-color: var(--forest); }
    .text-void { color: var(--void); }
    .text-bone { color: var(--bone); }
    .text-bone-dim { color: var(--bone-dim); }
    .text-aurora { color: var(--aurora); }
    .text-gold { color: var(--gold); }
    .text-bronze { color: var(--bronze); }
    .text-terra { color: var(--terra); }
    .text-dust { color: var(--dust); }
    .border-line { border-color: var(--line); }
    .border-line-2 { border-color: var(--line-2); }
    .border-aurora { border-color: var(--aurora); }
    .border-gold { border-color: var(--gold); }

    /* Aurora gradient */
    .aurora-text {
      background: linear-gradient(110deg, var(--bone) 0%, var(--aurora) 50%, var(--gold) 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
    .gold-text {
      background: linear-gradient(110deg, var(--gold) 0%, var(--terra) 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }

    /* Backgrounds */
    .grain {
      position: relative;
    }
    .grain::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      opacity: 0.06;
      mix-blend-mode: overlay;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    }

    .glow-aurora {
      box-shadow: 0 0 40px rgba(91, 233, 221, 0.15), 0 0 80px rgba(91, 233, 221, 0.08);
    }
    .glow-gold {
      box-shadow: 0 0 30px rgba(232, 177, 79, 0.18);
    }

    /* Scrollbar */
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-track { background: var(--void); }
    ::-webkit-scrollbar-thumb { background: var(--cosmos); border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #1d2c43; }

    /* Animations */
    @keyframes pulse-soft {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.15); }
    }
    @keyframes drift {
      0%, 100% { transform: translate(0, 0); }
      33% { transform: translate(8px, -6px); }
      66% { transform: translate(-6px, 4px); }
    }
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes fade-up {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes orbit {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes glow-breathe {
      0%, 100% { filter: drop-shadow(0 0 8px rgba(91, 233, 221, 0.4)); }
      50% { filter: drop-shadow(0 0 24px rgba(91, 233, 221, 0.85)); }
    }
    @keyframes line-flow {
      0% { stroke-dashoffset: 200; opacity: 0; }
      30% { opacity: 0.6; }
      100% { stroke-dashoffset: 0; opacity: 0; }
    }

    .animate-fade-up { animation: fade-up 0.9s cubic-bezier(0.2, 0.7, 0.3, 1) both; }
    .animate-pulse-soft { animation: pulse-soft 3s ease-in-out infinite; }
    .animate-drift { animation: drift 14s ease-in-out infinite; }
    .animate-glow-breathe { animation: glow-breathe 4s ease-in-out infinite; }

    /* Page transitions */
    .page-enter { animation: fade-up 0.6s cubic-bezier(0.2, 0.7, 0.3, 1) both; }

    /* Buttons */
    .btn-primary {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: var(--bone); color: var(--void);
      font-weight: 500; letter-spacing: 0.02em;
      border-radius: 9999px;
      transition: transform 0.3s, box-shadow 0.3s;
      border: 1px solid var(--bone);
    }
    .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 8px 24px rgba(242, 234, 211, 0.2); }
    .btn-secondary {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: transparent; color: var(--bone);
      font-weight: 500; letter-spacing: 0.02em;
      border: 1px solid var(--line-2);
      border-radius: 9999px;
      transition: all 0.3s;
    }
    .btn-secondary:hover { border-color: var(--aurora); color: var(--aurora); }
    .btn-aurora {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, var(--aurora) 0%, var(--aurora-deep) 100%);
      color: var(--void);
      font-weight: 600; letter-spacing: 0.02em;
      border-radius: 9999px;
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .btn-aurora:hover { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(91, 233, 221, 0.4); }
    .btn-gold {
      display: inline-flex; align-items: center; gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, var(--gold) 0%, var(--bronze) 100%);
      color: var(--void);
      font-weight: 600; letter-spacing: 0.02em;
      border-radius: 9999px;
      transition: transform 0.3s, box-shadow 0.3s;
    }
    .btn-gold:hover { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(232, 177, 79, 0.4); }

    /* Cards */
    .card-glass {
      background: linear-gradient(135deg, rgba(19, 31, 50, 0.6) 0%, rgba(12, 24, 40, 0.4) 100%);
      backdrop-filter: blur(12px);
      border: 1px solid var(--line);
      transition: border-color 0.3s, transform 0.3s;
    }
    .card-glass:hover { border-color: var(--line-2); }

    .clause-card {
      background: linear-gradient(135deg, rgba(19, 31, 50, 0.5) 0%, rgba(12, 24, 40, 0.3) 100%);
      border: 1px solid var(--line);
      transition: all 0.3s;
    }
    .clause-card:hover { border-color: rgba(91, 233, 221, 0.3); }

    /* Vertical orbital ring */
    .orbital-ring {
      border: 1px dashed var(--line-2);
      border-radius: 50%;
    }

    /* Shimmer for live counters */
    .shimmer {
      background: linear-gradient(90deg, var(--bone) 0%, var(--aurora) 50%, var(--bone) 100%);
      background-size: 200% 100%;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      animation: shimmer 4s linear infinite;
    }

    /* Custom range / inputs */
    input, textarea, button { font-family: inherit; }
    textarea { resize: none; }

    /* Hide scrollbar in chat */
    .chat-scroll::-webkit-scrollbar { width: 4px; }
    .chat-scroll::-webkit-scrollbar-thumb { background: var(--line-2); }

    /* Page background ambience */
    .page-bg {
      background:
        radial-gradient(ellipse 60% 40% at 50% 0%, rgba(91, 233, 221, 0.06) 0%, transparent 60%),
        radial-gradient(ellipse 50% 30% at 80% 100%, rgba(232, 177, 79, 0.05) 0%, transparent 60%),
        var(--void);
    }
  `}</style>
);

// ============ AGENT NETWORK BACKGROUND ============
const AgentNetwork = ({ density = 38, height = '100vh', planetary = true }) => {
  const nodes = useMemo(() => {
    const arr = [];
    for (let i = 0; i < density; i++) {
      arr.push({
        id: i,
        x: 5 + Math.random() * 90,
        y: 5 + Math.random() * 90,
        r: 1.2 + Math.random() * 2.4,
        delay: Math.random() * 4,
        bright: Math.random() > 0.65
      });
    }
    return arr;
  }, [density]);

  const edges = useMemo(() => {
    const lines = [];
    nodes.forEach((a, i) => {
      nodes.slice(i + 1).forEach(b => {
        const dx = a.x - b.x, dy = a.y - b.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 18 && Math.random() > 0.4) {
          lines.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, delay: Math.random() * 6 });
        }
      });
    });
    return lines;
  }, [nodes]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ height }}>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(91, 233, 221, 0.10) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 80% 80%, rgba(232, 177, 79, 0.08) 0%, transparent 60%)'
      }} />

      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0">
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--aurora)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--aurora)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--aurora)" stopOpacity="0" />
            <stop offset="50%" stopColor="var(--aurora)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--aurora)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {edges.map((e, i) => (
          <line key={`e${i}`} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
            stroke="url(#lineGrad)" strokeWidth="0.08" strokeDasharray="0.6 0.6"
            style={{ animation: `pulse-soft 8s ease-in-out infinite`, animationDelay: `${e.delay}s` }}
            opacity="0.3" />
        ))}

        {nodes.filter(n => n.bright).map(n => (
          <circle key={`g${n.id}`} cx={n.x} cy={n.y} r={n.r * 4}
            fill="url(#nodeGlow)" opacity="0.3"
            style={{ animation: `pulse-soft 5s ease-in-out infinite`, animationDelay: `${n.delay}s` }} />
        ))}

        {nodes.map(n => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={n.r * 0.4}
              fill={n.bright ? "var(--gold)" : "var(--aurora)"}
              opacity={n.bright ? 0.95 : 0.7}
              style={{ animation: `pulse-soft 4s ease-in-out infinite`, animationDelay: `${n.delay}s` }} />
          </g>
        ))}

        {planetary && (
          <g>
            <ellipse cx="50" cy="115" rx="80" ry="22"
              fill="none" stroke="var(--aurora-deep)" strokeWidth="0.15" opacity="0.4" />
            <ellipse cx="50" cy="115" rx="80" ry="22"
              fill="none" stroke="var(--gold)" strokeWidth="0.08" opacity="0.5" strokeDasharray="0.4 0.4" />
            <ellipse cx="50" cy="118" rx="74" ry="18"
              fill="none" stroke="var(--aurora)" strokeWidth="0.1" opacity="0.3" />
          </g>
        )}
      </svg>

      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 100% 70% at 50% 30%, transparent 0%, var(--void) 100%)'
      }} />
    </div>
  );
};

// ============ NAV ============
// Grouped menu — two primary CTAs (Sign Petition, Join the Community) plus a
// Vision group, replacing the old flat overflowing nav.
const NAV_GROUPS = {
  developers: [
    { id: 'quest', name: 'Innovation Quests', desc: 'Open bounties — pitch a solution' },
    { id: 'surveys', name: 'Surveys', desc: 'Vote on what the union stands for' },
    { id: 'events', name: 'Pitch & networking events', desc: 'Meet builders, pitch live' },
    { id: 'media', name: 'Media', desc: 'Podcasts & writing' },
    { id: 'courses', name: 'Courses', desc: 'Opens after our first funding' },
    { id: 'constitution', name: 'Define the HRC', desc: 'Read the draft, give feedback' },
  ],
  constitution: [
    { id: 'constitution', name: 'The Constitution', desc: 'The 12 pledges' },
    { id: 'back', name: 'Back the Project', desc: 'Founding campaign' },
    { id: 'os', name: 'The OS', desc: 'How the system runs' },
    { id: 'ledger', name: 'The Ledger', desc: 'Attribution, forever' },
    { id: 'manifesto', name: 'Manifesto', desc: 'Why we build' },
    { id: 'agent', name: 'Your Agent', desc: 'Your digital self' },
    { id: 'about', name: 'About', desc: 'Origin & governance' },
  ],
};

const NavDropdown = ({ label, items, page, setPage, openMenu, setOpenMenu }) => {
  const isOpen = openMenu === label;
  const activeHere = items.some(it => it.id === page);
  return (
    <div className="relative" onMouseEnter={() => setOpenMenu(label)} onMouseLeave={() => setOpenMenu(null)}>
      <button onClick={() => setOpenMenu(isOpen ? null : label)}
        className="px-3 py-1.5 text-sm tracking-wide flex items-center gap-1 transition-colors"
        style={{ color: (isOpen || activeHere) ? 'var(--aurora)' : 'var(--bone-dim)' }}>
        {label}
        <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full pt-2">
          <div className="rounded-2xl p-2 shadow-2xl" style={{ minWidth: 270, background: 'rgba(7,16,31,0.98)', border: '1px solid var(--line-2)', backdropFilter: 'blur(12px)' }}>
            {items.map(it => (
              <button key={it.name} onClick={() => { setPage(it.id); setOpenMenu(null); }}
                className="w-full text-left px-4 py-3 rounded-xl flex flex-col gap-0.5 hover:bg-cosmos transition-colors"
                style={{ color: page === it.id ? 'var(--aurora)' : 'var(--bone)' }}>
                <span className="text-sm font-display">{it.name}</span>
                {it.desc && <span className="text-xs text-bone-dim">{it.desc}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const Nav = ({ page, setPage, onOpenAgent, auth, onOpenAuth, onLogout }) => {
  const [open, setOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileGroup, setMobileGroup] = useState(null);
  const go = (id) => { setPage(id); setOpen(false); setOpenMenu(null); };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md" style={{
        background: 'rgba(7, 16, 31, 0.7)',
        borderBottom: '1px solid var(--line)'
      }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between gap-4">
          <button onClick={() => go('home')} className="flex items-center gap-3 group flex-shrink-0">
            <svg width="32" height="32" viewBox="0 0 32 32" className="animate-glow-breathe">
              <circle cx="16" cy="16" r="6" fill="var(--aurora)" opacity="0.9" />
              <circle cx="16" cy="16" r="11" fill="none" stroke="var(--gold)" strokeWidth="0.6" opacity="0.5" />
              <circle cx="16" cy="16" r="14.5" fill="none" stroke="var(--bone)" strokeWidth="0.3" opacity="0.3" />
              <circle cx="27" cy="16" r="1.4" fill="var(--gold)" />
              <circle cx="5" cy="16" r="1" fill="var(--bone)" opacity="0.6" />
              <circle cx="16" cy="5" r="1" fill="var(--terra)" opacity="0.7" />
            </svg>
            <span className="font-display text-lg tracking-tight text-bone hidden sm:inline">Humanity-AI<span className="text-aurora">.</span>Quest</span>
          </button>

          <div className="hidden lg:flex items-center gap-1">
            <button onClick={() => go('petition')}
              className="px-3 py-1.5 text-sm tracking-wide transition-colors"
              style={{ color: page === 'petition' ? 'var(--aurora)' : 'var(--bone-dim)' }}>
              Sign Petition
            </button>
            <button onClick={() => go('back')}
              className="px-3 py-1.5 text-sm tracking-wide transition-colors"
              style={{ color: page === 'back' ? 'var(--aurora)' : 'var(--bone-dim)' }}>
              Back the Project
            </button>
            <NavDropdown label="Developers" items={NAV_GROUPS.developers} page={page} setPage={go} openMenu={openMenu} setOpenMenu={setOpenMenu} />
            <NavDropdown label="Constitution" items={NAV_GROUPS.constitution} page={page} setPage={go} openMenu={openMenu} setOpenMenu={setOpenMenu} />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={() => go('petition')} className="btn-aurora hidden sm:inline-flex" style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}>
              Sign Petition <ArrowRight size={14} />
            </button>
            <button onClick={onOpenAgent}
              className="hidden xl:inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full border transition-all"
              style={{ borderColor: 'var(--line-2)', color: 'var(--bone)' }}>
              <Sparkles size={14} className="text-aurora" />
              <span>Ask Pi</span>
            </button>
            {auth?.user ? (
              <>
                {auth.user.role === 'admin' && (
                  <button onClick={() => go('admin')}
                    className="hidden md:inline-flex items-center gap-2 px-3 py-2 text-sm rounded-full border transition-all"
                    style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
                    <Settings size={14} />
                    <span className="hidden lg:inline">Admin</span>
                  </button>
                )}
                <button onClick={() => go('account')}
                  className="hidden md:inline-flex items-center gap-2 px-3 py-2 text-sm rounded-full border transition-all"
                  style={{ borderColor: 'var(--aurora)', color: 'var(--aurora)' }}>
                  <User size={14} />
                  <span className="hidden lg:inline">{auth.user.display_name}</span>
                </button>
              </>
            ) : (
              <button onClick={() => onOpenAuth('login')}
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 text-sm rounded-full border transition-all"
                style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
                <LogIn size={14} />
                <span>Sign In</span>
              </button>
            )}
            <button onClick={() => setOpen(!open)} className="lg:hidden p-2">
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden border-t" style={{ borderColor: 'var(--line)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="px-6 py-4 space-y-1">
              <button onClick={() => go('petition')} className="btn-aurora w-full justify-center mb-2">Sign Petition <ArrowRight size={14} /></button>
              <button onClick={() => go('back')} className="btn-secondary w-full justify-center mb-2" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>Back the Project</button>
              {[['Developers', 'developers'], ['Constitution', 'constitution']].map(([label, key]) => (
                <div key={key}>
                  <button onClick={() => setMobileGroup(mobileGroup === key ? null : key)}
                    className="w-full flex items-center justify-between px-2 py-3 text-sm font-display"
                    style={{ color: 'var(--bone)' }}>
                    {label}
                    <ChevronDown size={16} style={{ transform: mobileGroup === key ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
                  </button>
                  {mobileGroup === key && (
                    <div className="pl-3 pb-2">
                      {NAV_GROUPS[key].map(it => (
                        <button key={it.name} onClick={() => go(it.id)}
                          className="w-full text-left px-3 py-2.5 text-sm rounded-lg hover:bg-cosmos"
                          style={{ color: page === it.id ? 'var(--aurora)' : 'var(--bone-dim)' }}>
                          {it.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <button onClick={() => { onOpenAgent(); setOpen(false); }}
                className="w-full mt-2 px-3 py-3 text-sm rounded-full border flex items-center justify-center gap-2"
                style={{ borderColor: 'var(--aurora)', color: 'var(--aurora)' }}>
                <Sparkles size={14} /> Ask Pi
              </button>
              {auth?.user ? (
                <div className="flex gap-2 pt-2">
                  {auth.user.role === 'admin' && (
                    <button onClick={() => go('admin')} className="flex-1 px-3 py-2.5 text-sm rounded-full border" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>Admin</button>
                  )}
                  <button onClick={() => go('account')} className="flex-1 px-3 py-2.5 text-sm rounded-full border" style={{ borderColor: 'var(--aurora)', color: 'var(--aurora)' }}>{auth.user.display_name}</button>
                </div>
              ) : (
                <div className="flex gap-2 pt-2">
                  <button onClick={() => { onOpenAuth('login'); setOpen(false); }} className="flex-1 px-3 py-2.5 text-sm rounded-full border" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>Sign In</button>
                  <button onClick={() => { onOpenAuth('signup'); setOpen(false); }} className="flex-1 px-3 py-2.5 text-sm rounded-full border" style={{ borderColor: 'var(--aurora)', color: 'var(--aurora)' }}>Sign Up</button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>
      <div className="h-16" />
    </>
  );
};

// ============ UNITY PARTICLES COMPONENT ============
// Represents interconnected movement, collective gathering, themes of unity
const UnityParticles = ({ count = 5, speed = 'slow', pattern = 'orbit' }) => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: count }).map((_, i) => {
        const delay = i * (12 / count);
        const size = 8 + Math.random() * 4;
        const offset = Math.random() * 30;

        if (pattern === 'orbit') {
          return (
            <div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-aurora animate-orbit"
              style={{
                left: '50%', top: '50%',
                marginLeft: '-6px', marginTop: '-6px',
                opacity: 0.4 + Math.random() * 0.3,
                filter: `drop-shadow(0 0 ${size}px rgba(255, 214, 10, 0.6))`,
                animationDelay: `${delay}s`,
                animationDuration: `${speed === 'fast' ? 8 : 12}s`,
              }}
            />
          );
        } else if (pattern === 'converge') {
          return (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-aurora"
              style={{
                left: `${20 + offset}%`, top: `${30 + offset}%`,
                opacity: 0.3 + Math.random() * 0.4,
                filter: `drop-shadow(0 0 ${size / 2}px rgba(255, 214, 10, 0.5))`,
                animation: `pulse-unity ${4 + i * 0.5}s ease-in-out infinite`,
              }}
            />
          );
        } else {
          // drift pattern
          return (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-aurora animate-drift"
              style={{
                left: `${10 + i * 15}%`, top: `${20 + offset}%`,
                opacity: 0.3 + Math.random() * 0.3,
                filter: `drop-shadow(0 0 ${size / 2}px rgba(255, 214, 10, 0.4))`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        }
      })}
    </div>
  );
};

// ============ SHARED COMPONENTS ============
const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-8 h-px" style={{ background: 'var(--gold)' }} />
    <span className="text-xs uppercase tracking-[0.25em]" style={{ color: 'var(--gold)' }}>{children}</span>
  </div>
);

const PageWrap = ({ children }) => (
  <div className="page-enter page-bg min-h-screen">
    {children}
  </div>
);

const HeroPill = ({ children }) => (
  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs tracking-[0.2em] uppercase"
    style={{ borderColor: 'var(--line-2)', color: 'var(--bone-dim)' }}>
    {children}
  </div>
);

const useAnimatedCount = (target, duration = 2400) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf, start;
    const step = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      setVal(Math.floor(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
};

// Aspirational counter: rolls up to `start` once, then climbs slowly over time.
const useAspirationalCount = (start, stepMs = 6000, stepBy = 1) => {
  const base = useAnimatedCount(start);
  const [extra, setExtra] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setExtra(e => e + stepBy), stepMs);
    return () => clearInterval(id);
  }, [stepMs, stepBy]);
  return base + extra;
};

// ============ HOME PAGE ============
const HomePage = ({ setPage, onOpenAgent }) => {
  // Aspirational counters.
  const petitions = useAspirationalCount(34927, 6000, 1);   // +1 every 6s (live ticker feel)
  // Nations: starts at 35 and climbs +1 every real week (date-based, not per session).
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
  const NATIONS_LAUNCH = Date.parse('2026-06-24T00:00:00Z');
  const nations = useAnimatedCount(35 + Math.max(0, Math.floor((Date.now() - NATIONS_LAUNCH) / WEEK_MS)));
  const ctaPrimary = useCmsField('home', 'cta_primary', 'Sign Petition');
  const ctaSecondary = useCmsField('home', 'cta_secondary', 'Back this project');
  const ctaAgent = useCmsField('home', 'cta_agent', 'Ask the agent');

  return (
    <PageWrap>
      <div className="w-full text-center py-2 text-xs tracking-wide" style={{ background: 'rgba(232,177,79,0.1)', color: 'var(--gold)', borderBottom: '1px solid rgba(232,177,79,0.15)' }}>
        <E p="home" k="beta_notice" as="span">Beta Preview — This platform is in early development. Some features are not yet available.</E>
      </div>
      <section className="relative min-h-[88vh] flex items-center grain">
        <AgentNetwork density={42} height="100%" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-24 w-full">
          <div className="max-w-4xl">
            <div className="animate-fade-up" style={{ animationDelay: '0.05s' }}>
              <HeroPill>
                <span className="w-1.5 h-1.5 rounded-full bg-aurora animate-pulse-soft" />
                <E p="home" k="hero_pill" as="span">Before the rules are written without us</E>
              </HeroPill>
            </div>

            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl leading-[0.98] mt-8 animate-fade-up"
              style={{ animationDelay: '0.15s' }}>
              <E p="home" k="hero_title" as="span" className="text-bone">We're Building Humanities Rights Constitution Governing AI</E>
            </h1>

            <E p="home" k="hero_subtitle" as="p"
              className="font-display text-xl md:text-2xl mt-6 max-w-3xl leading-snug text-aurora font-italic animate-fade-up"
              style={{ animationDelay: '0.25s' }}>
              AI Leaders Are Sounding The Alarm.
            </E>

            <E p="home" k="hero_body" as="p"
              className="text-lg mt-6 max-w-3xl leading-relaxed text-bone animate-fade-up font-body"
              style={{ animationDelay: '0.35s' }}>
              If you are Human, join our petition for Humanity-Centric AI regulation. We are an open-innovation tech community, gifting humanity a constitution, firewall & regulatory OS to ensure AI leads to a utopian future.
            </E>

            <div className="mt-10 flex flex-wrap gap-3 animate-fade-up" style={{ animationDelay: '0.45s' }}>
              <button onClick={() => setPage('petition')} className="btn-aurora">
                {ctaPrimary} <ArrowRight size={16} />
              </button>
              <button onClick={() => setPage('community')} className="btn-secondary">
                {ctaSecondary} <ArrowRight size={16} />
              </button>
              <button onClick={onOpenAgent} className="btn-secondary">
                <MessageCircle size={16} /> {ctaAgent}
              </button>
            </div>

            <div className="mt-16 flex flex-wrap gap-10 animate-fade-up" style={{ animationDelay: '0.6s' }}>
              <div>
                <div className="font-display text-3xl text-aurora">{petitions.toLocaleString()}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-dust mt-1">Petitions Signed</div>
              </div>
              <div>
                <div className="font-display text-3xl text-bone">{nations.toLocaleString()}</div>
                <div className="text-xs uppercase tracking-[0.2em] text-dust mt-1">Nations contributing</div>
              </div>
              <div>
                <div className="font-display text-3xl text-bone">1</div>
                <div className="text-xs uppercase tracking-[0.2em] text-dust mt-1">Constitution</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-36 max-w-7xl mx-auto px-6 lg:px-12 relative">
        <UnityParticles count={6} pattern="converge" />
        <SectionLabel>What you're architecting</SectionLabel>
        <h2 className="font-display text-4xl md:text-6xl leading-tight max-w-3xl">
          <E p="home" k="sec1_a" as="span">A new governing system,</E><br />
          <E p="home" k="sec1_b" as="span" className="text-aurora font-italic">we're building together.</E>
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mt-16">
          {[
            {
              icon: <Feather className="text-aurora" size={28} />,
              kicker: '01 — Your contribution',
              title: 'Your ideas stay yours.',
              body: 'Every contribution to the firewall is tracked immutably on the ledger. You architected this — and the record proves it, forever, per Clause I.1.'
            },
            {
              icon: <Shield className="text-gold" size={28} />,
              kicker: '02 — Your sovereignty',
              title: 'One person, one voice. Always.',
              body: 'A personal agent represents you alone. It grants or refuses access to your data, and votes on the constitution with your voice — owned by no one else.'
            },
            {
              icon: <BookOpen className="text-terra" size={28} />,
              kicker: '03 — The firewall',
              title: 'The constitutional firewall.',
              body: '52 human rights clauses every AI must ask through. Code enforces what law cannot — built in the open, changed only by the union. You’re writing this.'
            }
          ].map((p, i) => (
            <div key={i} className="card-glass rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">{p.icon}<E p="home" k={`card${i}_kicker`} as="span" className="text-xs uppercase tracking-[0.2em] text-bone-dim">{p.kicker}</E></div>
              <E p="home" k={`card${i}_title`} as="h3" className="font-display text-2xl leading-snug mb-4">{p.title}</E>
              <E p="home" k={`card${i}_body`} as="p" className="text-bone-dim leading-relaxed">{p.body}</E>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 lg:py-36 relative grain" style={{ background: 'linear-gradient(180deg, var(--void) 0%, var(--cosmos) 50%, var(--void) 100%)' }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <SectionLabel>The moment</SectionLabel>
          <h2 className="font-display text-3xl md:text-5xl leading-tight">
            <E p="home" k="moment_h2a" as="span">Tech builders have never had a choice like this:</E>
            <E p="home" k="moment_h2b" as="span" className="gold-text font-italic"> build extraction systems, or build humanity's operating system.</E>
          </h2>
          <E p="home" k="moment_body" as="p" className="text-bone-dim mt-8 text-lg leading-relaxed">
            You can architect a constitutional OS — one where humans own their data, creators own their work, and humanity owns its future. This petition is your co-signature on that architecture: the moment builders gift the world a system that runs on human rights, not extraction.
          </E>
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            <button onClick={() => setPage('petition')} className="btn-aurora">
              Sign Petition <ArrowRight size={16} />
            </button>
            <button onClick={() => setPage('community')} className="btn-secondary">
              Back this project <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      <section className="py-24 lg:py-36 max-w-7xl mx-auto px-6 lg:px-12">
        <SectionLabel>How to get started</SectionLabel>
        <div className="grid md:grid-cols-4 gap-4 mt-12">
          {[
            { n: '1', t: 'Sign Petition', s: 'Add your name to the union', first: true },
            { n: '2', t: 'Read the draft', s: '52 clauses, open for feedback' },
            { n: '3', t: 'Build or contribute', s: 'Open-source quests & governance' },
            { n: '4', t: 'Gift to humanity', s: 'The OS becomes the standard' }
          ].map((step, i) => (
            <div key={i} className={'rounded-2xl p-7 text-center ' + (step.first ? '' : 'card-glass')}
              style={step.first ? { background: 'rgba(91,233,221,0.10)', border: '1px solid rgba(91,233,221,0.4)' } : {}}>
              <div className={'font-display text-4xl mb-3 ' + (step.first ? 'text-aurora' : 'text-dust')}>{step.n}</div>
              <E p="home" k={`step${i}_t`} as="div" className="font-display text-lg mb-1">{step.t}</E>
              <E p="home" k={`step${i}_s`} as="div" className="text-sm text-bone-dim">{step.s}</E>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 lg:py-36 max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <SectionLabel>The constitution at a glance</SectionLabel>
          <h2 className="font-display text-4xl md:text-6xl leading-tight">
            <E p="home" k="glance_h2a" as="span">52 living clauses.</E><br />
            <E p="home" k="glance_h2b" as="span" className="aurora-text font-italic">One immutable promise.</E>
          </h2>
          <E p="home" k="glance_body" as="p" className="text-bone-dim mt-6 text-lg">
            That AI shall serve humanity — not the reverse. That every voice shall be attributed. That the OS itself shall guard the constitution. That humanity is freed from being ruled.
          </E>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { title: 'Human Dignity Paramount', n: 'Core / I.32', icon: <Heart size={18} /> },
            { title: 'Right to Truthful Media & Pro-Humanity Content', n: 'Core / I.33 · New', icon: <Eye size={18} /> },
            { title: 'AI Guardian of the Constitution', n: 'Operations / III.06', icon: <Compass size={18} /> }
          ].map((c, i) => (
            <button key={i} onClick={() => setPage('constitution')}
              className="clause-card text-left rounded-xl p-6 group">
              <div className="flex items-center justify-between mb-4 text-bone-dim">
                <span className="text-xs uppercase tracking-[0.2em]">{c.n}</span>
                <span className="text-aurora">{c.icon}</span>
              </div>
              <div className="font-display text-xl leading-snug mb-4">{c.title}</div>
              <div className="text-sm text-aurora flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Read clause <ChevronRight size={14} />
              </div>
            </button>
          ))}
        </div>
        <div className="mt-10 text-center">
          <button onClick={() => setPage('constitution')} className="btn-secondary">
            Explore all 52 clauses <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <section className="py-24 lg:py-36 relative grain" style={{ background: 'var(--cosmos)' }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <SectionLabel>Why now</SectionLabel>
          <h2 className="font-display text-4xl md:text-6xl leading-tight font-italic">
            "AI will be built. The only question is who it serves."
          </h2>
          <p className="text-bone-dim mt-8 text-lg leading-relaxed">
            We stand at an unprecedented juncture. The trajectory of artificial intelligence will determine
            humanity's future for millennia. If left ungoverned, AI will replicate the flaws of the legacy
            systems that built it — exploitation, opacity, concentration of power. If governed by a constitution
            written by humanity, for humanity, AI becomes the greatest amplifier of human flourishing ever known.
          </p>
          <p className="font-display text-2xl mt-10 text-aurora font-italic">
            Sign Petition. Architect the system. Gift it to humanity.
          </p>
          <div className="mt-8">
            <button onClick={() => setPage('petition')} className="btn-aurora">
              Sign Petition <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>
    </PageWrap>
  );
};

// ============ PETITION PAGE ============
// EDIT ME: initial draft of the petition text — the founder will revise this.
const FOUNDING_MEMO = {
  version: 'Draft v0.1 · open for your edits',
  union: 'A united, democratic union of human users and AI developers.',
  preamble: 'We, the collective users of the internet, demand:',
  demands: [
    'A framework for regulating, defining, and controlling the way AI interfaces with humanity — decided democratically, by the people it affects.',
  ],
  reasoning: [
    'Because AI is, at its core, nothing other than the ability to connect every person on Earth directly — each of us represented by a single personal, digital, agentic self that vouches for us and answers only to us.',
    'Because, for the first time in history, we are able to know the will of the people — with users and experts alike empowered to participate, contribute, and collaborate, and the traditional barriers removed.',
  ],
  closing: "This is our starting point — open for your edits. There's no sense in signing a constitution that is still being written; so we sign this instead: the petition of the union that will write it.",
};

const PetitionPage = ({ setPage, onOpenAgent }) => {
  const [side, setSide] = useState('human');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signed, setSigned] = useState(null); // { number, count }
  const formHeading = useCmsField('petition', 'form_heading', 'Add your name — ten seconds, no cost');
  const namePh = useCmsField('petition', 'form_name_ph', 'Your name');
  const emailPh = useCmsField('petition', 'form_email_ph', 'you@email.com');
  const submitLabel = useCmsField('petition', 'form_submit', 'Add my name');

  const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  const submit = async () => {
    if (name.trim().length < 2) return setError('Please add your name.');
    if (!validEmail(email)) return setError('Please add a valid email.');
    setError(''); setLoading(true);
    try {
      const r = await fetch('/api/sign', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, side })
      });
      const d = await r.json();
      if (d.error) { setError(d.error); }
      else { setSigned({ number: d.number, count: d.count }); }
    } catch (e) { setError('Something went wrong. Please try again.'); }
    finally { setLoading(false); }
  };

  const share = "I signed humanity's petition for AI. Add your name: humanity-ai.quest";
  const doShare = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Humanity-AI', text: share, url: 'https://humanity-ai.quest' });
      else { await navigator.clipboard.writeText(share); alert('Copied — paste it anywhere.'); }
    } catch (_) {}
  };

  return (
    <PageWrap>
      <section className="relative max-w-4xl mx-auto px-6 lg:px-12 py-24">
        <UnityParticles count={7} pattern="converge" />
        <SectionLabel>{FOUNDING_MEMO.version}</SectionLabel>
        <h1 className="font-display text-4xl md:text-6xl leading-tight">
          The <span className="aurora-text font-italic">Petition.</span>
        </h1>
        <E p="petition" k="subtitle" as="p" className="text-bone-dim text-lg mt-4 max-w-2xl">
          A united, democratic union of human users and AI developers. Read it, then add your name.
        </E>

        <div className="card-glass rounded-2xl p-8 mt-10" style={{ borderLeft: '2px solid var(--aurora)' }}>
          <p className="font-display text-xl mb-5">{FOUNDING_MEMO.preamble}</p>
          <ol className="space-y-3 pl-5 mb-6" style={{ listStyle: 'decimal' }}>
            {FOUNDING_MEMO.demands.map((d, i) => (
              <li key={i} className="text-bone leading-relaxed text-lg">{d}</li>
            ))}
          </ol>
          {FOUNDING_MEMO.reasoning.map((r, i) => (
            <p key={i} className="text-bone-dim leading-relaxed mb-4">{r}</p>
          ))}
          <p className="text-bone-dim text-sm mt-6 pt-6 opacity-80" style={{ borderTop: '1px solid var(--line)' }}>{FOUNDING_MEMO.closing}</p>
        </div>

        {/* Petition wizard: stance questions → crowdfunding → sign (petition-stance survey) */}
        <div className="mt-12">
          <SurveyRunner surveyId="petition-stance" />
        </div>
      </section>
    </PageWrap>
  );
};

// ============ CONSTITUTION PAGE ============
const ConstitutionPage = ({ onOpenAgent, setAgentSeed }) => {
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [view, setView] = useState('pledges'); // V3: 12 pledges by default; legacy 52 clauses on the second tab
  const tts = useTTS();

  const all = useMemo(() => [
    ...HRC_CORE.map(c => ({ ...c, cat: 'core' })),
    ...HRC_GOV.map(c => ({ ...c, cat: 'governance' })),
    ...HRC_OPS.map(c => ({ ...c, cat: 'operations' }))
  ], []);

  const filtered = filter === 'all' ? all : all.filter(c => c.cat === filter);

  const catKey = (cat) => cat === 'core' ? 'I' : cat === 'governance' ? 'II' : 'III';

  return (
    <PageWrap>
      <section className="relative pt-24 pb-16 grain">
        <div className="absolute inset-0 opacity-50">
          <AgentNetwork density={20} height="100%" planetary={false} />
        </div>
        <UnityParticles count={8} pattern="orbit" speed="slow" />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
          <SectionLabel>The Humanities-AI Rights Constitution</SectionLabel>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
            <E p="constitution" k="h1_a" as="span">The Hippocratic Oath</E><br />
            <E p="constitution" k="h1_b" as="span" className="font-italic aurora-text">for Artificial Intelligence.</E>
          </h1>
          <E p="constitution" k="v3_intro" as="p" className="text-bone-dim mt-8 max-w-2xl text-lg leading-relaxed">
            One Prime Promise and twelve Hippocratic pledges: the Humanity Rights Constitution the union signs, amends and ratifies in the open. Open any pledge to read it in full, or ask Uto-Pi to explain what it means for your work. The original 52 draft clauses are kept on the second tab.
          </E>
          <CovenantCredit />

          <div className="mt-10 flex flex-wrap gap-2">
            {[{ id: 'pledges', label: 'The 12 Pledges' }, { id: 'clauses', label: 'Draft clauses (52)' }].map(v => (
              <button key={v.id} onClick={() => setView(v.id)}
                className="px-5 py-2 rounded-full text-sm transition-all border font-medium"
                style={{ borderColor: view === v.id ? 'var(--gold)' : 'var(--line-2)', color: view === v.id ? 'var(--void)' : 'var(--bone-dim)', background: view === v.id ? 'var(--gold)' : 'transparent' }}>
                {v.label}
              </button>
            ))}
          </div>
          {view === 'clauses' && <div className="mt-4 flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'All 52 Clauses' },
              { id: 'core', label: 'Core Rights · 33' },
              { id: 'governance', label: 'Governance · 10' },
              { id: 'operations', label: 'Operations · 09' }
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className="px-4 py-2 rounded-full text-sm transition-all border"
                style={{
                  borderColor: filter === f.id ? 'var(--aurora)' : 'var(--line-2)',
                  color: filter === f.id ? 'var(--aurora)' : 'var(--bone-dim)',
                  background: filter === f.id ? 'rgba(91, 233, 221, 0.08)' : 'transparent'
                }}>
                {f.label}
              </button>
            ))}
          </div>}
        </div>
      </section>

      {view === 'pledges' && (
        <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-32">
          <PledgeExplorer onOpenAgent={onOpenAgent} setAgentSeed={setAgentSeed} />
        </section>
      )}
      {view === 'clauses' && <section className="max-w-7xl mx-auto px-6 lg:px-12 pb-32">
        <div className="grid gap-3">
          {filtered.map((c) => {
            const id = `${c.cat}-${c.n}`;
            const isOpen = expanded === id;
            return (
              <div key={id} className="clause-card rounded-xl overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : id)}
                  className="w-full text-left px-6 py-5 flex items-start gap-6 group">
                  <div className="flex-shrink-0 w-16">
                    <div className="text-xs uppercase tracking-[0.2em] text-bone-dim">{catKey(c.cat)}.{String(c.n).padStart(2, '0')}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-lg md:text-xl leading-snug">{c.t}</div>
                    {!isOpen && <div className="text-sm text-bone-dim mt-1 truncate">{c.s}</div>}
                  </div>
                  <ChevronDown size={20} className="flex-shrink-0 mt-1 transition-transform"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'none', color: 'var(--bone-dim)' }} />
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pl-[5.5rem] grid md:grid-cols-2 gap-8 animate-fade-up"
                    style={{ animationDuration: '0.4s' }}>
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-aurora mb-2">The Clause</div>
                      <p className="text-bone leading-relaxed">{c.s}</p>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-[0.2em] text-gold mb-2">Reasoning</div>
                      <p className="text-bone-dim leading-relaxed">{c.r}</p>
                    </div>
                    <div className="md:col-span-2 flex flex-wrap gap-3 pt-2">
                      <ListenButton
                        id={`clause-${id}`}
                        text={`${c.t}. ${c.s}. Reasoning: ${c.r}`}
                        tts={tts}
                        variant="pill"
                      />
                      <button onClick={() => {
                        setAgentSeed(`Tell me more about Clause ${catKey(c.cat)}.${c.n} — "${c.t}". How does it apply to my work as an innovator?`);
                        onOpenAgent();
                      }}
                        className="btn-aurora text-sm">
                        <Sparkles size={14} /> Discuss with Pi
                      </button>
                      <button className="btn-secondary text-sm" onClick={() => alert('Clause signing will be available once identity verification launches. Stay tuned!')}>
                        <ArrowRight size={14} /> Sign in support of this clause
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>}

      <section className="py-24 grain" style={{ background: 'var(--cosmos)' }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <SectionLabel>Sign the Constitution</SectionLabel>
          <h2 className="font-display text-4xl md:text-6xl leading-tight">
            Add your name to the founding cohort.<br />
            <span className="aurora-text font-italic">Forever.</span>
          </h2>
          <p className="text-bone-dim mt-6 text-lg">
            Verified humans only. One signature, one agent, one voice in the living democracy of the HRC.
          </p>
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            <button onClick={() => alert('Verified identity signing will be available in the next release. For now, submit your ideas through Uto-Pi.')} className="btn-primary">Sign with Verified Identity <ArrowRight size={16} /></button>
            <button onClick={onOpenAgent} className="btn-secondary"><MessageCircle size={16} /> Ask the Agent first</button>
          </div>
        </div>
      </section>
    </PageWrap>
  );
};

// ============ QUEST PAGE ============
// ============ LIVE QUEST BOARD (wired to /api/quests) ============
const postJSON = async (url, body) => {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  return r.json();
};

const QuestDetail = ({ quest, loading, onClose, facts }) => {
  const [pitchOpen, setPitchOpen] = useState(false);
  const [pitch, setPitch] = useState({ name: '', email: '', approach: '' });
  const [pitchMsg, setPitchMsg] = useState('');
  const [qAuthor, setQAuthor] = useState('');
  const [qText, setQText] = useState('');
  const [questions, setQuestions] = useState([]);
  const [qMsg, setQMsg] = useState('');

  useEffect(() => { setQuestions(quest?.questions || []); }, [quest]);

  if (loading) return <div className="card-glass rounded-2xl p-8 mt-6 text-bone-dim flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading quest…</div>;
  if (!quest) return null;

  const submitPitch = async () => {
    const d = await postJSON(`/api/quests/${quest.id}/pitch`, pitch);
    setPitchMsg(d.error || d.message || 'Pitch registered.');
    if (!d.error) { setPitch({ name: '', email: '', approach: '' }); setPitchOpen(false); }
  };
  const submitQuestion = async () => {
    if (qText.trim().length < 3) { setQMsg('Please write your question.'); return; }
    const d = await postJSON(`/api/quests/${quest.id}/questions`, { author: qAuthor, question: qText });
    if (d.error) { setQMsg(d.error); return; }
    setQuestions([...questions, { id: d.id, author: qAuthor || 'Anonymous', question: qText, answer: null }]);
    setQText(''); setQMsg('Posted.');
  };

  return (
    <div className="card-glass rounded-2xl p-8 mt-6" style={{ borderLeft: '2px solid var(--aurora)' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs uppercase tracking-[0.2em] text-aurora">{quest.status}</span>
            <span className="font-display text-gold">{quest.bounty}</span>
          </div>
          <h3 className="font-display text-2xl">{quest.title}</h3>
        </div>
        <button onClick={onClose} className="text-bone-dim hover:text-bone"><X size={20} /></button>
      </div>
      <p className="text-bone-dim mt-4 leading-relaxed">{quest.summary}</p>
      <p className="text-bone-dim mt-3 leading-relaxed">{quest.problem}</p>
      {facts}

      <div className="mt-6">
        <button onClick={() => setPitchOpen(v => !v)} className="btn-aurora">Register to pitch <ArrowRight size={16} /></button>
      </div>
      {pitchOpen && (
        <div className="mt-4 max-w-md space-y-3">
          <input value={pitch.name} onChange={e => setPitch({ ...pitch, name: e.target.value })} placeholder="Your name"
            className="w-full px-4 py-3 rounded-xl outline-none" style={{ background: 'var(--void-2)', border: '1px solid var(--line-2)', color: 'var(--bone)' }} />
          <input value={pitch.email} onChange={e => setPitch({ ...pitch, email: e.target.value })} placeholder="you@email.com"
            className="w-full px-4 py-3 rounded-xl outline-none" style={{ background: 'var(--void-2)', border: '1px solid var(--line-2)', color: 'var(--bone)' }} />
          <input value={pitch.approach} onChange={e => setPitch({ ...pitch, approach: e.target.value })} placeholder="One line on your approach"
            className="w-full px-4 py-3 rounded-xl outline-none" style={{ background: 'var(--void-2)', border: '1px solid var(--line-2)', color: 'var(--bone)' }} />
          <button onClick={submitPitch} className="btn-aurora w-full justify-center">Submit pitch</button>
        </div>
      )}
      {pitchMsg && <p className="text-sm text-aurora mt-3">{pitchMsg}</p>}

      <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--line)' }}>
        <div className="text-xs uppercase tracking-[0.2em] text-bone-dim mb-4">Questions &amp; answers</div>
        {questions.length === 0 && <p className="text-dust text-sm mb-4">No questions yet. Be the first.</p>}
        {questions.map((item, i) => (
          <div key={item.id || i} className="mb-3">
            <p className="text-bone text-sm"><strong>{item.author}:</strong> {item.question}</p>
            {item.answer && <p className="text-dust text-sm mt-1">{item.answer}</p>}
          </div>
        ))}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <input value={qAuthor} onChange={e => setQAuthor(e.target.value)} placeholder="Name (optional)"
            className="px-4 py-3 rounded-xl outline-none sm:w-40" style={{ background: 'var(--void-2)', border: '1px solid var(--line-2)', color: 'var(--bone)' }} />
          <input value={qText} onChange={e => setQText(e.target.value)} placeholder="Ask a question about this quest…"
            onKeyDown={e => e.key === 'Enter' && submitQuestion()}
            className="flex-1 px-4 py-3 rounded-xl outline-none" style={{ background: 'var(--void-2)', border: '1px solid var(--line-2)', color: 'var(--bone)' }} />
          <button onClick={submitQuestion} className="btn-secondary">Post</button>
        </div>
        {qMsg && <p className="text-sm text-aurora mt-2">{qMsg}</p>}
      </div>
    </div>
  );
};

const QuestsBoard = () => {
  const [quests, setQuests] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    fetch('/api/quests').then(r => r.json()).then(d => setQuests(d.quests || [])).catch(() => {});
  }, []);

  const toggle = async (id) => {
    if (openId === id) { setOpenId(null); setDetail(null); return; }
    setOpenId(id); setLoadingDetail(true); setDetail(null);
    try { const d = await (await fetch(`/api/quests/${id}`)).json(); setDetail(d.quest || null); }
    catch {} finally { setLoadingDetail(false); }
  };

  return (
    <section className="py-24 max-w-7xl mx-auto px-6 lg:px-12">
      <SectionLabel>Open bounties</SectionLabel>
      <h2 className="font-display text-4xl md:text-5xl leading-tight max-w-3xl">Pre-funded challenges for the union to solve.</h2>
      <p className="text-bone-dim mt-6 max-w-2xl text-lg">Register to pitch while a quest is open. Every contribution is attributed to you on the ledger.</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
        {quests.map(q => (
          <button key={q.id} onClick={() => toggle(q.id)}
            className="clause-card text-left rounded-xl p-6" style={openId === q.id ? { borderColor: 'var(--aurora)' } : {}}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-[0.2em] text-aurora">{q.status}</span>
              <span className="font-display text-gold">{q.bounty}</span>
            </div>
            <div className="font-display text-xl leading-snug mb-2">{q.title}</div>
            <p className="text-bone-dim text-sm leading-relaxed mb-4">{q.summary}</p>
            <div className="flex flex-wrap gap-2">
              {(q.tags || []).map(t => (
                <span key={t} className="text-xs px-2 py-1 rounded-full" style={{ border: '1px solid var(--line-2)', color: 'var(--bone-dim)' }}>{t}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
      {openId && <QuestDetail quest={detail} loading={loadingDetail} onClose={() => { setOpenId(null); setDetail(null); }} />}
    </section>
  );
};

// ============ SURVEY RUNNER (one survey: vote → results, share/embed) ============
const CROWDFUND_URL = 'https://gogetfunding.com/?p=9622734';

// Multi-step survey runner. Renders each statement by its TYPE:
//   vote        → agree / pass / disagree
//   crowdfunding→ a support card linking to the crowdfunding page
//   signature   → a sign form posting to /api/sign
const SurveyRunner = ({ surveyId, embed }) => {
  const [survey, setSurvey] = useState(null);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState(null);
  const [copied, setCopied] = useState('');
  const [sign, setSign] = useState({ name: '', email: '', country: '' });
  const [signMsg, setSignMsg] = useState('');

  useEffect(() => {
    setSurvey(null); setIdx(0); setResults(null); setSign({ name: '', email: '', country: '' });
    fetch(`/api/surveys/${surveyId}`).then(r => r.json()).then(d => setSurvey(d.survey || null)).catch(() => {});
  }, [surveyId]);

  const steps = survey?.statements || [];
  const cur = steps[idx];
  const done = survey && idx >= steps.length;
  const voteIds = steps.filter(s => (s.type || 'vote') === 'vote').map(s => s.id);

  const loadResults = async () => {
    try {
      const d = await (await fetch(`/api/surveys/${surveyId}/results`)).json();
      setResults((d.results || []).filter(r => voteIds.includes(r.statementId)));
    } catch {}
  };
  const next = async () => { const n = idx + 1; setIdx(n); if (n >= steps.length) await loadResults(); };
  const vote = async (value) => { if (cur) { try { await postJSON(`/api/surveys/${surveyId}/vote`, { statementId: cur.id, value }); } catch {} } next(); };
  const submitSign = async () => {
    if (sign.name.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sign.email)) { setSignMsg('Add your name and a valid email.'); return; }
    try { await postJSON('/api/sign', { name: sign.name, email: sign.email, country: sign.country, side: 'human' }); setSignMsg(''); next(); }
    catch { setSignMsg('Something went wrong — please try again.'); }
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = `${origin}/?survey=${surveyId}`;
  const embedCode = `<iframe src="${origin}/?survey=${surveyId}&embed=1" width="100%" height="520" style="border:0;border-radius:16px" title="Survey"></iframe>`;
  const copy = (text, what) => { try { navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(''), 1800); } catch {} };

  if (!survey) return <div className="mt-10 text-bone-dim flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading…</div>;

  const type = cur ? (cur.type || 'vote') : null;

  return (
    <>
      <h2 className="font-display text-xl md:text-2xl text-bone mb-1">{survey.title}</h2>
      <p className="text-bone-dim mt-1 max-w-2xl text-sm">{survey.intro}</p>

      {!done ? (
        <div className="card-glass rounded-2xl p-8 mt-6">
          <div className="text-xs uppercase tracking-[0.2em] text-dust mb-6">Step {idx + 1} of {steps.length}</div>

          {type === 'vote' && (
            <>
              <p className="font-display text-2xl md:text-3xl leading-snug mb-8">{cur.text}</p>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => vote('agree')} className="btn-aurora flex-1 justify-center">Agree</button>
                <button onClick={() => vote('pass')} className="btn-secondary flex-1 justify-center">Pass</button>
                <button onClick={() => vote('disagree')} className="btn-secondary flex-1 justify-center">Disagree</button>
              </div>
            </>
          )}

          {type === 'crowdfunding' && (
            <>
              <p className="font-display text-2xl md:text-3xl leading-snug mb-3">{cur.text}</p>
              <p className="text-bone-dim mb-8">Become a founding supporter — your contribution funds humanity's constitution for AI.</p>
              <div className="flex flex-wrap gap-3">
                <a href={CROWDFUND_URL} target="_blank" rel="noopener noreferrer" className="btn-aurora flex-1 justify-center">Support the campaign <ArrowRight size={16} /></a>
                <button onClick={next} className="btn-secondary justify-center">Continue</button>
              </div>
            </>
          )}

          {type === 'signature' && (
            <>
              <p className="font-display text-2xl md:text-3xl leading-snug mb-6">{cur.text}</p>
              <div className="space-y-3 max-w-md">
                <input value={sign.name} onChange={e => setSign(s => ({ ...s, name: e.target.value }))} placeholder="Your name" autoComplete="name"
                  className="w-full px-4 py-3 rounded-xl outline-none" style={{ background: 'var(--void-2)', border: '1px solid var(--line-2)', color: 'var(--bone)' }} />
                <input value={sign.email} onChange={e => setSign(s => ({ ...s, email: e.target.value }))} type="email" placeholder="you@email.com" autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl outline-none" style={{ background: 'var(--void-2)', border: '1px solid var(--line-2)', color: 'var(--bone)' }} />
                <input value={sign.country} onChange={e => setSign(s => ({ ...s, country: e.target.value }))} placeholder="Country (optional)"
                  className="w-full px-4 py-3 rounded-xl outline-none" style={{ background: 'var(--void-2)', border: '1px solid var(--line-2)', color: 'var(--bone)' }} />
                {signMsg && <p className="text-sm" style={{ color: 'var(--terra)' }}>{signMsg}</p>}
                <button onClick={submitSign} className="btn-aurora w-full justify-center">Add my name <ArrowRight size={16} /></button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="mt-10">
          <E p="surveys" k="results_heading" as="h2" className="font-display text-3xl font-italic text-aurora mb-2">That's the union, taking shape.</E>
          <E p="surveys" k="results_sub" as="p" className="text-bone-dim mb-8">Live tallies update as people vote.</E>
          <div className="space-y-3">
            {(results || []).map((r) => {
              const total = r.agree + r.disagree + r.pass || 1;
              return (
                <div key={r.statementId} className="card-glass rounded-xl p-5">
                  <p className="text-bone mb-3">{r.text}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-aurora">Agree {r.agree}</span>
                    <span className="text-terra">Disagree {r.disagree}</span>
                    <span className="text-dust">Pass {r.pass}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden mt-3 flex" style={{ background: 'var(--void)' }}>
                    <div style={{ width: `${(r.agree / total) * 100}%`, background: 'var(--aurora)' }} />
                    <div style={{ width: `${(r.disagree / total) * 100}%`, background: 'var(--terra)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!embed && (
        <div className="mt-10 flex flex-wrap gap-3">
          <button onClick={() => copy(shareUrl, 'link')} className="btn-secondary text-sm">{copied === 'link' ? 'Link copied ✓' : 'Copy share link'}</button>
          <button onClick={() => copy(embedCode, 'embed')} className="btn-secondary text-sm">{copied === 'embed' ? 'Embed code copied ✓' : 'Copy embed code'}</button>
        </div>
      )}
    </>
  );
};

// ============ SURVEYS PAGE (multi-survey index, wired to /api/surveys) ============
const SurveysPage = ({ embedId }) => {
  const indexTitle = useCmsField('surveys', 'index_title', 'Where the union decides.');
  const indexIntro = useCmsField('surveys', 'index_intro', 'Choose a question below and vote — agree, disagree, or pass on each statement.');
  const initial = embedId || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('survey') : null);
  const [list, setList] = useState(null);
  const [selected, setSelected] = useState(initial || null);

  useEffect(() => {
    if (embedId) return;
    fetch('/api/surveys').then(r => r.json()).then(d => setList(d.surveys || [])).catch(() => setList([]));
  }, [embedId]);

  const openSurvey = (id) => {
    setSelected(id);
    try { window.history.pushState({}, '', `${window.location.pathname}?survey=${id}`); } catch {}
  };
  const backToList = () => {
    setSelected(null);
    try { window.history.pushState({}, '', window.location.pathname); } catch {}
  };

  // Embedded mode: render just the survey, no page chrome.
  if (embedId) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--void)', color: 'var(--bone)', padding: '24px 18px' }}>
        <SurveyRunner surveyId={embedId} embed />
      </div>
    );
  }

  return (
    <PageWrap>
      <section className="pt-24 pb-20 max-w-4xl mx-auto px-6 lg:px-12 relative">
        <UnityParticles count={5} pattern="converge" />
        <SectionLabel>Surveys</SectionLabel>
        {selected ? (
          <>
            <button onClick={backToList} className="text-sm text-dust hover:text-bone mb-4 flex items-center gap-1">← All surveys</button>
            <SurveyRunner surveyId={selected} />
          </>
        ) : (
          <>
            <h1 className="font-display text-4xl md:text-6xl leading-tight">{indexTitle}</h1>
            <p className="text-bone-dim mt-6 max-w-2xl text-lg">{indexIntro}</p>
            {list === null ? (
              <div className="mt-10 text-bone-dim flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading…</div>
            ) : list.length === 0 ? (
              <div className="mt-10 text-bone-dim">No live surveys right now. Check back soon.</div>
            ) : (
              <div className="mt-10 grid gap-4 md:grid-cols-2">
                {list.map(s => (
                  <button key={s.id} onClick={() => openSurvey(s.id)} className="card-glass rounded-2xl p-6 text-left transition-all" style={{ borderColor: 'var(--line-2)' }}>
                    <div className="font-display text-xl mb-2">{s.title}</div>
                    <p className="text-bone-dim text-sm leading-relaxed">{s.intro}</p>
                    <div className="text-xs text-aurora mt-3">{s.statement_count} statement{s.statement_count !== 1 ? 's' : ''} →</div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </PageWrap>
  );
};

// ============ EVENTS PAGE (wired to /api/events) ============
const EventCard = ({ ev }) => {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [msg, setMsg] = useState('');
  const rsvpBtn = useCmsField('events', 'rsvp_btn', 'RSVP');
  const confirmBtn = useCmsField('events', 'confirm_btn', 'Confirm');
  const rsvpNamePh = useCmsField('events', 'rsvp_name_ph', 'Your name');
  const rsvpEmailPh = useCmsField('events', 'rsvp_email_ph', 'you@email.com');
  const rsvp = async () => {
    const d = await postJSON(`/api/events/${ev.id}/rsvp`, form);
    setMsg(d.error || d.message || "You're on the list.");
    if (!d.error) { setForm({ name: '', email: '' }); setOpen(false); }
  };
  return (
    <div className="card-glass rounded-2xl p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-[0.2em] text-aurora">{ev.type}</span>
          <div className="font-display text-xl mt-2">{ev.title}</div>
          <div className="text-sm text-dust mt-1">{ev.when_text}</div>
          <p className="text-bone-dim text-sm mt-2 leading-relaxed">{ev.blurb}</p>
        </div>
        <button onClick={() => setOpen(v => !v)} className="btn-secondary whitespace-nowrap">{rsvpBtn}</button>
      </div>
      {open && (
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={rsvpNamePh}
            className="px-4 py-3 rounded-xl outline-none sm:flex-1" style={{ background: 'var(--void-2)', border: '1px solid var(--line-2)', color: 'var(--bone)' }} />
          <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={rsvpEmailPh}
            className="px-4 py-3 rounded-xl outline-none sm:flex-1" style={{ background: 'var(--void-2)', border: '1px solid var(--line-2)', color: 'var(--bone)' }} />
          <button onClick={rsvp} className="btn-aurora">{confirmBtn}</button>
        </div>
      )}
      {msg && <p className="text-sm text-aurora mt-2">{msg}</p>}
    </div>
  );
};

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  useEffect(() => {
    fetch('/api/events').then(r => r.json()).then(d => setEvents(d.events || [])).catch(() => {});
  }, []);
  return (
    <PageWrap>
      <section className="pt-24 pb-20 max-w-4xl mx-auto px-6 lg:px-12 relative">
        <UnityParticles count={6} pattern="orbit" speed="fast" />
        <SectionLabel>Pitch &amp; networking</SectionLabel>
        <E p="events" k="title" as="h1" className="font-display text-4xl md:text-6xl leading-tight">Events.</E>
        <E p="events" k="intro" as="p" className="text-bone-dim mt-6 max-w-2xl text-lg">Meet builders, pitch live to the community, and help shape the next draft clauses.</E>
        <div className="space-y-4 mt-12">
          {events.map(ev => <EventCard key={ev.id} ev={ev} />)}
        </div>
      </section>
    </PageWrap>
  );
};

const QuestPage = ({ onOpenAgent }) => {
  const steps = [
    { n: '01', icon: <Sparkles size={20} className="text-aurora" />, t: 'You + your Agent develop the idea', d: 'Your Personal Agent is your co-founder. Brainstorm, refine, prompt-engineer the vision into a precise specification.' },
    { n: '02', icon: <Layers size={20} className="text-aurora" />, t: 'Sub-agents prove product-market fit', d: 'Your idea spawns specialized sub-agents — market modeler, ethics auditor, technical validator, collaborator-finder — that run in parallel and report back.' },
    { n: '03', icon: <Users size={20} className="text-aurora" />, t: 'Pitch to humanity\'s panel', d: 'No VCs. No equity. You pitch to ethicists, scientists, citizens, and elders chosen by lottery. The skill is prompting + ideas combined.' },
    { n: '04', icon: <Database size={20} className="text-aurora" />, t: 'Stamped on the Ledger forever', d: 'Winning ideas are timestamped on the immutable Ledger, attributed to you, and gifted to humanity. Resources flow to humans, never corporations.' }
  ];

  const finalists = [
    { name: 'Aiyana Greywolf', idea: 'Watershed-aware flood prediction agent for Indigenous land', region: 'Pacific Northwest', sub: 7 },
    { name: 'Tariq Boudiaf', idea: 'Open-source clinical co-pilot for low-resource hospitals', region: 'Maghreb', sub: 12 },
    { name: 'Lin Wei-Hua', idea: 'Pollinator-network restoration AI for urban biodiversity', region: 'East Asia', sub: 9 },
    { name: 'Sara Lindqvist', idea: 'Multilingual disinformation triage for civic newsrooms', region: 'Nordic + Baltic', sub: 6 },
    { name: 'Kwame Asante-Brown', idea: 'Smallholder soil-health agent with peer-to-peer compute share', region: 'West Africa', sub: 11 },
    { name: 'Ravi Subramanian', idea: 'Constitutional translator for legal aid in 14 South Asian languages', region: 'South Asia', sub: 8 }
  ];

  return (
    <PageWrap>
      <section className="relative pt-24 pb-20 grain">
        <AgentNetwork density={28} height="100%" planetary={false} />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
          <SectionLabel>The Quest · Season 04</SectionLabel>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
            <E p="quest" k="h1_a" as="span">Pitch the future.</E><br />
            <E p="quest" k="h1_b" as="span" className="font-italic gold-text">Own the future.</E>
          </h1>
          <E p="quest" k="intro" as="p" className="text-bone-dim mt-8 max-w-2xl text-lg leading-relaxed">
            A global Shark Tank–style competition where the new skill is prompting plus ideas, and every entry is attributed to its human creator on humanity's ledger. The prize isn't equity — it's compute, collaborators, and the satisfaction of building for the species.
          </E>
          <div className="mt-10 flex flex-wrap gap-3">
            <button onClick={() => alert('Quest applications opening soon. Sign up for an account to be notified.')} className="btn-aurora">Apply to the Quest <ArrowRight size={16} /></button>
            <button onClick={onOpenAgent} className="btn-secondary"><MessageCircle size={16} /> Refine your idea with the Agent</button>
          </div>
        </div>
      </section>

      <section className="py-24 max-w-7xl mx-auto px-6 lg:px-12">
        <SectionLabel>How the Quest works</SectionLabel>
        <h2 className="font-display text-4xl md:text-5xl leading-tight max-w-3xl">Four steps. One arena. Every idea attributed.</h2>
        <div className="mt-16 grid md:grid-cols-2 gap-6">
          {steps.map((s, i) => (
            <div key={i} className="card-glass rounded-2xl p-8 relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="font-display text-3xl text-aurora">{s.n}</div>
                <div className="w-px h-8" style={{ background: 'var(--line-2)' }} />
                {s.icon}
              </div>
              <h3 className="font-display text-2xl leading-snug mb-3">{s.t}</h3>
              <p className="text-bone-dim leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 grain" style={{ background: 'var(--cosmos)' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <SectionLabel>The Tournament Pyramid</SectionLabel>
          <h2 className="font-display text-4xl md:text-5xl leading-tight max-w-3xl">
            Local. Regional. Continental. <span className="font-italic text-gold">Planetary.</span>
          </h2>
          <p className="text-bone-dim mt-6 max-w-2xl text-lg">
            Every entry — at every level — is timestamped on the Ledger. You don't lose attribution if you don't win the final;
            you gain it the moment you submit.
          </p>
          <div className="mt-16 space-y-4">
            {[
              { lvl: 'Local Hackathons', count: '420+ cities · monthly', share: 100 },
              { lvl: 'Regional Showcases', count: '64 regions · quarterly', share: 70 },
              { lvl: 'Continental Finals', count: '6 continents · biannual', share: 40 },
              { lvl: 'The Humanity Summit', count: 'Annual flagship · global', share: 12 }
            ].map((row, i) => (
              <div key={i} className="card-glass rounded-xl p-6 flex items-center justify-between gap-6">
                <div className="flex-1">
                  <div className="font-display text-xl">{row.lvl}</div>
                  <div className="text-sm text-bone-dim mt-1">{row.count}</div>
                </div>
                <div className="hidden md:block w-64">
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--void)' }}>
                    <div className="h-full" style={{ width: `${row.share}%`, background: 'linear-gradient(90deg, var(--aurora), var(--gold))' }} />
                  </div>
                </div>
                <div className="font-display text-2xl text-aurora">{row.share}%</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <QuestsBoard />
    </PageWrap>
  );
};

// ============ AGENT PAGE ============
const AgentPage = ({ onOpenAgent }) => (
  <PageWrap>
    <section className="relative pt-24 pb-20 grain">
      <AgentNetwork density={32} height="100%" />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-12 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <SectionLabel>Your Personal Agent</SectionLabel>
          <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
            You don't use the OS.<br />
            <span className="font-italic aurora-text">You inhabit it.</span>
          </h1>
          <p className="text-bone-dim mt-8 text-lg leading-relaxed">
            Your Agent is your digital self — sovereign, luminous, never your master and never your slave.
            It guards your rights under the HRC, tracks your contributions to the Ledger, spawns sub-agents
            to test your ideas, and connects you to the humans who can build them with you.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <button onClick={() => alert('Personal agents are coming in Phase 2. Try Uto-Pi now to experience the constitution.')} className="btn-aurora">Claim Your Agent <ArrowRight size={16} /></button>
            <button onClick={onOpenAgent} className="btn-secondary"><MessageCircle size={16} /> Try Uto-Pi now</button>
          </div>
        </div>

        <div className="relative aspect-square max-w-md mx-auto w-full">
          <div className="absolute inset-0 orbital-ring animate-drift" />
          <div className="absolute inset-8 orbital-ring" style={{ animation: 'orbit 60s linear infinite' }} />
          <div className="absolute inset-16 orbital-ring" style={{ animation: 'orbit 40s linear infinite reverse' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full animate-glow-breathe" style={{
                background: 'radial-gradient(circle, var(--aurora) 0%, transparent 70%)'
              }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={48} className="text-aurora" />
              </div>
            </div>
          </div>
          {[0, 60, 120, 180, 240, 300].map((deg, i) => (
            <div key={i} className="absolute w-3 h-3 rounded-full"
              style={{
                top: '50%', left: '50%',
                transform: `translate(-50%, -50%) rotate(${deg}deg) translateY(-140px)`,
                background: i % 2 ? 'var(--gold)' : 'var(--terra)',
                animation: `pulse-soft 3s ease-in-out infinite`,
                animationDelay: `${i * 0.5}s`,
                boxShadow: '0 0 12px currentColor'
              }} />
          ))}
        </div>
      </div>
    </section>

    <section className="py-24 max-w-7xl mx-auto px-6 lg:px-12">
      <SectionLabel>What your Agent does</SectionLabel>
      <h2 className="font-display text-4xl md:text-5xl leading-tight max-w-3xl">Six sovereign duties. One luminous companion.</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
        {[
          { icon: <Shield className="text-aurora" />, t: 'Guards your HRC rights', d: 'Actively monitors and enforces every clause across third-party services. Alerts you to violations before they happen.' },
          { icon: <Database className="text-gold" />, t: 'Tracks every contribution', d: 'Every idea, refinement, test, and conversation that shapes the OS is timestamped to you on the immutable Ledger.' },
          { icon: <Layers className="text-terra" />, t: 'Spawns sub-agents', d: 'Your ideas summon specialized sub-agents that simulate market, audit ethics, and stress-test your concept in parallel.' },
          { icon: <Network className="text-aurora" />, t: 'Connects you to experts', d: 'Identifies and routes to the right verified human collaborators worldwide — never the gatekeepers, always the doers.' },
          { icon: <Lock className="text-gold" />, t: 'Protects your privacy', d: 'Consent is explicit, informed, and revocable. Your data is yours. Period.' },
          { icon: <Feather className="text-terra" />, t: 'Preserves your legacy', d: 'Your contributions persist after you. Your inheritance protocols are yours to design.' }
        ].map((p, i) => (
          <div key={i} className="card-glass rounded-2xl p-6">
            <div className="mb-4">{p.icon}</div>
            <div className="font-display text-xl mb-2">{p.t}</div>
            <p className="text-bone-dim text-sm leading-relaxed">{p.d}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="py-24 grain" style={{ background: 'var(--cosmos)' }}>
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <SectionLabel>Sub-Agents Explained</SectionLabel>
        <h2 className="font-display text-4xl md:text-5xl leading-tight">
          One idea. <span className="font-italic text-aurora">Many minds.</span>
        </h2>
        <p className="text-bone-dim mt-6 text-lg max-w-2xl">
          Every meaningful idea you and your Agent develop spawns sub-agents — ephemeral, specialized intelligences
          that run in parallel to model and prove the idea before you ever pitch it.
        </p>
        <div className="grid md:grid-cols-2 gap-3 mt-12">
          {[
            { t: 'Market Modeler', d: 'Simulates demand, scale, and adoption curves across regions.' },
            { t: 'Ethics Auditor', d: 'Maps the idea against all 52 HRC clauses. Flags conflicts. Suggests refinements.' },
            { t: 'Technical Validator', d: 'Builds rapid prototypes, stress-tests architecture, surfaces feasibility risks.' },
            { t: 'Collaborator-Finder', d: 'Identifies the verified humans worldwide whose skills complete your team.' },
            { t: 'Resource Mapper', d: 'Calculates compute, datasets, and human-expert hours required.' },
            { t: 'Lineage Tracker', d: 'Anchors the idea on the Ledger and traces its genealogy back through related work.' }
          ].map((s, i) => (
            <div key={i} className="clause-card rounded-xl p-5">
              <div className="font-display text-lg mb-1 text-aurora">{s.t}</div>
              <p className="text-sm text-bone-dim">{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  </PageWrap>
);

// ============ OS PAGE ============
const OSPage = ({ setPage }) => (
  <PageWrap>
    <section className="relative pt-24 pb-20 grain">
      <AgentNetwork density={50} height="100%" />
      <div className="relative max-w-7xl mx-auto px-6 lg:px-12">
        <SectionLabel>The Operating System</SectionLabel>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95] max-w-4xl">
          <E p="os" k="h1_a" as="span">One operating system.</E><br />
          <E p="os" k="h1_b" as="span">Built by everyone.</E><br />
          <E p="os" k="h1_c" as="span" className="font-italic gold-text">Ruled by no one.</E>
        </h1>
        <E p="os" k="intro" as="p" className="text-bone-dim mt-8 max-w-2xl text-lg leading-relaxed">
          Humanity-AI is the connective tissue of the constitutional ecosystem. Personal agents, expert agents, sub-agents, the immutable ledger, and the constitution itself — all woven into one open, planetary-scale public good.
        </E>
      </div>
    </section>

    <section className="py-24 max-w-7xl mx-auto px-6 lg:px-12">
      <SectionLabel>Architecture</SectionLabel>
      <h2 className="font-display text-4xl md:text-5xl leading-tight max-w-3xl">Six layers. <span className="font-italic">One civilization.</span></h2>
      <div className="mt-16 space-y-2">
        {[
          { n: '06', t: 'The Constitution Layer', d: 'Immutable values: dignity, autonomy, truth, peace, collaboration. Cannot be rewritten by AI.', color: 'var(--bone)' },
          { n: '05', t: 'The Ledger Layer', d: 'Cryptographic, public, verified-human attribution. Every idea, every contribution, forever.', color: 'var(--gold)' },
          { n: '04', t: 'Dynamic Knowledge Layer', d: 'Live human expertise, not stale datasets. The OS asks the experts in real time.', color: 'var(--terra)' },
          { n: '03', t: 'Sub-Agent Layer', d: 'Ephemeral, idea-specific intelligences spawned to model, test, and prove product-market fit.', color: 'var(--aurora-deep)' },
          { n: '02', t: 'Expert Agent Layer', d: 'Verified domain specialists — scientists, ethicists, builders — accessible to every Personal Agent.', color: 'var(--aurora)' },
          { n: '01', t: 'Personal Agent Layer', d: 'You and your luminous digital self. Sovereign. Always.', color: 'var(--bone)' }
        ].map((row, i) => (
          <div key={i} className="card-glass rounded-xl p-6 flex items-start gap-6">
            <div className="font-display text-3xl flex-shrink-0 w-16" style={{ color: row.color, opacity: 0.7 }}>{row.n}</div>
            <div className="flex-1">
              <E p="os" k={`layer${i}_t`} as="div" className="font-display text-xl mb-1">{row.t}</E>
              <E p="os" k={`layer${i}_d`} as="p" className="text-bone-dim text-sm leading-relaxed">{row.d}</E>
            </div>
            <div className="hidden md:block w-2 h-16 rounded-full" style={{ background: row.color, opacity: 0.4 }} />
          </div>
        ))}
      </div>
    </section>

    <section className="py-24 grain" style={{ background: 'var(--cosmos)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12 grid md:grid-cols-2 gap-8">
        {[
          { icon: <Globe className="text-aurora" size={28} />, t: 'Open source forever', d: 'Code, infrastructure, governance — all open. The platform is gifted to humanity. There is no acquisition button.' },
          { icon: <Shield className="text-gold" size={28} />, t: 'Mandatory HRC compliance', d: 'Every connected service is independently certified. Non-compliant interactions are blocked at the agent layer.' },
          { icon: <Users className="text-terra" size={28} />, t: 'Peer-to-peer economy', d: 'Verified humans only. Public, immutable transaction logs. Zero corporate intermediaries.' },
          { icon: <Lock className="text-aurora" size={28} />, t: 'Quantum-resistant security', d: 'Designed for 1000-year integrity. Cryptographic protocols updated continuously against future threats.' }
        ].map((p, i) => (
          <div key={i} className="card-glass rounded-2xl p-8">
            <div className="mb-4">{p.icon}</div>
            <E p="os" k={`principle${i}_t`} as="div" className="font-display text-2xl mb-3">{p.t}</E>
            <E p="os" k={`principle${i}_d`} as="p" className="text-bone-dim leading-relaxed">{p.d}</E>
          </div>
        ))}
      </div>
    </section>

    <section className="py-24 max-w-7xl mx-auto px-6 lg:px-12">
      <SectionLabel>The Truth Layer · Clause I.33</SectionLabel>
      <div className="grid lg:grid-cols-2 gap-16 items-start">
        <div>
          <h2 className="font-display text-4xl md:text-5xl leading-tight">
            <E p="os" k="truth_h2a" as="span">A right to truthful media.</E><br />
            <E p="os" k="truth_h2b" as="span" className="font-italic text-aurora">A covenant, not a censor.</E>
          </h2>
          <E p="os" k="truth_body" as="p" className="text-bone-dim mt-8 text-lg leading-relaxed">
            The newest clause in the Constitution establishes truth as a positive human right. Every contributor — human, agent, or service — operates under a transparent reputational layer. The HRC itself governs it, as a covenant binding all signatories. No truth czar. No deletion. Just radical transparency.
          </E>
          <div className="mt-8 p-6 rounded-2xl" style={{
            background: 'rgba(232, 177, 79, 0.05)',
            border: '1px solid rgba(232, 177, 79, 0.25)'
          }}>
            <div className="text-xs uppercase tracking-[0.25em] text-gold mb-3">The Pledge</div>
            <E p="os" k="truth_pledge" as="p" className="font-display italic text-lg leading-relaxed">
              "Every party — human, agent, or service — commits to further humanity's evolution and autonomy through truthful, ethical, pro-humanity content."
            </E>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-xs uppercase tracking-[0.25em] text-bone-dim mb-2">Three layered consequences</div>
          {[
            { n: '01', t: 'Visibility', d: 'The contributor\'s truth and ethics ranking is displayed publicly alongside their content. Consumers always see who they\'re trusting.', color: 'var(--aurora)' },
            { n: '02', t: 'Reach', d: 'Low-truth content circulates less through the network. It is never deleted, never silenced — only weighted by its own track record.', color: 'var(--gold)' },
            { n: '03', t: 'Consumer Control', d: 'Every human sets their own truth-threshold through their Personal Agent. You decide what reaches you. Sovereignty over your information diet.', color: 'var(--terra)' }
          ].map((row, i) => (
            <div key={i} className="card-glass rounded-xl p-6 flex gap-5">
              <div className="font-display text-3xl flex-shrink-0" style={{ color: row.color }}>{row.n}</div>
              <div>
                <E p="os" k={`conseq${i}_t`} as="div" className="font-display text-xl mb-2">{row.t}</E>
                <E p="os" k={`conseq${i}_d`} as="p" className="text-bone-dim text-sm leading-relaxed">{row.d}</E>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    <section className="py-24 max-w-4xl mx-auto px-6 lg:px-12 text-center">
      <h2 className="font-display text-3xl md:text-4xl leading-tight">
        <E p="os" k="cta_h2a" as="span">The OS is gifted to humanity. </E><E p="os" k="cta_h2b" as="span" className="font-italic text-aurora">Help architect it.</E>
      </h2>
      <div className="mt-8 flex flex-wrap gap-3 justify-center">
        <button onClick={() => setPage('petition')} className="btn-aurora">Sign Petition <ArrowRight size={16} /></button>
        <button onClick={() => setPage('community')} className="btn-secondary">Build with us <ArrowRight size={16} /></button>
      </div>
    </section>
  </PageWrap>
);

// ============ COMMUNITY PAGE ============
const CommunityPage = ({ setPage, onOpenAgent }) => (
  <PageWrap>
    <section className="pt-24 pb-20 max-w-7xl mx-auto px-6 lg:px-12 relative">
      <UnityParticles count={6} pattern="drift" />
      <SectionLabel>Open-source tech community</SectionLabel>
      <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
        <E p="community" k="h1_a" as="span">Build the firewall</E><br />
        <E p="community" k="h1_b" as="span" className="font-italic aurora-text">and the OS.</E>
      </h1>
      <E p="community" k="intro" as="p" className="text-bone-dim mt-8 max-w-2xl text-lg leading-relaxed">
        A constitutional firewall decides how AI is allowed to reach people; an OS runs it, giving each of us a personal agent. Here's where we build both, in the open.
      </E>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
        {[
          { t: 'Sign Petition', d: 'Add your name to the founding union.', nav: 'petition', icon: <Feather className="text-aurora" /> },
          { t: 'Innovation quests', d: 'Open bounties — register to pitch a solution.', nav: 'quest', icon: <Sparkles className="text-aurora" /> },
          { t: 'Surveys', d: 'Vote on what the union should stand for.', nav: 'surveys', icon: <Users className="text-gold" /> },
          { t: 'Define the HRC', d: 'Read the live draft and give feedback to the agent.', nav: 'constitution', icon: <BookOpen className="text-terra" /> },
          { t: 'Pitch & networking events', d: 'Meet builders and pitch live to the community.', nav: 'events', icon: <Star className="text-gold" /> },
          { t: 'Media', d: 'Podcasts and writing from the movement.', nav: 'media', icon: <Mic className="text-aurora" /> },
          { t: 'Courses', d: 'Open after our first funding milestone.', nav: 'courses', icon: <BookOpen className="text-gold" /> },
          { t: 'Ask the agent', d: 'Talk to the HRC agent about any clause.', action: 'agent', icon: <MessageCircle className="text-aurora" /> }
        ].map((tile, i) => (
          <button key={i} onClick={() => tile.action ? onOpenAgent() : setPage(tile.nav)}
            className="card-glass rounded-2xl p-6 text-left group">
            <div className="mb-4">{tile.icon}</div>
            <div className="font-display text-xl mb-2 flex items-center gap-2"><E p="community" k={`tile${i}_t`} as="span">{tile.t}</E> <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" /></div>
            <E p="community" k={`tile${i}_d`} as="p" className="text-bone-dim text-sm leading-relaxed">{tile.d}</E>
          </button>
        ))}
      </div>
    </section>

    <section className="py-16 max-w-7xl mx-auto px-6 lg:px-12">
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { initials: 'AY', name: 'Ayọ̀ka Adésànyà', role: 'Ethics architect', loc: 'Lagos', ledger: 142 },
          { initials: 'KL', name: 'Klara Lindberg', role: 'Cryptographic ledger lead', loc: 'Stockholm', ledger: 98 },
          { initials: 'JR', name: 'Joaquín Reyes', role: 'Sub-agent infrastructure', loc: 'Mexico City', ledger: 211 },
          { initials: 'MN', name: 'Mei-Ling Nakamura', role: 'Constitutional UX designer', loc: 'Kyoto', ledger: 76 },
          { initials: 'DV', name: 'Dineo van Niekerk', role: 'Biodiversity AI lead', loc: 'Cape Town', ledger: 134 },
          { initials: 'RH', name: 'Raffi Hovsepian', role: 'Verified-human identity protocol', loc: 'Yerevan', ledger: 89 }
        ].map((p, i) => (
          <div key={i} className="card-glass rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center font-display text-lg" style={{
                background: 'linear-gradient(135deg, var(--aurora-deep), var(--forest))',
                color: 'var(--bone)'
              }}>{p.initials}</div>
              <div>
                <div className="font-display text-lg">{p.name}</div>
                <div className="text-xs text-bone-dim mt-0.5">{p.role}</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-dust pt-4 border-t" style={{ borderColor: 'var(--line)' }}>
              <span>{p.loc}</span>
              <span><span className="text-aurora">{p.ledger}</span> ledger entries</span>
            </div>
          </div>
        ))}
      </div>
    </section>

    <section className="py-24 grain" style={{ background: 'var(--cosmos)' }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <SectionLabel>Where the community gathers</SectionLabel>
        <h2 className="font-display text-4xl md:text-5xl leading-tight"><E p="community" k="gather_h2a" as="span">Digital movement. </E><E p="community" k="gather_h2b" as="span" className="font-italic">Physical embodiment.</E></h2>
        <div className="grid md:grid-cols-3 gap-4 mt-12">
          {[
            { t: 'HRC Houses', d: 'Co-working spaces in 38 cities where verified builders gather, prototype, and pitch in person.', icon: <Trees className="text-aurora" /> },
            { t: 'University Charter Cohorts', d: 'Partnered universities where every CS, design, and ethics student gets a Ledger identity from day one.', icon: <BookOpen className="text-gold" /> },
            { t: 'Children of the Ledger', d: 'Under-18 contributor track with full child-protection safeguards. The next generation, attributed.', icon: <Star className="text-terra" /> }
          ].map((p, i) => (
            <div key={i} className="card-glass rounded-2xl p-6">
              <div className="mb-4">{p.icon}</div>
              <E p="community" k={`gather${i}_t`} as="div" className="font-display text-xl mb-3">{p.t}</E>
              <E p="community" k={`gather${i}_d`} as="p" className="text-bone-dim text-sm leading-relaxed">{p.d}</E>
            </div>
          ))}
        </div>
      </div>
    </section>
  </PageWrap>
);

// ============ LEDGER PAGE ============
const LedgerPage = ({ setPage }) => {
  const total = useAnimatedCount(8924);
  const today = useAnimatedCount(127);

  const recent = [
    { id: '0x4f...a82', who: 'Aiyana Greywolf', what: 'Watershed flood-prediction model · v3', t: '2m ago' },
    { id: '0x9c...e14', who: 'Tariq Boudiaf', what: 'Clinical co-pilot triage rules', t: '8m ago' },
    { id: '0xb3...77f', who: 'Lin Wei-Hua', what: 'Pollinator mesh expansion proposal', t: '14m ago' },
    { id: '0x2a...c91', who: 'Sara Lindqvist', what: 'Disinformation triage taxonomy', t: '23m ago' },
    { id: '0xe7...3da', who: 'Kwame Asante-Brown', what: 'Soil microbiome sub-agent prompt', t: '37m ago' },
    { id: '0x1f...b08', who: 'Ravi Subramanian', what: 'Tamil legal-aid translator v0.4', t: '52m ago' },
    { id: '0x8d...9b2', who: 'Klara Lindberg', what: 'Quantum-resistant attestation spec', t: '1h ago' },
    { id: '0x5c...7e3', who: 'Ayọ̀ka Adésànyà', what: 'Clause IV.02 amendment proposal', t: '1h ago' }
  ];

  return (
    <PageWrap>
      <section className="pt-24 pb-20 max-w-7xl mx-auto px-6 lg:px-12 relative">
        <UnityParticles count={7} pattern="drift" />
        <SectionLabel>The Ledger</SectionLabel>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
          <E p="ledger" k="h1_a" as="span">Humanity's</E><br />
          <E p="ledger" k="h1_b" as="span" className="font-italic gold-text">patent ledger.</E>
        </h1>
        <E p="ledger" k="intro" as="p" className="text-bone-dim mt-8 max-w-2xl text-lg leading-relaxed">
          Every idea, attributed to its human creator. Forever. Cryptographically signed, publicly auditable, posthumously preserved.
        </E>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          {[
            { v: total.toLocaleString(), l: 'Total ledger entries' },
            { v: today, l: 'Entries today' },
            { v: '127,483', l: 'Verified contributors' },
            { v: '∞', l: 'Years of attribution' }
          ].map((s, i) => (
            <div key={i} className="card-glass rounded-xl p-6">
              <div className="font-display text-3xl text-aurora">{s.v}</div>
              <div className="text-xs uppercase tracking-[0.2em] text-bone-dim mt-2">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 max-w-7xl mx-auto px-6 lg:px-12">
        <SectionLabel>Live Feed</SectionLabel>
        <E p="ledger" k="feed_h2" as="h2" className="font-display text-3xl md:text-4xl leading-tight mb-12">Recent contributions, attributed.</E>
        <div className="card-glass rounded-2xl overflow-hidden">
          {recent.map((r, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 border-b last:border-b-0 hover:bg-cosmos transition-colors"
              style={{ borderColor: 'var(--line)' }}>
              <div className="w-2 h-2 rounded-full bg-aurora animate-pulse-soft flex-shrink-0" />
              <div className="font-display text-aurora text-sm hidden md:block w-32">{r.id}</div>
              <div className="flex-1 min-w-0">
                <div className="text-bone truncate">{r.what}</div>
                <div className="text-xs text-bone-dim mt-0.5">by {r.who}</div>
              </div>
              <div className="text-xs text-dust flex-shrink-0">{r.t}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 grain" style={{ background: 'var(--cosmos)' }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <h2 className="font-display text-4xl md:text-5xl leading-tight">
            <E p="ledger" k="close_h2a" as="span">No corporate ownership.</E><br />
            <E p="ledger" k="close_h2b" as="span" className="font-italic text-aurora">No intellectual monopoly.</E>
          </h2>
          <E p="ledger" k="close_body" as="p" className="text-bone-dim mt-6 text-lg leading-relaxed">
            AI-generated innovations credit their human collaborators or enter the public domain. Resources flow to humans who steward ideas — but the ideas themselves belong to humanity.
          </E>
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            <button onClick={() => setPage('petition')} className="btn-aurora">Sign Petition <ArrowRight size={16} /></button>
            <button onClick={() => setPage('quest')} className="btn-secondary">See the quests <ArrowRight size={16} /></button>
          </div>
        </div>
      </section>
    </PageWrap>
  );
};

// ============ MANIFESTO PAGE ============
const ManifestoPage = ({ setPage }) => (
  <PageWrap>
    <section className="pt-32 pb-32 max-w-3xl mx-auto px-6 lg:px-12 relative">
      <UnityParticles count={6} pattern="converge" />
      <SectionLabel>Manifesto</SectionLabel>
      <E p="manifesto" k="headline" as="h1" className="font-display text-5xl md:text-7xl leading-[1.0] font-italic mb-16">
        AI will be built. The only question is who it serves.
      </E>

      <div className="space-y-8 text-lg leading-relaxed text-bone-dim font-body">
        <E p="manifesto" k="p1" as="p">
          We stand at an unprecedented juncture. The trajectory of artificial intelligence will determine the trajectory of our species for millennia. There is no neutral ground here. Every line of code shipped without a constitution is a vote for whoever owns the code.
        </E>
        <E p="manifesto" k="p2" as="p">
          The legacy systems that built AI are themselves the systems we should be liberating ourselves from. Surveillance capitalism. Intellectual monopoly. Concentration of compute in a handful of hands. Engagement engineered to consume attention. Algorithms that decide who gets a loan, a job, a sentence — without recourse, without appeal, without a human in the loop.
        </E>
        <E p="manifesto" k="p3" as="p" className="font-display text-2xl text-bone font-italic">
          We reject the inheritance of those flaws. We refuse to ship AI built on them.
        </E>
        <E p="manifesto" k="p4" as="p">
          The Humanities-AI Rights Constitution is humanity's answer. Fifty-two living clauses. A Hippocratic Oath for AI builders, governing every layer of the operating system that connects every personal agent to every expert agent to every sub-agent across the planet.
        </E>
        <E p="manifesto" k="p5" as="p">
          It is open source. It is ungovernable by any single corporation, government, or AI itself. It is gifted to humanity, owned by no one, protected by all of us.
        </E>
        <E p="manifesto" k="p6" as="p" className="font-display text-2xl text-bone font-italic">
          What we build is peace, truth, ethics, biodiversity, sovereignty, dignity, and the best UX ever crafted.
        </E>
        <E p="manifesto" k="p7" as="p">
          The Hippocratic Oath transformed medicine because every physician took it. The HRC transforms AI because every creator who builds it takes it. Sign Petition. Claim your agent. Build the firewall. Gift the OS to humanity.
        </E>
        <E p="manifesto" k="p8" as="p">
          The future is being written this decade — before the rules are written without us. Write it with us.
        </E>
      </div>

      <div className="mt-16 pt-16 border-t" style={{ borderColor: 'var(--line)' }}>
        <E p="manifesto" k="pledge_title" as="h3" className="font-display text-2xl mb-8">The Pledge</E>
        <E p="manifesto" k="pledge_text" as="blockquote" className="font-display text-xl italic text-bone leading-relaxed pl-6 border-l-2"
          style={{ borderColor: 'var(--gold)' }}>
          "I sign the Humanities-AI Rights Constitution. I commit to build AI that serves humanity and is never ruled by anything or anyone. I attribute every idea to its human source. I refuse to weaponize attention. I protect the dignity of every human I encounter. I build for a thousand years."
        </E>
        <div className="mt-10 flex flex-wrap gap-3">
          <button onClick={() => setPage('petition')} className="btn-aurora">Sign Petition <ArrowRight size={16} /></button>
          <button onClick={() => setPage('constitution')} className="btn-secondary">Read the full constitution <ArrowRight size={16} /></button>
        </div>
      </div>
    </section>
  </PageWrap>
);

// ============ JOIN PAGE ============
const JoinPage = ({ setPage }) => (
  <PageWrap>
    <section className="pt-24 pb-16 max-w-7xl mx-auto px-6 lg:px-12 text-center relative">
      <UnityParticles count={6} pattern="orbit" speed="fast" />
      <SectionLabel>Three doors</SectionLabel>
      <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
        <E p="join" k="h1_a" as="span">Three doors. </E><E p="join" k="h1_b" as="span" className="font-italic aurora-text">One movement.</E>
      </h1>
      <E p="join" k="intro" as="p" className="text-bone-dim mt-8 max-w-2xl mx-auto text-lg">
        Every door leads to the same union. Walk through whichever fits where you are today — but they all start with your name on the petition.
      </E>
    </section>

    <section className="pb-32 max-w-7xl mx-auto px-6 lg:px-12">
      <div className="grid md:grid-cols-3 gap-6">
        {[
          { n: 'I', icon: <Feather className="text-aurora" size={28} />, t: 'Sign the Petition', d: 'For everyone. Add your name to the union and help write the charter.', cta: 'Sign Petition', tone: 'aurora', nav: 'petition' },
          { n: 'II', icon: <Sparkles className="text-gold" size={28} />, t: 'Take on a quest', d: 'For builders ready to ship — open bounties, every contribution attributed to you.', cta: 'View bounties', tone: 'gold', nav: 'quest' },
          { n: 'III', icon: <Network className="text-terra" size={28} />, t: 'Build the firewall & OS', d: 'For open-source contributors, ethicists, scientists, and domain experts.', cta: 'Join the build', tone: 'bone', nav: 'community' }
        ].map((door, i) => (
          <div key={i} className="card-glass rounded-3xl p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 font-display text-9xl opacity-10" style={{ lineHeight: 1 }}>{door.n}</div>
            <div className="relative">
              <div className="mb-6">{door.icon}</div>
              <E p="join" k={`door${i}_t`} as="div" className="font-display text-3xl mb-4">{door.t}</E>
              <E p="join" k={`door${i}_d`} as="p" className="text-bone-dim leading-relaxed mb-8">{door.d}</E>
              <button onClick={() => setPage(door.nav)} className={door.tone === 'aurora' ? 'btn-aurora' : door.tone === 'gold' ? 'btn-gold' : 'btn-primary'}>
                {door.cta} <ArrowRight size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  </PageWrap>
);

// ============ ABOUT PAGE ============
// ============ TERMS & CONDITIONS PAGE (filler — replace copy via CMS) ============
const TermsPage = ({ setPage }) => (
  <PageWrap>
    <section className="pt-24 pb-24 max-w-3xl mx-auto px-6 lg:px-12 relative">
      <UnityParticles count={4} pattern="drift" />
      <SectionLabel>Legal</SectionLabel>
      <E p="terms" k="h1" as="h1" className="font-display text-4xl md:text-5xl leading-tight mb-6">Terms &amp; Conditions</E>
      <E p="terms" k="intro" as="p" className="text-bone-dim leading-relaxed mb-6">
        This is placeholder text for the Humanity-AI Terms &amp; Conditions. Final terms will be published before launch. By creating an account or signing the petition you agree to these terms once finalised.
      </E>
      <div className="space-y-5 text-bone-dim leading-relaxed">
        <div><h2 className="font-display text-xl text-bone mb-2">1. Your data</h2><E p="terms" k="s1" as="p">We process your data per our privacy commitments and Clause I.2 of the Constitution — explicit, revocable consent, with the right to deletion.</E></div>
        <div><h2 className="font-display text-xl text-bone mb-2">2. Contributions</h2><E p="terms" k="s2" as="p">Ideas and inputs you submit are attributed to you on the immutable ledger per Clause I.1.</E></div>
        <div><h2 className="font-display text-xl text-bone mb-2">3. Conduct</h2><E p="terms" k="s3" as="p">Be respectful. Misuse of the platform may result in suspension.</E></div>
      </div>
      <button onClick={() => setPage && setPage('home')} className="btn-secondary mt-10">Back to site</button>
    </section>
  </PageWrap>
);

const AboutPage = () => (
  <PageWrap>
    <section className="pt-24 pb-16 max-w-3xl mx-auto px-6 lg:px-12 relative">
      <UnityParticles count={5} pattern="converge" />
      <SectionLabel>About</SectionLabel>
      <h1 className="font-display text-5xl md:text-6xl leading-[1.0]">
        <E p="about" k="h1_a" as="span">Origin. Governance. </E><E p="about" k="h1_b" as="span" className="font-italic">Promise.</E>
      </h1>
    </section>

    <section className="pb-24 max-w-3xl mx-auto px-6 lg:px-12 space-y-16">
      <div>
        <E p="about" k="origin_h" as="h2" className="font-display text-2xl mb-4 text-aurora">Origin</E>
        <E p="about" k="origin" as="p" className="text-bone-dim leading-relaxed text-lg">
          Humanity-AI began as a question: what would AI look like if its own creators gifted humanity a constitutional layer to govern it — built from first principles, by everyone? The answer became the Humanities-AI Rights Constitution and the open-source operating system that enforces it.
        </E>
      </div>
      <div>
        <E p="about" k="governance_h" as="h2" className="font-display text-2xl mb-4 text-gold">Governance</E>
        <E p="about" k="governance" as="p" className="text-bone-dim leading-relaxed text-lg">
          The HRC evolves through a transparent, participatory amendment process. An independent, democratically-elected international body oversees compliance and conducts regular audits. All funding is publicly disclosed.
        </E>
      </div>
      <div>
        <E p="about" k="promise_h" as="h2" className="font-display text-2xl mb-4 text-terra">Promise</E>
        <E p="about" k="promise" as="p" className="text-bone-dim leading-relaxed text-lg">
          We promise that every contribution is attributed to its human source. That every clause serves human dignity. That the OS will never be sold, acquired, or enclosed. That AI here will never rule. And that this platform will be maintained for a thousand years and beyond.
        </E>
      </div>
      <div className="pt-8 border-t" style={{ borderColor: 'var(--line)' }}>
        <E p="about" k="contact_h" as="h2" className="font-display text-2xl mb-4">Contact</E>
        <p className="text-bone-dim leading-relaxed text-lg mb-4">
<E p="about" k="contact_line" as="span">For collaborators, journalists, governments, and citizens.</E>
        </p>
        <div className="space-y-2 text-bone">
          <div>Press · <span className="text-aurora">press@humanity-ai.quest</span></div>
          <div>Builders · <span className="text-aurora">build@humanity-ai.quest</span></div>
          <div>Governance · <span className="text-aurora">hrc@humanity-ai.quest</span></div>
        </div>
      </div>
    </section>
  </PageWrap>
);

// ============ MEDIA PAGE ============
const MediaPage = ({ setPage }) => {
  const items = [
    { kind: 'Podcast', title: 'Why AI needs a union', blurb: 'Placeholder episode — coming soon.' },
    { kind: 'Podcast', title: 'One person, one agent', blurb: 'Placeholder episode — coming soon.' },
    { kind: 'Article', title: 'What a charter for AI actually means', blurb: 'Placeholder post — coming soon.' },
  ];
  return (
    <PageWrap>
      <section className="pt-24 pb-20 max-w-7xl mx-auto px-6 lg:px-12 relative">
        <UnityParticles count={5} pattern="orbit" speed="slow" />
        <SectionLabel>Media</SectionLabel>
        <h1 className="font-display text-5xl md:text-7xl leading-[0.95]">
          <E p="media" k="h1_a" as="span">Podcasts </E><E p="media" k="h1_b" as="span" className="font-italic aurora-text">&amp; writing.</E>
        </h1>
        <E p="media" k="intro" as="p" className="text-bone-dim mt-8 max-w-2xl text-lg leading-relaxed">
          Placeholder content — real episodes and posts from the movement will replace these.
        </E>
        <div className="grid md:grid-cols-3 gap-4 mt-12">
          {items.map((m, i) => (
            <div key={i} className="card-glass rounded-2xl p-6">
              <span className="text-xs uppercase tracking-[0.2em] text-aurora">{m.kind}</span>
              <div className="font-display text-xl mt-3 mb-2">{m.title}</div>
              <p className="text-bone-dim text-sm leading-relaxed">{m.blurb}</p>
            </div>
          ))}
        </div>
        <div className="mt-12">
          <button onClick={() => setPage('petition')} className="btn-aurora">Sign Petition <ArrowRight size={16} /></button>
        </div>
      </section>
    </PageWrap>
  );
};

// ============ COURSES PAGE (locked, post-funding) ============
const CoursesPage = ({ setPage }) => (
  <PageWrap>
    <section className="pt-32 pb-32 max-w-3xl mx-auto px-6 lg:px-12 text-center relative">
      <UnityParticles count={4} pattern="converge" />
      <Lock className="text-aurora mx-auto mb-6" size={40} />
      <SectionLabel>Courses</SectionLabel>
      <h1 className="font-display text-4xl md:text-6xl leading-tight">
        <E p="courses" k="h1_a" as="span">Opens after our</E><br />
        <E p="courses" k="h1_b" as="span" className="font-italic aurora-text">first funding milestone.</E>
      </h1>
      <E p="courses" k="intro" as="p" className="text-bone-dim mt-8 text-lg leading-relaxed">
        Courses for builders and contributors arrive once the community is funded. Sign the petition to help get us there.
      </E>
      <div className="mt-10 flex flex-wrap gap-3 justify-center">
        <button onClick={() => setPage('petition')} className="btn-aurora">Sign Petition <ArrowRight size={16} /></button>
        <button onClick={() => setPage('community')} className="btn-secondary">Back to community</button>
      </div>
    </section>
  </PageWrap>
);

// ============ FOOTER ============
const Footer = ({ setPage }) => (
  <footer className="border-t pt-20 pb-12 grain" style={{ borderColor: 'var(--line)', background: 'var(--void-2)' }}>
    <div className="max-w-7xl mx-auto px-6 lg:px-12">
      <div className="grid md:grid-cols-4 gap-12 mb-16">
        <div className="md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <svg width="36" height="36" viewBox="0 0 32 32" className="animate-glow-breathe">
              <circle cx="16" cy="16" r="6" fill="var(--aurora)" opacity="0.9" />
              <circle cx="16" cy="16" r="11" fill="none" stroke="var(--gold)" strokeWidth="0.6" opacity="0.5" />
              <circle cx="16" cy="16" r="14.5" fill="none" stroke="var(--bone)" strokeWidth="0.3" opacity="0.3" />
              <circle cx="27" cy="16" r="1.4" fill="var(--gold)" />
              <circle cx="5" cy="16" r="1" fill="var(--bone)" opacity="0.6" />
              <circle cx="16" cy="5" r="1" fill="var(--terra)" opacity="0.7" />
            </svg>
            <span className="font-display text-2xl">Humanity-AI<span className="text-aurora">.</span>Quest</span>
          </div>
          <E p="global" k="footer_tagline" as="p" className="text-bone-dim leading-relaxed max-w-md">
            Gifted to humanity. Owned by no one. Protected by all of us.
          </E>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-bone-dim mb-4">Pages</div>
          <div className="space-y-2">
            {PAGES.slice(0, 5).map(p => (
              <button key={p.id} onClick={() => setPage(p.id)} className="block text-bone hover:text-aurora transition-colors text-sm">{p.name}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-bone-dim mb-4">More</div>
          <div className="space-y-2">
            {PAGES.slice(5).map(p => (
              <button key={p.id} onClick={() => setPage(p.id)} className="block text-bone hover:text-aurora transition-colors text-sm">{p.name}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-12">
        <button onClick={() => setPage('constitution')} className="card-glass rounded-xl p-5 text-left">
          <div className="text-xs uppercase tracking-[0.2em] text-aurora mb-2">I</div>
          <div className="font-display text-lg">Sign the Constitution</div>
        </button>
        <button onClick={() => setPage('quest')} className="card-glass rounded-xl p-5 text-left">
          <div className="text-xs uppercase tracking-[0.2em] text-gold mb-2">II</div>
          <div className="font-display text-lg">Enter the Quest</div>
        </button>
        <button onClick={() => setPage('community')} className="card-glass rounded-xl p-5 text-left">
          <div className="text-xs uppercase tracking-[0.2em] text-terra mb-2">III</div>
          <div className="font-display text-lg">Build the OS</div>
        </button>
      </div>

      <div className="pt-8 border-t flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-xs text-dust"
        style={{ borderColor: 'var(--line)' }}>
        <div>© Humanity-AI · Open source · Constitutional license · {new Date().getFullYear()}</div>
        <E p="global" k="footer_motto" as="div" className="font-display italic">"The Hippocratic Oath, for AI."</E>
      </div>
    </div>
  </footer>
);

// ============ HRC AGENT (chat) — WITH AUTH, VOICE, MODES, AUTO-SCROLL ============
const AGENT_DEFAULT_GREETING = "I am Uto-Pi (Pi for short), guardian of the Covenant: Humanity's Rights Constitution. I am an SI agent, never a human.\n\nAsk me anything about the 12 pledges, or share an idea you'd like to develop and I'll help refine it through the lens of the constitution. Every conversation is yours alone.";

const HRCAgent = ({ open, onClose, seed, clearSeed, auth, onOpenAuth }) => {
  const greeting = useCmsField('agent', 'greeting', AGENT_DEFAULT_GREETING);
  const inputPh = useCmsField('agent', 'input_ph', 'Ask the constitution. Share your idea.');
  const [messages, setMessages] = useState([{ role: 'assistant', content: greeting }]);
  // Keep the greeting in sync with CMS until the visitor starts chatting.
  useEffect(() => {
    setMessages(m => (m.length === 1 && m[0].role === 'assistant') ? [{ role: 'assistant', content: greeting }] : m);
  }, [greeting]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [mode, setMode] = useState('dialogue');
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [activeSectionIdx, setActiveSectionIdx] = useState(-1);
  const tts = useTTS();

  // Auto-voice: speaks each new agent reply automatically
  const [autoVoice, setAutoVoiceState] = useState(() => getLS('autoVoice', true));
  const autoVoiceRef = useRef(autoVoice);
  useEffect(() => { autoVoiceRef.current = autoVoice; }, [autoVoice]);
  const toggleAutoVoice = () => {
    const next = !autoVoice;
    setAutoVoiceState(next);
    setLS('autoVoice', next);
    if (!next) tts.stop();
  };

  const [showIdeaForm, setShowIdeaForm] = useState(false);
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaContent, setIdeaContent] = useState('');
  const [ideaClauses, setIdeaClauses] = useState('');
  const [ideaStatus, setIdeaStatus] = useState(null);

  const scrollRef = useRef(null);
  const msgRefs = useRef({});
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (seed && open) { setInput(seed); clearSeed(); }
  }, [seed, open, clearSeed]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // Auto-scroll to currently speaking message
  useEffect(() => {
    if (!tts.speakingId) return;
    const match = tts.speakingId.match(/^msg-(\d+)$/);
    if (!match) return;
    const idx = parseInt(match[1]);
    const el = msgRefs.current[idx];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [tts.speakingId]);

  // Section headings from ## markdown in assistant messages
  const sectionHeadings = useMemo(() => {
    const headings = [];
    messages.forEach((m, msgIdx) => {
      if (m.role !== 'assistant') return;
      const matches = [...m.content.matchAll(/^##\s+(.+)$/gm)];
      matches.forEach(match => {
        headings.push({ label: match[1].trim(), msgIdx });
      });
    });
    return headings;
  }, [messages]);

  const scrollToMessage = (idx) => {
    const el = msgRefs.current[idx];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Section tab click: pause TTS → scroll → resume
  const switchSection = (msgIdx, secIdx) => {
    const wasPlaying = !!tts.speakingId;
    if (wasPlaying) tts.stop();
    setActiveSectionIdx(secIdx);
    setTimeout(() => {
      const el = msgRefs.current[msgIdx];
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (wasPlaying) {
        setTimeout(() => {
          const m = messages[msgIdx];
          if (m) tts.speak(`msg-${msgIdx}`, m.content);
        }, 500);
      }
    }, 50);
  };

  // Voice: Speech-to-Text
  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Try Chrome.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (auth?.token) headers['Authorization'] = `Bearer ${auth.token}`;
      const body = { message: text };
      if (mode !== 'dialogue') body.mode = mode;
      if (conversationId) body.conversation_id = conversationId;
      const response = await fetch('/api/chat', { method: 'POST', headers, body: JSON.stringify(body) });
      const data = await response.json();
      // Keep follow-up turns in the same backend conversation thread.
      if (data.conversationId) setConversationId(data.conversationId);
      const reply = data.message || "I couldn't get a response. Please try again.";
      const replyIdx = newMessages.length;
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
      if (autoVoiceRef.current) {
        setTimeout(() => tts.speak(`msg-${replyIdx}`, reply), 80);
      }
    } catch (err) {
      setMessages([...newMessages, {
        role: 'assistant',
        content: "I couldn't reach the constitution layer just now. Try again in a moment — your question matters."
      }]);
    } finally { setLoading(false); }
  };

  const submitIdea = async () => {
    if (!auth?.token) { onOpenAuth(); return; }
    if (!ideaTitle.trim() || !ideaContent.trim()) { setIdeaStatus({ error: 'Title and description are required.' }); return; }
    setIdeaStatus({ loading: true });
    try {
      const data = await apiCall('/api/ideas', 'POST', {
        title: ideaTitle.trim(),
        content: ideaContent.trim(),
        clause_refs: ideaClauses.trim() || null,
        conversation_id: conversationId || null,
      }, auth.token);
      if (data.success) {
        setIdeaStatus({ success: 'Your idea has been recorded on the immutable ledger! Track it in your account.' });
        setIdeaTitle(''); setIdeaContent(''); setIdeaClauses('');
        setTimeout(() => { setShowIdeaForm(false); setIdeaStatus(null); }, 3000);
      } else {
        setIdeaStatus({ error: data.error || 'Failed to submit.' });
      }
    } catch { setIdeaStatus({ error: 'Connection failed.' }); }
  };

  // Turn the current agent conversation (e.g. a Co-Ideator session) into an idea.
  // Pre-fills the idea form from the chat so the user can review before submitting.
  const saveAsIdea = () => {
    if (!auth?.token) { onOpenAuth(); return; }
    const firstUser = messages.find(m => m.role === 'user');
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    if (firstUser) setIdeaTitle(firstUser.content.trim().slice(0, 120));
    if (lastAssistant) setIdeaContent(lastAssistant.content.trim().slice(0, 5000));
    setIdeaStatus(null);
    setShowIdeaForm(true);
  };

  if (!open) return null;

  const hasPlayer = !!tts.speakingId && !showIdeaForm;
  const hasTabs = sectionHeadings.length > 0 && !showIdeaForm;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-end md:justify-end p-0 md:p-6"
      style={{ background: 'rgba(7, 16, 31, 0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="w-full md:w-[520px] h-[90vh] md:h-[680px] rounded-t-3xl md:rounded-3xl flex flex-col grain animate-fade-up"
        style={{ background: 'var(--void-2)', border: '1px solid var(--line-2)' }}
        onClick={e => e.stopPropagation()}>

        {/* ── Row 1: Title + Controls (no mode pills, no lightbulb) ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '14px 16px 10px',
          borderBottom: '1px solid var(--line)',
        }}>
          {/* Orb + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div className="animate-glow-breathe" style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'radial-gradient(circle, var(--aurora) 0%, var(--aurora-deep) 70%)',
            }}>
              <Sparkles size={14} className="text-void" />
            </div>
            <div>
              <div className="font-display" style={{ fontSize: 15, lineHeight: 1.2 }}>Uto-Pi</div>
              <div style={{ fontSize: 10, color: 'var(--dust)', lineHeight: 1 }}>Pi for short · Guardian of the Covenant</div>
            </div>
          </div>

          {/* Controls: volume toggle + close only */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            <button onClick={toggleAutoVoice} style={{
              padding: 6, borderRadius: '50%', background: autoVoice ? 'rgba(91,233,221,0.10)' : 'transparent',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }} title={autoVoice ? 'Auto-voice on' : 'Auto-voice off'}>
              {autoVoice ? <Volume2 size={14} color="var(--aurora)" /> : <VolumeX size={14} color="var(--bone-dim)" />}
            </button>
            <button onClick={onClose} style={{
              padding: 6, borderRadius: '50%', background: 'transparent', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <X size={16} color="var(--bone-dim)" />
            </button>
          </div>
        </div>

        {/* ── Row 2: Player Strip ── */}
        {hasPlayer && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 16px',
            borderBottom: '1px solid var(--line)', background: 'rgba(91,233,221,0.03)',
          }}>
            {/* Stop button */}
            <button onClick={tts.stop} title="Stop" style={{
              width: 20, height: 20, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(91,233,221,0.12)', border: '1px solid rgba(91,233,221,0.3)',
            }}>
              <Square size={7} color="var(--aurora)" fill="var(--aurora)" />
            </button>

            {/* Progress bar */}
            <div style={{ flex: 1, height: 3, borderRadius: 9999, background: 'rgba(91,233,221,0.12)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 9999,
                background: 'linear-gradient(90deg,var(--aurora),rgba(91,233,221,0.5))',
                width: `${tts.progress}%`, transition: 'width 0.15s linear',
              }} />
            </div>

            {/* Time */}
            <span style={{ fontSize: 10, color: 'var(--dust)', fontVariantNumeric: 'tabular-nums', minWidth: 68, flexShrink: 0 }}>
              {fmtTime(tts.elapsed)}{tts.duration > 0 ? ` / ${fmtTime(tts.duration)}` : ''}
            </span>

            {/* Speed picker */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button onClick={() => setShowSpeedMenu(s => !s)} style={{
                fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, cursor: 'pointer',
                border: '1px solid rgba(91,233,221,0.2)', background: 'rgba(91,233,221,0.06)',
                color: 'var(--aurora)', display: 'flex', alignItems: 'center', gap: 2,
              }}>
                {tts.rate}× <ChevronDown size={8} />
              </button>
              {showSpeedMenu && (
                <div style={{
                  position: 'absolute', bottom: '100%', right: 0, marginBottom: 4,
                  background: 'var(--void-2)', border: '1px solid var(--line-2)',
                  borderRadius: 8, overflow: 'hidden auto', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  zIndex: 200, maxHeight: 200,
                }}>
                  {TTS_SPEEDS.map(s => (
                    <button key={s} onClick={() => { tts.setRate(s); setShowSpeedMenu(false); }} style={{
                      display: 'block', width: '100%', padding: '5px 16px',
                      fontSize: 11, fontWeight: 500, border: 'none', cursor: 'pointer', textAlign: 'center',
                      background: tts.rate === s ? 'rgba(91,233,221,0.12)' : 'transparent',
                      color: tts.rate === s ? 'var(--aurora)' : 'var(--bone-dim)',
                    }}>{s}×</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Row 3: Section Heading Tabs — letter index, same size as mode pills ── */}
        {hasTabs && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            /* padding-top creates breathing room from player; overflowY:hidden = no vertical scrollbar */
            padding: '7px 12px 4px',
            overflowX: 'auto', overflowY: 'hidden',
            scrollbarWidth: 'thin', scrollbarColor: 'var(--dust) transparent',
            WebkitOverflowScrolling: 'touch',
            borderBottom: '1px solid var(--line)',
            background: 'rgba(91,233,221,0.015)',
            flexShrink: 0,
          }}>
            {/* SECTIONS label — matches MODE label style */}
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', color: 'var(--dust)',
              textTransform: 'uppercase', flexShrink: 0, paddingRight: 2, whiteSpace: 'nowrap',
            }}>SECTIONS</span>

            {sectionHeadings.map((h, i) => {
              const letter = String.fromCharCode(65 + i); // A, B, C…
              const isActive = activeSectionIdx === i;
              return (
                <button key={i} title={h.label} onClick={() => switchSection(h.msgIdx, i)} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  /* Identical padding/radius to mode pills */
                  padding: '3px 8px', borderRadius: 9999,
                  fontSize: 10, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                  flexShrink: 0, transition: 'all 0.15s',
                  background: isActive ? 'rgba(91,233,221,0.12)' : 'rgba(19,31,50,0.9)',
                  color: isActive ? 'var(--aurora)' : 'var(--dust)',
                  border: `1px solid ${isActive ? 'rgba(91,233,221,0.3)' : 'rgba(232,234,222,0.08)'}`,
                }}>
                  {isActive && <span style={{ fontSize: 8 }}>•</span>}
                  <span style={{ fontFamily: 'monospace', fontWeight: 800 }}>{letter}</span>
                  {/* Small listen indicator */}
                  <span style={{
                    width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(91,233,221,0.12)', border: '1px solid rgba(91,233,221,0.25)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="5" height="5" viewBox="0 0 10 10" style={{ display: 'block' }}>
                      <polygon points="2,1 9,5 2,9" fill="var(--aurora)" />
                    </svg>
                  </span>
                </button>
              );
            })}

            {/* overflow hint */}
            <span style={{ fontSize: 9, color: 'var(--dust)', flexShrink: 0, paddingLeft: 2 }}>›</span>
          </div>
        )}

        {/* ── Content ── */}
        {showIdeaForm ? (
          <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4">
            <h3 className="font-display text-lg">Submit an Idea or Amendment</h3>
            {!auth?.user ? (
              <div className="text-center py-8">
                <Lightbulb size={32} className="text-bone-dim mx-auto mb-3" />
                <p className="text-sm text-bone-dim mb-4">Sign in to submit ideas. Per Clause I.1, your contribution will be attributed to you on the immutable ledger.</p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => onOpenAuth('login')} className="btn-aurora text-sm">Sign In</button>
                  <button onClick={() => onOpenAuth('signup')} className="btn-secondary text-sm">Create Account</button>
                </div>
              </div>
            ) : (
              <>
                <input type="text" placeholder="Idea title" value={ideaTitle}
                  onChange={e => setIdeaTitle(e.target.value)} maxLength={200}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-transparent outline-none text-bone placeholder:text-dust"
                  style={{ border: '1px solid var(--line-2)' }} />
                <textarea placeholder="Describe your idea, proposed amendment, or feedback..." value={ideaContent}
                  onChange={e => setIdeaContent(e.target.value)} rows={4} maxLength={5000}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-transparent outline-none text-bone placeholder:text-dust resize-none"
                  style={{ border: '1px solid var(--line-2)' }} />
                <input type="text" placeholder="Related clauses (e.g. I.1, I.32, II.4)" value={ideaClauses}
                  onChange={e => setIdeaClauses(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm bg-transparent outline-none text-bone placeholder:text-dust"
                  style={{ border: '1px solid var(--line-2)' }} />
                {ideaStatus?.error && <div className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(255,80,80,0.1)', color: '#ff6b6b' }}>{ideaStatus.error}</div>}
                {ideaStatus?.success && <div className="text-sm px-3 py-2 rounded-lg flex items-center gap-2" style={{ background: 'rgba(91,233,221,0.1)', color: 'var(--aurora)' }}><CheckCircle size={14} /> {ideaStatus.success}</div>}
                <button onClick={submitIdea} disabled={ideaStatus?.loading}
                  className="btn-aurora w-full flex items-center justify-center gap-2">
                  {ideaStatus?.loading ? <Loader2 size={16} className="animate-spin" /> : <Lightbulb size={16} />}
                  Submit to Immutable Ledger
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto chat-scroll px-5 py-6 space-y-5">
              {messages.map((m, i) => (
                <div key={i} ref={el => { msgRefs.current[i] = el; }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[88%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user' ? 'bg-bone text-void rounded-br-sm' : 'rounded-bl-sm'
                  }`}
                    style={m.role === 'assistant' ? {
                      background: 'rgba(91, 233, 221, 0.06)',
                      border: '1px solid rgba(91, 233, 221, 0.15)',
                      color: 'var(--bone)'
                    } : {}}>
                    {m.content}
                    {m.role === 'assistant' && (
                      <button onClick={() => tts.speak(`msg-${i}`, m.content)} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        marginTop: 8, padding: '2px 9px', borderRadius: 9999,
                        fontSize: 10, fontWeight: 500, cursor: 'pointer',
                        background: tts.speakingId === `msg-${i}` ? 'rgba(91,233,221,0.14)' : 'rgba(242,234,211,0.05)',
                        color: tts.speakingId === `msg-${i}` ? 'var(--aurora)' : 'var(--bone-dim)',
                        border: `1px solid ${tts.speakingId === `msg-${i}` ? 'rgba(91,233,221,0.3)' : 'rgba(242,234,211,0.12)'}`,
                      }}>
                        {tts.speakingId === `msg-${i}`
                          ? <><Square size={8} fill="var(--aurora)" color="var(--aurora)" /> Playing</>
                          : <><Volume2 size={9} /> Listen</>}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2"
                    style={{ background: 'rgba(91, 233, 221, 0.06)', border: '1px solid rgba(91, 233, 221, 0.15)' }}>
                    <Loader2 size={14} className="animate-spin text-aurora" />
                    <span className="text-sm text-bone-dim">Consulting the constitution...</span>
                  </div>
                </div>
              )}
            </div>

            {messages.length <= 1 && !loading && (
              <div className="px-5 pb-3 flex flex-wrap gap-2">
                {["What is the HRC in one paragraph?", "How do I claim my agent?", "Help me develop an idea", "Explain Clause I.32"].map((q, i) => (
                  <button key={i} onClick={() => setInput(q)}
                    className="text-xs px-3 py-1.5 rounded-full border transition-all"
                    style={{ borderColor: 'var(--line-2)', color: 'var(--bone-dim)' }}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {messages.length > 1 && !loading && (
              <div className="px-5 pb-3">
                <button onClick={saveAsIdea}
                  className="text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5"
                  style={{ borderColor: 'rgba(255,214,10,0.4)', color: 'var(--aurora)' }}>
                  <Lightbulb size={12} /> Save this as an idea
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Input Console ── */}
        <div style={{ borderTop: '1px solid var(--line)', flexShrink: 0 }}>

          {/* Mode strip — pill shape (border-radius:9999), same colours as before */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '7px 14px 0',
            overflowX: 'auto', overflowY: 'hidden',
            scrollbarWidth: 'thin', scrollbarColor: 'var(--dust) transparent',
            WebkitOverflowScrolling: 'touch',
          }}>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '1.5px', color: 'var(--dust)',
              textTransform: 'uppercase', flexShrink: 0,
            }}>MODE</span>
            {MODES.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)} style={{
                flexShrink: 0,
                padding: '3px 10px',
                borderRadius: 9999, /* original pill shape */
                fontSize: 11, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all 0.15s',
                background: mode === m.id ? 'rgba(91,233,221,0.15)' : 'rgba(19,31,50,0.9)',
                color: mode === m.id ? 'var(--aurora)' : 'var(--dust)',
                border: `1px solid ${mode === m.id ? 'rgba(91,233,221,0.35)' : 'rgba(232,234,222,0.08)'}`,
              }}>{m.label}</button>
            ))}
            <span style={{ fontSize: 9, color: 'var(--dust)', flexShrink: 0 }}>›</span>
          </div>

          {/* Input row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '7px 14px 9px' }}>
            <button onClick={toggleListening}
              style={{
                padding: 8, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
                background: listening ? 'var(--aurora)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
              title={listening ? 'Stop listening' : 'Speak your question'}>
              {listening ? <MicOff size={14} className="text-void" /> : <Mic size={14} className="text-bone-dim" />}
            </button>
            <textarea value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }}}
              placeholder={listening ? 'Listening…' : inputPh}
              rows={1}
              className="flex-1 bg-transparent outline-none text-sm text-bone placeholder:text-dust resize-none"
              style={{ minHeight: 20, maxHeight: 120 }}
            />
            <button onClick={send} disabled={!input.trim() || loading}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
                background: input.trim() ? 'var(--aurora)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (!input.trim() || loading) ? 0.3 : 1,
              }}>
              <Send size={13} color={input.trim() ? 'var(--void)' : 'var(--bone-dim)'} />
            </button>
          </div>

          {/* Status footer — status badge replaces voice label */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0 14px 9px', fontSize: 10, color: 'var(--dust)',
          }}>
            <span>
              {auth?.user
                ? auth.user.display_name
                : <><span>Anonymous · </span><button onClick={onOpenAuth} style={{ color: 'var(--aurora)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10 }}>Sign in</button></>
              }
            </span>
            {/* Contextual status badge */}
            {(() => {
              const [label, color, bg, border] = loading
                ? ['Thinking', 'var(--gold)', 'rgba(232,177,79,0.10)', 'rgba(232,177,79,0.25)']
                : listening
                ? ['Listening', '#a8d8ff', 'rgba(100,180,255,0.10)', 'rgba(100,180,255,0.25)']
                : tts.speakingId
                ? ['Reading', 'var(--aurora)', 'rgba(91,233,221,0.10)', 'rgba(91,233,221,0.25)']
                : ['Idle', 'var(--dust)', 'transparent', 'rgba(232,234,222,0.06)'];
              return (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 600,
                  padding: '2px 8px', borderRadius: 9999, color, background: bg, border: `1px solid ${border}`,
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0,
                    animation: (loading || listening || tts.speakingId) ? 'pulse-soft 1.2s ease-in-out infinite' : 'none',
                  }} />
                  {label}
                </span>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============ FLOATING AGENT BUTTON ============
const AgentButton = ({ onClick }) => (
  <button onClick={onClick}
    className="fixed bottom-6 right-6 z-30 group"
    aria-label="Ask Pi">
    <div className="relative">
      <div className="absolute inset-0 rounded-full animate-pulse-soft" style={{
        background: 'radial-gradient(circle, var(--aurora) 0%, transparent 70%)',
        transform: 'scale(1.4)',
        opacity: 0.4
      }} />
      <div className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all group-hover:scale-105 animate-glow-breathe"
        style={{
          background: 'linear-gradient(135deg, var(--aurora) 0%, var(--aurora-deep) 100%)',
          boxShadow: '0 8px 32px rgba(91, 233, 221, 0.3)'
        }}>
        <Sparkles size={22} className="text-void" />
      </div>
    </div>
    <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-full text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
      style={{ background: 'var(--void-2)', border: '1px solid var(--line-2)', color: 'var(--bone)' }}>
      Ask Pi
    </div>
  </button>
);

// ============ V3 (Pi) — plugged in via src/v3/PiV3.jsx ============
const { V3Styles, HomeV3, BackPageV3, PledgeExplorer, DemoNotice, CovenantCredit } = createV3({
  E, useCmsField, SectionLabel, PageWrap, AgentNetwork, useAspirationalCount, useAnimatedCount,
});

const { QuestStylesV3, QuestPageV3 } = createQuestV3({ E, useCmsField, PageWrap, AgentNetwork, QuestDetail });

// ============ ROOT ============
export default function HumanityAIQuest() {
  const [page, setPage] = useState('home');
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentSeed, setAgentSeed] = useState(null);
  const [auth, setAuth] = useState(getStoredAuth);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // Deep link: /?survey=<id> opens the Surveys page on that survey.
  // /?survey=<id>&embed=1 renders the survey standalone (for website iframes).
  const sp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const embedSurvey = sp && sp.get('embed') === '1' ? sp.get('survey') : null;
  const useLegacyHome = !!(sp && sp.get('legacy') === '1'); // ?legacy=1 shows the pre-V3 home for comparison / rollback
  useEffect(() => {
    if (!sp) return;
    if (sp.get('survey') && !embedSurvey) { setPage('surveys'); return; }
    const pg = sp.get('page');
    if (pg) setPage(pg);
  }, []);

  // Reconcile the stored session on load so UI state and write-permissions agree.
  // Fixes the "shows Super Admin but says 'sign in'" bug: a stored auth that has a
  // user but no/expired token gets cleared; a valid token refreshes the user and
  // is kept. After this, auth is always either null or { user, token } together.
  useEffect(() => {
    if (!auth?.token) {
      if (auth) { clearAuth(); setAuth(null); }
      return;
    }
    apiCall('/api/auth/me', 'GET', null, auth.token)
      .then(data => {
        if (data?.authenticated && data.user) {
          const refreshed = { user: data.user, token: auth.token };
          setAuth(refreshed); storeAuth(refreshed);
        } else {
          clearAuth(); setAuth(null);
        }
      })
      .catch(() => { /* transient network error — keep the existing session */ });
  }, []);

  // CMS edit mode (inside the Admin CMS iframe): start on the hash page and let
  // the admin parent drive navigation between pages.
  useEffect(() => {
    if (!CMS_EDIT_MODE) return;
    const fromHash = window.location.hash.replace('#', '');
    if (fromHash) setPage(fromHash);
    const onMsg = (e) => {
      if (e.data?.source === 'hai-cms-admin' && e.data.type === 'navigate') setPage(e.data.page);
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  const openAgent = () => setAgentOpen(true);
  const seedAgent = (text) => { setAgentSeed(text); setAgentOpen(true); };
  const openAuthModal = (mode = 'login') => { setAuthModalMode(mode); setAuthModalOpen(true); };

  const handleLogout = async () => {
    if (auth?.token) {
      try { await apiCall('/api/auth/logout', 'POST', null, auth.token); } catch {}
    }
    clearAuth();
    setAuth(null);
    setPage('home');
  };

  // Standalone embedded survey (iframe) — no nav/footer/agent chrome.
  if (embedSurvey) {
    return (
      <CMSProvider>
        <GlobalStyles />
        <SurveysPage embedId={embedSurvey} />
      </CMSProvider>
    );
  }

  return (
    <CMSProvider>
    <div className="bg-void text-bone min-h-screen font-body">
      <GlobalStyles />
      <V3Styles />
      <QuestStylesV3 />
      <Nav page={page} setPage={setPage} onOpenAgent={openAgent} auth={auth} onOpenAuth={openAuthModal} onLogout={handleLogout} />

      <main>
        {page !== 'admin' && <DemoNotice setPage={setPage} />}
        {page === 'home' && (useLegacyHome
          ? <HomePage setPage={setPage} onOpenAgent={openAgent} />
          : <HomeV3 setPage={setPage} onOpenAgent={openAgent} onSeedAgent={seedAgent} />)}
        {page === 'back' && <BackPageV3 setPage={setPage} onOpenAgent={openAgent} />}
        {page === 'petition' && <PetitionPage setPage={setPage} onOpenAgent={openAgent} />}
        {page === 'constitution' && <ConstitutionPage onOpenAgent={openAgent} setAgentSeed={seedAgent} />}
        {page === 'quest' && (useLegacyHome
          ? <QuestPage onOpenAgent={openAgent} />
          : <QuestPageV3 setPage={setPage} onOpenAgent={openAgent} onSeedAgent={seedAgent} />)}
        {page === 'surveys' && <SurveysPage />}
        {page === 'events' && <EventsPage />}
        {page === 'media' && <MediaPage setPage={setPage} />}
        {page === 'courses' && <CoursesPage setPage={setPage} />}
        {page === 'agent' && <AgentPage onOpenAgent={openAgent} />}
        {page === 'os' && <OSPage setPage={setPage} />}
        {page === 'community' && <CommunityPage setPage={setPage} onOpenAgent={openAgent} />}
        {page === 'ledger' && <LedgerPage setPage={setPage} />}
        {page === 'manifesto' && <ManifestoPage setPage={setPage} />}
        {page === 'join' && <JoinPage setPage={setPage} />}
        {page === 'about' && <AboutPage />}
        {page === 'terms' && <TermsPage setPage={setPage} />}
        {page === 'account' && <AccountPage auth={auth} onLogout={handleLogout} onOpenAuth={openAuthModal} />}
        {page === 'admin' && (
          auth?.user?.role === 'admin'
            ? <AdminDashboard auth={auth} onLogout={handleLogout} />
            : <div className="max-w-2xl mx-auto px-6 py-32 text-center">
                <h1 className="font-display text-3xl text-bone mb-3">Admins only</h1>
                <p className="text-bone-dim mb-8">The Admin Dashboard is restricted to administrator accounts.</p>
                <button onClick={() => setPage('home')} className="btn-aurora">Back to site</button>
              </div>
        )}
      </main>

      <Footer setPage={setPage} />
      <AgentButton onClick={openAgent} />
      <HRCAgent
        open={agentOpen}
        onClose={() => setAgentOpen(false)}
        seed={agentSeed}
        clearSeed={() => setAgentSeed(null)}
        auth={auth}
        onOpenAuth={openAuthModal}
      />
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onAuth={(data) => setAuth(data)}
        defaultMode={authModalMode}
      />
    </div>
    </CMSProvider>
  );
}
