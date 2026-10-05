const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 450, height: 800, deviceScaleFactor: 2.4 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // Scroll to services
  await page.evaluate(() => {
    document.getElementById('servicesSection').scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 400));

  // 1. Click "For Hand"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('#servicesSection button'));
    const handBtn = btns.find(b => b.innerText.includes('Hand'));
    if (handBtn) handBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'test_shift_hand.jpg', quality: 90 });

  // 2. Click "For Leg (Pedicure)"
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('#servicesSection button'));
    const legBtn = btns.find(b => b.innerText.includes('Leg'));
    if (legBtn) legBtn.click();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'test_shift_leg.jpg', quality: 90 });

  // 3. Scroll to Inspo Section centered
  const inspoPos = await page.evaluate(() => {
    const sec = document.getElementById('inspoSection');
    const btn = sec.querySelector('button');
    btn.scrollIntoView({ block: 'center', behavior: 'instant' });
    const btnRect = btn.getBoundingClientRect();
    return {
      scrollY: window.scrollY,
      btnX: btnRect.left + btnRect.width / 2,
      btnY: btnRect.top + btnRect.height / 2
    };
  });
  console.log('Inspo Pos when centered:', inspoPos);
  await page.screenshot({ path: 'test_inspo_centered.jpg', quality: 90 });

  await browser.close();
})();
