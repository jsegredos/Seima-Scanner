import { CONFIG } from './config.js';
import { dataLayer } from './modules.js';

// Scanner functionality
export class ScannerController {
  constructor() {
    this.isScanning = false;
    this.scannerEngine = 'quagga'; // Use Quagga as default like the original
    this.onScanCallback = null;
    this.lastScannedCode = null;
    this.scanTimeout = null;
  }

  setOnScanCallback(callback) {
    this.onScanCallback = callback;
  }

  setScannerEngine(engine) {
    if (CONFIG.SCANNER.ENGINES.includes(engine)) {
      this.scannerEngine = engine;
    }
  }

  async startScanning() {
    if (this.isScanning) return;

    // Check if the scanner viewport element exists
    const viewport = document.getElementById('scanner-viewport');
    if (!viewport) {
      console.error('Scanner viewport element not found');
      return;
    }

    try {
      // Check for camera support first like the original
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported');
      }
      
      // Request camera permission
      await navigator.mediaDevices.getUserMedia({ video: true });
      
      this.isScanning = true;
      this.lastScannedCode = null;
      
      // Use Quagga by default like the original
      this.initializeQuagga();
    } catch (error) {
      console.error('Failed to start scanner:', error);
      this.showCameraError();
      this.isScanning = false;
    }
  }

  stopScanning() {
    if (!this.isScanning) return;
    
    this.isScanning = false;
    
    try {
      if (window.Quagga) {
        window.Quagga.stop();
      }
    } catch (e) {
      // Suppress Quagga stop errors (e.g., if not initialized)
    }
    
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }
  }



  initializeQuagga() {
    // Device detection for mobile like the original
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    let constraints;
    
    if (isMobile) {
      constraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "environment"
      };
    } else {
      constraints = {
        width: { min: 640, ideal: 1920 },
        height: { min: 480, ideal: 1080 },
        facingMode: "environment",
        aspectRatio: { ideal: 1.7777777778 }
      };
    }

    window.Quagga.init({
      inputStream: {
        name: "Live",
        type: "LiveStream",
        target: "#scanner-viewport",
        constraints: constraints,
      },
      locator: {
        patchSize: "medium",
        halfSample: false
      },
      numOfWorkers: navigator.hardwareConcurrency || 4,
      frequency: 10,
      decoder: {
        readers: ["ean_reader"]
      },
      locate: true
    }, (err) => {
      if (err) {
        this.showCameraError();
        return;
      }
    });

    // Handle successful scans
    window.Quagga.onDetected((result) => {
      this.handleScanResult(result);
    });
  }

  handleScanResult(result) {
    const code = result.codeResult.code;
    
    this.stopScanning();
    this.provideHapticFeedback();
    
    // Find product by barcode and call callback
    if (this.onScanCallback) {
      this.onScanCallback(code, null); // Let the callback handle product lookup
    }
  }

  provideHapticFeedback() {
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  }

  playScanSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // Ignore audio errors
    }
  }

  showCameraError() {
    const viewport = document.getElementById('scanner-viewport');
    if (viewport) {
      viewport.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: white; text-align: center; padding: 20px;">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📷</div>
          <h3>Camera Access Required</h3>
          <p>Please allow camera access to scan barcodes, or use the manual entry below.</p>
          <button onclick="window.scannerController.startScanning()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #1e40af; color: white; border: none; border-radius: 8px; cursor: pointer;">Try Again</button>
        </div>
      `;
    }
  }

  setManualBarcode(code) {
    if (code) {
      this.handleScanResult(code);
    }
  }


} 