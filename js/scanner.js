import { CONFIG } from './config.js';
import { DataService } from './data-service.js';

export class HybridScannerController {
  constructor() {
    this.isScanning = false;
    this.scannerEngine = 'auto'; // Will auto-detect best available
    this.onScanCallback = null;
    this.lastScannedCode = null;
    this.scanTimeout = null;
    this.videoElement = null;
    this.barcodeDetector = null;
    this.animationFrame = null;
    this.canvas = null;
    this.context = null;
  }

  async initialize() {
    // Check for native BarcodeDetector support
    if ('BarcodeDetector' in window) {
      try {
        // Check if EAN format is supported
        const supportedFormats = await BarcodeDetector.getSupportedFormats();
        if (supportedFormats.includes('ean_13') || supportedFormats.includes('ean_8')) {
          this.scannerEngine = 'native';
          this.barcodeDetector = new BarcodeDetector({
            formats: supportedFormats.filter(format => 
              ['ean_13', 'ean_8', 'upc_a', 'upc_e'].includes(format)
            )
          });
          console.log('✅ Native BarcodeDetector available');
          return;
        }
      } catch (error) {
        console.warn('BarcodeDetector initialization failed:', error);
      }
    }
    
    // Fallback to Quagga
    this.scannerEngine = 'quagga';
    console.log('📱 Falling back to Quagga.js');
  }

  setOnScanCallback(callback) {
    this.onScanCallback = callback;
  }

  async startScanning() {
    if (this.isScanning) return;

    const viewport = document.getElementById('scanner-viewport');
    if (!viewport) return;

    // Initialize scanner engine if not done
    if (this.scannerEngine === 'auto') {
      await this.initialize();
    }

    try {
      this.isScanning = true;
      this.lastScannedCode = null;
      
      if (this.scannerEngine === 'native') {
        await this.startNativeScanning();
      } else {
        await this.startQuaggaScanning();
      }
    } catch (error) {
      console.error('Failed to start scanner:', error);
      this.showCameraError();
      this.isScanning = false;
    }
  }

