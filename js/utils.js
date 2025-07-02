// Utility functions
export class Utils {
  static loadScript(src) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  static loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  static loadImageAsDataURL(src, callback) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      try {
        const dataURL = canvas.toDataURL('image/png');
        callback(dataURL, img.width, img.height);
      } catch (e) {
        callback(null, 0, 0);
      }
    };
    img.onerror = () => callback(null, 0, 0);
    img.src = src;
  }

  static formatPrice(price) {
    if (!price || price === '') return '';
    const numPrice = parseFloat(price.toString().replace(/[^\d.-]/g, ''));
    return isNaN(numPrice) ? '' : `$${numPrice.toFixed(2)}`;
  }

  static sanitizeInput(input, maxLength = null) {
    if (typeof input !== 'string') return '';
    let sanitized = input.trim();
    if (maxLength && sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }
    return sanitized;
  }

  static debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  static generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  static deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  static getStorageItem(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.warn(`Failed to parse localStorage item: ${key}`, e);
      return defaultValue;
    }
  }

  static setStorageItem(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn(`Failed to set localStorage item: ${key}`, e);
      return false;
    }
  }
} 