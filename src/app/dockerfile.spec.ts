import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Dockerfile nginx runtime stage', () => {
  it('runs as a non-root user and listens on port 8080', () => {
    const lines = readFileSync(resolve(process.cwd(), 'Dockerfile'), 'utf8').split(/\r?\n/);
    const fromLines = lines.reduce<number[]>((indexes, line, index) => {
      if (/^\s*FROM\s+/i.test(line)) {
        indexes.push(index);
      }
      return indexes;
    }, []);
    const finalStageStart = fromLines.at(-1);

    expect(finalStageStart).toBeDefined();

    const finalStage = lines.slice(finalStageStart! + 1);
    const userLine = finalStage.findIndex((line) => /^\s*USER\s+/i.test(line));
    const commandLine = finalStage.findIndex((line) => /^\s*(CMD|ENTRYPOINT)\s+/i.test(line));
    const exposeLine = finalStage.find((line) => /^\s*EXPOSE\s+/i.test(line));
    const user = userLine >= 0 ? finalStage[userLine].replace(/^\s*USER\s+/i, '').trim() : '';

    expect(userLine).toBeGreaterThanOrEqual(0);
    expect(commandLine).toBeGreaterThan(userLine);
    expect(user.toLowerCase()).not.toBe('root');
    expect(user).not.toBe('0');
    expect(exposeLine).toMatch(/^\s*EXPOSE\s+8080(?:\s|$)/i);
    expect(exposeLine).not.toMatch(/^\s*EXPOSE\s+80(?:\s|$)/i);
  });
});
