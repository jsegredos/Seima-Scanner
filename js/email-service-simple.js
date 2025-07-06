// =================================================================
// RESTORED: Original Working EmailJS Approach with Base64 Template Variables
// =================================================================

import { CONFIG } from './config.js';

/**
 * Send email using original working approach: emailjs.send() with base64 template variables
 * PLUS automatically save CSV locally to user's computer
 */
export function sendEmailWithCSV(userDetails, pdfBlob) {
  console.log('📧 Using ORIGINAL working EmailJS approach with local CSV save...');
  
  // Generate CSV data
  const csvData = generateWorkingCSV(userDetails);
  if (!csvData) {
    console.error('❌ No CSV data generated');
    return;
  }
  
  // IMMEDIATELY save CSV file locally to user's computer
  const csvBlob = new Blob([csvData], { type: 'text/csv' });
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const projectName = userDetails.project.replace(/[^a-zA-Z0-9\s]/g, '');
  const csvFileName = `${projectName}-${dd}${mm}${yy}.${hh}${min}.csv`;
  
  console.log('💾 Saving CSV file locally to your computer...');
  downloadFile(csvBlob, csvFileName);
  
  // Show immediate notification that CSV is saved
  showLocalSaveNotification(csvFileName);
  
  // Convert PDF to base64
  const reader = new FileReader();
  reader.onload = function(e) {
    const pdfBase64 = e.target.result; // This includes "data:application/pdf;base64,"
    
    // Remove the data URL prefix to get raw base64
    const pdfContent = pdfBase64.includes(',') ? pdfBase64.split(',')[1] : pdfBase64;
    
    console.log('📄 PDF conversion result:', {
      originalSize: pdfBlob.size,
      base64Length: pdfContent.length,
      hasContent: !!pdfContent
    });
    
    // Create EmailJS template parameters (ORIGINAL working approach)
    const emailParams = {
      // Basic user info
      to_email: userDetails.email,
      to_name: userDetails.name || 'Customer',
      from_name: 'Seima Team',
      subject: `Seima Product Selection - ${userDetails.name || 'Customer'}`,
      
      // Message content (updated to mention local CSV save)
      message: generateEmailMessage(userDetails, csvFileName),
      
      // Customer details
      customer_name: userDetails.name || 'Customer',
      customer_email: userDetails.email,
      customer_phone: userDetails.phone || '',
      customer_project: userDetails.project || '',
      customer_address: userDetails.address || '',
      
      // Selection summary
      total_products: getProductCount(),
      total_rooms: getTotalRooms(),
      
      // PDF attachment only (CSV is saved locally)
      pdf_attachment: `data:application/pdf;base64,${pdfContent}`, // Data URL format
      pdf_filename: 'seima-selection.pdf'
    };
    
    console.log('📧 EmailJS template parameters:', {
      to_email: emailParams.to_email,
      pdf_filename: emailParams.pdf_filename,
      pdf_attachment_size: emailParams.pdf_attachment.length,
      customer_name: emailParams.customer_name,
      total_products: emailParams.total_products,
      csv_saved_locally: csvFileName
    });
    
    // Send using original working method: emailjs.send() with base64 template variables
    emailjs.send('service_rblizfg', 'template_8st9fhk', emailParams, 'MHAEjvnc_xx8DIRCA')
      .then(function(response) {
        console.log('✅ Email sent successfully with PDF attachment:', response);
        showEmailSuccess(`Email sent successfully with PDF attachment! CSV file saved locally as: ${csvFileName}`);
      })
      .catch(function(error) {
        console.error('❌ Email failed:', error);
        handleEmailError(error, userDetails, pdfBlob, csvData);
      });
  };
  
  reader.onerror = function(error) {
    console.error('❌ Failed to read PDF file:', error);
    handleEmailError(error, userDetails, pdfBlob, csvData);
  };
  
  // Read PDF as data URL
  reader.readAsDataURL(pdfBlob);
}

/**
 * Generate email message content (clean text format with proper alignment)
 */
function generateEmailMessage(userDetails, csvFileName) {
  const productCount = getProductCount();
  const totalRooms = getTotalRooms();
  
  return `Dear ${userDetails.name},

Thank you for selecting Seima products, your selection summary is below and files are attached.

Summary:
Customer:     ${userDetails.name}
Project:      ${userDetails.project}
Address:      ${userDetails.address || ''}
Email:        ${userDetails.email}
# Products:   ${productCount}
# Rooms:      ${totalRooms}

Your selections are attached as a PDF file to this email and contain quick links to website and datasheet.
If selected, the CSV file has been saved to your downloads folder and contains product details for easy import into your systems.

If you have any questions about these products, please contact one of the Seima team at info@seima.com.au or visit www.seima.com.au.

Best regards,
Seima Team`;
}

