// transpose.ts
import path from 'path'
import crypto from 'crypto'
import { Song, Section, Line, Chord, SongAST } from './types'

const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// Helper para encontrar índice da nota
function normalizeNote(note: string): number {
  // Trata casos com bemol (converte para sustenido equivalente)
  const noteMap: { [key: string]: string } = {
    Db: 'C#',
    Eb: 'D#',
    Gb: 'F#',
    Ab: 'G#',
    Bb: 'A#'
  }

  const normalizedNote = noteMap[note] || note
  return notes.findIndex((n) => n === normalizedNote)
}

// Extrai apenas a nota raiz do acorde (sem alterações como b, #)
function extractRoot(chordValue: string): { root: string; rest: string } {
  // Regex para capturar nota + alteração opcional
  const match = chordValue.match(/^([A-G][b#]?)(.*)/)
  if (!match) return { root: chordValue, rest: '' }

  return { root: match[1], rest: match[2] }
}

function transposeChordValue(chordValue: string, steps: number): string {
  const { root, rest } = extractRoot(chordValue)
  const idx = normalizeNote(root)

  if (idx === -1) return chordValue // Retorna original se não conseguir transpor

  const newIdx = (idx + steps + notes.length) % notes.length
  return notes[newIdx] + rest
}

function transposeChord(chord: Chord, steps: number): Chord {
  return {
    ...chord,
    value: transposeChordValue(chord.value, steps)
  }
}

function transposeLine(line: Line, steps: number): Line {
  return {
    ...line,
    parts: line.parts.map((part) => {
      if (part.type === 'chord') {
        return transposeChord(part as Chord, steps)
      }
      return part // Mantém lyrics e annotations inalterados
    })
  }
}

function transposeSection(section: Section, steps: number): Section {
  return {
    ...section,
    lines: section.lines.map((line) => transposeLine(line, steps))
  }
}

export function transposeSong(song: Song, steps: number): Song {
  return {
    ...song,
    sections: song.sections.map((section) => transposeSection(section, steps))
  }
}

// Função auxiliar para obter o índice de uma nota (útil para UI)
export function getNoteIndex(note: string): number {
  return normalizeNote(note)
}

// Função auxiliar para obter nota por índice
export function getNoteByIndex(index: number): string {
  return notes[index] || 'C'
}

// Função para calcular diferença entre duas notas
export function getTransposeSteps(fromNote: string, toNote: string): number {
  const fromIdx = normalizeNote(fromNote)
  const toIdx = normalizeNote(toNote)

  if (fromIdx === -1 || toIdx === -1) return 0

  let steps = toIdx - fromIdx
  if (steps < 0) steps += 12

  return steps
}

// capo.ts
// export function applyCapo(ast: SongAST, fret: number): SongAST {
//   // Um capotraste na casa N equivale a transpor +N sem mudar o tom real
//   return transposeSong(ast, fret)
// }

// Normaliza string removendo acentos, espaços e caracteres especiais
const normalizeString = (str: string): string => {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais e espaços
    .trim()
}

// Gera ID único baseado em pasta pai + título + artista
export const generateSongId = (filePath: string, title?: string, artist?: string): string => {
  const parentFolder = path.basename(path.dirname(filePath))

  // Fallbacks em inglês mais genéricos
  const normalizedTitle = normalizeString(title || 'untitled')
  const normalizedArtist = normalizeString(artist || 'unknown')
  const normalizedFolder = normalizeString(parentFolder)

  // Combina pasta + título + artista
  const key = `${normalizedFolder}_${normalizedTitle}_${normalizedArtist}`

  // Gera hash curto
  return crypto.createHash('sha256').update(key).digest('hex').substring(0, 16)
}
