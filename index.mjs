import puppeteer from "puppeteer";
import fs from "fs";

(async () => {
  console.log("[scraper] Launching browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  try {
    page.on("response", async (response) => {
      if (
        response.url().includes("customer-interest-rates/interest-rates/calculate")
      ) {
        console.log("[scraper] Interest rate response received:", response.url());
        const freshData = await response.json();
        const archive = JSON.parse(fs.readFileSync("archive.json"));
        writeToArchive(archive, freshData);
      }
    });

    console.log("[scraper] Navigating to ABN AMRO mortgage rates page...");
    await page.goto(
      "https://www.abnamro.nl/nl/prive/hypotheken/actuele-hypotheekrente/index.html",
      { waitUntil: "networkidle2" }
    );
    console.log("[scraper] Page load complete.");
  } finally {
    await browser.close();
    console.log("[scraper] Browser closed.");
  }
})();

function writeToArchive(archive, freshData) {
  const lastEntry = archive[archive.length - 1];
  const { scrappedAt, ...lastData } = lastEntry ?? {};

  if (JSON.stringify(lastData) === JSON.stringify(freshData)) {
    console.log("[scraper] Rates unchanged since last entry, skipping save.");
    return;
  }

  archive.push({ ...freshData, scrappedAt: new Date().toISOString() });
  fs.writeFileSync("archive.json", JSON.stringify(archive, null, 2));
  console.log(
    `[scraper] Rates changed, saved new entry. Archive now has ${archive.length} entries.`
  );
}
