const puppeteer = require('puppeteer-core');
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const FFMPEG_PATH = 'C:\\Users\\acer\\AppData\\Local\\Programs\\Python\\Python314\\Lib\\site-packages\\imageio_ffmpeg\\binaries\\ffmpeg-win-x86_64-v7.1.exe';
const RAW_VIDEO = path.join(__dirname, 'raw_inspo_video.mp4');
const FINAL_VIDEO = path.join(__dirname, 'beauty_abyssi_booking_tutorial.mp4');
const MASTER_AUDIO = path.join(__dirname, 'master_inspo_voiceover.mp3');
const TIMING_FILE = path.join(__dirname, 'inspo_voice_timing.json');
const SAMPLE_PHOTO = path.join(__dirname, 'uploads', 'custom-tiktok-inspo.jpg');

// Target resolution: 1080x1920 (9:16 vertical Full HD)
const VIEWPORT_WIDTH = 450;
const VIEWPORT_HEIGHT = 800;
const SCALE_FACTOR = 2.4;
const FPS = 25;

async function run() {
  console.log('--- BEAUTY ABYSSI BOOKING TUTORIAL (CUSTOM INSPO + GROUP DISCOUNT + CATALOG REVIEW) ---');
  
  if (!fs.existsSync(TIMING_FILE) || !fs.existsSync(MASTER_AUDIO)) {
    throw new Error('Missing inspo_voice_timing.json or master_inspo_voiceover.mp3!');
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
  await page.waitForSelector('#inspoSection');
  await new Promise(r => setTimeout(r, 1000));

  const ffmpeg = spawn(FFMPEG_PATH, [
    '-y',
    '-f', 'image2pipe',
    '-vcodec', 'mjpeg',
    '-framerate', String(FPS),
    '-i', '-',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'fast',
    '-crf', '19',
    RAW_VIDEO
  ], {
    stdio: ['pipe', 'ignore', 'ignore']
  });
  ffmpeg.stdin.on('error', (err) => console.error('FFmpeg stdin error:', err));

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
        filter: drop-shadow(0 3px 5px rgba(0,0,0,0.45));
        display: none;
      }
      #pc-cursor.clicking {
        transform: scale(0.85);
      }
      #click-ripple {
        position: fixed;
        width: 44px;
        height: 44px;
        border: 3.5px solid #f59e0b;
        background: radial-gradient(circle, rgba(245,158,11,0.4) 0%, rgba(245,158,11,0) 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999998;
        transform: translate(-50%, -50%) scale(0);
        opacity: 0;
        transition: transform 0.38s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.38s ease-out;
      }
      #click-ripple.active {
        transform: translate(-50%, -50%) scale(1.6);
        opacity: 0.95;
      }
      #tutorial-subtitle-bar {
        position: fixed;
        bottom: 24px;
        left: 16px;
        right: 16px;
        background: rgba(18, 18, 20, 0.94);
        backdrop-filter: blur(14px);
        border: 1.5px solid rgba(245, 158, 11, 0.45);
        box-shadow: 0 10px 30px rgba(0,0,0,0.65), 0 0 15px rgba(245, 158, 11, 0.25);
        border-radius: 20px;
        padding: 12px 16px;
        z-index: 9999990;
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: white;
        pointer-events: none;
        animation: subFadeIn 0.35s ease-out;
      }
      #sub-badge {
        display: inline-flex;
        align-items: center;
        align-self: flex-start;
        padding: 3px 10px;
        font-size: 10px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        border-radius: 9999px;
        background: linear-gradient(135deg, #f59e0b, #d97706);
        color: #1c1917;
      }
      #sub-text {
        font-size: 12.5px;
        font-weight: 600;
        line-height: 1.45;
        color: #f5f5f4;
      }
      @keyframes subFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(style);

    const cursor = document.createElement('div');
    cursor.id = 'pc-cursor';
    document.body.appendChild(cursor);

    const ripple = document.createElement('div');
    ripple.id = 'click-ripple';
    document.body.appendChild(ripple);

    const sub = document.createElement('div');
    sub.id = 'tutorial-subtitle-bar';
    sub.innerHTML = `
      <div id="sub-badge">BEAUTY ABYSSI</div>
      <div id="sub-text">Welcome to Beauty Abyssi</div>
    `;
    document.body.appendChild(sub);

    window.__setCursor = (x, y, visible = true, clicking = false) => {
      const cur = document.getElementById('pc-cursor');
      if (!cur) return;
      cur.style.display = visible ? 'block' : 'none';
      cur.style.left = `${x}px`;
      cur.style.top = `${y}px`;
      if (clicking) cur.classList.add('clicking');
      else cur.classList.remove('clicking');
    };

    window.__triggerRipple = (x, y) => {
      const rip = document.getElementById('click-ripple');
      if (!rip) return;
      rip.style.left = `${x}px`;
      rip.style.top = `${y}px`;
      rip.classList.remove('active');
      void rip.offsetWidth;
      rip.classList.add('active');
      setTimeout(() => rip.classList.remove('active'), 380);
    };

    window.__setSubtitle = (badge, text) => {
      const b = document.getElementById('sub-badge');
      const t = document.getElementById('sub-text');
      if (b) b.innerText = badge;
      if (t) t.innerText = text;
    };
  });

  let curX = 225;
  let curY = 320;

  async function setCursor(x, y, visible = true, clicking = false) {
    curX = x; curY = y;
    await page.evaluate((x, y, v, c) => window.__setCursor(x, y, v, c), x, y, visible, clicking);
  }

  async function updateSubtitle(badge, text) {
    await page.evaluate((b, t) => window.__setSubtitle(b, t), badge, text);
  }

  async function moveCursorSmooth(targetX, targetY, frames = 15) {
    const startX = curX;
    const startY = curY;
    for (let i = 1; i <= frames; i++) {
      const progress = i / frames;
      const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      const x = Math.round(startX + (targetX - startX) * ease);
      const y = Math.round(startY + (targetY - startY) * ease);
      await setCursor(x, y, true, false);
      await captureFrames(1);
    }
    curX = targetX;
    curY = targetY;
  }

  async function smoothScrollWindow(targetY, frames = 20) {
    const startY = await page.evaluate(() => window.scrollY);
    for (let i = 1; i <= frames; i++) {
      const p = i / frames;
      const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
      const y = Math.round(startY + (targetY - startY) * ease);
      await page.evaluate((sy) => window.scrollTo(0, sy), y);
      await captureFrames(1);
    }
  }

  async function smoothScrollModal(targetScrollTop, frames = 16) {
    const startTop = await page.evaluate(() => {
      const form = document.querySelector('form');
      return form ? form.scrollTop : 0;
    });
    for (let i = 1; i <= frames; i++) {
      const p = i / frames;
      const ease = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
      const top = Math.round(startTop + (targetScrollTop - startTop) * ease);
      await page.evaluate((st) => {
        const form = document.querySelector('form');
        if (form) form.scrollTop = st;
      }, top);
      await captureFrames(1);
    }
  }

  // -------------------------------------------------------------
  // SCENE 1: Welcome & Homepage Review (Intro)
  // -------------------------------------------------------------
  const s1 = timingMap['scene1_intro'];
  const s1TargetFrames = Math.round(s1.duration * FPS);
  const s1StartFrame = totalFrames;
  console.log(`[Scene 1 Intro] Target: ${s1TargetFrames} frames (${s1.duration}s)...`);

  await updateSubtitle(s1.title, s1.text);
  await setCursor(320, 240, true, false);
  await captureFrames(15);
  await moveCursorSmooth(225, 290, 25);
  await moveCursorSmooth(180, 260, 20);

  const s1Used = totalFrames - s1StartFrame;
  if (s1TargetFrames > s1Used) await captureFrames(s1TargetFrames - s1Used);

  // -------------------------------------------------------------
  // SCENE 2: Catalog Services Review (Hand & Pedicure Direct Book)
  // -------------------------------------------------------------
  const s2 = timingMap['scene2_catalog'];
  const s2TargetFrames = Math.round(s2.duration * FPS);
  const s2StartFrame = totalFrames;
  console.log(`[Scene 2 Catalog] Target: ${s2TargetFrames} frames (${s2.duration}s)...`);

  await updateSubtitle(s2.title, s2.text);
  // Smoothly scroll down past the hero reel directly into #servicesSection (scrollY ~ 2980)
  await smoothScrollWindow(2980, 28);
  await captureFrames(8);

  // Move cursor to "For Hand" and "For Leg (Pedicure)" filter buttons
  const pillsBox = await page.evaluate(() => {
    const sec = document.getElementById('servicesSection');
    const btns = sec ? sec.querySelectorAll('button') : [];
    if (btns.length >= 3) {
      const rHand = btns[1].getBoundingClientRect();
      const rPedi = btns[2].getBoundingClientRect();
      return {
        hand: { x: rHand.left + rHand.width / 2, y: rHand.top + rHand.height / 2 },
        pedi: { x: rPedi.left + rPedi.width / 2, y: rPedi.top + rPedi.height / 2 }
      };
    }
    return null;
  });

  if (pillsBox) {
    // 1. Move to "For Hand", click it, and SHIFT to Hand treatments
    await moveCursorSmooth(pillsBox.hand.x, pillsBox.hand.y, 15);
    await setCursor(pillsBox.hand.x, pillsBox.hand.y, true, true);
    await page.evaluate((rx, ry) => window.__triggerRipple(rx, ry), pillsBox.hand.x, pillsBox.hand.y);
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('#servicesSection button'));
      const handBtn = btns.find(b => b.innerText.includes('Hand'));
      if (handBtn) handBtn.click();
    });
    await captureFrames(6);
    await setCursor(pillsBox.hand.x, pillsBox.hand.y, true, false);
    await captureFrames(15);

    // 2. Move to "For Leg (Pedicure)", click it, and SHIFT to Pedicure treatments
    await moveCursorSmooth(pillsBox.pedi.x, pillsBox.pedi.y, 15);
    await setCursor(pillsBox.pedi.x, pillsBox.pedi.y, true, true);
    await page.evaluate((rx, ry) => window.__triggerRipple(rx, ry), pillsBox.pedi.x, pillsBox.pedi.y);
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('#servicesSection button'));
      const legBtn = btns.find(b => b.innerText.includes('Leg'));
      if (legBtn) legBtn.click();
    });
    await captureFrames(6);
    await setCursor(pillsBox.pedi.x, pillsBox.pedi.y, true, false);
    await captureFrames(15);
  }

  // Hover over the first card's "Book" button to demonstrate direct catalog booking
  const cardBookBox = await page.evaluate(() => {
    const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('BOOK'));
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  if (cardBookBox) {
    await moveCursorSmooth(cardBookBox.x, cardBookBox.y, 14);
    await page.evaluate((rx, ry) => window.__triggerRipple(rx, ry), cardBookBox.x, cardBookBox.y);
    await captureFrames(10);
  }

  const s2Used = totalFrames - s2StartFrame;
  if (s2TargetFrames > s2Used) await captureFrames(s2TargetFrames - s2Used);

  // -------------------------------------------------------------
  // SCENE 3: Scroll to "Bring Any Dream Inspo" & Click "Register with Inspo Image"
  // -------------------------------------------------------------
  const s3 = timingMap['scene3_inspo_click'];
  const s3TargetFrames = Math.round(s3.duration * FPS);
  const s3StartFrame = totalFrames;
  console.log(`[Scene 3 Inspo Click] Target: ${s3TargetFrames} frames (${s3.duration}s)...`);

  await updateSubtitle(s3.title, s3.text);

  // Scroll smoothly down so the inspo section and its Register button are centered and fully visible
  const inspoTargetScrollY = await page.evaluate(() => {
    const sec = document.getElementById('inspoSection');
    const btn = sec ? sec.querySelector('button') : null;
    if (!btn) return window.scrollY;
    const r = btn.getBoundingClientRect();
    return Math.round(window.scrollY + r.top - 380);
  });
  await smoothScrollWindow(inspoTargetScrollY, 26);
  await captureFrames(10);

  // Locate the "Register with Inspo Image" button inside #inspoSection
  const inspoBtnBox = await page.evaluate(() => {
    const sec = document.getElementById('inspoSection');
    const btn = sec ? sec.querySelector('button') : null;
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  if (inspoBtnBox) {
    // Glide cursor to the button
    await moveCursorSmooth(inspoBtnBox.x, inspoBtnBox.y, 18);
    // Hold hovered while voiceover finishes the sentence
    const preClickHold = Math.max(10, s3TargetFrames - (totalFrames - s3StartFrame) - 22);
    await captureFrames(preClickHold);

    // Golden ripple + click animation
    await page.evaluate((rx, ry) => window.__triggerRipple(rx, ry), inspoBtnBox.x, inspoBtnBox.y);
    await setCursor(inspoBtnBox.x, inspoBtnBox.y, true, true);
    await captureFrames(6);
    await setCursor(inspoBtnBox.x, inspoBtnBox.y, true, false);

    // Trigger the real click to open the booking modal with Custom Inspo preselected!
    await page.evaluate(() => {
      const sec = document.getElementById('inspoSection');
      const btn = sec ? sec.querySelector('button') : null;
      if (btn) btn.click();
    });
    await captureFrames(8);
  }

  const s3Used = totalFrames - s3StartFrame;
  if (s3TargetFrames > s3Used) await captureFrames(s3TargetFrames - s3Used);
  await page.waitForSelector('form');

  // -------------------------------------------------------------
  // SCENE 4: Modal Opens with Custom Inspo Preselected & Group Discount Mention
  // -------------------------------------------------------------
  const s4 = timingMap['scene4_modal_group'];
  const s4TargetFrames = Math.round(s4.duration * FPS);
  const s4StartFrame = totalFrames;
  console.log(`[Scene 4 Modal & Group] Target: ${s4TargetFrames} frames (${s4.duration}s)...`);

  await updateSubtitle(s4.title, s4.text);
  await captureFrames(12);

  // Point cursor to the Bespoke Custom Nail Art card (already preselected)
  const bespokeCardBox = await page.evaluate(() => {
    const card = Array.from(document.querySelectorAll('h4')).find(h => h.innerText.includes('Bespoke Custom'));
    if (!card) return null;
    const r = card.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  if (bespokeCardBox) {
    await moveCursorSmooth(bespokeCardBox.x, bespokeCardBox.y, 16);
    await page.evaluate((rx, ry) => window.__triggerRipple(rx, ry), bespokeCardBox.x, bespokeCardBox.y);
    await captureFrames(14);
  }

  // Point to the Group Discount toggle switch and click it ON to demonstrate group party discount!
  const groupToggleBox = await page.evaluate(() => {
    const toggle = Array.from(document.querySelectorAll('*')).find(el => el.innerText && el.innerText.includes('Wedding / Bridal / Group Discount'));
    if (!toggle) return null;
    const r = toggle.getBoundingClientRect();
    return { x: r.right - 45, y: r.top + r.height / 2 };
  });

  if (groupToggleBox) {
    await moveCursorSmooth(groupToggleBox.x, groupToggleBox.y, 18);
    await page.evaluate((rx, ry) => window.__triggerRipple(rx, ry), groupToggleBox.x, groupToggleBox.y);
    await setCursor(groupToggleBox.x, groupToggleBox.y, true, true);
    await captureFrames(6);
    await setCursor(groupToggleBox.x, groupToggleBox.y, true, false);

    // Click toggle to show group rates UI
    await page.evaluate(() => {
      const banner = Array.from(document.querySelectorAll('div')).find(el => el.innerText && el.innerText.includes('Wedding / Bridal / Group Discount'));
      if (banner) banner.click();
    });
    await captureFrames(24);

    // Toggle back so the individual single-client booking flow continues smoothly
    await page.evaluate((rx, ry) => window.__triggerRipple(rx, ry), groupToggleBox.x, groupToggleBox.y);
    await setCursor(groupToggleBox.x, groupToggleBox.y, true, true);
    await captureFrames(6);
    await setCursor(groupToggleBox.x, groupToggleBox.y, true, false);
    await page.evaluate(() => {
      const banner = Array.from(document.querySelectorAll('div')).find(el => el.innerText && el.innerText.includes('Wedding / Bridal / Group Discount'));
      if (banner) banner.click();
    });
    await captureFrames(12);
  }

  const s4Used = totalFrames - s4StartFrame;
  if (s4TargetFrames > s4Used) await captureFrames(s4TargetFrames - s4Used);

  // -------------------------------------------------------------
  // SCENE 5: Attach Inspo Photos & Pick Date/Time
  // -------------------------------------------------------------
  const s5 = timingMap['scene5_upload_date'];
  const s5TargetFrames = Math.round(s5.duration * FPS);
  const s5StartFrame = totalFrames;
  console.log(`[Scene 5 Upload & Date] Target: ${s5TargetFrames} frames (${s5.duration}s)...`);

  await updateSubtitle(s5.title, s5.text);

  // Scroll modal form down to show the Inspo photo upload dropzone
  await smoothScrollModal(420, 16);
  await captureFrames(6);

  // Move cursor to upload area and attach sample inspo photo
  const uploadAreaBox = await page.evaluate(() => {
    const label = Array.from(document.querySelectorAll('label')).find(l => l.innerText && l.innerText.includes('browse or snap'));
    if (!label) return null;
    const r = label.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  if (uploadAreaBox) {
    await moveCursorSmooth(uploadAreaBox.x, uploadAreaBox.y, 14);
    await page.evaluate((rx, ry) => window.__triggerRipple(rx, ry), uploadAreaBox.x, uploadAreaBox.y);
    await captureFrames(8);

    // Attach sample photo via Puppeteer file chooser
    const fileInput = await page.$('input[type="file"]');
    if (fileInput && fs.existsSync(SAMPLE_PHOTO)) {
      await fileInput.uploadFile(SAMPLE_PHOTO);
    }
    await captureFrames(16);
  }

  // Set appointment date
  await page.evaluate(() => {
    const dateInput = document.querySelector('input[type="date"]');
    if (dateInput) {
      const proto = Object.getPrototypeOf(dateInput);
      const desc = Object.getOwnPropertyDescriptor(proto, 'value');
      desc.set.call(dateInput, '2026-10-10');
      dateInput.dispatchEvent(new Event('input', { bubbles: true }));
      dateInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  const dateBox = await page.evaluate(() => {
    const dateInput = document.querySelector('input[type="date"]');
    if (!dateInput) return null;
    const r = dateInput.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  if (dateBox) {
    await moveCursorSmooth(dateBox.x, dateBox.y, 14);
    await page.evaluate((rx, ry) => window.__triggerRipple(rx, ry), dateBox.x, dateBox.y);
    await captureFrames(12);
  }

  const s5Used = totalFrames - s5StartFrame;
  if (s5TargetFrames > s5Used) await captureFrames(s5TargetFrames - s5Used);

  // -------------------------------------------------------------
  // SCENE 6: Client Details & Address (Sara Bekele & Kombolcha, Shisha Ber)
  // -------------------------------------------------------------
  const s6 = timingMap['scene6_address'];
  const s6TargetFrames = Math.round(s6.duration * FPS);
  const s6StartFrame = totalFrames;
  console.log(`[Scene 6 Details & Address] Target: ${s6TargetFrames} frames (${s6.duration}s)...`);

  await updateSubtitle(s6.title, s6.text);
  // Keep form positioned nicely for client inputs
  await smoothScrollModal(250, 14);

  // Type Name
  await page.evaluate(() => {
    const nameInput = document.querySelector('input[placeholder*="Sara Bekele"]');
    if (nameInput) {
      const proto = Object.getPrototypeOf(nameInput);
      const desc = Object.getOwnPropertyDescriptor(proto, 'value');
      desc.set.call(nameInput, 'Sara Bekele');
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await captureFrames(12);

  // Type Phone
  await page.evaluate(() => {
    const phoneInput = document.querySelector('input[placeholder*="0911234567"]');
    if (phoneInput) {
      const proto = Object.getPrototypeOf(phoneInput);
      const desc = Object.getOwnPropertyDescriptor(proto, 'value');
      desc.set.call(phoneInput, '0911234567');
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
      phoneInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await captureFrames(12);

  // Type Address: Kombolcha, Shisha Bar
  await page.evaluate(() => {
    const addrInput = document.querySelector('input[placeholder*="Kombolcha"]');
    if (addrInput) {
      const proto = Object.getPrototypeOf(addrInput);
      const desc = Object.getOwnPropertyDescriptor(proto, 'value');
      desc.set.call(addrInput, 'Kombolcha, Shisha Bar');
      addrInput.dispatchEvent(new Event('input', { bubbles: true }));
      addrInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  const addrBox = await page.evaluate(() => {
    const addrInput = document.querySelector('input[placeholder*="Kombolcha"]');
    if (!addrInput) return null;
    const r = addrInput.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  if (addrBox) {
    await moveCursorSmooth(addrBox.x, addrBox.y, 14);
    await page.evaluate((rx, ry) => window.__triggerRipple(rx, ry), addrBox.x, addrBox.y);
    await captureFrames(15);
  }

  const s6Used = totalFrames - s6StartFrame;
  if (s6TargetFrames > s6Used) await captureFrames(s6TargetFrames - s6Used);

  // -------------------------------------------------------------
  // SCENE 7: Submit Registration (Confirm & Register Online)
  // -------------------------------------------------------------
  const s7 = timingMap['scene7_submit'];
  const s7TargetFrames = Math.round(s7.duration * FPS);
  const s7StartFrame = totalFrames;
  console.log(`[Scene 7 Submit] Target: ${s7TargetFrames} frames (${s7.duration}s)...`);

  await updateSubtitle(s7.title, s7.text);

  // Scroll down to notes & submit button
  await smoothScrollModal(750, 16);

  // Type Notes
  await page.evaluate(() => {
    const notesInput = document.querySelector('textarea');
    if (notesInput) {
      const proto = Object.getPrototypeOf(notesInput);
      const desc = Object.getOwnPropertyDescriptor(proto, 'value');
      desc.set.call(notesInput, 'Long almond nails with 3D butterfly & pearl charms from TikTok');
      notesInput.dispatchEvent(new Event('input', { bubbles: true }));
      notesInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
  await captureFrames(12);

  // Move to Submit button
  const submitBox = await page.evaluate(() => {
    const btn = document.querySelector('button[type="submit"]');
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });

  if (submitBox) {
    await moveCursorSmooth(submitBox.x, submitBox.y, 16);
    await page.evaluate((rx, ry) => window.__triggerRipple(rx, ry), submitBox.x, submitBox.y);
    await setCursor(submitBox.x, submitBox.y, true, true);
    await captureFrames(8);
    await setCursor(submitBox.x, submitBox.y, true, false);

    // Click submit button
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="submit"]');
      if (btn) btn.click();
    });
  }

  await captureFrames(16);

  const s7Used = totalFrames - s7StartFrame;
  if (s7TargetFrames > s7Used) await captureFrames(s7TargetFrames - s7Used);

  // -------------------------------------------------------------
  // SCENE 8: Snappy Confirmation Screen & Telegram Chat
  // -------------------------------------------------------------
  const s8 = timingMap['scene8_confirm'];
  const s8TargetFrames = Math.round(s8.duration * FPS);
  const s8StartFrame = totalFrames;
  console.log(`[Scene 8 Confirm] Target: ${s8TargetFrames} frames (${s8.duration}s)...`);

  await updateSubtitle(s8.title, s8.text);
  await captureFrames(16);

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

  const s8Used = totalFrames - s8StartFrame;
  if (s8TargetFrames > s8Used) await captureFrames(s8TargetFrames - s8Used);

  console.log('Finalizing raw video recording...');
  ffmpeg.stdin.end();

  await new Promise((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with code ${code}`));
    });
  });

  await browser.close();

  console.log('Merging raw video with custom inspo voiceover audio...');
  execSync(`"${FFMPEG_PATH}" -y -i "${RAW_VIDEO}" -i "${MASTER_AUDIO}" -c:v copy -c:a aac -b:a 192k -shortest "${FINAL_VIDEO}"`, { stdio: 'inherit' });

  // Clean up temporary raw video
  try { fs.unlinkSync(RAW_VIDEO); } catch(e) {}

  const stats = fs.statSync(FINAL_VIDEO);
  console.log('====================================');
  console.log('SUCCESS! Custom Inspo Tutorial Video Generated:');
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
