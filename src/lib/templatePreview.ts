import type { Template } from '../types'

type PreviewTemplate = Pick<
  Template,
  | 'category'
  | 'colorScheme'
  | 'description'
  | 'features'
  | 'name'
  | 'pages'
  | 'previewImage'
  | 'price'
  | 'screenshots'
  | 'slug'
  | 'style'
  | 'subcategory'
  | 'techStack'
>

export function buildTemplatePreviewDocument(template: PreviewTemplate) {
  const route = `/register?template=${encodeURIComponent(template.slug)}`
  const scenario = scenarioFor(template)
  const screenshots = [template.previewImage, ...template.screenshots].slice(0, 3)
  const featureCards = template.features.slice(0, 4).map((feature) => `<article>${escapeHtml(feature)}</article>`).join('')
  const pageCards = template.pages.slice(0, 5).map((page) => `<li>${escapeHtml(page)}</li>`).join('')
  const stack = template.techStack.slice(0, 4).map((tech) => `<span>${escapeHtml(tech)}</span>`).join('')
  const workflowCards = scenario.workflows.map((item) => `<article><b>${escapeHtml(item.title)}</b><span>${escapeHtml(item.detail)}</span></article>`).join('')
  const adminCards = scenario.admin.map((item) => `<li>${escapeHtml(item)}</li>`).join('')
  const gallery = screenshots
    .map((screenshot, index) => `<img src="${escapeAttribute(screenshot)}" alt="${escapeAttribute(template.name)} screen ${index + 1}">`)
    .join('')

  return `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          *{box-sizing:border-box}
          body{margin:0;background:#050510;color:#fff;font:16px Inter,system-ui,-apple-system,sans-serif}
          a{color:inherit;text-decoration:none}
          nav{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px clamp(18px,5vw,68px);background:rgba(5,5,16,.82);border-bottom:1px solid rgba(255,255,255,.12);backdrop-filter:blur(18px)}
          nav b{letter-spacing:.08em;text-transform:uppercase}
          nav div{display:flex;align-items:center;gap:14px;color:#b8c6e7;font-size:.92rem}
          .cta{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:8px;background:linear-gradient(135deg,#6C63FF,#00D4FF);padding:13px 16px;color:#fff;font-weight:800;box-shadow:0 18px 56px rgba(0,212,255,.18)}
          main{min-height:min(760px,100vh);display:grid;align-items:end;gap:24px;padding:clamp(88px,12vh,138px) clamp(18px,7vw,94px) clamp(46px,8vh,86px);background:linear-gradient(100deg,rgba(5,5,16,.98),rgba(5,5,16,.72) 48%,rgba(5,5,16,.28)),url("${escapeAttribute(template.previewImage)}") center/cover}
          small,.chip{display:inline-flex;width:max-content;border:1px solid rgba(0,212,255,.5);border-radius:999px;background:rgba(0,212,255,.12);padding:8px 12px;color:#c5f6ff}
          h1{max-width:920px;margin:18px 0 12px;font-size:clamp(2.5rem,7vw,6.9rem);line-height:.94}
          p{max-width:640px;color:#c7d1eb;font-size:clamp(1rem,2vw,1.28rem);line-height:1.7}
          .hero-actions{display:flex;flex-wrap:wrap;gap:12px}
          .ghost{display:inline-flex;align-items:center;border:1px solid rgba(255,255,255,.18);border-radius:8px;padding:13px 16px;background:rgba(255,255,255,.08);font-weight:700}
          .metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;padding:22px clamp(18px,7vw,94px);background:#09091a}
          .metrics article,.features article,.booking{border:1px solid rgba(255,255,255,.12);border-radius:8px;background:rgba(255,255,255,.07)}
          .metrics article{padding:18px}
          .metrics strong{display:block;font-size:1.5rem}
          .metrics span{display:block;margin-top:6px;color:#9eabc8}
          section{padding:clamp(28px,6vw,72px) clamp(18px,7vw,94px)}
          .split{display:grid;gap:22px;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));background:#0D0D1F}
          h2{margin:0 0 12px;font-size:clamp(1.45rem,3vw,2.6rem)}
          .stack{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}
          .stack span{border:1px solid rgba(255,255,255,.12);border-radius:999px;padding:7px 10px;color:#dbe6ff;background:rgba(255,255,255,.07)}
          ul{display:flex;flex-wrap:wrap;gap:9px;margin:18px 0 0;padding:0;list-style:none}
          li{border-radius:7px;background:rgba(108,99,255,.16);padding:10px 12px;color:#e6e3ff}
          .features{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px;margin-top:18px}
          .features article{min-height:116px;padding:20px;color:#e7efff;font-weight:750}
          .deep{display:grid;gap:24px;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);background:linear-gradient(135deg,rgba(108,99,255,.16),rgba(0,212,255,.08)),#080817}
          .workflow{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
          .workflow article{min-height:132px;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:rgba(255,255,255,.07);padding:18px}
          .workflow b{display:block;margin-bottom:10px;color:#fff}
          .workflow span{color:#b9c6e6;line-height:1.55}
          .admin{display:grid;gap:22px;grid-template-columns:minmax(0,1fr) minmax(280px,.62fr);background:#0D0D1F}
          .admin-card{border:1px solid rgba(0,212,255,.22);border-radius:8px;background:rgba(0,212,255,.08);padding:20px}
          .admin ul{display:grid}
          .gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:14px;background:#070713}
          .gallery img{width:100%;height:clamp(180px,28vw,340px);object-fit:cover;border:1px solid rgba(255,255,255,.12);border-radius:8px}
          .booking{display:grid;gap:16px;padding:22px}
          .booking form{display:grid;gap:10px}
          input,select{width:100%;border:1px solid rgba(255,255,255,.14);border-radius:8px;background:rgba(0,0,0,.24);padding:12px;color:#fff}
          footer{padding:22px clamp(18px,7vw,94px);border-top:1px solid rgba(255,255,255,.1);color:#9eabc8}
          @media (max-width:820px){.deep,.admin{grid-template-columns:1fr}.workflow{grid-template-columns:1fr}}
          @media (max-width:640px){nav div span{display:none}.metrics{padding-top:16px}h1{font-size:clamp(2.25rem,13vw,4.2rem)}}
        </style>
      </head>
      <body>
        <nav>
          <b>${escapeHtml(template.name)}</b>
          <div><span>Offer</span><span>Proof</span><span>Booking</span><a class="cta" target="_top" href="${route}">Client app</a></div>
        </nav>
        <main>
          <div>
            <small>${escapeHtml(template.category)} / ${escapeHtml(template.subcategory)}</small>
            <h1>${escapeHtml(template.name)}</h1>
            <p>${escapeHtml(template.description)}</p>
            <div class="hero-actions">
              <a class="cta" target="_top" href="${route}">Open private workspace</a>
              <a class="ghost" href="#sections">Explore sections</a>
            </div>
          </div>
        </main>
        <div class="metrics">
          <article><strong>${template.pages.length} pages</strong><span>Ready to customize</span></article>
          <article><strong>$${template.price}</strong><span>Template starting point</span></article>
          <article><strong>${template.features.length}+ modules</strong><span>Built for conversion</span></article>
        </div>
        <section id="sections" class="split">
          <div>
            <span class="chip">Launch surface</span>
            <h2>${escapeHtml(scenario.sectionHeadline)}</h2>
            <p>${escapeHtml(scenario.sectionCopy)}</p>
            <div class="stack">${stack}</div>
            <ul>${pageCards}</ul>
          </div>
          <div class="booking">
            <div>
              <span class="chip">Booking block</span>
              <h2>Turn interest into a request.</h2>
            </div>
            <form action="${route}" target="_top">
              <input aria-label="Name" placeholder="Name">
              <select aria-label="Service"><option>${escapeHtml(template.subcategory)} build</option><option>Customization sprint</option></select>
              <button class="cta" type="submit">Continue in client app</button>
            </form>
          </div>
        </section>
        <section class="deep">
          <div>
            <span class="chip">${escapeHtml(scenario.badge)}</span>
            <h2>${escapeHtml(scenario.workflowHeadline)}</h2>
            <p>${escapeHtml(scenario.workflowCopy)}</p>
          </div>
          <div class="workflow">${workflowCards}</div>
        </section>
        <section class="admin">
          <div>
            <span class="chip">Admin tools</span>
            <h2>Designed for daily business control.</h2>
            <p>${escapeHtml(scenario.adminCopy)}</p>
          </div>
          <div class="admin-card">
            <b>Editable after AuraFlow builds it</b>
            <ul>${adminCards}</ul>
          </div>
        </section>
        <section>
          <span class="chip">Included modules</span>
          <div class="features">${featureCards}</div>
        </section>
        <section class="gallery">${gallery}</section>
        <footer>AuraFlow preview. Project briefs, uploads, revisions, and template choices continue inside the private client app.</footer>
      </body>
    </html>`
}

