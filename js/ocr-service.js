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
    this.isProcessing = false; // Flag to prevent multiple simultaneous callbacks
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

      // Optimised for product labels and OrderCodes
      await this.worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -.,()',
        preserve_interword_spaces: '0', // Don't preserve spaces - we'll clean them
        tessedit_pageseg_mode: '6', // Assume uniform block of text
        // Note: tessedit_ocr_engine_mode can only be set during initialization in Tesseract v5
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
      // Stop if not scanning, processing, or video not ready
      if (!this.isScanning || this.isProcessing || videoElement.paused || videoElement.ended) {
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

        // Preprocess for better OCR results
        this.preprocessCanvasForOCR(canvas);

        // Perform OCR
        const result = await this.worker.recognize(canvas);
        
        // Extract text lines with spatial data
        const textData = result.data.lines
          .map(line => {
            const cleanedText = this.cleanOcrText(line.text);
            // Filter out empty or very short text (unless it's an OrderCode)
            if (!cleanedText || (cleanedText.length < 3 && !/^19\d{4}$/.test(cleanedText))) {
              return null;
            }
            
            // Extract bounding box
            const bbox = line.bbox || { x0: 0, y0: 0, x1: width, y1: height };
            const centerX = (bbox.x0 + bbox.x1) / 2;
            const centerY = (bbox.y0 + bbox.y1) / 2;
            
            return {
              text: cleanedText,
              bbox: bbox,
              centerX: centerX,
              centerY: centerY,
              width: width,
              height: height
            };
          })
          .filter(item => item !== null && item.text && item.text.length > 0);

        // Deduplicate by text (keep first occurrence)
        const seen = new Set();
        const unique = [];
        for (const item of textData) {
          if (!seen.has(item.text)) {
            seen.add(item.text);
            unique.push(item);
          }
        }

        if (unique.length > 0 && !this.isProcessing) {
          // Stop scanning immediately before calling callback
          this.isProcessing = true;
          this.isScanning = false; // Prevent further scans
          
          console.log('📝 OCR detected text with spatial data:', unique.length, 'items');
          
          // Clear interval before callback to prevent race conditions
          if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
          }
          
          // Call callback (which should stop scanning, but we already did)
          onResults(unique);
        }
      } catch (error) {
        // Ignore "Image too small" and "Line cannot be recognized" errors - these are normal
        if (!error.message || (!error.message.includes('too small') && !error.message.includes('cannot be recognized'))) {
          console.warn('OCR recognition error:', error);
        }
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
    this.isProcessing = false; // Reset processing flag
    console.log('🛑 OCR scanning stopped');
  }

  /**
   * Capture and process a single image from video element
   * @param {HTMLVideoElement} videoElement - Video element to capture frame from
   * @returns {Promise<Array>} Array of objects with text and spatial data {text, bbox, centerX, centerY}
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

    // Check if video is ready
    if (videoElement.readyState < 2) {
      throw new Error('Video not ready - please wait a moment');
    }

    this.isProcessing = true;

    try {
      // Capture frame from video
      const width = videoElement.videoWidth || 640;
      const height = videoElement.videoHeight || 480;
      
      if (width === 0 || height === 0) {
        throw new Error('Video dimensions not available');
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      ctx.drawImage(videoElement, 0, 0, width, height);

      // Preprocess for better OCR results
      this.preprocessCanvasForOCR(canvas);

      // Perform OCR
      const result = await this.worker.recognize(canvas);
      
      // Extract text lines with spatial data
      const textData = result.data.lines
        .map(line => {
          const cleanedText = this.cleanOcrText(line.text);
          // Filter out empty or very short text (unless it's an OrderCode)
          if (!cleanedText || (cleanedText.length < 3 && !/^19\d{4}$/.test(cleanedText))) {
            return null;
          }
          
          // Extract bounding box (Tesseract provides bbox: {x0, y0, x1, y1})
          const bbox = line.bbox || { x0: 0, y0: 0, x1: width, y1: height };
          const centerX = (bbox.x0 + bbox.x1) / 2;
          const centerY = (bbox.y0 + bbox.y1) / 2;
          
          return {
            text: cleanedText,
            bbox: bbox,
            centerX: centerX,
            centerY: centerY,
            width: width,
            height: height
          };
        })
        .filter(item => item !== null && item.text && item.text.length > 0);

      // Deduplicate by text (keep first occurrence with its spatial data)
      const seen = new Set();
      const unique = [];
      for (const item of textData) {
        if (!seen.has(item.text)) {
          seen.add(item.text);
          unique.push(item);
        }
      }

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
   * Clean OCR text: remove excessive whitespace, normalize, extract useful patterns
   * @param {string} text - Raw OCR text
   * @returns {string} Cleaned text
   */
  cleanOcrText(text) {
    if (!text) return '';
    
    // Remove excessive whitespace (multiple spaces/tabs/newlines)
    let cleaned = text.replace(/\s+/g, ' ').trim();
    
    // Extract OrderCode pattern (19 followed by 4 digits, even with spaces)
    const orderCodeMatch = cleaned.match(/19\s*\d\s*\d\s*\d\s*\d/);
    if (orderCodeMatch) {
      // Normalize to 19xxxx format
      const code = orderCodeMatch[0].replace(/\s/g, '');
      if (code.length === 6) {
        return code; // Return clean OrderCode
      }
    }
    
    // Filter out garbage OCR text:
    // - Very short text (less than 3 chars) unless it's a number
    if (cleaned.length < 3 && !/^\d+$/.test(cleaned)) {
      return '';
    }
    
    // - Text with too many special characters or punctuation
    const specialCharRatio = (cleaned.match(/[^\w\s]/g) || []).length / cleaned.length;
    if (specialCharRatio > 0.3) {
      return '';
    }
    
    // - Text that's mostly single characters separated by spaces (OCR fragments)
    const words = cleaned.split(/\s+/);
    const singleCharWords = words.filter(w => w.length === 1).length;
    if (words.length > 2 && singleCharWords / words.length > 0.5) {
      return '';
    }
    
    // - Text with too many dashes or hyphens (likely OCR errors)
    if ((cleaned.match(/-/g) || []).length > 2) {
      return '';
    }
    
    // Remove single character words and excessive punctuation
    cleaned = cleaned.replace(/\b\w\b/g, '').replace(/[^\w\s]/g, '');
    
    // Normalize whitespace again
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Final check - if cleaned text is too short or looks like garbage, return empty
    if (cleaned.length < 3) {
      return '';
    }
    
    return cleaned;
  }

  /**
   * Preprocess canvas for better OCR results
   * Improves contrast and sharpness for text recognition
   * @param {HTMLCanvasElement} canvas - Canvas to preprocess
   */
  preprocessCanvasForOCR(canvas) {
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply contrast enhancement and grayscale conversion
    for (let i = 0; i < data.length; i += 4) {
      // Convert to grayscale
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      
      // Enhance contrast (make dark text darker, light background lighter)
      const contrast = 1.5; // Contrast factor
      const enhanced = Math.max(0, Math.min(255, ((gray - 128) * contrast) + 128));
      
      // Apply threshold for better text clarity
      const threshold = enhanced > 128 ? 255 : 0;
      
      data[i] = data[i + 1] = data[i + 2] = threshold;
      // Keep alpha channel
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

