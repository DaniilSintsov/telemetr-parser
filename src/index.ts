import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import fs from 'node:fs';
import 'dotenv/config';
import { crawl } from './functions/crawl.function.js';
import { ICrawled, ICrawledData, IWorkerData } from './types/parser.types.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

const userAgent = process.env.USER_AGENT ?? null;
const cookie = process.env.COOKIE ?? null;

if (!userAgent || !cookie) {
  throw new Error('Missing user agent or cookie');
}

function getLinksFromTxt(file: string): string[] {
  return fs.readFileSync(file, 'utf-8').toString().split('\n').filter(Boolean);
}

if (isMainThread) {
  let activeWorkers = 0;

  if (!fs.existsSync('data.json')) {
    fs.writeFileSync('data.json', '[]');
  }

  if (!fs.existsSync('crawledLinks.txt')) {
    fs.writeFileSync('crawledLinks.txt', '');
  }

  const inputQueue: string[] = getLinksFromTxt('inputQueue.txt');
  let inputQueueLength = inputQueue.length;
  const crawledData: ICrawledData[] = JSON.parse(
    fs.readFileSync('data.json', 'utf-8')
  );
  const crawledLinks: string[] = getLinksFromTxt('crawledLinks.txt');

  let i = 0;
  while (i < inputQueueLength) {
    const url: string = inputQueue[i];
    if (!crawledLinks.includes(url)) {
      if (activeWorkers < 5) {
        activeWorkers++;

        const workerData: IWorkerData = {
          url,
          userAgent,
          cookie
        };

        const worker = new Worker(__filename, {
          workerData
        });

        worker.on('message', (crawled: ICrawled) => {
          if (!crawledLinks.includes(url)) {
            crawledLinks.push(url);
            fs.appendFileSync('crawledLinks.txt', url + '\n');
          }
          crawledData.push(crawled.data);
          fs.writeFileSync('data.json', JSON.stringify(crawledData, null, 2));
          const newLinks = crawled.links.filter(
            link => !inputQueue.includes(link) && !crawledLinks.includes(link)
          );
          if (newLinks.length) {
            inputQueue.push(...newLinks);
            fs.appendFileSync('inputQueue.txt', newLinks.join('\n') + '\n');
            inputQueueLength += newLinks.length;
          }
        });

        worker.on('error', e => {
          console.error(e);
        });

        worker.on('exit', code => {
          console.log(`${url} parsed with code ${code}`);
          activeWorkers--;
        });
      } else {
        i--;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    i++;
  }
} else {
  const { url, userAgent, cookie } = workerData;
  crawl(url, userAgent, cookie).then((crawled: ICrawled) => {
    parentPort?.postMessage(crawled);
  });
}
