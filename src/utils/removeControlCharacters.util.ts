export function clearString(str: string): string {
  const res: string = str.replace(/[\x00-\x1F\x7F]/g, ''); // remove control characters
  return res.trim();
}
