import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PauseMenu } from './PauseMenu';

describe('PauseMenu', () => {
  it('renders paused title', () => {
    const onResume = vi.fn();
    const onQuit = vi.fn();
    render(<PauseMenu onResume={onResume} onQuit={onQuit} />);
    
    expect(screen.getByText('PAUSED')).toBeInTheDocument();
  });

  it('renders resume and quit buttons', () => {
    const onResume = vi.fn();
    const onQuit = vi.fn();
    render(<PauseMenu onResume={onResume} onQuit={onQuit} />);
    
    expect(screen.getByText('Resume')).toBeInTheDocument();
    expect(screen.getByText('Quit to Menu')).toBeInTheDocument();
  });

  it('calls onResume when resume button is clicked', () => {
    const onResume = vi.fn();
    const onQuit = vi.fn();
    render(<PauseMenu onResume={onResume} onQuit={onQuit} />);
    
    const resumeButton = screen.getByText('Resume');
    fireEvent.click(resumeButton);
    
    expect(onResume).toHaveBeenCalledTimes(1);
    expect(onQuit).not.toHaveBeenCalled();
  });

  it('calls onQuit when quit button is clicked', () => {
    const onResume = vi.fn();
    const onQuit = vi.fn();
    render(<PauseMenu onResume={onResume} onQuit={onQuit} />);
    
    const quitButton = screen.getByText('Quit to Menu');
    fireEvent.click(quitButton);
    
    expect(onQuit).toHaveBeenCalledTimes(1);
    expect(onResume).not.toHaveBeenCalled();
  });

  it('displays control instructions', () => {
    const onResume = vi.fn();
    const onQuit = vi.fn();
    render(<PauseMenu onResume={onResume} onQuit={onQuit} />);
    
    expect(screen.getByText('Controls')).toBeInTheDocument();
    expect(screen.getByText('W/A/S/D')).toBeInTheDocument();
    expect(screen.getByText('Space')).toBeInTheDocument();
    expect(screen.getByText('Shift')).toBeInTheDocument();
    expect(screen.getByText('E')).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument();
  });
});
