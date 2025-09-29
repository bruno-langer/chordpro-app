import { useEffect, useState } from "react";
import Editor from "./components/EditorView";

function App() {

  const [songs, setSongs] = useState<any[]>([]);
  const [raw, setRaw] = useState<any>();

  useEffect(() => {
    (async () => {
      const songs = await window.library.getSongs();
      setSongs(songs);
    })();
  }, []);

  const handleAddSong = async () => {
    const song = await window.library.pickAndAddSong();
    if (song) {
      const songs = await window.library.getSongs();
      setSongs(songs);
      console.log("Nova música:", song);
      console.log("Biblioteca atualizada:", songs);
    }
  };

  const handleEdit = async (id: string) => {
    const song = await window.song.edit(id);
    setRaw(song);
    console.log("Música editada:", song);
  };

  const handleEditSong = (content: string) => {
    console.log("Conteúdo editado:", content);
    setRaw(state => { return { ...state, rawContent: content } });
  }

  return (
    <>
      <button onClick={handleAddSong}>
        Importar
      </button>

      {raw &&
        <Editor content={raw?.rawContent || ""} onChange={handleEditSong} />}

      <div>
        {songs.map((song) => (
          <div key={song.id} onClick={() => handleEdit(song.id)}>
            <p>{song.title}</p>
            <p>{song.artist}</p>
          </div>
        ))}
      </div>
    </>
  )
}

export default App
