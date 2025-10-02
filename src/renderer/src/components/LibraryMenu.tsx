import { useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { PlusIcon, Bars3Icon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Fragment } from 'react'
import { useQuery } from '@tanstack/react-query'
import useUi from '@renderer/stores/ui'
import { useSelectedSongs } from '@renderer/stores/songs'

export default function LibraryMenu() {
  const menuOpen = useUi((state) => state.menuOpen);
  const setMenuOpen = useUi((state) => state.toggleMenu);

  const selectSong = useSelectedSongs((state) => state.selectSong);
  const selectedSong = useSelectedSongs((state) => state.selectedSong);
  const setSelectedKey = useSelectedSongs((state) => state.setSelectedKey);



  const handleImportNewSong = () => {
    window.library.pickAndAddSong();
  }


  const [search, setSearch] = useState('')

  const { data: songs } = useQuery({
    queryKey: ["songs"],
    queryFn: window.library.getSongs,
  })

  return (
    <div className={"flex h-full" + (menuOpen ? " overflow-hidden" : "display-none w-0")}>
      {/* Sidebar */}
      <div
        className={`transition-all duration-300 text-white p-0 border-r-2 border-gray-200
        ${menuOpen ? "w-64" : " w-0 overflow-hidden display-none"}`}
      >
        <div className="mb-2 flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by name..."
            className="text-black bg-white p-2 my-2 rounded-md border-2 border-gray-200"
          />
          <PlusIcon className="h-6 w-6 cursor-pointer text-gray-600 hover:text-gray-800 hover:scale-95 transition-all " onClick={handleImportNewSong} />
        </div>
        <ul>
          {menuOpen && songs?.filter(song => song.title.toLowerCase().includes(search.toLowerCase())).map((song) => (
            <li key={song.id} className={"mb-2 text-gray-800" + (song.id === selectedSong ? " bg-gray-100" : "")}>
              <button
                onClick={() => {
                  console.log(song)
                  selectSong(song.id)
                  setSelectedKey(song.cachedAst.metadata.key)
                }}
                className="flex items-center space-x-2"
              >
                <span>{song.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
