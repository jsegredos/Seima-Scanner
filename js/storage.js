import { CONFIG } from './config.js';
import { Utils } from './utils.js';

// Storage management
export class StorageManager {
  static getCustomRooms() {
    return Utils.getStorageItem(CONFIG.STORAGE_KEYS.CUSTOM_ROOMS, []);
  }

  static setCustomRooms(rooms) {
    return Utils.setStorageItem(CONFIG.STORAGE_KEYS.CUSTOM_ROOMS, rooms);
  }

  static addCustomRoom(roomName) {
    const customRooms = this.getCustomRooms();
    const sanitizedName = Utils.sanitizeInput(roomName, 50);
    
    if (!sanitizedName) return false;
    
    // Check if room already exists
    const allRooms = [...CONFIG.ROOMS.PREDEFINED.map(r => r.name), ...customRooms.map(r => r.name)];
    if (allRooms.includes(sanitizedName)) return false;
    
    customRooms.push({ name: sanitizedName });
    return this.setCustomRooms(customRooms);
  }

  static removeCustomRoom(index) {
    const customRooms = this.getCustomRooms();
    if (index >= 0 && index < customRooms.length) {
      customRooms.splice(index, 1);
      return this.setCustomRooms(customRooms);
    }
    return false;
  }

  static getSelectedProducts() {
    return Utils.getStorageItem(CONFIG.STORAGE_KEYS.SELECTED_PRODUCTS, []);
  }

  static setSelectedProducts(products) {
    return Utils.setStorageItem(CONFIG.STORAGE_KEYS.SELECTED_PRODUCTS, products);
  }

  static addProductToSelection(product, notes, room, quantity) {
    const selectedProducts = this.getSelectedProducts();
    const productEntry = {
      id: Utils.generateId(),
      product: Utils.deepClone(product),
      notes: Utils.sanitizeInput(notes, CONFIG.UI.ANNOTATION_MAX_LENGTH),
      room: Utils.sanitizeInput(room, 50),
      quantity: Math.max(1, Math.min(10, parseInt(quantity) || 1)),
      timestamp: Date.now()
    };
    
    selectedProducts.push(productEntry);
    return this.setSelectedProducts(selectedProducts);
  }

  static updateProductQuantity(productId, newQuantity) {
    const selectedProducts = this.getSelectedProducts();
    const productIndex = selectedProducts.findIndex(p => p.id === productId);
    
    if (productIndex !== -1) {
      selectedProducts[productIndex].quantity = Math.max(1, Math.min(10, parseInt(newQuantity) || 1));
      return this.setSelectedProducts(selectedProducts);
    }
    return false;
  }

  static removeProductFromSelection(productId) {
    const selectedProducts = this.getSelectedProducts();
    const filteredProducts = selectedProducts.filter(p => p.id !== productId);
    return this.setSelectedProducts(filteredProducts);
  }

  static clearAllSelections() {
    return this.setSelectedProducts([]) && this.setCustomRooms([]);
  }

  static getSelectionCount() {
    return this.getSelectedProducts().length;
  }

  static getStaffContactDetails() {
    try {
      const data = localStorage.getItem(CONFIG.STORAGE_KEYS.STAFF_CONTACT);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting staff contact details:', error);
      return null;
    }
  }

  static setStaffContactDetails(contactDetails) {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS.STAFF_CONTACT, JSON.stringify(contactDetails));
      return true;
    } catch (error) {
      console.error('Error saving staff contact details:', error);
      return false;
    }
  }
} 