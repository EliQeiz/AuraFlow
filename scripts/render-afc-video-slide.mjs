import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { chromium } from '@playwright/test'

const [input, output] = process.argv.slice(2)

if (!input || !output) {
  throw new Error('Usage: node render-afc-video-slide.mjs <input.svg> <output.png>')
}

const svg = await readFile(input, 'utf8')
const fallbackExecutable = `${process.env.LOCALAPPDATA}\\ms-playwright\\chromium-1223\\chrome-win64\\chrome.exe`
const browser = await chromium.launch({
  headless: true,
  ...(existsSync(fallbackExecutable) ? { executablePath: fallbackExecutable } : {}),
})

try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 })
  await page.setContent(svg, { waitUntil: 'load' })
  await page.screenshot({ path: output, type: 'png' })
} finally {
  await browser.close()
}
