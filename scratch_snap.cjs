const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 450, height: 800, deviceScaleFactor: 2.4 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // Scroll to inspo section
  await page.evaluate(() => {
    document.getElementById('inspoSection').scrollIntoView();
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: 'scratch_inspo_section.jpg', quality: 90 });

  // Click Register with Inspo Image
  await page.evaluate(() => {
    document.querySelector('#inspoSection button').click();
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: 'scratch_modal_inspo.jpg', quality: 90 });

  await browser.close();
  console.log('Screenshots saved!');
})();
