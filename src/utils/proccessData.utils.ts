import { ICrawled, ICrawledData } from '../types/parser.types.js';
import { BrowserContext } from 'puppeteer';
import { crawl } from './crawl.utils.js';
import { parserState } from '../services/ParserState.service.js';

interface IProcessDataArgs {
  userAgent: string;
  cookie: string;
  workerId: number;
  browserContext: BrowserContext;
}

export async function processData({
  userAgent,
  cookie,
  workerId,
  browserContext
}: IProcessDataArgs): Promise<void> {
  while (parserState.Queue.length) {
    const queue: string[] = parserState.Queue;
    const visited: string[] = parserState.Visited;
    const data: ICrawledData[] = parserState.Data;

    const currentUrl: string = queue.pop() as string;

    if (!visited.includes(currentUrl)) {
      visited.push(currentUrl);

      let crawled: ICrawled;
      try {
        crawled = await crawl({
          crawledUrl: currentUrl,
          userAgent,
          cookie,
          browserContext
        });

        data.push(crawled.data);

        for (const link of crawled.links) {
          if (!visited.includes(link) && !queue.includes(link)) {
            queue.push(link);
          }
        }

        parserState.setQueue(queue);
        parserState.setVisited(visited);
        parserState.setData(data);
      } catch (e) {
        console.error(
          `Worker ${workerId} processed ${currentUrl} with error:\n${e}`
        );
        parserState.setQueue(queue);
        parserState.setVisited(visited);
        continue;
      }
    }

    console.log(`Worker ${workerId}: ${currentUrl} is crawled`);
  }
}
