import path from 'node:path';
import ts from 'typescript';
import { debugLog } from '../util/debug.js';
import type { SyncCompilers, AsyncCompilers } from '../types/compilers.js';

export class SourceFileManager {
  sourceFileCache: Map<string, ts.SourceFile | undefined> = new Map();
  snapshotCache: Map<string, ts.IScriptSnapshot | undefined> = new Map();
  syncCompilers?: SyncCompilers;
  asyncCompilers?: AsyncCompilers;

  installCompilers(compilers: [SyncCompilers, AsyncCompilers]) {
    this.syncCompilers = compilers[0];
    this.asyncCompilers = compilers[1];
  }

  createSourceFile(filePath: string, contents: string) {
    const sourceFile = ts.createSourceFile(filePath, contents, ts.ScriptTarget.Latest, true);
    this.sourceFileCache.set(filePath, sourceFile);
    return sourceFile;
  }

  getSourceFile(filePath: string) {
    if (this.sourceFileCache.has(filePath)) return this.sourceFileCache.get(filePath);
    const contents = ts.sys.readFile(filePath);
    if (typeof contents !== 'string') throw new Error(`Unable to read ${filePath}`);
    const ext = path.extname(filePath);
    const compiler = this.syncCompilers?.get(ext);
    const compiled = compiler ? compiler(contents) : contents;
    if (compiler) debugLog(`Compiled ${filePath}`);
    return this.createSourceFile(filePath, compiled);
  }

  getSnapshot(filePath: string) {
    if (this.snapshotCache.has(filePath)) return this.snapshotCache.get(filePath);
    const sourceFile = this.getSourceFile(filePath);
    if (!sourceFile) return undefined;
    const snapshot = ts.ScriptSnapshot.fromString(sourceFile.text);
    this.snapshotCache.set(filePath, snapshot);
    return snapshot;
  }

  async compileAndAddSourceFile(filePath: string) {
    const contents = ts.sys.readFile(filePath);
    if (typeof contents !== 'string') throw new Error(`Unable to read ${filePath}`);
    const ext = path.extname(filePath);
    const compiler = this.asyncCompilers?.get(ext);
    if (compiler) {
      const compiled = await compiler(contents);
      debugLog(`Compiled ${filePath}`);
      this.createSourceFile(filePath, compiled);
    }
  }
}