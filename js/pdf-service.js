/**
 * PDF Service
 * Generates PDF documents with product selection data
 * Maintains identical PDF formatting and layout
 */

import { CONFIG } from './config.js';
import { dataService } from './data-service.js';
export class PDFService {
  constructor() {
    this.isInitialized = false;
    this.imageOptimizationStats = {
      totalImages: 0,
      optimizedImages: 0,
      failedImages: 0
    };
  }

  async init() {
    try {
      await this._loadJSPDF();
      this.isInitialized = true;
      console.log('✅ PDF service initialized');
    } catch (error) {
      console.error('❌ PDF service initialization failed:', error);
      throw error;
    }
  }

  async generatePDF(userDetails) {
    if (!this.isInitialized) {
      throw new Error('PDF service not initialized');
    }

    try {
      console.log(`📄 Generating PDF for ${dataService.getSelectionStats().totalProducts} products...`);
      
      // Show spinner
      this._ensurePdfSpinner();
      const spinner = document.getElementById('pdf-spinner');
      if (spinner) spinner.style.display = 'flex';
      
      // Reset image optimization stats
      this._resetImageOptimizationStats();
      
      // Show processing notification
      this._showProcessingNotification(userDetails);
      
      // Use EXACT same logic as original
      return await this._generatePDFWithOriginalLogic(userDetails);
      
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      throw error;
    }
  }

