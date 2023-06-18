import { Files } from '../types/file.types.js';
import fs from 'node:fs';

interface IGateway {
  getDataArrFromTxt: (file: Files) => string[];
  writeDataArrToTxt: (file: Files, data: string[]) => void;
  writeDataToJson: (file: Files, data: any) => void;
  getDataFromJson: (file: Files) => any;
}

export class Gateway implements IGateway {
  getDataArrFromTxt(file: Files): string[] {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, '');
    }

    return (
      fs.readFileSync(file, 'utf-8').toString().split('\n').filter(Boolean) ||
      []
    );
  }

  writeDataArrToTxt(file: Files, data: string[]): void {
    fs.writeFileSync(file, data.join('\n') + '\n');
  }

  writeDataToJson(file: Files, data: any): void {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  }

  getDataFromJson(file: Files): any {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, '');
    }

    const json = fs.readFileSync(file, 'utf-8').trim();

    if (json.length) {
      return JSON.parse(json);
    }

    return '';
  }
}
