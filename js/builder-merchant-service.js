/**
 * Builder/Merchant Service for Seima Scanner
 * Manages server-side builder and merchant lists via Google Sheets
 */

import { CONFIG } from './config.js';

export class BuilderMerchantService {
  constructor() {
    this.googleSheetsUrl = CONFIG.SELECTION_RECORDING.GOOGLE_SHEETS_URL;
    this.cache = {
      builders: [],
      merchants: [],
      lastFetch: null,
      cacheTimeout: 5 * 60 * 1000 // 5 minutes
    };
  }

  /**
   * Check if cache is still valid
   */
  isCacheValid() {
    if (!this.cache.lastFetch) return false;
    return (Date.now() - this.cache.lastFetch) < this.cache.cacheTimeout;
  }

  /**
   * Get builders list from server
   */
  async getBuilders(useCache = true) {
    if (useCache && this.isCacheValid() && this.cache.builders.length > 0) {
      console.log('🏗️ Using cached builders list');
      return this.cache.builders;
    }

    try {
      const url = `${this.googleSheetsUrl}?action=getBuilders`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        this.cache.builders = result.builders || [];
        this.cache.lastFetch = Date.now();
        console.log(`🏗️ Fetched ${this.cache.builders.length} builders from server`);
        return this.cache.builders;
      } else {
        throw new Error(result.error || 'Failed to fetch builders');
      }
    } catch (error) {
      console.error('❌ Error fetching builders:', error);
      // Return cached data if available
      if (this.cache.builders.length > 0) {
        console.log('🏗️ Using stale cached builders due to error');
        return this.cache.builders;
      }
      return [];
    }
  }

  /**
   * Get merchants list from server
   */
  async getMerchants(useCache = true) {
    if (useCache && this.isCacheValid() && this.cache.merchants.length > 0) {
      console.log('🏪 Using cached merchants list');
      return this.cache.merchants;
    }

    try {
      const url = `${this.googleSheetsUrl}?action=getMerchants`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        this.cache.merchants = result.merchants || [];
        this.cache.lastFetch = Date.now();
        console.log(`🏪 Fetched ${this.cache.merchants.length} merchants from server`);
        return this.cache.merchants;
      } else {
        throw new Error(result.error || 'Failed to fetch merchants');
      }
    } catch (error) {
      console.error('❌ Error fetching merchants:', error);
      // Return cached data if available
      if (this.cache.merchants.length > 0) {
        console.log('🏪 Using stale cached merchants due to error');
        return this.cache.merchants;
      }
      return [];
    }
  }

  /**
   * Search builders with real-time duplicate detection
   */
  async searchBuilders(query) {
    if (!query || query.trim() === '') {
      return await this.getBuilders();
    }

    try {
      const url = `${this.googleSheetsUrl}?action=searchBuilders&query=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        console.log(`🔍 Found ${result.builders.length} builders matching "${query}"`);
        return result.builders || [];
      } else {
        throw new Error(result.error || 'Failed to search builders');
      }
    } catch (error) {
      console.error('❌ Error searching builders:', error);
      // Fallback to local search if server fails
      const allBuilders = await this.getBuilders();
      const queryLower = query.toLowerCase();
      return allBuilders.filter(builder => 
        builder.toLowerCase().includes(queryLower)
      );
    }
  }

  /**
   * Search merchants with real-time duplicate detection
   */
  async searchMerchants(query) {
    if (!query || query.trim() === '') {
      return await this.getMerchants();
    }

    try {
      const url = `${this.googleSheetsUrl}?action=searchMerchants&query=${encodeURIComponent(query)}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        console.log(`🔍 Found ${result.merchants.length} merchants matching "${query}"`);
        return result.merchants || [];
      } else {
        throw new Error(result.error || 'Failed to search merchants');
      }
    } catch (error) {
      console.error('❌ Error searching merchants:', error);
      // Fallback to local search if server fails
      const allMerchants = await this.getMerchants();
      const queryLower = query.toLowerCase();
      return allMerchants.filter(merchant => 
        merchant.toLowerCase().includes(queryLower)
      );
    }
  }

  /**
   * Add new builder to server
   */
  async addBuilder(name) {
    if (!name || name.trim() === '') {
      return { success: false, error: 'Builder name is required' };
    }

    try {
      const url = `${this.googleSheetsUrl}?action=addBuilder&name=${encodeURIComponent(name.trim())}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        // Invalidate cache to force refresh
        this.cache.lastFetch = null;
        console.log(`✅ Builder "${result.name}" added successfully`);
        return result;
      } else {
        console.log(`⚠️ Builder add failed: ${result.error}`);
        if (result.existing) {
          console.log(`💡 Suggested existing: "${result.existing}"`);
        }
        return result;
      }
    } catch (error) {
      console.error('❌ Error adding builder:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Add new merchant to server
   */
  async addMerchant(name) {
    if (!name || name.trim() === '') {
      return { success: false, error: 'Merchant name is required' };
    }

    try {
      const url = `${this.googleSheetsUrl}?action=addMerchant&name=${encodeURIComponent(name.trim())}`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        // Invalidate cache to force refresh
        this.cache.lastFetch = null;
        console.log(`✅ Merchant "${result.name}" added successfully`);
        return result;
      } else {
        console.log(`⚠️ Merchant add failed: ${result.error}`);
        if (result.existing) {
          console.log(`💡 Suggested existing: "${result.existing}"`);
        }
        return result;
      }
    } catch (error) {
      console.error('❌ Error adding merchant:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear cache (for testing/refresh)
   */
  clearCache() {
    this.cache = {
      builders: [],
      merchants: [],
      lastFetch: null,
      cacheTimeout: 5 * 60 * 1000
    };
    console.log('🧹 Builder/Merchant cache cleared');
  }

  /**
   * Get cache status
   */
  getCacheStatus() {
    return {
      builders: this.cache.builders.length,
      merchants: this.cache.merchants.length,
      lastFetch: this.cache.lastFetch ? new Date(this.cache.lastFetch).toLocaleString() : 'Never',
      isValid: this.isCacheValid()
    };
  }
}

// Create singleton instance
export const builderMerchantService = new BuilderMerchantService();

// Make functions globally available for testing
window.testBuilderMerchantService = async () => {
  console.log('🧪 Testing Builder/Merchant Service...');
  
  try {
    const builders = await builderMerchantService.getBuilders();
    console.log('✅ Builders:', builders);
    
    const merchants = await builderMerchantService.getMerchants();
    console.log('✅ Merchants:', merchants);
    
    console.log('✅ Builder/Merchant Service test completed');
    return true;
  } catch (error) {
    console.error('❌ Builder/Merchant Service test failed:', error);
    return false;
  }
};

window.clearBuilderMerchantCache = () => {
  builderMerchantService.clearCache();
  return 'Cache cleared successfully';
};

window.getBuilderMerchantStatus = () => {
  const status = builderMerchantService.getCacheStatus();
  console.log('📊 Builder/Merchant Service Status:', status);
  return status;
};
