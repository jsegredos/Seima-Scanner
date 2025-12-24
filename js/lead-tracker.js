/**
 * Lead Tracking Service for Seima Scanner
 * Manages customer lead information collection (in-memory only)
 */

import { CONFIG } from './config.js';
import { builderMerchantService } from './builder-merchant-service.js';

export class LeadTracker {
  constructor() {
    this.leadData = {
      // Step 1: Customer & Project Information
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      projectName: '',
      projectAddress: '',
      projectNotes: '',
      excludePrice: false,
      exportCsv: true,
      
      // Step 2: Customer Type
      customerType: null,
      customerTypeOther: '',
      builderName: '',
      merchantName: '',
      
      // Step 3: How They Found Us
      hearAboutUs: [],
      hearAboutUsOther: '',
      referralBuilder: '',
      referralMerchant: ''
    };
    
    // Start with empty lists - will be populated as users add entries
    this.builderList = [];
    
    this.merchantList = [];
    
    this.currentStep = 1;
    this.totalSteps = 3;
  }

  /**
   * Get current lead data
   */
  getLeadData() {
    return { ...this.leadData };
  }

  /**
   * Update lead data
   */
  updateLeadData(updates) {
    this.leadData = { ...this.leadData, ...updates };
  }

  /**
   * Clear all lead data
   */
  clearLeadData() {
    this.leadData = {
      // Step 1: Customer & Project Information
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      projectName: '',
      projectAddress: '',
      projectNotes: '',
      excludePrice: false,
      exportCsv: true,
      
      // Step 2: Customer Type
      customerType: null,
      customerTypeOther: '',
      builderName: '',
      merchantName: '',
      
      // Step 3: How They Found Us
      hearAboutUs: [],
      hearAboutUsOther: '',
      referralBuilder: '',
      referralMerchant: ''
    };
    this.currentStep = 1;
  }

  /**
   * Validate current step data
   */
  validateStep(step) {
    switch (step) {
      case 1:
        // Customer & Project Information - require name, email, and project name
        return this.leadData.customerName && 
               this.leadData.customerEmail && 
               this.leadData.projectName;
      case 2:
        // Customer Type - require customer type selection
        return this.leadData.customerType !== null;
      case 3:
        // How They Found Us - require at least one selection
        return this.leadData.hearAboutUs.length > 0;
      default:
        return false;
    }
  }

  /**
   * Get formatted lead data for email/recording
   */
  getFormattedLeadData() {
    const data = this.leadData;
    
    // Customer type - use raw value (no concatenation with builder/merchant names)
    // Only handle "Other" case where we replace with the custom value
    let customerTypeFormatted = data.customerType;
    if (data.customerType === 'Other' && data.customerTypeOther) {
      customerTypeFormatted = data.customerTypeOther;
    }
    
    // Format how they heard about us
    // Note: Referral builder/merchant names are stored in separate fields, not concatenated here
    let hearAboutUsFormatted = [...data.hearAboutUs];
    // Only handle "Other" case where we replace with custom text
    if (data.hearAboutUs.includes('Other') && data.hearAboutUsOther) {
      const index = hearAboutUsFormatted.indexOf('Other');
      hearAboutUsFormatted[index] = `Other (${data.hearAboutUsOther})`;
    }
    
    return {
      customerType: customerTypeFormatted,
      hearAboutUs: hearAboutUsFormatted.join(', '),
      
      // Raw data for analysis
      customerTypeRaw: data.customerType,
      hearAboutUsArray: data.hearAboutUs,
      builderName: data.builderName,
      merchantName: data.merchantName,
      referralBuilder: data.referralBuilder,
      referralMerchant: data.referralMerchant,
      projectNotes: data.projectNotes || ''
    };
  }

  /**
   * Get builder list
   */
  getBuilderList() {
    return [...this.builderList];
  }

  /**
   * Get merchant list
   */
  getMerchantList() {
    return [...this.merchantList];
  }

  /**
   * Get builder list from server
   */
  async getBuilderList() {
    return await builderMerchantService.getBuilders();
  }

  /**
   * Get merchant list from server
   */
  async getMerchantList() {
    return await builderMerchantService.getMerchants();
  }

  /**
   * Search builders with duplicate detection
   */
  async searchBuilders(query) {
    return await builderMerchantService.searchBuilders(query);
  }

  /**
   * Search merchants with duplicate detection
   */
  async searchMerchants(query) {
    return await builderMerchantService.searchMerchants(query);
  }

  /**
   * Add custom builder to server
   */
  async addCustomBuilder(name) {
    return await builderMerchantService.addBuilder(name);
  }

  /**
   * Add custom merchant to server
   */
  async addCustomMerchant(name) {
    return await builderMerchantService.addMerchant(name);
  }

  /**
   * Load custom builders and merchants from storage
   */
  loadCustomLists() {
    try {
      const customBuilders = localStorage.getItem('customBuilders');
      if (customBuilders) {
        this.builderList = JSON.parse(customBuilders);
      }
      
      const customMerchants = localStorage.getItem('customMerchants');
      if (customMerchants) {
        this.merchantList = JSON.parse(customMerchants);
      }
    } catch (error) {
      console.error('Error loading custom lists:', error);
    }
  }

  /**
   * Clear all stored builder and merchant lists (for testing/reset)
   */
  clearCustomLists() {
    this.builderList = [];
    this.merchantList = [];
    localStorage.removeItem('customBuilders');
    localStorage.removeItem('customMerchants');
    console.log('🧹 Cleared all custom builder and merchant lists');
  }
}

// Create singleton instance
export const leadTracker = new LeadTracker();

// Load custom builder/merchant lists on initialization
leadTracker.loadCustomLists();

// Make clear function globally available for testing/reset
window.clearBuilderMerchantLists = () => {
  leadTracker.clearCustomLists();
  return 'Builder and merchant lists cleared. Refresh the page to see empty lists.';
};
