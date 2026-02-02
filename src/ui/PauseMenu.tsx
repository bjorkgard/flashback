interface PauseMenuProps {
  onResume: () => void;
  onQuit: () => void;
}

export function PauseMenu({ onResume, onQuit }: PauseMenuProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
      <div className="bg-gray-900 border-4 border-yellow-500 p-8 rounded-lg shadow-2xl max-w-md w-full">
        <h1 className="text-4xl font-bold text-yellow-400 text-center mb-8 tracking-wider">
          PAUSED
        </h1>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={onResume}
            className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200"
          >
            Resume
          </button>
          
          <button
            onClick={onQuit}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200"
          >
            Quit to Menu
          </button>
        </div>
        
        <div className="bg-gray-800 p-4 rounded border border-gray-700">
          <h2 className="text-yellow-300 font-semibold mb-3 text-center">Controls</h2>
          <div className="text-gray-300 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="font-mono">W/A/S/D</span>
              <span>Move</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono">Space</span>
              <span>Jump</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono">Shift</span>
              <span>Roll</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono">E</span>
              <span>Climb/Interact</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono">F</span>
              <span>Shoot</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
