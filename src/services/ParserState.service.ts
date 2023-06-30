import { ICrawled, ICrawledData } from '../types/parser.types.js';
import { Dirs, Files } from '../types/file.types.js';
import { Gateway } from './Gateway.service.js';
import path from 'node:path';

type visitFromQueueCallback = (current: string) => void;

interface IParserState {
  visitFromQueue: (
    callback: visitFromQueueCallback
  ) => Promise<string | undefined>;
  appendQueueToFile: (elem: string) => void;
  appendVisitedToFile: (visited: string) => void;
  saveDataToFile: (data: ICrawledData) => void;
}

interface IInitialState {
  visited: string[];
  queue: string[];
}

export class ParserState implements IParserState {
  private readonly gateway: Gateway;
  private readonly visited: string[];
  private readonly queue: string[];

  constructor(gateway: Gateway, { visited, queue }: IInitialState) {
    this.gateway = gateway;
    this.visited = visited;
    this.queue = queue;
  }

  get FilteredQueueLength(): number {
    return this.filterQueue().length;
  }

  private filterQueue(): string[] {
    return this.queue.filter(link => !this.visited.includes(link));
  }

  private getUniqueResultFilename(): string {
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 1000);
    return `${timestamp}_${randomNum}.json`;
  }

  async appendQueueToFile(elem: string): Promise<void> {
    await this.gateway.appendDataToTxt(Files.INPUT_QUEUE, elem);
  }

  async appendVisitedToFile(visited: string): Promise<void> {
    await this.gateway.appendDataToTxt(Files.VISITED_LINKS, visited);
  }

  async saveDataToFile(data: ICrawledData): Promise<void> {
    const fileName = this.getUniqueResultFilename();
    await this.gateway.writeDataToJson(path.join(Dirs.RESULT, fileName), data);
  }

  async visitFromQueue(): Promise<string | undefined> {
    const filteredQueue = this.filterQueue();
    const current: string = filteredQueue[filteredQueue.length - 1];
    if (current && !this.visited.includes(current)) {
      this.visited.push(current);
      await this.appendVisitedToFile(current);
      return current;
    }
    return;
  }

  async processCrawled(crawled: ICrawled) {
    await this.saveDataToFile(crawled.data);
    for (const link of crawled.links) {
      if (!this.visited.includes(link) && !this.queue.includes(link)) {
        this.queue.push(link);
        await this.appendQueueToFile(link);
      }
    }
  }
}
