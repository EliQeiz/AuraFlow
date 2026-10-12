import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { chromium } from "@playwright/test";

const baseUrl = (
  process.env.PRODUCTION_BASE_URL || "http://127.0.0.1:5191"
).replace(/\/$/, "");
const server = process.env.PRODUCTION_BASE_URL
  ? null
  : spawn(
      process.execPath,
      [
        "node_modules/vite/bin/vite.js",
        "preview",
        "--host",
        "127.0.0.1",
        "--port",
        "5191",
        "--strictPort",
      ],
      { stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
    );
let browser;
try {
  for (let attempt = 0; server; attempt++) {
    if (server.exitCode !== null)
      throw new Error(
        "The production preview server could not start on port 5191.",
      );
    try {
      await fetch(baseUrl);
      break;
    } catch {
      if (attempt >= 100)
        throw new Error("Production preview did not become ready.");
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  browser = await chromium.launch({
    channel: process.env.PLAYWRIGHT_CHANNEL || "chrome",
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of [
    "/",
    "/services",
    "/work",
    "/work/crestview",
    "/work/perovskite-machine-learning",
    "/login",
    "/register",
    "/solutions",
    "/templates/cafe-restaurant",
    "/pricing",
    "/about",
    "/contact",
  ]) {
    await page.goto(`${baseUrl}${route}`);
    await page.locator("h1").first().waitFor();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `Overflow on ${route}`,
    );
  }
  await page.goto(`${baseUrl}/`);
  assert.equal(
    await page
      .getByRole("link", { name: /GitHub/ })
      .first()
      .getAttribute("href"),
    "https://github.com/EliQeiz",
  );
  assert.equal(
    await page
      .getByRole("link", { name: /LinkedIn/ })
      .first()
      .getAttribute("href"),
    "https://www.linkedin.com/in/elisha-afari",
  );
  assert.equal(
    await page
      .getByRole("link", { name: /Download résumé/ })
      .first()
      .getAttribute("href"),
    "/media/portfolio/Elisha-Afari-Resume.pdf",
  );
  await page.getByRole("button", { name: "Web applications" }).click();
  await page.getByRole("heading", { name: "Web applications" }).waitFor();
  await page.getByRole("link", { name: "All projects & designs" }).click();
  await page.waitForURL(`${baseUrl}/work`);
  assert.equal(
    await page
      .getByRole("link", { name: /Open school website/ })
      .first()
      .getAttribute("href"),
    "https://www.crestviewschool.com/",
  );
  await page.getByRole("button", { name: "Design studies" }).click();
  await page.getByRole("heading", { name: "Made for the setting." }).waitFor();
  await page.goto(`${baseUrl}/templates`);
  await page
    .getByRole("tab", { name: "Website templates", exact: true })
    .click();
  await page.getByLabel("Search templates").fill("Cafe");
  await page.getByRole("link", { name: "View template", exact: true }).click();
  await page
    .getByRole("button", { name: "Mobile preview", exact: true })
    .click();
  await page.locator("iframe").scrollIntoViewIfNeeded();
  await page
    .frameLocator("iframe")
    .getByRole("link", {
      name: "Open private workspace",
      exact: true,
    })
    .click();
  await page.waitForURL(`${baseUrl}/login`);
  await page.getByLabel("Email address", { exact: true }).waitFor();
  for (const route of ["/dashboard", "/dashboard/admin", "/dashboard/studio"]) {
    await page.goto(`${baseUrl}${route}`);
    await page.waitForURL(`${baseUrl}/login`);
    await page.getByLabel("Email address", { exact: true }).waitFor();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of [
    "/",
    "/work",
    "/services",
    "/login",
    "/register",
    "/templates",
    "/about",
    "/contact",
  ]) {
    await page.goto(`${baseUrl}${route}`);
    await page.locator("h1").first().waitFor();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      `Mobile overflow on ${route}`,
    );
  }
  await page.goto(`${baseUrl}/contact?service=Website%20or%20portfolio`);
  await page.getByRole("heading", { name: /Bring the problem/i }).waitFor();
  assert.equal(
    await page.getByLabel("What do you need?").inputValue(),
    "Website or portfolio",
  );
  await page.getByRole("button", { name: "Send project brief" }).click();
  await page.getByText("Enter your name.").waitFor();
  await page.goto(`${baseUrl}/`);
  assert.equal(
    await page.locator('link[rel="canonical"]').getAttribute("href"),
    "https://aura-flow-red.vercel.app/",
  );
  for (const slug of [
    "crestview",
    "buildproof",
    "perovskite-machine-learning",
    "edma",
    "minat",
    "jollofvibes",
  ]) {
    await page.goto(`${baseUrl}/work/${slug}`);
    await page
      .getByRole("heading", { name: "What I built and shaped." })
      .waitFor();
    await page
      .getByRole("heading", { name: "What exists as a result." })
      .waitFor();
  }
  const resumeResponse = await page.request.get(
    `${baseUrl}/media/portfolio/Elisha-Afari-Resume.pdf`,
  );
  assert.equal(resumeResponse.status(), 200);
  assert.match(
    resumeResponse.headers()["content-type"] || "",
    /application\/pdf/,
  );

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await mobileContext.route(/\/media\/portfolio\/.*\.mp4$/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    await route.continue();
  });
  const freshPage = await mobileContext.newPage();
  const mobileErrors = [];
  freshPage.on("pageerror", (error) => mobileErrors.push(error.message));
  for (const slug of [
    "crestview",
    "buildproof",
    "edma",
    "minat",
    "jollofvibes",
  ]) {
    await freshPage.goto(`${baseUrl}/work/${slug}`);
    const preview = freshPage.locator(".showcase-media video").first();
    await preview.scrollIntoViewIfNeeded();
    await freshPage.waitForTimeout(250);
    assert.equal(
      await freshPage.locator(".showcase-error").count(),
      0,
      `Transient unavailable state on ${slug}`,
    );
    await preview.evaluate((element) => {
      const video = element;
      video.muted = true;
      void video.play().catch(() => undefined);
    });
    await freshPage.waitForFunction(
      (element) => element.readyState >= 1 || element.error !== null,
      await preview.elementHandle(),
    );
    assert.equal(await preview.evaluate((video) => video.error), null);
    assert.equal(await freshPage.locator(".showcase-error").count(), 0);
  }
  assert.deepEqual(mobileErrors, []);
  await mobileContext.close();
  assert.deepEqual(errors, []);
  console.log(
    "Production bundle smoke passed: public routes, no runtime errors or horizontal overflow, and template preview handoff to sign-in.",
  );
} finally {
  await browser?.close();
  if (server && server.exitCode === null) {
    const stopped = once(server, "exit");
    server.kill();
    await stopped;
  }
}
