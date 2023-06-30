import { ICrawled } from '../types/parser.types.js';
import { BrowserContext } from 'puppeteer';
import { crawl } from './crawl.utils.js';
import { ParserState } from '../services/ParserState.service.js';

interface IProcessDataArgs {
  userAgent: string;
  cookie: string;
  workerId: number;
  browserContext: BrowserContext;
  parserState: ParserState;
}

export async function processData({
  userAgent,
  cookie,
  workerId,
  browserContext,
  parserState
}: IProcessDataArgs): Promise<void> {
  while (parserState.FilteredQueueLength) {
    const currentUrl: string | undefined = await parserState.visitFromQueue();

    if (!currentUrl) {
      continue;
    }

    try {
      const crawled: ICrawled = await crawl({
        crawledUrl: currentUrl,
        userAgent,
        cookie,
        browserContext
      });
      await parserState.processCrawled(crawled);
      console.log(`Worker ${workerId}: ${currentUrl} is crawled`);
    } catch (e) {
      console.error(
        `Worker ${workerId} processed ${currentUrl} with error:\n${e}`
      );
    }
  }
}
