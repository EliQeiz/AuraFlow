import { IMAGES } from '../lib/images'
import type { SuiteBlueprint, SuiteModule, SuiteRole, SuiteTier, SuiteWorkflow } from '../types'

const allTiers: SuiteTier[] = ['starter', 'business', 'operations', 'enterprise']
const businessUp: SuiteTier[] = ['business', 'operations', 'enterprise']
const operationsUp: SuiteTier[] = ['operations', 'enterprise']

const pexelsPhoto = (id: number) => `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`
const unsplashPhoto = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=85`
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

function suiteModule(
  title: string,
  category: string,
  summary: string,
  records: string[],
  actions: string[],
  includedIn: SuiteTier[] = allTiers,
): SuiteModule {
  return { id: slugify(title), title, category, summary, records, actions, includedIn }
}

function suiteRole(title: string, portal: string, summary: string, permissions: string[]): SuiteRole {
  return { id: slugify(title), title, portal, summary, permissions }
}

function workflow(title: string, trigger: string, steps: string[], output: string): SuiteWorkflow {
  return { id: slugify(title), title, trigger, steps, output }
}

const sharedSecurity = [
  'Firebase Authentication gates the client app before private requests, files, chats, and previews are available.',
  'Firestore rules keep each client restricted to their own project records while admin access requires a custom claim.',
  'Storage rules allow only approved reference file types and keep admin previews readable by the request owner only.',
  'Every hosted suite request keeps audit-friendly status, deadline, preview, revision, and chat history in one record.',
]

const sharedThemes = [
  { name: 'Aura Dark', swatches: ['#050510', '#12122A', '#6C63FF', '#00D4FF'] },
  { name: 'Clean Light', swatches: ['#F6F8FF', '#FFFFFF', '#335CFF', '#00A6D6'] },
  { name: 'Local Warm', swatches: ['#17130D', '#2F2416', '#E8B44D', '#36D399'] },
]

const schoolModules = [
  suiteModule('Admissions', 'Front Office', 'Online applications, guardian records, interviews, assessments, document checks, and acceptance handoff.', ['admission_applications', 'admission_guardians', 'admission_documents', 'admission_interviews'], ['Create application', 'Upload documents', 'Schedule interview', 'Accept into student records'], allTiers),
  suiteModule('Student 360 Records', 'Front Office', 'A complete learner profile with enrollment, guardians, medical notes, documents, behavior, attendance, grades, and invoices.', ['students', 'parent_students', 'student_enrollments', 'student_medical_records', 'student_documents', 'student_behavior_records'], ['Import students', 'Review profile', 'Attach documents', 'Record behavior note'], allTiers),
  suiteModule('Staff And HR', 'Operations', 'Staff profiles, departments, attendance, leave, documents, recruitment, tasks, and payroll preparation.', ['staff_profiles', 'staff_documents', 'staff_attendance_records', 'leave_requests', 'job_postings', 'job_applications'], ['Add staff', 'Approve leave', 'Review recruitment', 'Prepare payroll'], businessUp),
  suiteModule('Classes And Timetable', 'Academics', 'Academic years, terms, classrooms, subjects, courses, teacher assignments, timetables, and class rosters.', ['academic_years', 'terms', 'classrooms', 'subjects', 'courses', 'teacher_assignments', 'timetables'], ['Create term', 'Assign teacher', 'Build timetable', 'Snapshot roster'], allTiers),
  suiteModule('Attendance Register', 'Academics', 'Daily attendance registers, student attendance history, teacher entry screens, and parent-visible summaries.', ['attendance_registers', 'attendance_records', 'class_roster_snapshots'], ['Open daily register', 'Mark attendance', 'Review absences', 'Notify guardians'], allTiers),
  suiteModule('Grades And Reports', 'Academics', 'Grade items, imported marks, grading scales, report cards, parent/student report views, and PDF generation.', ['grade_items', 'grades', 'grading_scales', 'grade_import_batches', 'reports'], ['Create grade book', 'Import marks', 'Publish report', 'Download PDF'], businessUp),
  suiteModule('Fees And Bursary', 'Finance', 'Fee categories, plans, invoices, payments, daily fee plans, cashier sessions, receipts, scholarships, and collections.', ['fee_categories', 'fee_plans', 'invoices', 'payments', 'daily_fee_plans', 'daily_fee_payments', 'bursary_receipts', 'scholarships'], ['Generate invoices', 'Record payment', 'Print receipt', 'Track balance'], businessUp),
  suiteModule('Accounting', 'Finance', 'Fiscal years, chart of accounts, journal entries, supplier bills, bank accounts, expenses, and finance dashboards.', ['chart_of_accounts', 'fiscal_years', 'journal_entries', 'journal_entry_lines', 'supplier_bills', 'bank_accounts', 'expenses'], ['Create account', 'Post journal', 'Review expenses', 'Export finance report'], operationsUp),
  suiteModule('Parent, Student And Teacher Portals', 'Portals', 'Separate dashboards for parents, students, and teachers with role-aware navigation and private data boundaries.', ['profiles', 'role_permissions', 'parent_students', 'assignments', 'assignment_submissions'], ['Invite portal user', 'Review child progress', 'Submit assignment', 'Message teacher'], allTiers),
  suiteModule('Messaging And Notifications', 'Communication', 'Conversations, role-targeted announcements, campaign recipients, email/SMS outbox, push subscriptions, and read tracking.', ['conversations', 'messages', 'announcements', 'announcement_reads', 'communication_campaigns', 'email_outbox', 'sms_outbox', 'push_subscriptions'], ['Send announcement', 'Start conversation', 'Track delivery', 'Review inbox'], businessUp),
  suiteModule('Website CMS', 'Public Website', 'School settings, public pages, hero slides, news, events, admissions page, contact enquiries, and media assets.', ['school_settings', 'hero_slides', 'news_posts', 'events', 'contact_inquiries', 'media_assets'], ['Update homepage', 'Publish news', 'Create event', 'Review public enquiry'], allTiers),
  suiteModule('AI Tutor And Lesson Planner', 'AI', 'Authenticated tutor endpoint, rate limits, student-aware prompt context, lesson plans, resources, and AI usage logs.', ['ai_tutor_sessions', 'ai_tutor_messages', 'ai_usage_logs', 'lesson_plans', 'lesson_plan_resources'], ['Ask AI tutor', 'Draft lesson plan', 'Review AI usage', 'Attach resources'], operationsUp),
  suiteModule('Library', 'Operations', 'Catalog, book copies, loans, fines, library tasks, and role-limited librarian tools.', ['library_books', 'library_copies', 'library_loans', 'library_fines'], ['Add book', 'Issue copy', 'Receive return', 'Apply fine'], operationsUp),
  suiteModule('Transport And Boarding', 'Operations', 'Routes, stops, vehicles, trip logs, dormitories, assignments, roll calls, exeats, incidents, and visitors.', ['transport_routes', 'transport_stops', 'transport_vehicles', 'boarding_houses', 'boarding_dormitories', 'boarding_assignments', 'boarding_roll_calls'], ['Assign route', 'Log trip', 'Assign dorm', 'Record roll call'], operationsUp),
  suiteModule('Inventory And IT Desk', 'Operations', 'Inventory items, movements, devices, tickets, comments, integrations, system jobs, and audit logs.', ['inventory_items', 'inventory_movements', 'devices', 'support_tickets', 'support_ticket_comments', 'integration_events', 'audit_logs'], ['Move stock', 'Create ticket', 'Resolve device issue', 'Inspect audit trail'], operationsUp),
  suiteModule('Preschool And Learner Care', 'Academics', 'Daily logs, observations, pickups, incidents, wellbeing cases, and parent-safe care updates.', ['preschool_daily_logs', 'preschool_observations', 'preschool_pickups', 'preschool_incidents', 'learner_wellbeing_cases'], ['Record daily log', 'Add observation', 'Verify pickup', 'Escalate care case'], operationsUp),
]

export const suiteBlueprints: SuiteBlueprint[] = [
  {
    id: 'suite-school-management',
    slug: 'school-management-system',
    title: 'School Management System',
    category: 'Education',
    summary: 'A configurable school operating system for admissions, academics, fees, staff, portals, messaging, reports, and public school pages.',
    longDescription:
      'AuraFlow can turn the included Crestview school system architecture into a reusable managed SMS suite. A school provides its name, classes, fee structure, terms, staff, branding, content, and required modules; AuraFlow configures a private hosted platform and upgrades it into a dedicated build when needed.',
    image: IMAGES.templates.school,
    audience: 'Basic schools, senior high schools, academies, training centers, preschools, universities, and private education groups',
    startingPrice: 'Managed from $99/mo',
    platformLabel: 'yourschool.auraflow.app',
    modules: schoolModules,
    roles: [
      suiteRole('Super Admin', '/admin', 'Full platform owner with every school, finance, academic, and security control.', ['Manage roles', 'Control billing', 'View audit logs', 'Configure integrations']),
      suiteRole('School Admin', '/admin', 'Runs the daily school operation across admissions, students, staff, fees, reports, and communications.', ['Manage students', 'Publish reports', 'Send announcements', 'Configure terms']),
      suiteRole('Teacher', '/teacher', 'Handles classes, attendance, assignments, grades, lesson plans, learner care, and student 360 notes.', ['Mark attendance', 'Grade work', 'Create assignments', 'Use lesson planner']),
      suiteRole('Parent', '/parent', 'Views linked children, fees, messages, reports, attendance, and school communication.', ['View child profile', 'Read messages', 'Open reports', 'Track fees']),
      suiteRole('Student', '/student', 'Sees assignments, attendance, grades, reports, learning materials, and AI tutor access where enabled.', ['Submit assignment', 'Review grades', 'Open AI tutor', 'Download materials']),
      suiteRole('Finance Officer', '/finance', 'Manages payments, invoices, bursary, expenses, collections, accounting, and reports.', ['Record payments', 'Create invoices', 'Manage collections', 'Export reports']),
      suiteRole('HR Staff', '/hr', 'Manages staff profiles, leave, recruitment, documents, tasks, and payroll preparation.', ['Review staff', 'Approve leave', 'Manage recruitment', 'Prepare payroll']),
      suiteRole('Librarian', '/library', 'Controls catalog, copies, loans, fines, and library tasks.', ['Issue books', 'Track fines', 'Manage catalog', 'Review loans']),
      suiteRole('IT Support', '/it', 'Handles devices, tickets, integrations, automation, communications, inventory, and audit visibility.', ['Resolve tickets', 'Track devices', 'Review automation', 'Inspect logs']),
    ],
    workflows: [
      workflow('Applicant To Student', 'A guardian submits an admission form.', ['Collect application', 'Review documents', 'Schedule interview or assessment', 'Accept applicant', 'Generate student record and portal invite'], 'A complete student profile with guardian links and first invoice path.'),
      workflow('Daily Attendance', 'A teacher opens today attendance register.', ['Load class roster', 'Mark present, absent, late, or excused', 'Submit register', 'Notify admin or guardians for exceptions'], 'Attendance history visible to admin, teacher, parent, and student roles.'),
      workflow('Term Reports', 'Academic staff finish grading.', ['Create grade items', 'Import or enter marks', 'Apply grading scale', 'Generate reports', 'Publish to parent and student portals'], 'Downloadable report cards and private portal summaries.'),
      workflow('Fees Collection', 'Finance prepares term or daily fees.', ['Configure fee plan', 'Generate invoices', 'Record payment', 'Allocate receipt', 'Track overdue balances'], 'Client-visible finance dashboard with receipts and balance follow-up.'),
      workflow('Announcement Campaign', 'Admin needs to reach a specific audience.', ['Choose roles, classroom, parents, staff, or all', 'Compose message', 'Send through portal, email, or SMS queue', 'Track reads and delivery'], 'Communication history tied to roles and school records.'),
      workflow('Support And Audit', 'A device, access, or integration problem is reported.', ['Create support ticket', 'Assign owner', 'Comment on progress', 'Resolve ticket', 'Log critical events'], 'Operational trail for IT and school leadership.'),
    ],
    adminControls: [
      'School branding, public pages, hero slides, events, news, and contact information',
      'Academic years, terms, classrooms, subjects, courses, timetables, and grading scales',
      'Role-aware navigation, portal invitations, profile permissions, and staff responsibilities',
      'Fee plans, invoices, daily fee collection, scholarships, bursary receipts, and accounting setup',
      'Preview publishing, client approval notes, hosted link setup, and launch readiness tracking',
    ],
    dataEntities: [
      'roles',
      'profiles',
      'students',
      'parents',
      'staff_profiles',
      'classrooms',
      'subjects',
      'attendance_records',
      'grades',
      'invoices',
      'payments',
      'reports',
      'messages',
      'notifications',
      'files',
      'audit_logs',
    ],
    integrations: ['Firebase Auth and Storage', 'Firestore client workspace', 'Supabase/Postgres-ready SMS core', 'PDF report generation', 'Email, SMS, push, payment, and AI integration points'],
    securityControls: [
      ...sharedSecurity,
      'School-suite builds must keep service-role keys server-only and enforce row-level security for staff, parent, student, and finance portals.',
      'Production demo credentials must never be committed, shown in public pages, or reused for customer deployments.',
    ],
    prototypeScreens: [
      { title: 'Admin Command Center', route: '/admin', audience: 'School leadership', description: 'Admissions, attendance, fee balance, reports, staff tasks, support tickets, and announcements in one operating view.' },
      { title: 'Teacher Workspace', route: '/teacher', audience: 'Teachers', description: 'Classes, attendance, assignments, grades, lesson planner, and student 360 follow-up.' },
      { title: 'Parent Portal', route: '/parent', audience: 'Parents and guardians', description: 'Children, fees, messages, attendance, and reports with only linked student data visible.' },
      { title: 'Student Portal', route: '/student', audience: 'Students', description: 'Assignments, attendance, grades, reports, course materials, and AI tutor where enabled.' },
      { title: 'Finance Suite', route: '/finance', audience: 'Finance office', description: 'Payments, invoices, daily fee plans, collections, bursary, expenses, and accounting exports.' },
      { title: 'Public School Site', route: '/', audience: 'Prospective parents', description: 'Admissions, news, events, school story, galleries, and contact capture managed by admin.' },
    ],
    metrics: [
      { label: 'Admissions', value: '42', trend: '12 pending review' },
      { label: 'Attendance', value: '94%', trend: 'Today across active classes' },
      { label: 'Fees tracked', value: '$18.4k', trend: 'Term invoices and receipts' },
      { label: 'Open tickets', value: '7', trend: 'IT, finance, and parent follow-up' },
    ],
    themes: sharedThemes,
    sourceNote: 'Derived from the included Crestview ISMS Next.js/Supabase folder: route map, roles, RLS-backed table model, and operations modules were translated into this reusable AuraFlow suite blueprint.',
  },
  makeSuite({
    id: 'suite-ecommerce-storefront',
    slug: 'ecommerce-storefront',
    title: 'E-commerce Storefront',
    category: 'Retail',
    summary: 'Product catalog, cart, checkout requests, order tracking, inventory, seller dashboard, and customer accounts.',
    image: IMAGES.templates.ecommerce,
    audience: 'Fashion stores, electronics shops, cosmetics brands, bookstores, supermarkets, and local retail businesses',
    startingPrice: 'Managed from $79/mo',
    platformLabel: 'yourshop.auraflow.app',
    moduleTitles: ['Product Catalog', 'Cart And Checkout Request', 'Inventory', 'Order Pipeline', 'Customer Accounts', 'Promotions', 'Delivery Notes', 'Sales Dashboard'],
    roleTitles: ['Owner', 'Store Manager', 'Sales Staff', 'Customer'],
    entities: ['products', 'categories', 'orders', 'order_items', 'inventory_movements', 'customers', 'promotions', 'delivery_notes'],
    imageScreens: ['Storefront', 'Product Detail', 'Cart', 'Seller Dashboard'],
  }),
  makeSuite({
    id: 'suite-supermarket-mall',
    slug: 'supermarket-mall-system',
    title: 'Mall And Supermarket System',
    category: 'Retail',
    summary: 'Departments, vendor spaces, grocery catalog, bulk order requests, inventory, offers, receipts, and staff tasks.',
    image: IMAGES.templates.retail,
    audience: 'Supermarkets, mini marts, malls, wholesale counters, grocery shops, and multi-vendor retail spaces',
    startingPrice: 'Managed from $129/mo',
    platformLabel: 'yourmart.auraflow.app',
    moduleTitles: ['Departments', 'Vendor Spaces', 'Inventory Sheets', 'Bulk Orders', 'Offer Scheduler', 'Receipts', 'Delivery Zones', 'Daily Sales Report'],
    roleTitles: ['Owner', 'Manager', 'Vendor', 'Cashier', 'Customer'],
    entities: ['departments', 'vendors', 'products', 'stock_counts', 'offers', 'orders', 'receipts', 'staff_tasks'],
    imageScreens: ['Retail Home', 'Vendor Admin', 'Inventory', 'Orders'],
  }),
  makeSuite({
    id: 'suite-restaurant',
    slug: 'restaurant-ordering-booking',
    title: 'Restaurant Ordering And Booking',
    category: 'Food',
    summary: 'Menus, local dish categories, reservations, delivery requests, catering enquiries, gallery, and kitchen status.',
    image: pexelsPhoto(32612769),
    audience: 'Restaurants, chop bars, cafes, diners, food trucks, bakeries, and catering teams',
    startingPrice: 'Managed from $69/mo',
    platformLabel: 'yourrestaurant.auraflow.app',
    moduleTitles: ['Menu Builder', 'Ghanaian Dish Gallery', 'Reservation Board', 'Delivery Requests', 'Catering Enquiries', 'Kitchen Status', 'Reviews', 'WhatsApp Handoff'],
    roleTitles: ['Owner', 'Manager', 'Kitchen', 'Wait Staff', 'Customer'],
    entities: ['dishes', 'menu_categories', 'reservations', 'orders', 'order_notes', 'gallery_images', 'reviews', 'catering_requests'],
    imageScreens: ['Menu', 'Dish Detail', 'Booking', 'Kitchen Board'],
  }),
  makeSuite({
    id: 'suite-hospitality',
    slug: 'hotel-lodge-guesthouse-booking',
    title: 'Hotel, Lodge And Guest House Booking',
    category: 'Hospitality',
    summary: 'Rooms, rates, availability requests, amenities, event halls, guest profiles, galleries, and booking status.',
    image: IMAGES.templates.hotel,
    audience: 'Hotels, lodges, resorts, guest houses, hostels, serviced apartments, and event halls',
    startingPrice: 'Managed from $99/mo',
    platformLabel: 'yourhotel.auraflow.app',
    moduleTitles: ['Room Catalog', 'Availability Requests', 'Rate Manager', 'Guest Profiles', 'Amenities', 'Event Hall Enquiries', 'Gallery', 'Occupancy Reports'],
    roleTitles: ['Owner', 'Reception', 'Manager', 'Guest'],
    entities: ['rooms', 'rates', 'bookings', 'guests', 'amenities', 'event_halls', 'gallery_images', 'occupancy_reports'],
    imageScreens: ['Rooms', 'Booking', 'Guest Profile', 'Reception Board'],
  }),
  makeSuite({
    id: 'suite-clinic',
    slug: 'clinic-patient-portal',
    title: 'Clinic And Patient Portal',
    category: 'Healthcare',
    summary: 'Appointments, patient intake, departments, practitioner profiles, document uploads, lab requests, and follow-up messaging.',
    image: pexelsPhoto(6303659),
    audience: 'Clinics, dental practices, hospitals, labs, pharmacies, wellness centers, and specialist practices',
    startingPrice: 'Managed from $129/mo',
    platformLabel: 'yourclinic.auraflow.app',
    moduleTitles: ['Appointments', 'Patient Intake', 'Departments', 'Practitioner Profiles', 'Document Review', 'Lab Requests', 'Prescription Uploads', 'Follow-up Messaging'],
    roleTitles: ['Owner', 'Doctor', 'Nurse', 'Reception', 'Patient'],
    entities: ['patients', 'appointments', 'departments', 'practitioners', 'documents', 'lab_requests', 'messages', 'follow_ups'],
    imageScreens: ['Clinic Home', 'Appointments', 'Patient Intake', 'Reception Board'],
  }),
  makeSuite({
    id: 'suite-portfolio',
    slug: 'portfolio-personal-brand',
    title: 'Portfolio And Personal Brand',
    category: 'Creative',
    summary: 'Case studies, galleries, CV sections, service packages, bookings, press links, downloadable assets, and lead capture.',
    image: unsplashPhoto('photo-1452587925148-ce544e77e70d'),
    audience: 'Creators, designers, photographers, consultants, students, speakers, and agencies',
    startingPrice: 'Managed from $39/mo',
    platformLabel: 'yourname.auraflow.app',
    moduleTitles: ['Case Studies', 'Gallery', 'CV Profile', 'Services', 'Booking Requests', 'Press Links', 'Downloads', 'Lead Inbox'],
    roleTitles: ['Owner', 'Editor', 'Visitor'],
    entities: ['projects', 'case_studies', 'gallery_images', 'services', 'bookings', 'leads', 'downloads', 'press_links'],
    imageScreens: ['Portfolio Home', 'Case Study', 'Gallery', 'Lead Inbox'],
  }),
  makeSuite({
    id: 'suite-real-estate',
    slug: 'real-estate-listings-crm',
    title: 'Real Estate Listings And CRM',
    category: 'Property',
    summary: 'Property listings, search filters, viewing requests, agent profiles, image galleries, area guides, and lead tracking.',
    image: IMAGES.templates.realestate,
    audience: 'Agents, rental agencies, developers, property managers, and short-stay operators',
    startingPrice: 'Managed from $99/mo',
    platformLabel: 'youragency.auraflow.app',
    moduleTitles: ['Property Listings', 'Search Filters', 'Viewing Requests', 'Agent Profiles', 'Lead CRM', 'Image Galleries', 'Area Guides', 'Listing Status'],
    roleTitles: ['Owner', 'Agent', 'Manager', 'Client'],
    entities: ['properties', 'agents', 'leads', 'viewings', 'images', 'areas', 'notes', 'statuses'],
    imageScreens: ['Listings', 'Property Detail', 'Viewing Request', 'Lead Pipeline'],
  }),
  makeSuite({
    id: 'suite-logistics',
    slug: 'logistics-fleet-portal',
    title: 'Logistics And Fleet Portal',
    category: 'Operations',
    summary: 'Shipment requests, dispatch board, vehicle and driver records, proof uploads, customer tracking, and reports.',
    image: IMAGES.templates.logistics,
    audience: 'Delivery companies, freight businesses, haulage teams, couriers, and transport operators',
    startingPrice: 'Managed from $129/mo',
    platformLabel: 'yourfleet.auraflow.app',
    moduleTitles: ['Shipment Requests', 'Dispatch Board', 'Fleet Records', 'Driver Records', 'Proof Uploads', 'Customer Tracking', 'Documents', 'Reports'],
    roleTitles: ['Owner', 'Dispatcher', 'Driver', 'Customer'],
    entities: ['shipments', 'dispatches', 'vehicles', 'drivers', 'proofs', 'customers', 'documents', 'reports'],
    imageScreens: ['Dispatch', 'Shipment Detail', 'Driver View', 'Customer Tracking'],
  }),
  makeSuite({
    id: 'suite-church-ngo',
    slug: 'church-ngo-member-platform',
    title: 'Church And NGO Member Platform',
    category: 'Community',
    summary: 'Members, events, giving links, volunteers, announcements, programs, media, and community reports.',
    image: IMAGES.templates.ngo,
    audience: 'Churches, nonprofits, charities, community groups, foundations, and social programs',
    startingPrice: 'Managed from $59/mo',
    platformLabel: 'yourcommunity.auraflow.app',
    moduleTitles: ['Member Records', 'Events', 'Announcements', 'Volunteer Forms', 'Giving Links', 'Programs', 'Media Library', 'Reports'],
    roleTitles: ['Owner', 'Admin', 'Volunteer Lead', 'Member', 'Visitor'],
    entities: ['members', 'events', 'announcements', 'volunteers', 'giving_links', 'programs', 'media', 'reports'],
    imageScreens: ['Community Home', 'Events', 'Volunteer Queue', 'Member Admin'],
  }),
  makeSuite({
    id: 'suite-salon-spa',
    slug: 'salon-spa-booking',
    title: 'Salon And Spa Booking',
    category: 'Beauty',
    summary: 'Service menus, stylist profiles, appointment requests, packages, galleries, promotions, and client notes.',
    image: IMAGES.templates.salon,
    audience: 'Beauty salons, barbershops, nail studios, spas, wellness studios, and massage centers',
    startingPrice: 'Managed from $59/mo',
    platformLabel: 'yourstudio.auraflow.app',
    moduleTitles: ['Service Menu', 'Stylist Profiles', 'Appointment Requests', 'Packages', 'Gallery', 'Client Notes', 'Promo Banners', 'Follow-up Messages'],
    roleTitles: ['Owner', 'Reception', 'Stylist', 'Client'],
    entities: ['services', 'stylists', 'appointments', 'packages', 'gallery_images', 'clients', 'promotions', 'messages'],
    imageScreens: ['Services', 'Booking', 'Gallery', 'Reception Queue'],
  }),
  makeSuite({
    id: 'suite-construction',
    slug: 'construction-contractor-portal',
    title: 'Construction And Contractor Portal',
    category: 'Trades',
    summary: 'Service pages, project galleries, quote requests, document uploads, milestone updates, team profiles, and client notes.',
    image: IMAGES.templates.construction,
    audience: 'Contractors, construction companies, architects, surveyors, interior designers, and trades',
    startingPrice: 'Managed from $79/mo',
    platformLabel: 'yourfirm.auraflow.app',
    moduleTitles: ['Project Gallery', 'Quote Requests', 'Services', 'Team Profiles', 'Document Uploads', 'Milestone Updates', 'Client Notes', 'Lead Inbox'],
    roleTitles: ['Owner', 'Project Manager', 'Client', 'Visitor'],
    entities: ['projects', 'quotes', 'services', 'team_members', 'documents', 'milestones', 'client_notes', 'leads'],
    imageScreens: ['Project Gallery', 'Quote Form', 'Milestones', 'Client View'],
  }),
  makeSuite({
    id: 'suite-finance',
    slug: 'finance-client-portal',
    title: 'Finance And Client Portal',
    category: 'Professional Services',
    summary: 'Onboarding, secure documents, service packages, appointment requests, task tracker, client notes, and report delivery.',
    image: IMAGES.templates.finance,
    audience: 'Accounting firms, insurance brokers, consultants, recruiters, and agencies',
    startingPrice: 'Managed from $99/mo',
    platformLabel: 'yourfirm.auraflow.app',
    moduleTitles: ['Client Onboarding', 'Secure Documents', 'Service Packages', 'Appointments', 'Task Tracker', 'Client Notes', 'Report Delivery', 'Advisor Dashboard'],
    roleTitles: ['Owner', 'Advisor', 'Admin', 'Client'],
    entities: ['clients', 'documents', 'packages', 'appointments', 'tasks', 'notes', 'reports', 'advisors'],
    imageScreens: ['Client Portal', 'Documents', 'Tasks', 'Report Delivery'],
  }),
]

export const suiteCategories = ['All', ...Array.from(new Set(suiteBlueprints.map((suite) => suite.category)))]

export function getSuiteBlueprint(slug?: string | null) {
  return suiteBlueprints.find((suite) => suite.slug === slug)
}

function makeSuite(input: {
  id: string
  slug: string
  title: string
  category: string
  summary: string
  image: string
  audience: string
  startingPrice: string
  platformLabel: string
  moduleTitles: string[]
  roleTitles: string[]
  entities: string[]
  imageScreens: string[]
}): SuiteBlueprint {
  const modules = input.moduleTitles.map((title, index) =>
    suiteModule(
      title,
      index < 2 ? 'Public Experience' : index < 5 ? 'Operations' : 'Admin',
      `${title} configured for ${input.title.toLowerCase()} clients, staff, and business owners.`,
      [slugify(title).replace(/-/g, '_'), input.entities[index % input.entities.length]],
      [`Configure ${title.toLowerCase()}`, `Review ${title.toLowerCase()} activity`, `Export ${title.toLowerCase()} data`],
      index < 4 ? allTiers : businessUp,
    ),
  )

  return {
    id: input.id,
    slug: input.slug,
    title: input.title,
    category: input.category,
    summary: input.summary,
    longDescription: `${input.title} is a reusable AuraFlow suite blueprint. Clients start from a proven industry structure, choose modules, upload content and references, and receive either a low-cost hosted system or a deeper custom build.`,
    image: input.image,
    audience: input.audience,
    startingPrice: input.startingPrice,
    platformLabel: input.platformLabel,
    modules,
    roles: input.roleTitles.map((title) =>
      suiteRole(title, `/${slugify(title)}`, `${title} access can be tailored for this hosted suite.`, [`Use ${input.title} tools`, 'See role-approved records', 'Send or receive project updates']),
    ),
    workflows: [
      workflow('Client Intake To Launch', 'A business owner chooses this suite in AuraFlow.', ['Select modules', 'Upload content and references', 'Confirm hosted link', 'Review AuraFlow preview', 'Launch or customize further'], 'A working hosted platform plan and private request record.'),
      workflow('Admin Update Loop', 'The business needs a change after launch.', ['Open dashboard', 'Update content or request AuraFlow support', 'Review preview', 'Approve or request revision'], 'A documented change trail instead of scattered messages.'),
      workflow('Customer Request Flow', 'A visitor or customer submits a form.', ['Capture request', 'Notify owner', 'Assign staff', 'Update status', 'Follow up with customer'], 'A repeatable workflow inside the suite admin area.'),
    ],
    adminControls: ['Brand and theme settings', 'Content and media manager', 'Form and request inbox', 'Role-based dashboard access', 'Preview, revision, and launch status'],
    dataEntities: input.entities,
    integrations: ['Firebase Auth', 'Firestore client workspace', 'Firebase Storage uploads', 'Vercel hosting', 'Payment, email, SMS, and analytics integration points'],
    securityControls: sharedSecurity,
    prototypeScreens: input.imageScreens.map((screen) => ({
      title: screen,
      route: `/${slugify(screen)}`,
      audience: screen.includes('Admin') || screen.includes('Dashboard') ? 'Business admin' : 'Customers and staff',
      description: `${screen} preview for ${input.title.toLowerCase()} with content, status, and workflow controls shaped in the AuraFlow studio.`,
    })),
    metrics: [
      { label: 'Modules', value: `${modules.length}`, trend: 'Configurable before build' },
      { label: 'Roles', value: `${input.roleTitles.length}`, trend: 'Permission-aware portals' },
      { label: 'Launch path', value: '2 lanes', trend: 'Hosted or custom' },
      { label: 'Assets', value: '25MB', trend: 'Per uploaded reference file' },
    ],
    themes: sharedThemes,
  }
}
