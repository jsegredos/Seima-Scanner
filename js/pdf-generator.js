import { CONFIG } from './config.js';

// Samsung Browser Compatibility Utilities
export function isSamsungBrowser() {
  const userAgent = navigator.userAgent;
  return /SamsungBrowser/i.test(userAgent) || /Samsung/i.test(userAgent);
}

export function isSamsungDevice() {
  const userAgent = navigator.userAgent;
  return /SM-|SCH-|SPH-|SGH-|GT-|Galaxy/i.test(userAgent) || /SamsungBrowser/i.test(userAgent);
}

function showSamsungDownloadHelp(blob, filename, fileType = 'PDF') {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
    background: rgba(0,0,0,0.7); z-index: 10000; display: flex; 
    align-items: center; justify-content: center; padding: 20px;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    background: white; border-radius: 8px; padding: 24px; max-width: 500px; 
    width: 100%; max-height: 80vh; overflow-y: auto;
  `;
  
  content.innerHTML = `
    <h3 style="color: #dc2626; margin: 0 0 16px 0; display: flex; align-items: center;">
      <span style="margin-right: 8px;">⚠️</span>
      Samsung Device Download Issue
    </h3>
    <p style="margin: 0 0 16px 0; color: #374151;">
      Your Samsung device may have difficulty downloading ${fileType} files. Here's how to fix it:
    </p>
    <ol style="margin: 0 0 20px 0; padding-left: 20px; color: #374151;">
      <li style="margin-bottom: 8px;"><strong>Use Chrome Browser:</strong> Try opening this page in Chrome instead of Samsung Internet</li>
      <li style="margin-bottom: 8px;"><strong>Check Downloads:</strong> Look in your Downloads folder - the file may have saved without notification</li>
      <li style="margin-bottom: 8px;"><strong>Clear Cache:</strong> Go to Settings > Apps > Downloads > Storage > Clear Cache</li>
      <li style="margin-bottom: 8px;"><strong>Try Again:</strong> Wait 10 seconds and try the download again</li>
    </ol>
    <div style="display: flex; gap: 12px; justify-content: flex-end;">
      <button id="samsung-help-close" style="
        padding: 8px 16px; border: 1px solid #d1d5db; background: white; 
        border-radius: 4px; cursor: pointer;
      ">Close</button>
      <button id="samsung-help-retry" style="
        padding: 8px 16px; border: none; background: #2563eb; color: white; 
        border-radius: 4px; cursor: pointer;
      ">Try Download Again</button>
    </div>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  document.getElementById('samsung-help-close').onclick = () => {
    document.body.removeChild(modal);
  };
  
  document.getElementById('samsung-help-retry').onclick = () => {
    document.body.removeChild(modal);
    // Retry download after a delay
    setTimeout(() => {
      downloadWithFallback(blob, filename, fileType);
    }, 1000);
  };
  
  // Close on backdrop click
  modal.onclick = (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  };
}

export function downloadWithFallback(blob, filename, fileType = 'file') {
  let downloadSuccessful = false;
  
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    
    // Listen for download events (may not work on all browsers)
    const downloadTimeout = setTimeout(() => {
      if (!downloadSuccessful && isSamsungDevice()) {
        console.warn('Download may have failed on Samsung device');
        showSamsungDownloadHelp(blob, filename, fileType);
      }
    }, 3000);
    
    link.click();
    document.body.removeChild(link);
    
    // Samsung devices need longer timeout before URL cleanup
    const cleanupDelay = isSamsungDevice() ? 10000 : 2000;
    setTimeout(() => {
      URL.revokeObjectURL(url);
      clearTimeout(downloadTimeout);
    }, cleanupDelay);
    
    // Assume success for now
    downloadSuccessful = true;
    
  } catch (error) {
    console.error('Download failed:', error);
    if (isSamsungDevice()) {
      showSamsungDownloadHelp(blob, filename, fileType);
    } else {
      alert(`Failed to download ${filename}. Please try again or contact support.`);
    }
  }
}