/**
 * Get product count from storage
 */
function getProductCount() {
  const storedSelection = JSON.parse(localStorage.getItem('selection') || '[]');
  const selectedProducts = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SELECTED_PRODUCTS) || '[]');
  
  if (selectedProducts.length > 0) {
    return selectedProducts.length;
  }
  return storedSelection.length;
}

/**
 * Get total rooms count
 */
function getTotalRooms() {
  const selectedProducts = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SELECTED_PRODUCTS) || '[]');
  const rooms = new Set();
  
  selectedProducts.forEach(item => {
    if (item.room) {
      rooms.add(item.room);
    }
  });
  
  return rooms.size || 1;
}

/**
 * Generate working CSV
 */
function generateWorkingCSV(userDetails) {
  const storedSelection = JSON.parse(localStorage.getItem('selection') || '[]');
  const selectedProducts = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SELECTED_PRODUCTS) || '[]');
  
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
  
  // Create comprehensive CSV with all 11 columns
  const csvLines = [];
  csvLines.push('"Code","Description","Quantity","Price ea inc GST","Price Total inc GST","Notes","Room","Image URL","Diagram URL","Datasheet URL","Website URL"');
  
  selection.forEach(item => {
    const code = cleanForCSV(item.OrderCode || '');
    const desc = cleanForCSV(item.Description || '');
    const qty = item.Quantity || 1;
    const priceEa = cleanForCSV(item.RRP_INCGST || item.price || '');
    const priceTotal = calculateTotalPrice(item.RRP_INCGST || item.price || '', qty);
    const notes = cleanForCSV(item.Notes || '');
    const room = cleanForCSV(item.Room || '');
    
    // FIX: Use correct property names from product catalog
    const imageUrl = cleanForCSV(item.Image_URL || '');
    const diagramUrl = cleanForCSV(item.Diagram_URL || '');
    const datasheetUrl = cleanForCSV(item.Datasheet_URL || '');
    const websiteUrl = cleanForCSV(item.Website_URL || '');
    
    csvLines.push(`"${code}","${desc}","${qty}","${priceEa}","${priceTotal}","${notes}","${room}","${imageUrl}","${diagramUrl}","${datasheetUrl}","${websiteUrl}"`);
  });
  
  console.log('📊 CSV generated with URL data:', {
    totalProducts: selection.length,
    sampleImageUrl: selection[0]?.Image_URL || 'N/A',
    sampleDiagramUrl: selection[0]?.Diagram_URL || 'N/A',
    sampleDatasheetUrl: selection[0]?.Datasheet_URL || 'N/A',
    sampleWebsiteUrl: selection[0]?.Website_URL || 'N/A'
  });
  
  return csvLines.join('\r\n');
}

/**
 * Calculate total price for quantity
 */
function calculateTotalPrice(priceEa, quantity) {
  const price = parseFloat(String(priceEa).replace(/[,$]/g, ''));
  if (isNaN(price)) return '';
  return (price * quantity).toFixed(2);
}

/**
 * Clean CSV field
 */
function cleanForCSV(value) {
  if (typeof value !== 'string') {
    value = String(value || '');
  }
  
  return value
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control chars
    .replace(/"/g, '""') // Escape quotes
    .replace(/\r?\n|\r/g, ' ') // Replace line breaks
    .trim();
}

/**
 * Handle email error with proper fallback
 */
function handleEmailError(error, userDetails, pdfBlob, csvData) {
  console.error('Email error details:', error);
  
  // Show user-friendly error
  showEmailError(error);
  
  // Offer download fallback
  offerDownloadFallback(pdfBlob, csvData, userDetails);
}

/**
 * Success notification
 */
function showEmailSuccess(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10001;
    background: #d1fae5; border: 1px solid #10b981; border-radius: 6px;
    padding: 16px; max-width: 350px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  notification.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 8px;">
      <span style="font-size: 18px; margin-right: 8px;">✅</span>
      <strong style="color: #065f46;">Email Sent!</strong>
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

/**
 * Error notification
 */
function showEmailError(error) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 10001;
    background: #fee2e2; border: 1px solid #dc2626; border-radius: 6px;
    padding: 16px; max-width: 350px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  notification.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 8px;">
      <span style="font-size: 18px; margin-right: 8px;">❌</span>
      <strong style="color: #991b1b;">Email Failed</strong>
    </div>
    <p style="margin: 0; color: #dc2626; font-size: 14px;">
      ${error.text || error.message || 'Unknown error occurred'}
    </p>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 8000);
}

