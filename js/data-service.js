/**
 * Unified Data Service for Seima Scanner
 * Handles all product selection data operations and storage format unification
 * Eliminates the dual storage format complexity throughout the application
 */

import { CONFIG } from './config.js';
import { Utils } from './utils.js';

export class DataService {
  constructor() {
    this.storageKeys = {
      LEGACY_SELECTION: 'selection',
      PRODUCTS: CONFIG.STORAGE_KEYS.SELECTED_PRODUCTS,
      CATALOG: CONFIG.STORAGE_KEYS.PRODUCT_CATALOG,
      CUSTOM_ROOMS: CONFIG.STORAGE_KEYS.CUSTOM_ROOMS,
      STAFF_CONTACT: CONFIG.STORAGE_KEYS.STAFF_CONTACT
    };
    
    // Product catalog state
    this.productCatalog = [];
    this.isLoaded = false;
  }

  /**
   * Initialize the data service and load product catalog
   */
  async init() {
    try {
      console.log('🔄 Initializing DataService...');
      await this.loadProductCatalog();
      this.isLoaded = true;
      console.log(`✅ DataService initialized with ${this.productCatalog.length} products`);
      return true;
    } catch (error) {
      console.error('❌ DataService initialization failed:', error);
      this.isLoaded = false;
      throw error;
    }
  }

  /**
   * Load product catalog from server or localStorage
   */
  async loadProductCatalog() {
    try {
      // Try loading from localStorage first
      const cached = this.getProductCatalog();
      if (cached && cached.length > 0) {
        this.productCatalog = cached;
        console.log(`📦 Loaded ${cached.length} products from cache`);
        return;
      }

      // Fetch from server
      console.log('🌐 Fetching product catalog from server...');
      const response = await fetch('pricelist.csv');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const csvText = await response.text();
      this.productCatalog = this.parseCSV(csvText);
      
      // Cache the loaded data
      this.setProductCatalog(this.productCatalog);
      console.log(`✅ Loaded ${this.productCatalog.length} products from server`);
      
    } catch (error) {
      console.error('❌ Failed to load product catalog:', error);
      // Use empty array as fallback
      this.productCatalog = [];
    }
  }

