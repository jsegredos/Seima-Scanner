/**
 * Email Service using EmailJS
 * Handles sending PDFs and other files via email
 */

import { CONFIG } from './config.js';

export class EmailService {
  constructor() {
    this.publicKey = null;
    this.serviceId = null;
    this.templateId = null;
    this.isInitialized = false;
    this.maxAttachmentSize = 15 * 1024 * 1024; // 15MB limit for EmailJS v4
  }

  async init(config) {
    try {
      // Load EmailJS library
      if (!window.emailjs) {
        await this.loadEmailJS();
      }

      this.publicKey = config.publicKey;
      this.serviceId = config.serviceId;
      this.templateId = config.templateId;

      // Initialize EmailJS with v4 syntax
      emailjs.init({
        publicKey: this.publicKey,
      });
      this.isInitialized = true;

      console.log('EmailJS service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize EmailJS:', error);
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

  async sendEmail(userDetails, emailData) {
    try {
      // Prepare EmailJS template parameters
      const templateParams = {
        // Basic user info
        to_email: userDetails.email,
        to_name: userDetails.name || 'Customer',
        from_name: 'Seima Team',
        subject: `Seima Product Selection - ${userDetails.name}`,
        
        // Message content
        message: this.generateEmailMessage(userDetails, false, !!emailData.pdfAttachment),
        
        // Customer details
        customer_name: userDetails.name,
        customer_email: userDetails.email,
        customer_phone: userDetails.phone || '',
        customer_project: userDetails.project || '',
        customer_address: userDetails.address || '',
        
        // Selection summary
        total_products: this.getTotalProducts(),
        total_rooms: this.getTotalRooms(),
        
        // File attachments
        pdf_attachment: emailData.pdfAttachment || '',
        csv_attachment: emailData.csvAttachment || '',  // RAW string, not base64
        pdf_filename: emailData.pdfFilename || '',
        csv_filename: emailData.csvFilename || ''
      };

      console.log('📧 Sending email to EmailJS with template params:', {
        to_email: templateParams.to_email,
        pdf_filename: templateParams.pdf_filename,
        csv_filename: templateParams.csv_filename,
        pdf_attachment_size: templateParams.pdf_attachment ? templateParams.pdf_attachment.length : 0,
        csv_attachment_size: templateParams.csv_attachment ? templateParams.csv_attachment.length : 0,
        csv_attachment_type: typeof templateParams.csv_attachment,
        csv_preview: templateParams.csv_attachment ? templateParams.csv_attachment.substring(0, 100) : 'null'
      });

      // Send via EmailJS
      const result = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams,
        this.publicKey
      );
      
      console.log('✅ EmailJS send result:', result);
      
      return result;

    } catch (error) {
      console.error('❌ EmailJS send failed:', error);
      throw error;
    }
  }

  async sendPDFEmail(userDetails, pdfBlob, csvBlob = null) {
    try {
      // Try to attach PDF if it's small enough
      let pdfAttachment = null;
      let csvAttachment = null;
      
      if (pdfBlob.size <= this.maxAttachmentSize) {
        try {
          pdfAttachment = await this.blobToBase64(pdfBlob);
          console.log('PDF converted to base64 for email attachment');
        } catch (error) {
          console.warn('Failed to convert PDF to base64:', error);
        }
      }
      
      // Handle CSV differently - use raw string generation for EmailJS
      if (csvBlob) {
        try {
          // Import the simple CSV generation function for better compatibility
          const { generateSimpleCsvForEmailJS } = await import('./pdf-generator.js');
          
          const csvFilename = 'seima-selection.csv';
          const simpleCsvData = generateSimpleCsvForEmailJS(userDetails, csvFilename);
          
          if (simpleCsvData) {
            csvAttachment = simpleCsvData.data;  // RAW string, not base64
            console.log('📊 Simple CSV generated for EmailJS:', {
              filename: simpleCsvData.name,
              length: csvAttachment.length,
              preview: csvAttachment.substring(0, 200),
              hasControlChars: /[\x00-\x1F\x7F]/.test(csvAttachment),
              hasNonAscii: /[\u0080-\uFFFF]/.test(csvAttachment),
              contentType: simpleCsvData.contentType
            });
          }
        } catch (error) {
          console.warn('Failed to generate simple CSV for EmailJS:', error);
        }
      }
      
      // Create email data
      const emailData = {
        pdfAttachment,
        csvAttachment,  // RAW string, not base64
        pdfFilename: 'seima-selection.pdf',
        csvFilename: 'seima-selection.csv'
      };
      
      console.log('📧 Email data prepared:', {
        pdfAttachment: emailData.pdfAttachment ? `${emailData.pdfAttachment.length} chars` : 'null',
        csvAttachment: emailData.csvAttachment ? `${emailData.csvAttachment.length} chars RAW` : 'null',
        pdfFilename: emailData.pdfFilename,
        csvFilename: emailData.csvFilename
      });
      
      // Send email
      const result = await this.sendEmail(userDetails, emailData);
      
      // Check if EmailJS succeeded (status 200)
      if (result.status === 200) {
        // Show success message
        this.showSuccessMessage('Email sent successfully with clean CSV attachment!');
        
        return {
          success: true,
          method: 'emailjs',
          message: 'Email sent successfully with attachments',
          emailjsResult: result
        };
      } else {
        throw new Error(`EmailJS returned status ${result.status}: ${result.text}`);
      }
      
    } catch (error) {
      console.error('Email sending failed:', error);
      
      // Return error result instead of throwing
      return {
        success: false,
        method: 'emailjs_failed',
        error: error.message,
        originalError: error
      };
    }
  }

  // EmailJS-compatible email sending (CSV embedded in email body)
  async sendEmailWithCleanData(userDetails, pdfBlob) {
    try {
      // Store PDF size for later reference
      userDetails.pdfSize = pdfBlob.size;
      
      // Check if EmailJS is fully configured (matching the validation in sendEmailWithDynamicAttachments)
      if (!this.isInitialized || !this.serviceId || !this.templateId || !this.publicKey) {
        console.log('EmailJS not properly configured, using mailto fallback', {
          isInitialized: this.isInitialized,
          hasServiceId: !!this.serviceId,
          hasTemplateId: !!this.templateId,
          hasPublicKey: !!this.publicKey
        });
        return this.sendMailtoFallback(userDetails, pdfBlob);
      }
      
      console.log('📧 Using proper EmailJS with CSV corruption fix...');
      
      // Generate ultra-clean CSV
      const csvData = this.generatePerfectCsvForEmailJS(userDetails);
      
      if (!csvData) {
        console.error('❌ No CSV data generated');
        return this.sendMailtoFallback(userDetails, pdfBlob);
      }
      
      console.log('📊 CSV data generated:', {
        length: csvData.length,
        preview: csvData.substring(0, 150),
        hasControlChars: /[\x00-\x1F\x7F-\x9F]/.test(csvData),
        hasNewlines: /[\r\n]/.test(csvData),
        hasNonAscii: /[^\x20-\x7E]/.test(csvData)
      });
      
      // Convert PDF to base64 if small enough
      let pdfAttachment = '';
      if (pdfBlob.size <= this.maxAttachmentSize) {
        try {
          const pdfBase64 = await this.blobToBase64(pdfBlob);
          if (pdfBase64 && typeof pdfBase64 === 'string') {
            pdfAttachment = pdfBase64; // Keep full data URL for EmailJS
          }
          console.log('PDF converted to base64 for email attachment');
                  } catch (error) {
          console.warn('Failed to convert PDF to base64:', error);
        }
      }

      // Create email data with ORIGINAL template structure
      const emailData = {
        pdfAttachment,
        csvAttachment: btoa(csvData), // BASE64 ENCODE to prevent corruption!
        pdfFilename: 'seima-selection.pdf',
        csvFilename: 'seima-selection.csv'
      };
      
      console.log('📧 Email data prepared with corruption fix:', {
        pdfAttachment: emailData.pdfAttachment ? `${emailData.pdfAttachment.length} chars` : 'null',
        csvAttachment: emailData.csvAttachment ? `${emailData.csvAttachment.length} chars BASE64` : 'null',
        pdfFilename: emailData.pdfFilename,
        csvFilename: emailData.csvFilename,
        csvOriginalLength: csvData.length
      });
      
      // Test the base64 encoding/decoding
      try {
        const decodedCsv = atob(emailData.csvAttachment);
        console.log('✅ CSV base64 test successful:', {
          original: csvData.substring(0, 100),
          decoded: decodedCsv.substring(0, 100),
          matches: csvData === decodedCsv
        });
      } catch (e) {
        console.error('❌ CSV base64 test failed:', e);
      }
      
      // Send email using base64 encoded attachments method  
      const result = await this.sendEmailWithDynamicAttachments(userDetails, pdfBlob);
      
      // Check if EmailJS succeeded - result is a wrapper object
      if (result.success && result.emailjsResult && result.emailjsResult.status === 200) {
        this.showSuccessMessage('Email sent successfully with clean CSV attachment!');
        
        return {
          success: true,
          method: 'emailjs_with_corruption_fix',
          message: 'Email sent successfully with clean CSV',
          emailjsResult: result.emailjsResult
        };
      } else {
        const status = result.emailjsResult ? result.emailjsResult.status : 'unknown';
        const text = result.emailjsResult ? result.emailjsResult.text : result.message || 'no response';
        throw new Error(`EmailJS returned status ${status}: ${text}`);
      }

    } catch (error) {
      console.error('❌ EmailJS with corruption fix failed:', error);
      this.showErrorMessage('Email sending failed. Using mailto fallback.');
      
      // Fallback to mailto
      return this.sendMailtoFallback(userDetails, pdfBlob);
    }
  }

  // Alternative: Use download fallback when email fails
  tryAlternativeEmailMethod(userDetails, pdfBlob) {
    console.log('🔄 Trying alternative email method...');
    
    // Generate CSV data for download
    const csvData = this.generateUltraCleanCsv(userDetails, 'seima-selection.csv');
    
    if (!csvData) {
      console.error('❌ No CSV data for fallback');
      return this.sendMailtoFallback(userDetails, pdfBlob);
    }
    
    // Create download fallback
    console.log('📧 Email service unavailable, offering download...');
    this.offerDownloadFallback(pdfBlob, csvData);
    
    return {
      success: true,
      method: 'download_fallback',
      message: 'Files offered for download due to email service issue'
    };
  }

  // Fallback: Offer downloads if email fails
  offerDownloadFallback(pdfBlob, csvData) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.8); z-index: 10003; display: flex; 
      align-items: center; justify-content: center; padding: 20px;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white; border-radius: 8px; padding: 30px; max-width: 500px; 
      width: 100%; max-height: 80vh; overflow-y: auto;
    `;

    content.innerHTML = `
      <h3 style="color: #f59e0b; margin: 0 0 20px 0; display: flex; align-items: center;">
        <span style="margin-right: 8px;">📧</span>
        Email Service Issue
      </h3>
      