function showBrowserCompatibilityWarning() {
  if (isSamsungDevice()) {
    const existingWarning = document.getElementById('samsung-browser-warning');
    if (existingWarning) return; // Don't show multiple warnings
    
    const warning = document.createElement('div');
    warning.id = 'samsung-browser-warning';
    warning.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
      background: #fef3c7; border-bottom: 1px solid #f59e0b; padding: 12px;
      text-align: center; font-size: 14px; color: #92400e;
    `;
    
    warning.innerHTML = `
      <span style="margin-right: 8px;">📱</span>
      <strong>Samsung Device:</strong> For best results with PDF downloads, use Chrome browser instead of Samsung Internet.
      <button onclick="this.parentElement.remove()" style="
        margin-left: 12px; padding: 4px 8px; border: none; background: #f59e0b; 
        color: white; border-radius: 3px; cursor: pointer; font-size: 12px;
      ">Dismiss</button>
    `;
    
    document.body.insertBefore(warning, document.body.firstChild);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      if (warning.parentElement) {
        warning.remove();
      }
    }, 10000);
  }
}

// Show compatibility warning when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', showBrowserCompatibilityWarning);
} else {
  showBrowserCompatibilityWarning();
}

export function showPdfFormScreen(userDetails) {
  const spinner = document.getElementById('pdf-spinner');
  if (spinner) spinner.style.display = 'flex';
  loadImageAsDataURL('assets/seima-logo.png', function(logoDataUrl, logoNaturalW, logoNaturalH) {
    // Before PDF export, ensure window.seimaLogoImg is loaded
    function ensureSeimaLogoLoaded(cb) {
      if (window.seimaLogoImg) return cb();
      const img = new window.Image();
      img.onload = function() {
        window.seimaLogoImg = img;
        cb();
      };
      img.src = 'assets/seima-logo.png';
    }
    // PDF export logic with improved layout and CORS proxy for images
    const storedSelection = JSON.parse(localStorage.getItem('selection') || '[]');
    const selectedProducts = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SELECTED_PRODUCTS) || '[]');
    
    // Use new format if available, fallback to old format
    let selection = [];
    if (selectedProducts.length > 0) {
      // New format: convert to old format for PDF generation
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
      alert('No products selected.');
      if (spinner) spinner.style.display = 'none';
      return;
    }
    // Group by room
    const byRoom = {};
    selection.forEach(item => {
      if (!byRoom[item.Room]) byRoom[item.Room] = [];
      byRoom[item.Room].push(item);
    });
    // jsPDF setup
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    // --- COVER PAGE ---
    loadImageAsDataURL('assets/seima-logo.png', function(coverLogoDataUrl, coverLogoNaturalW, coverLogoNaturalH) {
      const coverLogoH = 60;
      const coverLogoW = coverLogoNaturalW && coverLogoNaturalH ? (coverLogoH * coverLogoNaturalW / coverLogoNaturalH) : 180;
      const coverLogoX = (pageWidth - coverLogoW) / 2;
      const coverLogoY = 64;
      if (coverLogoDataUrl) {
        doc.addImage(coverLogoDataUrl, 'PNG', coverLogoX, coverLogoY, coverLogoW, coverLogoH);
      }
      // Center details block vertically and horizontally, but align left edge with logo
      let detailsBlockY = coverLogoY + coverLogoH + 60 + 56.7; // lower by 2cm (56.7pt)
      const detailsBlockX = coverLogoX; // align with left edge of logo
      const labelX = detailsBlockX;
      const valueX = detailsBlockX + 90;
      doc.setFontSize(14);
      doc.setTextColor('#444');
      doc.setFont('helvetica', 'normal');
      let y = detailsBlockY;
      const details = [
        { label: 'Name:', value: userDetails?.name || '', bold: true },
        { label: 'Project:', value: userDetails?.project || '', bold: true },
        { label: 'Address:', value: userDetails?.address || '', bold: true },
        { label: 'Email:', value: userDetails?.email || '', bold: true },
        { label: 'Telephone:', value: userDetails?.telephone || '', bold: true },
      ];
      details.forEach(d => {
        if (d.value) {
          doc.setFont('helvetica', 'normal');
          doc.text(d.label, labelX, y);
          doc.setFont('helvetica', 'bold');
          doc.text(d.value, valueX, y);
          y += 28;
        }
      });
      // Thank you/info message at bottom above footer
      const infoMsg = 'Thank you for selecting Seima products. If you would like additional information';
      const infoMsg2 = 'please call or email your Seima representative, or email info@seima.com.au';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor('#222');
      doc.text(infoMsg, pageWidth/2, pageHeight-60, { align: 'center' });
      doc.text(infoMsg2, pageWidth/2, pageHeight-44, { align: 'center' });
      // Footer bar with timestamp and www.seima.com.au
      const footerHeight = 28;
      doc.setFillColor('#888');
      doc.rect(0, pageHeight-footerHeight, pageWidth, footerHeight, 'F');
      doc.setTextColor('#fff');
      doc.setFontSize(11);
      // Timestamp (left)
      const now = new Date();
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      const day = now.getDate();
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      const hour = String(now.getHours()).padStart(2,'0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const timestamp = `Printed ${day} ${month} ${year}, ${hour}:${min}`;
      doc.text(timestamp, 16, pageHeight-10);
      // www.seima.com.au (right)
      doc.text('www.seima.com.au', pageWidth-140, pageHeight-10);
      // --- END COVER PAGE ---
      // Add a new page for the product table
      doc.addPage();
      // Now load the white logo for product pages
      loadImageAsDataURL('assets/seima-logo-white.png', function(logoDataUrl, logoNaturalW, logoNaturalH) {
        // Margins and layout
        const leftMargin = 32;
        const rightMargin = 32;
        const tableWidth = pageWidth - leftMargin - rightMargin;
        // Column layout: [images, code, description, price, qty, total]
        const imgW = 90, imgPad = 12;
        const codeX = leftMargin + imgW*2 + imgPad*2;
        const descX = codeX + 60;
        const priceX = pageWidth - 200;
        const qtyX = pageWidth - 120;
        const totalX = pageWidth - 60;
        const colX = [leftMargin, codeX, descX, priceX, qtyX, totalX];
        const colW = [imgW, imgW, 60, priceX-descX, 60, 60];
        // Table headings (no Product/Diagram, Total at far right)
        const headers = ['Code', 'Description', 'Price ea', 'Qty', 'Total'];
        // Insert drawImage function definition before drawNextRow
        const drawImage = (doc, imgUrl, x, y, maxW, maxH, cb) => {
          if (!imgUrl) { if (cb) cb(); return; }
          let proxiedUrl = imgUrl;
          if (!imgUrl.startsWith('data:') && !imgUrl.startsWith('assets/')) {
            proxiedUrl = 'https://corsproxy.io/?' + encodeURIComponent(imgUrl);
          }
          const img = new window.Image();
          img.crossOrigin = 'Anonymous';
          let finished = false;
          const timeout = setTimeout(() => {
            if (!finished) {
              finished = true;
              if (cb) cb();
            }
          }, 10000);
          img.onload = function() {
            if (finished) return;
            finished = true;
            clearTimeout(timeout);
            try { doc.addImage(img, 'JPEG', x, y, maxW, maxH); } catch (e) {}
            if (cb) cb();
          };
          img.onerror = function() {
            if (finished) return;
            finished = true;
            clearTimeout(timeout);
            if (cb) cb();
          };
          img.src = proxiedUrl;
        };
        // Restore rowsToDraw definition and initialization before drawNextRow
        let rowsToDraw = [];
        const roomNames = Object.keys(byRoom);
        roomNames.forEach((room, rIdx) => {
          const items = byRoom[room];
          items.forEach((item, iIdx) => {
            rowsToDraw.push({
              item,
              room,
              rIdx,
              iIdx,
              isFirstInRoom: iIdx === 0,
              roomCount: items.length
            });
          });
        });
        // Draw all rows (images async)
        let rowIdx = 0;
        let pageRow = 0;
        // Restore maxRowsPerPage definition before drawNextRow
        const maxRowsPerPage = 4;
        // Reduce vertical padding to allow larger images
        const rowPadding = 8; // was 28+36, now less
        const rowHeight = Math.floor((pageHeight-80) / maxRowsPerPage); // less top/bottom margin
        let currentY = footerHeight + 8;
        function drawNextRow() {
          if (rowIdx >= rowsToDraw.length) {
            const pageCount = doc.internal.getNumberOfPages() - 1; // exclude cover
            for (let i = 2; i <= pageCount + 1; i++) { // start from 2 (first product page)
              doc.setPage(i);
              drawPDFHeader(doc, pageWidth, colX, leftMargin, footerHeight, logoDataUrl, logoNaturalW, logoNaturalH, userDetails.excludePrice);
              currentY = footerHeight + 8;
              // Footer bar (reduced height and font size)
              doc.setFillColor('#888');
              doc.rect(0, pageHeight-footerHeight, pageWidth, footerHeight, 'F');
              doc.setTextColor('#fff');
              doc.setFontSize(11);
              doc.text('www.seima.com.au', pageWidth-140, pageHeight-10);
              doc.text('Page ' + (i-1) + ' of ' + pageCount, leftMargin, pageHeight-10);
            }
            // --- PDF FILENAME LOGIC ---
            const now = new Date();
            const dd = String(now.getDate()).padStart(2, '0');
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const yy = String(now.getFullYear()).slice(-2);
            const hh = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            const emailSafe = (userDetails.email || 'customer').replace(/[^a-zA-Z0-9@._-]/g, '_');
            const pdfFilename = `${emailSafe}-${dd}${mm}${yy}-${hh}${min}.pdf`;
            
            // Enhanced PDF download with Samsung compatibility
            try {
              const pdfBlob = doc.output('blob');
              downloadWithFallback(pdfBlob, pdfFilename, 'PDF');
            } catch (error) {
              console.error('PDF generation failed:', error);
              if (isSamsungDevice()) {
                showSamsungDownloadHelp(null, pdfFilename, 'PDF');
              } else {
                alert('Failed to generate PDF. Please try again or contact support.');
              }
            }
            // --- CSV EXPORT LOGIC ---
            if (userDetails.exportCsv) {
              // Keep spinner going
              setTimeout(() => {
                generateAndDownloadCsv(userDetails, pdfFilename.replace(/\.pdf$/, '.csv'));
              }, 100); // let PDF download start first
            } else {
              if (spinner) spinner.style.display = 'none';
            }
            return;
          }
          // New page if needed
          if (pageRow >= maxRowsPerPage) {
            doc.addPage();
            drawPDFHeader(doc, pageWidth, colX, leftMargin, footerHeight, logoDataUrl, logoNaturalW, logoNaturalH, userDetails.excludePrice);
            currentY = footerHeight + 8;
            pageRow = 0;
          }
          const row = rowsToDraw[rowIdx];
          // Calculate y for this row
          const y = currentY + (rowHeight * pageRow);
          // Room header (always above first product in each room, on every page)
          if (row.isFirstInRoom) {
            doc.setFontSize(9);
            doc.setTextColor('#888');
            doc.text(row.room + ' (' + row.roomCount + ')', leftMargin, y+10);
          }
          // Product image (maintain aspect ratio)
          drawImage(doc, row.item.Image_URL || '', colX[0], y+rowPadding+16, imgW, rowHeight-rowPadding*2, function() {
            // Diagram image (maintain aspect ratio)
            drawImage(doc, row.item.Diagram_URL || '', colX[0]+imgW+imgPad, y+rowPadding+16, imgW, rowHeight-rowPadding*2, function() {
              // Code (top-aligned)
              doc.setFontSize(10);
              doc.setTextColor('#222');
              const codeY = y+28; // top-aligned
              doc.text(String(row.item.OrderCode || ''), Number(colX[1])+30, codeY+10, { align: 'center' });
              // Datasheet link under code, with padding
              let linkY = codeY+26;
              if (row.item.Datasheet_URL && row.item.Datasheet_URL !== '#') {
                doc.setFontSize(9);
                doc.setTextColor(80, 80, 80);
                doc.textWithLink('Datasheet', Number(colX[1])+30, linkY, { url: row.item.Datasheet_URL, align: 'center' });
                // Underline
                const dsWidth = doc.getTextWidth('Datasheet');
                doc.setDrawColor(180, 180, 180);
                doc.setLineWidth(0.7);
                doc.line(Number(colX[1])+30-dsWidth/2, linkY+1.5, Number(colX[1])+30+dsWidth/2, linkY+1.5);
                linkY += 14;
              }
              // Website link under datasheet
              if (row.item.Website_URL && row.item.Website_URL !== '#') {
                doc.setFontSize(9);
                doc.setTextColor(80, 80, 200);
                doc.textWithLink('Website', Number(colX[1])+30, linkY, { url: row.item.Website_URL, align: 'center' });
                // Underline
                const wsWidth = doc.getTextWidth('Website');
                doc.setDrawColor(120, 120, 200);
                doc.setLineWidth(0.7);
                doc.line(Number(colX[1])+30-wsWidth/2, linkY+1.5, Number(colX[1])+30+wsWidth/2, linkY+1.5);
                linkY += 14;
              }
              // Description (top-aligned with code)
              let descY = codeY+10;
              doc.setFontSize(10);
              doc.setTextColor('#222');
              // Main description
              const descColWidth = priceX - descX - 10;
              let descLines = doc.splitTextToSize(String(row.item.Description || ''), descColWidth);
              doc.text(descLines, Number(colX[2])+5, descY);
              descY += descLines.length * 12;
              // Long description
              if (row.item.LongDescription) {
                doc.setFontSize(9);
                doc.setTextColor('#444');
                let longDescLines = doc.splitTextToSize(String(row.item.LongDescription), descColWidth);
                doc.text(longDescLines, Number(colX[2])+5, descY);
                descY += longDescLines.length * 11;
              }
              // Notes below long description, with padding
              if (row.item.Notes) {
                doc.setFont('helvetica', 'italic');
                doc.setFontSize(9);
                doc.setTextColor('#444');
                let notesLines = doc.splitTextToSize('Notes: ' + String(row.item.Notes).replace(/\r?\n|\r/g, ' '), descColWidth);
                doc.text(notesLines, Number(colX[2])+5, descY);
                descY += notesLines.length * 11;
                doc.setFont('helvetica', 'normal');
              }
              // Price ea (top-aligned)
              doc.setFontSize(10);
              doc.setTextColor('#222');
              // Robust price parsing for PDF
              let pdfPriceNum = NaN;
              if (row.item.RRP_INCGST) {
                pdfPriceNum = parseFloat(row.item.RRP_INCGST.toString().replace(/,/g, ''));
              }
              let pdfPriceStr = pdfPriceNum && !isNaN(pdfPriceNum) && pdfPriceNum > 0 ? ('$' + pdfPriceNum.toFixed(2)) : '';
              if (!userDetails.excludePrice) {
                doc.text(pdfPriceStr, Number(colX[3])+30, codeY+10, { align: 'center' });
              }
              // Qty (top-aligned)
              doc.setFontSize(10);
              doc.setTextColor('#222');
              doc.text(String(row.item.Quantity || 1), Number(colX[4])+20, codeY+10, { align: 'center' });
              // Total (top-aligned, far right)
              doc.setFontSize(10);
              doc.setTextColor('#222');
              let pdfTotalStr = pdfPriceNum && !isNaN(pdfPriceNum) && pdfPriceNum > 0 ? ('$' + (pdfPriceNum * (row.item.Quantity || 1)).toFixed(2)) : '';
              if (!userDetails.excludePrice) {
                doc.text(pdfTotalStr, Number(colX[5])+20, codeY+10, { align: 'center' });
              }
              rowIdx++;
              pageRow++;
              drawNextRow();
            });
          });
        }
        drawNextRow();
      });
    });
  });
}

export function drawPDFHeader(doc, pageWidth, colX, leftMargin, footerHeight, logoDataUrl, logoNaturalW, logoNaturalH, excludePrice) {
  const headerHeight = footerHeight + 5.7;
  doc.setFillColor('#222');
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  if (logoDataUrl && logoNaturalW && logoNaturalH) {
    const logoH = headerHeight * 0.55;
    const logoAspect = logoNaturalW / logoNaturalH;
    let logoW = logoH * logoAspect;
    if (logoW > 80) { logoW = 80; }
    const logoY = (headerHeight - logoH) / 2;
    doc.addImage(logoDataUrl, 'PNG', leftMargin, logoY, logoW, logoH);
  }
  doc.setFontSize(10);
  doc.setTextColor('#f4f4f4');
  doc.setFont('helvetica', 'normal');
  const colY = headerHeight - 8;
  doc.text('Code', colX[1]+30, colY, { align: 'center' });
  doc.text('Description', colX[2]+(colX[3]-colX[2])/2, colY, { align: 'center' });
  if (!excludePrice) {
    doc.text('Price ea inc GST', colX[3]+30, colY, { align: 'center' });
    doc.text('Qty', colX[4]+20, colY, { align: 'center' });
    doc.text('Total', colX[5]+20, colY, { align: 'center' });
  } else {
    doc.text('Qty', colX[4]+20, colY, { align: 'center' });
  }
}

// Helper to load an image as a base64 data URL
export function loadImageAsDataURL(src, cb) {
  const img = new window.Image();
  img.crossOrigin = 'Anonymous';
  img.onload = function() {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    cb(canvas.toDataURL('image/png'), img.width, img.height);
  };
  img.src = src;
}

export function ensurePdfSpinner() {
  if (!document.getElementById('pdf-spinner')) {
    const spinner = document.createElement('div');
    spinner.id = 'pdf-spinner';
    spinner.style.display = 'none';
    spinner.style.position = 'fixed';
    spinner.style.top = '0';
    spinner.style.left = '0';
    spinner.style.width = '100vw';
    spinner.style.height = '100vh';
    spinner.style.zIndex = '9999';
    spinner.style.background = 'rgba(255,255,255,0.7)';
    spinner.style.alignItems = 'center';
    spinner.style.justifyContent = 'center';
    spinner.innerHTML = '<div style="border:6px solid #e0e0e0;border-top:6px solid #2563eb;border-radius:50%;width:54px;height:54px;animation:spin 1s linear infinite;"></div>';
    document.body.appendChild(spinner);
    // Add keyframes if not present
    if (!document.getElementById('pdf-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'pdf-spinner-style';
      style.innerHTML = '@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }';
      document.head.appendChild(style);
    }
  }
}

// --- CSV GENERATION AND DOWNLOAD ---
export function generateAndDownloadCsv(userDetails, csvFilename) {
  const spinner = document.getElementById('pdf-spinner');
  
  // Use same logic as PDF generation to handle both storage formats
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
    if (spinner) spinner.style.display = 'none';
    return;
  }
  // Prepare CSV data
  const csvData = selection.map(item => {
    const priceStr = (item.RRP_INCGST || '').toString().replace(/,/g, '');
    const priceNum = parseFloat(priceStr);
    const total = (!isNaN(priceNum) ? (priceNum * (item.Quantity || 1)).toFixed(2) : '');
    const excludePrice = userDetails.excludePrice;
    return {
      Code: item.OrderCode || '',
      Description: item.Description || '',
      Quantity: item.Quantity || 1,
      'Price ea inc GST': excludePrice ? '0.00' : (item.RRP_INCGST || ''),
      'Price Total inc GST': excludePrice ? '0.00' : total,
      Notes: item.Notes || '',
      Room: item.Room,
      'Image URL': item.Image_URL || '',
      'Diagram URL': item.Diagram_URL || '',
      'Datasheet URL': item.Datasheet_URL || '',
      'Website URL': item.Website_URL || ''
    };
  });
  // Add customer details as first row (optional, or as header comment)
  // Use PapaParse to unparse
  const csv = window.Papa.unparse(csvData);
  // Download CSV with Samsung compatibility
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadWithFallback(blob, csvFilename, 'CSV');
  if (spinner) spinner.style.display = 'none';
} 