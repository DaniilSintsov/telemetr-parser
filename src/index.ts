import fs from 'node:fs';
import 'dotenv/config';
import puppeteer, { Browser } from 'puppeteer';
import { processData } from './utils/proccessData.utils.js';
import { Files } from './types/file.types.js';

const WORKERS_COUNT: number = 5;
const WORKER_TIMEOUT: number = 9000; // The best tested value

const userAgent = process.env.USER_AGENT ?? null;
const cookie = process.env.COOKIE ?? null;

if (!userAgent || !cookie) {
  throw new Error('Missing user agent or cookie');
}

if (!fs.existsSync(Files.INPUT_QUEUE)) {
  throw new Error('Missing inputQueue.txt file');
}

const browser: Browser = await puppeteer.launch({ headless: 'new' });

const workerPromises: Promise<void>[] = [];
for (let i = 0; i < WORKERS_COUNT; i++) {
  const promise: Promise<void> = new Promise(resolve => {
    setTimeout(async () => {
      await processData({
        userAgent,
        cookie,
        workerId: i + 1,
        browserContext: browser.defaultBrowserContext()
      });
      resolve();
    }, i * WORKER_TIMEOUT);
  });

  workerPromises.push(promise);
}
await Promise.all(workerPromises);

process.on('exit', async () => {
  console.log('All workers are done!');
  await browser.close();
});