  async _generatePDFWithOriginalLogic(userDetails) {
    // PDF generation logic (maintains original formatting)
    
    // Get selection data (exact same logic as original)
    const storedSelection = JSON.parse(localStorage.getItem('selection') || '[]');
    const selectedProducts = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SELECTED_PRODUCTS) || '[]');
    
    let selection = [];
    if (selectedProducts.length > 0) {
      selection = selectedProducts.map(item => ({
        ...item.product,
        Room: item.room,
        Notes: item.notes,
        Quantity: item.quantity,
        Timestamp: new Date(item.timestamp).toISOString()
      }));
    } else {
      selection = storedSelection;
    }
    
    if (!selection.length) {
      alert('No products selected.');
      const spinner = document.getElementById('pdf-spinner');
      if (spinner) spinner.style.display = 'none';
      return;
    }
    
    // Group by room (exact same logic)
    const byRoom = {};
    selection.forEach(item => {
      if (!byRoom[item.Room]) byRoom[item.Room] = [];
      byRoom[item.Room].push(item);
    });
    
    // jsPDF setup (exact same as original)
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Load cover page logo (exact same as original)
    return new Promise((resolve, reject) => {
      this._loadImageAsDataURL('assets/seima-logo.png', (coverLogoDataUrl, coverLogoNaturalW, coverLogoNaturalH) => {
        
        // Debug: Track cover logo size
        if (coverLogoDataUrl) {
          console.log(`🔍 Debug - Cover logo size: ${(coverLogoDataUrl.length / 1024).toFixed(1)} KB (${coverLogoNaturalW}x${coverLogoNaturalH})`);
        }
        
        // COVER PAGE (exact same as original)
        const coverLogoH = 60;
        const coverLogoW = coverLogoNaturalW && coverLogoNaturalH ? (coverLogoH * coverLogoNaturalW / coverLogoNaturalH) : 180;
        const coverLogoX = (pageWidth - coverLogoW) / 2;
        const coverLogoY = 64;
        
        if (coverLogoDataUrl) {
          doc.addImage(coverLogoDataUrl, 'PNG', coverLogoX, coverLogoY, coverLogoW, coverLogoH);
        }
        
        // Customer details (exact same positioning as original)
        let detailsBlockY = coverLogoY + coverLogoH + 60 + 56.7;
        const detailsBlockX = coverLogoX;
        const labelX = detailsBlockX;
        const valueX = detailsBlockX + 90;
        
        doc.setFontSize(14);
        doc.setTextColor('#444');
        doc.setFont('helvetica', 'normal');
        
        let y = detailsBlockY;
        const details = [
          { label: 'Name:', value: userDetails?.name || '' },
          { label: 'Project:', value: userDetails?.project || '' },
          { label: 'Address:', value: userDetails?.address || '' },
          { label: 'Email:', value: userDetails?.email || '' },
          { label: 'Telephone:', value: userDetails?.telephone || userDetails?.phone || '' },
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
        
        // Staff contact (exact same logic as original)
        const staffContact = dataService.getStaffContact();
        if (staffContact && staffContact.name && staffContact.mobile && staffContact.email) {
          const contactMsg1 = `For further information please contact ${staffContact.name} on ${staffContact.mobile}`;
          const contactMsg2 = `or email: ${staffContact.email}`;
          const thankYouMsg = 'Thank you for selecting Seima products.';
          const websiteMsg = 'www.seima.com.au';
          
          let messageY = pageHeight - 92;
          
          doc.setFontSize(11);
          doc.setTextColor('#222');
          doc.text(contactMsg1, pageWidth/2, messageY, { align: 'center' });
          doc.text(contactMsg2, pageWidth/2, messageY + 14, { align: 'center' });
          doc.text('', pageWidth/2, messageY + 28, { align: 'center' });
          doc.setFontSize(12);
          doc.text(thankYouMsg, pageWidth/2, messageY + 42, { align: 'center' });
          doc.setFontSize(11);
          doc.setTextColor('#444');
          doc.text(websiteMsg, pageWidth/2, messageY + 56, { align: 'center' });
        } else {
          const infoMsg = 'Thank you for selecting Seima products. If you would like additional information';
          const infoMsg2 = 'please call or email your Seima representative, or email info@seima.com.au';
          
          let messageY = pageHeight - 60;
          doc.text(infoMsg, pageWidth/2, messageY, { align: 'center' });
          doc.text(infoMsg2, pageWidth/2, messageY + 16, { align: 'center' });
        }
        
        // Cover page footer (exact same as original)
        const footerHeight = 28;
        doc.setFillColor('#c4c4bc');
        doc.rect(0, pageHeight-footerHeight, pageWidth, footerHeight, 'F');
        doc.setTextColor('#fff');
        doc.setFontSize(11);
        
        const now = new Date();
        const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const day = now.getDate();
        const month = months[now.getMonth()];
        const year = now.getFullYear();
        const hour = String(now.getHours()).padStart(2,'0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const timestamp = `Printed ${day} ${month} ${year}, ${hour}:${min}`;
        
        doc.text(timestamp, 16, pageHeight-10);
        doc.text('www.seima.com.au', pageWidth-140, pageHeight-10);
        
        // Add new page for products
        doc.addPage();
        
        // Load white logo for product pages (exact same as original)
        this._loadImageAsDataURL('assets/seima-logo-white.png', (logoDataUrl, logoNaturalW, logoNaturalH) => {
          
          // Debug: Track product page logo size
          if (logoDataUrl) {
            console.log(`🔍 Debug - Product page logo size: ${(logoDataUrl.length / 1024).toFixed(1)} KB (${logoNaturalW}x${logoNaturalH})`);
          }
          
          // Layout constants (exact same as original)
          const leftMargin = 32;
          const rightMargin = 32;
          const footerHeight = 40;
          const imgW = 90;
          const imgPad = 12;
          const codeX = leftMargin + imgW*2 + imgPad*2;
          const descX = codeX + 60;
          const priceX = pageWidth - 200;
          const qtyX = pageWidth - 120;
          const totalX = pageWidth - 60;
          const colX = [leftMargin, codeX, descX, priceX, qtyX, totalX];
          
          // Prepare rows data (exact same as original)
          const rowsToDraw = [];
          Object.keys(byRoom).forEach(room => {
            const items = byRoom[room];
            items.forEach((item, idx) => {
              rowsToDraw.push({
                item: item,
                room: room,
                roomCount: items.length,
                isFirstInRoom: idx === 0
              });
            });
          });
          
                      // Drawing variables - EXACT same as original with improved spacing
            const maxRowsPerPage = 4; // Hard-coded to 4 products per page as in original
            const rowPadding = 8; // Less padding to allow larger images
            const rowHeight = Math.floor((pageHeight - 120) / maxRowsPerPage); // More space from footer (was 80, now 120)
            let currentY = footerHeight + 15; // Start a bit lower for better spacing
          let pageRow = 0;
          let rowIdx = 0;
          
          // Draw next row function (exact same logic as original)
          const drawNextRow = () => {
            if (rowIdx >= rowsToDraw.length) {
              // Finalize PDF (exact same as original)
              this._finalizePDF(doc, pageWidth, pageHeight, colX, leftMargin, footerHeight, logoDataUrl, logoNaturalW, logoNaturalH, userDetails, rowsToDraw.length);
              
              // Generate filename (exact same as original)
              const pdfFilename = this._generatePDFFilename(userDetails);
              
              // Create blob and handle download/email
              const pdfBlob = doc.output('blob');
              
              // Remove notifications
              this._removeNotifications();
              
              // Show optimization summary
              this._showImageOptimizationSummary(userDetails.emailCompatible);
              
              console.log(`✅ PDF generated successfully: ${pdfFilename} (${(pdfBlob.size / 1024 / 1024).toFixed(2)} MB)`);
              resolve(pdfBlob);
              return;
            }
            
            // New page if needed
            if (pageRow >= maxRowsPerPage) {
              doc.addPage();
              // Header will be drawn during finalization for consistency
              currentY = footerHeight + 15; // Use same starting position as first page
              pageRow = 0;
            }
            
            const row = rowsToDraw[rowIdx];
            if (!row || !row.item) {
              console.warn(`⚠️ Skipping invalid row at index ${rowIdx}:`, row);
              rowIdx++;
              drawNextRow();
              return;
            }
            
            const y = currentY + (rowHeight * pageRow);
            
            // Room header (exact same as original)
            if (row.isFirstInRoom) {
              doc.setFontSize(9);
              doc.setTextColor('#888');
              doc.text(row.room + ' (' + row.roomCount + ')', leftMargin, y+10);
            }
            
            // Draw images with improved alignment - top-align to text baseline
            this._drawImage(doc, row.item.Image_URL || '', colX[0], y+rowPadding+8, imgW, rowHeight-rowPadding*2, userDetails.emailCompatible, () => {
              this._drawImage(doc, row.item.Diagram_URL || '', colX[0]+imgW+imgPad, y+rowPadding+8, imgW, rowHeight-rowPadding*2, userDetails.emailCompatible, () => {
                
                // Product code (improved positioning and balance)
                doc.setFontSize(10);
                doc.setTextColor('#222');
                const codeY = y+32; // Moved down 4px for better balance with top-aligned images
                doc.text(String(row.item.OrderCode || ''), Number(colX[1])+30, codeY+10, { align: 'center' });
                
                // Links (improved spacing and styling)
                let linkY = codeY+38; // Moved further down from product code (was +26, now +38)
                if (row.item.Datasheet_URL && row.item.Datasheet_URL !== '#') {
                  doc.setFontSize(8); // Slightly smaller font
                  doc.setTextColor(120, 120, 120); // Grey color as requested
                  doc.textWithLink('Datasheet', Number(colX[1])+30, linkY, { url: row.item.Datasheet_URL, align: 'center' });
                  const dsWidth = doc.getTextWidth('Datasheet');
                  doc.setDrawColor(150, 150, 150); // Lighter grey underline
                  doc.setLineWidth(0.5); // Thinner underline
                  doc.line(Number(colX[1])+30-dsWidth/2, linkY+1.5, Number(colX[1])+30+dsWidth/2, linkY+1.5);
                  linkY += 12; // Reduced spacing between links
                }
                
                if (row.item.Website_URL && row.item.Website_URL !== '#') {
                  doc.setFontSize(8); // Slightly smaller font
                  doc.setTextColor(120, 120, 120); // Grey color as requested
                  doc.textWithLink('Website', Number(colX[1])+30, linkY, { url: row.item.Website_URL, align: 'center' });
                  const wsWidth = doc.getTextWidth('Website');
                  doc.setDrawColor(150, 150, 150); // Lighter grey underline
                  doc.setLineWidth(0.5); // Thinner underline
                  doc.line(Number(colX[1])+30-wsWidth/2, linkY+1.5, Number(colX[1])+30+wsWidth/2, linkY+1.5);
                }
                
                // Description (exact same as original)
                let descY = codeY+10;
                doc.setFontSize(10);
                doc.setTextColor('#222');
                const descLines = doc.splitTextToSize(String(row.item.Description || ''), priceX - descX - 10);
                doc.text(descLines, descX + 5, descY);
                descY += descLines.length * 12;
                
                if (row.item.LongDescription) {
                  doc.setFontSize(9);
                  doc.setTextColor('#444');
                  const longDescLines = doc.splitTextToSize(String(row.item.LongDescription), priceX - descX - 10);
                  doc.text(longDescLines, descX + 5, descY);
                  descY += longDescLines.length * 11;
                }
                
                if (row.item.Notes) {
                  doc.setFont('helvetica', 'italic');
                  doc.setFontSize(9);
                  doc.setTextColor('#444');
                  const notesLines = doc.splitTextToSize('Notes: ' + String(row.item.Notes), priceX - descX - 10);
                  doc.text(notesLines, descX + 5, descY);
                  doc.setFont('helvetica', 'normal');
                }
                
                // Price, quantity, total (aligned with code/description row)
                if (!userDetails.excludePrice) {
                  doc.setFontSize(10);
                  doc.setTextColor('#222');
                  
                  let priceNum = NaN;
                  if (row.item.RRP_INCGST) {
                    priceNum = parseFloat(row.item.RRP_INCGST.toString().replace(/,/g, ''));
                  }
                  
                  const priceStr = priceNum && !isNaN(priceNum) && priceNum > 0 ? ('$' + priceNum.toFixed(2)) : '';
                  const quantity = row.item.Quantity || 1;
                  const totalPrice = priceNum && !isNaN(priceNum) ? (priceNum * quantity) : 0;
                  const totalStr = totalPrice > 0 ? ('$' + totalPrice.toFixed(2)) : '';
                  
                  const priceLineY = codeY + 10; // level with code/description start
                  doc.text(priceStr, priceX + 30, priceLineY, { align: 'center' });
                  doc.text(quantity.toString(), qtyX + 20, priceLineY, { align: 'center' });
                  doc.text(totalStr, totalX + 20, priceLineY, { align: 'center' });
                } else {
                  doc.setFontSize(10);
                  doc.setTextColor('#222');
                  const priceLineY = codeY + 10;
                  doc.text(String(row.item.Quantity || 1), qtyX + 20, priceLineY, { align: 'center' });
                }
                
                // Continue to next row
                rowIdx++;
                pageRow++;
                setTimeout(drawNextRow, 10); // Allow UI updates
              });
            });
          };
          
          // Start drawing
          drawNextRow();
        });
      });
    });
  }

  // Helper methods (exact same as original)
  
  async _loadJSPDF() {
    return new Promise((resolve, reject) => {
      if (window.jsPDF) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  _loadImageAsDataURL(src, callback) {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const maxWidth = 400;
      const maxHeight = 150;
      
      let newWidth = img.width;
      let newHeight = img.height;
      
      if (newWidth > maxWidth || newHeight > maxHeight) {
        const widthRatio = maxWidth / newWidth;
        const heightRatio = maxHeight / newHeight;
        const scale = Math.min(widthRatio, heightRatio);
        
        newWidth = Math.round(newWidth * scale);
        newHeight = Math.round(newHeight * scale);
      }
      
      canvas.width = newWidth;
      canvas.height = newHeight;
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      
      const optimizedDataUrl = canvas.toDataURL('image/png');
      
      console.log(`🖼️ Logo optimized: ${img.width}x${img.height} -> ${newWidth}x${newHeight} (${(optimizedDataUrl.length / 1024).toFixed(1)}KB)`);
      
      callback(optimizedDataUrl, newWidth, newHeight);
    };
    img.onerror = () => callback(null, 0, 0);
    img.src = src;
  }

  _drawImage(doc, imgUrl, x, y, maxW, maxH, emailCompatible, callback) {
    if (!imgUrl) {
      if (callback) callback();
      return;
    }
    
    this.imageOptimizationStats.totalImages++;
    
    if (emailCompatible) {
      console.log(`📧 Email mode: Skipping image for smaller file size: ${imgUrl}`);
      this.imageOptimizationStats.failedImages++;
      if (callback) callback();
      return;
    }
    
    // Store reference to this for use in callbacks
    const self = this;
    
    this._optimizeImageForPDF(imgUrl, 400, 0.7)
      .then(optimizedUrl => {
        if (!optimizedUrl || optimizedUrl === 'assets/no-image.png') {
          self.imageOptimizationStats.failedImages++;
          if (callback) callback();
          return;
        }
        
        if (optimizedUrl.startsWith('data:')) {
          const base64Data = optimizedUrl.split(',')[1];
          const sizeInBytes = base64Data ? (base64Data.length * 0.75) : 0;
          
          if (sizeInBytes > 1048576) { // 1MB limit
            console.warn(`🚫 Image too large: ${Math.round(sizeInBytes / 1024)} KB, skipping`);
            self.imageOptimizationStats.failedImages++;
            if (callback) callback();
            return;
          }
          
          // Calculate aspect-ratio-preserving dimensions
          const imageElement = new Image();
          imageElement.onload = function() {
            try {
              const aspectRatio = imageElement.naturalWidth / imageElement.naturalHeight;
              
              // Use larger images as in original (120px max) but preserve aspect ratio
              let displayW = Math.min(maxW, 120);
              let displayH = Math.min(maxH, 120);
              
              // Preserve aspect ratio
              if (aspectRatio > 1) {
                // Landscape image - fit to width
                displayH = displayW / aspectRatio;
                if (displayH > 120) {
                  displayH = 120;
                  displayW = displayH * aspectRatio;
                }
              } else {
                // Portrait image - fit to height
                displayW = displayH * aspectRatio;
                if (displayW > 120) {
                  displayW = 120;
                  displayH = displayW / aspectRatio;
                }
              }
              
              doc.addImage(optimizedUrl, 'JPEG', x, y, displayW, displayH);
              console.log(`✅ Added image with preserved aspect ratio: ${displayW.toFixed(1)}x${displayH.toFixed(1)} (original: ${imageElement.naturalWidth}x${imageElement.naturalHeight})`);
              self.imageOptimizationStats.optimizedImages++;
            } catch (e) {
              console.warn('Failed to add image with aspect ratio:', e);
              // Fallback to original dimensions
              doc.addImage(optimizedUrl, 'JPEG', x, y, Math.min(maxW, 120), Math.min(maxH, 120));
              self.imageOptimizationStats.optimizedImages++;
            }
            if (callback) callback();
          };
          imageElement.onerror = function() {
            console.warn('Failed to load image for aspect ratio calculation');
            // Fallback to original dimensions if image load fails
            doc.addImage(optimizedUrl, 'JPEG', x, y, Math.min(maxW, 120), Math.min(maxH, 120));
            self.imageOptimizationStats.optimizedImages++;
            if (callback) callback();
          };
          imageElement.src = optimizedUrl;
        } else {
          // Non-data URL, skip
          self.imageOptimizationStats.failedImages++;
          if (callback) callback();
        }
      })
      .catch(error => {
        console.warn('Image optimization failed:', error);
        self.imageOptimizationStats.failedImages++;
        if (callback) callback();
      });
  }

  _optimizeImageForPDF(imageUrl, maxWidth = 400, quality = 0.9) {
    return new Promise((resolve) => {
      const proxies = [
        'https://api.codetabs.com/v1/proxy?quest=',
        'https://corsproxy.io/?',
      ];
      
      let proxyIndex = 0;
      
      const tryLoadImage = () => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        
        img.onload = function() {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            let width = Math.min(maxWidth, 400);
            let height = Math.min(maxWidth, 400);
            
            if (img.width > img.height) {
              height = Math.round((width * img.height) / img.width);
            } else {
              width = Math.round((height * img.width) / img.height);
            }
            
            if (img.width > 100 || img.height > 100) {
              width = Math.max(width, 200);
              height = Math.max(height, 200);
            }
            
            canvas.width = width;
            canvas.height = height;
            
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            
            ctx.drawImage(img, 0, 0, width, height);
            
            const reasonableQuality = Math.max(quality, 0.6);
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', reasonableQuality);
            
            resolve(optimizedDataUrl);
          } catch (error) {
            console.warn('Image optimization failed:', error);
            resolve('assets/no-image.png');
          }
        };
        
        img.onerror = function() {
          proxyIndex++;
          if (proxyIndex < proxies.length) {
            setTimeout(tryLoadImage, 1000);
          } else {
            resolve('assets/no-image.png');
          }
        };
        
        let proxiedUrl = imageUrl;
        if (proxyIndex < proxies.length) {
          proxiedUrl = proxies[proxyIndex] + encodeURIComponent(imageUrl);
        }
        
        img.src = proxiedUrl;
      };
      
      tryLoadImage();
    });
  }

  _drawPDFHeader(doc, pageWidth, colX, leftMargin, footerHeight, logoDataUrl, logoNaturalW, logoNaturalH, excludePrice) {
    const headerHeight = footerHeight + 5.7;
    doc.setFillColor('#a09484');
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

  _finalizePDF(doc, pageWidth, pageHeight, colX, leftMargin, footerHeight, logoDataUrl, logoNaturalW, logoNaturalH, userDetails, productCount) {
    console.log(`✅ Finished processing all ${productCount} products, finalizing PDF...`);
    
    const pageCount = doc.internal.getNumberOfPages() - 1;
    for (let i = 2; i <= pageCount + 1; i++) {
      doc.setPage(i);
      // Draw header on each page during finalization to ensure consistency
      this._drawPDFHeader(doc, pageWidth, colX, leftMargin, footerHeight, logoDataUrl, logoNaturalW, logoNaturalH, userDetails.excludePrice);
      
      // Footer bar (consistent with other pages)
      doc.setFillColor('#c4c4bc');
      doc.rect(0, pageHeight-footerHeight, pageWidth, footerHeight, 'F');
      doc.setTextColor('#fff');
      doc.setFontSize(11);
      doc.text('www.seima.com.au', pageWidth-140, pageHeight-10);
      doc.text('Page ' + (i-1) + ' of ' + pageCount, leftMargin, pageHeight-10);
    }
  }

  _generatePDFFilename(userDetails) {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const projectName = (userDetails.project || 'Selection').replace(/[^a-zA-Z0-9\s]/g, '');
    
    return `${projectName}-${dd}${mm}${yy}.${hh}${min}.pdf`;
  }

  _ensurePdfSpinner() {
    if (!document.getElementById('pdf-spinner')) {
      const spinner = document.createElement('div');
      spinner.id = 'pdf-spinner';
      spinner.style.cssText = `
        display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        z-index: 9999; background: rgba(255,255,255,0.7); align-items: center; justify-content: center;
      `;
      spinner.innerHTML = '<div style="border:6px solid #e0e0e0;border-top:6px solid #2563eb;border-radius:50%;width:54px;height:54px;animation:spin 1s linear infinite;"></div>';
      document.body.appendChild(spinner);
      
      if (!document.getElementById('pdf-spinner-style')) {
        const style = document.createElement('style');
        style.id = 'pdf-spinner-style';
        style.innerHTML = '@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }';
        document.head.appendChild(style);
      }
    }
  }

  _showProcessingNotification(userDetails) {
    const processingNotification = document.createElement('div');
    processingNotification.id = 'pdf-processing-notification';
    processingNotification.style.cssText = `
      position: fixed; top: 20px; right: 20px; z-index: 10001;
      background: #dbeafe; border: 1px solid #3b82f6; border-radius: 6px;
      padding: 16px; max-width: 320px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    const isEmailCompatible = userDetails.emailCompatible;
    
    processingNotification.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 18px; margin-right: 8px;">${isEmailCompatible ? '📧' : '📄'}</span>
        <strong style="color: #1e40af;">Creating your product selection files</strong>
      </div>
      <p style="margin: 0; color: #1e40af; font-size: 14px;">
        ${isEmailCompatible ? 'Creating text-only PDF without images for optimal email delivery.' : 'This may take a moment.'}
      </p>
    `;
    
    document.body.appendChild(processingNotification);
  }

  _removeNotifications() {
    const spinner = document.getElementById('pdf-spinner');
    if (spinner) spinner.style.display = 'none';
    
    const processingNotification = document.getElementById('pdf-processing-notification');
    if (processingNotification) {
      processingNotification.remove();
    }
  }

  _resetImageOptimizationStats() {
    this.imageOptimizationStats = {
      totalImages: 0,
      optimizedImages: 0,
      failedImages: 0
    };
  }

  _showImageOptimizationSummary(isEmailCompatible = false) {
    const stats = this.imageOptimizationStats;
    if (stats.totalImages > 0) {
      console.log(`🖼️ Image Optimization Summary:`);
      console.log(`   Total images: ${stats.totalImages}`);
      console.log(`   Optimized: ${stats.optimizedImages}`);
      console.log(`   Failed: ${stats.failedImages}`);
      console.log(`   Success rate: ${((stats.optimizedImages / stats.totalImages) * 100).toFixed(1)}%`);
      console.log(`   Email compatible mode: ${isEmailCompatible}`);
    }
  }

  // CSV Generation (exact same as original)
  generateCSV(userDetails) {
    try {
      const selection = dataService.getProductsLegacyFormat();
      
      if (!selection.length) {
        console.warn('⚠️ No products found for CSV generation');
        return null;
      }

      const csvData = selection.map(item => {
        const priceStr = (item.RRP_INCGST || '').toString().replace(/,/g, '');
        const priceNum = parseFloat(priceStr);
        const total = (!isNaN(priceNum) ? (priceNum * (item.Quantity || 1)).toFixed(2) : '');
        const excludePrice = userDetails.excludePrice;
        
        return {
          Code: this._sanitizeCSVField(item.OrderCode || ''),
          Description: this._sanitizeCSVField(item.Description || ''),
          Quantity: item.Quantity || 1,
          'Price ea inc GST': excludePrice ? '0.00' : (item.RRP_INCGST || ''),
          'Price Total inc GST': excludePrice ? '0.00' : total,
          Notes: this._sanitizeCSVField(item.Notes || ''),
          Room: this._sanitizeCSVField(item.Room || ''),
          'Image URL': this._sanitizeCSVField(item.Image_URL || ''),
          'Diagram URL': this._sanitizeCSVField(item.Diagram_URL || ''),
          'Datasheet URL': this._sanitizeCSVField(item.Datasheet_URL || ''),
          'Website URL': this._sanitizeCSVField(item.Website_URL || '')
        };
      });

      const csvString = window.Papa.unparse(csvData, {
        quotes: true,
        quoteChar: '"',
        delimiter: ',',
        header: true,
        newline: '\r\n',
        skipEmptyLines: false,
        escapeChar: '"'
      });

      // Clean CSV for EmailJS compatibility - remove problematic characters
      const cleanedCSV = this._sanitizeCSVForEmail(csvString);
      console.log(`✅ CSV generated successfully (${cleanedCSV.length} characters)`);
      
      return cleanedCSV;

    } catch (error) {
      console.error('❌ CSV generation failed:', error);
      throw error;
    }
  }

  _sanitizeCSVField(value) {
    if (typeof value !== 'string') return String(value || '');
    return value.replace(/"/g, '""').replace(/[\r\n]/g, ' ');
  }

  /**
   * Sanitize CSV content for EmailJS compatibility
   * Remove problematic characters that can break email attachments
   */
  _sanitizeCSVForEmail(csvString) {
    return csvString
      // Remove null bytes and control characters (except \r, \n, \t)
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // Replace non-ASCII characters with closest ASCII equivalent
      .replace(/[^\x00-\x7F]/g, function(char) {
        // Common replacements for special characters
        const replacements = {
          '\u20AC': 'EUR', // €
          '\u00A3': 'GBP', // £ 
          '\u00A5': 'YEN', // ¥
          '\u00A9': '(c)', // ©
          '\u00AE': '(r)', // ®
          '\u2122': 'TM',  // ™
          '\u2026': '...', // …
          '\u201C': '"',   // "
          '\u201D': '"',   // "
          '\u2018': "'",   // '
          '\u2019': "'",   // '
          '\u2013': '-',   // –
          '\u2014': '-'    // —
        };
        return replacements[char] || '?';
      })
      // Ensure proper line endings
      .replace(/\r?\n/g, '\r\n')
      // Remove any remaining problematic sequences
      .replace(/\0/g, '');
  }

  generateFileName(userDetails, type) {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const projectName = (userDetails.project || 'Selection').replace(/[^a-zA-Z0-9\s]/g, '');
    
    return `${projectName}-${dd}${mm}${yy}.${hh}${min}.${type}`;
  }
}

// Create singleton instance
export const pdfService = new PDFService(); 