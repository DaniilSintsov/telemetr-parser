import { ICrawled, ICrawledData, IMention } from '../types/parser.types.js';
import { BrowserContext, Page } from 'puppeteer';
import url from 'node:url';

interface ICrawlArgs {
  crawledUrl: string;
  userAgent: string;
  cookie: string;
  browserContext: BrowserContext;
}

type Cookie = {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
};

function parseCookies(cookieString: string, domain: string): Cookie[] {
  return cookieString.split('; ').map(cookie => {
    const [name, value] = cookie.split('=');
    return { name, value, domain };
  });
}

export async function crawl({
  crawledUrl,
  userAgent,
  cookie,
  browserContext
}: ICrawlArgs): Promise<ICrawled> {
  const linkBase = url.parse(crawledUrl, false);

  const page: Page = await browserContext.newPage();
  await page.setUserAgent(userAgent);
  const cookies = parseCookies(cookie, linkBase.hostname as string);
  await page.setCookie(...cookies);
  await page.setDefaultNavigationTimeout(60000);
  await page.setDefaultTimeout(60000);

  await page.goto(crawledUrl, { waitUntil: 'networkidle2' });

  let name: string = '';
  try {
    name = await page.$eval('.kt-widget__username', e => e.textContent?.trim());
  } catch (e) {}
  let description: string = '';
  try {
    description = await page.$eval('#rmjs-1', e => e.textContent?.trim());
  } catch (e) {}
  let subscribers: string = '';
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

        const mentionDate: string = await child.$eval('[data-day]', e =>
          e.getAttribute('data-day')
        );
        const today: number = +new Date();
        const otherDate: number = +new Date(mentionDate);
        const diffMs: number = today - otherDate;
        const mentionWhen: string = `${Math.round(
          diffMs / 86400000
        )} days back`;

        const mentionSubscribers: number = +(
          await child.$eval('.kt-number', e => e.textContent)
        ).replace("'", '');

        const mentionCount: number = +(await child.$eval(
          '.kt-number.kt-font-brand.text-underlined',
          e => e.textContent
        ));

        const mention: IMention = {
          name: mentionName,
          when: mentionWhen,
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
    subscribers: subscribers ? +subscribers.replace("'", '') : 0,
    mentions
  };

  await page.close();

  return {
    links: mentionsLinks,
    data
  };
}
