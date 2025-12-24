/**
 * Unified Email Service for Seima Scanner
 * Provider-agnostic email service supporting EmailJS and Microsoft Graph API
 * Removes size-based fallback in favor of error-based fallback as requested
 */

import { CONFIG } from './config.js';
import { dataService } from './data-service.js';
import { selectionRecorder } from './selection-recorder.js';
import { EmailTemplateGenerator } from './email-template-generator.js';

export class EmailService {
  constructor() {
    this.providers = {
      emailjs: new EmailJSProvider(),
      microsoftGraph: new MicrosoftGraphProvider()
    };
    this.currentProvider = null;
    this.isInitialized = false;
    this.templateGenerator = new EmailTemplateGenerator();
  }

  /**
   * Initialize email service with specified provider
   */
  async init(providerName = 'emailjs', config = null) {
    try {
      const provider = this.providers[providerName];
      if (!provider) {
        throw new Error(`Unknown email provider: ${providerName}`);
      }

      const providerConfig = config || this._getProviderConfig(providerName);
      await provider.init(providerConfig);
      
      this.currentProvider = provider;
      this.isInitialized = true;
      
      console.log(`✅ Email service initialized with ${providerName}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to initialize email service with ${providerName}:`, error);
      return false;
    }
  }

  /**
   * Send email with PDF and CSV attachments
   * IMPORTANT: Always attempts to send, only falls back on actual errors (not size)
   */
  async sendEmail(userDetails, pdfBlob, csvData = null) {
    if (!this.isInitialized || !this.currentProvider) {
      throw new Error('Email service not initialized');
    }

    try {
      // Add staff contact if available
      const staffContact = dataService.getStaffContact();
      const enhancedUserDetails = {
        ...userDetails,
        staffContact: staffContact
      };

      // Generate email content
      const emailContent = this._generateEmailContent(enhancedUserDetails, pdfBlob, csvData);
      
      // **ALWAYS ATTEMPT TO SEND** - no size checks, as requested
      console.log('📧 Attempting email send (no size restrictions)...');
      const result = await this.currentProvider.sendEmail(emailContent);
      
      if (result.success) {
        this._showSuccess('✅ Email sent successfully!');
        
        // Record the selection for tracking and reporting
        this.recordSelection(enhancedUserDetails, pdfBlob, csvData, result);
        
        // Always clear lead data after successful email (regardless of recording result)
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/271cbb43-06c0-4898-a939-268461524d29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'email-service.js:77',message:'About to clear lead data',data:{hasLeadWizardIntegration:!!window.leadWizardIntegration,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        if (window.leadWizardIntegration) {
          window.leadWizardIntegration.clearCurrentLeadData();
          console.log('🧹 Lead data cleared after successful email send');
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/271cbb43-06c0-4898-a939-268461524d29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'email-service.js:82',message:'leadWizardIntegration not available',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'F'})}).catch(()=>{});
          // #endregion
        }
        
