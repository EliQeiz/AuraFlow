import type { Template } from '../types'

type PreviewTemplate = Pick<
  Template,
  'category' | 'description' | 'features' | 'name' | 'pages' | 'previewImage' | 'price' | 'screenshots' | 'slug' | 'subcategory' | 'techStack'
>

export function buildTemplatePreviewDocument(template: PreviewTemplate) {
  const route = `/quote?template=${encodeURIComponent(template.slug)}`
  const screenshots = [template.previewImage, ...template.screenshots].slice(0, 3)
  const featureCards = template.features.slice(0, 4).map((feature) => `<article>${escapeHtml(feature)}</article>`).join('')
  const pageCards = template.pages.slice(0, 5).map((page) => `<li>${escapeHtml(page)}</li>`).join('')
  const stack = template.techStack.slice(0, 4).map((tech) => `<span>${escapeHtml(tech)}</span>`).join('')
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
          .gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:14px;background:#070713}
          .gallery img{width:100%;height:clamp(180px,28vw,340px);object-fit:cover;border:1px solid rgba(255,255,255,.12);border-radius:8px}
          .booking{display:grid;gap:16px;padding:22px}
          .booking form{display:grid;gap:10px}
          input,select{width:100%;border:1px solid rgba(255,255,255,.14);border-radius:8px;background:rgba(0,0,0,.24);padding:12px;color:#fff}
          footer{padding:22px clamp(18px,7vw,94px);border-top:1px solid rgba(255,255,255,.1);color:#9eabc8}
          @media (max-width:640px){nav div span{display:none}.metrics{padding-top:16px}h1{font-size:clamp(2.25rem,13vw,4.2rem)}}
        </style>
      </head>
      <body>
        <nav>
          <b>${escapeHtml(template.name)}</b>
          <div><span>Offer</span><span>Proof</span><span>Booking</span><a class="cta" target="_top" href="${route}">Use template</a></div>
        </nav>
        <main>
          <div>
            <small>${escapeHtml(template.category)} / ${escapeHtml(template.subcategory)}</small>
            <h1>${escapeHtml(template.name)}</h1>
            <p>${escapeHtml(template.description)}</p>
            <div class="hero-actions">
              <a class="cta" target="_top" href="${route}">Request this launch</a>
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
            <h2>Depth beyond a hero screen.</h2>
            <p>Service proof, conversion paths, contact capture, responsive sections, and Firebase-ready hooks can all travel with this template.</p>
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
              <button class="cta" type="submit">Open quote request</button>
            </form>
          </div>
        </section>
        <section>
          <span class="chip">Included modules</span>
          <div class="features">${featureCards}</div>
        </section>
        <section class="gallery">${gallery}</section>
        <footer>AuraFlow preview. Use the quote path to turn the template into a real delivery scope.</footer>
      </body>
    </html>`
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
