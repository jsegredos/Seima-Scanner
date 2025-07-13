// Import new refactored services
import { AppService } from './app-service.js';
import { CONFIG } from './config.js';
import { DataService } from './data-service.js';
import { EmailService } from './email-service.js';
import { PDFService } from './pdf-service.js';

// Import legacy modules for compatibility
import { NavigationManager } from './navigation.js';
import { FileImportManager } from './file-import.js';
import { browserCompatibility, isSamsungDevice } from './browser-compatibility.js';

// Main application class - now uses refactored services
class SeimaScanner {
  constructor() {
    this.appService = new AppService();
    this.navigationManager = null;
    this.fileImportManager = new FileImportManager();
  }

  async init() {
    try {
      console.log('🚀 Initializing Seima Scanner with refactored services...');
      
      // Initialize browser compatibility monitoring
      console.log('Browser Compatibility Report:', browserCompatibility.getCompatibilityReport());
      
      // Show compatibility warning if needed
      if (browserCompatibility.shouldShowCompatibilityWarning()) {
        this.showCompatibilityWarning();
      }

      // Initialize the app service (coordinates all our new services)
      const initResult = await this.appService.init();
      console.log('App service initialization result:', initResult);

      // Initialize navigation manager (legacy compatibility)
      this.navigationManager = new NavigationManager();
      await this.navigationManager.init();

      // Initialize file import manager
      await this.fileImportManager.init();

      // Setup global event listeners
      this.setupGlobalEventListeners();

      // Make services globally available for debugging and compatibility
      this.setupGlobalAPI();

      // Log Samsung device detection for debugging
      if (isSamsungDevice()) {
        console.log('Samsung device detected - enhanced download compatibility enabled');
      }

      console.log('✅ Seima Scanner initialized successfully with refactored services');
      
      // Display migration status
      const migrationStatus = this.appService.getMigrationReadinessStatus();
      console.log('🔄 Microsoft Graph Migration Status:', migrationStatus);
      
    } catch (error) {
      console.error('❌ Failed to initialize Seima Scanner:', error);
      // Fall back to legacy initialization if needed
      await this.initializeLegacyFallback();
    }
  }

  async initializeLegacyFallback() {
    console.warn('🔄 Falling back to legacy initialization...');
    try {
      // Import and use legacy modules as fallback
      const { moduleCoordinator } = await import('./modules.js');
      await moduleCoordinator.init();
      this.legacyMode = true;
      console.log('⚠️ Running in legacy compatibility mode');
    } catch (fallbackError) {
      console.error('❌ Legacy fallback also failed:', fallbackError);
    }
  }

  setupGlobalAPI() {
    // Enhanced global API for debugging and compatibility
    window.seimaApp = this;
    window.seimaDebug = this.appService.getDebugAPI();
    
    // Legacy compatibility
    window.scannerController = this.navigationManager?.scannerController;
    window.navigationManager = this.navigationManager;
    window.browserCompatibility = browserCompatibility;
    
    // New service access
    window.appService = this.appService;
    window.dataService = this.appService.dataService;
    window.emailService = this.appService.emailService;
    window.pdfService = this.appService.pdfService;
    
    // Utility functions
    window.downloadWithFallback = (blob, filename) => {
      this.appService.downloadWithFallback(blob, filename);
    };
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
    window.addEventListener('generatePdf', async (event) => {
      const userDetails = event.detail;
      try {
        this.showSpinner();
        await this.appService.generateAndSendPDF(userDetails);
      } catch (error) {
        console.error('PDF generation failed:', error);
        this.showError('Failed to generate PDF. Please try again.');
      } finally {
        this.hideSpinner();
      }
    });

    // Listen for email requests (legacy compatibility)
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
        if (memoryInfo && memoryInfo.usedJSHeapSize > 100 * 1024 * 1024) { // 100MB
          console.warn('High memory usage detected:', memoryInfo);
        }
      }, 30000); // Check every 30 seconds
    }
  }

  async handleEmailRequest(userDetails, pdfBlob, csvBlob = null) {
    try {
      const result = await this.appService.emailService.sendEmail({
        to_email: userDetails.email,
        to_name: userDetails.name,
        from_name: userDetails.staffName || 'Seima Staff',
        reply_to: userDetails.staffEmail || '',
        subject: `Product Selection from ${userDetails.name}`,
        message: userDetails.message || 'Please find attached product selection.',
        phone: userDetails.mobile || '',
        location: userDetails.location || ''
      }, pdfBlob, csvBlob);
      
      if (result.success) {
        this.showSuccess('Email sent successfully!');
      } else {
        throw new Error(result.error || 'Email sending failed');
      }
    } catch (error) {
      console.error('Email request failed:', error);
      this.showError('Failed to send email. Please try again.');
    }
  }

  // Utility methods for UI feedback
  showSpinner() {
    const spinner = document.getElementById('pdf-spinner');
    if (spinner) {
      spinner.style.display = 'flex';
    }
  }

  hideSpinner() {
    const spinner = document.getElementById('pdf-spinner');
    if (spinner) {
      spinner.style.display = 'none';
    }
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10000;
      padding: 16px 20px; border-radius: 8px; max-width: 400px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 14px; font-weight: 500;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white; animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Add slide-in animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  // Public API methods for legacy compatibility
  getSelectedProducts() {
    return this.appService.dataService.getSelectedProducts();
  }

  clearSelection() {
    return this.appService.dataService.clearSelection();
  }

  addProduct(product, notes, room, quantity) {
    return this.appService.dataService.addProduct(product, room, notes, quantity);
  }

  updateSelectionCount() {
    // Legacy method - functionality moved to navigation manager
    if (this.navigationManager) {
      this.navigationManager.updateSelectionCount();
    }
  }
}

// Initialize the application
const seimaScanner = new SeimaScanner();

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    seimaScanner.init();
  });
} else {
  seimaScanner.init();
}

// Export for global access
export default seimaScanner; 