        return result;
      } else {
        throw new Error(result.error || 'Email sending failed');
      }
      
    } catch (error) {
      console.error('📧 Email sending failed, using fallback:', error);
      return this._handleEmailFailure(userDetails, pdfBlob, csvData, error);
    }
  }

  /**
   * Send notification email without attachments
   */
  async sendNotificationEmail(userDetails) {
    if (!this.isInitialized || !this.currentProvider) {
      throw new Error('Email service not initialized');
    }

    try {
      const staffContact = dataService.getStaffContact();
      const enhancedUserDetails = {
        ...userDetails,
        staffContact: staffContact
      };

      const emailContent = this._generateEmailContent(enhancedUserDetails, null, null);
      const result = await this.currentProvider.sendEmail(emailContent);
      
      if (result.success) {
        this._showSuccess('✅ Notification email sent successfully!');
        return result;
      } else {
        throw new Error(result.error || 'Notification email failed');
      }
      
    } catch (error) {
      console.error('📧 Notification email failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test email functionality
   */
  async testEmail(testData = null) {
    const testUserDetails = testData || {
      name: 'Test User',
      email: 'test@example.com',
      project: 'Test Project',
      address: 'Test Address',
      phone: 'Test Phone'
    };

    // Create minimal test PDF
    const testPdfContent = '%PDF-1.4\nTest PDF Content\n%%EOF';
    const testPdfBlob = new Blob([testPdfContent], { type: 'application/pdf' });
    
    // Create test CSV
    const testCsvData = 'Code,Description,Quantity\nTEST001,"Test Product",1';

    console.log('🧪 Testing email service...');
    return await this.sendEmail(testUserDetails, testPdfBlob, testCsvData);
  }

  // Private methods

  /**
   * Generate email content for any provider
   */
  _generateEmailContent(userDetails, pdfBlob, csvData) {
    return {
      to: userDetails.email,
      from: CONFIG.EMAIL.FROM_EMAIL || 'noreply@seima.com.au',
      fromName: 'Seima Team',
      subject: `Seima Product Selection - ${userDetails.name || 'Customer'}`,
      html: this.templateGenerator.generateEmailHTML(userDetails),
      text: this.templateGenerator.generateTextEmail(userDetails),
      bcc: userDetails.staffContact?.email || null,
      attachments: this._prepareAttachments(userDetails, pdfBlob, csvData)
    };
  }

    /**
   * Prepare attachments for email
   */
    _prepareAttachments(userDetails, pdfBlob, csvData) {
    const attachments = [];
    
    if (pdfBlob) {
      attachments.push({
        filename: this._generateFileName(userDetails, 'pdf'),
        content: pdfBlob,
        type: 'application/pdf'
      });
    }
   
    if (csvData) {
      attachments.push({
        filename: this._generateFileName(userDetails, 'csv'),
        content: new Blob([csvData], { type: 'text/csv;charset=utf-8' }),
        type: 'text/csv'
      });
    }
    
    return attachments;
  }

  /**
   * Generate filename for attachments
   */
  _generateFileName(userDetails, type) {
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getFullYear()).slice(-2)}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    const projectName = (userDetails.project || 'Selection').replace(/[^a-zA-Z0-9\s]/g, '');
    
    return `${projectName}-${dateStr}.${timeStr}.${type}`;
  }



  /**
   * Handle email failure with download fallback
   */
  _handleEmailFailure(userDetails, pdfBlob, csvData, error) {
    console.error('📧 Email failed, providing download fallback:', error);
    
    const downloadedFiles = [];
    
    try {
      if (pdfBlob) {
        const pdfFilename = this._generateFileName(userDetails, 'pdf');
        this._downloadFile(pdfBlob, pdfFilename);
        downloadedFiles.push('PDF');
        console.log('✅ PDF downloaded as fallback');
      }
    } catch (pdfError) {
      console.error('❌ Failed to download PDF:', pdfError);
    }
    
    try {
      if (csvData) {
        const csvBlob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
        const csvFilename = this._generateFileName(userDetails, 'csv');
        this._downloadFile(csvBlob, csvFilename);
        downloadedFiles.push('CSV');
        console.log('✅ CSV downloaded as fallback');
      }
    } catch (csvError) {
      console.error('❌ Failed to download CSV:', csvError);
    }
    
    // Show appropriate message
    if (downloadedFiles.length > 0) {
      this._showError(`Unable to send email. Files have been downloaded to your device.`);
    } else {
      this._showError(`Email sending failed and file download failed. Please try again.`);
    }
    
    // Clear lead data even when email fails (files were generated/downloaded)
    if (window.leadWizardIntegration) {
      window.leadWizardIntegration.clearCurrentLeadData();
      console.log('🧹 Lead data cleared after email failure (files downloaded)');
    }
    
    return {
      success: false,
      method: 'download_fallback',
      error: error.message,
      downloadedFiles: downloadedFiles
    };
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
   * Get provider configuration
   */
  _getProviderConfig(providerName) {
    switch (providerName) {
      case 'emailjs':
        return {
          publicKey: CONFIG.EMAIL.PUBLIC_KEY,
          serviceId: CONFIG.EMAIL.SERVICE_ID,
          templateId: CONFIG.EMAIL.TEMPLATE_ID
        };
      case 'microsoftGraph':
        return {
          clientId: CONFIG.EMAIL.MICROSOFT_CLIENT_ID,
          tenantId: CONFIG.EMAIL.MICROSOFT_TENANT_ID,
          scopes: ['https://graph.microsoft.com/Mail.Send']
        };
      default:
        return {};
    }
  }

  /**
   * Show success message
   */
  _showSuccess(message) {
    // Integration with existing notification system
    if (window.showSuccessMessage) {
      window.showSuccessMessage(message);
    } else {
      console.log(message);
    }
  }

  /**
   * Show error message
   */
  _showError(message) {
    // Integration with existing notification system
    if (window.showErrorMessage) {
      window.showErrorMessage(message);
    } else {
      console.error(message);
    }
  }

  /**
   * Record selection data for tracking and reporting
   */
  async recordSelection(userDetails, pdfBlob, csvData, emailResult) {
    try {
      // Get selected products from storage
      const selectedProducts = this.getSelectedProducts();
      
      if (selectedProducts.length === 0) {
        console.log('📊 No products to record');
        return;
      }

      // Prepare email result data
      const emailData = {
        success: true,
        pdfGenerated: !!pdfBlob,
        csvGenerated: !!csvData,
        pdfSize: pdfBlob ? `${(pdfBlob.size / 1024 / 1024).toFixed(2)}MB` : '',
        method: 'legacy-email-service'
      };

      // Enhance userDetails with lead data if available
      const enhancedUserDetails = { ...userDetails };
      if (userDetails.leadData) {
        enhancedUserDetails.leadData = userDetails.leadData;
      } else if (window.currentLeadData) {
        enhancedUserDetails.leadData = window.currentLeadData;
      }

      // Record the selection
      const recordResult = await selectionRecorder.recordSelection(
        enhancedUserDetails, 
        selectedProducts, 
        emailData
      );

      if (recordResult.success) {
        console.log('📊 Selection recorded successfully');
        
        // Clear lead data after successful recording
        if (window.leadWizardIntegration) {
          window.leadWizardIntegration.clearCurrentLeadData();
          console.log('🧹 Lead data cleared after successful email');
        }
      } else {
        console.warn('📊 Selection recording failed:', recordResult.error || recordResult.reason);
      }
    } catch (error) {
      console.error('📊 Error recording selection:', error);
      // Don't throw - recording failure shouldn't break email flow
    }
  }

  /**
   * Get selected products from storage (unified format)
   */
  getSelectedProducts() {
    try {
      // Try new format first
      const newFormat = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SELECTED_PRODUCTS) || '[]');
      if (newFormat.length > 0) {
        return newFormat;
      }

      // Fallback to legacy format
      const legacyFormat = JSON.parse(localStorage.getItem('selection') || '[]');
      return legacyFormat.map(item => ({
        product: item,
        room: item.Room || '',
        notes: item.Notes || '',
        quantity: item.Quantity || 1
      }));
    } catch (error) {
      console.error('Error getting selected products:', error);
      return [];
    }
  }
}

