const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  page.on('console', msg => {
      console.log('PAGE LOG:', msg.type().toUpperCase(), msg.text());
  });
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  
  await page.goto('http://localhost:3000/?sessionId=test-123', { waitUntil: 'networkidle2' });
  
  await new Promise(r => setTimeout(r, 2000));
  
  // get inner html of body
  const bodyHtml = await page.evaluate(() => document.body.innerHTML);
  if (bodyHtml.includes('Something went wrong')) {
     console.log('REACT CRASH DETECTED!');
  } else {
     console.log('NO REACT CRASH.');
  }
  
  await browser.close();
})();
