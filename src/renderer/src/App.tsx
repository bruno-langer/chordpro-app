import { useState } from 'react';
import SongViewer from "./components/SongViewer";
import EditorView from "./components/EditorViewer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import LibraryMenu from "./components/LibraryMenu";
import TopBar from "./components/TopBar";
import { useSelectedSongs } from "./stores/songs";
import useUi from './stores/ui';

type ViewMode = 'view' | 'edit';

function App() {
  const selectedSong = useSelectedSongs((state) => state.selectedSong);
  const viewMode = useUi((state) => state.viewMode);
  const setViewMode = useUi((state) => state.setViewMode);
  const queryClient = useQueryClient();

  // Lista de músicas
  const { data: songs } = useQuery({
    queryKey: ["songs"],
    queryFn: window.library.getSongs
  });

  // Música selecionada (para visualização)
  const { data: song } = useQuery({
    queryKey: ["song", selectedSong],
    queryFn: () => window.song.open(selectedSong!),
    enabled: !!selectedSong,
  });

  // Raw content (para edição)
  const { data: editData } = useQuery({
    queryKey: ["song-edit", selectedSong],
    queryFn: () => window.song.edit(selectedSong!),
    enabled: !!selectedSong && viewMode === 'edit',
  });

  // Handler para salvar
  const handleSave = async (newContent: string) => {
    if (!selectedSong) return;

    const result = await window.song.save(selectedSong, newContent);

    if (result.success) {
      // Invalida cache para forçar reload
      queryClient.invalidateQueries({ queryKey: ["song", selectedSong] });
      queryClient.invalidateQueries({ queryKey: ["song-edit", selectedSong] });

      // Volta para modo visualização
      // setViewMode('view');
    } else {
      throw new Error(result.error || 'Failed to save');
    }
  };

  // Handler para fechar editor
  const handleCloseEditor = () => {
    setViewMode('view');
    // Limpa cache de edição
    queryClient.removeQueries({ queryKey: ["song-edit", selectedSong] });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        <LibraryMenu />

        <div className=" flex flex-1 overflow-hidden">
          {!selectedSong ? (
            // Nenhuma música selecionada
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a song to view or edit
            </div>
          ) : <>{
            editData?.rawContent && viewMode === 'edit' && (
              <EditorView
                songId={selectedSong}
                initialContent={editData.rawContent}
                onSave={handleSave}
                onClose={handleCloseEditor}
              />
            )}
            <SongViewer song={song?.ast} />
          </>
          }
        </div>
      </div>
    </div>
  );
}

export default App;