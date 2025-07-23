/**
 * Unified Data Access Layer
 * Consolidates product catalog and storage management
 */

import { CONFIG } from './config.js';
import { StorageManager } from './storage.js';

export class DataLayer {
  constructor() {
    this.products = [];
    this.isLoaded = false;
    this.searchIndex = new Map();
  }

  async init() {
    try {
      await this.loadProductCatalog();
      this.buildSearchIndex();
      console.log('✅ Data Layer initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Data Layer:', error);
      return false;
    }
  }

  async loadProductCatalog() {
    try {
      console.log('📦 Loading product catalog...');
      // 1. Use cached data for instant load
      let cached = localStorage.getItem('productCatalogCsv');
      let products = [];
      if (cached) {
        products = this.parseCSV(cached);
        this.products = products;
        this.isLoaded = true;
        // ... set products in memory/UI ...
      }
      // 2. Fetch latest in background
      const url = CONFIG.CATALOG_URL + (CONFIG.CATALOG_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
      fetch(url)
        .then(response => response.ok ? response.text() : Promise.reject('Failed to fetch catalog'))
        .then(csvText => {
          if (!cached || csvText !== cached) {
            localStorage.setItem('productCatalogCsv', csvText);
            const newProducts = this.parseCSV(csvText);
            if (JSON.stringify(newProducts) !== JSON.stringify(products)) {
              this.products = newProducts;
              this.isLoaded = true;
              window.location.reload();
            }
          }
        })
        .catch(err => console.warn('Background catalog update failed:', err));
      if (!products.length) {
        throw new Error('No product data available');
      }
      return products;
    } catch (error) {
      console.error('❌ Failed to load product catalog:', error);
      throw error;
    }
  }

  parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    // Parse header row and normalise header names
    const headers = this.parseCSVLine(lines[0]).map(h => h.trim().replace(/"/g, ''));
    // Find the index of the product code column (OrderCode or Order Code)
    const orderCodeIdx = headers.findIndex(h => h === 'OrderCode' || h === 'Order Code');
    if (orderCodeIdx === -1) return [];
    const products = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length <= orderCodeIdx) continue;
      const orderCode = values[orderCodeIdx] ? values[orderCodeIdx].trim() : '';
      if (!orderCode) continue; // skip if no valid product code
      const product = {};
      headers.forEach((header, index) => {
        product[header] = values[index] || '';
      });
      // Field mapping for old/new columns
      product.OrderCode = orderCode;
      product['Product Name'] = product['Product Name'] || product['Parent Code'] || '';
      product.Description = product['Description'] || '';
      product.LongDescription = product['Long Description'] || product['LongDescription'] || '';
      product.RRP_EXGST = product['RRP EX GST'] || product['RRP_EXGST'] || '';
      product.RRP_INCGST = product['RRP INC GST'] || product['RRP_INCGST'] || '';
      product.BARCODE = (product['BARCODE'] || '').toString().trim();
      // Add more mappings as needed for other fields
      products.push(product);
    }
    return products;
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  buildSearchIndex() {
    console.log('🔍 Building search index...');
    
    this.searchIndex.clear();
    
    this.products.forEach((product, index) => {
      // Index by order code
      if (product.OrderCode) {
        this.searchIndex.set(product.OrderCode.toLowerCase(), index);
        this.searchIndex.set(product.OrderCode.toLowerCase().replace(/[-\s]/g, ''), index);
      }
      
      // Index by barcode (this is what scanners will find!)
      if (product.BARCODE && product.BARCODE.trim()) {
        // Store barcode as-is (case-sensitive) since barcodes are numeric
        this.searchIndex.set(product.BARCODE, index);
        this.searchIndex.set(product.BARCODE.replace(/[-\s]/g, ''), index);
      }
      
      // Index by description keywords
      if (product.Description) {
        const words = product.Description.toLowerCase().split(/\s+/);
        words.forEach(word => {
          if (word.length > 2) {
            if (!this.searchIndex.has(word)) {
              this.searchIndex.set(word, []);
            }
            const indices = this.searchIndex.get(word);
            if (Array.isArray(indices)) {
              indices.push(index);
            }
          }
        });
      }
    });
    
    // Count barcodes indexed for debugging
    const barcodeCount = this.products.filter(p => p.BARCODE && p.BARCODE.trim()).length;
    console.log(`✅ Search index built with ${this.searchIndex.size} entries (${barcodeCount} barcodes indexed)`);
  }

  // Product search methods
  findProductByCode(code) {
    if (!code) return null;
    
    // Search by OrderCode or BARCODE
    const cleanCode = code.trim();
    let index = this.searchIndex.get(cleanCode);
    
    // If not found, try with spaces/hyphens removed
    if (typeof index !== 'number') {
      index = this.searchIndex.get(cleanCode.replace(/[-\s]/g, ''));
    }
    
    // For barcodes, also try lowercase (fallback for some edge cases)
    if (typeof index !== 'number' && code.length > 8) {
      index = this.searchIndex.get(cleanCode.toLowerCase());
    }
    
    const product = typeof index === 'number' ? this.products[index] : null;
    
    // Debug logging for barcode scanning
    if (code.length > 8) { // Likely a barcode
      console.log(`🔍 Barcode search for "${code}": ${product ? 'FOUND' : 'NOT FOUND'} ${product ? `(${product.OrderCode} - ${product.Description})` : ''}`);
    }
    
    return product;
  }

  searchProducts(query, limit = null) {
    if (!query || query.length < 2) return [];
    
    const queryLower = query.toLowerCase();
    const resultsWithScore = [];
    
    // Direct code match (highest priority)
    const directMatch = this.findProductByCode(query);
    if (directMatch) {
      resultsWithScore.push({ product: directMatch, score: 1000 });
    }
    
    // Search in descriptions, order codes, and barcodes with relevance scoring
    this.products.forEach(product => {
      const description = (product.Description || '').toLowerCase();
      const orderCode = (product.OrderCode || '').toLowerCase();
      const barcode = (product.BARCODE || '').toLowerCase();
      
      let score = 0;
      
      // Check if any field contains the query
      if (description.includes(queryLower) || orderCode.includes(queryLower) || barcode.includes(queryLower)) {
        // Score based on match quality
        if (description.startsWith(queryLower)) {
          score += 100; // Description starts with query (highest relevance)
        } else if (description.includes(` ${queryLower} `) || description.includes(`${queryLower} `)) {
          score += 50; // Query appears as whole word in description
        } else if (description.includes(queryLower)) {
          score += 25; // Query appears anywhere in description
        }
        
        if (orderCode.includes(queryLower)) {
          score += 75; // Order code match
        }
        
        if (barcode.includes(queryLower)) {
          score += 75; // Barcode match
        }
        
        // Boost score if query matches numbers in the description (like "900" in "Oros 900")
        const queryAsNumber = queryLower.match(/\d+/);
        if (queryAsNumber && description.includes(queryAsNumber[0])) {
          score += 30;
        }
        
        // Avoid duplicates from direct match
        if (!directMatch || product.OrderCode !== directMatch.OrderCode) {
          resultsWithScore.push({ product, score });
        }
      }
    });
    
    // Sort by score (highest first) and return products
    const sortedResults = resultsWithScore
      .sort((a, b) => b.score - a.score)
      .map(item => item.product);
    
    return limit ? sortedResults.slice(0, limit) : sortedResults;
  }

  getAllProducts() {
    return [...this.products];
  }

  getProductsByCategory(category) {
    return this.products.filter(product => 
      product.Category && product.Category.toLowerCase().includes(category.toLowerCase())
    );
  }

  // Selection management methods
  getSelectedProducts() {
    const storedSelection = JSON.parse(localStorage.getItem('selection') || '[]');
    const selectedProducts = JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.SELECTED_PRODUCTS) || '[]');
    
