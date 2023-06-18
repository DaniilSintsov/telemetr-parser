import fs from 'node:fs';

export function getLinksFromTxt(file: string): string[] {
  return fs.readFileSync(file, 'utf-8').toString().split('\n').filter(Boolean);
}

export function writeToTxt(file: string, data: string[]) {
  fs.writeFileSync(file, data.join('\n') + '\n');
}
