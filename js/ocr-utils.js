/**
 * Shared OCR utilities for both main thread and Web Worker.
 * Exposes functions on globalThis.ocrUtils for use from modules and classic scripts.
 */
(function initOcrUtils(global) {
  if (global.ocrUtils) {
    return;
  }

  /**
   * Clean OCR text: normalise whitespace, filter noisy strings, extract order codes.
   * @param {string} text
   * @returns {string}
   */
  function cleanOcrText(text) {
    if (!text) return '';

    let cleaned = text.replace(/\s+/g, ' ').trim();

    // Extract OrderCode pattern
    const orderCodeMatch = cleaned.match(/19\s*\d\s*\d\s*\d\s*\d/);
    if (orderCodeMatch) {
      const code = orderCodeMatch[0].replace(/\s/g, '');
      if (code.length === 6) {
        return code;
      }
    }

    // Filter garbage
    if (cleaned.length < 3 && !/^\d+$/.test(cleaned)) {
      return '';
    }

    const specialCharRatio = (cleaned.match(/[^\w\s]/g) || []).length / cleaned.length;
    if (specialCharRatio > 0.3) {
      return '';
    }

    const words = cleaned.split(/\s+/);
    const singleCharWords = words.filter(w => w.length === 1).length;
    if (words.length > 2 && singleCharWords / words.length > 0.5) {
      return '';
    }

    if ((cleaned.match(/-/g) || []).length > 2) {
      return '';
    }

    cleaned = cleaned.replace(/\b\w\b/g, '').replace(/[^\w\s]/g, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    if (cleaned.length < 3) {
      return '';
    }

    return cleaned;
  }

  /**
   * Basic binarisation to improve OCR contrast.
   * @param {HTMLCanvasElement} canvas
   * @param {{contrast?: number, threshold?: number}} options
   */
  function preprocessCanvasForOCR(canvas, options = {}) {
    const {
      contrast = 1.5,
      threshold = 128,
      adaptive = false,
      adaptiveOffset = 0
    } = options;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Optional adaptive threshold using global mean
    let thresholdValue = threshold;
    if (adaptive || threshold === 'auto') {
      let sum = 0;
      const total = data.length / 4;
      for (let i = 0; i < data.length; i += 4) {
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        sum += gray;
      }
      thresholdValue = Math.min(255, Math.max(0, (sum / total) + adaptiveOffset));
    }

    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      const enhanced = Math.max(0, Math.min(255, ((gray - 128) * contrast) + 128));
      const value = enhanced > thresholdValue ? 255 : 0;
      data[i] = data[i + 1] = data[i + 2] = value;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Deduplicate OCR text results by text and spatial proximity.
   * @param {Array<{text:string, centerX:number, centerY:number, width?:number, height?:number}>} items
   * @param {number} proximityRatio distance threshold relative to min(width,height)
   * @returns {Array}
   */
  function dedupeTextData(items, proximityRatio = 0.08) {
    const seen = new Map();
    const result = [];

    for (const item of items) {
      const key = (item.text || '').toUpperCase();
      if (!key) continue;

      if (!seen.has(key)) {
        seen.set(key, [item]);
        result.push(item);
        continue;
      }

      const bucket = seen.get(key);
      const width = item.width || 0;
      const height = item.height || 0;
      const tol = Math.max(4, Math.min(width, height) * proximityRatio);

      const isDuplicate = bucket.some(existing => {
        const dx = (existing.centerX || 0) - (item.centerX || 0);
        const dy = (existing.centerY || 0) - (item.centerY || 0);
        return Math.sqrt(dx * dx + dy * dy) <= tol;
      });

      if (!isDuplicate) {
        bucket.push(item);
        result.push(item);
      }
    }

    return result;
  }

  global.ocrUtils = {
    cleanOcrText,
    preprocessCanvasForOCR,
    dedupeTextData
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);

