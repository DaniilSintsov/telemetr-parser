export interface IMention {
  name: string;
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

export interface IWorkerData {
  url: string;
  userAgent: string;
  cookie: string;
}
