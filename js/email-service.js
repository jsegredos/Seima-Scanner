/**
 * Unified Email Service for Seima Scanner
 * Provider-agnostic email service supporting EmailJS and Microsoft Graph API
 * Removes size-based fallback in favor of error-based fallback as requested
 */

import { CONFIG } from './config.js';
import { dataService } from './data-service.js';

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
    const selectionStats = dataService.getSelectionStats();
    
    return {
      to: userDetails.email,
      from: CONFIG.EMAIL.FROM_EMAIL || 'noreply@seima.com.au',
      fromName: 'Seima Team',
      subject: `Seima Product Selection - ${userDetails.name || 'Customer'}`,
      html: this.templateGenerator.generateHTML(userDetails, selectionStats),
      text: this.templateGenerator.generateText(userDetails, selectionStats),
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
 * Email Template Generator - EXACT COPY from original email-unified.js
 */
class EmailTemplateGenerator {
  constructor() {
    this.brandColors = {
      primary: '#a67c26',
      primaryDark: '#8b6914',
      background: '#f8f8fa',
      cardBackground: '#ffffff',
      textPrimary: '#222',
      textSecondary: '#4b5563',
      textMuted: '#6b7280',
      success: '#10b981',
      border: '#e5e7eb'
    };
  }

  prepareEmailData(userDetails) {
    return {
      customerName: userDetails.name || 'Valued Customer',
      customerEmail: userDetails.email || '',
      customerProject: userDetails.project || 'Project',
      customerAddress: userDetails.address || userDetails.location || '',
      customerMobile: userDetails.mobile || userDetails.telephone || userDetails.phone || '',
      timestamp: new Date().toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  }

  generateHTML(userDetails, selectionStats) {
    const emailData = this.prepareEmailData(userDetails);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Seima Product Selection - ${emailData.customerName}</title>
          <style>
              * { box-sizing: border-box; }
              body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                  margin: 0;
                  padding: 20px;
                  background-color: ${this.brandColors.background};
                  color: ${this.brandColors.textPrimary};
                  line-height: 1.6;
              }
              .email-container {
                  max-width: 600px;
                  margin: 0 auto;
                  background-color: ${this.brandColors.cardBackground};
                  border-radius: 16px;
                  overflow: hidden;
                  box-shadow: 0 4px 32px rgba(0,0,0,0.08);
              }
              .header {
                  background: linear-gradient(135deg, ${this.brandColors.primary} 0%, ${this.brandColors.primaryDark} 100%);
                  color: white;
                  padding: 40px 30px;
                  text-align: center;
              }
              .header h1 {
                  margin: 0 0 8px 0;
                  font-size: 28px;
                  font-weight: 600;
                  letter-spacing: 0.5px;
              }
              .header .subtitle {
                  margin: 0;
                  font-size: 16px;
                  opacity: 0.9;
                  font-weight: 400;
              }
              .content {
                  padding: 40px 30px;
              }
              .greeting {
                  font-size: 18px;
                  margin-bottom: 24px;
                  color: #374151;
              }
              .intro-text {
                  font-size: 16px;
                  margin-bottom: 32px;
                  color: ${this.brandColors.textSecondary};
              }
              .card {
                  border-radius: 12px;
                  padding: 24px;
                  margin: 24px 0;
                  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
              }
              .summary-card {
                   background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
               }
              .summary-title {
                   margin: 0 0 20px 0;
                   font-size: 20px;
                   font-weight: 600;
                   color: ${this.brandColors.primaryDark};
               }
              .summary-grid {
                  display: grid;
                  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                  gap: 16px;
              }
              .summary-item {
                  display: flex;
                  justify-content: space-between;
                  padding: 8px 0;
                  border-bottom: 1px solid ${this.brandColors.border};
              }
              .summary-item:last-child { border-bottom: none; }
              .summary-label {
                  font-weight: 600;
                  color: #374151;
              }
              .summary-value {
                  color: ${this.brandColors.textMuted};
                  text-align: right;
              }
              
              .contact-section {
                   background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                   border-radius: 8px;
                   padding: 20px;
                   margin: 24px 0;
                   text-align: center;
                   border: 1px solid #dee2e6;
               }
               .contact-title {
                   margin: 0 0 12px 0;
                   font-weight: 600;
                   color: #495057;
               }
               .contact-info {
                   margin: 8px 0;
                   color: #6c757d;
               }
              .contact-link {
                  color: ${this.brandColors.primary};
                  text-decoration: none;
                  font-weight: 600;
              }
              .footer {
                  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
                  color: #e5e7eb;
                  padding: 30px;
                  text-align: center;
              }
              .footer-links { margin: 16px 0; }
              .footer-link {
                   color: #ffffff;
                   text-decoration: none;
                   margin: 0 12px;
                   font-weight: 500;
               }
              .footer-copyright {
                  font-size: 14px;
                  opacity: 0.8;
                  margin-top: 16px;
                  border-top: 1px solid #4b5563;
                  padding-top: 16px;
              }
              @media (max-width: 600px) {
                  body { padding: 10px; }
                  .header, .content, .footer { padding: 20px 16px; }
                  .summary-grid { grid-template-columns: 1fr; }
                  .header h1 { font-size: 24px; }
              }
          </style>
      </head>
      <body>
          <div class="email-container">
              <div class="header">
                   <h1>Seima Product Selection</h1>
               </div>
              
              <div class="content">
                  <p class="greeting">Dear ${emailData.customerName},</p>
                  
                  <p class="intro-text">
                       Thank you for choosing Seima for your project. We're pleased to provide your personalised product selection attached to this email for your review.
                   </p>
                  
                  <div class="card summary-card">
                      <h3 class="summary-title">Project Summary</h3>
                      <div class="summary-grid">
                          <div class="summary-item">
                              <span class="summary-label">Customer:</span>
                              <span class="summary-value">${emailData.customerName}</span>
                          </div>
                          <div class="summary-item">
                              <span class="summary-label">Email:</span>
                              <span class="summary-value">${emailData.customerEmail}</span>
                          </div>
                          <div class="summary-item">
                              <span class="summary-label">Project:</span>
                              <span class="summary-value">${emailData.customerProject || 'Not specified'}</span>
                          </div>
                          <div class="summary-item">
                              <span class="summary-label">Address:</span>
                              <span class="summary-value">${emailData.customerAddress || 'Not specified'}</span>
                          </div>
                          <div class="summary-item">
                              <span class="summary-label">Phone:</span>
                              <span class="summary-value">${emailData.customerMobile || 'Not specified'}</span>
                          </div>
                          <div class="summary-item">
                              <span class="summary-label">Total Products:</span>
                              <span class="summary-value">${selectionStats.totalProducts}</span>
                          </div>
                          <div class="summary-item">
                              <span class="summary-label">Rooms:</span>
                              <span class="summary-value">${selectionStats.totalRooms}</span>
                          </div>
                      </div>
                  </div>

                  <div class="contact-section">
                      <h4 class="contact-title">Need assistance?</h4>
                      <p class="contact-info">For product specifications, technical support, or project consultation</p>
                      <p class="contact-info">
                          <a href="mailto:info@seima.com.au" class="contact-link">info@seima.com.au</a> | 
                          <a href="https://www.seima.com.au" class="contact-link">www.seima.com.au</a>
                      </p>
                  </div>
                  
                  <p style="margin-top: 32px; color: #374151;">
                      Best regards,<br>
                      <strong>The Seima Team</strong>
                  </p>
              </div>
              
              <div class="footer">
                  <div class="footer-links">
                      <a href="https://www.seima.com.au" class="footer-link">Visit Our Website</a>
                      <a href="mailto:info@seima.com.au" class="footer-link">Contact Support</a>
                  </div>
                  <div class="footer-copyright">
                      © 2024 Seima. Professional bathroom and kitchen solutions. All rights reserved.
                  </div>
              </div>
          </div>
      </body>
      </html>`;
  }

  generateText(userDetails, selectionStats) {
    return `Dear ${userDetails.name || 'Customer'},

Thank you for choosing Seima for your project. Your product selection is attached.

PROJECT SUMMARY:
Customer: ${userDetails.name || ''}
Email: ${userDetails.email || ''}
Project: ${userDetails.project || ''}
Address: ${userDetails.address || ''}
Phone: ${userDetails.phone || ''}
Total Products: ${selectionStats.totalProducts}
Total Rooms: ${selectionStats.totalRooms}

Your selection includes professional specifications, pricing, and structured data files.

If you have any questions, please contact us:
Email: info@seima.com.au
Website: www.seima.com.au

Best regards,
The Seima Team

© 2024 Seima | Generated by Seima Scanner v${CONFIG.VERSION}`;
  }
}

// Create singleton instance
export const emailService = new EmailService(); 