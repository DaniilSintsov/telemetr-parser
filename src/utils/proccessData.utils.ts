import { ICrawled } from '../types/parser.types.js';
import { Browser } from 'puppeteer';
import { crawl } from './crawl.utils.js';
import { parserState } from '../index.js';
import { writeToTxt } from './file.utils.js';
import { Files } from '../types/file.types.js';
import fs from 'node:fs';

interface IProcessDataArgs {
  userAgent: string;
  cookie: string;
  workerId: number;
  getBrowserInstance: () => Promise<Browser>;
}

export async function processData({
  userAgent,
  cookie,
  workerId,
  getBrowserInstance
}: IProcessDataArgs): Promise<void> {
  while (parserState.queue.length) {
    const currentUrl: string = parserState.queue.pop() as string;

    if (!parserState.visited.includes(currentUrl)) {
      parserState.visited.push(currentUrl);

      let crawled: ICrawled;
      try {
        crawled = await crawl({
          crawledUrl: currentUrl,
          userAgent,
          cookie,
          getBrowserInstance
        });
        parserState.data.push(crawled.data);

        for (const link of crawled.links) {
          if (
            !parserState.visited.includes(link) &&
            !parserState.queue.includes(link)
          ) {
            parserState.queue.push(link);
          }
        }

        writeToTxt(Files.VISITED_LINKS, parserState.visited);
        writeToTxt(Files.INPUT_QUEUE, parserState.queue);
        fs.writeFileSync(Files.DATA, JSON.stringify(parserState.data, null, 2));
      } catch (e) {
        console.error(
          `Worker ${workerId} processed ${currentUrl} with error:\n${e}`
        );
        writeToTxt(Files.VISITED_LINKS, parserState.visited);
        writeToTxt(Files.INPUT_QUEUE, parserState.queue);
        continue;
      }
    }

    console.log(`Worker ${workerId}: ${currentUrl} is crawled`);
  }
}