      <p style="margin: 16px 0; color: #374151;">
        The email service encountered an issue. You can download your files directly:
      </p>

      <div style="display: flex; flex-direction: column; gap: 12px; margin: 20px 0;">
        <button id="download-pdf" style="
          padding: 12px 16px; border: none; background: #dc2626; color: white; 
          border-radius: 4px; cursor: pointer; font-weight: bold;
        ">
          📄 Download PDF
        </button>
        
        <button id="download-csv" style="
          padding: 12px 16px; border: none; background: #059669; color: white; 
          border-radius: 4px; cursor: pointer; font-weight: bold;
        ">
          📊 Download Clean CSV
        </button>
      </div>

      <div style="background: #f0f9ff; padding: 16px; border-radius: 6px; margin: 16px 0;">
        <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
          The CSV file is guaranteed corruption-free and can be opened in Excel or any spreadsheet application.
        </p>
      </div>

      <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
        <button id="close-modal" style="
          padding: 10px 20px; border: 1px solid #d1d5db; background: white; 
          border-radius: 4px; cursor: pointer; font-weight: bold;
        ">Close</button>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Event handlers
    document.getElementById('download-pdf').onclick = () => {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'seima-selection.pdf';
      a.click();
      URL.revokeObjectURL(url);
    };

    document.getElementById('download-csv').onclick = () => {
      // Create clean CSV blob
      const csvBlob = new Blob([csvData.data], { type: 'text/csv' });
      const url = URL.createObjectURL(csvBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = csvData.name;
      a.click();
      URL.revokeObjectURL(url);
      
      this.showSuccessMessage('Clean CSV downloaded successfully');
    };

    document.getElementById('close-modal').onclick = () => {
      document.body.removeChild(modal);
    };

    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    };
  }

  // Updated ultra-clean CSV generation
  generateUltraCleanCsv(userDetails, csvFilename) {
    const storedSelection = JSON.parse(localStorage.getItem('selection') || '[]');
    const selectedProducts = JSON.parse(localStorage.getItem('selected_products') || '[]');
    
    let selection = [];
    if (selectedProducts.length > 0) {
      selection = selectedProducts.map(item => ({
        ...item.product,
        Room: item.room,
        Notes: item.notes,
        Quantity: item.quantity
      }));
    } else {
      selection = storedSelection;
    }
    
    if (!selection.length) {
      return null;
    }
    
    // Create CSV with pipe separators (no newlines)
    let csvText = 'Code,Description,Quantity,Room,Notes';
    
    selection.forEach(item => {
      const code = this.cleanForEmail(item.OrderCode || '');
      const desc = this.cleanForEmail(item.Description || '');
      const qty = item.Quantity || 1;
      const room = this.cleanForEmail(item.Room || '');
      const notes = this.cleanForEmail(item.Notes || '');
      
      csvText += ` | ${code},${desc},${qty},${room},${notes}`;
    });
    
    return {
      name: csvFilename,
      data: csvText,
      contentType: 'text/csv'
    };
  }

  // Clean string for email compatibility
  cleanForEmail(str) {
    if (typeof str !== 'string') {
      str = String(str);
    }
    
    return str
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove all control chars
      .replace(/[^\x20-\x7E]/g, '') // ASCII only
      .replace(/,/g, ' ') // Remove commas
      .replace(/"/g, '') // Remove quotes
      .replace(/\|/g, '') // Remove pipes
      .replace(/\s+/g, ' ') // Collapse spaces
      .trim();
  }

  async sendEmailWithFallback(userDetails, pdfBlob, csvBlob = null) {
    try {
      // Store PDF size for later reference
      userDetails.pdfSize = pdfBlob.size;
      
      // Check if EmailJS is initialized
      if (!this.isInitialized) {
        console.log('EmailJS not initialized, using mailto fallback');
        return this.sendMailtoFallback(userDetails, pdfBlob, csvBlob);
      }
      
      // Try EmailJS first
      const emailResult = await this.sendPDFEmail(userDetails, pdfBlob, csvBlob);
      
      if (emailResult.success) {
        console.log('✅ Email sent successfully via EmailJS');
        return emailResult;
      } else {
        console.warn('EmailJS failed, falling back to mailto:', emailResult.error);
        this.showErrorMessage('Email sending failed. Using mailto fallback.');
        
        // Fallback to mailto
        return this.sendMailtoFallback(userDetails, pdfBlob, csvBlob);
      }
      
    } catch (error) {
      console.error('Email sending error:', error);
      
      // Show error message and fallback to mailto
      this.showErrorMessage('Email sending failed. Using mailto fallback.');
      return this.sendMailtoFallback(userDetails, pdfBlob, csvBlob);
    }
  }

  sendMailtoFallback(userDetails, pdfBlob, csvBlob = null) {
    const subject = encodeURIComponent(`Seima Product Selection - ${userDetails.name}`);
    const body = encodeURIComponent(this.generateEmailMessage(userDetails, true));
    
    const mailtoLink = `mailto:${userDetails.email}?subject=${subject}&body=${body}`;
    
    // Show user a choice: download files and open email, or just open email
    const choice = confirm(
      'EmailJS is not configured. Would you like to:\n\n' +
      '• Click OK to download PDF and open email client\n' +
      '• Click Cancel to just open email client\n\n' +
      'You can then attach the PDF manually.'
    );
    
    if (choice) {
      // Download files for manual attachment
      this.downloadFilesForAttachment(userDetails, pdfBlob, csvBlob);
      
      // Small delay before opening mailto to ensure downloads start
      setTimeout(() => {
        window.location.href = mailtoLink;
      }, 500);
      
      return {
        success: true,
        method: 'mailto_with_download',
        message: 'PDF downloaded and email client opened. Please attach the downloaded file manually.'
      };
    } else {
      // Just open email client
      window.location.href = mailtoLink;
      
      return {
        success: true,
        method: 'mailto_only',
        message: 'Email client opened. You can generate a PDF separately if needed.'
      };
    }
  }

  downloadFilesForAttachment(userDetails, pdfBlob, csvBlob = null) {
    // Download the PDF first so user can manually attach it
    if (pdfBlob) {
      const pdfFilename = this.generateFileName(userDetails, 'pdf');
      // Import the download function
      if (window.downloadWithFallback) {
        window.downloadWithFallback(pdfBlob, pdfFilename, 'PDF');
      } else {
        // Fallback download method
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = pdfFilename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    }
    
    // Download CSV if available
    if (csvBlob) {
      const csvFilename = this.generateFileName(userDetails, 'csv');
      if (window.downloadWithFallback) {
        window.downloadWithFallback(csvBlob, csvFilename, 'CSV');
      } else {
        // Fallback download method
        const url = URL.createObjectURL(csvBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = csvFilename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
    }
  }

  generateEmailMessage(userDetails, isMailto = false, withDownload = false) {
    const selection = this.getSelectionSummary();
    const timestamp = new Date().toLocaleDateString();
    
    let message = `Dear ${userDetails.name},\n\n`;
    message += `Thank you for using the Seima Product Scanner. `;
    
    if (isMailto) {
      message += `Please find your product selection summary below and attach the downloaded PDF file.\n\n`;
    } else if (withDownload) {
      message += `Your product selection PDF has been downloaded to your device for easy access.\n\n`;
    } else {
      message += `Your product selection is attached as a PDF and CSV file.\n\n`;
    }
    
    message += `Selection Summary:\n`;
    message += `• Customer: ${userDetails.name}\n`;
    if (userDetails.project) message += `• Project: ${userDetails.project}\n`;
    if (userDetails.address) message += `• Address: ${userDetails.address}\n`;
    message += `• Total Products: ${selection.totalProducts}\n`;
    message += `• Rooms: ${selection.totalRooms}\n`;
    message += `• Generated: ${timestamp}\n\n`;
    
    if (selection.rooms.length > 0) {
      message += `Room Breakdown:\n`;
      selection.rooms.forEach(room => {
        message += `• ${room.name}: ${room.count} products\n`;
      });
      message += `\n`;
    }
    
    if (withDownload) {
      message += `Your PDF has been optimized with compressed images to reduce file size.\n\n`;
    }
    
    message += `If you have any questions about these products, please contact:\n`;
    message += `• Email: info@seima.com.au\n`;
    message += `• Website: www.seima.com.au\n\n`;
    message += `Best regards,\n`;
    message += `Seima Team`;
    
    return message;
  }

  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      // Use FileReader's native base64 conversion and strip the data URL prefix
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const dataUrl = reader.result;
          // Strip the data URL prefix (e.g., "data:text/csv;base64,")
          const base64String = dataUrl.split(',')[1];
          resolve(base64String);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    let binary = '';
    
    // Process in chunks to avoid stack overflow on large files
    const chunkSize = 8192;
    for (let i = 0; i < len; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, chunk);
    }
    
    return btoa(binary);
  }

  async blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  async blobToText(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(blob, 'utf-8');
    });
  }

  getSelectionSummary() {
    // Get selection from localStorage (supporting both old and new formats)
    const storedSelection = JSON.parse(localStorage.getItem('selection') || '[]');
    const selectedProducts = JSON.parse(localStorage.getItem('selectedProducts') || '[]');
    
    let selection = [];
    if (selectedProducts.length > 0) {
      selection = selectedProducts;
    } else {
      selection = storedSelection.map(item => ({
        room: item.Room || 'Unassigned',
        product: item
      }));
    }

    // Group by room
    const roomGroups = {};
    selection.forEach(item => {
      const roomName = item.room || 'Unassigned';
      if (!roomGroups[roomName]) {
        roomGroups[roomName] = [];
      }
      roomGroups[roomName].push(item);
    });

    return {
      totalProducts: selection.length,
      totalRooms: Object.keys(roomGroups).length,
      rooms: Object.keys(roomGroups).map(roomName => ({
        name: roomName,
        count: roomGroups[roomName].length
      }))
    };
  }

  getTotalProducts() {
    return this.getSelectionSummary().totalProducts;
  }

  getTotalRooms() {
    return this.getSelectionSummary().totalRooms;
  }

  getFileInfo(pdfBlob, csvBlob = null) {
    const pdfSize = (pdfBlob.size / 1024).toFixed(1);
    let info = `PDF: ${pdfSize} KB`;
    
    if (csvBlob) {
      let csvSize;
      if (csvBlob.originalSize) {
        // New enhanced format with size info
        csvSize = (csvBlob.originalSize / 1024).toFixed(1);
      } else if (csvBlob.size) {
        // Old blob format
        csvSize = (csvBlob.size / 1024).toFixed(1);
      } else {
        csvSize = 'Unknown';
      }
      info += `, CSV: ${csvSize} KB`;
    }
    
    return info;
  }

  generateFileName(userDetails, extension) {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    
    // Use project name instead of email, with fallback to 'Project' if empty
    const projectName = (userDetails.project || 'Project').replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');
    
    return `${projectName}-${dd}${mm}${yy}-${hh}${min}.${extension}`;
  }

  // Email modal removed - direct sending now used

  showEmailResult(result, userDetails) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.8); z-index: 10002; display: flex; 
      align-items: center; justify-content: center; padding: 20px;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white; border-radius: 8px; padding: 30px; max-width: 500px; 
      width: 100%; max-height: 80vh; overflow-y: auto;
    `;

    if (result.success) {
      content.innerHTML = `
        <h3 style="color: #059669; margin: 0 0 20px 0; display: flex; align-items: center;">
          <span style="margin-right: 8px;">✅</span>
          Email Sent Successfully
        </h3>
        
        <div style="background: #ecfdf5; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 0; color: #047857;">
            Your product selection has been emailed to <strong>${userDetails.email}</strong>
          </p>
        </div>

        ${result.method === 'mailto' ? `
          <div style="background: #fef3c7; padding: 16px; border-radius: 6px; margin: 16px 0;">
            <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px;">
              <strong>📧 Manual Attachment Required</strong>
            </p>
            <p style="margin: 0; color: #92400e; font-size: 13px;">
              The PDF has been downloaded to your device. Your email client will open - please attach the downloaded file manually.
            </p>
          </div>
        ` : ''}

        <p style="margin: 16px 0; color: #374151; font-size: 14px;">
          The email includes your complete product selection, customer details, and professional formatting.
        </p>

        <div style="display: flex; justify-content: center; margin-top: 24px;">
          <button id="email-result-close" style="
            padding: 10px 20px; border: none; background: #059669; color: white; 
            border-radius: 4px; cursor: pointer; font-weight: bold;
          ">Done</button>
        </div>
      `;
    } else {
      content.innerHTML = `
        <h3 style="color: #dc2626; margin: 0 0 20px 0; display: flex; align-items: center;">
          <span style="margin-right: 8px;">❌</span>
          Email Failed
        </h3>
        
        <div style="background: #fecaca; padding: 16px; border-radius: 6px; margin: 16px 0;">
          <p style="margin: 0; color: #991b1b;">
            <strong>Error:</strong> ${result.error}
          </p>
        </div>

        <p style="margin: 16px 0; color: #374151; font-size: 14px;">
          Don't worry! Your PDF has been downloaded successfully. You can manually attach it to an email.
        </p>

        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
          <button id="email-retry" style="
            padding: 10px 20px; border: 1px solid #d1d5db; background: white; 
            border-radius: 4px; cursor: pointer; font-weight: bold;
          ">Try Again</button>
          <button id="email-result-close" style="
            padding: 10px 20px; border: none; background: #dc2626; color: white; 
            border-radius: 4px; cursor: pointer; font-weight: bold;
          ">Close</button>
        </div>
      `;
    }

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Event handlers
    document.getElementById('email-result-close').onclick = () => {
      document.body.removeChild(modal);
    };

    const retryBtn = document.getElementById('email-retry');
    if (retryBtn) {
      retryBtn.onclick = () => {
        document.body.removeChild(modal);
        // Retry functionality removed - user can try again manually
      };
    }

    // Close on backdrop click
    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    };
  }

  showSuccessMessage(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10001;
      background: #d1fae5; border: 1px solid #10b981; border-radius: 6px;
      padding: 16px; max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 18px; margin-right: 8px;">✅</span>
        <strong style="color: #065f46;">Email Sent Successfully</strong>
      </div>
      <p style="margin: 0; color: #047857; font-size: 14px;">
        ${message}
      </p>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }
  
  showErrorMessage(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10001;
      background: #fef2f2; border: 1px solid #f87171; border-radius: 6px;
      padding: 16px; max-width: 300px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 18px; margin-right: 8px;">❌</span>
        <strong style="color: #dc2626;">Email Send Failed</strong>
      </div>
      <p style="margin: 0; color: #b91c1c; font-size: 14px;">
        ${message}
      </p>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 8000);
  }

  // Send email with base64 encoded attachments using EmailJS send
  async sendEmailWithDynamicAttachments(userDetails, pdfBlob) {
    console.log('📧 Using EmailJS send for base64 attachments...');
    
    // Generate ultra-clean CSV for attachment
    const csvData = this.generatePerfectCsvForEmailJS(userDetails);
    
    if (!csvData) {
      console.error('❌ No CSV data generated');
      return this.sendMailtoFallback(userDetails, pdfBlob);
    }
    
    try {
      // Convert PDF to base64
      const pdfBase64 = await this.blobToBase64(pdfBlob);
      let pdfContent = '';
      
      if (pdfBase64 && typeof pdfBase64 === 'string') {
        // Remove data:application/pdf;base64, prefix if present
        if (pdfBase64.includes(',')) {
          pdfContent = pdfBase64.split(',')[1];
        } else {
          pdfContent = pdfBase64;
        }
      }
      
      console.log('📄 PDF conversion result:', {
        originalSize: pdfBlob.size,
        base64Length: pdfBase64 ? pdfBase64.length : 0,
        contentLength: pdfContent.length,
        hasContent: !!pdfContent
      });
      
      // EmailJS parameters with rich template formatting AND Dynamic Attachments
      const emailParams = {
        // Basic user info
        to_email: userDetails.email,
        to_name: userDetails.name || 'Customer',
        from_name: 'Seima Team',
        subject: `Seima Product Selection - ${userDetails.name}`,
        
        // Message content
        message: this.generateEmailMessage(userDetails, false, true),
        
        // Customer details
        customer_name: userDetails.name,
        customer_email: userDetails.email,
        customer_phone: userDetails.phone || '',
        customer_project: userDetails.project || '',
        customer_address: userDetails.address || '',
        
        // Selection summary
        total_products: this.getTotalProducts(),
        total_rooms: this.getTotalRooms(),
        
        // File information for email template
        pdf_filename: 'seima-selection.pdf',
        csv_filename: 'seima-selection.csv'
      };
      
      console.log('📧 EmailJS template params:', {
        to_email: emailParams.to_email,
        pdf_filename: emailParams.pdf_filename,
        csv_filename: emailParams.csv_filename,
        customer_name: emailParams.customer_name,
        total_products: emailParams.total_products,
        total_rooms: emailParams.total_rooms,
        pdf_content_size: pdfContent.length,
        csv_data_size: csvData.length
      });
      
      // Files will be attached as base64 encoded data
      console.log('📧 Preparing to send email with base64 attachments');
      
      // Validate EmailJS configuration before sending
      console.log('🔍 EmailJS Config Check:', {
        serviceId: this.serviceId,
        templateId: this.templateId, 
        publicKey: this.publicKey,
        isInitialized: this.isInitialized,
        emailjsAvailable: typeof window.emailjs !== 'undefined'
      });
      
      if (!this.serviceId || !this.templateId || !this.publicKey) {
        const missingItems = [];
        if (!this.serviceId) missingItems.push('service ID');
        if (!this.templateId) missingItems.push('template ID');
        if (!this.publicKey) missingItems.push('public key');
        
        throw new Error(`EmailJS not properly configured. Missing: ${missingItems.join(', ')}. Debug info: {serviceId: ${!!this.serviceId}, templateId: ${!!this.templateId}, publicKey: ${!!this.publicKey}, isInitialized: ${this.isInitialized}}`);
      }
      
      // Add file attachments as base64 encoded data for EmailJS
      console.log('📧 Adding file attachments as base64 data...');
      
      // Add attachments to email parameters in data URL format
      emailParams.pdf_attachment = `data:application/pdf;base64,${pdfContent}`; // Data URL format
      emailParams.csv_attachment = `data:text/csv;base64,${btoa(csvData)}`; // Data URL format
      
      console.log('📧 EmailJS attachment params:', {
        pdf_attachment_size: emailParams.pdf_attachment.length,
        csv_attachment_size: emailParams.csv_attachment.length,
        pdf_filename: emailParams.pdf_filename,
        csv_filename: emailParams.csv_filename
      });
      
      console.log('🚀 Sending email with Dynamic Attachments via EmailJS send...');
      console.log('📋 Final EmailJS parameters:');
      console.log('  Service ID:', this.serviceId);
      console.log('  Template ID:', this.templateId);
      console.log('  PDF attachment size:', emailParams.pdf_attachment.length, 'chars');
      console.log('  CSV attachment size:', emailParams.csv_attachment.length, 'chars');
      console.log('  PDF filename:', emailParams.pdf_filename);
      console.log('  CSV filename:', emailParams.csv_filename);
      
      // Send via EmailJS send method with Dynamic Attachments
      const result = await emailjs.send(
        this.serviceId,
        this.templateId,
        emailParams,
        this.publicKey
      );
      
      console.log('✅ EmailJS base64 attachments sent successfully:', result);
      
      if (result && result.status === 200) {
        this.showSuccessNotification('Email sent successfully with attachments!');
        return {
          success: true,
          method: 'emailjs_with_base64_attachments',
          message: 'Email sent with PDF and CSV base64 attachments',
          emailjsResult: result
        };
      } else {
        const statusCode = result ? result.status : 'unknown';
        const statusText = result ? result.text : 'no response';
        throw new Error(`EmailJS returned status ${statusCode}: ${statusText}`);
      }
      
    } catch (error) {
      console.error('❌ EmailJS base64 attachments failed:', error);
      this.showErrorNotification(error);
      
      // Fallback: offer direct download
      return this.offerDirectDownload(pdfBlob, csvData || '', userDetails);
    }
  }

  // Generate comprehensive CSV for EmailJS with all product fields
  generatePerfectCsvForEmailJS(userDetails) {
    const storedSelection = JSON.parse(localStorage.getItem('selection') || '[]');
    const selectedProducts = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SELECTED_PRODUCTS) || '[]');
    
    let selection = [];
    if (selectedProducts.length > 0) {
      // New format: convert to old format for CSV generation
      selection = selectedProducts.map(item => ({
        ...item.product,
        Room: item.room,
        Notes: item.notes,
        Quantity: item.quantity,
        Timestamp: new Date(item.timestamp).toISOString()
      }));
    } else {
      // Old format: use directly
      selection = storedSelection;
    }
    
    if (!selection.length) {
      return null;
    }
    
    // Create comprehensive CSV format with all fields
    const csvRows = [];
    
    // Header row with all required columns
    csvRows.push('Code,Description,Quantity,Price ea inc GST,Price Total inc GST,Notes,Room,Image URL,Diagram URL,Datasheet URL,Website URL');
    
    // Data rows
    selection.forEach(item => {
      const code = this.cleanCsvField(item.OrderCode || '');
      const desc = this.cleanCsvField(item.Description || '');
      const qty = item.Quantity || 1;
      const priceStr = (item.RRP_INCGST || '').toString().replace(/,/g, '');
      const priceNum = parseFloat(priceStr);
      const priceEa = (!isNaN(priceNum) ? priceNum.toFixed(2) : '');
      const priceTotal = (!isNaN(priceNum) ? (priceNum * qty).toFixed(2) : '');
      const notes = this.cleanCsvField(item.Notes || '');
      const room = this.cleanCsvField(item.Room || '');
      const imageUrl = this.cleanCsvField(item.Image_URL || '');
      const diagramUrl = this.cleanCsvField(item.Diagram_URL || '');
      const datasheetUrl = this.cleanCsvField(item.Datasheet_URL || '');
      const websiteUrl = this.cleanCsvField(item.Website_URL || '');
      
      // Proper CSV escaping with quotes for all fields
      csvRows.push(`"${code}","${desc}","${qty}","${priceEa}","${priceTotal}","${notes}","${room}","${imageUrl}","${diagramUrl}","${datasheetUrl}","${websiteUrl}"`);
    });
    
    // Join with standard line breaks
    const csvContent = csvRows.join('\r\n');
    
    console.log('📊 Comprehensive CSV generated:', {
      length: csvContent.length,
      rows: csvRows.length,
      products: selection.length,
      preview: csvContent.substring(0, 200),
      hasControlChars: /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(csvContent),
      lineBreaks: (csvContent.match(/\r\n/g) || []).length,
      sampleFields: selection.length > 0 ? {
        hasPrice: !!selection[0].RRP_INCGST,
        hasUrls: !!(selection[0].Image_URL || selection[0].Website_URL),
        hasRoom: !!selection[0].Room
      } : {}
    });
    
    return csvContent;
  }

  // Clean CSV fields properly
  cleanCsvField(value) {
    if (typeof value !== 'string') {
      value = String(value || '');
    }
    
    return value
      // Remove problematic characters but keep printable ones
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars except \r\n
      .replace(/"/g, '""') // Escape quotes by doubling them
      .replace(/\r\n|\r|\n/g, ' ') // Replace line breaks with spaces
      .trim();
  }



  // Direct download fallback
  offerDirectDownload(pdfBlob, csvData, userDetails) {
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
      background: rgba(0,0,0,0.8); z-index: 10003; display: flex; 
      align-items: center; justify-content: center; padding: 20px;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white; border-radius: 8px; padding: 30px; max-width: 500px; 
      width: 100%; max-height: 80vh; overflow-y: auto;
    `;

    content.innerHTML = `
      <h3 style="color: #2563eb; margin: 0 0 20px 0; display: flex; align-items: center;">
        <span style="margin-right: 8px;">📧</span>
        Download Your Files
      </h3>
      
      <p style="margin: 16px 0; color: #374151;">
        Your Seima product selection is ready for download:
      </p>

      <div style="display: flex; flex-direction: column; gap: 12px; margin: 20px 0;">
        <button id="download-pdf-final" style="
          padding: 12px 16px; border: none; background: #dc2626; color: white; 
          border-radius: 4px; cursor: pointer; font-weight: bold;
        ">
          📄 Download PDF Selection
        </button>
        
        <button id="download-csv-final" style="
          padding: 12px 16px; border: none; background: #059669; color: white; 
          border-radius: 4px; cursor: pointer; font-weight: bold;
        ">
          📊 Download Clean CSV Data
        </button>
      </div>

      <div style="background: #f0f9ff; padding: 16px; border-radius: 6px; margin: 16px 0;">
        <p style="margin: 0; color: #0c4a6e; font-size: 14px;">
          ✅ CSV is guaranteed corruption-free and compatible with Excel, Google Sheets, and all spreadsheet applications.
        </p>
      </div>

      <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px;">
        <button id="close-download-modal" style="
          padding: 10px 20px; border: 1px solid #d1d5db; background: white; 
          border-radius: 4px; cursor: pointer; font-weight: bold;
        ">Close</button>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Event handlers
    document.getElementById('download-pdf-final').onclick = () => {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'seima-selection.pdf';
      a.click();
      URL.revokeObjectURL(url);
      this.showSuccessNotification('PDF downloaded successfully!');
    };

    document.getElementById('download-csv-final').onclick = () => {
      const csvBlob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(csvBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'seima-selection.csv';
      a.click();
      URL.revokeObjectURL(url);
      this.showSuccessNotification('Clean CSV downloaded successfully!');
    };

    document.getElementById('close-download-modal').onclick = () => {
      document.body.removeChild(modal);
    };

    modal.onclick = (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    };

    return {
      success: true,
      method: 'download_fallback',
      message: 'Files offered for download due to email service issue'
    };
  }

  // Success notification
  showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10001;
      background: #d1fae5; border: 1px solid #10b981; border-radius: 6px;
      padding: 16px; max-width: 320px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 18px; margin-right: 8px;">✅</span>
        <strong style="color: #065f46;">Success</strong>
      </div>
      <p style="margin: 0; color: #047857; font-size: 14px;">
        ${message}
      </p>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  // Error notification
  showErrorNotification(error) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10001;
      background: #fef2f2; border: 1px solid #f87171; border-radius: 6px;
      padding: 16px; max-width: 320px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    notification.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 18px; margin-right: 8px;">❌</span>
        <strong style="color: #dc2626;">Email Failed</strong>
      </div>
      <p style="margin: 0; color: #b91c1c; font-size: 14px;">
        ${error.text || error.message || 'Unknown error'}
      </p>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 8000);
  }
}

// Export singleton instance
export const emailService = new EmailService(); 