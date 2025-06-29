const predefinedRooms = [
  { name: "Bath 1", icon: "🛁" },
  { name: "Bath 2", icon: "🛁" },
  { name: "Bath 3", icon: "🛁" },
  { name: "Ensuite", icon: "🚿" },
  { name: "Powder", icon: "🚽" },
  { name: "Kitchen", icon: "🍽️" },
  { name: "Butlers", icon: "👨‍🍳" },
  { name: "Laundry", icon: "🧺" },
  { name: "Alfresco", icon: "🍽️" }
];

let customRooms = JSON.parse(localStorage.getItem('customRooms') || '[]');
let selectedRoom = null;
let scannerControls = null;
let productCatalog = [];
let productCatalogLoaded = false;
let scannerEngine = 'zxing'; // default

// Load PapaParse for CSV parsing
(function loadPapaParse() {
  if (!window.Papa) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js';
    script.onload = loadProductCatalog;
    document.head.appendChild(script);
  } else {
    loadProductCatalog();
  }
})();

function loadProductCatalog() {
  const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQw5X0aAe5yYbfqfTlgBIdNqnDIjs-YFhNh1IQ8lIB5RfjBl5VBRwQAMKIwlXz6L6oXI8ittrQD91Ob/pub?gid=114771048&single=true&output=csv';
  window.Papa.parse(csvUrl, {
    download: true,
    header: true,
    complete: function(results) {
      // Restore original mapping logic
      productCatalog = results.data.map(row => {
        const product = {
          Description: row['Description'] || '',
          ProductName: (row['Product Name'] || '').trim(),
          OrderCode: row['Order Code'] || row['OrderCode'] || '',
          LongDescription: row['Long Description'] || row['LongDescription'] || '',
          RRP_EXGST: (row['RRP EX GST'] || row['RRP_EXGST'] || '').toString().trim(),
          RRP_INCGST: (row['RRP INC GST'] || row['RRP_INCGST'] || '').toString().trim(),
          Website_URL: row['Website_URL'] || row['Website URL'] || '',
          Image_URL: row['Image_URL'] || row['Image URL'] || '',
          Diagram_URL: row['Diagram_URL'] || row['Diagram URL'] || '',
          Datasheet_URL: row['Datasheet_URL'] || row['Datasheet URL'] || '',
          BARCODE: row['BARCODE'] || '',
          Group: row['Group'] || '',
          ReleaseNote: row['Release Note'] || '',
          X_Dimension: row['X Dimension (mm)'] || '',
          Y_Dimension: row['Y Dimension (mm)'] || '',
          Z_Dimension: row['Z Dimension (mm)'] || '',
          Weight: row['WEIGHT'] || '',
          WELS_NO: row['WELS NO'] || '',
          WELS_STAR: row['WELS STAR'] || '',
          WELS_CONSUMPTION: row['WELS CONSUMPTION'] || '',
          WELS_Expiry: row['WELS Expiry'] || '',
          WATERMARK: row['WATERMARK'] || '',
          ...row
        };
        // Debug logging for 191046
        if (product.OrderCode === '191046') {
          console.log('DEBUG 191046 row:', row);
          console.log('DEBUG 191046 final Image_URL:', product.Image_URL);
        }
        return product;
      });
      window.productCatalog = productCatalog;
      productCatalogLoaded = true;
    },
    error: function(err) {
      alert('Failed to load product catalog.');
    }
  });
}

function showRoomSelection() {
  fetch('screens/room-selection.html')
    .then(res => res.text())
    .then(html => {
      document.body.innerHTML = html;
      renderRoomGrid();
      document.getElementById('back-to-welcome').onclick = () => location.reload();
      document.getElementById('add-custom-room').onclick = handleAddCustomRoom;
    });
}

