import { Song, Section, Line, Chord, Lyric, Annotation } from './types'

// Regex helpers
const directiveRegex = /^\{([a-zA-Z_]+):?\s*(.*?)\}$/
const chordSplitRegex = /(\[[^\]]+\])/
const chordExtractRegex = /\[([^\]]+)\]/g

export function parseChord(input: string): Song {
  const lines = preprocess(input)
  const song: Song = { metadata: {}, sections: [] }
  let currentSection: Section = { type: 'verse', lines: [] }

  for (const line of lines) {
    if (line.trim() === '') {
      continue
    }

    // Diretiva { ... }
    const directiveMatch = line.match(directiveRegex)
    if (directiveMatch) {
      const [, name, value] = directiveMatch
      handleDirective(song, currentSection, name.toLowerCase(), value)
      continue
    }

    // Linha de música (com ou sem acordes)
    const parsedLine = parseLine(line)
    currentSection.lines.push(parsedLine)
  }

  // Push última seção
  if (currentSection.lines.length > 0) {
    song.sections.push(currentSection)
  }

  return song
}

function preprocess(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.replace(/\\$/, '')) // remove trailing \
    .filter((line) => !line.trim().startsWith('#')) // ignora comentários
}

function handleDirective(song: Song, section: Section, name: string, value: string) {
  const pushSection = () => {
    if (section.lines.length > 0) {
      song.sections.push({ type: section.type, lines: [...section.lines] })
    }
  }

  switch (name) {
    case 'title':
    case 'subtitle':
    case 'artist':
    case 'composer':
    case 'lyricist':
    case 'key':
    case 'capo':
    case 'tempo':
    case 'time':
      song.metadata[name] = value
      break
    case 'start_of_verse':
      pushSection()
      section.type = 'verse'
      section.lines = []
      break
    case 'end_of_verse':
      pushSection()
      section.lines = []
      break

    // edge cases for chorus {soc and eoc}
    case 'soc':
      pushSection()
      section.type = 'chorus'
      section.lines = []
      break
    // edge case for chorus
    case 'chorus':
      pushSection()
      section.type = 'chorus'
      section.lines = []
      break
    case 'start_of_chorus':
      pushSection()
      section.type = 'chorus'
      section.lines = []
      break
    case 'end_of_chorus':
      pushSection()
      section.lines = []
      break
    case 'start_of_bridge':
      pushSection()
      section.type = 'bridge'
      section.lines = []
      break
    case 'end_of_bridge':
      pushSection()
      section.lines = []
      break
    case 'comment':
      song.sections.push({
        type: 'comment',
        lines: [{ parts: [{ type: 'lyric', text: value }] }]
      })
      break
    default:
      song.metadata[name] = value // genérico
      break
  }
}

function parseLine(line: string): Line {
  const parts: (Chord | Lyric | Annotation)[] = []
  const tokens = line.split(chordSplitRegex).filter(Boolean)

  for (const token of tokens) {
    if (token.startsWith('[')) {
      const chordValue = token.replace(/\[|\]/g, '').trim()
      const parsedChord = splitChord(chordValue)
      parts.push({
        type: 'chord',
        value: `${parsedChord.root}${parsedChord.suffix || ''}`
      })
    } else {
      parts.push({ type: 'lyric', text: token })
    }
  }

  return { parts }
}

// Separa root de sufixo: "Cm7" -> { root: "C", suffix: "m7" }
function splitChord(chord: string): { root: string; suffix?: string } {
  const match = chord.match(/^([A-G][b#]?)(.*)$/)
  if (!match) return { root: chord }

  const root = match[1]
  const suffix = match[2]

  return { root, suffix: suffix || undefined }
}