  async startNativeScanning() {
    const viewport = document.getElementById('scanner-viewport');
    
    // Create video element
    this.videoElement = document.createElement('video');
    this.videoElement.style.width = '100%';
    this.videoElement.style.height = '100%';
    this.videoElement.style.objectFit = 'cover';
    this.videoElement.autoplay = true;
    this.videoElement.muted = true;
    this.videoElement.playsInline = true;
    
    // Create canvas for capturing frames
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    
    viewport.innerHTML = '';
    viewport.appendChild(this.videoElement);
    
    // Get camera stream with mobile-optimized constraints
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    });
    
    this.videoElement.srcObject = stream;
    
    // Wait for video to be ready
    await new Promise(resolve => {
      this.videoElement.onloadedmetadata = () => {
        this.canvas.width = this.videoElement.videoWidth;
        this.canvas.height = this.videoElement.videoHeight;
        resolve();
      };
    });
    
    // Start scanning loop
    this.scanLoop();
  }

  scanLoop() {
    if (!this.isScanning) return;
    
    // Capture frame from video
    this.context.drawImage(this.videoElement, 0, 0);
    
    // Detect barcodes
    this.barcodeDetector.detect(this.canvas)
      .then(barcodes => {
        if (barcodes.length > 0) {
          const barcode = barcodes[0];
          this.handleNativeScanResult(barcode);
        }
      })
      .catch(error => {
        console.warn('Barcode detection error:', error);
      });
    
    // Schedule next scan (native API is very fast, so we can scan more frequently)
    this.animationFrame = requestAnimationFrame(() => this.scanLoop());
  }

  handleNativeScanResult(barcode) {
    const code = barcode.rawValue;
    
    // Prevent duplicate scans
    if (this.lastScannedCode === code) {
      return;
    }
    
    if (this.isValidBarcode(code)) {
      this.lastScannedCode = code;
      this.stopScanning();
      this.provideHapticFeedback();
      
      if (this.onScanCallback) {
        this.onScanCallback(code, null);
      }
    }
  }

  async startQuaggaScanning() {
    const viewport = document.getElementById('scanner-viewport');
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isLowEndDevice = this.detectLowEndDevice();
    
    let constraints;
    let frequency;
    
    if (isMobile) {
      if (isLowEndDevice) {
        constraints = {
          width: { min: 320, ideal: 320, max: 480 },
          height: { min: 240, ideal: 240, max: 360 },
          facingMode: "environment"
        };
        frequency = 2;
      } else {
        constraints = {
          width: { min: 320, ideal: 480, max: 640 },
          height: { min: 240, ideal: 360, max: 480 },
          facingMode: "environment"
        };
        frequency = 3;
      }
    } else {
      constraints = {
        width: { min: 640, ideal: 800, max: 1280 },
        height: { min: 480, ideal: 600, max: 720 },
        facingMode: "environment"
      };
      frequency = 5;
    }

    return new Promise((resolve, reject) => {
      window.Quagga.init({
        inputStream: {
          name: "Live",
          type: "LiveStream",
          target: "#scanner-viewport",
          constraints: constraints,
        },
        locator: {
          patchSize: isLowEndDevice ? "small" : "medium",
          halfSample: true
        },
        numOfWorkers: isMobile ? 1 : Math.min(navigator.hardwareConcurrency || 2, 2),
        frequency: frequency,
        decoder: {
          readers: ["ean_reader", "ean_8_reader"]
        },
        locate: false,
        debug: false
      }, (err) => {
        if (err) {
          console.error('Quagga initialization error:', err);
          reject(err);
          return;
        }
        
        window.Quagga.onDetected((result) => {
          this.handleQuaggaScanResult(result);
        });
        
        resolve();
      });
    });
  }

  handleQuaggaScanResult(result) {
    const code = result.codeResult.code;
    
    if (this.lastScannedCode === code) {
      return;
    }
    
    if (this.isValidBarcode(code)) {
      this.lastScannedCode = code;
      this.stopScanning();
      this.provideHapticFeedback();
      
      if (this.onScanCallback) {
        this.onScanCallback(code, null);
      }
    }
  }

  stopScanning() {
    if (!this.isScanning) return;
    
    this.isScanning = false;
    
    // Clean up native scanner
    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      this.videoElement.srcObject = null;
    }
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    // Clean up Quagga
    try {
      if (window.Quagga) {
        window.Quagga.stop();
      }
    } catch (e) {
      // Suppress errors
    }
    
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
  }

  detectLowEndDevice() {
    const memory = navigator.deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;
    const userAgent = navigator.userAgent.toLowerCase();
    
    return memory < 3 || 
           cores < 4 || 
           userAgent.includes('android 6') ||
           userAgent.includes('android 7') ||
           userAgent.includes('android 8') ||
           userAgent.includes('iphone 6') ||
           userAgent.includes('iphone 7') ||
           userAgent.includes('iphone 8');
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
      const engineText = this.scannerEngine === 'native' ? 'native browser' : 'Quagga.js';
      viewport.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: white; text-align: center; padding: 20px;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📷</div>
          <h3>Camera Access Required</h3>
          <p>Please allow camera access to scan barcodes using ${engineText}, or use manual entry below.</p>
          <button onclick="window.scannerController.startScanning()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #1e40af; color: white; border: none; border-radius: 8px; cursor: pointer;">Try Again</button>
        </div>
      `;
    }
  }

  setManualBarcode(code) {
    if (code) {
      if (this.scannerEngine === 'native') {
        this.handleNativeScanResult({ rawValue: code });
      } else {
        this.handleQuaggaScanResult({ codeResult: { code } });
      }
    }
  }

  // Get current scanner engine info
  getScannerInfo() {
    return {
      engine: this.scannerEngine,
      isNative: this.scannerEngine === 'native',
      hasNativeSupport: 'BarcodeDetector' in window
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