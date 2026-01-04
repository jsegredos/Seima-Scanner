// Configuration constants
export const CONFIG = {
  VERSION: '4.1.0',
  ROOMS: {
    PREDEFINED: [
      { name: "Bath 1", icon: "🛁" },
      { name: "Bath 2", icon: "🛁" },
      { name: "Bath 3", icon: "🛁" },
      { name: "Ensuite", icon: "🚿" },
      { name: "Powder", icon: "🚽" },
      { name: "Kitchen", icon: "🍽️" },
      { name: "Butlers", icon: "👨‍🍳" },
      { name: "Laundry", icon: "🧺" },
      { name: "Alfresco", icon: "🍽️" }
    ]
  },
  
  SCANNER: {
    DEFAULT_ENGINE: 'detector',
    ENGINES: ['detector'] // Uses BarcodeDetector API (native or polyfill)
  },
  
  SEARCH: {
    MAX_RESULTS: 8,
    SEARCH_FIELDS: ['Description', 'ProductName', 'OrderCode', 'BARCODE']
  },
  
  CSV: {
    URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQw5X0aAe5yYbfqfTlgBIdNqnDIjs-YFhNh1IQ8lIB5RfjBl5VBRwQAMKIwlXz6L6oXI8ittrQD91Ob/pub?gid=114771048&single=true&output=csv'
  },
  
  STORAGE_KEYS: {
    CUSTOM_ROOMS: 'customRooms',
    SELECTED_PRODUCTS: 'selectedProducts',
    PRODUCT_CATALOG: 'productCatalog',
    USER_PREFERENCES: 'userPreferences',
    ROOM_ASSIGNMENTS: 'roomAssignments',
    STAFF_CONTACT: 'staffContactDetails'
  },
  
  UI: {
    ANNOTATION_MAX_LENGTH: 140,
    QUANTITY_OPTIONS: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  
  // CSV import configuration
  CSV_CONFIG: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ACCEPTED_TYPES: ['.csv', '.xlsx'],
    REQUIRED_COLUMNS: ['OrderCode'],
    OPTIONAL_COLUMNS: ['Description', 'RRP_INCGST', 'Image_URL', 'Room', 'Quantity', 'Notes']
  },
  
  // Product catalog API configuration
  CATALOG_URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRnMqBCqB9L52W6YNgreLHJKvxOanS76CJN8ZUorBl8Iccha6MzUpDkGa0N8GSYFPP2zyql1Tq6aBn8/pub?gid=0&single=true&output=csv',
  
  // Performance settings
  PERFORMANCE: {
    MAX_PRODUCTS_PER_SESSION: 1000,
    IMAGE_CACHE_SIZE: 100,
    SCANNER_TIMEOUT: 30000,
    BARCODE_SCAN_INTERVAL: 100
  },

  // OCR Configuration
  OCR: {
    // Scan interval in milliseconds
    SCAN_INTERVAL: 1500,
    // Minimum text length to consider (except OrderCodes)
    MIN_TEXT_LENGTH: 3,
    // Minimum confidence threshold (0-100)
    MIN_CONFIDENCE: 60,
    // Center region ratio (middle portion of image to prioritize)
    CENTER_REGION_RATIO: 0.6,
    // Fuzzy matching tolerance (Levenshtein distance)
    FUZZY_MATCH_TOLERANCE: 1,
    // Processing timeout in milliseconds
    PROCESSING_TIMEOUT: 30000,
    // Whether to prefer Web Worker (off-main-thread processing)
    PREFER_WEB_WORKER: true,
    // Image preprocessing settings
    PREPROCESSING: {
      CONTRAST: 1.5,
      USE_THRESHOLD: true
    }
  },

  // Email Configuration - Unified for Multiple Providers
  EMAIL: {
    // Current Provider (emailjs | microsoftGraph)
    PROVIDER: 'emailjs',
    
    // EmailJS Configuration (Current)
    PUBLIC_KEY: 'MHAEjvnc_xx8DIRCA',
    SERVICE_ID: 'service_rblizfg',
    TEMPLATE_ID: 'template_8st9fhk',
    
    // Microsoft Graph Configuration (Future)
    MICROSOFT_CLIENT_ID: null, // To be configured for Exchange 365 integration
    MICROSOFT_TENANT_ID: null, // To be configured for Exchange 365 integration
    
    // Common Email Settings
    FROM_EMAIL: 'noreply@seima.com.au',
    FROM_NAME: 'Seima Team',
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 2000, // milliseconds
    
    // Note: Removed MAX_ATTACHMENT_SIZE as we now always attempt to send
    // and rely on actual provider errors rather than size-based fallback
    
    // BCC for record keeping
    BCC_EMAIL: 'jsegredos@gmail.com' // Company email for BCC copy
  },
  
  // Browser Compatibility Settings
  COMPATIBILITY: {
    MIN_CHROME_VERSION: 80,
    MIN_FIREFOX_VERSION: 75,
    MIN_SAFARI_VERSION: 13,
    
    // Feature requirements
    REQUIRED_FEATURES: [
      'localStorage',
      'fileReader',
      'blob',
      'createObjectURL'
    ],
    
    // Performance thresholds
    MIN_COMPATIBILITY_SCORE: 70,
    MEMORY_WARNING_THRESHOLD: 0.8, // 80% of heap limit
    
    // Samsung-specific settings
    SAMSUNG_OPTIMIZATIONS: true,
    EXTENDED_TIMEOUTS_FOR_SAMSUNG: true
  },

  // Selection Recording Configuration
  SELECTION_RECORDING: {
    ENABLED: true,
    GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/AKfycbypt3Y7RLAko49s6Nc0mecYYd4FyiQqBcHFJr-1megO3-m1Vo1bCbUOkqAax3g9w508RA/exec', // Set this after deploying your Google Apps Script
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000 // milliseconds
  }

};

// Email template configuration is now handled by the standalone EmailTemplateGenerator
// All email services use the same template from js/email-template-generator.js 