/**
 * OCR Web Worker
 * Handles heavy OCR processing off the main thread for better UI responsiveness
 */

// Import Tesseract.js in worker context
importScripts('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js');
// Shared OCR utilities (classic script)
importScripts('./ocr-utils.js');

const { cleanOcrText, dedupeTextData } = (self && self.ocrUtils) || {};
if (!cleanOcrText || !dedupeTextData) {
  throw new Error('OCR utilities not loaded in worker');
}

let worker = null;
let isInitialized = false;

/**
 * Initialize Tesseract worker
 */
async function initialize() {
  if (isInitialized && worker) {
    return true;
  }

  try {
    console.log('[OCR Worker] Initializing Tesseract...');

    worker = await Tesseract.createWorker('eng');

    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -.,()',
      preserve_interword_spaces: '0',
      tessedit_pageseg_mode: '6',
    });

    isInitialized = true;
    console.log('[OCR Worker] Tesseract initialized successfully');
    return true;
  } catch (error) {
    console.error('[OCR Worker] Failed to initialize:', error);
    isInitialized = false;
    throw error;
  }
}

/**
 * Process image and extract text with spatial data
 * @param {string} imageBase64 - Base64 encoded image (data URL)
 * @param {number} width
 * @param {number} height
 * @returns {Promise<Array>}
 */
async function processImage(imageBase64, width, height) {
  if (!isInitialized) {
    await initialize();
  }

  // Tesseract.js can directly recognize base64 data URLs
  const result = await worker.recognize(imageBase64);

  const textData = result.data.lines
    .map(line => {
      const cleanedText = cleanOcrText(line.text);
      if (!cleanedText || (cleanedText.length < 3 && !/^19\d{4}$/.test(cleanedText))) {
        return null;
      }

      const bbox = line.bbox || { x0: 0, y0: 0, x1: width, y1: height };
      const centerX = (bbox.x0 + bbox.x1) / 2;
      const centerY = (bbox.y0 + bbox.y1) / 2;

      return {
        text: cleanedText,
        bbox: bbox,
        centerX: centerX,
        centerY: centerY,
        width: width,
        height: height,
        confidence: line.confidence
      };
    })
    .filter(item => item !== null && item.text && item.text.length > 0);

  return dedupeTextData(textData);
}

/**
 * Terminate worker
 */
async function terminate() {
  if (worker) {
    await worker.terminate();
    worker = null;
    isInitialized = false;
  }
}

// Message handler
self.onmessage = async function(e) {
  const { type, id, data } = e.data;

  try {
    switch (type) {
      case 'init':
        await initialize();
        self.postMessage({ type: 'init_complete', id, success: true });
        break;

      case 'process':
        const { imageBase64, width, height } = data;

        // Process the base64 image directly
        const results = await processImage(imageBase64, width, height);
        self.postMessage({ type: 'result', id, results });
        break;

      case 'terminate':
        await terminate();
        self.postMessage({ type: 'terminated', id });
        break;

      default:
        self.postMessage({ type: 'error', id, error: 'Unknown message type: ' + type });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      id,
      error: error.message || 'Unknown error in OCR worker'
    });
  }
};

// Signal that worker is ready
self.postMessage({ type: 'ready' });