function renderRoomGrid() {
  const grid = document.getElementById('room-grid');
  if (!grid) return;
  grid.innerHTML = '';
  // Render predefined rooms
  predefinedRooms.forEach(room => {
    const btn = document.createElement('button');
    btn.className = 'room-btn';
    btn.innerHTML = `<span class="room-icon">${room.icon}</span>${room.name}`;
    btn.onclick = () => selectRoom(room.name);
    grid.appendChild(btn);
  });
  // Render custom rooms
  customRooms.forEach((room, idx) => {
    const btn = document.createElement('button');
    btn.className = 'room-btn';
    btn.innerHTML = `<span class=\"room-icon\">📝</span>${room.name}`;
    btn.onclick = () => selectRoom(room.name);
    btn.ondblclick = () => handleRemoveCustomRoom(idx);
    btn.title = 'Double-click to remove';
    grid.appendChild(btn);
  });
}

function selectRoom(roomName) {
  selectedRoom = roomName;
  showScannerScreen();
}

function showScannerScreen() {
  // Before rendering scanner, stop any active scanning
  if (window.scannerController) window.scannerController.stopScanning();
  fetch('screens/scanner.html')
    .then(res => res.text())
    .then(html => {
      document.body.innerHTML = html;
      document.getElementById('current-room-badge').textContent = selectedRoom;
      document.getElementById('back-to-rooms').onclick = () => {
        if (window.scannerController) window.scannerController.stopScanning();
        showRoomSelection();
      };
      setupProductSearch();
      // Scanner engine toggle
      const engineToggle = document.getElementById('scanner-engine-toggle');
      if (engineToggle) {
        engineToggle.value = scannerEngine;
        engineToggle.onchange = function() {
          scannerEngine = engineToggle.value;
          window.scannerController.stopScanning();
          window.scannerController.startScanning();
        };
      }
      // Start scanning using ScannerController
      window.scannerController.startScanning();
      document.getElementById('review-btn').onclick = () => {
        if (window.scannerController) window.scannerController.stopScanning();
        showReviewScreen();
      };
      updateSelectionCount();
    });
}

