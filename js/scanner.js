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
      // Check if BarcodeDetector is natively supported
      if (!('BarcodeDetector' in window)) {
        console.log('Using WebAssembly polyfill for iOS/Safari');
        
        // Wait for polyfill to be loaded (max 5 seconds)
        let attempts = 0;
        while (!window.polyfillReady && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        // Use the polyfill for browsers that don't support it (Safari/iOS)
        if (window.barcodeDetectorPolyfill && window.barcodeDetectorPolyfill.BarcodeDetectorPolyfill) {
          window.BarcodeDetector = window.barcodeDetectorPolyfill.BarcodeDetectorPolyfill;
          console.log('✅ Polyfill assigned to window.BarcodeDetector');
        } else {
          console.error('Polyfill not available after waiting. polyfillReady:', window.polyfillReady);
          console.error('Available barcode keys:', Object.keys(window).filter(k => k.toLowerCase().includes('barcode')));
          throw new Error('BarcodeDetector polyfill not loaded');
        }
      } else {
        console.log('Using native Barcode Detection API');
      }

      // Create detector instance for EAN-13
      this.barcodeDetector = new window.BarcodeDetector({
        formats: ['ean_13']
      });

      this.detectorReady = true;
      console.log('✅ Scanner initialized successfully');
    } catch (error) {
      console.error('Error initializing barcode detector:', error);
      this.detectorReady = false;
      throw error;
    }
  }

  setOnScanCallback(callback) {
    this.onScanCallback = callback;
  }

  async startScanning(mode = 'barcode') {
    // Allow restart if switching modes, but prevent duplicate starts in same mode
    if (this.isScanning && mode === 'barcode') {
      // Already scanning in barcode mode
      return;
    }

    const viewport = document.getElementById('scanner-viewport');
    if (!viewport) {
      console.error('Scanner viewport not found');
      return;
    }

    try {
      // Stop existing stream if switching modes
      if (this.isScanning && this.streamRef) {
        this.streamRef.getTracks().forEach(track => track.stop());
        this.streamRef = null;
        this.videoElement = null;
      }

      // Initialize scanner engine if not done (only needed for barcode mode)
      if (mode === 'barcode' && !this.detectorReady) {
        console.log('Initializing scanner...');
        await this.initialize();
      }

      if (mode === 'barcode' && !this.detectorReady) {
        console.error('Scanner not ready after initialization');
        this.showCameraError();
        return;
      }

      this.isScanning = true;
      this.scanningRef = (mode === 'barcode'); // Only scan barcodes in barcode mode
      this.lastScannedCode = null;
      
      await this.startDetectorScanning(mode);
    } catch (error) {
      console.error('Failed to start scanner:', error);
      console.error('Error details:', error.name, error.message);
      this.showCameraError();
      this.isScanning = false;
      this.scanningRef = false;
    }
  }

  async startDetectorScanning(mode = 'barcode') {
    const viewport = document.getElementById('scanner-viewport');
    
    // Create video element
    this.videoElement = document.createElement('video');
    this.videoElement.style.width = '100%';
    this.videoElement.style.height = '100%';
    this.videoElement.style.objectFit = 'cover';
    
    viewport.innerHTML = '';
    viewport.appendChild(this.videoElement);
    
    try {
      // Different camera settings for barcode vs text capture
      const videoConstraints = {
        facingMode: 'environment',
      };

      if (mode === 'text') {
        // Text capture mode: Higher resolution and better focus for OCR
        videoConstraints.width = { ideal: 1920, min: 1280 };
        videoConstraints.height = { ideal: 1080, min: 720 };
        videoConstraints.focusMode = 'continuous'; // Better for text reading
        videoConstraints.advanced = [
          { focusMode: 'continuous' },
          { exposureMode: 'continuous' }
        ];
      } else {
        // Barcode mode: Standard resolution (faster, better for close-up)
        videoConstraints.width = { ideal: 1280 };
        videoConstraints.height = { ideal: 720 };
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints
      });

      this.streamRef = stream;
      
      this.videoElement.srcObject = stream;
      this.videoElement.setAttribute('playsinline', 'true');
      await this.videoElement.play();

      if (mode === 'text') {
        // For text mode, don't start barcode scanning
        console.log('📷 Camera started in text capture mode (higher resolution)');
      } else {
        this.scanBarcodes();
      }
      
    } catch (err) {
      console.error("Error starting scanner:", err);
      // Fallback to standard settings if advanced settings fail
      if (mode === 'text') {
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              width: { ideal: 1920 },
              height: { ideal: 1080 }
            }
          });
          this.streamRef = fallbackStream;
          this.videoElement.srcObject = fallbackStream;
          await this.videoElement.play();
          console.log('📷 Camera started with fallback settings');
        } catch (fallbackErr) {
          this.showCameraError("Camera access denied or unavailable");
          this.isScanning = false;
        }
      } else {
        this.showCameraError("Camera access denied or unavailable");
        this.isScanning = false;
      }
    }
  }

  async scanBarcodes() {
    if (!this.scanningRef || !this.videoElement) {
      return;
    }

    // Check if video is ready (readyState 4 = HAVE_ENOUGH_DATA)
    if (this.videoElement.readyState < 2) {
      // Video not ready yet, try again after a short delay
      if (this.scanningRef) {
        setTimeout(() => this.scanBarcodes(), 200);
      }
      return;
    }

    try {
      const barcodes = await this.barcodeDetector.detect(this.videoElement);
      
      if (barcodes && barcodes.length > 0) {
        const barcode = barcodes[0];
        
        if (barcode.format === 'ean_13') {
          const code = barcode.rawValue;
          
          this.stopScanning();
          
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
          
          if (this.onScanCallback) {
            this.onScanCallback(code, null);
          }
          
          return;
        }
      }
      
      if (this.scanningRef) {
        setTimeout(() => this.scanBarcodes(), 100);
      }
      
    } catch (error) {
      console.error('Detection error:', error);
      if (this.scanningRef) {
        setTimeout(() => this.scanBarcodes(), 100);
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