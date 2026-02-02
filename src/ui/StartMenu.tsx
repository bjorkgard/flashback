interface StartMenuProps {
  onStart: () => void;
}

export function StartMenu({ onStart }: StartMenuProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
      <div className="bg-gray-900 border-4 border-cyan-500 p-8 rounded-lg shadow-2xl max-w-md w-full">
        <h1 className="text-5xl font-bold text-cyan-400 text-center mb-8 tracking-wider">
          FLASHBACK
        </h1>
        
        <button
          onClick={onStart}
          className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 px-6 rounded-lg text-xl mb-6 transition-colors duration-200"
        >
          Start Game
        </button>
        
        <div className="bg-gray-800 p-4 rounded border border-gray-700">
          <h2 className="text-cyan-300 font-semibold mb-3 text-center">Controls</h2>
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
