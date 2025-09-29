import Database from "better-sqlite3";
import { join } from "path";
import { app } from "electron";
import { readFileSync } from "fs";
import crypto from "crypto";
import { SongMeta, Song } from "./types";
import { parseChord } from "./parser";

// ============================================================================
// HELPERS
// ============================================================================

function generateFileHash(content: string): string {
  return crypto
    .createHash("sha256")
    .update(content)
    .digest("hex")
    .substring(0, 16);
}

function isCacheValid(meta: SongMeta, currentHash: string): boolean {
  return !!(
    meta.cachedAst &&
    meta.fileHash === currentHash &&
    meta.lastParsed
  );
}

// ============================================================================
// SONG LIBRARY (Database operations)
// ============================================================================

export class SongLibrary {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const path = dbPath || join(app.getPath("userData"), "library.db");
    console.log("Database path:", path);
    
    this.db = new Database(path);
    this.initDatabase();
  }

  private initDatabase() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS songs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        artist TEXT NOT NULL,
        path TEXT NOT NULL UNIQUE,
        lastKey INTEGER DEFAULT 0,
        capo INTEGER DEFAULT 0,
        tags TEXT DEFAULT '[]',
        lastOpened TEXT,
        cachedAst TEXT,
        fileHash TEXT,
        lastParsed TEXT
      )
    `);
  }

  // CREATE
  addSong(song: SongMeta): void {
    this.db
      .prepare(
        `INSERT OR REPLACE INTO songs 
        (id, title, artist, path, lastKey, capo, tags, lastOpened, cachedAst, fileHash, lastParsed)
        VALUES (@id, @title, @artist, @path, @lastKey, @capo, @tags, @lastOpened, @cachedAst, @fileHash, @lastParsed)`
      )
      .run({
        ...song,
        tags: JSON.stringify(song.tags || []),
        cachedAst: song.cachedAst ? JSON.stringify(song.cachedAst) : null,
      });
  }

  // READ
  getSongById(id: string): SongMeta | null {
    const row: any = this.db
      .prepare("SELECT * FROM songs WHERE id = ?")
      .get(id);
    
    if (!row) return null;
    
    return this.deserializeSongMeta(row);
  }

  getSongByPath(path: string): SongMeta | null {
    const row: any = this.db
      .prepare("SELECT * FROM songs WHERE path = ?")
      .get(path);
    
    if (!row) return null;
    
    return this.deserializeSongMeta(row);
  }

  listSongs(): SongMeta[] {
    const rows = this.db
      .prepare("SELECT * FROM songs ORDER BY lastOpened DESC")
      .all();
    
    return rows.map((row: any) => this.deserializeSongMeta(row));
  }

  searchSongs(query: string): SongMeta[] {
    const rows = this.db
      .prepare(
        `SELECT * FROM songs 
         WHERE title LIKE ? OR artist LIKE ?
         ORDER BY lastOpened DESC`
      )
      .all(`%${query}%`, `%${query}%`);
    
    return rows.map((row: any) => this.deserializeSongMeta(row));
  }

  // UPDATE
  updateSong(id: string, updates: Partial<SongMeta>): void {
    const existing = this.getSongById(id);
    if (!existing) throw new Error(`Song with id ${id} not found`);
    
    const updated = { ...existing, ...updates };
    this.addSong(updated);
  }

  // DELETE
  deleteSong(id: string): void {
    this.db.prepare("DELETE FROM songs WHERE id = ?").run(id);
  }

  // CHECK
  hasSong(id: string): boolean {
    return !!this.getSongById(id);
  }

  hasSongByPath(path: string): boolean {
    return !!this.getSongByPath(path);
  }

  // CACHE OPERATIONS
  clearAllCaches(): void {
    this.db
      .prepare(
        `UPDATE songs 
         SET cachedAst = NULL, fileHash = NULL, lastParsed = NULL`
      )
      .run();
  }

  // SERIALIZATION
  private deserializeSongMeta(row: any): SongMeta {
    return {
      id: row.id,
      title: row.title,
      artist: row.artist,
      path: row.path,
      lastKey: row.lastKey,
      capo: row.capo,
      tags: JSON.parse(row.tags || "[]"),
      lastOpened: row.lastOpened,
      cachedAst: row.cachedAst ? JSON.parse(row.cachedAst) : undefined,
      fileHash: row.fileHash || undefined,
      lastParsed: row.lastParsed || undefined,
    };
  }

  // CLEANUP
  close(): void {
    this.db.close();
  }
}

// ============================================================================
// SONG CACHE (Smart caching with file hash validation)
// ============================================================================

export class SongCache {
  constructor(private library: SongLibrary) {}

  async loadSong(songId: string): Promise<Song> {
    const meta = this.library.getSongById(songId);
    if (!meta) throw new Error(`Song with id ${songId} not found`);

    try {
      const content = readFileSync(meta.path, "utf-8");
      const currentHash = generateFileHash(content);

      // Cache HIT
      if (isCacheValid(meta, currentHash)) {
        console.log(`[Cache HIT] ${meta.title}`);
        return meta.cachedAst!;
      }

      // Cache MISS - Parse and update
      console.log(`[Cache MISS] ${meta.title} - Parsing...`);
      const ast = parseChord(content);

      this.updateCache(songId, ast, currentHash);

      return ast;
    } catch (error) {
      console.error(`Error loading song ${meta.title}:`, error);
      throw error;
    }
  }

  updateCache(songId: string, ast: Song, fileHash: string): void {
    this.library.updateSong(songId, {
      cachedAst: ast,
      fileHash: fileHash,
      lastParsed: new Date().toISOString(),
    });
  }

  invalidateCache(songId: string): void {
    this.library.updateSong(songId, {
      cachedAst: undefined,
      fileHash: undefined,
      lastParsed: undefined,
    });
  }

  async rebuildCache(songId: string): Promise<Song> {
    this.invalidateCache(songId);
    return this.loadSong(songId);
  }

  clearAllCaches(): void {
    this.library.clearAllCaches();
  }
}