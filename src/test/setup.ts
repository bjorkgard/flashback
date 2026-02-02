// Test setup file for Vitest
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

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
          canvas: this,
          fillStyle: '#000000',
          strokeStyle: '#000000',
          imageSmoothingEnabled: true,
          fillRect: () => {},
          strokeRect: () => {},
          clearRect: () => {},
          drawImage: () => {},
          putImageData: () => {},
          getImageData: (x: number, y: number, w: number, h: number) => ({
            width: w,
            height: h,
            data: new Uint8ClampedArray(w * h * 4),
          }),
          createImageData: (width: number, height: number) => {
            return {
              width,
              height,
              data: new Uint8ClampedArray(width * height * 4),
            } as ImageData;
          },
          save: () => {},
          restore: () => {},
          translate: () => {},
          rotate: () => {},
          scale: () => {},
          transform: () => {},
          setTransform: () => {},
          resetTransform: () => {},
          beginPath: () => {},
          closePath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          arc: () => {},
          arcTo: () => {},
          rect: () => {},
          fill: () => {},
          stroke: () => {},
        } as unknown as OffscreenCanvasRenderingContext2D;
      }
      return null;
    }
  }

  (globalThis as any).OffscreenCanvas = OffscreenCanvasPolyfill;
}

// Polyfill HTMLCanvasElement.getContext for Node.js test environment
if (typeof HTMLCanvasElement !== 'undefined') {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  
  if (!originalGetContext || originalGetContext.toString().includes('Not implemented')) {
    HTMLCanvasElement.prototype.getContext = function(contextId: string, options?: any): any {
      if (contextId === '2d') {
        // Create a mock 2D context
        return {
          canvas: this,
          fillStyle: '#000000',
          strokeStyle: '#000000',
          imageSmoothingEnabled: true,
          fillRect: () => {},
          strokeRect: () => {},
          clearRect: () => {},
          drawImage: () => {},
          putImageData: () => {},
          getImageData: (x: number, y: number, w: number, h: number) => {
            return {
              width: w,
              height: h,
              data: new Uint8ClampedArray(w * h * 4),
            } as ImageData;
          },
          createImageData: (width: number, height: number) => {
            return {
              width,
              height,
              data: new Uint8ClampedArray(width * height * 4),
            } as ImageData;
          },
          save: () => {},
          restore: () => {},
          translate: () => {},
          rotate: () => {},
          scale: () => {},
          transform: () => {},
          setTransform: () => {},
          resetTransform: () => {},
          beginPath: () => {},
          closePath: () => {},
          moveTo: () => {},
          lineTo: () => {},
          arc: () => {},
          arcTo: () => {},
          rect: () => {},
          fill: () => {},
          stroke: () => {},
        } as any;
      }
      return null;
    };
  }
}
