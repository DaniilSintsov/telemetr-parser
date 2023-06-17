import fs from 'node:fs';
import 'dotenv/config';
import { crawl } from './functions/crawl.function.js';
import {
  ICrawled,
  ICrawledData,
  IProcessDataArgs
} from './types/parser.types.js';
import { isMainThread, Worker, workerData } from 'worker_threads';
import url from 'node:url';

const userAgent = process.env.USER_AGENT ?? null;
const cookie = process.env.COOKIE ?? null;

const __filename = url.fileURLToPath(import.meta.url);

if (!userAgent || !cookie) {
  throw new Error('Missing user agent or cookie');
}

if (!fs.existsSync('data.json')) {
  fs.writeFileSync('data.json', '[]');
}

if (!fs.existsSync('visitedLinks.txt')) {
  fs.writeFileSync('visitedLinks.txt', '');
}

function getLinksFromTxt(file: string): string[] {
  return fs.readFileSync(file, 'utf-8').toString().split('\n').filter(Boolean);
}

function writeToTxt(file: string, data: string[]) {
  fs.writeFileSync(file, data.join('\n') + '\n');
}

async function processData({
  userAgent: userAgent,
  cookie: cookie
}: IProcessDataArgs) {
  while (getLinksFromTxt('inputQueue.txt').length) {
    const queue = getLinksFromTxt('inputQueue.txt');
    const currentUrl: string = queue.pop() as string;

    const visited: string[] = getLinksFromTxt('visitedLinks.txt') ?? [];
    const data: ICrawledData[] =
      JSON.parse(fs.readFileSync('data.json', 'utf-8')) ?? [];

    if (!visited.includes(currentUrl)) {
      visited.push(currentUrl);

      let crawled: ICrawled;
      try {
        crawled = await crawl(currentUrl, userAgent, cookie);
        data.push(crawled.data);
      } catch (e) {
        console.error(e);
        writeToTxt('inputQueue.txt', queue);
        writeToTxt('visitedLinks.txt', visited);
        continue;
      }

      for (const link of crawled.links) {
        if (!visited.includes(link)) {
          queue.push(link);
        }
      }
    }
    writeToTxt('inputQueue.txt', queue);
    writeToTxt('visitedLinks.txt', visited);
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));

    console.log(`${currentUrl} is crawled`);
  }
}

if (isMainThread) {
  for (let i = 0; i < 5; i++) {
    setTimeout(() => {
      new Worker(__filename, {
        workerData: { workerId: i, userAgent, cookie }
      });
    }, i * 2000);
  }
} else {
  setTimeout(async () => {
    await processData(workerData);
  }, 2000);
}
