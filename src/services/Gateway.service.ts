import { Files } from '../types/file.types.js';
import fs from 'node:fs/promises';
import fsSync from 'node:fs';

interface IGateway {
  getDataArrFromTxt: (file: Files) => Promise<string[]>;
  appendDataToTxt: (file: Files, data: string) => void;
  writeDataArrToTxt: (file: Files, data: string[]) => void;
  getDataFromJson: (file: Files) => Promise<any[]>;
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

  async writeDataArrToTxt(file: Files, data: string[]): Promise<void> {
    try {
      await fs.writeFile(file, data.join('\n') + '\n');
    } catch (e) {
      console.error(e);
    }
  }

  async getDataFromJson(file: Files): Promise<any[]> {
    if (!fsSync.existsSync(file)) {
      try {
        await fs.writeFile(file, '');
      } catch (e) {
        console.error(e);
      }
    }

    try {
      const json = Array.from(JSON.parse(await fs.readFile(file, 'utf-8')));

      if (json.length) {
        return json;
      }

      return [];
    } catch (e) {
      console.error(e);
      return [];
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
