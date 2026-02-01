// Test setup file for Vitest
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Polyfill OffscreenCanvas for Node.js test environment
if (typeof OffscreenCanvas === 'undefined') {
  class OffscreenCanvasPolyfill {
    width: number;
    height: number;

    constructor(width: number, height: number) {
      this.width = width;
      this.height = height;
    }

    getContext(contextId: string): OffscreenCanvasRenderingContext2D | null {
      if (contextId === '2d') {
        // Create a mock 2D context
        return {
          createImageData: (width: number, height: number) => {
            return {
              width,
              height,
              data: new Uint8ClampedArray(width * height * 4),
            } as ImageData;
          },
          putImageData: () => {},
        } as unknown as OffscreenCanvasRenderingContext2D;
      }
      return null;
    }
  }

  (globalThis as any).OffscreenCanvas = OffscreenCanvasPolyfill;
}
