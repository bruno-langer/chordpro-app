// ============================================================================
// SONG STRUCTURE (AST - Abstract Syntax Tree)
// ============================================================================

export interface Song {
  metadata: SongMetadata;
  sections: Section[];
}

export interface SongMetadata {
  title?: string;
  subtitle?: string;
  artist?: string;
  composer?: string;
  lyricist?: string;
  key?: string;
  capo?: string;
  tempo?: string;
  time?: string;
  [key: string]: string | undefined; // Para metadados customizados
}

export interface Section {
  type: SectionType;
  lines: Line[];
}

export type SectionType =
  | "verse"
  | "chorus"
  | "bridge"
  | "intro"
  | "outro"
  | "instrumental"
  | "comment";

export interface Line {
  parts: LinePart[];
}

// Union type para partes de uma linha
export type LinePart = Chord | Lyric | Annotation;

export interface Chord {
  type: "chord";
  value: string; // Ex: "C", "Dm7", "G/B", "F#m"
}

export interface Lyric {
  type: "lyric";
  text: string;
}

export interface Annotation {
  type: "annotation";
  text: string;
}

// ============================================================================
// LIBRARY & METADATA (Banco de dados)
// ============================================================================

export interface SongMeta {
  id: string;
  title: string;
  artist: string;
  path: string;
  lastKey: number;
  capo: number;
  tags: string[];
  lastOpened: string;
  // Cache
  cachedAst?: Song;
  fileHash?: string;
  lastParsed?: string;
}

export interface Library {
  songs: SongMeta[];
}

// ============================================================================
// HELPERS & UTILITIES
// ============================================================================

// Helper para parsing de acordes (usado internamente)
export interface ParsedChord {
  root: string;      // Ex: "C", "D", "F#"
  suffix?: string;   // Ex: "m7", "sus4", "maj7"
}