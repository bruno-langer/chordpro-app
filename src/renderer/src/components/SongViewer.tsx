import { getTransposeSteps, transposeSong } from "@renderer/musicUtils";
import { useSelectedSongs } from "@renderer/stores/songs";
import useUi from "@renderer/stores/ui";

// Mock types
interface Song {
    metadata: {
        title?: string;
        artist?: string;
        key?: string;
        capo?: string;
    };
    sections: Section[];
}

export type SectionType =
    | "verse"
    | "chorus"
    | "bridge"
    | "intro"
    | "outro"
    | "instrumental"
    | "comment";

interface Section {
    type: SectionType;
    lines: Line[];
}

interface Line {
    parts: LinePart[];
}

type LinePart =
    | { type: 'chord'; value: string }
    | { type: 'lyric'; text: string }
    | { type: 'annotation'; text: string };

// ============================================================================
// COMPONENTS
// ============================================================================

function ChordPart({ value, onClick }: { value: string; onClick?: () => void }) {
    return (
        <span
            onClick={onClick}
            className="inline-block text-blue-600 font-bold font-mono text-sm 
                 cursor-pointer hover:text-blue-800 hover:scale-110 
                 transition-all px-1 transform
                -translate-y-full translate-x-full"
            title="Click to see chord diagram"
        >
            {value}
        </span>
    );
}

interface ChordPosition {
    chord: string;
    position: number; // posição em caracteres
}

function ChordLine({ line }: { line: Line }) {
    // Separa acordes e letras
    const chords: ChordPosition[] = [];
    let lyrics = '';
    let currentPos = 0;

    line.parts.forEach((part) => {
        if (part.type === 'chord') {
            chords.push({
                chord: part.value,
                position: currentPos
            });
        } else if (part.type === 'lyric') {
            lyrics += part.text;
            currentPos += part.text.length;
        }
    });

    // Se não tem letras, é linha só de acordes
    if (lyrics.trim() === '') {
        return (
            <div className="mb-4 h-6">
                <div className="relative font-mono whitespace-pre">
                    {chords.map((chord, idx) => (
                        <span
                            key={idx}
                            className="absolute text-blue-600 font-bold cursor-pointer 
                         hover:text-blue-800 transition-colors"
                            style={{ left: `${chord.position}ch` }}
                            title="Click for chord diagram"
                        >
                            {chord.chord}
                        </span>
                    ))}
                </div>
            </div>
        );
    }

    // Linha com acordes + letras
    return (
        <div className="mb-4 relative">
            {/* Acordes layer (acima) */}
            <div className="relative h-6 font-mono whitespace-pre">
                {chords.map((chord, idx) => (
                    <span
                        key={idx}
                        className="absolute text-blue-600 font-bold text-sm cursor-pointer 
                       hover:text-blue-800 hover:scale-110 transition-all"
                        style={{ left: `${chord.position}ch` }}
                        title="Click for chord diagram"
                    >
                        {chord.chord}
                    </span>
                ))}
            </div>

            {/* Letras layer (abaixo) */}
            <div className="font-mono whitespace-pre text-gray-800 leading-relaxed">
                {lyrics}
            </div>
        </div>
    );
}

function LyricPart({ text }: { text: string }) {
    return (
        <span className="text-gray-800 text-base">
            {text}
        </span>
    );
}

function AnnotationPart({ text }: { text: string }) {
    return (
        <span className="text-gray-500 italic text-sm">
            ({text})
        </span>
    );
}

function Line({ line }: { line: Line }) {
    return (
        <div className="mb-3 leading-relaxed">
            {line.parts.map((part, idx) => {
                switch (part.type) {
                    case 'chord':
                        return <ChordPart key={idx} value={part.value} />;
                    case 'lyric':
                        return <LyricPart key={idx} text={part.text} />;
                    case 'annotation':
                        return <AnnotationPart key={idx} text={part.text} />;
                    default:
                        return null;
                }
            })}
        </div>
    );
}

function Section({ section }: { section: Section }) {
    const sectionStyles = {
        verse: 'bg-white',
        chorus: 'bg-yellow-50 border-l-4 border-yellow-400',
        bridge: 'bg-blue-50 border-l-4 border-blue-400',
        intro: 'bg-gray-50',
        outro: 'bg-gray-50',
        comment: 'bg-green-50 italic'
    };

    const sectionLabels = {
        verse: 'Verse',
        chorus: 'Chorus',
        bridge: 'Bridge',
        intro: 'Intro',
        outro: 'Outro',
        comment: 'Comment'
    };

    return (
        <div className={`mb-6 p-4 rounded-lg ${sectionStyles[section.type]}`}>
            <div className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-2">
                {sectionLabels[section.type]}
            </div>
            {section.lines.map((line, idx) => (
                <ChordLine key={idx} line={line} />
            ))}
        </div>
    );
}

function SongHeader({ metadata }: { metadata: Song['metadata'] }) {
    return (
        <div className="mb-8 pb-6 border-b-2 border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {metadata.title || 'Untitled'}
            </h1>
            {metadata.artist && (
                <p className="text-lg text-gray-600 mb-3">
                    {metadata.artist}
                </p>
            )}
            <div className="flex gap-4 text-sm text-gray-500">
                {metadata.key && (
                    <span className="bg-gray-100 px-3 py-1 rounded">
                        Key: <strong>{metadata.key}</strong>
                    </span>
                )}
                {metadata.capo && metadata.capo !== '0' && (
                    <span className="bg-gray-100 px-3 py-1 rounded">
                        Capo: <strong>{metadata.capo}</strong>
                    </span>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// MAIN VIEWER COMPONENT
// ============================================================================

function SongViewer({ song }: { song: Song }) {

    const menuOpen = useUi((state) => state.menuOpen);
    const selectedKey = useSelectedSongs((state) => state.selectedKey);

    const steps = getTransposeSteps(song?.metadata?.key || 'C', selectedKey)

    if (!song) {
        return (
            <div className="bg-orange-100 p-4 rounded-lg text-center h-fit">
                No song selected
            </div>)
    }

    return (
        <div className={` ${menuOpen ? "mx-16 w-[60%]" : "mx-64 flex-1"}  p-8 bg-white h-screen overflow-y-auto transition-all`}>
            <SongHeader metadata={song?.metadata} />

            {transposeSong(song, steps)?.sections.map((section, idx) => (
                <Section key={idx} section={section} />
            ))}
        </div>
    );
}



export default SongViewer;