import { ICrawled, ICrawledData, IMention } from '../types/parser.types.js';
import puppeteer, { Page } from 'puppeteer';
import url from 'node:url';

export async function crawl(
  crawledUrl: string,
  userAgent: string,
  cookie: string
): Promise<ICrawled> {
  const linkBase = url.parse(crawledUrl, false);
  const browser = await puppeteer.launch({
    headless: 'new'
  });
  const page: Page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    userAgent,
    Cookie: cookie
  });

  await page.goto(crawledUrl, { waitUntil: 'networkidle2' });

  let name: string = '';
  try {
    name = await page.$eval('.kt-widget__username', e => e.textContent?.trim());
  } catch (e) {}
  let description: string = '';
  try {
    description = await page.$eval('#rmjs-1', e => e.textContent?.trim());
  } catch (e) {}
  let subscribers: string;
  try {
    subscribers = await page.$eval(
      'div.col-md-3:nth-child(1) > div:nth-child(1) > span:nth-child(3)',
      e => e.textContent?.trim()
    );
  } catch (e) {}

  const mentions: IMention[] = [];
  const mentionsLinks: string[] = [];

  try {
    const mentionsChildren = await page.$$(
      '#who_mentioned > tbody:nth-child(2) > tr'
    );

    for (const child of mentionsChildren) {
      const mentionName: string = await child.$eval(
        '.who_title',
        e => e.textContent
      );
      if (mentionName.length) {
        const mentionLink: string = await child.$eval('.who_title', e =>
          e.getAttribute('href')
        );
        mentionsLinks.push(
          `${linkBase.protocol as string}//${linkBase.host}${mentionLink}`
        );
        const mentionSubscribers: number = +(
          await child.$eval('.kt-number', e => e.textContent)
        ).replace("'", '');
        const mentionCount: number = +(await child.$eval(
          '.kt-number.kt-font-brand.text-underlined',
          e => e.textContent
        ));
        const mention: IMention = {
          name: mentionName,
          subscribers: mentionSubscribers,
          count: mentionCount
        };
        mentions.push(mention);
      }
    }
  } catch (e) {}

  const data: ICrawledData = {
    name,
    description,
    subscribers: +subscribers.replace("'", ''),
    mentions
  };
  const crawled: ICrawled = {
    links: mentionsLinks,
    data
  };

  await browser.close();
  return crawled;
}
