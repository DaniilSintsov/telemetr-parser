import fs from 'node:fs';
import 'dotenv/config';
import { IParserState } from './types/parser.types.js';
import puppeteer, { Browser } from 'puppeteer';
import { getLinksFromTxt } from './utils/file.utils.js';
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

if (!fs.existsSync(Files.DATA)) {
  fs.writeFileSync(Files.DATA, '[]');
}

if (!fs.existsSync(Files.VISITED_LINKS)) {
  fs.writeFileSync(Files.VISITED_LINKS, '');
}

export async function getBrowserInstance(): Promise<Browser> {
  return await puppeteer.launch({ headless: 'new' });
}

export const parserState: IParserState = {
  visited: getLinksFromTxt(Files.VISITED_LINKS) ?? [],
  data: JSON.parse(fs.readFileSync(Files.DATA, 'utf-8')) ?? [],
  queue: getLinksFromTxt(Files.INPUT_QUEUE)
};

const workerPromises: Promise<void>[] = [];
for (let i = 0; i < WORKERS_COUNT; i++) {
  const promise: Promise<void> = new Promise(resolve => {
    setTimeout(async () => {
      await processData({
        userAgent,
        cookie,
        workerId: i + 1,
        getBrowserInstance
      });
      resolve();
    }, i * WORKER_TIMEOUT);
  });

  workerPromises.push(promise);
}
await Promise.all(workerPromises);

process.on('exit', () => {
  console.log('All workers are done!');
});