/**
 * Offer download fallback
 */
function offerDownloadFallback(pdfBlob, csvData, userDetails) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 10002;
    background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
  `;
  
  const modalContent = document.createElement('div');
  modalContent.style.cssText = `
    background: white; padding: 24px; border-radius: 8px; max-width: 400px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  `;
  
  modalContent.innerHTML = `
    <h3 style="margin: 0 0 16px 0; color: #374151;">Email Failed - Download Files</h3>
    <p style="margin: 0 0 16px 0; color: #6b7280;">
      The email couldn't be sent, but you can download your files directly:
    </p>
    <div style="display: flex; gap: 12px; margin-bottom: 16px;">
      <button id="downloadPDF" style="
        padding: 8px 16px; background: #dc2626; color: white; border: none;
        border-radius: 4px; cursor: pointer; font-size: 14px;
      ">Download PDF</button>
      <button id="downloadCSV" style="
        padding: 8px 16px; background: #059669; color: white; border: none;
        border-radius: 4px; cursor: pointer; font-size: 14px;
      ">Download CSV</button>
    </div>
    <button id="closeModal" style="
      padding: 8px 16px; background: #6b7280; color: white; border: none;
      border-radius: 4px; cursor: pointer; font-size: 14px; width: 100%;
    ">Close</button>
  `;
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Add event listeners
  document.getElementById('downloadPDF').onclick = () => {
    downloadFile(pdfBlob, 'seima-selection.pdf');
  };
  
  document.getElementById('downloadCSV').onclick = () => {
    const csvBlob = new Blob([csvData], { type: 'text/csv' });
    downloadFile(csvBlob, 'seima-selection.csv');
  };
  
  document.getElementById('closeModal').onclick = () => {
    document.body.removeChild(modal);
  };
}

/**
 * Download file helper
 */
function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Show notification that CSV file has been saved locally
 */
function showLocalSaveNotification(csvFileName) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed; top: 20px; left: 20px; z-index: 10001;
    background: #dbeafe; border: 1px solid #3b82f6; border-radius: 6px;
    padding: 16px; max-width: 400px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  notification.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 8px;">
      <span style="font-size: 18px; margin-right: 8px;">💾</span>
      <strong style="color: #1e40af;">CSV File Saved!</strong>
    </div>
    <p style="margin: 0; color: #1e3a8a; font-size: 14px;">
      Your product selection has been saved locally as:<br>
      <strong>${csvFileName}</strong>
    </p>
    <p style="margin: 8px 0 0 0; color: #1e3a8a; font-size: 12px;">
      Check your Downloads folder
    </p>
  `;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 8000);
}

// =================================================================
// DIAGNOSTIC: Keep this for troubleshooting
// =================================================================

export function sendEmailWithCSVOnly(userDetails) {
  console.log('🧪 DIAGNOSTIC: Testing original base64 approach with CSV only...');
  
  const csvData = generateWorkingCSV(userDetails);
  if (!csvData) {
    console.error('❌ No CSV data generated');
    return;
  }
  
  const emailParams = {
    to_email: userDetails.email,
    to_name: userDetails.name || 'Customer',
    from_name: 'Seima Team',
    subject: 'DIAGNOSTIC: CSV-Only Test',
    message: `DIAGNOSTIC TEST: CSV-only email using original base64 approach\n\nCSV size: ${csvData.length} chars`,
    customer_name: userDetails.name || 'Customer',
    customer_email: userDetails.email,
    total_products: getProductCount(),
    
    // Only CSV attachment using original working method
    csv_attachment: `data:text/csv;base64,${btoa(csvData)}`,
    csv_filename: 'diagnostic-test.csv'
  };
  
  console.log('🧪 DIAGNOSTIC EmailJS params:', {
    csv_attachment_size: emailParams.csv_attachment.length,
    csv_filename: emailParams.csv_filename
  });
  
  emailjs.send('service_rblizfg', 'template_8st9fhk', emailParams, 'MHAEjvnc_xx8DIRCA')
    .then(function(response) {
      console.log('✅ DIAGNOSTIC SUCCESS: Original approach works!', response);
      showEmailSuccess('DIAGNOSTIC: Original base64 approach successful!');
    })
    .catch(function(error) {
      console.error('❌ DIAGNOSTIC FAILED:', error);
      showEmailError(error);
    });
} 