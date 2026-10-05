const puppeteer = require('puppeteer-core');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const FFMPEG_PATH = 'C:\\Users\\acer\\AppData\\Local\\Programs\\Python\\Python314\\Lib\\site-packages\\imageio_ffmpeg\\binaries\\ffmpeg-win-x86_64-v7.1.exe';
const RAW_VIDEO = path.join(__dirname, 'raw_video.mp4');
const FINAL_VIDEO = path.join(__dirname, 'beauty_abyssi_booking_tutorial.mp4');
const MASTER_AUDIO = path.join(__dirname, 'master_voiceover.mp3');
const TIMING_FILE = path.join(__dirname, 'voice_timing.json');

// Target resolution: 1080x1920 (9:16 vertical Full HD)
const VIEWPORT_WIDTH = 450;
const VIEWPORT_HEIGHT = 800;
const SCALE_FACTOR = 2.4;
const FPS = 25;

async function run() {
  console.log('--- BEAUTY ABYSSI BOOKING TUTORIAL (V6 - SYNCED VOICE OVER & VIDEO) ---');
  
  if (!fs.existsSync(TIMING_FILE) || !fs.existsSync(MASTER_AUDIO)) {
    throw new Error('Missing voice_timing.json or master_voiceover.mp3!');
  }

  const timingList = JSON.parse(fs.readFileSync(TIMING_FILE, 'utf8'));
  const timingMap = {};
  timingList.forEach(t => { timingMap[t.id] = t; });

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      `--window-size=${VIEWPORT_WIDTH},${VIEWPORT_HEIGHT}`
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: VIEWPORT_WIDTH,
    height: VIEWPORT_HEIGHT,
    deviceScaleFactor: SCALE_FACTOR,
    isMobile: true,
    hasTouch: true
  });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
  await page.waitForSelector('header');
  await page.waitForSelector('#servicesSection');
  await new Promise(r => setTimeout(r, 1000));

  const ffmpeg = spawn(FFMPEG_PATH, [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-framerate', String(FPS),
    '-i', '-',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'medium',
    '-crf', '18',
    RAW_VIDEO
  ]);

  let totalFrames = 0;
  async function captureFrames(count = 1) {
    for (let i = 0; i < count; i++) {
      const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
      ffmpeg.stdin.write(buf);
      totalFrames++;
    }
  }

  // Inject UI Overlays:
  // 1. Classic PC Arrow Cursor
  // 2. Click Ripple Ring
  // 3. Synchronized Subtitle Bar
  await page.evaluate(() => {
    const style = document.createElement('style');
    const cursorSvg = encodeURIComponent(`
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 2L3 21L7.8 16.2L12.5 22.8L15.6 20.8L10.9 14.5L17.5 14.5L3 2Z" fill="white" stroke="#18181b" stroke-width="1.8" stroke-linejoin="round"/>
      </svg>
    `.trim());

    style.innerHTML = `
      #pc-cursor {
        position: fixed;
        width: 28px;
        height: 28px;
        background-image: url('data:image/svg+xml;utf8,${cursorSvg}');
        background-size: contain;
        background-repeat: no-repeat;
        pointer-events: none;
        z-index: 9999999;
        transform: translate(0, 0);
        transition: transform 0.04s ease-out;
        opacity: 0;
        filter: drop-shadow(0 3px 6px rgba(0,0,0,0.5));
      }
      #pc-cursor.visible {
        opacity: 1;
      }
      #pc-cursor.clicking {
        transform: scale(0.85) translate(2px, 2px);
      }
      .pc-click-ripple {
        position: fixed;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 3.5px solid #f59e0b;
        background: radial-gradient(circle, rgba(245, 158, 11, 0.5) 0%, rgba(245, 158, 11, 0) 70%);
        pointer-events: none;
        z-index: 9999998;
        transform: translate(-50%, -50%) scale(0.2);
        opacity: 1;
        animation: pcRipple 0.38s ease-out forwards;
      }
      @keyframes pcRipple {
        0% { transform: translate(-50%, -50%) scale(0.2); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
      }

      /* Clean Subtitle Bar at Bottom */
      #subtitle-bar {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 92%;
        max-width: 414px;
        background: rgba(18, 18, 22, 0.94);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1.5px solid rgba(245, 158, 11, 0.85);
        box-shadow: 0 12px 36px rgba(0, 0, 0, 0.75), 0 0 20px rgba(245, 158, 11, 0.25);
        padding: 10px 15px;
        border-radius: 18px;
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        text-align: left;
        pointer-events: none;
        z-index: 9999997;
        display: flex;
        flex-direction: column;
        gap: 3px;
        transition: all 0.25s ease-out;
      }
      #sub-tag {
        display: inline-block;
        align-self: flex-start;
        background: linear-gradient(135deg, #fbbf24, #d97706);
        color: #18181b;
        font-size: 10px;
        font-weight: 800;
        padding: 2px 8px;
        border-radius: 6px;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      }
      #sub-text {
        font-size: 13.5px;
        font-weight: 600;
        line-height: 1.35;
        color: #ffffff;
        letter-spacing: -0.1px;
      }
    `;
    document.head.appendChild(style);

    const cursor = document.createElement('div');
    cursor.id = 'pc-cursor';
    document.body.appendChild(cursor);

    const subBar = document.createElement('div');
    subBar.id = 'subtitle-bar';
    subBar.innerHTML = `
      <span id="sub-tag">WELCOME</span>
      <span id="sub-text">Beauty Abyssi • Pretty Nails, Happy You</span>
    `;
    document.body.appendChild(subBar);

    window.__setCursorPos = (x, y, visible = true, clicking = false) => {
      const c = document.getElementById('pc-cursor');
      if (!c) return;
      c.style.left = `${x - 2}px`;
      c.style.top = `${y - 1}px`;
      if (visible) c.classList.add('visible');
      else c.classList.remove('visible');
      if (clicking) c.classList.add('clicking');
      else c.classList.remove('clicking');
    };

    window.__triggerRipple = (x, y) => {
      const r = document.createElement('div');
      r.className = 'pc-click-ripple';
      r.style.left = `${x}px`;
      r.style.top = `${y}px`;
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 400);
    };

    window.__setSubtitle = (tag, text) => {
      const tg = document.getElementById('sub-tag');
      const tx = document.getElementById('sub-text');
      if (tg) tg.innerText = tag;
      if (tx) tx.innerText = text;
    };
  });

  let curX = 225;
  let curY = 400;

  async function updateSubtitle(tag, text) {
    await page.evaluate((tg, tx) => window.__setSubtitle(tg, tx), tag, text);
  }

  async function setCursor(x, y, visible = true, clicking = false) {
    curX = x;
    curY = y;
    await page.evaluate((px, py, v, c) => window.__setCursorPos(px, py, v, c), x, y, visible, clicking);
  }

  async function moveCursorSmooth(targetX, targetY, frames = 16) {
    const startX = curX;
    const startY = curY;
    for (let f = 1; f <= frames; f++) {
      const progress = f / frames;
      const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      const x = startX + (targetX - startX) * ease;
      const y = startY + (targetY - startY) * ease;
      await setCursor(x, y, true, false);
      await captureFrames(1);
    }
    curX = targetX;
    curY = targetY;
  }

  async function clickAt(x, y, holdFrames = 6) {
    await setCursor(x, y, true, false);
    await captureFrames(2);
    await page.evaluate((rx, ry) => window.__triggerRipple(rx, ry), x, y);
    await setCursor(x, y, true, true);
    await captureFrames(holdFrames);
    await setCursor(x, y, true, false);
    await captureFrames(3);
  }

  async function smoothScrollWindow(targetY, frames = 25) {
    const startY = await page.evaluate(() => window.scrollY);
    for (let f = 1; f <= frames; f++) {
      const progress = f / frames;
      const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      const y = startY + (targetY - startY) * ease;
      await page.evaluate(sy => window.scrollTo(0, sy), y);
      await captureFrames(1);
    }
  }

  async function smoothScrollForm(targetScrollTop, frames = 20) {
    const startScrollTop = await page.evaluate(() => {
      const form = document.querySelector('form');
      return form ? form.scrollTop : 0;
    });

    for (let f = 1; f <= frames; f++) {
      const progress = f / frames;
      const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      const top = startScrollTop + (targetScrollTop - startScrollTop) * ease;
      await page.evaluate(st => {
        const form = document.querySelector('form');
        if (form) form.scrollTop = st;
      }, top);
      await captureFrames(1);
    }
  }

  async function typeIntoReactInput(selector, fullText, frameDelay = 2) {
    for (let i = 1; i <= fullText.length; i++) {
      const partial = fullText.slice(0, i);
      await page.evaluate((sel, val) => {
        const el = document.querySelector(sel);
        if (!el) return;
        const proto = el instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (setter) setter.call(el, val);
        else el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }, selector, partial);
      await captureFrames(frameDelay);
    }
  }

  // =========================================================================
  // SCENE 1: WELCOME & SCROLL DOWN PAST STUDIO REEL TO CATALOG (6.6s)
  // Voice: "Welcome to Beauty Abyssi! Let's scroll down to explore our luxury nail and pedicure treatments."
  // =========================================================================
  const s1 = timingMap['scene1'];
  const s1TargetFrames = Math.round(s1.duration * FPS);
  const s1StartFrame = totalFrames;
  console.log(`[Scene 1] Target: ${s1TargetFrames} frames (${s1.duration}s)...`);

  await updateSubtitle('WELCOME', s1.text);
  await setCursor(225, 420, true, false);
  await captureFrames(FPS * 1.8);

  // Smooth scroll down directly past the studio reel straight to servicesSection (scrollY = 2980)
  await smoothScrollWindow(2980, 40);
  
  // Pad remaining frames to lock sync with voiceover
  const s1Used = totalFrames - s1StartFrame;
  if (s1TargetFrames > s1Used) await captureFrames(s1TargetFrames - s1Used);

  // =========================================================================
  // SCENE 2A: FILTER BY HAND NAILS (6.12s)
  // Voice: "Filter by Hand nails to browse classic manicures, gel, French tips, and cat-eye art."
  // =========================================================================
  const s2Hand = timingMap['scene2_hand'];
  const s2HandTargetFrames = Math.round(s2Hand.duration * FPS);
  const s2HandStartFrame = totalFrames;
  console.log(`[Scene 2 Hand] Target: ${s2HandTargetFrames} frames (${s2Hand.duration}s)...`);

  await updateSubtitle('HAND NAILS', s2Hand.text);
  const handFilterBox = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('For Hand'));
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });

  if (handFilterBox) {
    await moveCursorSmooth(handFilterBox.x, handFilterBox.y, 18);
    await clickAt(handFilterBox.x, handFilterBox.y, 6);
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('For Hand'));
      if (btn) btn.click();
    });
  }

  const s2HandUsed = totalFrames - s2HandStartFrame;
  if (s2HandTargetFrames > s2HandUsed) await captureFrames(s2HandTargetFrames - s2HandUsed);

  // =========================================================================
  // SCENE 2B: EXPLORE PEDICURES (4.70s)
  // Voice: "Or explore our Pedicures for relaxing foot care and luxury designs."
  // =========================================================================
  const s2Pedi = timingMap['scene2_pedi'];
  const s2PediTargetFrames = Math.round(s2Pedi.duration * FPS);
  const s2PediStartFrame = totalFrames;
  console.log(`[Scene 2 Pedi] Target: ${s2PediTargetFrames} frames (${s2Pedi.duration}s)...`);

  await updateSubtitle('PEDICURES', s2Pedi.text);
  const legFilterBox = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('For Leg'));
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });

  if (legFilterBox) {
    await moveCursorSmooth(legFilterBox.x, legFilterBox.y, 16);
    await clickAt(legFilterBox.x, legFilterBox.y, 6);
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.innerText.includes('For Leg'));
      if (btn) btn.click();
    });
  }

  const s2PediUsed = totalFrames - s2PediStartFrame;
  if (s2PediTargetFrames > s2PediUsed) await captureFrames(s2PediTargetFrames - s2PediUsed);

  // =========================================================================
  // SCENE 2C: CUSTOM INSPO SHOWCASE (6.02s)
  // Voice: "Have a design from Pinterest or TikTok? We bring any custom nail photo to life!"
  // =========================================================================
  const s2Inspo = timingMap['scene2_inspo'];
  const s2InspoTargetFrames = Math.round(s2Inspo.duration * FPS);
  const s2InspoStartFrame = totalFrames;
  console.log(`[Scene 2 Inspo] Target: ${s2InspoTargetFrames} frames (${s2Inspo.duration}s)...`);

  await updateSubtitle('CUSTOM INSPO', s2Inspo.text);
  await smoothScrollWindow(4450, 30);
  
  const s2InspoUsed = totalFrames - s2InspoStartFrame;
  if (s2InspoTargetFrames > s2InspoUsed) await captureFrames(s2InspoTargetFrames - s2InspoUsed);

  // =========================================================================
  // SCENE 3: SELECTING CLASSIC MANICURE (5.45s)
  // Voice: "Let's book Classic Manicure! Simply click 'Book' right on the treatment card."
  // =========================================================================
  const s3Book = timingMap['scene3_book'];
  const s3BookTargetFrames = Math.round(s3Book.duration * FPS);
  const s3BookStartFrame = totalFrames;
  console.log(`[Scene 3 Book] Target: ${s3BookTargetFrames} frames (${s3Book.duration}s)...`);

  await updateSubtitle('CLICK BOOK', s3Book.text);
  // Switch back to "All" to show Classic Manicure
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.trim() === 'All');
    if (btn) btn.click();
  });
  // Center Classic Manicure card
  await smoothScrollWindow(3120, 22);

  const classicManiBtnBox = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h3'));
    const h3 = headings.find(h => h.innerText.includes('Classic Manicure'));
    if (!h3) return null;
    const card = h3.closest('.group');
    if (!card) return null;
    const btn = card.querySelector('button');
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });

  if (classicManiBtnBox) {
    await moveCursorSmooth(classicManiBtnBox.x, classicManiBtnBox.y, 18);
    await clickAt(classicManiBtnBox.x, classicManiBtnBox.y, 8);
    await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h3'));
      const h3 = headings.find(h => h.innerText.includes('Classic Manicure'));
      const card = h3?.closest('.group');
      card?.querySelector('button')?.click();
    });
  }

  const s3BookUsed = totalFrames - s3BookStartFrame;
  if (s3BookTargetFrames > s3BookUsed) await captureFrames(s3BookTargetFrames - s3BookUsed);

  // =========================================================================
  // SCENE 4: COMBINE PEDICURE & HIGHLIGHT CUSTOM INSPO TAB (6.98s)
  // Voice: "Classic Manicure is selected. You can combine a Pedicure, or attach custom photo references."
  // =========================================================================
  const s4Combo = timingMap['scene4_combo'];
  const s4ComboTargetFrames = Math.round(s4Combo.duration * FPS);
  const s4ComboStartFrame = totalFrames;
  console.log(`[Scene 4 Combo] Target: ${s4ComboTargetFrames} frames (${s4Combo.duration}s)...`);

  await updateSubtitle('RESERVATION', s4Combo.text);
  await captureFrames(12);

  // Add Pedicure combo
  const pediTabBox = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const pediBtn = btns.find(b => b.innerText.trim() === 'Pedicure');
    if (!pediBtn) return null;
    const rect = pediBtn.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });

  if (pediTabBox) {
    await moveCursorSmooth(pediTabBox.x, pediTabBox.y, 14);
    await clickAt(pediTabBox.x, pediTabBox.y, 6);
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const pediBtn = btns.find(b => b.innerText.trim() === 'Pedicure');
      if (pediBtn) pediBtn.click();
    });
    await captureFrames(6);

    const pediServiceBox = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const card = btns.find(b => b.innerText.includes('Classic Pedicure'));
      if (!card) return null;
      const rect = card.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });

    if (pediServiceBox) {
      await moveCursorSmooth(pediServiceBox.x, pediServiceBox.y, 14);
      await clickAt(pediServiceBox.x, pediServiceBox.y, 6);
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const card = btns.find(b => b.innerText.includes('Classic Pedicure'));
        if (card) card.click();
      });
    }
  }

  // Highlight Custom Inspo tab
  const inspoTabBox = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const inspoBtn = btns.find(b => b.innerText.includes('Custom Inspo'));
    if (!inspoBtn) return null;
    const rect = inspoBtn.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });

  if (inspoTabBox) {
    await moveCursorSmooth(inspoTabBox.x, inspoTabBox.y, 15);
  }

  const s4ComboUsed = totalFrames - s4ComboStartFrame;
  if (s4ComboTargetFrames > s4ComboUsed) await captureFrames(s4ComboTargetFrames - s4ComboUsed);

  // =========================================================================
  // SCENE 5: APPOINTMENT DATE SELECTION (3.12s)
  // Voice: "Choose your preferred appointment date on the calendar."
  // =========================================================================
  const s5Date = timingMap['scene5_date'];
  const s5DateTargetFrames = Math.round(s5Date.duration * FPS);
  const s5DateStartFrame = totalFrames;
  console.log(`[Scene 5 Date] Target: ${s5DateTargetFrames} frames (${s5Date.duration}s)...`);

  await updateSubtitle('STEP 1: DATE', s5Date.text);
  await smoothScrollForm(320, 16);

  const dateInputBox = await page.evaluate(() => {
    const input = document.querySelector('input[type="date"]');
    if (!input) return null;
    const rect = input.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });

  if (dateInputBox) {
    await moveCursorSmooth(dateInputBox.x, dateInputBox.y, 12);
    await clickAt(dateInputBox.x, dateInputBox.y, 5);

    await page.evaluate(() => {
      const input = document.querySelector('input[type="date"]');
      if (input) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
        if (setter) setter.call(input, '2026-10-10');
        else input.value = '2026-10-10';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }

  const s5DateUsed = totalFrames - s5DateStartFrame;
  if (s5DateTargetFrames > s5DateUsed) await captureFrames(s5DateTargetFrames - s5DateUsed);

  // =========================================================================
  // SCENE 6: CONTACT DETAILS WITH VILLAGE: KOMBOLCHA, SHISHA BER (5.71s)
  // Voice: "Enter your full name, active phone number, and your village: Kombolcha, Shisha Ber."
  // =========================================================================
  const s6Details = timingMap['scene6_details'];
  const s6DetailsTargetFrames = Math.round(s6Details.duration * FPS);
  const s6DetailsStartFrame = totalFrames;
  console.log(`[Scene 6 Details] Target: ${s6DetailsTargetFrames} frames (${s6Details.duration}s)...`);

  await updateSubtitle('STEP 2: DETAILS', s6Details.text);

  // Name
  const nameBox = await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="Sara"]');
    if (!input) return null;
    const rect = input.getBoundingClientRect();
    return { x: rect.left + 70, y: rect.top + rect.height / 2 };
  });

  if (nameBox) {
    await moveCursorSmooth(nameBox.x, nameBox.y, 10);
    await clickAt(nameBox.x, nameBox.y, 3);
    await typeIntoReactInput('input[placeholder*="Sara"]', 'Sara Bekele', 1);
  }

  // Phone
  const phoneBox = await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="0911"]');
    if (!input) return null;
    const rect = input.getBoundingClientRect();
    return { x: rect.left + 70, y: rect.top + rect.height / 2 };
  });

  if (phoneBox) {
    await moveCursorSmooth(phoneBox.x, phoneBox.y, 10);
    await clickAt(phoneBox.x, phoneBox.y, 3);
    await typeIntoReactInput('input[placeholder*="0911"]', '0911234567', 1);
  }

  // Village
  const addressBox = await page.evaluate(() => {
    const input = document.querySelector('input[placeholder*="Kombolcha"]');
    if (!input) return null;
    const rect = input.getBoundingClientRect();
    return { x: rect.left + 70, y: rect.top + rect.height / 2 };
  });

  if (addressBox) {
    await moveCursorSmooth(addressBox.x, addressBox.y, 10);
    await clickAt(addressBox.x, addressBox.y, 3);
    await typeIntoReactInput('input[placeholder*="Kombolcha"]', 'Kombolcha, Shisha Ber', 1);
  }

  const s6DetailsUsed = totalFrames - s6DetailsStartFrame;
  if (s6DetailsTargetFrames > s6DetailsUsed) await captureFrames(s6DetailsTargetFrames - s6DetailsUsed);

  // =========================================================================
  // SCENE 7: NOTES & CONFIRM ONLINE (4.87s)
  // Voice: "Add your shape or polish notes, and tap 'Confirm & Register Online'!"
  // =========================================================================
  const s7Submit = timingMap['scene7_submit'];
  const s7SubmitTargetFrames = Math.round(s7Submit.duration * FPS);
  const s7SubmitStartFrame = totalFrames;
  console.log(`[Scene 7 Submit] Target: ${s7SubmitTargetFrames} frames (${s7Submit.duration}s)...`);

  await updateSubtitle('STEP 3: CONFIRM', s7Submit.text);
  await smoothScrollForm(580, 16);

  const notesBox = await page.evaluate(() => {
    const ta = document.querySelector('textarea');
    if (!ta) return null;
    const rect = ta.getBoundingClientRect();
    return { x: rect.left + 70, y: rect.top + rect.height / 2 };
  });

  if (notesBox) {
    await moveCursorSmooth(notesBox.x, notesBox.y, 10);
    await clickAt(notesBox.x, notesBox.y, 3);
    await typeIntoReactInput('textarea', 'Classic nude shine & neat cuticles', 1);
  }

  const submitBtnBox = await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]');
    if (!btn) return null;
    const rect = btn.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });

  if (submitBtnBox) {
    await moveCursorSmooth(submitBtnBox.x, submitBtnBox.y, 12);
    await clickAt(submitBtnBox.x, submitBtnBox.y, 6);
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    });
  }

  const s7SubmitUsed = totalFrames - s7SubmitStartFrame;
  if (s7SubmitTargetFrames > s7SubmitUsed) await captureFrames(s7SubmitTargetFrames - s7SubmitUsed);

  // =========================================================================
  // SCENE 8: FAST CONFIRMATION & 1-CLICK TELEGRAM (7.08s)
  // Voice: "You're officially registered! Tap 'Direct Chat' to message the artist on Telegram. Done!"
  // =========================================================================
  const s8Confirm = timingMap['scene8_confirm'];
  const s8ConfirmTargetFrames = Math.round(s8Confirm.duration * FPS);
  const s8ConfirmStartFrame = totalFrames;
  console.log(`[Scene 8 Confirm] Target: ${s8ConfirmTargetFrames} frames (${s8Confirm.duration}s)...`);

  await updateSubtitle('SUCCESS! 🎉', s8Confirm.text);
  await captureFrames(20);

  const tgBtnBox = await page.evaluate(() => {
    const tgBtn = document.querySelector('a[href*="t.me"]');
    if (!tgBtn) return null;
    const rect = tgBtn.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  });

  if (tgBtnBox) {
    await moveCursorSmooth(tgBtnBox.x, tgBtnBox.y, 16);
    await page.evaluate((rx, ry) => window.__triggerRipple(rx, ry), tgBtnBox.x, tgBtnBox.y);
    await setCursor(tgBtnBox.x, tgBtnBox.y, true, true);
    await captureFrames(8);
    await setCursor(tgBtnBox.x, tgBtnBox.y, true, false);
  }

  const s8ConfirmUsed = totalFrames - s8ConfirmStartFrame;
  if (s8ConfirmTargetFrames > s8ConfirmUsed) await captureFrames(s8ConfirmTargetFrames - s8ConfirmUsed);

  console.log('Finalizing raw video recording...');
  ffmpeg.stdin.end();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });

  await browser.close();

  console.log('Merging raw video with crystal-clear voiceover audio...');
  const mergeCmd = [
    FFMPEG_PATH, '-y',
    '-i', RAW_VIDEO,
    '-i', MASTER_AUDIO,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    FINAL_VIDEO
  ];

  execSync(`"${FFMPEG_PATH}" -y -i "${RAW_VIDEO}" -i "${MASTER_AUDIO}" -c:v copy -c:a aac -b:a 192k -shortest "${FINAL_VIDEO}"`, { stdio: 'inherit' });

  // Clean up temporary raw video
  try { fs.unlinkSync(RAW_VIDEO); } catch(e) {}

  const stats = fs.statSync(FINAL_VIDEO);
  console.log('====================================');
  console.log('SUCCESS! Voiceover + Tutorial Video Generated:');
  console.log('File:', FINAL_VIDEO);
  console.log('Size:', (stats.size / (1024 * 1024)).toFixed(2), 'MB');
  console.log('Total frames:', totalFrames);
  console.log('Duration:', (totalFrames / FPS).toFixed(1), 'seconds');
  console.log('====================================');
}

run().catch(err => {
  console.error('Video generation failed:', err);
  process.exit(1);
});
