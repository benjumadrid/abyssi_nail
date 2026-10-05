const puppeteer = require('puppeteer-core');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new'
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 450, height: 800, deviceScaleFactor: 2.4 });
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });

  // Open booking via Inspo button
  await page.evaluate(() => {
    document.querySelector('#inspoSection button').click();
  });
  await new Promise(r => setTimeout(r, 600));

  // Find file input and upload sample photo
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    const sampleImg = path.join(__dirname, 'uploads', 'chrome-glazed-nails.jpg');
    await fileInput.uploadFile(sampleImg);
    console.log('Uploaded sample image!');
    await new Promise(r => setTimeout(r, 800));

    // Scroll form to show the attached photo
    await page.evaluate(() => {
      const form = document.querySelector('form');
      if (form) form.scrollTop = 550;
    });
    await new Promise(r => setTimeout(r, 400));
    await page.screenshot({ path: 'scratch_modal_uploaded.jpg', quality: 90 });
    console.log('Saved scratch_modal_uploaded.jpg!');
  } else {
    console.log('No file input found');
  }

  await browser.close();
})();
