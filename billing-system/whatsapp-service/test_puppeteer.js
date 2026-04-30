const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log('Attempting to launch browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    console.log('Browser launched successfully!');
    const version = await browser.version();
    console.log('Browser version:', version);
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Failed to launch browser:');
    console.error(err);
    process.exit(1);
  }
})();