function setupProductSearch() {
  const input = document.getElementById('product-search-input');
  const dropdown = document.getElementById('product-search-dropdown');
  if (!input || !dropdown) return;
  let matches = [];
  input.addEventListener('focus', function() {
    if (window.scannerController) window.scannerController.stopScanning();
    setTimeout(() => {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  });
  input.addEventListener('blur', function() {
    if (window.scannerController) window.scannerController.startScanning();
  });
  input.addEventListener('input', function() {
    const q = input.value.trim().toLowerCase();
    if (!q || !productCatalogLoaded) {
      dropdown.innerHTML = '';
      dropdown.classList.remove('visible');
      return;
    }
    matches = productCatalog.filter(p => {
      return (
        (p.Description && p.Description.toLowerCase().includes(q)) ||
        (p.ProductName && p.ProductName.toLowerCase().includes(q)) ||
        (p.OrderCode && String(p.OrderCode).toLowerCase().includes(q)) ||
        (p.BARCODE && String(p.BARCODE).toLowerCase().includes(q))
      );
    });
    matches = matches.slice(0, 8);
    if (matches.length === 0) {
      dropdown.innerHTML = '<li>No products found</li>';
      dropdown.classList.add('visible');
      return;
    }
    dropdown.innerHTML = matches.map((p, i) => `<li data-idx="${i}">${p.Description}</li>`).join('');
    dropdown.classList.add('visible');
  });
  dropdown.onclick = function(e) {
    const li = e.target.closest('li[data-idx]');
    if (!li) return;
    const idx = parseInt(li.getAttribute('data-idx'), 10);
    if (!isNaN(idx) && matches[idx]) {
      showProductDetailsScreen(matches[idx]);
    }
    dropdown.classList.remove('visible');
    input.value = '';
    if (window.scannerController) window.scannerController.startScanning();
  };
  document.addEventListener('click', function(e) {
    if (!dropdown.contains(e.target) && e.target !== input) {
      dropdown.classList.remove('visible');
      if (window.scannerController) window.scannerController.startScanning();
    }
  });
}

function handleAddCustomRoom() {
  if (predefinedRooms.length + customRooms.length >= 20) {
    alert('Maximum 20 rooms allowed.');
    return;
  }
  let name = prompt('Enter custom room name (max 30 chars):');
  if (!name) return;
  name = name.trim();
  if (!name) return;
  if (name.length > 30) {
    alert('Room name too long.');
    return;
  }
  const allNames = [...predefinedRooms.map(r => r.name.toLowerCase()), ...customRooms.map(r => r.name.toLowerCase())];
  if (allNames.includes(name.toLowerCase())) {
    alert('Room name already exists.');
    return;
  }
  customRooms.push({ name });
  localStorage.setItem('customRooms', JSON.stringify(customRooms));
  renderRoomGrid();
}

function handleRemoveCustomRoom(idx) {
  if (confirm(`Remove custom room '${customRooms[idx].name}'?`)) {
    customRooms.splice(idx, 1);
    localStorage.setItem('customRooms', JSON.stringify(customRooms));
    renderRoomGrid();
  }
}

function showProductDetailsScreen(product, options = {}) {
  fetch('screens/product-details.html')
    .then(res => res.text())
    .then(html => {
      document.body.innerHTML = html;
      const productImage = document.getElementById('product-image');
      if (productImage) {
        productImage.src = product.Image_URL || 'assets/no-image.png';
        productImage.onerror = function() {
          console.warn('Image failed to load:', product.Image_URL);
          this.src = 'assets/no-image.png';
        };
      }
      document.getElementById('product-name').textContent = product.Description || '';
      document.getElementById('product-code').textContent = product.OrderCode ? 'Code: ' + product.OrderCode : '';
      let price = '';
      // Robust price parsing: remove commas, parse float
      let priceNum = NaN;
      if (product.RRP_INCGST) {
        priceNum = parseFloat(product.RRP_INCGST.toString().replace(/,/g, ''));
      }
      if (!isNaN(priceNum) && priceNum > 0) {
        price = `$${priceNum.toFixed(2)} inc GST`;
      } else {
        price = 'Price unavailable';
      }
      document.getElementById('product-price-inline').textContent = price;
      document.getElementById('product-description').textContent = product.LongDescription || '';
      // Links
      setLink('datasheet-link', product.Datasheet_URL);
      setLink('diagram-link', product.Diagram_URL);
      setLink('website-link', product.Website_URL);
      // --- VARIANT DROPDOWN LOGIC ---
      const variantRow = document.getElementById('variant-select-row');
      const variantSelect = document.getElementById('variant-select');
      if (variantRow && variantSelect) {
        let productName = product.ProductName || product['Product Name'] || '';
        if (typeof productName === 'string') productName = productName.trim();
        let variants = [];
        if (productName) {
          variants = productCatalog.filter(p => {
            let pName = p.ProductName || p['Product Name'] || '';
            if (typeof pName === 'string') pName = pName.trim();
            return pName && pName === productName;
          });
        }
        if (variants.length > 1) {
          // Sort alphabetically by Description
          variants.sort((a, b) => (a.Description || '').localeCompare(b.Description || ''));
          variantRow.style.display = '';
          variantSelect.innerHTML = variants.map(v => `<option value="${v.OrderCode}"${v.OrderCode === product.OrderCode ? ' selected' : ''}>${v.Description}</option>`).join('');
          variantSelect.onchange = function() {
            const selectedCode = variantSelect.value;
            const selected = variants.find(v => v.OrderCode === selectedCode);
            if (selected && selected.OrderCode !== product.OrderCode) {
              // Keep notes and quantity if present
              const notes = document.getElementById('product-annotation')?.value || options.notes || '';
              const qtyInput = document.getElementById('product-quantity');
              let quantity = 1;
              if (qtyInput && qtyInput.value) {
                quantity = Math.max(1, parseInt(qtyInput.value, 10) || 1);
              } else if (options.quantity) {
                quantity = options.quantity;
              }
              showProductDetailsScreen(selected, { notes, quantity });
            }
          };
        } else {
          variantRow.style.display = 'none';
        }
      }
      // Room selector
      populateRoomSelect();
      // Add to Room
      document.getElementById('add-to-room-btn').onclick = function() {
        const notes = document.getElementById('product-annotation').value.trim();
        const room = document.getElementById('room-select').value;
        let quantity = 1;
        const qtyInput = document.getElementById('product-quantity');
        if (qtyInput && qtyInput.value) {
          quantity = Math.max(1, parseInt(qtyInput.value, 10) || 1);
        } else {
          console.warn('Quantity input not found, defaulting to 1');
        }
        addProductToSelection(product, notes, room, quantity);
      };
      // Back
      document.getElementById('back-to-scanner').onclick = showScannerScreen;
      // Add live character count for notes
      const annotationInput = document.getElementById('product-annotation');
      const charCount = document.getElementById('annotation-char-count');
      if (annotationInput && charCount) {
        annotationInput.addEventListener('input', function() {
          // Prevent carriage returns
          annotationInput.value = annotationInput.value.replace(/\r?\n|\r/g, ' ');
          charCount.textContent = annotationInput.value.length + '/140';
        });
        annotationInput.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') e.preventDefault();
        });
        charCount.textContent = annotationInput.value.length + '/140';
        // Restore notes if passed in options
        if (options.notes) annotationInput.value = options.notes;
      }
      // Restore quantity if passed in options
      if (options.quantity) {
        const qtyInput = document.getElementById('product-quantity');
        if (qtyInput) qtyInput.value = options.quantity;
      }
      // Set product links to always open in a new tab/window
      const diagramLink = document.getElementById('diagram-link');
      const datasheetLink = document.getElementById('datasheet-link');
      const websiteLink = document.getElementById('website-link');
      [diagramLink, datasheetLink, websiteLink].forEach(link => {
        if (link) {
          link.setAttribute('target', '_blank');
          link.setAttribute('rel', 'noopener noreferrer');
        }
      });
    });
}

