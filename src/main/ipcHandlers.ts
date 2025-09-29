import { ipcMain, dialog } from 'electron';
import { readFileSync, writeFileSync } from 'fs';
import crypto from 'crypto';
import { SongLibrary, SongCache } from '../core/library';
import { parseChord } from '../core/parser';
import { generateSongId } from '../core/musicUtils';
import { SongMeta } from '../core/types';

// ============================================================================
// HELPERS
// ============================================================================

function generateFileHash(content: string): string {
  return crypto
    .createHash('sha256')
    .update(content)
    .digest('hex')
    .substring(0, 16);
}

// ============================================================================
// IPC HANDLERS
// ============================================================================

export function registerIpcHandlers(library: SongLibrary, cache: SongCache) {
  
  // --------------------------------------------------------------------------
  // LIBRARY HANDLERS
  // --------------------------------------------------------------------------
  
  ipcMain.handle('library:getSongs', () => {
    return library.listSongs();
  });

  ipcMain.handle('library:searchSongs', (_, query: string) => {
    return library.searchSongs(query);
  });

  ipcMain.handle('library:getSong', (_, id: string) => {
    return library.getSongById(id);
  });

  ipcMain.handle('library:updateSong', (_, id: string, updates: Partial<SongMeta>) => {
    library.updateSong(id, updates);
    return { success: true };
  });

  ipcMain.handle('library:deleteSong', (_, id: string) => {
    library.deleteSong(id);
    return { success: true };
  });

  // --------------------------------------------------------------------------
  // ADD SONG HANDLER
  // --------------------------------------------------------------------------
  
  ipcMain.handle('library:pickAndAddSong', async () => {
    try {
      const result = await dialog.showOpenDialog({
        title: 'Add Song to Library',
        filters: [
          { name: 'ChordPro Files', extensions: ['chordpro', 'cho', 'pro', 'crd'] },
          { name: 'All Files', extensions: ['*'] }
        ],
        properties: ['openFile']
      });

      if (result.canceled) return null;

      const filePath = result.filePaths[0];
      
      // Check if already exists by path
      if (library.hasSongByPath(filePath)) {
        const existing = library.getSongByPath(filePath);
        return {
          error: 'This file is already in the library',
          duplicate: true,
          existingSong: existing
        };
      }

      const content = readFileSync(filePath, 'utf-8');
      const fileHash = generateFileHash(content);
      const ast = parseChord(content);

      // Validate AST
      if (!ast || !ast.sections || ast.sections.length === 0) {
        throw new Error('File does not contain a valid song');
      }

      const songId = generateSongId(
        filePath,
        ast.metadata.title,
        ast.metadata.artist
      );

      // Double check by ID
      if (library.hasSong(songId)) {
        return {
          error: 'This song already exists in the library',
          duplicate: true,
          existingId: songId
        };
      }

      const meta: SongMeta = {
        id: songId,
        title: ast.metadata.title || 'Untitled',
        artist: ast.metadata.artist || 'Unknown Artist',
        path: filePath,
        lastKey: parseInt(ast.metadata.key || '0') || 0,
        capo: parseInt(ast.metadata.capo || '0') || 0,
        tags: [],
        lastOpened: new Date().toISOString(),
        // Initial cache
        cachedAst: ast,
        fileHash: fileHash,
        lastParsed: new Date().toISOString()
      };

      library.addSong(meta);
      
      return { success: true, meta, ast };

    } catch (error: any) {
      console.error('Error adding song:', error);
      return { error: error.message };
    }
  });

  // --------------------------------------------------------------------------
  // SONG HANDLERS (View/Edit/Save)
  // --------------------------------------------------------------------------
  
  ipcMain.handle('song:open', async (_, songId: string) => {
    try {
      const ast = await cache.loadSong(songId);
      const meta = library.getSongById(songId);

      if (!meta) throw new Error('Song not found');

      // Update lastOpened
      library.updateSong(songId, {
        lastOpened: new Date().toISOString()
      });

      return { success: true, meta, ast };

    } catch (error: any) {
      console.error('Error opening song:', error);
      return { error: error.message };
    }
  });

  ipcMain.handle('song:edit', async (_, songId: string) => {
    try {
      const meta = library.getSongById(songId);
      if (!meta) throw new Error('Song not found');

      const rawContent = readFileSync(meta.path, 'utf-8');

      return { success: true, meta, rawContent };

    } catch (error: any) {
      console.error('Error loading song for edit:', error);
      return { error: error.message };
    }
  });

  ipcMain.handle('song:save', async (_, songId: string, newContent: string) => {
    try {
      const meta = library.getSongById(songId);
      if (!meta) throw new Error('Song not found');

      // Save file
      writeFileSync(meta.path, newContent, 'utf-8');

      // Invalidate cache
      cache.invalidateCache(songId);

      return { success: true };

    } catch (error: any) {
      console.error('Error saving song:', error);
      return { error: error.message };
    }
  });

  // --------------------------------------------------------------------------
  // CACHE HANDLERS
  // --------------------------------------------------------------------------
  
  ipcMain.handle('cache:rebuild', async (_, songId: string) => {
    try {
      const ast = await cache.rebuildCache(songId);
      return { success: true, ast };
    } catch (error: any) {
      return { error: error.message };
    }
  });

  ipcMain.handle('cache:clearAll', () => {
    try {
      cache.clearAllCaches();
      return { success: true };
    } catch (error: any) {
      return { error: error.message };
    }
  });
}