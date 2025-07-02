import { CONFIG } from './config.js';
import { Utils } from './utils.js';

// Product catalog management
export class ProductCatalog {
  constructor() {
    this.catalog = [];
    this.isLoaded = false;
    this.loadPromise = null;
  }

  async ensureLoaded() {
    if (this.isLoaded) return;
    if (this.loadPromise) return this.loadPromise;
    
    this.loadPromise = this.loadCatalog();
    return this.loadPromise;
  }

  async loadCatalog() {
    try {
      // Load PapaParse if not already loaded
      if (!window.Papa) {
        await Utils.loadScript('https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js');
      }

      return new Promise((resolve, reject) => {
        window.Papa.parse(CONFIG.CSV.URL, {
          download: true,
          header: true,
          complete: (results) => {
            this.catalog = this.processCatalogData(results.data);
            this.isLoaded = true;
            window.productCatalog = this.catalog; // Keep global reference for compatibility
            resolve();
          },
          error: (err) => {
            console.error('Failed to load product catalog:', err);
            reject(new Error('Failed to load product catalog'));
          }
        });
      });
    } catch (error) {
      console.error('Error loading catalog:', error);
      throw error;
    }
  }

  processCatalogData(rawData) {
    return rawData.map(row => {
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
      return product;
    });
  }

  searchProducts(query, maxResults = CONFIG.SEARCH.MAX_RESULTS) {
    if (!this.isLoaded || !query) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    
    const matches = this.catalog.filter(product => {
      return CONFIG.SEARCH.SEARCH_FIELDS.some(field => {
        const value = product[field];
        return value && value.toString().toLowerCase().includes(normalizedQuery);
      });
    });

    return matches.slice(0, maxResults);
  }

  findProductByBarcode(barcode) {
    if (!this.isLoaded || !barcode) return null;
    
    const normalizedBarcode = barcode.toString().trim();
    return this.catalog.find(product => 
      product.BARCODE && product.BARCODE.toString().trim() === normalizedBarcode
    ) || null;
  }

  getCatalog() {
    return this.catalog;
  }
}

// Global instance
export const productCatalog = new ProductCatalog(); 