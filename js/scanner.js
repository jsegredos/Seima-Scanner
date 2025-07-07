import { CONFIG } from './config.js';
import { dataLayer } from './modules.js';

// Optimized Scanner functionality for mobile performance
export class ScannerController {
  constructor() {
    this.isScanning = false;
    this.scannerEngine = 'quagga';
    this.onScanCallback = null;
    this.lastScannedCode = null;
    this.scanTimeout = null;
    this.scanDebounceTimeout = null;
    this.performanceMonitor = {
      startTime: null,
      frameCount: 0,
      fps: 0
    };
    this.performanceCheckInterval = null;
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

    const viewport = document.getElementById('scanner-viewport');
    if (!viewport) {
      return;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported');
      }
      
      // Request camera permission with mobile-optimized constraints
      await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" }
      });
      
      this.isScanning = true;
      this.lastScannedCode = null;
      this.performanceMonitor.startTime = Date.now();
      this.performanceMonitor.frameCount = 0;
      
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
      // Suppress Quagga stop errors
    }
    
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = null;
    }

    if (this.scanDebounceTimeout) {
      clearTimeout(this.scanDebounceTimeout);
      this.scanDebounceTimeout = null;
    }

    if (this.performanceCheckInterval) {
      clearInterval(this.performanceCheckInterval);
      this.performanceCheckInterval = null;
    }
  }

  initializeQuagga() {
    const viewport = document.getElementById('scanner-viewport');
    if (!viewport) {
      return;
    }

    // Mobile detection and optimized constraints
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isLowEndDevice = this.detectLowEndDevice();
    
    let constraints;
    let frequency;
    let numWorkers;
    
    if (isMobile) {
      if (isLowEndDevice) {
        // Ultra-conservative settings for low-end devices
        constraints = {
          width: { min: 320, ideal: 320, max: 480 },
          height: { min: 240, ideal: 240, max: 360 },
          facingMode: "environment"
        };
        frequency = 2; // Only 2 scans per second
        numWorkers = 1; // Single worker thread
      } else {
        // Standard mobile settings
        constraints = {
          width: { min: 320, ideal: 480, max: 640 },
          height: { min: 240, ideal: 360, max: 480 },
          facingMode: "environment"
        };
        frequency = 3; // 3 scans per second
        numWorkers = 1; // Single worker for mobile
      }
    } else {
      // Desktop settings
      constraints = {
        width: { min: 640, ideal: 800, max: 1280 },
        height: { min: 480, ideal: 600, max: 720 },
        facingMode: "environment"
      };
      frequency = 5;
      numWorkers = Math.min(navigator.hardwareConcurrency || 2, 2);
    }

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
      numOfWorkers: numWorkers,
      frequency: frequency,
      decoder: {
        readers: ["ean_reader", "ean_8_reader"] // Add EAN-8 support
      },
      locate: false, // Disable localization for performance
      debug: false // Ensure debug is off
    }, (err) => {
      if (err) {
        console.error('Quagga initialization error:', err);
        this.showCameraError();
        return;
      }
      
      // Start performance monitoring
      this.startPerformanceMonitoring();
    });

    // Handle successful scans with debouncing
    window.Quagga.onDetected((result) => {
      this.handleScanResultDebounced(result);
    });

    // Monitor processing performance
    window.Quagga.onProcessed((result) => {
      this.updatePerformanceMetrics();
    });
  }

  detectLowEndDevice() {
    // Simple heuristics to detect low-end devices
    const memory = navigator.deviceMemory || 4; // Default to 4GB if unknown
    const cores = navigator.hardwareConcurrency || 4;
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Consider it low-end if:
    // - Less than 3GB RAM
    // - Less than 4 CPU cores
    // - Older Android versions
    return memory < 3 || 
           cores < 4 || 
           userAgent.includes('android 6') ||
           userAgent.includes('android 7') ||
           userAgent.includes('android 8');
  }

  handleScanResultDebounced(result) {
    const code = result.codeResult.code;
    
    // Prevent duplicate scans within 1 second
    if (this.lastScannedCode === code) {
      return;
    }
    
    // Clear any existing debounce timeout
    if (this.scanDebounceTimeout) {
      clearTimeout(this.scanDebounceTimeout);
    }
    
    // Debounce the scan result
    this.scanDebounceTimeout = setTimeout(() => {
      this.handleScanResult(result);
    }, 100); // 100ms debounce
  }

  handleScanResult(result) {
    const code = result.codeResult.code;
    
    // Validate barcode format (basic check)
    if (!this.isValidBarcode(code)) {
      return;
    }
    
    this.lastScannedCode = code;
    this.stopScanning();
    this.provideHapticFeedback();
    
    if (this.onScanCallback) {
      this.onScanCallback(code, null);
    }
  }

  isValidBarcode(code) {
    // Basic validation for EAN-13 and EAN-8
    return /^\d{8}$|^\d{12,13}$/.test(code);
  }

  startPerformanceMonitoring() {
    this.performanceMonitor.startTime = Date.now();
    this.performanceMonitor.frameCount = 0;
    
    // Check performance every 5 seconds
    this.performanceCheckInterval = setInterval(() => {
      this.checkPerformance();
    }, 5000);
  }

  updatePerformanceMetrics() {
    this.performanceMonitor.frameCount++;
    
    const elapsed = (Date.now() - this.performanceMonitor.startTime) / 1000;
    if (elapsed > 0) {
      this.performanceMonitor.fps = this.performanceMonitor.frameCount / elapsed;
    }
  }

  checkPerformance() {
    const fps = this.performanceMonitor.fps;
    
    // If FPS is too low, reduce scanning frequency
    if (fps < 1 && this.isScanning) {
      console.warn('Low scanner performance detected, reducing frequency');
      this.adjustForLowPerformance();
    }
  }

  adjustForLowPerformance() {
    // Restart scanner with ultra-conservative settings
    this.stopScanning();
    
    setTimeout(() => {
      // Override constraints for emergency performance mode
      const viewport = document.getElementById('scanner-viewport');
      if (viewport && !this.isScanning) {
        window.Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: "#scanner-viewport",
            constraints: {
              width: { min: 320, ideal: 320, max: 320 },
              height: { min: 240, ideal: 240, max: 240 },
              facingMode: "environment"
            },
          },
          locator: {
            patchSize: "small",
            halfSample: true
          },
          numOfWorkers: 1,
          frequency: 1, // Very conservative
          decoder: {
            readers: ["ean_reader"]
          },
          locate: false,
          debug: false
        }, (err) => {
          if (!err) {
            this.isScanning = true;
            window.Quagga.onDetected((result) => {
              this.handleScanResultDebounced(result);
            });
          }
        });
      }
    }, 1000);
  }

  provideHapticFeedback() {
    if (navigator.vibrate) {
      navigator.vibrate(50); // Shorter vibration for better performance
    }
  }

  playScanSound() {
    // Only play sound if AudioContext is available and performant
    if (this.performanceMonitor.fps > 2) {
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (error) {
        // Ignore audio errors
      }
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
      this.handleScanResult({ codeResult: { code } });
    }
  }

  // Cleanup method
  destroy() {
    this.stopScanning();
    
    if (this.performanceCheckInterval) {
      clearInterval(this.performanceCheckInterval);
    }
  }
} 