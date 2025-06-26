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
      // Normalize PriceList columns to legacy field names for app compatibility
      productCatalog = results.data.map(row => ({
        // Main display name remains Description
        Description: row['Description'] || '',
        ProductName: (row['Product Name'] || '').trim(),
        OrderCode: row['Order Code'] || row['OrderCode'] || '',
        LongDescription: row['Long Description'] || row['LongDescription'] || '',
        RRP_EXGST: row['RRP EX GST'] || row['RRP_EXGST'] || '',
        RRP_INCGST: row['RRP INC GST'] || row['RRP_INCGST'] || '',
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
        // Keep all other fields for future-proofing
        ...row
      }));
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
      // Fix: define variantRow and variantSelect for variant dropdown logic
      const variantRow = document.getElementById('variant-select-row');
      const variantSelect = document.getElementById('variant-select');
      // Populate product info
      document.getElementById('product-image').src = product.Image_URL || 'assets/no-image.png';
      document.getElementById('product-name').textContent = product.Description || '';
      document.getElementById('product-code').textContent = product.OrderCode ? 'Code: ' + product.OrderCode : '';
      document.getElementById('product-barcode').textContent = product.BARCODE ? 'Barcode: ' + product.BARCODE : '';
      document.getElementById('product-price').textContent = product.RRP_INCGST ? `$${Number(product.RRP_INCGST).toFixed(2)} inc GST` : '';
      document.getElementById('product-description').textContent = product.LongDescription || '';
      // Links
      setLink('datasheet-link', product.Datasheet_URL);
      setLink('diagram-link', product.Diagram_URL);
      setLink('website-link', product.Website_URL);
      // --- VARIANT DROPDOWN LOGIC ---
      if (variantRow && variantSelect) {
        let productName = product.ProductName || product['Product Name'] || '';
        if (typeof productName === 'string') productName = productName.trim();
        let variants = [];
        if (productName) {
          variants = window.productCatalog.filter(p => {
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
      document.getElementById('send-pdf-btn').onclick = showPdfFormScreen;
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
              <img class="review-product-thumb" src="${item.Image_URL || 'assets/no-image.png'}" alt="Product">
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

function showPdfFormScreen() {
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
  // --- Cover Page ---
  doc.setFontSize(32);
  doc.setTextColor('#222');
  doc.text('SEIMA Product Selection', pageWidth/2, 90, { align: 'center' });
  doc.setFontSize(18);
  doc.setTextColor('#444');
  doc.text('Client: John Smith', 60, 160);
  doc.text('Project: Example Project', 60, 190);
  doc.text('Date: ' + new Date().toLocaleDateString(), 60, 220);
  doc.setFontSize(14);
  doc.setTextColor('#888');
  doc.text('Generated by Seima Showroom Scanner', 60, 260);
  // Branding bar
  doc.setFillColor('#222');
  doc.rect(0, pageHeight-40, pageWidth, 40, 'F');
  doc.setTextColor('#fff');
  doc.setFontSize(16);
  doc.text('www.seima.com.au', pageWidth-180, pageHeight-16);
  // New page for product table
  doc.addPage();
  // Margins and layout
  const leftMargin = 32;
  const rightMargin = 32;
  const tableWidth = pageWidth - leftMargin - rightMargin;
  let currentY = 48;
  // Table headings (no Product/Diagram, Total at far right)
  const headers = ['Code', 'Description', 'Qty', 'Price ea', 'Total'];
  // Column layout: [images, code, description, qty, price, total]
  const imgW = 90, imgPad = 12;
  const codeX = leftMargin + imgW*2 + imgPad*2;
  const descX = codeX + 60;
  const qtyX = pageWidth - 240;
  const priceX = pageWidth - 160;
  const totalX = pageWidth - 80;
  const colX = [leftMargin, codeX, descX, qtyX, priceX, totalX];
  const colW = [imgW, imgW, 60, qtyX-descX, 80, 80];
  doc.setFontSize(10);
  doc.setTextColor('#555');
  doc.setFillColor('#e0e0e0');
  doc.rect(leftMargin, currentY, tableWidth, 18, 'F');
  doc.setTextColor('#222');
  // Align headers with columns
  doc.text('Code', codeX+30, currentY+12, { align: 'center' });
  doc.text('Description', descX + (qtyX-descX)/2, currentY+12, { align: 'center' });
  doc.text('Qty', qtyX+40, currentY+12, { align: 'center' });
  doc.text('Price ea', priceX+40, currentY+12, { align: 'center' });
  doc.text('Total', totalX+40, currentY+12, { align: 'center' });
  currentY += 24;
  // For each room, render products and a separator
  const roomNames = Object.keys(byRoom);
  const drawImage = (imgUrl, x, y, w, h, cb) => {
    if (!imgUrl) return cb && cb();
    // Try direct load first
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    let triedProxy = false;
    let finished = false;
    // Timeout: skip image if not loaded in 2 seconds
    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        if (cb) cb();
      }
    }, 2000);
    img.onload = function() {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      try { doc.addImage(img, 'JPEG', x, y, w, h); } catch(e) {/* image may be corrupt, skip */}
      if (cb) cb();
    };
    img.onerror = function() {
      if (finished) return;
      if (!triedProxy && /^https?:\/\//.test(imgUrl) && !imgUrl.includes('localhost') && !imgUrl.includes('127.0.0.1')) {
        // Retry with CORS proxy
        triedProxy = true;
        img.src = 'https://corsproxy.io/?' + imgUrl;
      } else {
        finished = true;
        clearTimeout(timeout);
        if (cb) cb();
      }
    };
    img.src = imgUrl;
  };
  // 4 products per page, equal height
  const maxRowsPerPage = 4;
  const rowHeight = Math.floor((pageHeight-120) / maxRowsPerPage);
  let rowsToDraw = [];
  roomNames.forEach((room, rIdx) => {
    const items = byRoom[room];
    items.forEach((item, iIdx) => {
      rowsToDraw.push({
        y: currentY,
        item,
        room,
        rIdx,
        iIdx,
        isFirstInRoom: iIdx === 0,
        roomCount: items.length
      });
      currentY += rowHeight;
      // Add separator after last item in room (except last room)
      if (iIdx === items.length-1 && rIdx < roomNames.length-1) {
        rowsToDraw.push({ isSeparator: true, y: currentY });
        currentY += 8;
      }
    });
  });
  // Draw all rows (images async)
  let rowIdx = 0;
  let pageRow = 0;
  function drawNextRow() {
    if (rowIdx >= rowsToDraw.length) {
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor('#222');
        doc.rect(0, pageHeight-40, pageWidth, 40, 'F');
        doc.setTextColor('#fff');
        doc.setFontSize(14);
        doc.text('www.seima.com.au', pageWidth-180, pageHeight-16);
        doc.text('Page ' + i + ' of ' + pageCount, leftMargin, pageHeight-16);
      }
      doc.save('Seima-Product-Selection.pdf');
      return;
    }
    const row = rowsToDraw[rowIdx];
    if (row.isSeparator) {
      doc.setDrawColor('#bbb');
      doc.setLineWidth(2);
      doc.line(leftMargin, row.y+4, pageWidth-rightMargin, row.y+4);
      rowIdx++;
      drawNextRow();
      return;
    }
    const { y, item, isFirstInRoom, room, roomCount } = row;
    // New page if needed
    if (pageRow >= maxRowsPerPage) {
      doc.addPage();
      currentY = 48;
      // Table header on new page
      doc.setFontSize(10);
      doc.setTextColor('#555');
      doc.setFillColor('#e0e0e0');
      doc.rect(leftMargin, currentY, tableWidth, 18, 'F');
      doc.setTextColor('#222');
      doc.text('Code', codeX+30, currentY+12, { align: 'center' });
      doc.text('Description', descX + (qtyX-descX)/2, currentY+12, { align: 'center' });
      doc.text('Qty', qtyX+40, currentY+12, { align: 'center' });
      doc.text('Price ea', priceX+40, currentY+12, { align: 'center' });
      doc.text('Total', totalX+40, currentY+12, { align: 'center' });
      currentY += 24;
      pageRow = 0;
    }
    // Room header (smaller, above image, left-aligned, margin below)
    if (isFirstInRoom) {
      doc.setFontSize(9);
      doc.setTextColor('#888');
      doc.text(room + ' (' + roomCount + ')', leftMargin, y+10);
    }
    // Product image (expanded)
    drawImage(item.Image_URL || '', colX[0], y+28, imgW, rowHeight-36, function() {
      // Diagram image (expanded)
      drawImage(item.Diagram_URL || '', colX[0]+imgW+imgPad, y+28, imgW, rowHeight-36, function() {
        // Code (top-aligned)
        doc.setFontSize(10);
        doc.setTextColor('#222');
        const codeY = y+28; // top-aligned
        doc.text(String(item.OrderCode || ''), Number(colX[1])+30, codeY+10, { align: 'center' });
        // Datasheet link under code, with padding
        if (item.Datasheet_URL && item.Datasheet_URL !== '#') {
          const dsY = codeY+26;
          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);
          doc.textWithLink('Datasheet', Number(colX[1])+30, dsY, { url: item.Datasheet_URL, align: 'center' });
          // Underline
          const dsWidth = doc.getTextWidth('Datasheet');
          doc.setDrawColor(180, 180, 180);
          doc.setLineWidth(0.7);
          doc.line(Number(colX[1])+30-dsWidth/2, dsY+1.5, Number(colX[1])+30+dsWidth/2, dsY+1.5);
        }
        // Add extra vertical space below code/datasheet
        let descY = codeY+44;
        // Description (top-aligned)
        doc.setFontSize(10);
        doc.setTextColor('#222');
        doc.text(String(item.Description || ''), Number(colX[2])+5, descY);
        // Notes below description, with padding
        if (item.Notes) {
          descY += 14;
          doc.setFontSize(9);
          doc.setTextColor('#444');
          const notesText = 'Notes: ' + String(item.Notes).replace(/\r?\n|\r/g, ' ');
          doc.text(notesText, Number(colX[2])+13, descY);
        }
        // Qty (top-aligned)
        doc.setFontSize(10);
        doc.setTextColor('#222');
        doc.text(String(item.Quantity || 1), Number(colX[3])+40, codeY+10, { align: 'center' });
        // Price ea (top-aligned)
        doc.setFontSize(10);
        doc.setTextColor('#222');
        doc.text(item.RRP_INCGST ? ('$' + Number(item.RRP_INCGST).toFixed(2)) : '', Number(colX[4])+40, codeY+10, { align: 'center' });
        // Total (top-aligned, far right)
        doc.setFontSize(10);
        doc.setTextColor('#222');
        doc.text(item.RRP_INCGST ? ('$' + (Number(item.RRP_INCGST) * (item.Quantity || 1)).toFixed(2)) : '', Number(colX[5])+40, codeY+10, { align: 'center' });
        rowIdx++;
        pageRow++;
        drawNextRow();
      });
    });
  }
  drawNextRow();
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
  // --- Cover Page ---
  doc.setFontSize(32);
  doc.setTextColor('#222');
  doc.text('SEIMA Product Selection', pageWidth/2, 90, { align: 'center' });
  doc.setFontSize(18);
  doc.setTextColor('#444');
  doc.text('Project: ' + (userDetails.project || ''), 60, 140);
  doc.text('Location: ' + (userDetails.location || ''), 60, 170);
  doc.text('Client: ' + (userDetails.name || ''), 60, 200);
  doc.text('Email: ' + (userDetails.email || ''), 60, 230);
  if (userDetails.mobile) doc.text('Mobile: ' + userDetails.mobile, 60, 260);
  if (userDetails.comments) doc.text('Comments: ' + userDetails.comments, 60, 290);
  doc.text('Date: ' + new Date().toLocaleDateString(), 60, 320);
  doc.setFontSize(14);
  doc.setTextColor('#888');
  doc.text('Generated by Seima Showroom Scanner', 60, 350);
  // Branding bar
  doc.setFillColor('#222');
  doc.rect(0, pageHeight-40, pageWidth, 40, 'F');
  doc.setTextColor('#fff');
  doc.setFontSize(16);
  doc.text('www.seima.com.au', pageWidth-180, pageHeight-16);
  // New page for product table
  doc.addPage();
  // Margins and layout
  const leftMargin = 32;
  const rightMargin = 32;
  const tableWidth = pageWidth - leftMargin - rightMargin;
  let currentY = 48;
  // Table headings (no Product/Diagram, Total at far right)
  const headers = ['Code', 'Description', 'Qty', 'Price ea', 'Total'];
  // Column layout: [images, code, description, qty, price, total]
  const imgW = 90, imgPad = 12;
  const codeX = leftMargin + imgW*2 + imgPad*2;
  const descX = codeX + 60;
  const qtyX = pageWidth - 240;
  const priceX = pageWidth - 160;
  const totalX = pageWidth - 80;
  const colX = [leftMargin, codeX, descX, qtyX, priceX, totalX];
  const colW = [imgW, imgW, 60, qtyX-descX, 80, 80];
  doc.setFontSize(10);
  doc.setTextColor('#555');
  doc.setFillColor('#e0e0e0');
  doc.rect(leftMargin, currentY, tableWidth, 18, 'F');
  doc.setTextColor('#222');
  // Align headers with columns
  doc.text('Code', codeX+30, currentY+12, { align: 'center' });
  doc.text('Description', descX + (qtyX-descX)/2, currentY+12, { align: 'center' });
  doc.text('Qty', qtyX+40, currentY+12, { align: 'center' });
  doc.text('Price ea', priceX+40, currentY+12, { align: 'center' });
  doc.text('Total', totalX+40, currentY+12, { align: 'center' });
  currentY += 24;
  // For each room, render products and a separator
  const roomNames = Object.keys(byRoom);
  const drawImage = (imgUrl, x, y, w, h, cb) => {
    if (!imgUrl) { console.log('No image URL, skipping'); return cb && cb(); }
    // Try direct load first
    const img = new window.Image();
    img.crossOrigin = 'Anonymous';
    let triedProxy = false;
    let finished = false;
    // Timeout: skip image if not loaded in 0.5 seconds
    const timeout = setTimeout(() => {
      if (!finished) {
        finished = true;
        console.warn('Image load timed out:', imgUrl);
        if (cb) cb();
      }
    }, 500);
    img.onload = function() {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      try { doc.addImage(img, 'JPEG', x, y, w, h); console.log('Image added:', imgUrl); } catch(e) { console.error('Image add error:', imgUrl, e); }
      if (cb) cb();
    };
    img.onerror = function(e) {
      if (finished) return;
      if (!triedProxy && /^https?:\/\//.test(imgUrl) && !imgUrl.includes('localhost') && !imgUrl.includes('127.0.0.1')) {
        // Retry with CORS proxy
        triedProxy = true;
        console.warn('Retrying image with proxy:', imgUrl);
        img.src = 'https://corsproxy.io/?' + imgUrl;
      } else {
        finished = true;
        clearTimeout(timeout);
        console.error('Image failed to load:', imgUrl, e);
        if (cb) cb();
      }
    };
    img.src = imgUrl;
  };
  // 4 products per page, equal height
  const maxRowsPerPage = 4;
  const rowHeight = Math.floor((pageHeight-120) / maxRowsPerPage);
  let rowsToDraw = [];
  roomNames.forEach((room, rIdx) => {
    const items = byRoom[room];
    items.forEach((item, iIdx) => {
      rowsToDraw.push({
        y: currentY,
        item,
        room,
        rIdx,
        iIdx,
        isFirstInRoom: iIdx === 0,
        roomCount: items.length
      });
      currentY += rowHeight;
      // Add separator after last item in room (except last room)
      if (iIdx === items.length-1 && rIdx < roomNames.length-1) {
        rowsToDraw.push({ isSeparator: true, y: currentY });
        currentY += 8;
      }
    });
  });
  // Draw all rows (images async)
  let rowIdx = 0;
  let pageRow = 0;
  return new Promise(resolve => {
    let resolved = false;
    // Global fallback timeout
    const globalTimeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.error('PDF generation timed out, forcing download.');
        doc.output('blob', resolve);
      }
    }, 5000);
    function drawNextRow() {
      if (rowIdx >= rowsToDraw.length) {
        clearTimeout(globalTimeout);
        resolved = true;
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFillColor('#222');
          doc.rect(0, pageHeight-40, pageWidth, 40, 'F');
          doc.setTextColor('#fff');
          doc.setFontSize(14);
          doc.text('www.seima.com.au', pageWidth-180, pageHeight-16);
          doc.text('Page ' + i + ' of ' + pageCount, leftMargin, pageHeight-16);
        }
        console.log('PDF generation complete, resolving blob.');
        doc.output('blob', resolve);
        return;
      }
      const row = rowsToDraw[rowIdx];
      if (row.isSeparator) {
        doc.setDrawColor('#bbb');
        doc.setLineWidth(2);
        doc.line(leftMargin, row.y+4, pageWidth-rightMargin, row.y+4);
        rowIdx++;
        drawNextRow();
        return;
      }
      const { y, item, isFirstInRoom, room, roomCount } = row;
      // New page if needed
      if (pageRow >= maxRowsPerPage) {
        doc.addPage();
        currentY = 48;
        // Table header on new page
        doc.setFontSize(10);
        doc.setTextColor('#555');
        doc.setFillColor('#e0e0e0');
        doc.rect(leftMargin, currentY, tableWidth, 18, 'F');
        doc.setTextColor('#222');
        doc.text('Code', codeX+30, currentY+12, { align: 'center' });
        doc.text('Description', descX + (qtyX-descX)/2, currentY+12, { align: 'center' });
        doc.text('Qty', qtyX+40, currentY+12, { align: 'center' });
        doc.text('Price ea', priceX+40, currentY+12, { align: 'center' });
        doc.text('Total', totalX+40, currentY+12, { align: 'center' });
        currentY += 24;
        pageRow = 0;
      }
      // Room header (smaller, above image, left-aligned, margin below)
      if (isFirstInRoom) {
        doc.setFontSize(9);
        doc.setTextColor('#888');
        doc.text(room + ' (' + roomCount + ')', leftMargin, y+10);
      }
      // Product image (expanded)
      drawImage(item.Image_URL || '', colX[0], y+28, imgW, rowHeight-36, function() {
        // Diagram image (expanded)
        drawImage(item.Diagram_URL || '', colX[0]+imgW+imgPad, y+28, imgW, rowHeight-36, function() {
          // Code (top-aligned)
          doc.setFontSize(10);
          doc.setTextColor('#222');
          const codeY = y+28; // top-aligned
          doc.text(String(item.OrderCode || ''), Number(colX[1])+30, codeY+10, { align: 'center' });
          // Datasheet link under code, with padding
          if (item.Datasheet_URL && item.Datasheet_URL !== '#') {
            const dsY = codeY+26;
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.textWithLink('Datasheet', Number(colX[1])+30, dsY, { url: item.Datasheet_URL, align: 'center' });
            // Underline
            const dsWidth = doc.getTextWidth('Datasheet');
            doc.setDrawColor(180, 180, 180);
            doc.setLineWidth(0.7);
            doc.line(Number(colX[1])+30-dsWidth/2, dsY+1.5, Number(colX[1])+30+dsWidth/2, dsY+1.5);
          }
          // Add extra vertical space below code/datasheet
          let descY = codeY+44;
          // Description (top-aligned)
          doc.setFontSize(10);
          doc.setTextColor('#222');
          doc.text(String(item.Description || ''), Number(colX[2])+5, descY);
          // Notes below description, with padding
          if (item.Notes) {
            descY += 14;
            doc.setFontSize(9);
            doc.setTextColor('#444');
            const notesText = 'Notes: ' + String(item.Notes).replace(/\r?\n|\r/g, ' ');
            doc.text(notesText, Number(colX[2])+13, descY);
          }
          // Qty (top-aligned)
          doc.setFontSize(10);
          doc.setTextColor('#222');
          doc.text(String(item.Quantity || 1), Number(colX[3])+40, codeY+10, { align: 'center' });
          // Price ea (top-aligned)
          doc.setFontSize(10);
          doc.setTextColor('#222');
          doc.text(item.RRP_INCGST ? ('$' + Number(item.RRP_INCGST).toFixed(2)) : '', Number(colX[4])+40, codeY+10, { align: 'center' });
          // Total (top-aligned, far right)
          doc.setFontSize(10);
          doc.setTextColor('#222');
          doc.text(item.RRP_INCGST ? ('$' + (Number(item.RRP_INCGST) * (item.Quantity || 1)).toFixed(2)) : '', Number(colX[5])+40, codeY+10, { align: 'center' });
          rowIdx++;
          pageRow++;
          console.log('Finished row', rowIdx, 'of', rowsToDraw.length);
          drawNextRow();
        });
      });
    }
    drawNextRow();
  });
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