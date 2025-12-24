/**
 * Selection Recording Service for Seima Scanner
 * Records finalised selections to Google Sheets for tracking and reporting
 */

import { CONFIG } from './config.js';

export class SelectionRecorder {
  constructor() {
    this.isEnabled = CONFIG.SELECTION_RECORDING?.ENABLED || true;
    this.googleSheetsUrl = CONFIG.SELECTION_RECORDING?.GOOGLE_SHEETS_URL || null;
    this.retryAttempts = CONFIG.SELECTION_RECORDING?.RETRY_ATTEMPTS || 3;
    this.retryDelay = CONFIG.SELECTION_RECORDING?.RETRY_DELAY || 1000;
  }

  /**
   * Configure the Google Sheets Apps Script URL
   * @param {string} url - The Google Apps Script web app URL
   */
  configure(url) {
    this.googleSheetsUrl = url;
    console.log('📊 Selection recorder configured with Google Sheets URL');
  }

  /**
   * Record a selection after successful email send
   * @param {Object} userDetails - Customer and staff information
   * @param {Array} selectedProducts - Array of selected products
   * @param {Object} emailResult - Email send result
   */
  async recordSelection(userDetails, selectedProducts, emailResult = {}) {
    if (!this.isEnabled || !this.googleSheetsUrl) {
      console.log('📊 Selection recording disabled or not configured');
      return { success: false, reason: 'not_configured' };
    }

    try {
      const selectionData = this.prepareSelectionData(userDetails, selectedProducts, emailResult);
      const result = await this.sendToGoogleSheets(selectionData);
      
      if (result.success) {
        console.log('✅ Selection recorded successfully');
        return { success: true, data: selectionData };
      } else {
        throw new Error(result.error || 'Failed to record selection');
      }
    } catch (error) {
      console.error('❌ Failed to record selection:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Prepare selection data for Google Sheets
   */
  prepareSelectionData(userDetails, selectedProducts, emailResult) {
    const timestamp = new Date();
    const staffContact = userDetails.staffContact || {};
    
    // Calculate totals
    const totalProducts = selectedProducts.length;
    const totalQuantity = selectedProducts.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const estimatedValue = this.calculateEstimatedValue(selectedProducts);
    const uniqueRooms = [...new Set(selectedProducts.map(item => item.room).filter(Boolean))];

    // Extract lead data if available
    const leadData = userDetails.leadData || {};
    
    // Create the main selection record
    const selectionRecord = {
      // Date, time and metadata
      date: timestamp.toLocaleDateString('en-AU'),
      time: timestamp.toLocaleTimeString('en-AU'),
      appVersion: CONFIG.VERSION,
      
      // Staff information (primary grouping)
      staffName: staffContact.name || 'Unknown Staff',
      staffEmail: staffContact.email || '',
      staffMobile: staffContact.mobile || '',
      
      // Customer information
      customerName: userDetails.name || '',
      customerEmail: userDetails.email || '',
      customerPhone: userDetails.phone || '',
      customerProject: userDetails.project || '',
      customerAddress: userDetails.address || '',
      
      // Lead tracking information
      customerType: leadData.customerType || '',
      hearAboutUs: this.formatHearAboutUs(leadData),
      projectNotes: leadData.projectNotes || '',
      builderName: leadData.builderName || '',
      merchantName: leadData.merchantName || '',
      referralBuilder: leadData.referralBuilder || '',
      referralMerchant: leadData.referralMerchant || '',
      
      // Selection summary
      totalProducts: totalProducts,
      totalQuantity: totalQuantity,
      totalRooms: uniqueRooms.length,
      roomsList: uniqueRooms.join(', '),
      estimatedValue: estimatedValue,
      
      // Email details
      emailSent: emailResult.success || false,
      pdfGenerated: emailResult.pdfGenerated || false,
      csvGenerated: emailResult.csvGenerated || false,
      pdfSize: emailResult.pdfSize || '',
      
      // Product details (JSON string for detailed analysis)
      productsJson: JSON.stringify(selectedProducts.map(item => ({
        orderCode: item.product?.OrderCode || item.product?.orderCode || '',
        description: item.product?.Description || item.product?.description || '',
        room: item.room || '',
        quantity: item.quantity || 1,
        notes: item.notes || '',
        priceIncGst: item.product?.RRP_INCGST || item.product?.rrpIncGst || '0.00'
      })))
    };

    return selectionRecord;
  }

  /**
   * Format hearAboutUs array into a comma-separated string
   * Note: Referral builder/merchant names are stored in separate columns, not concatenated here
   */
  formatHearAboutUs(leadData) {
    if (!leadData || !leadData.hearAboutUs) {
      return '';
    }
    
    // Handle array format - just join with commas, no concatenation
    if (Array.isArray(leadData.hearAboutUs)) {
      // Only handle "Other" case where we replace with custom text
      let hearAboutUsFormatted = [...leadData.hearAboutUs];
      if (hearAboutUsFormatted.includes('Other') && leadData.hearAboutUsOther) {
        const index = hearAboutUsFormatted.indexOf('Other');
        hearAboutUsFormatted[index] = `Other (${leadData.hearAboutUsOther})`;
      }
      
      return hearAboutUsFormatted.join(', ');
    }
    
    // If it's already a string, return it as-is
    return leadData.hearAboutUs || '';
  }

  /**
   * Calculate estimated total value of selection
   */
  calculateEstimatedValue(selectedProducts) {
    let total = 0;
    
    selectedProducts.forEach(item => {
      const quantity = item.quantity || 1;
      const priceStr = item.product?.RRP_INCGST || item.product?.rrpIncGst || '0';
      const price = parseFloat(priceStr.toString().replace(/[^0-9.]/g, '')) || 0;
      total += price * quantity;
    });
    
    return total.toFixed(2);
  }

  /**
   * Send data to Google Sheets via Apps Script
   * Uses URL parameters to avoid CORS preflight issues
   */
  async sendToGoogleSheets(data, attempt = 1) {
    try {
      // Use URL parameters instead of FormData
      const params = new URLSearchParams();
      params.append('data', JSON.stringify(data));

      const response = await fetch(this.googleSheetsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      return { success: true, result };

    } catch (error) {
      console.error(`📊 Attempt ${attempt} failed:`, error);
      
      // Retry logic
      if (attempt < this.retryAttempts) {
        console.log(`📊 Retrying in ${this.retryDelay}ms... (attempt ${attempt + 1}/${this.retryAttempts})`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        return this.sendToGoogleSheets(data, attempt + 1);
      }
      
      return { success: false, error: error.message };
    }
  }

  /**
   * Test the connection to Google Sheets
   */
  async testConnection() {
    if (!this.googleSheetsUrl) {
      return { success: false, error: 'No Google Sheets URL configured' };
    }

    const testData = {
      date: new Date().toLocaleDateString('en-AU'),
      time: new Date().toLocaleTimeString('en-AU'),
      staffName: 'Test User',
      customerName: 'Test Customer',
      totalProducts: 1,
      test: true
    };

    return await this.sendToGoogleSheets(testData);
  }

  /**
   * Enable/disable recording
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`📊 Selection recording ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Create singleton instance
export const selectionRecorder = new SelectionRecorder();
