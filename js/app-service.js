/**
 * Main Application Service for Seima Scanner
 * Coordinates all unified services and provides clean interface
 * Prepares for Microsoft Graph migration and eliminates complexity
 */

import { CONFIG } from './config.js';
import { dataService } from './data-service.js';
import { emailService } from './email-service.js';
import { pdfService } from './pdf-service.js';

export class AppService {
  constructor() {
    this.isInitialized = false;
    this.services = {
      data: dataService,
      email: emailService,
      pdf: pdfService
    };
    this.errorHandler = new ErrorHandler();
  }

  /**
   * Initialize all services
   */
  async init() {
    try {
      console.log('🚀 Initializing Seima Scanner services...');

      // Migrate any legacy data first
      this.services.data.migrateLegacyData();

      // Initialize email service with configured provider
      const emailProvider = CONFIG.EMAIL.PROVIDER || 'emailjs';
      await this.services.email.init(emailProvider);

      // Initialize PDF service
      await this.services.pdf.init();

      this.isInitialized = true;
      console.log('✅ All services initialized successfully');
      
      return true;
    } catch (error) {
      console.error('❌ Service initialization failed:', error);
      this.errorHandler.handleError(error, 'Service initialization');
      return false;
    }
  }

  /**
   * Add product to selection
   */
  addProduct(product, notes = '', room = '', quantity = 1) {
    try {
      return this.services.data.addProduct(product, notes, room, quantity);
    } catch (error) {
      this.errorHandler.handleError(error, 'Adding product');
      throw error;
    }
  }

  /**
   * Remove product from selection
   */
  removeProduct(selectionId) {
    try {
      return this.services.data.removeProduct(selectionId);
    } catch (error) {
      this.errorHandler.handleError(error, 'Removing product');
      throw error;
    }
  }

  /**
   * Update product in selection
   */
  updateProduct(selectionId, updates) {
    try {
      return this.services.data.updateProduct(selectionId, updates);
    } catch (error) {
      this.errorHandler.handleError(error, 'Updating product');
      throw error;
    }
  }

  /**
   * Get all selected products
   */
  getSelectedProducts() {
    return this.services.data.getSelectedProducts();
  }

  /**
   * Get selection statistics
   */
  getSelectionStats() {
    return this.services.data.getSelectionStats();
  }

  /**
   * Clear all selections
   */
  clearSelection() {
    try {
      this.services.data.clearSelection();
    } catch (error) {
      this.errorHandler.handleError(error, 'Clearing selection');
      throw error;
    }
  }