function populateRoomSelect() {
  const select = document.getElementById('room-select');
  if (!select) return;
  const allRooms = [
    ...predefinedRooms.map(r => r.name),
    ...customRooms.map(r => r.name)
  ];
  select.innerHTML = allRooms.map(room => `<option value="${room}">${room}</option>`).join('');
  select.value = selectedRoom;
}

function setLink(id, url) {
  const el = document.getElementById(id);
  if (url && url !== '#') {
    el.href = url;
    el.style.display = '';
  } else {
    el.style.display = 'none';
  }
}

function addProductToSelection(product, notes, roomOverride, quantity) {
  const selection = JSON.parse(localStorage.getItem('selection') || '[]');
  const room = roomOverride || selectedRoom;
  // Check if product already exists in this room (by barcode or OrderCode)
  const idx = selection.findIndex(
    item => item.Room === room && (item.BARCODE === product.BARCODE || item.OrderCode === product.OrderCode)
  );
  if (idx !== -1) {
    // Increment quantity
    selection[idx].Quantity = (parseInt(selection[idx].Quantity, 10) || 1) + quantity;
    // Optionally update notes (append or replace)
    if (notes) selection[idx].Notes = notes;
    selection[idx].Timestamp = new Date().toISOString();
  } else {
    const item = {
      ...product,
      Room: room,
      Notes: notes,
      Quantity: quantity,
      Timestamp: new Date().toISOString()
    };
    selection.push(item);
  }
  localStorage.setItem('selection', JSON.stringify(selection));
  showReviewScreen();
}

function showReviewScreen() {
  fetch('screens/review.html')
    .then(res => res.text())
    .then(html => {
      document.body.innerHTML = html;
      renderReviewList();
      document.getElementById('add-more-btn').onclick = showScannerScreen;
      // Show modal on Send PDF
      document.getElementById('send-pdf-btn').onclick = function() {
        document.getElementById('pdf-email-modal').style.display = 'flex';
      };
      // Modal cancel button
      document.getElementById('pdf-email-cancel').onclick = function() {
        document.getElementById('pdf-email-modal').style.display = 'none';
      };
      // Modal submit handler
      document.getElementById('pdf-email-form').onsubmit = function(e) {
        e.preventDefault();
        const name = document.getElementById('user-name').value.trim();
        const project = document.getElementById('user-project').value.trim();
        const address = document.getElementById('user-address').value.trim();
        const email = document.getElementById('user-email').value.trim();
        const telephone = document.getElementById('user-telephone').value.trim();
        document.getElementById('pdf-email-modal').style.display = 'none';
        showPdfFormScreen({ name, project, address, email, telephone });
      };
      // Add back button handler
      const backBtn = document.getElementById('back-to-scanner');
      if (backBtn) backBtn.onclick = showScannerScreen;
    });
}

