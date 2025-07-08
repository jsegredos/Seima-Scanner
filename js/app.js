import { NavigationManager } from './navigation.js';
import { moduleCoordinator, emailService, pdfGenerator, CONFIG } from './modules.js';
import { showPdfFormScreen, ensurePdfSpinner, downloadWithFallback } from './pdf-generator.js';
import { StorageManager } from './storage.js';
import { FileImportManager } from './file-import.js';
import { browserCompatibility, isSamsungDevice } from './browser-compatibility.js';

// Main application class
class SeimaScanner {
  constructor() {
    this.navigationManager = null;
    this.fileImportManager = new FileImportManager();
  }

  async init() {
    try {
      // Initialize browser compatibility monitoring
      console.log('Browser Compatibility Report:', browserCompatibility.getCompatibilityReport());
      
      // Show compatibility warning if needed
      if (browserCompatibility.shouldShowCompatibilityWarning()) {
        this.showCompatibilityWarning();
      }

      // Initialize email service
      await this.initializeEmailService();

      // Initialize navigation manager
      this.navigationManager = new NavigationManager();
      await this.navigationManager.init();

      // Initialize file import manager
      this.fileImportManager.init();

      // Setup global event listeners
      this.setupGlobalEventListeners();

      // Make services globally available for compatibility
      window.scannerController = this.navigationManager.scannerController;
      window.navigationManager = this.navigationManager;
      window.browserCompatibility = browserCompatibility;
      window.emailService = emailService;
      window.downloadWithFallback = downloadWithFallback;

      // Log Samsung device detection for debugging
      if (isSamsungDevice()) {
        console.log('Samsung device detected - enhanced download compatibility enabled');
      }

      console.log('Seima Scanner initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Seima Scanner:', error);
    }
  }

  async initializeEmailService() {
    try {
      const emailConfig = {
        publicKey: CONFIG.EMAIL.PUBLIC_KEY,
        serviceId: CONFIG.EMAIL.SERVICE_ID,
        templateId: CONFIG.EMAIL.TEMPLATE_ID
      };

      // Only initialize if we have valid configuration
      if (emailConfig.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY' && 
          emailConfig.publicKey !== 'your_emailjs_public_key_here' &&
          emailConfig.serviceId !== 'YOUR_EMAILJS_SERVICE_ID' &&
          emailConfig.templateId !== 'YOUR_EMAILJS_TEMPLATE_ID') {
        const initialized = await emailService.init(emailConfig);
        if (initialized) {
          console.log('Email service initialized successfully');
        } else {
          console.warn('Email service initialization failed - will use mailto fallback');
        }
      } else {
        console.log('Email service not configured - using mailto fallback only');
        console.log('ℹ️  To enable automatic email sending, configure EmailJS credentials in js/config.js');
        console.log('   See EmailJS-Setup-Guide.md for detailed setup instructions');
      }
    } catch (error) {
      console.warn('Email service initialization error:', error);
    }
  }

  showCompatibilityWarning() {
    const report = browserCompatibility.getCompatibilityReport();
    const recommendations = report.recommendations;

    if (recommendations.length === 0) return;

    // Show non-blocking compatibility notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; z-index: 9998;
      background: linear-gradient(135deg, #fef3c7 0%, #fed7aa 100%);
      border-bottom: 2px solid #f59e0b; padding: 12px 16px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      font-size: 14px; line-height: 1.4;
    `;

    const criticalIssues = recommendations.filter(r => r.type === 'critical');
    const hasCompatibilityIssues = report.score < CONFIG.COMPATIBILITY.MIN_COMPATIBILITY_SCORE;

    if (criticalIssues.length > 0 || hasCompatibilityIssues) {
      notification.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center;">
            <span style="font-size: 18px; margin-right: 8px;">⚠️</span>
            <div>
              <strong style="color: #92400e;">Browser Compatibility Notice</strong>
              <div style="color: #a16207; font-size: 13px; margin-top: 2px;">
                ${criticalIssues.length > 0 ? criticalIssues[0].message : 'Some features may not work optimally'}
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button onclick="window.browserCompatibility.logCompatibilityInfo()" style="
              padding: 4px 8px; border: 1px solid #d97706; background: transparent;
              color: #d97706; border-radius: 3px; cursor: pointer; font-size: 12px;
            ">Details</button>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
              padding: 4px 8px; border: none; background: #f59e0b;
              color: white; border-radius: 3px; cursor: pointer; font-size: 12px;
            ">Dismiss</button>
          </div>
        </div>
      `;
    } else {
      // Show Samsung-specific suggestion
      notification.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center;">
            <span style="font-size: 18px; margin-right: 8px;">📱</span>
            <div>
              <strong style="color: #92400e;">Samsung Device Detected</strong>
              <div style="color: #a16207; font-size: 13px; margin-top: 2px;">
                For best PDF download experience, consider using Chrome browser
              </div>
            </div>
          </div>
          <button onclick="this.parentElement.parentElement.remove()" style="
            padding: 4px 8px; border: none; background: #f59e0b;
            color: white; border-radius: 3px; cursor: pointer; font-size: 12px;
          ">Got it</button>
        </div>
      `;
    }

    document.body.insertBefore(notification, document.body.firstChild);

    // Auto-hide after 15 seconds for non-critical issues
    if (!hasCompatibilityIssues && criticalIssues.length === 0) {
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 15000);
    }
  }

  setupGlobalEventListeners() {
    // Listen for PDF generation requests
    window.addEventListener('generatePdf', (event) => {
      const userDetails = event.detail;
      ensurePdfSpinner();
      showPdfFormScreen(userDetails);
    });

    // Listen for email requests
    window.addEventListener('sendEmail', async (event) => {
      const { userDetails, pdfBlob, csvBlob } = event.detail;
      try {
        await this.handleEmailRequest(userDetails, pdfBlob, csvBlob);
      } catch (error) {
        console.error('Email sending failed:', error);
      }
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

    // Monitor memory usage
    if (browserCompatibility.features.memoryAPI) {
      setInterval(() => {
        const memoryInfo = browserCompatibility.memoryInfo;
        if (memoryInfo.memoryPressure === 'high') {
          console.warn('High memory usage detected:', memoryInfo);
        }
      }, 60000); // Check every minute
    }
  }

  async handleEmailRequest(userDetails, pdfBlob, csvBlob = null) {
    try {
      console.log('📧 Using RESTORED original working EmailJS approach...');
      
      // Get staff contact details for CC functionality
      let staffContact = null;
      try {
        const data = localStorage.getItem('staffContactDetails');
        staffContact = data ? JSON.parse(data) : null;
      } catch (error) {
        console.warn('Error getting staff contact details for email CC:', error);
      }
      
      // Add staff contact to userDetails if available
      const enhancedUserDetails = {
        ...userDetails,
        staffContact: staffContact
      };
      
      // RESTORED: Use original working base64 template variable approach
      await emailService.sendEmailWithPDF(enhancedUserDetails, pdfBlob);
    } catch (error) {
      console.error('Email sending error:', error);
      // The solution has its own error handling, but we'll log here too
    }
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