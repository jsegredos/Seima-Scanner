import { StorageManager } from './storage.js';
import { CONFIG } from './config.js';
import { dataService } from './data-service.js';
import { ScannerController } from './scanner.js';
import { Utils } from './utils.js';
import Sortable from 'https://cdn.jsdelivr.net/npm/sortablejs@1.15.2/modular/sortable.esm.js';

// Navigation and screen management
export class NavigationManager {
  constructor() {
    this.currentScreen = 'welcome';
    this.selectedRoom = null;
    this.scannerController = new ScannerController();
    this.dataService = dataService;
    this.reviewSortables = [];
    this.currentEditSelectionId = null;
    this.setupScannerCallback();
  }

  setupScannerCallback() {
    this.scannerController.setOnScanCallback((code) => {
      if (!this.dataService.isLoaded) {
        this.showScanFeedback('Product data loading, please wait...');
        return;
      }
      
      // Show detected barcode in feedback
      this.showScanFeedback(`Detected: ${code}`);
      
      // Find product by barcode (not order code)
      const product = this.dataService.findProductByBarcode(code);
      
      if (product) {
        this.showProductDetailsScreen(product, { scannedCode: code });
      } else {
        this.showScanFeedback(`Barcode not found: ${code}`);
        // Restart scanning after delay like the original
        setTimeout(() => {
          if (this.scannerController) {
            this.scannerController.startScanning();
          }
        }, 1500);
      }
    });
  }

  async init() {
    // Load product catalog
    try {
      await this.dataService.init();
    } catch (error) {
      console.error('Failed to load product catalog:', error);
    }

    // Setup welcome screen
    this.setupWelcomeScreen();
    this.updateSelectionCount();

    // Initialize scanner early (after DOM is ready, in parallel with catalog load)
    // This ensures the BarcodeDetector polyfill is ready when needed
    // Small delay to ensure DOM is fully ready
    setTimeout(() => {
      console.log('🚀 Initializing scanner...');
      this.scannerController.initialize().then(() => {
        console.log('✅ Scanner pre-initialized and ready');
      }).catch(error => {
        console.error('❌ Scanner pre-initialization failed:', error);
      });
    }, 100);
  }

  setupWelcomeScreen() {
    const startBtn = document.getElementById('start-btn');
    const viewSelectionBtn = document.getElementById('view-selection-btn');
    const clearSelectionBtn = document.getElementById('clear-selection-btn');
    const seimaContactBtn = document.getElementById('seima-contact-btn');

    if (startBtn) {
      startBtn.onclick = () => this.showRoomSelection();
    }

    if (viewSelectionBtn) {
      viewSelectionBtn.onclick = () => this.showReviewScreen();
    }

    if (clearSelectionBtn) {
      clearSelectionBtn.onclick = () => this.showClearConfirmModal();
    }

    if (seimaContactBtn) {
      seimaContactBtn.onclick = () => this.showSeimaContactModal();
    }

    // Setup Seima contact modal handlers
    this.setupSeimaContactModal();

    // Load version
    this.loadVersion();
  }

  async loadVersion() {
    try {
      const response = await fetch('version.txt');
      const versionText = await response.text();
      const lines = versionText.trim().split('\n');
      
      if (lines.length > 0) {
        // Get the latest version (first line) and extract just the version number
        const latestLine = lines[0];
        const versionMatch = latestLine.match(/^([^\s-]+)/);
        if (versionMatch) {
          const versionElement = document.getElementById('version-number');
          if (versionElement) {
            versionElement.textContent = versionMatch[1];
          }
        }
      }
    } catch (error) {
      console.warn('Could not load version:', error);
    }
  }

  async showRoomSelection() {
    try {
      const response = await fetch('screens/room-selection.html');
      const html = await response.text();
      document.body.innerHTML = html;
      
      this.currentScreen = 'room-selection';
      this.renderRoomGrid();
      
      // Setup event handlers
      const backBtn = document.getElementById('back-to-welcome');
      const addRoomBtn = document.getElementById('add-custom-room');
      
      if (backBtn) {
        backBtn.onclick = () => location.reload();
      }
      
      if (addRoomBtn) {
        addRoomBtn.onclick = () => this.handleAddCustomRoom();
      }
    } catch (error) {
      console.error('Failed to load room selection screen:', error);
    }
  }

