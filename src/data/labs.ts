export type LabSlug = 'cloud-erp' | 'buildproof-ai' | 'energymat-ml' | 'fieldsync-mobile'

export interface PortfolioLab {
  slug: LabSlug
  index: string
  category: string
  title: string
  eyebrow: string
  summary: string
  problem: string
  outcome: string
  stack: string[]
  capabilities: string[]
  architecture: string[]
  demoLabel: string
  metric: string
  status: 'verified' | 'in-progress' | 'planned'
  statusLabel: string
  modules: string[]
  productKey?: 'buildproof' | 'crestview'
  recording?: {
    src: string
    label: string
    duration: string
  }
}

export const portfolioLabs: PortfolioLab[] = [
  {
    slug: 'cloud-erp',
    index: '01',
    category: 'Multi-tenant operations',
    title: 'Crestview to Cloud ERP',
    eyebrow: 'ERP foundation extraction',
    summary: 'A real school-operations system being systematically extracted into a role-aware cloud ERP foundation for inventory, billing, workflows, and auditability.',
    problem: 'School operations already require the same difficult foundations as an ERP: people, roles, finance, inventory, approvals, reporting, and accountable history.',
    outcome: 'Crestview remains the working education product while its reusable tenant, access, finance, inventory, workflow, and audit patterns are extracted into Cloud ERP core.',
    stack: ['React', 'Supabase', 'PostgreSQL + RLS', 'Realtime', 'Vercel'],
    capabilities: ['Role-based access', 'Finance and inventory foundations', 'Workflow automation', 'Audited operational history'],
    architecture: ['Next.js workspaces', 'Supabase Auth + RLS', 'Tenant-aware PostgreSQL', 'Events and audit log'],
    demoLabel: 'Review ERP foundation',
    metric: '30+ operating suites',
    status: 'in-progress',
    statusLabel: 'Real Crestview source · ERP extraction in progress',
    modules: ['Identity and role access', 'Admissions and CRM', 'Billing and finance', 'Inventory and transport', 'Operations reporting'],
    productKey: 'crestview',
    recording: {
      src: '/media/crestview-school.mp4',
      label: 'Crestview operations dashboard recording',
      duration: '00:06',
    },
  },
  {
    slug: 'buildproof-ai',
    index: '02',
    category: 'Industrial intelligence',
    title: 'BuildProof AI',
    eyebrow: 'Construction and material audit',
    summary: 'A document-to-decision workspace that compares bills of quantities, receipts, and delivery evidence to surface material variance before it becomes a loss.',
    problem: 'Project teams struggle to see price drift, unexplained consumption, and missing delivery confirmation across a live build.',
    outcome: 'A focused, real construction-control product that turns project evidence into reviewable risks and an understandable project health view.',
    stack: ['React', 'FastAPI', 'Pandas', 'PostgreSQL', 'Recharts'],
    capabilities: ['BoQ and receipt intake', 'Variance detection', 'Material burn-rate tracking', 'Review queue and evidence trail'],
    architecture: ['Evidence intake', 'Parsing service', 'Variance engine', 'Audit dashboard'],
    demoLabel: 'Load sample audit',
    metric: '12 controlled workflows',
    status: 'verified',
    statusLabel: 'Real BuildProof source · production build verified',
    modules: ['BoQ and procurement control', 'Delivery evidence', 'Technical verification', 'Exceptions and audit events', 'RFIs, submittals, and change orders'],
    productKey: 'buildproof',
  },
  {
    slug: 'energymat-ml',
    index: '03',
    category: 'Applied machine learning',
    title: 'EnergyMat ML Studio',
    eyebrow: 'Solar materials stability',
    summary: 'An explainable prediction experience for renewable-energy materials, comparing model behaviour while exposing the inputs that most affect degradation and efficiency.',
    problem: 'Research models are often hard to inspect, compare, or explain to engineering teams outside the notebook.',
    outcome: 'An interactive feature playground with model comparisons, stability forecasts, error measures, and feature-level explanation.',
    stack: ['Python', 'Scikit-learn', 'PyTorch', 'Plotly', 'React'],
    capabilities: ['Feature playground', 'Model comparison', 'Stability prediction', 'Explainable feature ranking'],
    architecture: ['Parameter playground', 'Inference API', 'Model registry', 'Explainability layer'],
    demoLabel: 'Run predictor',
    metric: 'Planned research build',
    status: 'planned',
    statusLabel: 'Planned product · no production claims',
    modules: ['Dataset intake', 'Feature engineering', 'Model registry', 'Inference and explanation'],
  },
  {
    slug: 'fieldsync-mobile',
    index: '04',
    category: 'Resilient field operations',
    title: 'FieldSync Mobile',
    eyebrow: 'Offline-first verification',
    summary: 'A mobile workflow for inspectors and field operators that records QR-tagged work, location, and evidence offline, then synchronises safely when connectivity returns.',
    problem: 'Field work does not stop when mobile data drops; a reliable system needs to retain evidence and resolve sync later.',
    outcome: 'A mobile-first interaction model for offline capture, queue visibility, geofenced checks, and reliable cloud reconciliation.',
    stack: ['React Native', 'Expo', 'SQLite', 'Supabase', 'QR + location'],
    capabilities: ['QR asset capture', 'Offline queue', 'Location verification', 'Conflict-aware sync'],
    architecture: ['Mobile capture', 'Local encrypted queue', 'Sync service', 'Operations console'],
    demoLabel: 'Try field flow',
    metric: 'Planned field build',
    status: 'planned',
    statusLabel: 'Planned product · no production claims',
    modules: ['QR capture', 'Encrypted local queue', 'Sync conflict handling', 'Operations console'],
  },
]

export function getPortfolioLab(slug?: string) {
  return portfolioLabs.find((lab) => lab.slug === slug)
}