function renderReviewList() {
  const selection = JSON.parse(localStorage.getItem('selection') || '[]');
  const reviewList = document.getElementById('review-list');
  const emptyState = document.getElementById('review-empty');
  if (!selection.length) {
    reviewList.innerHTML = '';
    emptyState.style.display = '';
    return;
  }
  emptyState.style.display = 'none';
  // Group by room
  const byRoom = {};
  selection.forEach(item => {
    if (!byRoom[item.Room]) byRoom[item.Room] = [];
    byRoom[item.Room].push(item);
  });
  reviewList.innerHTML = Object.entries(byRoom).map(([room, items]) => `
    <div class="review-room-group">
      <div class="review-room-header">${room} <span class="room-count">(${items.length})</span></div>
      ${items.map((item, idx) => `
        <div class="review-product-card" style="display: flex; flex-direction: column; align-items: stretch;">
          <div style="display: flex; flex-direction: row; align-items: flex-start;">
            <div class="review-product-thumb-wrap">
              <img class="review-product-thumb" src="${item.Image_URL || 'assets/no-image.png'}" alt="Product" onerror="this.src='assets/no-image.png'; console.warn('Review image failed:', '${item.Image_URL}');" onload="console.log('Review image loaded:', '${item.Image_URL}');">
              <div class="review-qty-pill" data-room="${room}" data-idx="${idx}">
                <button class="review-qty-btn${(item.Quantity||1)===1?' delete':''}" data-action="decrement" title="${(item.Quantity||1)===1?'Delete':'Decrease'}">
                  ${(item.Quantity||1)===1?`<svg viewBox='0 0 64 64' width='64' height='64'><rect x='10' y='8' width='44' height='6' rx='3' fill='black'/><polygon points='7,18 57,18 52,58 12,58' fill='none' stroke='black' stroke-width='7'/></svg>`:'–'}
                </button>
                <span class="review-qty-value">${item.Quantity || 1}</span>
                <button class="review-qty-btn" data-action="increment" title="Increase">+</button>
              </div>
            </div>
            <div class="review-product-info">
              <div class="review-product-title">${item.Description || ''}</div>
              <div class="review-product-meta">
                <span class="review-product-code">${item.OrderCode ? 'Code: ' + item.OrderCode : ''}</span>
                <span class="review-product-price">${item.RRP_INCGST ? '$' + Number(item.RRP_INCGST).toFixed(2) + ' ea' : ''}</span>
              </div>
              <div class="review-product-notes">${item.Notes ? 'Notes: ' + item.Notes : ''}</div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');
  // Qty pill handlers
  document.querySelectorAll('.review-qty-pill').forEach(pill => {
    const room = pill.getAttribute('data-room');
    const idx = parseInt(pill.getAttribute('data-idx'), 10);
    pill.querySelectorAll('.review-qty-btn').forEach(btn => {
      btn.onclick = function() {
        const action = btn.getAttribute('data-action');
        let selection = JSON.parse(localStorage.getItem('selection') || '[]');
        let count = -1;
        const toUpdateIdx = selection.findIndex(item => {
          if (item.Room === room) count++;
          return item.Room === room && count === idx;
        });
        if (toUpdateIdx !== -1) {
          let qty = parseInt(selection[toUpdateIdx].Quantity, 10) || 1;
          if (action === 'increment') {
            qty++;
            selection[toUpdateIdx].Quantity = qty;
          } else if (action === 'decrement') {
            if (qty === 1) {
              selection.splice(toUpdateIdx, 1);
            } else {
              qty--;
              selection[toUpdateIdx].Quantity = qty;
            }
          }
          localStorage.setItem('selection', JSON.stringify(selection));
          renderReviewList();
        }
      };
    });
  });
}

function showPdfFormScreen(userDetails) {
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
    const selection = JSON.parse(localStorage.getItem('selection') || '[]');
    if (!selection.length) {
      alert('No products selected.');
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
      const min = String(now.getMinutes()).padStart(2,'0');
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
              console.warn('Image load timed out:', proxiedUrl);
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
              drawPDFHeader(doc, pageWidth, colX, leftMargin, footerHeight, logoDataUrl, logoNaturalW, logoNaturalH);
              currentY = footerHeight + 8;
              // Footer bar (reduced height and font size)
              doc.setFillColor('#888');
              doc.rect(0, pageHeight-footerHeight, pageWidth, footerHeight, 'F');
              doc.setTextColor('#fff');
              doc.setFontSize(11);
              doc.text('www.seima.com.au', pageWidth-140, pageHeight-10);
              doc.text('Page ' + (i-1) + ' of ' + pageCount, leftMargin, pageHeight-10);
            }
            doc.save('Seima-Product-Selection.pdf');
            return;
          }
          // New page if needed
          if (pageRow >= maxRowsPerPage) {
            doc.addPage();
            drawPDFHeader(doc, pageWidth, colX, leftMargin, footerHeight, logoDataUrl, logoNaturalW, logoNaturalH);
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
              doc.text(pdfPriceStr, Number(colX[3])+30, codeY+10, { align: 'center' });
              // Qty (top-aligned)
              doc.setFontSize(10);
              doc.setTextColor('#222');
              doc.text(String(row.item.Quantity || 1), Number(colX[4])+20, codeY+10, { align: 'center' });
              // Total (top-aligned, far right)
              doc.setFontSize(10);
              doc.setTextColor('#222');
              let pdfTotalStr = pdfPriceNum && !isNaN(pdfPriceNum) && pdfPriceNum > 0 ? ('$' + (pdfPriceNum * (row.item.Quantity || 1)).toFixed(2)) : '';
              doc.text(pdfTotalStr, Number(colX[5])+20, codeY+10, { align: 'center' });
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

// Helper to generate PDF as Blob (for email attachment)
async function generatePdfBlob(userDetails) {
  // Copy of showPdfFormScreen, but returns Blob instead of saving
  const selection = JSON.parse(localStorage.getItem('selection') || '[]');
  if (!selection.length) {
    alert('No products selected.');
    return null;
  }
  // Group by room
  const byRoom = {};
  selection.forEach(item => {
    if (!byRoom[item.Room]) byRoom[item.Room] = [];
    byRoom[item.Room].push(item);
  });
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
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
  // Footer bar (reduced height and font size)
  const footerHeight = 28;
  doc.addPage();
  drawPDFHeader(doc, pageWidth, colX, leftMargin, footerHeight, logoDataUrl, logoNaturalW, logoNaturalH);
  let currentY = footerHeight + 8;
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
        console.warn('Image load timed out:', proxiedUrl);
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
  function drawNextRow() {
    if (rowIdx >= rowsToDraw.length) {
      clearTimeout(globalTimeout);
      resolved = true;
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        drawPDFHeader(doc, pageWidth, colX, leftMargin, footerHeight, logoDataUrl, logoNaturalW, logoNaturalH);
        currentY = footerHeight + 8;
        doc.setFillColor('#888');
        doc.rect(0, pageHeight-footerHeight, pageWidth, footerHeight, 'F');
        doc.setTextColor('#fff');
        doc.setFontSize(14);
        doc.text('www.seima.com.au', pageWidth-180, pageHeight-16);
        doc.text('Page ' + i + ' of ' + pageCount, leftMargin, pageHeight-16);
      }
      console.log('PDF generation complete, resolving blob.');
      doc.output('blob', resolve);
      return;
    }
    // New page if needed
    if (pageRow >= maxRowsPerPage) {
      doc.addPage();
      drawPDFHeader(doc, pageWidth, colX, leftMargin, footerHeight, logoDataUrl, logoNaturalW, logoNaturalH);
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
        doc.text(pdfPriceStr, Number(colX[3])+30, codeY+10, { align: 'center' });
        // Qty (top-aligned)
        doc.setFontSize(10);
        doc.setTextColor('#222');
        doc.text(String(row.item.Quantity || 1), Number(colX[4])+20, codeY+10, { align: 'center' });
        // Total (top-aligned, far right)
        doc.setFontSize(10);
        doc.setTextColor('#222');
        let pdfTotalStr = pdfPriceNum && !isNaN(pdfPriceNum) && pdfPriceNum > 0 ? ('$' + (pdfPriceNum * (row.item.Quantity || 1)).toFixed(2)) : '';
        doc.text(pdfTotalStr, Number(colX[5])+20, codeY+10, { align: 'center' });
        rowIdx++;
        pageRow++;
        console.log('Finished row', rowIdx, 'of', rowsToDraw.length);
        drawNextRow();
      });
    });
  }
  drawNextRow();
}

