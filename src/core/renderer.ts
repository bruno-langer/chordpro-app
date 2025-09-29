// renderer.ts
import { SongAST, Section, LyricLine, Chord } from "./types";

// Renderiza um acorde como <span>
function renderChord(chord: Chord): string {
  return `<span class="chord" data-root="${chord.root}">${chord.root}${chord.suffix ?? ""}</span>`;
}

// Renderiza uma linha de letra + acordes
function renderLine(line: LyricLine): string {
  let html = "<div class='line'>";
  if (line.chords.length > 0) {
    // Exibir acordes acima da letra
    html += "<div class='chords'>";
    html += line.chords.map(renderChord).join(" ");
    html += "</div>";
  }
  html += `<div class='lyrics'>${line.lyrics}</div>`;
  html += "</div>";
  return html;
}

// Renderiza uma seção (verso, refrão, etc.)
function renderSection(section: Section): string {
  return `
    <div class="section ${section.type}">
      ${section.lines.map(renderLine).join("\n")}
    </div>
  `;
}

// Renderiza a música inteira
export function renderSong(ast: SongAST): string {
  return `
  <div class="song">
    <h1>${ast.title}</h1>
    ${ast.artist ? `<h2>${ast.artist}</h2>` : ""}
    ${ast.sections.map(renderSection).join("\n")}
  </div>
  `;
}
