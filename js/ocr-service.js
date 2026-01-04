/**
 * OCR Service for Seima Scanner
 * Provides client-side text recognition using Tesseract.js
 * Supports Web Worker for off-main-thread processing
 * Used for Text Scan mode to read product labels and OrderCodes
 */

export class OCRService {
  constructor() {
    // Tesseract worker (direct mode)
    this.tesseractWorker = null;
    this.isInitialized = false;
    this.isScanning = false;
    this.scanInterval = null; // legacy name, reused as timer handle
    this.isProcessing = false;
    this.preprocessOptions = {
      contrast: 1.5,
      threshold: 'auto',
      adaptive: true,
      adaptiveOffset: 0
    };

    // Web Worker support
    this.ocrWorker = null;
    this.useWebWorker = false;
    this.workerReady = false;
    this.pendingRequests = new Map();
    this.requestId = 0;

    // Reusable canvas for memory efficiency
    this.canvas = null;
    this.ctx = null;
  }

  get helpers() {
    const helpers = (globalThis && globalThis.ocrUtils) || {};
    if (!helpers.cleanOcrText || !helpers.preprocessCanvasForOCR || !helpers.dedupeTextData) {
      throw new Error('OCR utilities not loaded');
    }
    return helpers;
  }

  setPreprocessOptions(options = {}) {
    this.preprocessOptions = {
      ...this.preprocessOptions,
      ...options
    };
  }