  /**
   * Parse CSV data into product objects
   */
  parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const products = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length >= headers.length) {
        const product = {};
        headers.forEach((header, index) => {
          product[header] = values[index] || '';
        });
        products.push(product);
      }
    }

    return products;
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  /**
   * Get all products from catalog
   */
  getAllProducts() {
    return this.productCatalog;
  }

  /**
   * Search products by query string
   */
  searchProducts(query, limit = 50) {
    if (!query || query.length < 2) return [];
    
    const searchTerm = query.toLowerCase();
    const matches = [];
    
    for (const product of this.productCatalog) {
      if (matches.length >= limit) break;
      
      const searchFields = [
        product.Description,
        product.OrderCode,
        product.ProductName,
        product['Product Name'],
        product.LongDescription
      ];
      
      const matchFound = searchFields.some(field => 
        field && field.toString().toLowerCase().includes(searchTerm)
      );
      
      if (matchFound) {
        matches.push(product);
      }
    }
    
    return matches;
  }

  /**
   * Find product by order code
   */
  findProductByCode(orderCode) {
    if (!orderCode) return null;
    
    const code = orderCode.toString().trim();
    return this.productCatalog.find(product => {
      const productCode = product.OrderCode || product.orderCode || '';
      return productCode.toString().trim() === code;
    });
  }

  /**
   * Get all selected products in unified format
   * Handles legacy format conversion automatically
   */
  getSelectedProducts() {
    try {
      // Try new format first
      const newFormat = JSON.parse(localStorage.getItem(this.storageKeys.PRODUCTS) || '[]');
      if (newFormat.length > 0) {
        return this._validateSelectionFormat(newFormat);
      }

      // Fallback to legacy format and convert
      const legacyFormat = JSON.parse(localStorage.getItem(this.storageKeys.LEGACY_SELECTION) || '[]');
      return this._convertLegacyFormat(legacyFormat);
    } catch (error) {
      console.error('Error loading selected products:', error);
      return [];
    }
  }

  /**
   * Add a product to selection
   */
  addProduct(product, notes = '', room = '', quantity = 1) {
    if (!this._validateProduct(product)) {
      throw new Error('Invalid product data');
    }

    const selectedProducts = this.getSelectedProducts();
    const selectionItem = {
      id: Utils.generateId(),
      product: Utils.deepClone(product),
      notes: Utils.sanitizeInput(notes, CONFIG.UI.ANNOTATION_MAX_LENGTH),
      room: Utils.sanitizeInput(room, 50),
      quantity: Math.max(1, Math.min(10, parseInt(quantity) || 1)),
      timestamp: Date.now()
    };

    selectedProducts.push(selectionItem);
    this._saveSelectedProducts(selectedProducts);
    
    console.log(`✅ Added ${product.OrderCode || 'product'} to selection`);
    return selectionItem;
  }

  /**
   * Remove a product from selection
   */
  removeProduct(selectionId) {
    const selectedProducts = this.getSelectedProducts();
    const filteredProducts = selectedProducts.filter(item => item.id !== selectionId);
    
    this._saveSelectedProducts(filteredProducts);
    console.log(`✅ Removed product from selection`);
    return filteredProducts;
  }

  /**
   * Update an existing product in selection
   */
  updateProduct(selectionId, updates) {
    const selectedProducts = this.getSelectedProducts();
    const productIndex = selectedProducts.findIndex(item => item.id === selectionId);
    
    if (productIndex === -1) {
      throw new Error('Product not found in selection');
    }

    // Apply updates while preserving structure
    const currentProduct = selectedProducts[productIndex];
    selectedProducts[productIndex] = {
      ...currentProduct,
      ...updates,
      id: selectionId, // Preserve ID
      timestamp: currentProduct.timestamp, // Preserve original timestamp
      notes: updates.notes ? Utils.sanitizeInput(updates.notes, CONFIG.UI.ANNOTATION_MAX_LENGTH) : currentProduct.notes,
      room: updates.room ? Utils.sanitizeInput(updates.room, 50) : currentProduct.room,
      quantity: updates.quantity ? Math.max(1, Math.min(10, parseInt(updates.quantity) || 1)) : currentProduct.quantity
    };

    this._saveSelectedProducts(selectedProducts);
    console.log(`✅ Updated product in selection`);
    return selectedProducts[productIndex];
  }

  /**
   * Clear all selected products
   */
  clearSelection() {
    localStorage.removeItem(this.storageKeys.PRODUCTS);
    localStorage.removeItem(this.storageKeys.LEGACY_SELECTION);
    console.log('✅ Cleared all selected products');
  }

  /**
   * Get products grouped by room
   */
  getProductsByRoom() {
    const selectedProducts = this.getSelectedProducts();
    const byRoom = {};
    
    selectedProducts.forEach(item => {
      const roomName = item.room || 'Unassigned';
      if (!byRoom[roomName]) byRoom[roomName] = [];
      byRoom[roomName].push(item);
    });
    
    return byRoom;
  }

  /**
   * Get selection statistics
   */
  getSelectionStats() {
    const selectedProducts = this.getSelectedProducts();
    const roomGroups = this.getProductsByRoom();
    
    return {
      totalProducts: selectedProducts.length,
      totalRooms: Object.keys(roomGroups).length,
      roomBreakdown: Object.entries(roomGroups).map(([room, products]) => ({
        room,
        count: products.length
      }))
    };
  }

  /**
   * Get products in legacy format for backward compatibility
   * Used by PDF generation and CSV export that expect the old format
   */
  getProductsLegacyFormat() {
    const selectedProducts = this.getSelectedProducts();
    return selectedProducts.map(item => ({
      ...item.product,
      Room: item.room,
      Notes: item.notes,
      Quantity: item.quantity,
      Timestamp: new Date(item.timestamp).toISOString()
    }));
  }

  /**
   * Staff contact management
   */
  getStaffContact() {
    try {
      const data = localStorage.getItem(this.storageKeys.STAFF_CONTACT);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.warn('Error loading staff contact:', error);
      return null;
    }
  }

  setStaffContact(contactDetails) {
    try {
      localStorage.setItem(this.storageKeys.STAFF_CONTACT, JSON.stringify(contactDetails));
      console.log('✅ Staff contact saved');
    } catch (error) {
      console.error('Error saving staff contact:', error);
      throw error;
    }
  }

  /**
   * Custom rooms management
   */
  getCustomRooms() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKeys.CUSTOM_ROOMS) || '[]');
    } catch (error) {
      console.warn('Error loading custom rooms:', error);
      return [];
    }
  }

  addCustomRoom(roomName) {
    const customRooms = this.getCustomRooms();
    if (!customRooms.find(room => room.name === roomName)) {
      customRooms.push({ name: roomName, timestamp: Date.now() });
      localStorage.setItem(this.storageKeys.CUSTOM_ROOMS, JSON.stringify(customRooms));
      console.log(`✅ Added custom room: ${roomName}`);
    }
  }

  removeCustomRoom(roomName) {
    const customRooms = this.getCustomRooms();
    const filtered = customRooms.filter(room => room.name !== roomName);
    localStorage.setItem(this.storageKeys.CUSTOM_ROOMS, JSON.stringify(filtered));
    console.log(`✅ Removed custom room: ${roomName}`);
  }

  /**
   * Product catalog persistence
   */
  getProductCatalog() {
    try {
      const data = localStorage.getItem(this.storageKeys.CATALOG);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn('Error loading product catalog from storage:', error);
      return [];
    }
  }

  setProductCatalog(catalogData) {
    try {
      localStorage.setItem(this.storageKeys.CATALOG, JSON.stringify(catalogData));
      console.log(`✅ Cached ${catalogData.length} products to storage`);
    } catch (error) {
      console.warn('Error caching product catalog:', error);
      // Non-critical error, continue without caching
    }
  }

  // Private methods

  /**
   * Convert legacy format to new format
   */
  _convertLegacyFormat(legacySelection) {
    if (!Array.isArray(legacySelection)) return [];
    
    return legacySelection.map(item => ({
      id: Utils.generateId(),
      product: { ...item },
      room: item.Room || '',
      notes: item.Notes || '',
      quantity: item.Quantity || 1,
      timestamp: item.Timestamp ? new Date(item.Timestamp).getTime() : Date.now()
    }));
  }

  /**
   * Validate selection format
   */
  _validateSelectionFormat(selection) {
    if (!Array.isArray(selection)) return [];
    
    return selection.filter(item => {
      return item && 
             typeof item === 'object' && 
             item.product && 
             typeof item.product === 'object';
    });
  }

  /**
   * Validate product data
   */
  _validateProduct(product) {
    return product && 
           typeof product === 'object' && 
           (product.OrderCode || product.Description);
  }

  /**
   * Save selected products to storage
   */
  _saveSelectedProducts(selectedProducts) {
    try {
      localStorage.setItem(this.storageKeys.PRODUCTS, JSON.stringify(selectedProducts));
      // Clear legacy storage to avoid confusion
      localStorage.removeItem(this.storageKeys.LEGACY_SELECTION);
    } catch (error) {
      console.error('Error saving selected products:', error);
      throw error;
    }
  }

  /**
   * Migration helper - migrate legacy data to new format
   */
  migrateLegacyData() {
    const legacyData = JSON.parse(localStorage.getItem(this.storageKeys.LEGACY_SELECTION) || '[]');
    const newData = JSON.parse(localStorage.getItem(this.storageKeys.PRODUCTS) || '[]');
    
    if (legacyData.length > 0 && newData.length === 0) {
      console.log('📦 Migrating legacy selection data...');
      const convertedData = this._convertLegacyFormat(legacyData);
      this._saveSelectedProducts(convertedData);
      console.log(`✅ Migrated ${convertedData.length} products to new format`);
      return true;
    }
    
    return false;
  }
}

// Create singleton instance
export const dataService = new DataService(); 