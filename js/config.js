// Configuration constants
export const CONFIG = {
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
    DEFAULT_ENGINE: 'zxing',
    ENGINES: ['zxing', 'quagga']
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
    SELECTED_PRODUCTS: 'selectedProducts'
  },
  
  UI: {
    ANNOTATION_MAX_LENGTH: 140,
    QUANTITY_OPTIONS: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  }
}; 