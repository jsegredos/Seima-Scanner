/**
 * Unified Email Service for Seima Scanner
 * Consolidates email functionality with multiple fallback strategies
 */

import { CONFIG } from './config.js';

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
      console.log('✅ Unified Email Service initialized successfully');
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
    try {
      // First, save CSV locally as immediate backup
      const csvData = this.generateCSVData(userDetails);
      if (csvData) {
        this.saveCSVLocally(userDetails, csvData);
      }

      // Try EmailJS with PDF attachment
      if (pdfBlob.size <= this.maxAttachmentSize) {
        return await this.sendViaEmailJS(userDetails, pdfBlob, csvData);
      } else {
        // PDF too large, offer alternative
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
      
      const templateParams = {
        to_email: userDetails.email,
        to_name: userDetails.name || 'Customer',
        from_name: 'Seima Team',
        subject: `Seima Product Selection - ${userDetails.name || 'Customer'}`,
        message: this.generateEmailMessage(userDetails),
        customer_name: userDetails.name || '',
        customer_project: userDetails.project || '',
        customer_address: userDetails.address || '',
        customer_phone: userDetails.phone || '',
        total_products: this.getProductCount(),
        total_rooms: this.getRoomCount(),
        pdf_attachment: pdfBase64,
        pdf_filename: this.generateFileName(userDetails, 'pdf')
      };

      // Add BCC to Seima staff member if contact details exist
      if (userDetails.staffContact && userDetails.staffContact.email) {
        templateParams.bcc_email = userDetails.staffContact.email;
        console.log(`📧 Adding BCC to Seima staff: ${userDetails.staffContact.email}`);
        console.log(`📧 BCC Configuration:`, {
          bcc_email: templateParams.bcc_email,
          customer_email: templateParams.to_email,
          staff_name: userDetails.staffContact.name || 'Unknown'
        });
      } else {
        console.log(`📧 No BCC: Seima staff contact not configured`);
        if (!userDetails.staffContact) {
          console.log(`   ℹ️ No staff contact details found. Set via "Seima Contact" button on home page.`);
        } else if (!userDetails.staffContact.email) {
          console.log(`   ℹ️ Staff contact exists but no email address provided.`);
        }
      }

      const result = await emailjs.send(
        CONFIG.EMAIL.SERVICE_ID,
        CONFIG.EMAIL.TEMPLATE_ID,
        templateParams,
        CONFIG.EMAIL.PUBLIC_KEY
      );

      if (result.status === 200) {
        this.showSuccess('Email sent successfully with PDF attachment!');
        return { success: true, method: 'emailjs', result };
      } else {
        throw new Error(`EmailJS returned status ${result.status}`);
      }
    } catch (error) {
      console.error('EmailJS failed:', error);
      throw error;
    }
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
      const templateParams = {
        to_email: userDetails.email,
        to_name: userDetails.name || 'Customer',
        from_name: 'Seima Team',
        subject: `Seima Product Selection - ${userDetails.name || 'Customer'}`,
        message: this.generateEmailMessage(userDetails, true),
        customer_name: userDetails.name || '',
        customer_project: userDetails.project || '',
        customer_address: userDetails.address || '',
        total_products: this.getProductCount(),
        total_rooms: this.getRoomCount()
      };

      // Add BCC to Seima staff member if contact details exist
      if (userDetails.staffContact && userDetails.staffContact.email) {
        templateParams.bcc_email = userDetails.staffContact.email;
        console.log(`📧 Adding BCC to Seima staff (notification email): ${userDetails.staffContact.email}`);
        console.log(`📧 BCC Configuration (notification):`, {
          bcc_email: templateParams.bcc_email,
          customer_email: templateParams.to_email,
          staff_name: userDetails.staffContact.name || 'Unknown'
        });
      } else {
        console.log(`📧 No BCC (notification): Seima staff contact not configured`);
        if (!userDetails.staffContact) {
          console.log(`   ℹ️ No staff contact details found. Set via "Seima Contact" button on home page.`);
        } else if (!userDetails.staffContact.email) {
          console.log(`   ℹ️ Staff contact exists but no email address provided.`);
        }
      }

      const result = await emailjs.send(
        CONFIG.EMAIL.SERVICE_ID,
        CONFIG.EMAIL.TEMPLATE_ID,
        templateParams,
        CONFIG.EMAIL.PUBLIC_KEY
      );

      if (result.status === 200) {
        this.showSuccess('Email sent successfully! Files have been downloaded to your device.');
        return { success: true, method: 'emailjs_notification', result };
      }
    } catch (error) {
      return this.handleEmailFailure(userDetails, null, null, error);
    }
  }

  handleEmailFailure(userDetails, pdfBlob, csvData, error) {
    console.error('All email methods failed:', error);
    
    // Offer mailto fallback
    this.offerMailtoFallback(userDetails);
    
    // Ensure files are downloaded
    if (pdfBlob) {
      this.downloadFile(pdfBlob, this.generateFileName(userDetails, 'pdf'));
    }
    if (csvData) {
      const csvBlob = new Blob([csvData], { type: 'text/csv' });
      this.downloadFile(csvBlob, this.generateFileName(userDetails, 'csv'));
    }
    
    return { 
      success: false, 
      method: 'download_fallback', 
      error: error.message,
      message: 'Files have been downloaded. Please attach them to an email manually.'
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
      console.log('');
      console.log('⚠️  IMPORTANT: Make sure your EmailJS template has {{bcc_email}} configured in the Settings tab!');
      console.log('   📚 See EmailJS-Setup-Guide.md for complete BCC setup instructions');
      
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
      font-weight: bold;
      max-width: 400px;
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

// Expose test function globally for debugging
window.testEmailBcc = () => emailService.testBccConfiguration(); 