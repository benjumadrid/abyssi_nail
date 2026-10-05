const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 450, height: 800, deviceScaleFactor: 2.4 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  const info = await page.evaluate(() => {
    const inspo = document.getElementById('inspoSection');
    if (!inspo) return { error: 'No inspoSection' };
    const rect = inspo.getBoundingClientRect();
    const btn = inspo.querySelector('button');
    const btnRect = btn ? btn.getBoundingClientRect() : null;
    return {
      inspoTop: window.scrollY + rect.top,
      inspoHeight: rect.height,
      btnTop: btnRect ? window.scrollY + btnRect.top : null,
      btnText: btn ? btn.innerText.trim() : null
    };
  });

  console.log('Inspo Section:', JSON.stringify(info, null, 2));

  // Also test clicking the button and see what modal opens:
  await page.evaluate(() => {
    const btn = document.querySelector('#inspoSection button');
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 600));

  const modalInfo = await page.evaluate(() => {
    const modal = document.querySelector('form');
    if (!modal) return { modalFound: false };
    const tabs = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('Inspo') || b.innerText.includes('Custom'));
    const groupToggle = document.querySelector('input[type="checkbox"]') || document.querySelector('button[role="switch"]');
    const selectedBadge = Array.from(document.querySelectorAll('*')).find(el => el.innerText && el.innerText.includes('Custom Inspo Nail Art'));
    const uploadInput = document.querySelector('input[type="file"]');
    return {
      modalFound: true,
      hasUploadInput: !!uploadInput,
      customInspoSelected: !!selectedBadge,
      tabsCount: tabs.length
    };
  });

  console.log('Modal Info after clicking button:', JSON.stringify(modalInfo, null, 2));
  await browser.close();
})();
