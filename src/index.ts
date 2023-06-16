import puppeteer, { ElementHandle, NodeFor, Page } from 'puppeteer';
import fs from 'node:fs';
import 'dotenv/config';
import { clearString } from './utils/removeControlCharacters.util.js';

async function getTextFromSelector(
  page: Page,
  selector: string
): Promise<string> {
  const $elem = await page.$(selector);
  if (!$elem) {
    throw new Error('No name found');
  }
  const text = await page.evaluate(elem => elem.textContent, $elem);
  return clearString(text);
}

async function fetchData() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page: Page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    userAgent: process.env.USER_AGENT as string,
    Cookie: process.env.COOKIE as string
  });

  await page.goto('https://telemetr.me/@isekaicryptoann');

  const name = await getTextFromSelector(page, '.kt-widget__username');
  const description = await getTextFromSelector(page, '#rmjs-1');
  const subscribers = await getTextFromSelector(
    page,
    'div.col-md-3:nth-child(1) > div:nth-child(1) > span:nth-child(3)'
  );

  const $mentionsParent = await page.$('#who_mentioned > tbody:nth-child(2)');
  const mentionsChildren: Array<ElementHandle<NodeFor<string>>> =
    (await $mentionsParent?.$$(
      '#who_mentioned > tbody:nth-child(2) > tr'
    )) as Array<ElementHandle<NodeFor<string>>>;

  const mentions = [];
  const mentionsLinks = [];

  for (const child of mentionsChildren) {
    await child.evaluate(elem => {
      const $mentionName = elem.querySelector('.who_title');
      // const mentionName = $mentionName.;
      mentionsLinks.push($mentionName.href);
      // mentions.push({ mentionName });
    }, child);
  }

  const data = {
    name,
    description,
    subscribers: +subscribers.replace("'", ''),
    mentions
  };
  const json = JSON.stringify(data, null, 2);

  fs.writeFile('data.json', json, 'utf8', err => {
    if (err) {
      throw err;
    }
    console.log('Data has been written to file');
  });

  await browser.close();
}

fetchData();
