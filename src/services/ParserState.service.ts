import { ICrawledData } from '../types/parser.types.js';
import { Files } from '../types/file.types.js';
import { Gateway } from './Gateway.service.js';

interface IParserState {
  setQueue(queue: string[]): void;
  setVisited(visited: string[]): void;
  setData(data: ICrawledData[]): void;
}

class ParserState implements IParserState {
  private readonly gateway: Gateway;
  private visited: string[];
  private data: ICrawledData[];
  private queue: string[];

  constructor(gateway: Gateway) {
    this.gateway = gateway;
    this.visited = this.gateway.getDataArrFromTxt(Files.VISITED_LINKS);
    this.data = this.gateway.getDataFromJson(Files.DATA) || [];
    this.queue = this.gateway.getDataArrFromTxt(Files.INPUT_QUEUE);
  }

  public get Queue(): string[] {
    return this.queue;
  }
  public get Visited(): string[] {
    return this.visited;
  }
  public get Data(): ICrawledData[] {
    return this.data;
  }

  public setQueue(queue: string[]): void {
    this.queue = queue;
    this.gateway.writeDataArrToTxt(Files.INPUT_QUEUE, this.queue);
  }

  public setVisited(visited: string[]): void {
    this.visited = visited;
    this.gateway.writeDataArrToTxt(Files.VISITED_LINKS, this.visited);
  }

  public setData(data: ICrawledData[]): void {
    this.data = data;
    this.gateway.writeDataToJson(Files.DATA, this.data);
  }
}

export const parserState = new ParserState(new Gateway());
