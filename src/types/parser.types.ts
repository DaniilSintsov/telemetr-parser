export interface IMention {
  name: string;
  when: string;
  subscribers: number;
  count: number;
}

export interface ICrawledData {
  name: string;
  description: string;
  subscribers: number;
  mentions: IMention[];
}

export interface ICrawled {
  links: string[];
  data: ICrawledData;
}

export interface IParserState {
  visited: string[];
  data: ICrawledData[];
  queue: string[];
}