  /**
   * Generate and send PDF with email
   * This is the main coordinated function that replaces the complex legacy logic
   */
  async generateAndSendPDF(userDetails) {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      console.log('📄 Starting PDF generation and email process...');

      // Validate we have products
      const selectedProducts = this.services.data.getSelectedProducts();
      if (!selectedProducts.length) {
        throw new Error('No products selected');
      }

      // Generate PDF
      const pdfBlob = await this.services.pdf.generatePDF(userDetails);
      console.log(`✅ PDF generated successfully (${(pdfBlob.size / 1024 / 1024).toFixed(2)} MB)`);

      // Generate CSV if requested
      let csvData = null;
      if (userDetails.exportCsv === true) {
        console.log('📊 Generating CSV file...');
        csvData = this.services.pdf.generateCSV(userDetails);
        if (csvData) {
          console.log(`✅ CSV generated successfully (${csvData.length} characters)`);
        } else {
          console.warn('⚠️ CSV generation returned no data');
        }
      }

      // Send email - always attempt regardless of file size (as requested)
      if (userDetails.sendEmail && userDetails.email) {
        console.log('📧 Sending email with attachments...');
        const result = await this.services.email.sendEmail(userDetails, pdfBlob, csvData);
        
        if (result.success) {
          return {
            success: true,
            method: 'email',
            pdfSize: pdfBlob.size,
            message: 'Email sent successfully with PDF attachment'
          };
        } else {
          // Email failed, but files were downloaded as fallback
          return {
            success: false,
            method: 'download_fallback',
            pdfSize: pdfBlob.size,
            message: 'Email failed, files downloaded instead',
            error: result.error
          };
        }
      } else {
        // Direct download requested
        console.log('💾 Starting direct file downloads...');
        this._downloadFile(pdfBlob, this.services.pdf.generateFileName(userDetails, 'pdf'));
        console.log('✅ PDF download initiated');
        
        if (csvData) {
          const csvBlob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
          this._downloadFile(csvBlob, this.services.pdf.generateFileName(userDetails, 'csv'));
          console.log('✅ CSV download initiated');
        } else {
          console.log('ℹ️ No CSV data to download');
        }
        
        return {
          success: true,
          method: 'download',
          pdfSize: pdfBlob.size,
          message: csvData ? 'PDF and CSV files downloaded successfully' : 'PDF file downloaded successfully'
        };
      }

    } catch (error) {
      this.errorHandler.handleError(error, 'PDF generation and sending');
      throw error;
    }
  }

  /**
   * Test email functionality
   */
  async testEmail(testData = null) {
    if (!this.isInitialized) {
      await this.init();
    }

    try {
      return await this.services.email.testEmail(testData);
    } catch (error) {
      this.errorHandler.handleError(error, 'Email testing');
      throw error;
    }
  }

  /**
   * Switch email provider (for Microsoft Graph migration)
   */
  async switchEmailProvider(providerName, config = null) {
    try {
      console.log(`🔄 Switching email provider to ${providerName}...`);
      const success = await this.services.email.init(providerName, config);
      
      if (success) {
        console.log(`✅ Email provider switched to ${providerName}`);
      } else {
        console.error(`❌ Failed to switch to ${providerName}`);
      }
      
      return success;
    } catch (error) {
      this.errorHandler.handleError(error, 'Email provider switching');
      throw error;
    }
  }

  /**
   * Get application health status
   */
  getHealthStatus() {
    return {
      initialized: this.isInitialized,
      dataService: this.services.data ? 'ready' : 'not ready',
      emailService: this.services.email?.isInitialized ? 'ready' : 'not ready',
      pdfService: this.services.pdf?.isInitialized ? 'ready' : 'not ready',
      selectedProducts: this.services.data.getSelectedProducts().length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get migration readiness for Microsoft Graph
   */
  getMigrationReadiness() {
    const stats = this.getSelectionStats();
    
    return {
      ready: this.isInitialized,
      currentProvider: CONFIG.EMAIL.PROVIDER,
      microsoftGraphConfigured: !!(CONFIG.EMAIL.MICROSOFT_CLIENT_ID && CONFIG.EMAIL.MICROSOFT_TENANT_ID),
      testingRecommended: stats.totalProducts > 0,
      migrationSteps: [
        '1. Configure Microsoft Graph credentials in CONFIG.EMAIL',
        '2. Test email sending with switchEmailProvider("microsoftGraph")',
        '3. Update CONFIG.EMAIL.PROVIDER to "microsoftGraph"',
        '4. Remove EmailJS dependencies'
      ]
    };
  }

  /**
   * Alias for getMigrationReadiness() - used by app.js
   */
  getMigrationReadinessStatus() {
    return this.getMigrationReadiness();
  }

  /**
   * Get debug API for global access
   */
  getDebugAPI() {
    return {
      getHealthStatus: () => this.getHealthStatus(),
      getMigrationReadiness: () => this.getMigrationReadiness(),
      getMigrationReadinessStatus: () => this.getMigrationReadiness(),
      switchToMicrosoftGraph: () => this.switchEmailProvider('microsoftGraph'),
      testEmail: (data) => this.testEmail(data),
      getErrorLog: () => JSON.parse(localStorage.getItem('seimaErrorLog') || '[]'),
      clearErrorLog: () => localStorage.removeItem('seimaErrorLog'),
      getSystemStatus: () => this.getHealthStatus(),
      validateConfiguration: () => ({
        valid: this.isInitialized,
        details: this.getHealthStatus()
      })
    };
  }

  // Private methods

  /**
   * Download file with fallback handling
   */
  downloadWithFallback(blob, filename) {
    try {
      this._downloadFile(blob, filename);
      console.log(`✅ Downloaded ${filename}`);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: show blob URL for manual download
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  }

  /**
   * Download file to user's device
   */
  _downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Getter methods for backward compatibility
   */
  get emailService() {
    return this.services.email;
  }

  get dataService() {
    return this.services.data;
  }

  get pdfService() {
    return this.services.pdf;
  }
}

/**
 * Standardized Error Handler
 */
class ErrorHandler {
  handleError(error, context = 'Unknown') {
    const errorInfo = {
      message: error.message || 'Unknown error',
      context: context,
      timestamp: new Date().toISOString(),
      stack: error.stack
    };

    // Log detailed error info
    console.error(`❌ Error in ${context}:`, errorInfo);

    // Show user-friendly message
    this._showUserError(error, context);

    // Track error for debugging
    this._trackError(errorInfo);
  }

  _showUserError(error, context) {
    let userMessage = '';
    
    switch (context) {
      case 'PDF generation and sending':
        userMessage = 'Failed to generate or send PDF. Please check your selections and try again.';
        break;
      case 'Email sending':
        userMessage = 'Failed to send email. Files will be downloaded instead.';
        break;
      case 'Adding product':
        userMessage = 'Failed to add product to selection. Please try again.';
        break;
      case 'Service initialization':
        userMessage = 'Failed to initialize application services. Please refresh the page.';
        break;
      default:
        userMessage = `An error occurred: ${error.message}`;
    }

    // Use existing notification system if available
    if (window.showErrorMessage) {
      window.showErrorMessage(userMessage);
    } else {
      alert(userMessage);
    }
  }

  _trackError(errorInfo) {
    // Store in localStorage for debugging
    try {
      const errorLog = JSON.parse(localStorage.getItem('seimaErrorLog') || '[]');
      errorLog.push(errorInfo);
      
      // Keep only last 50 errors
      if (errorLog.length > 50) {
        errorLog.splice(0, errorLog.length - 50);
      }
      
      localStorage.setItem('seimaErrorLog', JSON.stringify(errorLog));
    } catch (e) {
      console.warn('Could not store error log:', e);
    }
  }
}

// Create singleton instance
export const appService = new AppService();

// Global debugging functions
window.seimaDebug = {
  getHealthStatus: () => appService.getHealthStatus(),
  getMigrationReadiness: () => appService.getMigrationReadiness(),
  switchToMicrosoftGraph: () => appService.switchEmailProvider('microsoftGraph'),
  testEmail: (data) => appService.testEmail(data),
  getErrorLog: () => JSON.parse(localStorage.getItem('seimaErrorLog') || '[]'),
  clearErrorLog: () => localStorage.removeItem('seimaErrorLog')
}; 