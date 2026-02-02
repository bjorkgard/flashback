import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StartMenu } from './StartMenu';

describe('StartMenu', () => {
  it('renders game title', () => {
    const onStart = vi.fn();
    render(<StartMenu onStart={onStart} />);
    
    expect(screen.getByText('FLASHBACK')).toBeInTheDocument();
  });

  it('renders start button', () => {
    const onStart = vi.fn();
    render(<StartMenu onStart={onStart} />);
    
    expect(screen.getByText('Start Game')).toBeInTheDocument();
  });

  it('calls onStart when start button is clicked', () => {
    const onStart = vi.fn();
    render(<StartMenu onStart={onStart} />);
    
    const startButton = screen.getByText('Start Game');
    fireEvent.click(startButton);
    
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('displays control instructions', () => {
    const onStart = vi.fn();
    render(<StartMenu onStart={onStart} />);
    
    expect(screen.getByText('Controls')).toBeInTheDocument();
    expect(screen.getByText('W/A/S/D')).toBeInTheDocument();
    expect(screen.getByText('Move')).toBeInTheDocument();
    expect(screen.getByText('Space')).toBeInTheDocument();
    expect(screen.getByText('Jump')).toBeInTheDocument();
    expect(screen.getByText('Shift')).toBeInTheDocument();
    expect(screen.getByText('Roll')).toBeInTheDocument();
    expect(screen.getByText('E')).toBeInTheDocument();
    expect(screen.getByText('Climb/Interact')).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();
    expect(screen.getByText('Shoot')).toBeInTheDocument();
  });
});
