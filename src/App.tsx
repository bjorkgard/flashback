import { useEffect, useRef, useState } from 'react';
import { Game } from './game/game';
import { StartMenu } from './ui/StartMenu';
import { PauseMenu } from './ui/PauseMenu';
import { GameOver } from './ui/GameOver';
import { Win } from './ui/Win';
import type { GameMode } from './game/engine/loop';
import type { LevelData } from './game/level/levelTypes';
import sampleLevelDataRaw from './game/level/sampleLevel.json';
import './App.css';

// Type assertion for JSON import
const sampleLevelData = sampleLevelDataRaw as LevelData;

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('menu');
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize game on mount
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const canvas = canvasRef.current;
    
    // Set initial canvas size BEFORE creating game
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    // Create game instance
    const game = new Game(canvas, sampleLevelData);
    gameRef.current = game;

    // Set up mode polling to sync React state with game state
    const pollInterval = setInterval(() => {
      if (gameRef.current) {
        const currentMode = gameRef.current.getMode();
        setGameMode(currentMode);
      }
    }, 100); // Poll every 100ms

    // Handle canvas resize
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      
      const container = containerRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas size to match container
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      
      // Update renderer display size
      if (gameRef.current) {
        const renderer = gameRef.current.getState().renderer;
        renderer.updateDisplaySize(canvas.width, canvas.height);
      }
    };

    // Listen for window resize
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('resize', handleResize);
      if (gameRef.current) {
        gameRef.current.stop();
      }
    };
  }, []);

  // Handle start game
  const handleStart = () => {
    if (gameRef.current) {
      gameRef.current.start();
      setGameMode('playing');
    }
  };

  // Handle pause (ESC key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape' && gameRef.current) {
        const mode = gameRef.current.getMode();
        if (mode === 'playing') {
          gameRef.current.pause();
          setGameMode('paused');
        } else if (mode === 'paused') {
          gameRef.current.resume();
          setGameMode('playing');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle resume from pause
  const handleResume = () => {
    if (gameRef.current) {
      gameRef.current.resume();
      setGameMode('playing');
    }
  };

  // Handle quit to menu
  const handleQuit = () => {
    if (gameRef.current) {
      gameRef.current.stop();
      gameRef.current.reset();
      setGameMode('menu');
    }
  };

  // Handle retry (game over)
  const handleRetry = () => {
    if (gameRef.current) {
      gameRef.current.reset();
      gameRef.current.start();
      setGameMode('playing');
    }
  };

  // Handle play again (win)
  const handlePlayAgain = () => {
    if (gameRef.current) {
      gameRef.current.reset();
      gameRef.current.start();
      setGameMode('playing');
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Canvas container */}
      <div 
        ref={containerRef}
        className="absolute inset-0 flex items-center justify-center"
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* UI Overlays */}
      {gameMode === 'menu' && <StartMenu onStart={handleStart} />}
      {gameMode === 'paused' && (
        <PauseMenu onResume={handleResume} onQuit={handleQuit} />
      )}
      {gameMode === 'gameOver' && (
        <GameOver onRetry={handleRetry} onMainMenu={handleQuit} />
      )}
      {gameMode === 'won' && (
        <Win onPlayAgain={handlePlayAgain} onMainMenu={handleQuit} />
      )}
    </div>
  );
}

export default App;
