import { CONFIG } from './config.js';
import { DataService } from './data-service.js';

export class HybridScannerController {
  constructor() {
    this.isScanning = false;
    this.scannerEngine = 'detector'; // Will use BarcodeDetector (native or polyfill)
    this.onScanCallback = null;
    this.lastScannedCode = null;
    this.scanTimeout = null;
    this.videoElement = null;
    this.barcodeDetector = null;
    this.streamRef = null;
    this.scanningRef = false;
    this.detectorReady = false;
  }

  async initialize() {
    try {
      // Wait for polyfill to load if needed
      await this.waitForPolyfill();
      
      // Check if BarcodeDetector is natively supported
      if (!('BarcodeDetector' in window)) {
        console.log('📱 Using WebAssembly polyfill for iOS/Safari');
        // Use the polyfill for browsers that don't support it (Safari/iOS)
        if (window.barcodeDetectorPolyfill) {
          window.BarcodeDetector = window.barcodeDetectorPolyfill.BarcodeDetectorPolyfill;
        } else {
          throw new Error('Polyfill not loaded - please refresh the page');
        }
      } else {
        console.log('✅ Using native Barcode Detection API');
      }

      // Create detector instance for EAN formats
      this.barcodeDetector = new window.BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e']
      });

      this.detectorReady = true;
      this.scannerEngine = 'detector';
      console.log('✅ BarcodeDetector initialized successfully');
    } catch (error) {
      console.error('Error initializing barcode detector:', error);
      this.detectorReady = false;
      throw error;
    }
  }

  async waitForPolyfill(maxWaitTime = 5000) {
    // If native support exists, no need to wait
    if ('BarcodeDetector' in window) {
      return true;
    }

    // Wait for polyfill to load
    const startTime = Date.now();
    while (!window.barcodeDetectorPolyfill && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (!window.barcodeDetectorPolyfill) {
      console.warn('Polyfill did not load within timeout period');
      return false;
    }

    return true;
  }

  setOnScanCallback(callback) {
    this.onScanCallback = callback;
  }

  async startScanning() {
    if (this.isScanning) return;

    const viewport = document.getElementById('scanner-viewport');
    if (!viewport) return;

    // Initialize scanner engine if not done
    if (!this.detectorReady) {
      await this.initialize();
    }

    if (!this.detectorReady) {
      this.showCameraError();
      return;
    }

    try {
      this.isScanning = true;
      this.scanningRef = true;
      this.lastScannedCode = null;
      
      await this.startDetectorScanning();
    } catch (error) {
      console.error('Failed to start scanner:', error);
      this.showCameraError();
      this.isScanning = false;
      this.scanningRef = false;
    }
  }

  async startDetectorScanning() {
    const viewport = document.getElementById('scanner-viewport');
    
    // Create video element
    this.videoElement = document.createElement('video');
    this.videoElement.style.width = '100%';
    this.videoElement.style.height = '100%';
    this.videoElement.style.objectFit = 'cover';
    this.videoElement.autoplay = true;
    this.videoElement.muted = true;
    this.videoElement.playsInline = true;
    this.videoElement.setAttribute('playsinline', 'true');
    
    viewport.innerHTML = '';
    viewport.appendChild(this.videoElement);
    
    // Request camera access with optimized constraints
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    });

    this.streamRef = stream;
    this.videoElement.srcObject = stream;
    
    // Wait for video to be ready
    await this.videoElement.play();
    
    // Start scanning loop
    this.scanBarcodes();
  }

  async scanBarcodes() {
    if (!this.scanningRef || !this.videoElement) {
      return;
    }

    try {
      const barcodes = await this.barcodeDetector.detect(this.videoElement);
      
      if (barcodes && barcodes.length > 0) {
        const barcode = barcodes[0];
        
        // Process detected barcode
        if (barcode.format === 'ean_13' || barcode.format === 'ean_8' || 
            barcode.format === 'upc_a' || barcode.format === 'upc_e') {
          const code = barcode.rawValue;
          
          // Prevent duplicate scans
          if (this.lastScannedCode !== code && this.isValidBarcode(code)) {
            this.lastScannedCode = code;
            
            // Stop scanning immediately
            this.stopScanning();
            
            // Provide feedback
            this.provideHapticFeedback();
            
            // Trigger callback
            if (this.onScanCallback) {
              this.onScanCallback(code, null);
            }
            
            return; // Exit after successful scan
          }
        }
      }
      
      // Continue scanning if still active
      if (this.scanningRef) {
        // Scan every 100ms
        this.scanTimeout = setTimeout(() => this.scanBarcodes(), 100);
      }
      
    } catch (error) {
      console.error('Detection error:', error);
      // Continue scanning despite errors
      if (this.scanningRef) {
        this.scanTimeout = setTimeout(() => this.scanBarcodes(), 100);
      }
    }
  }


  stopScanning() {
    if (!this.isScanning) return;
    
    this.isScanning = false;
    this.scanningRef = false;
    
    // Stop video stream
    if (this.streamRef) {
      this.streamRef.getTracks().forEach(track => track.stop());
      this.streamRef = null;
    }
    
    // Clean up video element
    if (this.videoElement) {
      if (this.videoElement.srcObject) {
        this.videoElement.srcObject = null;
      }
      this.videoElement = null;
    }
    
    // Clear scanning timeout
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
  }

  isValidBarcode(code) {
    return /^\d{8}$|^\d{12,13}$/.test(code);
  }

  provideHapticFeedback() {
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
  }

  showCameraError() {
    const viewport = document.getElementById('scanner-viewport');
    if (viewport) {
      viewport.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: white; text-align: center; padding: 20px;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📷</div>
          <h3>Camera Access Required</h3>
          <p>Please allow camera access to scan barcodes, or use manual entry below.</p>
          <button onclick="window.scannerController.startScanning()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #1e40af; color: white; border: none; border-radius: 8px; cursor: pointer;">Try Again</button>
        </div>
      `;
    }
  }

  setManualBarcode(code) {
    if (code && this.isValidBarcode(code)) {
      this.lastScannedCode = code;
      this.stopScanning();
      this.provideHapticFeedback();
      
      if (this.onScanCallback) {
        this.onScanCallback(code, null);
      }
    }
  }

  // Legacy compatibility - no longer needed but kept for backward compatibility
  setScannerEngine(engine) {
    // No-op: we always use BarcodeDetector now (native or polyfill)
    console.log('setScannerEngine is deprecated - using BarcodeDetector automatically');
  }

  // Get current scanner engine info
  getScannerInfo() {
    return {
      engine: this.scannerEngine,
      isNative: 'BarcodeDetector' in window && !window.barcodeDetectorPolyfill,
      hasNativeSupport: 'BarcodeDetector' in window,
      detectorReady: this.detectorReady
    };
  }

  // Legacy compatibility methods
  playScanSound() {
    // Sound is less important for performance, keeping simple
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Ignore audio errors
    }
  }

  // Cleanup method
  destroy() {
    this.stopScanning();
  }
}

// Export with legacy class name for compatibility
export { HybridScannerController as ScannerController }; 