  renderRoomGrid() {
    const grid = document.getElementById('room-grid');
    if (!grid) return;

    grid.innerHTML = '';
    
    // Render predefined rooms
    CONFIG.ROOMS.PREDEFINED.forEach(room => {
      const btn = document.createElement('button');
      btn.className = 'room-btn';
      btn.innerHTML = `<span class="room-icon">${room.icon}</span>${room.name}`;
      btn.onclick = () => this.selectRoom(room.name);
      grid.appendChild(btn);
    });

    // Render custom rooms
    const customRooms = StorageManager.getCustomRooms();
    customRooms.forEach((room, idx) => {
      const btn = document.createElement('button');
      btn.className = 'room-btn';
      btn.innerHTML = `<span class="room-icon">📝</span>${room.name}`;
      btn.onclick = () => this.selectRoom(room.name);
      btn.ondblclick = () => this.handleRemoveCustomRoom(idx);
      btn.title = 'Double-click to remove';
      grid.appendChild(btn);
    });
  }

  selectRoom(roomName) {
    this.selectedRoom = roomName;
    this.showScannerScreen();
  }

  async showScannerScreen() {
    // Prevent double requests
    if (this._loadingScannerScreen) {
      console.log('Scanner screen already loading');
      return;
    }
    
    this._loadingScannerScreen = true;
    let tempStream = null;

    try {
      // Stop any active scanning first
      this.scannerController.stopScanning();
      
      // CRITICAL: Request camera permission BEFORE async fetch operation
      // This maintains the user gesture chain in iOS Chrome
      console.log('🎥 Requesting camera permission...');
      
      try {
        // Check if permission API is available (not in all browsers)
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const permissionStatus = await navigator.permissions.query({ name: 'camera' });
            console.log('Camera permission status:', permissionStatus.state);
            
            // If permission is already granted, we can skip the temp stream
            if (permissionStatus.state === 'granted') {
              console.log('✅ Camera permission already granted, skipping temp stream');
            } else {
              // Request temp stream to trigger permission dialog
              tempStream = await navigator.mediaDevices.getUserMedia({
                video: {
                  facingMode: 'environment',
                  width: { ideal: 1280 },
                  height: { ideal: 720 }
                }
              });
              
              console.log('✅ Camera permission granted');
              
              // Immediately stop the temporary stream
              if (tempStream) {
                tempStream.getTracks().forEach(track => {
                  track.stop();
                });
                tempStream = null;
              }
            }
          } catch (permQueryError) {
            // Permissions API query failed, fall back to requesting stream
            console.log('Permissions API query failed, requesting stream directly');
            tempStream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
              }
            });
            
            console.log('✅ Camera permission granted');
            