  /**
   * Get or create reusable canvas
   * @param {number} width
   * @param {number} height
   * @returns {{canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D}}
   */
  getCanvas(width, height) {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    }
    this.canvas.width = width;
    this.canvas.height = height;
    return { canvas: this.canvas, ctx: this.ctx };
  }

  /**
   * Initialize OCR - tries Web Worker first, falls back to direct Tesseract
   * @param {boolean} preferWorker - Whether to prefer Web Worker (default: true)
   */
  async initialize(preferWorker = true) {
    if (this.isInitialized) {
      return true;
    }

    // Try Web Worker first if preferred
    if (preferWorker && typeof Worker !== 'undefined') {
      try {
        await this.initializeWebWorker();
        this.useWebWorker = true;
        this.isInitialized = true;
        console.log('✅ OCR initialized with Web Worker (off-main-thread)');
        return true;
      } catch (error) {
        console.warn('⚠️ Web Worker initialization failed, falling back to direct mode:', error.message);
      }
    }

    // Fallback to direct Tesseract
    await this.initializeDirect();
    this.useWebWorker = false;
    this.isInitialized = true;
    console.log('✅ OCR initialized in direct mode');
    return true;
  }

  /**
   * Initialize Web Worker for OCR
   */
  async initializeWebWorker() {
    return new Promise((resolve, reject) => {
      try {
        this.ocrWorker = new Worker('./js/ocr-worker.js');

        const timeout = setTimeout(() => {
          reject(new Error('Web Worker initialization timeout'));
        }, 10000);

        this.ocrWorker.onmessage = (e) => {
          const { type, id, results, error, success } = e.data;

          if (type === 'ready') {
            // Worker is loaded, now initialize Tesseract
            this.ocrWorker.postMessage({ type: 'init', id: 'init' });
          } else if (type === 'init_complete') {
            clearTimeout(timeout);
            this.workerReady = true;
            resolve(true);
          } else if (type === 'result') {
            const pending = this.pendingRequests.get(id);
            if (pending) {
              pending.resolve(results);
              this.pendingRequests.delete(id);
            }
          } else if (type === 'error') {
            if (id === 'init') {
              clearTimeout(timeout);
              reject(new Error(error));
            } else {
              const pending = this.pendingRequests.get(id);
              if (pending) {
                pending.reject(new Error(error));
                this.pendingRequests.delete(id);
              }
            }
          }
        };

        this.ocrWorker.onerror = (error) => {
          clearTimeout(timeout);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Initialize Tesseract.js directly (fallback mode)
   */
  async initializeDirect() {
    if (this.tesseractWorker) {
      return this.tesseractWorker;
    }

    try {
      console.log('🔍 Initializing Tesseract directly...');

      if (typeof Tesseract === 'undefined') {
        throw new Error('Tesseract.js not loaded. Please ensure the script is included.');
      }

      this.tesseractWorker = await Tesseract.createWorker('eng');

      await this.tesseractWorker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -.,()',
        preserve_interword_spaces: '0',
        tessedit_pageseg_mode: '6',
      });

      return this.tesseractWorker;
    } catch (error) {
      console.error('❌ Failed to initialize Tesseract:', error);
      throw error;
    }
  }

  /**
   * Convert canvas to base64 PNG for worker
   * @param {HTMLCanvasElement} canvas
   * @returns {string}
   */
  canvasToBase64(canvas) {
    return canvas.toDataURL('image/png');
  }

  /**
   * Process image using Web Worker
   * @param {string} imageBase64 - Base64 encoded image
   * @param {number} width
   * @param {number} height
   * @returns {Promise<Array>}
   */
  async processWithWorker(imageBase64, width, height) {
    return new Promise((resolve, reject) => {
      const id = `req_${++this.requestId}`;

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error('OCR processing timeout'));
      }, 30000);

      this.pendingRequests.set(id, {
        resolve: (results) => {
          clearTimeout(timeout);
          resolve(results);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        }
      });

      this.ocrWorker.postMessage({
        type: 'process',
        id,
        data: { imageBase64, width, height }
      });
    });
  }

  /**
   * Start OCR scanning on video element
   * @param {HTMLVideoElement} videoElement - Video element to capture frames from
   * @param {Function} onResults - Callback function(results: Array)
   * @param {number} interval - Scan interval in milliseconds (default: 1500)
   */
  async startScanning(videoElement, onResults, interval = 1500) {
    if (this.isScanning) {
      console.warn('OCR scanning already in progress');
      return;
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!videoElement || videoElement.paused || videoElement.ended) {
      throw new Error('Video element not ready for OCR scanning');
    }

    this.isScanning = true;
    this.runScanLoop(videoElement, onResults, interval);

    console.log('✅ OCR scanning started' + (this.useWebWorker ? ' (Web Worker mode)' : ' (direct mode)'));
  }

  runScanLoop(videoElement, onResults, interval) {
    if (!this.isScanning) {
      return;
    }

    if (this.scanInterval) {
      clearTimeout(this.scanInterval);
    }

    this.scanInterval = setTimeout(async () => {
      if (!this.isScanning) {
        return;
      }

      if (this.isProcessing || !videoElement || videoElement.paused || videoElement.ended || videoElement.readyState < 2) {
        this.runScanLoop(videoElement, onResults, interval);
        return;
      }

      this.isProcessing = true;

      try {
        const width = videoElement.videoWidth || 640;
        const height = videoElement.videoHeight || 480;

        if (width === 0 || height === 0) {
          this.isProcessing = false;
          this.runScanLoop(videoElement, onResults, interval);
          return;
        }

        const { canvas, ctx } = this.getCanvas(width, height);
        ctx.drawImage(videoElement, 0, 0, width, height);

        const { preprocessCanvasForOCR, dedupeTextData } = this.helpers;
        const preprocessOpts = this.preprocessOptions;

        let textData;

        if (this.useWebWorker && this.workerReady) {
          preprocessCanvasForOCR(canvas, preprocessOpts);
          const imageBase64 = this.canvasToBase64(canvas);
          textData = await this.processWithWorker(imageBase64, width, height);
        } else {
          preprocessCanvasForOCR(canvas, preprocessOpts);
          const result = await this.tesseractWorker.recognize(canvas);
          textData = this.extractTextData(result, width, height);
        }

        const unique = dedupeTextData(textData);

        if (unique.length > 0) {
          this.isScanning = false;
          console.log('📝 OCR detected text with spatial data:', unique.length, 'items');
          onResults(unique);
        }
      } catch (error) {
        if (!error.message || (!error.message.includes('too small') && !error.message.includes('cannot be recognized'))) {
          console.warn('OCR recognition error:', error);
        }
      } finally {
        this.isProcessing = false;
        if (this.isScanning) {
          this.runScanLoop(videoElement, onResults, interval);
        }
      }
    }, interval);
  }

  /**
   * Stop OCR scanning
   */
  stopScanning() {
    if (this.scanInterval) {
      clearTimeout(this.scanInterval);
      this.scanInterval = null;
    }
    this.isScanning = false;
    this.isProcessing = false;
    console.log('🛑 OCR scanning stopped');
  }

  /**
   * Capture and process a single image from video element
   * @param {HTMLVideoElement} videoElement - Video element to capture frame from
   * @returns {Promise<Array>} Array of objects with text and spatial data
   */
  async captureAndProcessImage(videoElement) {
    if (this.isProcessing) {
      console.warn('OCR processing already in progress');
      return [];
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!videoElement || videoElement.paused || videoElement.ended) {
      throw new Error('Video element not ready for OCR capture');
    }

    if (videoElement.readyState < 2) {
      throw new Error('Video not ready - please wait a moment');
    }

    this.isProcessing = true;

    try {
      const width = videoElement.videoWidth || 640;
      const height = videoElement.videoHeight || 480;

      if (width === 0 || height === 0) {
        throw new Error('Video dimensions not available');
      }

      const { canvas, ctx } = this.getCanvas(width, height);
      ctx.drawImage(videoElement, 0, 0, width, height);

      let textData;

      const { preprocessCanvasForOCR, dedupeTextData } = this.helpers;

      if (this.useWebWorker && this.workerReady) {
        // Use Web Worker
        // Preprocess first, then convert to base64 for worker
        preprocessCanvasForOCR(canvas, this.preprocessOptions);
        const imageBase64 = this.canvasToBase64(canvas);
        textData = await this.processWithWorker(imageBase64, width, height);
      } else {
        // Direct processing
        preprocessCanvasForOCR(canvas, this.preprocessOptions);
        const result = await this.tesseractWorker.recognize(canvas);
        textData = this.extractTextData(result, width, height);
      }

      const unique = dedupeTextData(textData);

      console.log('📝 OCR detected text with spatial data:', unique.length, 'items');
      console.log('📋 OCR Raw Data:', unique.map(item => ({
        text: item.text,
        centerX: Math.round(item.centerX),
        centerY: Math.round(item.centerY),
        bbox: item.bbox
      })));

      return unique;
    } catch (error) {
      console.error('OCR capture error:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a pre-captured canvas image (used when camera is stopped before processing)
   * @param {HTMLCanvasElement} canvas - Canvas with captured frame
   * @returns {Promise<Array>} Array of objects with text and spatial data
   */
  async captureAndProcessCanvas(canvas) {
    if (this.isProcessing) {
      console.warn('OCR processing already in progress');
      return [];
    }

    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!canvas) {
      throw new Error('No canvas provided for OCR processing');
    }

    this.isProcessing = true;

    try {
      const width = canvas.width;
      const height = canvas.height;

      if (width === 0 || height === 0) {
        throw new Error('Canvas dimensions not available');
      }

      let textData;

      const { preprocessCanvasForOCR, dedupeTextData } = this.helpers;

      if (this.useWebWorker && this.workerReady) {
        // Preprocess first, then convert to base64 for worker
        preprocessCanvasForOCR(canvas, this.preprocessOptions);
        const imageBase64 = this.canvasToBase64(canvas);
        textData = await this.processWithWorker(imageBase64, width, height);
      } else {
        // Direct processing
        preprocessCanvasForOCR(canvas, this.preprocessOptions);
        const result = await this.tesseractWorker.recognize(canvas);
        textData = this.extractTextData(result, width, height);
      }

      const unique = dedupeTextData(textData);

      console.log('📝 OCR detected text with spatial data:', unique.length, 'items');
      console.log('📋 OCR Raw Data:', unique.map(item => ({
        text: item.text,
        centerX: Math.round(item.centerX),
        centerY: Math.round(item.centerY),
        bbox: item.bbox
      })));

      return unique;
    } catch (error) {
      console.error('OCR canvas processing error:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Extract text data from Tesseract result
   * @param {Object} result - Tesseract recognition result
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {Array}
   */
  extractTextData(result, width, height) {
    const { cleanOcrText } = this.helpers;
    return result.data.lines
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
  }

  /**
   * Get current mode info
   * @returns {Object}
   */
  getModeInfo() {
    return {
      initialized: this.isInitialized,
      mode: this.useWebWorker ? 'webworker' : 'direct',
      workerReady: this.workerReady
    };
  }

  /**
   * Cleanup and terminate workers
   */
  async destroy() {
    this.stopScanning();

    // Terminate Web Worker
    if (this.ocrWorker) {
      try {
        this.ocrWorker.postMessage({ type: 'terminate', id: 'terminate' });
        this.ocrWorker.terminate();
      } catch (e) {}
      this.ocrWorker = null;
      this.workerReady = false;
    }

    // Terminate Tesseract worker
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
    }

    // Clean up canvas
    this.canvas = null;
    this.ctx = null;

    this.isInitialized = false;
    this.pendingRequests.clear();

    console.log('🧹 OCR service destroyed');
  }
}

// Export singleton instance
export const ocrService = new OCRService();
