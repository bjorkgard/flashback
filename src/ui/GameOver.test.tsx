import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameOver } from './GameOver';

describe('GameOver', () => {
  it('renders game over message', () => {
    const onRetry = vi.fn();
    const onMainMenu = vi.fn();
    render(<GameOver onRetry={onRetry} onMainMenu={onMainMenu} />);
    
    expect(screen.getByText('GAME OVER')).toBeInTheDocument();
  });

  it('renders retry and main menu buttons', () => {
    const onRetry = vi.fn();
    const onMainMenu = vi.fn();
    render(<GameOver onRetry={onRetry} onMainMenu={onMainMenu} />);
    
    expect(screen.getByText('Retry')).toBeInTheDocument();
    expect(screen.getByText('Main Menu')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    const onMainMenu = vi.fn();
    render(<GameOver onRetry={onRetry} onMainMenu={onMainMenu} />);
    
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onMainMenu).not.toHaveBeenCalled();
  });

  it('calls onMainMenu when main menu button is clicked', () => {
    const onRetry = vi.fn();
    const onMainMenu = vi.fn();
    render(<GameOver onRetry={onRetry} onMainMenu={onMainMenu} />);
    
    const mainMenuButton = screen.getByText('Main Menu');
    fireEvent.click(mainMenuButton);
    
    expect(onMainMenu).toHaveBeenCalledTimes(1);
    expect(onRetry).not.toHaveBeenCalled();
  });
});
