/**
 * OCR Service for Seima Scanner
 * Provides client-side text recognition using Tesseract.js
 * Used for Text Scan mode to read product labels and OrderCodes
 */

export class OCRService {
  constructor() {
    this.worker = null;
    this.isInitialized = false;
    this.isScanning = false;
    this.scanInterval = null;
  }

  /**
   * Initialize Tesseract.js worker
   */
  async initialize() {
    if (this.isInitialized && this.worker) {
      return this.worker;
    }

    try {
      console.log('🔍 Initializing OCR worker...');

      if (typeof Tesseract === 'undefined') {
        throw new Error('Tesseract.js not loaded. Please ensure the script is included.');
      }

      // Tesseract.js v5 - workers come pre-initialized with language
      // No need for loadLanguage() or initialize() - they're deprecated
      this.worker = await Tesseract.createWorker('eng');

      // Optimised for product labels
      await this.worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -.,()',
        preserve_interword_spaces: '1',
      });

      this.isInitialized = true;
      console.log('✅ OCR worker initialized successfully');
      return this.worker;
    } catch (error) {
      console.error('❌ Failed to initialize OCR worker:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  /**
   * Start OCR scanning on video element
   * @param {HTMLVideoElement} videoElement - Video element to capture frames from
   * @param {Function} onResults - Callback function(results: string[])
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
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    this.scanInterval = setInterval(async () => {
      if (!this.isScanning || videoElement.paused || videoElement.ended) {
        return;
      }

      // Check if video is ready before capturing frame
      if (videoElement.readyState < 2) {
        return; // Skip this scan cycle if video not ready
      }

      try {
        // Capture frame from video
        const width = videoElement.videoWidth || 640;
        const height = videoElement.videoHeight || 480;
        
        if (width === 0 || height === 0) {
          return; // Video dimensions not available yet
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(videoElement, 0, 0, width, height);

        // Optional: Preprocess for better results in poor lighting
        // this.preprocessCanvasForOCR(canvas);

        // Perform OCR
        const result = await this.worker.recognize(canvas);
        
        // Extract text lines
        const lines = result.data.lines
          .map(line => line.text.trim())
          .filter(text => text.length > 3); // Filter out very short text

        // Deduplicate
        const detectedTexts = [...new Set(lines)];

        if (detectedTexts.length > 0) {
          console.log('📝 OCR detected text:', detectedTexts);
          onResults(detectedTexts);
        }
      } catch (error) {
        // Ignore "Image too small" and "Line cannot be recognized" errors - these are normal
        if (!error.message || (!error.message.includes('too small') && !error.message.includes('cannot be recognized'))) {
          console.warn('OCR recognition error:', error);
        }
      } catch (error) {
        console.warn('OCR recognition error:', error);
        // Continue scanning on error
      }
    }, interval);

    console.log('✅ OCR scanning started');
  }

  /**
   * Stop OCR scanning
   */
  stopScanning() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
      this.scanInterval = null;
    }
    this.isScanning = false;
    console.log('🛑 OCR scanning stopped');
  }

  /**
   * Optional: Preprocess canvas for better OCR results in poor lighting
   * @param {HTMLCanvasElement} canvas - Canvas to preprocess
   */
  preprocessCanvasForOCR(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      // Boost contrast for better recognition
      const boosted = avg < 100 ? avg * 0.8 : avg + (255 - avg) * 0.5;
      data[i] = data[i + 1] = data[i + 2] = boosted;
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Cleanup and terminate worker
   */
  async destroy() {
    this.stopScanning();
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
      this.isInitialized = false;
      console.log('🧹 OCR worker terminated');
    }
  }
}

// Export singleton instance
export const ocrService = new OCRService();