/**
 * EmailJS Provider Implementation
 */
class EmailJSProvider {
  constructor() {
    this.isInitialized = false;
  }

  async init(config) {
    if (!window.emailjs) {
      await this._loadEmailJS();
    }

    emailjs.init({
      publicKey: config.publicKey
    });

    this.config = config;
    this.isInitialized = true;
    console.log('✅ EmailJS provider initialized');
  }

  async sendEmail(emailContent) {
    try {
      // Convert attachments to base64 for EmailJS
      const templateParams = {
        to_email: emailContent.to,
        from_name: emailContent.fromName,
        subject: emailContent.subject,
        email_html: emailContent.html,
        message_text: emailContent.text,
        bcc_email: emailContent.bcc || ''
      };

      // Add attachments
      for (const attachment of emailContent.attachments) {
        if (attachment.type === 'application/pdf') {
          templateParams.pdf_attachment = await this._blobToBase64(attachment.content);
          templateParams.pdf_filename = attachment.filename;
        } else if (attachment.type === 'text/plain' || attachment.type === 'text/csv') {
          templateParams.csv_attachment = await this._blobToBase64(attachment.content);
          templateParams.csv_filename = attachment.filename;
        }
      }

      const result = await emailjs.send(
        this.config.serviceId,
        this.config.templateId,
        templateParams,
        this.config.publicKey
      );

      if (result.status === 200) {
        return { success: true, provider: 'emailjs', result };
      } else {
        throw new Error(`EmailJS returned status ${result.status}`);
      }
    } catch (error) {
      return { success: false, provider: 'emailjs', error: error.message };
    }
  }

