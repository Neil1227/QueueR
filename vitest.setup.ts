import '@testing-library/jest-dom';

// Simple mock for HTMLCanvasElement.getContext in jsdom
if (typeof window !== 'undefined') {
  (HTMLCanvasElement.prototype as any).getContext = function () {
    return {
      fillRect: () => {},
      clearRect: () => {},
      getImageData: (x: number, y: number, w: number, h: number) => ({
        data: new Uint8ClampedArray(w * h * 4),
        width: w,
        height: h,
        colorSpace: 'srgb',
      }),
      putImageData: () => {},
      createImageData: () => [],
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {},
      quadraticCurveTo: () => {},
      createLinearGradient: () => ({
        addColorStop: () => {},
      }),
    };
  };

  (HTMLCanvasElement.prototype as any).toDataURL = function () {
    return 'data:image/png;base64,mockImageData';
  };
  (HTMLCanvasElement.prototype as any).toBlob = function (cb: (blob: Blob | null) => void) {
    cb(new Blob(['mock'], { type: 'image/png' }));
  };
}