            if (tempStream) {
              tempStream.getTracks().forEach(track => {
                track.stop();
              });
              tempStream = null;
            }
          }
        } else {
          // Permissions API not available, always request stream
          tempStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: 'environment',
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          });
          
          console.log('✅ Camera permission granted');
          
          if (tempStream) {
            tempStream.getTracks().forEach(track => {
              track.stop();
            });
            tempStream = null;
          }
        }
        
      } catch (permissionError) {
        // Camera permission denied or unavailable
        console.error('❌ Camera permission denied:', permissionError);
        this._loadingScannerScreen = false;
        
        // Show user-friendly error message
        let errorMessage = 'Camera access denied or unavailable.';
        if (permissionError.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please enable camera permissions in your browser settings.';
        } else if (permissionError.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else if (permissionError.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application.';
        }
        
        alert(errorMessage);
        return; // Don't proceed to scanner screen
      }
      
      // Now fetch the scanner HTML (permission already granted, no gesture needed)
      const response = await fetch('screens/scanner.html');
      const html = await response.text();
      document.body.innerHTML = html;
      
      this.currentScreen = 'scanner';
      
      // Setup UI
      const roomBadge = document.getElementById('current-room-badge');
      if (roomBadge) {
        roomBadge.textContent = this.selectedRoom;
      }

      // Setup event handlers
      this.setupScannerScreenHandlers();
      
      // Start scanning immediately (permission already granted)
      this.scannerController.startScanning().catch(error => {
        console.error('Failed to start scanner:', error);
      });
      
      this.updateSelectionCount();
      
    } catch (error) {
      console.error('Failed to load scanner screen:', error);
      alert('Failed to load scanner. Please try again.');
    } finally {
      // Clean up temp stream if something went wrong
      if (tempStream) {
        tempStream.getTracks().forEach(track => track.stop());
      }
      this._loadingScannerScreen = false;
    }
  }

  setupScannerScreenHandlers() {
    const backBtn = document.getElementById('back-to-rooms');
    const reviewBtn = document.getElementById('review-btn');
    const engineToggle = document.getElementById('scanner-engine-toggle');

    if (backBtn) {
      backBtn.onclick = () => {
        this.scannerController.stopScanning();
        this.showRoomSelection();
      };
    }

    if (reviewBtn) {
      reviewBtn.onclick = () => {
        this.scannerController.stopScanning();
        this.showReviewScreen();
      };
    }

    if (engineToggle) {
      engineToggle.value = this.scannerController.scannerEngine;
      engineToggle.onchange = () => {
        this.scannerController.setScannerEngine(engineToggle.value);
        this.scannerController.stopScanning();
        setTimeout(() => {
          if (this.currentScreen === 'scanner') {
            this.scannerController.startScanning();
          }
        }, 100);
      };
    }

    // Setup product search
    this.setupProductSearch();
  }


  setupProductSearch() {
    const input = document.getElementById('product-search-input');
    const dropdown = document.getElementById('product-search-dropdown');
    
    if (!input || !dropdown) return;

    let matches = [];

    // Debounced search function
    const debouncedSearch = Utils.debounce((query) => {
      this.performProductSearch(query, dropdown, matches);
    }, 300);

    input.addEventListener('focus', () => {
      this.scannerController.stopScanning();
      setTimeout(() => {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    });

    input.addEventListener('blur', () => {
      setTimeout(() => {
        if (this.currentScreen === 'scanner') {
          this.scannerController.startScanning();
        }
      }, 100);
    });

    input.addEventListener('input', () => {
      const query = input.value.trim();
      if (query) {
        debouncedSearch(query);
      } else {
        dropdown.innerHTML = '';
        dropdown.classList.remove('visible');
      }
    });

    dropdown.onclick = (e) => {
      const li = e.target.closest('li[data-idx]');
      if (!li) return;
      
      const idx = parseInt(li.getAttribute('data-idx'), 10);
      if (!isNaN(idx) && matches[idx]) {
        this.showProductDetailsScreen(matches[idx]);
      }
      
      dropdown.classList.remove('visible');
      input.value = '';
      setTimeout(() => {
        if (this.currentScreen === 'scanner') {
          this.scannerController.startScanning();
        }
      }, 100);
    };

    // Hide dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== input) {
        dropdown.classList.remove('visible');
      }
    });
  }

  performProductSearch(query, dropdown, matches) {
    if (!this.dataService.isLoaded) {
      dropdown.innerHTML = '<li>Loading catalog...</li>';
      dropdown.classList.add('visible');
      return;
    }

    matches.length = 0;
    matches.push(...this.dataService.searchProducts(query));

    if (matches.length === 0) {
      dropdown.innerHTML = '<li>No products found</li>';
    } else {
      dropdown.innerHTML = matches
        .map((p, i) => `<li data-idx="${i}">${p.OrderCode} - ${p.Description}</li>`)
        .join('');
    }
    
    dropdown.classList.add('visible');
  }

  async showProductDetailsScreen(product, options = {}) {
    try {
      const response = await fetch('screens/product-details.html');
      const html = await response.text();
      document.body.innerHTML = html;
      
      this.currentScreen = 'product-details';
      this.currentEditSelectionId = options.mode === 'edit' ? options.selectionId || null : null;
      this.populateProductDetails(product, options);
      this.setupProductDetailsHandlers(product, options);
    } catch (error) {
      console.error('Failed to load product details screen:', error);
    }
  }

  populateProductDetails(product, options) {
    // Set product image - use original simple approach
    const productImage = document.getElementById('product-image');
    if (productImage) {
      productImage.src = product.Image_URL || 'assets/no-image.png';
      productImage.onerror = function() {
        this.src = 'assets/no-image.png';
      };
    }

    // Set product name and details - using original format
    document.getElementById('product-name').textContent = product.Description || '';
    document.getElementById('product-code').textContent = product.OrderCode ? 'Code: ' + product.OrderCode : '';
    
    // Price formatting like original
    let price = '';
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

    // Setup links like original
    this.setLink('datasheet-link', product.Datasheet_URL);
    this.setLink('diagram-link', product.Diagram_URL);
    this.setLink('website-link', product.Website_URL);

    // Set product links to always open in a new tab/window like original
    const diagramLink = document.getElementById('diagram-link');
    const datasheetLink = document.getElementById('datasheet-link');
    const websiteLink = document.getElementById('website-link');
    [diagramLink, datasheetLink, websiteLink].forEach(link => {
      if (link) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });

    // --- VARIANT DROPDOWN LOGIC ---
    this.setupVariantDropdown(product, options);

    // Setup room select and quantity
    this.populateRoomSelect();
    this.setupQuantitySelect();
    this.setupAnnotationField();
    this.setupAnnotationCharacterCount(options);

    if (options.room) {
      const roomSelect = document.getElementById('room-select');
      if (roomSelect) {
        const hasExisting = Array.from(roomSelect.options).some(opt => opt.value === options.room);
        if (!hasExisting) {
          const option = document.createElement('option');
          option.value = options.room;
          option.textContent = options.room;
          roomSelect.appendChild(option);
        }
        roomSelect.value = options.room;
      }
    }

    // Restore quantity if passed in options
    if (options.quantity) {
      const qtyInput = document.getElementById('product-quantity');
      if (qtyInput) qtyInput.value = options.quantity;
    }

    // Show scan feedback if scanned
    if (options.scannedCode) {
      this.showScanFeedback(`Successfully scanned: ${options.scannedCode}`);
    }
  }

  populateRoomSelect() {
    const select = document.getElementById('room-select');
    if (!select) return;

    select.innerHTML = '';
    
    // Add predefined rooms
    CONFIG.ROOMS.PREDEFINED.forEach(room => {
      const option = document.createElement('option');
      option.value = room.name;
      option.textContent = room.name;
      if (room.name === this.selectedRoom) {
        option.selected = true;
      }
      select.appendChild(option);
    });

    // Add custom rooms
    const customRooms = StorageManager.getCustomRooms();
    customRooms.forEach(room => {
      const option = document.createElement('option');
      option.value = room.name;
      option.textContent = room.name;
      if (room.name === this.selectedRoom) {
        option.selected = true;
      }
      select.appendChild(option);
    });
  }

  setupQuantitySelect() {
    const select = document.getElementById('product-quantity');
    if (!select) return;

    select.innerHTML = '';
    CONFIG.UI.QUANTITY_OPTIONS.forEach(qty => {
      const option = document.createElement('option');
      option.value = qty;
      option.textContent = qty.toString();
      select.appendChild(option);
    });
  }

  setLink(id, url) {
    const el = document.getElementById(id);
    if (url && url !== '#') {
      el.href = url;
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  }

  setupVariantDropdown(product, options) {
    const variantRow = document.getElementById('variant-select-row');
    const variantSelect = document.getElementById('variant-select');
    
    if (variantRow && variantSelect) {
      let productName = product.ProductName || product['Product Name'] || '';
      if (typeof productName === 'string') productName = productName.trim();
      let variants = [];
      
      if (productName) {
        variants = this.dataService.getAllProducts().filter(p => {
          let pName = p.ProductName || p['Product Name'] || '';
          if (typeof pName === 'string') pName = pName.trim();
          return pName && pName === productName;
        });
      }
      
      if (variants.length > 1) {
        // Sort alphabetically by Description
        variants.sort((a, b) => (a.Description || '').localeCompare(b.Description || ''));
        variantRow.style.display = '';
        variantSelect.innerHTML = variants.map(v => 
          `<option value="${v.OrderCode}"${v.OrderCode === product.OrderCode ? ' selected' : ''}>${v.Description}</option>`
        ).join('');
        
        variantSelect.onchange = () => {
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
            const roomSelect = document.getElementById('room-select');
            const roomValue = roomSelect ? roomSelect.value : options.room;
            this.showProductDetailsScreen(selected, {
              ...options,
              notes,
              quantity,
              room: roomValue
            });
          }
        };
      } else {
        variantRow.style.display = 'none';
      }
    }
  }

  setupAnnotationCharacterCount(options) {
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
      if (options.notes) {
        annotationInput.value = options.notes;
        charCount.textContent = annotationInput.value.length + '/140';
      }
    }
  }

  setupAnnotationField() {
    // Now handled by setupAnnotationCharacterCount
  }

  setupProductDetailsHandlers(product, options = {}) {
    const backBtn = document.getElementById('back-to-scanner');
    const addBtn = document.getElementById('add-to-room-btn');
    const deleteBtn = document.getElementById('delete-selection-btn');

    if (backBtn) {
      backBtn.onclick = () => {
        if (options.mode === 'edit') {
          this.showReviewScreen();
        } else {
          this.showScannerScreen();
        }
      };
    }

    if (addBtn) {
      if (options.mode === 'edit' && options.selectionId) {
        addBtn.textContent = 'Save';
        addBtn.onclick = () => this.saveEditedProduct(product, options);
      } else {
        addBtn.textContent = 'Add to Room';
        addBtn.onclick = () => this.addProductToSelection(product);
      }
    }

    if (deleteBtn) {
      if (options.mode === 'edit' && options.selectionId) {
        deleteBtn.style.display = 'block';
        deleteBtn.onclick = () => this.showDeleteModal(product, options);
      } else {
        deleteBtn.style.display = 'none';
        deleteBtn.onclick = null;
      }
    }
  }

  saveEditedProduct(product, options) {
    if (!options.selectionId) return;

    const roomSelect = document.getElementById('room-select');
    const quantitySelect = document.getElementById('product-quantity');
    const annotationField = document.getElementById('product-annotation');

    const room = roomSelect ? roomSelect.value : '';
    const quantity = quantitySelect ? Math.max(1, parseInt(quantitySelect.value, 10) || 1) : 1;
    const notes = annotationField ? annotationField.value : '';

    const success = StorageManager.updateProductDetails(options.selectionId, {
      product: Utils.deepClone(product),
      room,
      quantity,
      notes
    });

    if (!success) {
      alert('Unable to save changes. Please try again.');
      return;
    }

    this.currentEditSelectionId = null;
    this.showReviewScreen();
  }

  showDeleteModal(product, options) {
    const modal = document.getElementById('delete-confirm-modal');
    if (!modal || !options.selectionId) return;

    const messageEl = document.getElementById('delete-confirm-message');
    if (messageEl) {
      messageEl.textContent = 'Confirm delete';
    }

    const cancelBtn = document.getElementById('delete-cancel-btn');
    const confirmBtn = document.getElementById('delete-confirm-btn');

    if (cancelBtn) {
      cancelBtn.onclick = () => {
        modal.style.display = 'none';
      };
    }

    if (confirmBtn) {
      confirmBtn.onclick = () => {
        const removed = StorageManager.removeProductFromSelection(options.selectionId);
        modal.style.display = 'none';
        if (!removed) {
          alert('Unable to remove this product. Please try again.');
          return;
        }
        this.currentEditSelectionId = null;
        this.showReviewScreen();
      };
    }

    modal.onclick = (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    };

    modal.style.display = 'flex';
  }

  escapeHtml(value) {
    if (typeof value !== 'string') return '';
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  addProductToSelection(product) {
    const roomSelect = document.getElementById('room-select');
    const quantitySelect = document.getElementById('product-quantity');
    const annotationField = document.getElementById('product-annotation');

    const room = roomSelect ? roomSelect.value : this.selectedRoom;
    const quantity = quantitySelect ? parseInt(quantitySelect.value) : 1;
    const notes = annotationField ? annotationField.value : '';

    if (StorageManager.addProductToSelection(product, notes, room, quantity)) {
      // Like the original, show review screen after adding
      this.showReviewScreen();
    } else {
      alert('Failed to add product to selection');
    }
  }

  async showReviewScreen() {
    try {
      const response = await fetch('screens/review.html');
      const html = await response.text();
      document.body.innerHTML = html;
      
      this.currentScreen = 'review';
      this.setupReviewScreenHandlers();
      this.renderReviewList();
    } catch (error) {
      console.error('Failed to load review screen:', error);
    }
  }

  setupReviewScreenHandlers() {
    const backBtn = document.getElementById('back-to-scanner');
    const addMoreBtn = document.getElementById('add-more-btn');
    const quickPdfBtn = document.getElementById('quick-pdf-btn');

    if (backBtn) {
      backBtn.onclick = () => this.showScannerScreen();
    }

    if (addMoreBtn) {
      addMoreBtn.onclick = () => this.showScannerScreen();
    }

    if (quickPdfBtn) {
      // Set up lead wizard integration if available
      if (window.leadWizardIntegration) {
        console.log('📧 Setting up lead wizard integration on review screen');
        // Store the original handler function (not an event handler)
        window.leadWizardIntegration.originalEmailHandler = () => this.showPdfFormModal();
        quickPdfBtn.onclick = (e) => {
          console.log('🧙‍♂️ Lead wizard intercepted email button (navigation)!');
          e.preventDefault();
          window.leadWizardIntegration.showLeadWizardFlow();
        };
      } else {
        // Fallback to original behavior
        quickPdfBtn.onclick = () => this.showPdfFormModal();
      }
    }
  }

  renderReviewList() {
    const reviewList = document.getElementById('review-list');
    const emptyState = document.getElementById('review-empty');

    if (!reviewList) return;

    const selectedProducts = StorageManager.getSelectedProducts();

    if (selectedProducts.length === 0) {
      reviewList.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      this.destroyReviewSortables();
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    const byRoom = this.groupProductsByRoom(selectedProducts);

    reviewList.innerHTML = Object.entries(byRoom).map(([room, items]) => `
      <div class="review-room-group" data-room="${room}">
        <div class="review-room-header">${room} <span class="room-count">(${items.length})</span></div>
        <div class="review-room-items" data-room="${room}">
        ${items.map(item => {
          const product = item.product;
          const description = product.Description || product.description || product.productName || product['Product Name'] || 'Product';
          const orderCode = product.OrderCode || product.orderCode || '';
          const imageUrl = product.Image_URL || product.imageUrl || 'assets/no-image.png';
          const rrpIncGst = product.RRP_INCGST || product.rrpIncGst || product.price || '';
          const quantity = item.quantity || 1;
          const numericPrice = rrpIncGst ? parseFloat(rrpIncGst.toString().replace(/[^0-9.-]/g, '')) : NaN;
          const priceLabel = !isNaN(numericPrice) ? `$${numericPrice.toFixed(2)} ea` : '';
          const notes = item.notes ? `Notes: ${item.notes}` : '';
          const descriptionText = this.escapeHtml(description);
          const orderCodeText = this.escapeHtml(orderCode);
          const notesText = notes ? this.escapeHtml(notes) : '';
          const codeDisplay = orderCode ? `Code: ${orderCodeText}` : 'Code: —';
          const qtyDisplay = `Qty: ${quantity}`;
          const priceDisplay = priceLabel || '—';

          return `
          <div class="review-product-card" data-id="${item.id}" data-room="${room}" aria-label="Selected product card">
            <div class="review-product-thumb-wrap">
              <img class="review-product-thumb" src="${imageUrl}" alt="Product" onerror="this.src='assets/no-image.png';">
            </div>
            <div class="review-product-info">
              <div class="review-product-title">${descriptionText}</div>
              <div class="review-product-meta">
                <span class="review-product-code">${codeDisplay}</span>
                <span class="review-product-qty">${qtyDisplay}</span>
                <span class="review-product-price">${priceDisplay}</span>
              </div>
            </div>
            ${notesText ? `<div class="review-product-notes">${notesText}</div>` : ''}
            <button class="review-edit-btn" data-id="${item.id}" aria-label="Edit product selection">
              <svg viewBox="0 0 24 24" role="img" aria-hidden="true">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm2.92.83l8.49-8.49 1.42 1.42-8.49 8.49H5.92zm13.71-11.54c.39-.39.39-1.02 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path>
              </svg>
            </button>
          </div>
          `;
        }).join('')}
        </div>
      </div>
    `).join('');

    this.setupReviewInteractions();
  }

  groupProductsByRoom(products) {
    return products.reduce((groups, item) => {
      const room = item.room || 'Unassigned';
      if (!groups[room]) groups[room] = [];
      groups[room].push(item);
      return groups;
    }, {});
  }

  setupReviewInteractions() {
    this.setupReviewEditButtons();
    this.setupDragAndDrop();
    this.updateRoomEmptyStates();
  }

  destroyReviewSortables() {
    if (this.reviewSortables && this.reviewSortables.length) {
      this.reviewSortables.forEach(instance => instance.destroy());
    }
    this.reviewSortables = [];
  }

  setupDragAndDrop() {
    const containers = Array.from(document.querySelectorAll('.review-room-items'));
    if (!containers.length) {
      this.destroyReviewSortables();
      return;
    }

    this.destroyReviewSortables();

    this.reviewSortables = containers.map(container => new Sortable(container, {
      group: { name: 'review-rooms', pull: true, put: true },
      animation: 160,
      draggable: '.review-product-card',
      handle: '.review-product-card',
      filter: '.review-edit-btn',
      delay: 180,
      delayOnTouchOnly: true,
      touchStartThreshold: 6,
      fallbackTolerance: 8,
      fallbackOnBody: true,
      ghostClass: 'review-card-ghost',
      chosenClass: 'review-card-chosen',
      dragClass: 'review-card-dragging',
      onFilter: (evt) => {
        evt.preventDefault();
      },
      onEnd: () => this.persistReorderedProducts()
    }));
  }

  persistReorderedProducts() {
    const selectedProducts = StorageManager.getSelectedProducts();
    if (!selectedProducts.length) return;

    const productMap = new Map(selectedProducts.map(item => [item.id, item]));
    const newOrder = [];

    document.querySelectorAll('.review-room-group').forEach(group => {
      const room = group.getAttribute('data-room') || 'Unassigned';
      const cards = group.querySelectorAll('.review-product-card');
      cards.forEach(card => {
        const id = card.getAttribute('data-id');
        const existing = productMap.get(id);
        if (existing) {
          newOrder.push({
            ...existing,
            room
          });
          productMap.delete(id);
        }
      });
    });

    // Append any items that may not have been rendered (safety)
    productMap.forEach(item => newOrder.push(item));

    const saved = StorageManager.setSelectedProducts(newOrder);
    if (!saved) {
      alert('Unable to save the new order. Please try again.');
      return;
    }
    this.renderReviewList();
    this.updateSelectionCount();
  }

  setupReviewEditButtons() {
    const editButtons = document.querySelectorAll('.review-edit-btn');
    editButtons.forEach(button => {
      // Use touchend for iOS compatibility
      const handleEdit = (event) => {
        event.preventDefault();
        event.stopPropagation();
        const selectionId = button.getAttribute('data-id');
        if (selectionId) {
          this.handleEditSelection(selectionId);
        }
      };
      
      button.addEventListener('touchend', handleEdit, { passive: false });
      button.addEventListener('click', handleEdit);
    });
  }

  handleEditSelection(selectionId) {
    const selectedProducts = StorageManager.getSelectedProducts();
    const selection = selectedProducts.find(item => item.id === selectionId);
    if (!selection) {
      alert('Unable to find product in selection.');
      return;
    }

    this.currentEditSelectionId = selectionId;
    const { product, notes, quantity, room } = selection;
    this.showProductDetailsScreen(product, {
      mode: 'edit',
      selectionId,
      notes,
      quantity,
      room
    });
  }

  updateRoomEmptyStates() {
    document.querySelectorAll('.review-room-items').forEach(container => {
      if (container.children.length === 0) {
        container.classList.add('is-empty');
      } else {
        container.classList.remove('is-empty');
      }
    });
  }

  // Removed unused renderRoomGroup method

  // renderProductCard method removed - using inline HTML in renderReviewList for proper quantity controls

  showPdfFormModal() {
    const modal = document.getElementById('pdf-email-modal');
    if (modal) {
      modal.style.display = 'flex';
      
      const form = document.getElementById('pdf-email-form');
      const cancelBtn = document.getElementById('pdf-email-cancel');
      
      if (cancelBtn) {
        cancelBtn.onclick = () => {
          modal.style.display = 'none';
        };
      }
      
      if (form) {
        form.onsubmit = (e) => {
          e.preventDefault();
          this.handlePdfFormSubmit();
          modal.style.display = 'none';
        };
      }
    }
  }

  handlePdfFormSubmit() {
    const form = document.getElementById('pdf-email-form');
    if (!form) return;

    const formData = new FormData(form);
    const userDetails = {
      name: formData.get('user-name'),
      project: formData.get('user-project'),
      address: formData.get('user-address'),
      email: formData.get('user-email'),
      telephone: formData.get('user-telephone'),
      excludePrice: formData.get('exclude-price') === 'on',
      exportCsv: formData.get('export-csv') === 'on',
      sendEmail: true // Always true since we're in the email flow
    };

    // Validate email address is provided
    if (!userDetails.email) {
      alert('Please enter an email address.');
      return;
    }

    // Show PDF generation (handled by separate PDF module)
    window.dispatchEvent(new CustomEvent('generatePdf', { detail: userDetails }));
  }

  handleAddCustomRoom() {
    const roomName = prompt('Enter custom room name:');
    if (roomName && roomName.trim()) {
      if (StorageManager.addCustomRoom(roomName.trim())) {
        this.renderRoomGrid();
      } else {
        alert('Room name already exists or is invalid');
      }
    }
  }

  handleRemoveCustomRoom(index) {
    if (confirm('Remove this custom room?')) {
      StorageManager.removeCustomRoom(index);
      this.renderRoomGrid();
    }
  }

  showClearConfirmModal() {
    const modal = document.getElementById('clear-selection-modal');
    if (modal) {
      modal.style.display = 'flex';
      
      const cancelBtn = document.getElementById('modal-cancel-btn');
      const confirmBtn = document.getElementById('modal-confirm-btn');
      
      if (cancelBtn) {
        cancelBtn.onclick = () => {
          modal.style.display = 'none';
        };
      }
      
      if (confirmBtn) {
        confirmBtn.onclick = () => {
          StorageManager.clearAllSelections();
          
          // Clear lead tracking data as well
          if (window.leadWizardIntegration) {
            window.leadWizardIntegration.clearCurrentLeadData();
            console.log('🧹 Lead data cleared with selection clear');
          }
          
          modal.style.display = 'none';
          this.updateSelectionCount();
        };
      }
    }
  }

  showScanFeedback(message) {
    const feedback = document.getElementById('scanner-feedback');
    if (feedback) {
      feedback.innerHTML = `
        <div style="color: #16a34a; background: #f0f9ff; padding: 8px; border-radius: 6px; margin: 4px 0;">
          ${Utils.sanitizeInput(message)}
        </div>
      `;
      
      setTimeout(() => {
        feedback.innerHTML = '';
      }, 3000);
    }
  }

  updateSelectionCount() {
    const countElement = document.getElementById('selection-count');
    if (countElement) {
      countElement.textContent = StorageManager.getSelectionCount().toString();
    }
  }

  setupSeimaContactModal() {
    const modal = document.getElementById('seima-contact-modal');
    if (!modal) return;

    const cancelBtn = document.getElementById('staff-contact-cancel-btn');
    const saveBtn = document.getElementById('staff-contact-save-btn');
    
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        modal.style.display = 'none';
      };
    }
    
    if (saveBtn) {
      saveBtn.onclick = () => this.handleSeimaContactSave();
    }

    // Load existing contact details if available
    this.loadSeimaContactDetails();
  }

  showSeimaContactModal() {
    const modal = document.getElementById('seima-contact-modal');
    if (modal) {
      modal.style.display = 'flex';
      // Load current contact details
      this.loadSeimaContactDetails();
    }
  }

  loadSeimaContactDetails() {
    const staffContact = StorageManager.getStaffContactDetails();
    
    const nameInput = document.getElementById('staff-name');
    const mobileInput = document.getElementById('staff-mobile');
    const emailInput = document.getElementById('staff-email');
    
    if (staffContact) {
      if (nameInput) nameInput.value = staffContact.name || '';
      if (mobileInput) mobileInput.value = staffContact.mobile || '';
      if (emailInput) emailInput.value = staffContact.email || '';
    }
  }

  handleSeimaContactSave() {
    const nameInput = document.getElementById('staff-name');
    const mobileInput = document.getElementById('staff-mobile');
    const emailInput = document.getElementById('staff-email');
    const statusDiv = document.getElementById('staff-details-status');
    
    if (!nameInput || !mobileInput || !emailInput) return;

    const name = nameInput.value.trim();
    const mobile = mobileInput.value.trim();
    const email = emailInput.value.trim();

    // Validate required fields
    if (!name || !mobile || !email) {
      this.showStaffContactStatus('Please fill in all required fields.', 'error');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.showStaffContactStatus('Please enter a valid email address.', 'error');
      return;
    }

    // Save contact details
    const contactDetails = { name, mobile, email };
    StorageManager.setStaffContactDetails(contactDetails);

    this.showStaffContactStatus('Contact details saved successfully!', 'success');
    
    // Close modal after 1.5 seconds
    setTimeout(() => {
      const modal = document.getElementById('seima-contact-modal');
      if (modal) {
        modal.style.display = 'none';
      }
    }, 1500);
  }

  showStaffContactStatus(message, type) {
    const statusDiv = document.getElementById('staff-details-status');
    if (!statusDiv) return;

    statusDiv.style.display = 'block';
    statusDiv.textContent = message;
    
    if (type === 'success') {
      statusDiv.style.background = '#d1fae5';
      statusDiv.style.border = '1px solid #10b981';
      statusDiv.style.color = '#065f46';
    } else if (type === 'error') {
      statusDiv.style.background = '#fee2e2';
      statusDiv.style.border = '1px solid #ef4444';
      statusDiv.style.color = '#991b1b';
    }

    // Hide status after 5 seconds
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 5000);
  }
} 