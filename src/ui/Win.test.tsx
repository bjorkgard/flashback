import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Win } from './Win';

describe('Win', () => {
  it('renders victory message', () => {
    const onPlayAgain = vi.fn();
    const onMainMenu = vi.fn();
    render(<Win onPlayAgain={onPlayAgain} onMainMenu={onMainMenu} />);
    
    expect(screen.getByText('VICTORY!')).toBeInTheDocument();
  });

  it('renders play again and main menu buttons', () => {
    const onPlayAgain = vi.fn();
    const onMainMenu = vi.fn();
    render(<Win onPlayAgain={onPlayAgain} onMainMenu={onMainMenu} />);
    
    expect(screen.getByText('Play Again')).toBeInTheDocument();
    expect(screen.getByText('Main Menu')).toBeInTheDocument();
  });

  it('calls onPlayAgain when play again button is clicked', () => {
    const onPlayAgain = vi.fn();
    const onMainMenu = vi.fn();
    render(<Win onPlayAgain={onPlayAgain} onMainMenu={onMainMenu} />);
    
    const playAgainButton = screen.getByText('Play Again');
    fireEvent.click(playAgainButton);
    
    expect(onPlayAgain).toHaveBeenCalledTimes(1);
    expect(onMainMenu).not.toHaveBeenCalled();
  });

  it('calls onMainMenu when main menu button is clicked', () => {
    const onPlayAgain = vi.fn();
    const onMainMenu = vi.fn();
    render(<Win onPlayAgain={onPlayAgain} onMainMenu={onMainMenu} />);
    
    const mainMenuButton = screen.getByText('Main Menu');
    fireEvent.click(mainMenuButton);
    
    expect(onMainMenu).toHaveBeenCalledTimes(1);
    expect(onPlayAgain).not.toHaveBeenCalled();
  });
});
