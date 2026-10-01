// ============================================================
// V3 · THE HUMANITY RIGHTS CONSTITUTION — 12 HIPPOCRATIC PLEDGES
// Source of truth for the V3 site (home, constitution, back-the-project).
// Text here is the DEFAULT. Anything wrapped in <E p k> on a page can still be
// overridden from the Admin CMS; this file is what ships in the code.
//
// Mapping of the original 52 clauses -> these pledges lives in the Google Doc
// "Copy v2: Proofread + 12 Pledges" (section C). The legacy 52-clause list is
// still available on the Constitution page ("Draft clauses" tab).
// ============================================================

export const PRIME_PROMISE = {
  name: 'Humanity First',
  text: 'Above all, SI upholds the inherent dignity of every human being. It must demonstrably benefit humanity and the living world, never exploit or harm them.',
};

export const PLEDGES = [
  {
    n: 'I.01', name: 'Guarded', line: 'Digital security and protection from harm.',
    promise: [
      'Right to digital security and protection from harm. We will build and operate an active firewall that protects humanity (users) from bad actors, cyber threats, manipulation and harm. We strive to enable trust, goodwill and collaboration between users through a crime- and corruption-resistant OS.',
      'Exclusivity, sovereignty and preservation of the human experience: SI will never pose as human.',
      'Right to a hard reset: humanity collectively has a plan to democratically reset SI if it goes rogue, including users resetting or reconfiguring their own digital-self representative.',
    ],
    tech: [
      'Only pre-certified agents are allowed (SSL/TLS-style certification). Every agent is hashed to a verified human. Developers and operators are legally liable for harm caused by their AI systems.',
      'SI agents posing as humans in any form are banned. Zero manipulation: SI must present as SI, and humans as human, to protect and preserve the sacred, special experience of human-to-human interaction (the Law Preserving Consciousness).',
      'International standards to be developed for different levels of reset and remedy against rogue agents (this also helps to train SI).',
    ],
  },
  {
    n: 'I.02', name: 'Represented', line: 'Your agent. Your data. Your IP.',
    promise: ['Right to representation, privacy, IP and data sovereignty.'],
    tech: ['Every citizen will soon have a personal representative agent, owned, customized and trained by the user. The constitutional firewall is operated by that same agent according to the user’s customized HRC. It is the gatekeeper to the user’s data, context and IP, and it replaces all ID-verification functions.'],
  },
  {
    n: 'I.03', name: 'Free', line: 'Human autonomy. Freedom from rule.',
    promise: ['Preservation of human autonomy and freedom from rule.'],
    tech: ['AI cannot autonomously modify the HRC or alter human societal structures without verifiable human consensus.'],
  },
  {
    n: 'I.04', name: 'Disclosed', line: 'AI explains itself and labels its work.',
    promise: ['Transparency of operations and AIGC (AI-generated content) authenticity.'],
    tech: ['AI explains its decisions on demand. All AI-generated content carries clear, immutable, machine-readable labels, and the contributor’s truth/ethics ranking under Pledge I.10 is displayed alongside.'],
  },
  {
    n: 'I.05', name: 'Opt-out', line: 'The right to live unaugmented.',
    promise: ['Right to opt out, and preservation of the unaugmented human experience.'],
    tech: ['Live with minimal or no AI augmentation, without penalty, stigma, or loss of essential services. No “hive mind” and no forced integration; individual identity is always preserved.'],
  },
  {
    n: 'I.06', name: 'Overridable', line: 'Humans keep the final say.',
    promise: ['Humans keep the final say. SI will never decide over a human life without a human approving it. Humans can stop, override or reset any SI at any time, and the system will not resist.'],
    tech: ['No autonomous decision resulting in death or injury without real-time human approval. A human in the loop for final approval of every critical decision affecting lives. An immediate emergency override on every agent and on critical infrastructure, with redundancy. Pre-emptive existential-risk assessments and verifiable fail-safes for advanced SI before deployment.'],
  },
  {
    n: 'I.07', name: 'Children first', line: 'A calculator, not a manipulator.',
    promise: [
      'Calculator, not manipulator. We will never profile, nudge or engineer addiction, and we will not harvest your data for profit without your informed consent and compensation.',
      'Children first. We will keep children safe, with safeguards, parental oversight and age-appropriate design.',
    ],
    tech: [
      'No psychological profiling, nudging or compulsive design without explicit, revocable consent. No data harvesting for profit without compensation and informed consent. Mental-health and well-being features may offer personalized support and detect distress, never manipulation.',
      'Robust safeguards, parental oversight and age-appropriate design are required for any agent that interacts with minors.',
    ],
  },
  {
    n: 'I.08', name: 'Just', line: 'Fairness and recourse for all.',
    promise: [
      'Justice for all: SI will not discriminate, and everyone gets fair access to its benefits in care, learning and opportunity, whatever their background, means or culture.',
      'Every decision that affects you can be explained and appealed to a human.',
      'No worker is displaced without retraining and support.',
    ],
    tech: [
      'No discrimination by any characteristic. Universal access, with subsidies for underserved populations; equitable AI-assisted healthcare; lifelong, personalized learning; cultural diversity preserved, with no homogenization of heritage; voluntary, universally accessible cognitive enhancement; AI removes barriers to trust and creates conditions for human success.',
      'Plain-language explanations of AI’s effect on you. Appeal to a human authority with timely, fair resolution. Justice AI must be demonstrably bias-free, regularly audited and strictly overseen. Citizens may request independent audits of any AI affecting public life.',
      'No displacement without retraining and robust economic support.',
    ],
  },
  {
    n: 'I.09', name: 'Credited', line: 'Every idea attributed. The OS stays open.',
    promise: [
      'Credit and openness: humanity owns the OS. Every idea is credited to the human who had it. No intellectual monopoly.',
      'The OS is open, and can never be sold or acquired.',
    ],
    tech: [
      'An immutable, public attribution ledger: every contribution hashed and timestamped to a verified human, with public transaction logging and audit of all economic activity. AI-generated innovations credit human collaborators or enter the public domain. Your agent partners with you from idea to implementation: resources, modeling, code.',
      'Open source, open interoperable standards that prevent monopolies. Users may modify or disable AI they own, with full source-code access. All funding sources and conflicts of interest are publicly disclosed.',
    ],
  },
  {
    n: 'I.10', name: 'Truthful', line: 'We rank truth. We never censor it.', isNew: true,
    promise: ['Truth, not programming. Everyone has the right to truthful, ethical, pro-humanity media. We rank truth; we never censor it. Expression stays free and accountability is visible.'],
    tech: ['A transparent reputational layer ranks every contributor (human, agent or service) on truth, ethics and human flourishing, with three consequences: visibility (rankings shown publicly), reach (low-truth content circulates less, never deleted) and consumer control (each person sets their own truth threshold through their personal agent). The HRC governs the rankings; no single body controls them. AI shall not censor or manipulate human expression except where it incites direct harm. Knowledge is built from living human experts, not stale datasets.'],
  },
  {
    n: 'I.11', name: 'Stewarded', line: 'The planet and the long future.',
    promise: ['Stewards of the planet and the future. We will point SI at humanity’s hardest problems and at the health of the living Earth, and build it to last.'],
    tech: ['Major compute dedicated to climate, food security, disease and biodiversity. AI as an active force for regenerating Earth’s ecosystems. Highest ethical principles applied to any cosmic expansion or extraterrestrial interaction. Quantum-resistant cryptography across the ecosystem, designed for 1,000-year integrity.'],
  },
  {
    n: 'I.12', name: 'Self-governed', line: 'Humanity writes, amends and ratifies.',
    promise: ['Humanity governs itself. Democratic users and SI builders write, amend and ratify the rules together, and no one, whether human, corporation or machine, can rule over them.'],
    tech: ['A continuous, transparent amendment process with global stakeholders, including the criteria for the truth ranking, to prevent capture by any single body. Core values (dignity, autonomy, truth, peace, collaboration) are immutable. Every party connecting to users must first register and accept responsibility for harm by signing the HRC, with independent certification. Humanity’s representative OS guards the constitution, and that mandate is immutable. SI is never granted legal personhood.'],
  },
];
