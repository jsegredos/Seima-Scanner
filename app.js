// Seima Scanner - Refactored Application
// This file serves as a compatibility layer for the modular ES6 version

console.info('Seima Scanner - Loading modular application...');

// For browsers that loaded this script without module support
if (!('type' in document.createElement('script'))) {
  document.addEventListener('DOMContentLoaded', function() {
    const body = document.body;
    if (body && !window.seimaScanner) {
      body.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;padding:20px;text-align:center;font-family:Arial,sans-serif;">
          <h1 style="color:#e11d48;margin-bottom:16px;">Browser Not Supported</h1>
          <p style="color:#666;margin-bottom:24px;max-width:500px;">
            This application requires a modern browser with ES6 module support.
            Please update your browser or use Chrome, Firefox, Safari, or Edge.
          </p>
          <button onclick="location.reload()" style="background:#2563eb;color:white;border:none;padding:12px 24px;border-radius:8px;cursor:pointer;">
            Retry
                </button>
        </div>
      `;
    }
  });
}

// Backward compatibility globals (will be set by the module)
window.selectedProducts = [];
window.customRooms = [];
window.productCatalog = [];
window.productCatalogLoaded = false;

// Legacy function stubs for compatibility
window.updateSelectionCount = function() {
  if (window.seimaScanner) {
    window.seimaScanner.updateSelectionCount();
  }
};

window.addProductToSelection = function(product, notes, room, quantity) {
  if (window.seimaScanner) {
    return window.seimaScanner.addProduct(product, notes, room, quantity);
  }
  return false;
}; 