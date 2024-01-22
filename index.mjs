import puppeteer from "puppeteer";
import fs from "fs";
import _ from "lodash";

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1024 });

  try {
    page.on("response", async (response) => {
      if (
        response.url().includes("mortgage-customer-interest-rate-calculation")
      ) {
        freshData = await response.json();
        const archive = JSON.parse(fs.readFileSync("archive.json"));
        const lastData = archive[archive.length - 1];
        if (!lastData) {
          return writeToArchive(archive, freshData);
        }

        delete lastData.scrappedAt;
        if (!_.isEqual(lastData, freshData)) {
          return writeToArchive(archive, freshData);
        }
      }
    });

    await page.goto(
      "https://www.abnamro.nl/nl/prive/hypotheken/actuele-hypotheekrente/index.html"
    );
  } finally {
    await browser.close();
  }
})();

function writeToArchive(archive, freshData) {
  archive.push({ ...freshData, scrappedAt: new Date().toISOString() });
  fs.writeFileSync("archive.json", JSON.stringify(archive));
}
