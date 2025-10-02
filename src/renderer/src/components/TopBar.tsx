import { FolderIcon, PencilIcon, EyeIcon, XMarkIcon, PlusCircleIcon, MinusCircleIcon } from '@heroicons/react/24/solid'
import { decrementNote, incrementNote } from '@renderer/musicUtils';
import { useSelectedSongs } from '@renderer/stores/songs';
import useUi from '@renderer/stores/ui';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

const Tab = ({ children, active, onClick, onClose }) => {

    const [hover, setHover] = useState(false);

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}

            className={`
          h-10 px-4 flex items-center justify-center transform translate-y-1
          bg-gray-100
          border-2 border-gray-200 border-b-0
          ${active ? "bg-white transform h-10 translate-y-1.25" : ""}
          rounded-t-md
        `} onClick={onClick}>
            {<>
                {children}
                {hover && <XMarkIcon className="h-4 w-4 cursor-pointer text-gray-600 ml-2 hover:text-gray-800 hover:scale-95 transition-all " onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }} />}
            </>}
        </div>
    )
}



{/* <div
                            onClick={() => selectSong(songId)}
                            className={`
          h-10 px-4 flex items-center justify-center transform translate-y-1
          bg-gray-100
          border-2 border-gray-200 border-b-0
          ${songId === selectedSong ? "bg-white transform h-10 translate-y-1.25" : ""}
          rounded-t-md
        `}
                            key={songId}>{actualSong?.title}</div> */}


export default function TopBar() {

    const setMenuOpen = useUi((state) => state.toggleMenu);
    const viewMode = useUi((state) => state.viewMode);
    const toggleViewMode = useUi((state) => state.toggleViewMode);

    const selectedSong = useSelectedSongs((state) => state.selectedSong);
    const selectedSongs = useSelectedSongs((state) => state.selectedSongs);
    const selectSong = useSelectedSongs((state) => state.selectSong);
    const removeSong = useSelectedSongs((state) => state.removeSong);
    const selectedKey = useSelectedSongs((state) => state.selectedKey);
    const setSelectedKey = useSelectedSongs((state) => state.setSelectedKey);

    const { data: songs } = useQuery({
        queryKey: ["songs"],
        queryFn: window.library.getSongs
    })


    console.log(selectedSongs)
    return (
        <div className="flex items-center h-12 text-white p-4 border-b-2 border-gray-200">
            <FolderIcon className="h-6 w-6 cursor-pointer text-gray-600 hover:text-gray-800 hover:scale-95 transition-all mr-4 " onClick={setMenuOpen} />

            {
                viewMode === 'view' &&
                <PencilIcon className="h-6 w-6 cursor-pointer text-gray-600 hover:text-gray-800 hover:scale-95 transition-all " onClick={toggleViewMode} />
            }{
                viewMode === 'edit' &&
                <EyeIcon className="h-6 w-6 cursor-pointer text-gray-600 hover:text-gray-800 hover:scale-95 transition-all " onClick={toggleViewMode} />

            }

            {/* opened tabs */}
            <div className='text-black flex gap-2 ml-10 items-center'>
                {
                    selectedSongs.map((songId) => {

                        const actualSong = songs?.find((song) => song.id === songId);

                        return <Tab
                            key={songId}
                            active={songId === selectedSong}
                            onClick={() => selectSong(songId)}
                            onClose={() => {
                                console.log("removing song", songId)
                                removeSong(songId)
                            }}
                        >{actualSong?.title}</Tab>
                    })
                }
            </div>

            <div
                className='flex gap-2 text-black ml-10 items-center'
            ><MinusCircleIcon className="h-6 w-6 cursor-pointer text-gray-600 hover:text-gray-800 hover:scale-95 transition-all " onClick={() => {
                setSelectedKey(decrementNote(selectedKey))
            }} />
                <span>{selectedKey}</span>
                <PlusCircleIcon className="h-6 w-6 cursor-pointer text-gray-600 hover:text-gray-800 hover:scale-95 transition-all " onClick={() => setSelectedKey(incrementNote(selectedKey))} />
            </div>
        </div >
    );
}
