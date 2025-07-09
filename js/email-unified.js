/**
 * Unified Email Service for Seima Scanner
 * Now with beautiful HTML template generation
 * Uses EmailJS as transport but generates HTML internally
 */

import { CONFIG } from './config.js';

// Simple email template generator (inline to avoid extra file dependency)
class SimpleEmailTemplateGenerator {
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

  generateEmailHTML(userDetails, options = {}) {
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
                              <span class="summary-value">${emailData.customerPhone || 'Not provided'}</span>
                          </div>
                          <div class="summary-item">
                              <span class="summary-label">Total Products:</span>
                              <span class="summary-value">${emailData.totalProducts}</span>
                          </div>
                          <div class="summary-item">
                              <span class="summary-label">Rooms:</span>
                              <span class="summary-value">${emailData.totalRooms}</span>
                          </div>
                          <div class="summary-item">
                              <span class="summary-label">Generated:</span>
                              <span class="summary-value">${emailData.currentDate}</span>
                          </div>
                      </div>
                  </div>
                  
                  
                  <div class="contact-section">
                      <h4 class="contact-title">Need Expert Assistance?</h4>
                      <p class="contact-info">Our technical team is ready to help with product specifications, installation guidance, or project consultation.</p>
                                             <p class="contact-info">
                           <a href="mailto:info@seima.com.au" class="contact-link">info@seima.com.au</a><br>
                           <a href="https://www.seima.com.au" class="contact-link">www.seima.com.au</a>
                       </p>
                  </div>
                  
                  
                  
                  <p style="margin-top: 24px; color: #374151;">
                      Best regards,<br>
                      <strong>The Seima Team</strong>
                  </p>
              </div>
              
                                            <div class="footer">
                   <div class="footer-links">
                      <a href="https://www.seima.com.au" class="footer-link">Website</a>
                      <a href="https://www.seima.com.au/products" class="footer-link">Products</a>
                      <a href="https://www.seima.com.au/support" class="footer-link">Support</a>
                      <a href="mailto:info@seima.com.au" class="footer-link">Contact</a>
                  </div>
                                     <div class="footer-copyright">
                       <p>© SEIMA Pty Ltd. All rights reserved. | Generated by Seima app v${emailData.appVersion}</p>
                   </div>
              </div>
          </div>
      </body>
      </html>
    `;
  }

  prepareEmailData(userDetails) {
    return {
      customerName: userDetails.name || 'Customer',
      customerEmail: userDetails.email || '',
      customerProject: userDetails.project || '',
      customerAddress: userDetails.address || '',
      customerPhone: userDetails.phone || '',
      totalProducts: this.getProductCount(),
      totalRooms: this.getRoomCount(),
      appVersion: CONFIG.VERSION || '1.7.0',
      currentDate: new Date().toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      pdfFilename: this.generateFileName(userDetails, 'pdf'),
      csvFilename: this.generateFileName(userDetails, 'csv')
    };
  }

  getProductCount() {
    const selectedProducts = JSON.parse(localStorage.getItem('selectedProducts') || '[]');
    return selectedProducts.length;
  }

  getRoomCount() {
    const selectedProducts = JSON.parse(localStorage.getItem('selectedProducts') || '[]');
    const rooms = new Set(selectedProducts.map(item => item.room).filter(Boolean));
    return rooms.size || 1;
  }

  generateFileName(userDetails, extension) {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const projectName = (userDetails.project || 'seima-selection').replace(/[^a-zA-Z0-9\s]/g, '');
    
    return `${projectName}-${dd}${mm}${yy}.${hh}${min}.${extension}`;
  }
}

// Create template generator instance
const emailTemplateGenerator = new SimpleEmailTemplateGenerator();

export class UnifiedEmailService {
  constructor() {
    this.isInitialized = false;
    this.maxAttachmentSize = CONFIG.EMAIL.MAX_ATTACHMENT_SIZE;
  }

  async init() {
    try {
      // Load EmailJS library if not already loaded
      if (!window.emailjs) {
        await this.loadEmailJS();
      }

      // Initialize EmailJS
      emailjs.init({
        publicKey: CONFIG.EMAIL.PUBLIC_KEY,
      });
      
      this.isInitialized = true;
      console.log('✅ Unified Email Service initialized with HTML template generation');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      return false;
    }
  }

  async loadEmailJS() {
    return new Promise((resolve, reject) => {
      if (window.emailjs) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async sendEmailWithPDF(userDetails, pdfBlob) {
    // Generate CSV data first (outside try block so it's available in catch)
    let csvData = null;
    
    try {
      // First, save CSV locally as immediate backup
      csvData = this.generateCSVData(userDetails);
      if (csvData) {
        this.saveCSVLocally(userDetails, csvData);
      }

      // Check attachment size before sending
      const pdfSizeKB = Math.round(pdfBlob.size / 1024);
      console.log(`📎 PDF size: ${pdfSizeKB}KB`);
      
      // Check if we're in test failure mode
      if (window.testEmailFailure) {
        console.log('🧪 Test failure mode enabled - simulating EmailJS error');
        throw new Error('Test EmailJS failure simulation');
      }
      
      if (pdfBlob.size <= this.maxAttachmentSize) {
        return await this.sendViaEmailJS(userDetails, pdfBlob, csvData);
      } else {
        // PDF too large, use download fallback
        console.log(`📎 PDF too large (${pdfSizeKB}KB > ${Math.round(this.maxAttachmentSize/1024)}KB), downloading instead`);
        return await this.handleLargeFile(userDetails, pdfBlob, csvData);
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      return this.handleEmailFailure(userDetails, pdfBlob, csvData, error);
    }
  }

  async sendViaEmailJS(userDetails, pdfBlob, csvData) {
    try {
      const pdfBase64 = await this.blobToBase64(pdfBlob);
      
      // Generate beautiful HTML email
      const emailHTML = emailTemplateGenerator.generateEmailHTML(userDetails);
      
      const templateParams = {
        to_email: userDetails.email,
        to_name: userDetails.name || 'Customer',
        from_name: 'Seima Team',
        subject: `Seima Product Selection - ${userDetails.name || 'Customer'}`,
        
        // Send the beautiful HTML we generated
        email_html: emailHTML,
        
        // Keep these for compatibility (though HTML is better)
        customer_name: userDetails.name || '',
        customer_email: userDetails.email || '',
        customer_project: userDetails.project || '',
        customer_address: userDetails.address || '',
        customer_phone: userDetails.phone || '',
        customer_telephone: userDetails.phone || '',
        total_products: this.getProductCount(),
        total_rooms: this.getRoomCount(),
        pdf_attachment: pdfBase64,
        pdf_filename: this.generateFileName(userDetails, 'pdf'),
        csv_attachment: csvData ? btoa(csvData) : '',
        csv_filename: csvData ? this.generateFileName(userDetails, 'csv') : '',
        app_version: CONFIG.VERSION || '1.7.0'
      };

      // Add BCC to Seima staff member if contact details exist
      if (userDetails.staffContact && userDetails.staffContact.email) {
        templateParams.bcc_email = userDetails.staffContact.email;
        console.log(`📧 Adding BCC to Seima staff: ${userDetails.staffContact.email}`);
      }

      const result = await emailjs.send(
        CONFIG.EMAIL.SERVICE_ID,
        CONFIG.EMAIL.TEMPLATE_ID,
        templateParams,
        CONFIG.EMAIL.PUBLIC_KEY
      );

      if (result.status === 200) {
        this.showSuccess('✅ Beautiful email sent successfully!');
        return { success: true, method: 'emailjs', result };
      } else {
        throw new Error(`EmailJS returned status ${result.status}`);
      }
    } catch (error) {
      console.error('EmailJS failed:', error);
      throw error;
    }
  }

  // Preview the new email template
  previewEmail(userDetails) {
    const html = emailTemplateGenerator.generateEmailHTML(userDetails || {
      name: 'John Smith',
      email: 'john@example.com',
      project: 'Luxury Apartment Renovation',
      address: '123 Collins Street, Melbourne VIC 3000',
      phone: '+61 3 9123 4567'
    });
    
    // Open preview in new window
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(html);
    previewWindow.document.close();
    
    console.log('📧 Beautiful email preview opened!');
    return html;
  }

  generateCSVData(userDetails) {
    const selectedProducts = this.getSelectedProducts();
    if (!selectedProducts.length) {
      return null;
    }

    const csvLines = [];
    csvLines.push('"Code","Description","Quantity","Price ea inc GST","Price Total inc GST","Notes","Room","Image URL","Diagram URL","Datasheet URL","Website URL"');
    
    selectedProducts.forEach(item => {
      const code = this.cleanForCSV(item.product?.OrderCode || '');
      const desc = this.cleanForCSV(item.product?.Description || '');
      const qty = item.quantity || 1;
      const priceEa = this.cleanForCSV(item.product?.RRP_INCGST || '');
      const priceTotal = this.calculateTotalPrice(priceEa, qty);
      const notes = this.cleanForCSV(item.notes || '');
      const room = this.cleanForCSV(item.room || '');
      const imageUrl = this.cleanForCSV(item.product?.Image_URL || '');
      const diagramUrl = this.cleanForCSV(item.product?.Diagram_URL || '');
      const datasheetUrl = this.cleanForCSV(item.product?.Datasheet_URL || '');
      const websiteUrl = this.cleanForCSV(item.product?.Website_URL || '');
      
      csvLines.push(`"${code}","${desc}","${qty}","${priceEa}","${priceTotal}","${notes}","${room}","${imageUrl}","${diagramUrl}","${datasheetUrl}","${websiteUrl}"`);
    });
    
    return csvLines.join('\n');
  }

  saveCSVLocally(userDetails, csvData) {
    const csvBlob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
    const fileName = this.generateFileName(userDetails, 'csv');
    this.downloadFile(csvBlob, fileName);
    this.showInfo(`CSV file saved locally: ${fileName}`);
  }

  async handleLargeFile(userDetails, pdfBlob, csvData) {
    this.downloadFile(pdfBlob, this.generateFileName(userDetails, 'pdf'));
    
    // Send email without attachment
    return await this.sendNotificationEmail(userDetails);
  }

  async sendNotificationEmail(userDetails) {
    try {
      // Generate beautiful HTML email
      const emailHTML = emailTemplateGenerator.generateEmailHTML(userDetails);
      
      const templateParams = {
        to_email: userDetails.email,
        to_name: userDetails.name || 'Customer',
        from_name: 'Seima Team',
        subject: `Seima Product Selection - ${userDetails.name || 'Customer'}`,
        
        // Send the beautiful HTML we generated
        email_html: emailHTML,
        
        // Keep these for compatibility
        customer_name: userDetails.name || '',
        customer_email: userDetails.email || '',
        customer_project: userDetails.project || '',
        customer_address: userDetails.address || '',
        customer_phone: userDetails.phone || '',
        customer_telephone: userDetails.phone || '',
        total_products: this.getProductCount(),
        total_rooms: this.getRoomCount(),
        pdf_filename: this.generateFileName(userDetails, 'pdf'),
        csv_filename: this.generateFileName(userDetails, 'csv'),
        app_version: CONFIG.VERSION || '1.7.0'
      };

      // Add BCC to Seima staff member if contact details exist
      if (userDetails.staffContact && userDetails.staffContact.email) {
        templateParams.bcc_email = userDetails.staffContact.email;
        console.log(`📧 Adding BCC to Seima staff (notification email): ${userDetails.staffContact.email}`);
      }

      const result = await emailjs.send(
        CONFIG.EMAIL.SERVICE_ID,
        CONFIG.EMAIL.TEMPLATE_ID,
        templateParams,
        CONFIG.EMAIL.PUBLIC_KEY
      );

      if (result.status === 200) {
        this.showSuccess('✅ Beautiful email sent successfully! Files have been downloaded to your device.');
        return { success: true, method: 'emailjs_notification', result };
      } else {
        throw new Error(`EmailJS returned status ${result.status}`);
      }
    } catch (error) {
      console.error('EmailJS notification failed:', error);
      throw error;
    }
  }

  handleEmailFailure(userDetails, pdfBlob, csvData, error) {
    console.error('📧 Email failed, providing fallback options:', error);
    
    // Ensure files are downloaded with better error handling
    let downloadedFiles = [];
    
    try {
      if (pdfBlob) {
        const pdfFilename = this.generateFileName(userDetails, 'pdf');
        this.downloadFile(pdfBlob, pdfFilename);
        downloadedFiles.push('PDF');
        console.log('✅ PDF downloaded as fallback:', pdfFilename);
      }
    } catch (pdfError) {
      console.error('❌ Failed to download PDF:', pdfError);
    }
    
    try {
      if (csvData) {
        const csvBlob = new Blob([csvData], { type: 'text/csv;charset=utf-8' });
        const csvFilename = this.generateFileName(userDetails, 'csv');
        this.downloadFile(csvBlob, csvFilename);
        downloadedFiles.push('CSV');
        console.log('✅ CSV downloaded as fallback:', csvFilename);
      }
    } catch (csvError) {
      console.error('❌ Failed to download CSV:', csvError);
    }
    
         // Show user notification about what happened
     if (downloadedFiles.length > 0) {
       this.showError(`Cannot attach file to email. PDF file has been downloaded to your device`);
     } else {
       this.showError(`Email sending failed and file download failed. Please try again or contact support.`);
     }
    
    return { 
      success: false, 
      method: 'download_fallback', 
      error: error.message,
      downloadedFiles: downloadedFiles,
      message: downloadedFiles.length > 0 ? 'Files have been downloaded. Please attach them to an email manually.' : 'Download failed. Please try again.'
    };
  }

  offerMailtoFallback(userDetails) {
    const subject = encodeURIComponent(`Seima Product Selection - ${userDetails.name || 'Customer'}`);
    const body = encodeURIComponent(this.generateEmailMessage(userDetails, true));
    const mailtoUrl = `mailto:info@seima.com.au?subject=${subject}&body=${body}`;
    
    this.showInfo('Opening email client... Please attach the downloaded files manually.');
    window.open(mailtoUrl, '_blank');
  }

  // Utility methods
  generateEmailMessage(userDetails, isDownloadMode = false) {
    const productCount = this.getProductCount();
    const roomCount = this.getRoomCount();
    
    const downloadNote = isDownloadMode ? 
      '\n\nYour selection files have been downloaded to your device. Please attach them to this email.' : 
      '\n\nYour selections are attached to this email.';

    return `Dear ${userDetails.name || 'Customer'},

Thank you for selecting Seima products. Your selection summary is below.

Summary:
Customer:     ${userDetails.name || ''}
Project:      ${userDetails.project || ''}
Address:      ${userDetails.address || ''}
Email:        ${userDetails.email || ''}
# Products:   ${productCount}
# Rooms:      ${roomCount}${downloadNote}

If you have any questions about these products, please contact us at info@seima.com.au or visit www.seima.com.au.

Best regards,
Seima Team`;
  }

  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        resolve(`data:${blob.type};base64,${base64}`);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  downloadFile(blob, filename) {
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      
      // Add to DOM, click, and remove
      document.body.appendChild(a);
      a.click();
      
      // Clean up after a short delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      console.log(`📁 File download initiated: ${filename}`);
      return true;
    } catch (error) {
      console.error('❌ Download failed:', error);
      
      // Fallback: Try to open blob URL in new window
      try {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        console.log(`📁 Fallback: Opening file in new window: ${filename}`);
        return true;
      } catch (fallbackError) {
        console.error('❌ Fallback download also failed:', fallbackError);
        return false;
      }
    }
  }

  generateFileName(userDetails, extension) {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const projectName = (userDetails.project || 'seima-selection').replace(/[^a-zA-Z0-9\s]/g, '');
    
    return `${projectName}-${dd}${mm}${yy}.${hh}${min}.${extension}`;
  }

  getSelectedProducts() {
    const storedSelection = JSON.parse(localStorage.getItem('selection') || '[]');
    const selectedProducts = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SELECTED_PRODUCTS) || '[]');
    
    return selectedProducts.length > 0 ? selectedProducts : 
           storedSelection.map(item => ({ product: item, room: item.Room, notes: item.Notes, quantity: item.Quantity || 1 }));
  }

  getProductCount() {
    return this.getSelectedProducts().length;
  }

  getRoomCount() {
    const selectedProducts = this.getSelectedProducts();
    const rooms = new Set(selectedProducts.map(item => item.room).filter(Boolean));
    return rooms.size || 1;
  }

  calculateTotalPrice(priceEa, quantity) {
    const price = parseFloat(priceEa.toString().replace(/[^0-9.]/g, '')) || 0;
    const total = price * (quantity || 1);
    return total > 0 ? total.toFixed(2) : '';
  }

  cleanForCSV(value) {
    if (!value) return '';
    return value.toString().replace(/"/g, '""').replace(/[\r\n]/g, ' ');
  }

  // UI feedback methods
  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showInfo(message) {
    this.showNotification(message, 'info');
  }

  // Debug and testing methods
  testBccConfiguration() {
    console.log('🧪 Testing BCC Configuration...');
    
    try {
      const staffContact = JSON.parse(localStorage.getItem('staffContactDetails') || 'null');
      
      if (!staffContact) {
        console.log('❌ No Seima staff contact configured');
        console.log('   👉 Use "Seima Contact" button on home page to set up staff details');
        return false;
      }
      
      if (!staffContact.email) {
        console.log('❌ Staff contact exists but no email address');
        console.log('   👉 Update staff contact details with a valid email address');
        return false;
      }
      
      console.log('✅ BCC Configuration looks good:');
      console.log(`   📧 Staff Email: ${staffContact.email}`);
      console.log(`   👤 Staff Name: ${staffContact.name || 'Not provided'}`);
      console.log(`   📱 Staff Mobile: ${staffContact.mobile || 'Not provided'}`);
      
      return true;
    } catch (error) {
      console.error('❌ Error checking BCC configuration:', error);
      return false;
    }
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      padding: 15px 20px;
      border-radius: 6px;
      color: white;
      font-weight: ${type === 'error' ? '600' : 'bold'};
      max-width: 450px;
      font-size: 14px;
      line-height: 1.4;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      background: ${type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#2563eb'};
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }
}

// Global instance
export const emailService = new UnifiedEmailService();

// Expose preview function globally for easy testing
window.previewEmail = (userDetails) => emailService.previewEmail(userDetails);
window.testEmailBcc = () => emailService.testBccConfiguration();

// Test download functionality
window.testDownload = () => {
  console.log('🧪 Testing download functionality...');
  
  // Create test PDF blob
  const testPdfContent = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj xref 0 4 0000000000 65535 f 0000000009 00000 n 0000000058 00000 n 0000000115 00000 n trailer<</Size 4/Root 1 0 R>>startxref 182 %%EOF';
  const pdfBlob = new Blob([testPdfContent], { type: 'application/pdf' });
  
  // Create test CSV blob
  const csvContent = 'Code,Description,Quantity\nTEST001,Test Product,1';
  const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  
  // Test downloads
  const pdfResult = emailService.downloadFile(pdfBlob, 'test-download.pdf');
  const csvResult = emailService.downloadFile(csvBlob, 'test-download.csv');
  
  console.log(`📁 PDF download result: ${pdfResult ? '✅ Success' : '❌ Failed'}`);
  console.log(`📁 CSV download result: ${csvResult ? '✅ Success' : '❌ Failed'}`);
  
  return { pdf: pdfResult, csv: csvResult };
};

// Test EmailJS failure simulation
window.testEmailFailure = false; // Global flag to simulate failures

window.simulateEmailFailure = () => {
  console.log('🧪 Enabling EmailJS failure simulation...');
  window.testEmailFailure = true;
  
  // Create normal-sized test PDF
  const testPdfContent = '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj xref 0 4 0000000000 65535 f 0000000009 00000 n 0000000058 00000 n 0000000115 00000 n trailer<</Size 4/Root 1 0 R>>startxref 182 %%EOF';
  const testPdfBlob = new Blob([testPdfContent], { type: 'application/pdf' });
  
  const testUserDetails = {
    name: 'Test Customer',
    email: 'test@example.com',
    project: 'Test Project'
  };
  
  console.log('📧 Attempting email send (will fail and trigger download fallback)...');
  
  return emailService.sendEmailWithPDF(testUserDetails, testPdfBlob)
    .finally(() => {
      console.log('🧪 Disabling failure simulation');
      window.testEmailFailure = false;
    });
};

// Test large PDF email fallback
window.testLargePdfFallback = () => {
  console.log('🧪 Testing large PDF email fallback...');
  
  // Create a large PDF blob (over 15MB to trigger fallback)
  const largeContent = new Array(16 * 1024 * 1024).fill('x').join(''); // 16MB of data
  const largePdfBlob = new Blob([largeContent], { type: 'application/pdf' });
  
  console.log(`📎 Created test PDF: ${Math.round(largePdfBlob.size / (1024*1024))}MB (should trigger fallback)`);
  
  // Test the email with PDF function (this should trigger download fallback)
  const testUserDetails = {
    name: 'Test Customer',
    email: 'test@example.com',
    project: 'Test Project'
  };
  
  return emailService.sendEmailWithPDF(testUserDetails, largePdfBlob);
}; 