function scenarioFor(template: PreviewTemplate) {
  const key = `${template.category} ${template.subcategory}`.toLowerCase()
  const shared = {
    badge: `${template.style} / ${template.colorScheme}`,
    sectionHeadline: 'Depth beyond a hero screen.',
    sectionCopy: 'Service proof, conversion paths, contact capture, responsive sections, and Firebase-ready hooks can all travel with this template.',
    workflowHeadline: 'A real customer journey, not only a pretty page.',
    workflowCopy: 'The public site, private forms, and admin-facing content areas can be shaped into a practical prototype before AuraFlow builds the final system.',
    adminCopy: 'AuraFlow can turn this template into a managed workspace where owners update content, review leads, upload assets, and track requests without coding.',
    workflows: [
      { title: 'Capture interest', detail: 'Visitors see a clear offer and continue into the private AuraFlow workspace for details.' },
      { title: 'Collect assets', detail: 'Photos, brand notes, reference links, and documents can be attached to the build request.' },
      { title: 'Review previews', detail: 'AuraFlow uploads progress previews for the client to approve or revise.' },
      { title: 'Launch and iterate', detail: 'The finished build can start on a managed link or move to a custom domain.' },
    ],
    admin: ['Content editor', 'Lead inbox', 'Gallery manager', 'Preview publishing', 'Status updates'],
  }

  if (key.includes('restaurant') || key.includes('food') || key.includes('cafe') || key.includes('bakery')) {
    return {
      ...shared,
      badge: 'Menu, bookings, and local food',
      sectionHeadline: 'Built around dishes, ambience, and ordering.',
      sectionCopy: 'Menus can highlight jollof, waakye, fufu, banku, pastries, catering trays, drinks, and real restaurant photography without mixing unrelated images.',
      workflowHeadline: 'From appetite to order request.',
      workflowCopy: 'A customer can inspect dishes, choose a branch or table time, request delivery, and continue the serious brief inside the client app.',
      workflows: [
        { title: 'Menu discovery', detail: 'Dish cards, prices, dietary notes, and gallery sections make the food the star.' },
        { title: 'Booking flow', detail: 'Visitors can request tables, catering, private dining, or event service.' },
        { title: 'Kitchen handoff', detail: 'AuraFlow can wire order queues, availability, and WhatsApp confirmation for staff.' },
        { title: 'Seasonal updates', detail: 'Admins can adjust menu items, specials, opening hours, and gallery photos.' },
      ],
      admin: ['Menu builder', 'Food gallery', 'Reservation board', 'Delivery queue', 'WhatsApp handoff'],
    }
  }

  if (key.includes('school') || key.includes('university') || key.includes('daycare')) {
    return {
      ...shared,
      badge: 'Admissions and school portal',
      sectionHeadline: 'A public school site with a private management layer.',
      sectionCopy: 'Admissions, parents, students, teachers, timetables, fees, results, announcements, and document uploads can start from one configurable school template.',
      workflowHeadline: 'A school-management prototype path.',
      workflowCopy: 'The template can become a low-cost hosted school system with role-based dashboards for administrators, teachers, parents, and students.',
      workflows: [
        { title: 'Admission enquiry', detail: 'Parents submit enquiries and documents through structured school forms.' },
        { title: 'Parent portal', detail: 'Families can receive announcements, fee updates, results, and term documents.' },
        { title: 'Teacher workspace', detail: 'Staff workflows can include classes, attendance, reports, and notes.' },
        { title: 'Admin control', detail: 'School owners manage terms, users, payments, and published updates.' },
      ],
      admin: ['Student records', 'Parent portal', 'Staff roles', 'Fees and reports', 'Announcement console'],
    }
  }

  if (key.includes('hotel') || key.includes('resort') || key.includes('hostel')) {
    return {
      ...shared,
      badge: 'Rooms, stays, and hospitality',
      sectionHeadline: 'Show rooms clearly and turn visitors into booking requests.',
      sectionCopy: 'Hotels, lodges, resorts, event halls, and guest houses can showcase rooms, amenities, pricing, local attractions, and booking status.',
      workflowHeadline: 'A guest journey from room search to confirmation.',
      workflowCopy: 'AuraFlow can connect room galleries, availability requests, guest details, and admin follow-up into one hosted hospitality platform.',
      workflows: [
        { title: 'Room browsing', detail: 'Guests compare rooms, amenities, rates, and real venue photography.' },
        { title: 'Booking request', detail: 'Arrival date, nights, guests, and special notes enter one request flow.' },
        { title: 'Reception board', detail: 'Staff can review incoming bookings and update confirmation status.' },
        { title: 'Gallery updates', detail: 'Admins can publish new rooms, halls, pool photos, and seasonal offers.' },
      ],
      admin: ['Room editor', 'Booking board', 'Rate manager', 'Guest notes', 'Gallery uploads'],
    }
  }

  if (key.includes('clinic') || key.includes('hospital') || key.includes('dent') || key.includes('pharmacy')) {
    return {
      ...shared,
      badge: 'Appointments and care requests',
      sectionHeadline: 'Trust-building healthcare pages with secure intake.',
      sectionCopy: 'Departments, doctor profiles, service pages, appointment forms, prescription uploads, and patient follow-up can sit behind clear privacy boundaries.',
      workflowHeadline: 'From patient need to admin review.',
      workflowCopy: 'The prototype can map patient intake, appointment assignment, document review, and pharmacy or clinic follow-up.',
      workflows: [
        { title: 'Service discovery', detail: 'Patients find departments, opening hours, accepted requests, and care instructions.' },
        { title: 'Appointment intake', detail: 'Structured forms collect symptoms, preferred dates, and contact details.' },
        { title: 'Document uploads', detail: 'Prescriptions, lab references, or ID documents can be attached privately.' },
        { title: 'Admin triage', detail: 'Reception or pharmacy staff review requests and update client-visible status.' },
      ],
      admin: ['Appointment board', 'Department editor', 'Staff profiles', 'Document review', 'Patient messaging'],
    }
  }

  if (key.includes('commerce') || key.includes('supermarket') || key.includes('fashion') || key.includes('jewelry')) {
    return {
      ...shared,
      badge: 'Catalog, orders, and inventory',
      sectionHeadline: 'A shopfront that can grow into a managed commerce system.',
      sectionCopy: 'Product catalogs, categories, stock, offers, checkout requests, delivery notes, and seller dashboards can be prototyped before the build.',
      workflowHeadline: 'From product browsing to order tracking.',
      workflowCopy: 'AuraFlow can shape the flow for local shops, supermarkets, malls, fashion brands, electronics stores, and specialty retailers.',
      workflows: [
        { title: 'Browse products', detail: 'Customers filter categories, inspect images, and compare prices.' },
        { title: 'Request checkout', detail: 'Orders can begin as a managed request flow before online payments are added.' },
        { title: 'Inventory updates', detail: 'Owners can update stock, promotions, departments, and delivery areas.' },
        { title: 'Sales visibility', detail: 'Dashboards can summarize orders, best products, and fulfilment status.' },
      ],
      admin: ['Product editor', 'Inventory control', 'Order manager', 'Promo scheduler', 'Sales dashboard'],
    }
  }

  if (key.includes('law') || key.includes('finance') || key.includes('marketing') || key.includes('consult')) {
    return {
      ...shared,
      badge: 'Professional services',
      sectionHeadline: 'Authority, clarity, and lead qualification.',
      sectionCopy: 'Practice areas, service packages, client onboarding, document collection, appointments, and progress updates can become a secure client portal.',
      workflowHeadline: 'From enquiry to managed client work.',
      workflowCopy: 'The preview can become a private intake system where clients submit details and the business updates progress.',
      workflows: [
        { title: 'Qualified enquiry', detail: 'Visitors select a service and provide enough context for a serious response.' },
        { title: 'Document request', detail: 'Clients upload references, records, briefs, or forms inside their account.' },
        { title: 'Progress status', detail: 'Admins share updates, deadlines, next steps, and review files.' },
        { title: 'Relationship history', detail: 'Messages and revisions stay connected to the client request.' },
      ],
      admin: ['Lead inbox', 'Client records', 'Document review', 'Task updates', 'Private messaging'],
    }
  }

  return shared
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function escapeAttribute(value: string) {
  return escapeHtml(value)
}