// Helper: draw image maintaining aspect ratio
function drawImageWithAspect(doc, imgUrl, x, y, maxW, maxH, cb) {
  if (!imgUrl) return cb && cb();
  let proxiedUrl = imgUrl;
  // Use CORS proxy for PDF export only
  if (!imgUrl.startsWith('data:') && !imgUrl.startsWith('assets/')) {
    proxiedUrl = 'https://corsproxy.io/?' + encodeURIComponent(imgUrl);
    // Alternative: 'https://api.allorigins.win/raw?url=' + encodeURIComponent(imgUrl);
  }
  const img = new window.Image();
  img.crossOrigin = 'Anonymous';
  let finished = false;
  const timeout = setTimeout(() => {
    if (!finished) {
      finished = true;
      console.warn('Image load timed out:', proxiedUrl);
      if (cb) cb();
    }
  }, 10000);
  img.onload = function() {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    try {
      doc.addImage(img, 'JPEG', x, y, maxW, maxH);
    } catch (e) {
      console.error('addImage error:', e, 'for', proxiedUrl);
    }
    if (cb) cb();
  };
  img.onerror = function(e) {
    if (finished) return;
    finished = true;
    clearTimeout(timeout);
    console.error('Image failed to load for PDF:', proxiedUrl, e);
    if (cb) cb();
  };
  img.src = proxiedUrl;
}