  async _loadEmailJS() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async _blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        } catch (error) {
          console.error('❌ Base64 conversion failed:', error);
          reject(error);
        }
      };
      reader.onerror = () => {
        console.error('❌ FileReader error:', reader.error);
        reject(reader.error);
      };
      reader.readAsDataURL(blob);
    });
  }
}

/**
 * Microsoft Graph Provider Implementation (Future)
 */
class MicrosoftGraphProvider {
  constructor() {
    this.isInitialized = false;
  }

  async init(config) {
    console.log('🚀 Microsoft Graph provider configured for future use');
    this.config = config;
    this.isInitialized = true;
    // TODO: Implement Microsoft Graph authentication and setup
  }

  async sendEmail(emailContent) {
    console.log('📧 Microsoft Graph email sending not yet implemented');
    // TODO: Implement Microsoft Graph email sending
    return { success: false, provider: 'microsoftGraph', error: 'Not implemented yet' };
  }
}

/**
 * Email Template Generator is imported from email-template-generator.js
 */

// Create singleton instance
export const emailService = new EmailService(); 

// Test function to preview the email template
export function testEmailTemplate() {
  const testUserDetails = {
    name: '45',
    email: 'jsegredos@gmail.com',
    project: '345',
    address: 'house address',
    mobile: '55432'
  };

  const testGenerator = new EmailTemplateGenerator();
  const htmlContent = testGenerator.generateEmailHTML(testUserDetails);
  
  // Open in new window for preview
  const previewWindow = window.open('', '_blank', 'width=800,height=600');
  previewWindow.document.write(htmlContent);
  previewWindow.document.close();
  
  console.log('✅ Email template preview opened in new window');
}

// Test function to verify consolidated templates work
export function testConsolidatedTemplates() {
  console.log('🧪 Testing consolidated email templates...');
  
  const testUserDetails = {
    name: 'Test User',
    email: 'test@example.com',
    project: 'Test Project',
    address: 'Test Address',
    phone: '1234567890'
  };
  
  try {
    // Test standalone template generator
    const standaloneGenerator = new EmailTemplateGenerator();
    const htmlContent = standaloneGenerator.generateEmailHTML(testUserDetails);
    const textContent = standaloneGenerator.generateTextEmail(testUserDetails);
    
    console.log('✅ Standalone EmailTemplateGenerator works correctly');
    console.log('📄 HTML content length:', htmlContent.length);
    console.log('📝 Text content length:', textContent.length);
    
    // Test email service integration
    const emailService = new EmailService();
    const emailContent = emailService._generateEmailContent(testUserDetails, null, null);
    
    console.log('✅ EmailService integration works correctly');
    console.log('📧 Email content generated:', {
      to: emailContent.to,
      subject: emailContent.subject,
      htmlLength: emailContent.html.length,
      textLength: emailContent.text.length
    });
    
    return true;
  } catch (error) {
    console.error('❌ Template consolidation test failed:', error);
    return false;
  }
}

// Make test functions globally available
window.testEmailTemplate = testEmailTemplate;
window.testConsolidatedTemplates = testConsolidatedTemplates; 