interface WinProps {
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export function Win({ onPlayAgain, onMainMenu }: WinProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-90 z-50">
      <div className="bg-gray-900 border-4 border-green-500 p-8 rounded-lg shadow-2xl max-w-md w-full">
        <h1 className="text-5xl font-bold text-green-400 text-center mb-8 tracking-wider">
          VICTORY!
        </h1>
        
        <div className="space-y-4">
          <button
            onClick={onPlayAgain}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-6 rounded-lg text-xl transition-colors duration-200"
          >
            Play Again
          </button>
          
          <button
            onClick={onMainMenu}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition-colors duration-200"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
