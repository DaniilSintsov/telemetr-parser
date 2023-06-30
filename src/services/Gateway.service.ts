import { Files } from '../types/file.types.js';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';

interface IGateway {
  getDataArrFromTxt: (file: Files) => Promise<string[]>;
  appendDataToTxt: (file: Files, data: string) => void;
  writeDataToJson: (file: Files | string, data: any) => void;
}

export class Gateway implements IGateway {
  async getDataArrFromTxt(file: Files): Promise<string[]> {
    if (!fsSync.existsSync(file)) {
      try {
        await fs.writeFile(file, '');
      } catch (e) {
        console.error(e);
      }
    }

    try {
      return (
        (await fs.readFile(file, 'utf-8'))
          .toString()
          .split('\n')
          .filter(Boolean) || []
      );
    } catch (e) {
      console.error(e);
      return [];
    }
  }

  async appendDataToTxt(file: Files, data: string): Promise<void> {
    try {
      await fs.appendFile(file, data + '\n');
    } catch (e) {
      console.error(e);
    }
  }

  async writeDataToJson(file: Files | string, data: any): Promise<void> {
    try {
      await fs.writeFile(file, JSON.stringify(data, null, 2));
    } catch (e) {
      console.error(e);
    }
  }
}