// Update selection count in scanner
function updateSelectionCount() {
  const selection = JSON.parse(localStorage.getItem('selection') || '[]');
  const countEl = document.getElementById('selection-count');
  if (countEl) countEl.textContent = selection.length;
}

document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById('start-btn');
  if (startBtn) {
    startBtn.addEventListener('click', function() {
      showRoomSelection();
    });
  }
  const viewSelectionBtn = document.getElementById('view-selection-btn');
  if (viewSelectionBtn) {
    viewSelectionBtn.addEventListener('click', function() {
      showReviewScreen();
    });
  }
  const clearSelectionBtn = document.getElementById('clear-selection-btn');
  const clearModal = document.getElementById('clear-selection-modal');
  const modalCancelBtn = document.getElementById('modal-cancel-btn');
  const modalConfirmBtn = document.getElementById('modal-confirm-btn');
  if (clearSelectionBtn && clearModal && modalCancelBtn && modalConfirmBtn) {
    clearSelectionBtn.addEventListener('click', function() {
      clearModal.style.display = 'flex';
    });
    modalCancelBtn.addEventListener('click', function() {
      clearModal.style.display = 'none';
    });
    modalConfirmBtn.addEventListener('click', function() {
      localStorage.removeItem('selection');
      localStorage.removeItem('customRooms');
      clearModal.style.display = 'none';
      location.reload();
    });
  }
});

