/**
 * Lead Tracking Service for Seima Scanner
 * Manages customer lead information collection and storage
 */

import { CONFIG } from './config.js';
import { builderMerchantService } from './builder-merchant-service.js';

export class LeadTracker {
  constructor() {
    this.leadData = {
      customerType: null,
      customerTypeOther: '',
      builderName: '',
      merchantName: '',
      hearAboutUs: [],
      hearAboutUsOther: '',
      referralBuilder: '',
      referralMerchant: '',
      projectType: '',
      projectStage: '',
      numberOfUnits: 1
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
    this.saveToStorage();
  }

  /**
   * Clear all lead data
   */
  clearLeadData() {
    this.leadData = {
      customerType: null,
      customerTypeOther: '',
      builderName: '',
      merchantName: '',
      hearAboutUs: [],
      hearAboutUsOther: '',
      referralBuilder: '',
      referralMerchant: '',
      projectType: '',
      projectStage: '',
      numberOfUnits: 1
    };
    this.currentStep = 1;
    this.saveToStorage();
  }

  /**
   * Save lead data to localStorage
   */
  saveToStorage() {
    try {
      localStorage.setItem('leadTrackingData', JSON.stringify({
        leadData: this.leadData,
        currentStep: this.currentStep,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error saving lead data:', error);
    }
  }

  /**
   * Load lead data from localStorage
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('leadTrackingData');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.leadData = parsed.leadData || this.leadData;
        this.currentStep = parsed.currentStep || 1;
        
        // Clear data if older than 24 hours
        const timestamp = new Date(parsed.timestamp);
        const now = new Date();
        const hoursDiff = (now - timestamp) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
          this.clearLeadData();
        }
      }
    } catch (error) {
      console.error('Error loading lead data:', error);
      this.clearLeadData();
    }
  }

  /**
   * Validate current step data
   */
  validateStep(step) {
    switch (step) {
      case 1:
        return this.leadData.customerType !== null;
      case 2:
        return this.leadData.hearAboutUs.length > 0;
      case 3:
        return this.leadData.projectType && this.leadData.projectStage;
      default:
        return false;
    }
  }

  /**
   * Get formatted lead data for email/recording
   */
  getFormattedLeadData() {
    const data = this.leadData;
    
    // Format customer type
    let customerTypeFormatted = data.customerType;
    if (data.customerType === 'Builder' && data.builderName) {
      customerTypeFormatted += ` (${data.builderName})`;
    } else if (data.customerType === 'Merchant' && data.merchantName) {
      customerTypeFormatted += ` (${data.merchantName})`;
    } else if (data.customerType === 'Other' && data.customerTypeOther) {
      customerTypeFormatted = data.customerTypeOther;
    }
    
    // Format how they heard about us
    let hearAboutUsFormatted = [...data.hearAboutUs];
    if (data.hearAboutUs.includes('Builder Referral') && data.referralBuilder) {
      const index = hearAboutUsFormatted.indexOf('Builder Referral');
      hearAboutUsFormatted[index] = `Builder Referral (${data.referralBuilder})`;
    }
    if (data.hearAboutUs.includes('Merchant Referral') && data.referralMerchant) {
      const index = hearAboutUsFormatted.indexOf('Merchant Referral');
      hearAboutUsFormatted[index] = `Merchant Referral (${data.referralMerchant})`;
    }
    if (data.hearAboutUs.includes('Other') && data.hearAboutUsOther) {
      const index = hearAboutUsFormatted.indexOf('Other');
      hearAboutUsFormatted[index] = `Other (${data.hearAboutUsOther})`;
    }
    
    return {
      customerType: customerTypeFormatted,
      hearAboutUs: hearAboutUsFormatted.join(', '),
      projectType: data.projectType,
      projectStage: data.projectStage,
      numberOfUnits: data.numberOfUnits || 1,
      
      // Raw data for analysis
      customerTypeRaw: data.customerType,
      hearAboutUsArray: data.hearAboutUs,
      builderName: data.builderName,
      merchantName: data.merchantName,
      referralBuilder: data.referralBuilder,
      referralMerchant: data.referralMerchant
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

// Load data on initialization
leadTracker.loadFromStorage();
leadTracker.loadCustomLists();

// Make clear function globally available for testing/reset
window.clearBuilderMerchantLists = () => {
  leadTracker.clearCustomLists();
  return 'Builder and merchant lists cleared. Refresh the page to see empty lists.';
};
