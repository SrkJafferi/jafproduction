/**
 * Generates poster thumbnails for the "Products Reels" band.
 *
 * The product films live on the jsDelivr CDN and there is no ffmpeg on this
 * machine, so the frames are pulled with the one decoder that is already
 * installed: a branded Google Chrome, driven over the DevTools Protocol. For
 * each film the page seeks a short way in, draws the frame to a canvas and
 * hands back a WebP data URL, which is written to `public/images/reels/`.
 *
 * jsDelivr serves the films with `access-control-allow-origin: *`, so the
 * canvas stays untainted and `toDataURL` works.
 *
 * Usage:  node scripts/generate-reel-posters.mjs
 * Env:    CHROME_PATH  override the Chrome/Edge binary
 */

import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public', 'images', 'reels')

const CDN = 'https://cdn.jsdelivr.net/gh/SrkJafferi/jaftrading@main'

/** Repo-relative paths of the reels, in the order the band shows them. */
const REELS = [
  'jaftradings01.mp4',
  'jaftradings02.mp4',
  'p01.mp4',
  'gallery/jaftradings14.mp4',
  'gallery/p04.mp4',
  'gallery/p05.mp4',
  'gallery/p06.mp4',
  'gallery/p07.mp4',
  'gallery/p08.mp4',
  'gallery/p09.mp4',
  'gallery/p10.mp4',
  'gallery/p11.mp4',
  'gallery/jaftradings13.mp4',
]

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean)

const PORT = 9333

/** `jaftradings01.mp4` -> `jaftradings01`; `gallery/p04.mp4` -> `p04`. */
const slugOf = (rel) => rel.replace(/^gallery\//, '').replace(/\.mp4$/, '')

/** Minimal CDP client over Node's built-in WebSocket. */
function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl)
    let nextId = 0
    const pending = new Map()

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (!msg.id || !pending.has(msg.id)) return
      const { resolve: res, reject: rej } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) rej(new Error(JSON.stringify(msg.error)))
      else res(msg.result)
    }
    ws.onerror = () => reject(new Error('DevTools socket error'))
    ws.onopen = () =>
      resolve({
        send(method, params = {}) {
          const id = ++nextId
          return new Promise((res, rej) => {
            pending.set(id, { resolve: res, reject: rej })
            ws.send(JSON.stringify({ id, method, params }))
          })
        },
        close: () => ws.close(),
      })
  })
}

async function waitForTarget() {
  for (let attempt = 0; attempt < 120; attempt++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
      const list = await res.json()
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl)
      if (page) return page.webSocketDebuggerUrl
    } catch {
      /* devtools not up yet */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error('DevTools endpoint never came up')
}

/** The in-page capture: load, seek, draw to canvas, return a WebP data URL. */
function captureExpression(url) {
  return `(async () => {
    const v = document.createElement('video');
    v.src = ${JSON.stringify(url)};
    v.crossOrigin = 'anonymous';
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.style.cssText = 'position:fixed;left:0;top:0;width:720px;height:1280px;opacity:0;pointer-events:none';
    document.body.appendChild(v);

    await new Promise((resolve, reject) => {
      const to = setTimeout(() => reject(new Error('load timeout')), 120000);
      v.addEventListener('loadeddata', () => { clearTimeout(to); resolve(); }, { once: true });
      v.addEventListener('error', () => { clearTimeout(to); reject(new Error('decode error')); }, { once: true });
    });

    const duration = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : 2;
    const target = Math.min(1.5, duration * 0.15);
    if (target > 0.05) {
      await new Promise((resolve) => {
        const to = setTimeout(resolve, 10000);
        v.addEventListener('seeked', () => { clearTimeout(to); resolve(); }, { once: true });
        v.currentTime = target;
      });
    }
    // Give the compositor a beat to paint the sought frame.
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 250)));

    const canvas = document.createElement('canvas');
    canvas.width = v.videoWidth || 720;
    canvas.height = v.videoHeight || 1280;
    canvas.getContext('2d').drawImage(v, 0, 0, canvas.width, canvas.height);
    const data = canvas.toDataURL('image/webp', 0.82);
    v.remove();
    return JSON.stringify({ data, width: canvas.width, height: canvas.height });
  })()`
}

async function main() {
  const chrome = CHROME_CANDIDATES.find((p) => existsSync(p))
  if (!chrome) throw new Error('No Chrome/Edge binary found — set CHROME_PATH')

  mkdirSync(OUT_DIR, { recursive: true })

  const userDataDir = join(tmpdir(), `reel-posters-${Date.now()}`)
  const proc = spawn(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--mute-audio',
      '--no-first-run',
      '--no-default-browser-check',
      '--autoplay-policy=no-user-gesture-required',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${userDataDir}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  let cdp
  try {
    cdp = await connect(await waitForTarget())
    await cdp.send('Runtime.enable')
    await cdp.send('Page.enable')

    const failures = []
    for (const rel of REELS) {
      const slug = slugOf(rel)
      const url = `${CDN}/${rel}`
      process.stdout.write(`→ ${slug} … `)
      try {
        const { result, exceptionDetails } = await cdp.send('Runtime.evaluate', {
          expression: captureExpression(url),
          awaitPromise: true,
          returnByValue: true,
        })
        if (exceptionDetails) throw new Error(exceptionDetails.exception?.description ?? 'evaluate failed')
        const { data, width, height } = JSON.parse(result.value)
        const buffer = Buffer.from(data.split(',')[1], 'base64')
        writeFileSync(join(OUT_DIR, `${slug}.webp`), buffer)
        console.log(`${width}x${height}, ${(buffer.length / 1024).toFixed(0)} KB`)
      } catch (error) {
        console.log(`FAILED — ${error.message}`)
        failures.push(slug)
      }
    }

    console.log(failures.length ? `\nFailed: ${failures.join(', ')}` : '\nAll posters written.')
  } finally {
    cdp?.close()
    proc.kill()
    try {
      rmSync(userDataDir, { recursive: true, force: true })
    } catch {
      /* best effort */
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
