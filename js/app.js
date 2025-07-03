import { NavigationManager } from './navigation.js';
import { showPdfFormScreen, ensurePdfSpinner, isSamsungDevice } from './pdf-generator.js';
import { StorageManager } from './storage.js';
import { FileImportManager } from './file-import.js';

// Main application class
class SeimaScanner {
  constructor() {
    this.navigationManager = null;
    this.fileImportManager = new FileImportManager();
  }

  async init() {
    try {
      // Initialize navigation manager
      this.navigationManager = new NavigationManager();
      await this.navigationManager.init();

      // Initialize file import manager
      this.fileImportManager.init();

      // Setup global event listeners
      this.setupGlobalEventListeners();

      // Make scanner controller globally available for compatibility
      window.scannerController = this.navigationManager.scannerController;
      // Make navigation manager globally available for file import
      window.navigationManager = this.navigationManager;

      // Log Samsung device detection for debugging
      if (isSamsungDevice()) {
        console.log('Samsung device detected - enhanced download compatibility enabled');
      }

      console.log('Seima Scanner initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Seima Scanner:', error);
    }
  }

  setupGlobalEventListeners() {
    // Listen for PDF generation requests
    window.addEventListener('generatePdf', (event) => {
      const userDetails = event.detail;
      ensurePdfSpinner();
      showPdfFormScreen(userDetails);
    });

    // Handle window unload to stop scanner
    window.addEventListener('beforeunload', () => {
      if (this.navigationManager?.scannerController) {
        this.navigationManager.scannerController.stopScanning();
      }
    });

    // Handle visibility change to manage scanner
    document.addEventListener('visibilitychange', () => {
      if (this.navigationManager?.scannerController) {
        if (document.hidden) {
          this.navigationManager.scannerController.stopScanning();
        } else if (this.navigationManager.currentScreen === 'scanner') {
          this.navigationManager.scannerController.startScanning();
        }
      }
    });
  }

  // Public API methods for backward compatibility
  getSelectedProducts() {
    return StorageManager.getSelectedProducts();
  }

  clearSelection() {
    return StorageManager.clearAllSelections();
  }

  addProduct(product, notes, room, quantity) {
    return StorageManager.addProductToSelection(product, notes, room, quantity);
  }

  updateSelectionCount() {
    if (this.navigationManager) {
      this.navigationManager.updateSelectionCount();
    }
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.seimaScanner = new SeimaScanner();
  window.seimaScanner.init();
});

// Export for module usage
export default SeimaScanner; 