    // Use the newer format if available
    if (selectedProducts.length > 0) {
      return selectedProducts;
    }
    
    // Convert old format to new format
    return storedSelection.map(item => ({
      product: item,
      room: item.Room || '',
      notes: item.Notes || '',
      quantity: item.Quantity || 1,
      id: this.generateSelectionId()
    }));
  }

  addProductToSelection(product, room = '', notes = '', quantity = 1) {
    const selectedProducts = this.getSelectedProducts();
    
    const selectionItem = {
      id: this.generateSelectionId(),
      product: { ...product },
      room,
      notes,
      quantity: Math.max(1, parseInt(quantity) || 1)
    };
    
    selectedProducts.push(selectionItem);
    this.saveSelectedProducts(selectedProducts);
    
    console.log(`✅ Added ${product.OrderCode} to selection`);
    return selectionItem;
  }

  removeProductFromSelection(selectionId) {
    const selectedProducts = this.getSelectedProducts();
    const filteredProducts = selectedProducts.filter(item => item.id !== selectionId);
    
    this.saveSelectedProducts(filteredProducts);
    
    console.log(`✅ Removed product from selection`);
    return filteredProducts;
  }

  updateSelectionItem(selectionId, updates) {
    const selectedProducts = this.getSelectedProducts();
    const itemIndex = selectedProducts.findIndex(item => item.id === selectionId);
    
    if (itemIndex !== -1) {
      selectedProducts[itemIndex] = { ...selectedProducts[itemIndex], ...updates };
      this.saveSelectedProducts(selectedProducts);
      console.log(`✅ Updated selection item`);
      return selectedProducts[itemIndex];
    }
    
    return null;
  }

  clearSelection() {
    localStorage.removeItem('selection');
    localStorage.removeItem(CONFIG.STORAGE_KEYS.SELECTED_PRODUCTS);
    console.log('✅ Selection cleared');
  }

  saveSelectedProducts(selectedProducts) {
    localStorage.setItem(CONFIG.STORAGE_KEYS.SELECTED_PRODUCTS, JSON.stringify(selectedProducts));
    
    // Also maintain backward compatibility with old format
    const legacyFormat = selectedProducts.map(item => ({
      ...item.product,
      Room: item.room,
      Notes: item.notes,
      Quantity: item.quantity
    }));
    localStorage.setItem('selection', JSON.stringify(legacyFormat));
  }

  generateSelectionId() {
    return `sel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Statistics and summary methods
  getSelectionSummary() {
    const selectedProducts = this.getSelectedProducts();
    const totalProducts = selectedProducts.length;
    const rooms = new Set(selectedProducts.map(item => item.room).filter(Boolean));
    const totalRooms = rooms.size || 1;

    let totalValue = 0;
    selectedProducts.forEach(item => {
      const price = parseFloat((item.product?.RRP_INCGST || '0').toString().replace(/[^0-9.]/g, '')) || 0;
      const quantity = item.quantity || 1;
      totalValue += price * quantity;
    });

    return {
      totalProducts,
      totalRooms,
      totalValue,
      hasProducts: totalProducts > 0,
      rooms: Array.from(rooms)
    };
  }

  getProductsByRoom() {
    const selectedProducts = this.getSelectedProducts();
    const roomGroups = {};
    
    selectedProducts.forEach(item => {
      const room = item.room || 'Unassigned';
      if (!roomGroups[room]) {
        roomGroups[room] = [];
      }
      roomGroups[room].push(item);
    });
    
    return roomGroups;
  }

  // Data validation methods
  validateProduct(product) {
    const required = ['OrderCode', 'Description'];
    return required.every(field => product[field] && product[field].trim());
  }

  validateSelection() {
    const selectedProducts = this.getSelectedProducts();
    const issues = [];
    
    selectedProducts.forEach((item, index) => {
      if (!this.validateProduct(item.product)) {
        issues.push(`Product ${index + 1}: Missing required fields`);
      }
      
      if (!item.quantity || item.quantity < 1) {
        issues.push(`Product ${index + 1}: Invalid quantity`);
      }
    });
    
    return {
      isValid: issues.length === 0,
      issues
    };
  }

  // Import/export methods
  exportSelectionData() {
    const selectedProducts = this.getSelectedProducts();
    const summary = this.getSelectionSummary();
    
    return {
      selection: selectedProducts,
      summary,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
  }

  importSelectionData(data) {
    try {
      if (data.selection && Array.isArray(data.selection)) {
        this.saveSelectedProducts(data.selection);
        console.log(`✅ Imported ${data.selection.length} products`);
        return true;
      }
      throw new Error('Invalid selection data format');
    } catch (error) {
      console.error('❌ Failed to import selection data:', error);
      return false;
    }
  }
}

// Global instance
export const dataLayer = new DataLayer(); 