const { chromium } = require("playwright");
const fs = require("fs");

async function fetchCitations(querytext) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36",
  });
  const page = await context.newPage();

  // Step 1: Open Google Scholar and perform search
  await page.goto(
    `https://scholar.google.com/scholar?hl=en&as_sdt=0%2C5&as_ylo=2020&as_yhi=2023&q=${encodeURIComponent(
      querytext
    )}&btnG=`
  );
  await page.pause();
  await page.waitForTimeout(5000);
  const citations = [];
  await page.waitForTimeout(5000);
  while (citations.length < 10) {
    const citationLinks = await page.$$("#gs_bdy_ccl .gs_ri");
    console.log(citationLinks.length);
    for (const link of citationLinks) {
      const citi = await link.$(".gs_flb .gs_or_cit");
      await citi.click();
      await page.waitForLoadState("networkidle");
      // Step 3: Extract citation links from the current page

      const rows = await page.$$("tr");

      // Get all rows where the `th` element contains "MLA"

      const citationText = await page
        .locator("#gs_citt > table > tbody > tr:nth-child(1) > td > div")
        .innerText();
      const pattern = /\((\d{4}(?:-\d{4})?)\):\s(\d+)/;
      if (pattern.test(citationText)) {
        citations.push(citationText);
        console.log("Found MLA citation:", citationText);
      }
      await page.click(".gs_ico");
      await page.waitForTimeout(2000);
    }
    const nextButton = await page.$('text="Next"');
    if (nextButton) {
      await nextButton.click();
      await page.waitForTimeout(2000); // Adjust timeout as needed
    } else {
      break;
    }

    // Click the 'Next' button if there are more pages
  }

  // Print collected citations
  fs.writeFileSync(encodeURIComponent(querytext), citations.join("\n"));
  console.log("Collected citations:", citations);
  await browser.close();
}
const args = process.argv.slice(2); // Get arguments after the script name
const querytext = args[0];
fetchCitations(querytext);