// --- ScannerController from scannerinfo.txt ---
class ScannerController {
    constructor() {
        this.isScanning = false;
        this.lastScannedCode = null;
        this.scanTimeout = null;
    }
    async startScanning() {
        if (this.isScanning) return;
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Camera access not supported');
            }
            await navigator.mediaDevices.getUserMedia({ video: true });
            this.isScanning = true;
            this.lastScannedCode = null;
            this.initializeQuagga();
        } catch (error) {
            console.error('Error starting scanner:', error);
            this.showCameraError();
        }
    }
    stopScanning() {
        if (!this.isScanning) return;
        this.isScanning = false;
        if (window.Quagga) {
            window.Quagga.stop();
        }
        if (this.scanTimeout) {
            clearTimeout(this.scanTimeout);
            this.scanTimeout = null;
        }
    }
    initializeQuagga() {
        // Device detection for mobile
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        let constraints;
        if (isMobile) {
            constraints = {
                width: { ideal: 640 },
                height: { ideal: 480 },
                facingMode: "environment"
            };
        } else {
            constraints = {
                width: { min: 640, ideal: 1920 },
                height: { min: 480, ideal: 1080 },
                facingMode: "environment",
                aspectRatio: { ideal: 1.7777777778 }
            };
        }
        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: "#scanner-viewport",
                constraints: constraints,
            },
            locator: {
                patchSize: "medium",
                halfSample: false
            },
            numOfWorkers: navigator.hardwareConcurrency || 4,
            frequency: 10,
            decoder: {
                readers: [
                    "ean_reader"
                ]
            },
            locate: true
        }, (err) => {
            if (err) {
                console.error('Quagga initialization failed:', err);
                this.showCameraError();
                return;
            }

            console.log('Quagga initialized successfully');
            Quagga.start();
        });

        // Handle successful scans
        Quagga.onDetected((result) => {
            this.handleScanResult(result);
        });
    }
    handleScanResult(result) {
        const code = result.codeResult.code;
        this.stopScanning();
        if (window.app && typeof window.app.handleScannedProduct === 'function') {
            window.app.handleScannedProduct(code);
        } else {
            // fallback: show in feedback
            const feedback = document.getElementById('scanner-feedback');
            if (feedback) feedback.textContent = 'Detected: ' + code;
        }
    }
    provideHapticFeedback() {
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }
        this.playScanSound();
    }
    playScanSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    }
    showCameraError() {
        const viewport = document.getElementById('scanner-viewport');
        if (viewport) {
            viewport.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: white; text-align: center; padding: 20px;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📷</div>
                    <h3>Camera Access Required</h3>
                    <p>Please allow camera access to scan barcodes, or use the manual entry below.</p>
                    <button onclick="scannerController.startScanning()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: #1e40af; color: white; border: none; border-radius: 8px; cursor: pointer;">Try Again</button>
                </div>
            `;
        }
    }
    setManualBarcode(code) {
        const input = document.getElementById('manual-barcode');
        if (input) {
            input.value = code;
        }
    }
    cleanup() {
        this.stopScanning();
        this.lastScannedCode = null;
    }
}
window.scannerController = new ScannerController();
window.addEventListener('beforeunload', () => {
    if (window.scannerController) {
        window.scannerController.cleanup();
    }
});
// --- End ScannerController ---

window.app = {
  handleScannedProduct: function(barcode) {
    if (!productCatalogLoaded) {
      document.getElementById('scanner-feedback').textContent = 'Product data loading, please wait...';
      return;
    }
    // Show detected barcode in UI
    document.getElementById('scanner-feedback').textContent = 'Detected: ' + barcode;
    const product = productCatalog.find(p => p.BARCODE && p.BARCODE.trim() === barcode.trim());
    if (product) {
      showProductDetailsScreen(product);
    } else {
      document.getElementById('scanner-feedback').textContent = 'Barcode not found: ' + barcode;
      setTimeout(() => window.scannerController.startScanning(), 1500);
    }
  }
};

function drawPDFHeader(doc, pageWidth, colX, leftMargin, footerHeight, logoDataUrl, logoNaturalW, logoNaturalH) {
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
  doc.text('Price ea', colX[3]+30, colY, { align: 'center' });
  doc.text('Qty', colX[4]+20, colY, { align: 'center' });
  doc.text('Total', colX[5]+20, colY, { align: 'center' });
}

// Helper to load an image as a base64 data URL
function loadImageAsDataURL(src, cb) {
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