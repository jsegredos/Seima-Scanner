# SEIMA Scanner

A modern web-based product selection and scanning application for SEIMA's bathroom and kitchen solutions.

## 🚀 Overview

SEIMA Scanner is a progressive web application that allows users to:
- Browse and select products from SEIMA's product catalogue
- Scan product barcodes using device cameras
- Import product lists from CSV files
- Generate professional PDF reports with product specifications
- Export selection data as CSV files
- Email product selections with PDF and CSV attachments

## 📋 Features

### Product Selection
- **Visual Product Browser**: Browse products with images, specifications, and pricing
- **Barcode Scanner**: Use device camera to scan product barcodes
- **Room Organisation**: Organise products by room (Kitchen, Bathroom, Laundry, etc.)
- **Bulk Import**: Import multiple products via CSV file upload
- **Search & Filter**: Find products by name, code, or category

### Document Generation
- **Professional PDF Reports**: Generate detailed product reports with:
  - Company branding and customer information
  - Product images and specifications
  - Room-by-room organisation
  - Pricing information (where applicable)
  - QR codes for product links
- **CSV Export**: Export selection data in structured format for system integration

### Email Integration
- **EmailJS Integration**: Send professional emails with attachments
- **HTML Email Templates**: Branded email templates with Australian spelling
- **Attachment Support**: Include both PDF and CSV files as email attachments
- **Character Sanitisation**: Automatic handling of special characters for reliable email delivery

### Browser Compatibility
- **Cross-Browser Support**: Works on Chrome, Firefox, Safari, Edge
- **Mobile Optimised**: Responsive design for tablets and smartphones
- **Samsung Device Support**: Enhanced compatibility for Samsung devices
- **Progressive Web App**: Installable on mobile devices

## 🛠️ Technology Stack

### Frontend
- **Vanilla JavaScript**: ES6+ modules with modern syntax
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern styling with flexbox and grid layouts
- **Web APIs**: Camera API, File API, Local Storage

### Libraries
- **jsPDF**: PDF generation and manipulation
- **PapaParse**: CSV parsing and generation
- **EmailJS**: Email service integration
- **QuaggaJS**: Barcode scanning functionality

### Architecture
- **Modular Design**: Service-oriented architecture with clear separation of concerns
- **Service Layer**: Dedicated services for email, PDF, data, and app coordination
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Fallback Systems**: Multiple fallback options for critical functionality

## 📁 Project Structure

```
SEIMA-Scanner/
├── index.html              # Main application entry point
├── style.css               # Global styles
├── app.js                  # Browser compatibility check
├── version.txt             # Application version tracking
├── pricelist.csv          # Product database
├── server.py              # Python development server
├── server.js              # Node.js development server
├── js/
│   ├── app.js             # Main application controller
│   ├── config.js          # Configuration settings
│   ├── navigation.js      # UI navigation and routing
│   ├── scanner.js         # Barcode scanning functionality
│   ├── file-import.js     # CSV file import handling
│   ├── app-service.js     # Main application service coordinator
│   ├── email-service.js   # Email functionality
│   ├── pdf-service.js     # PDF generation service
│   ├── data-service.js    # Data management service
│   ├── email-template-generator.js  # Email template generation
│   ├── storage.js         # Local storage management
│   ├── utils.js           # Utility functions
│   └── browser-compatibility.js  # Browser detection and compatibility
├── screens/
│   ├── scanner.html       # Barcode scanner interface
│   ├── room-selection.html # Room selection interface
│   ├── product-details.html # Product details view
│   └── review.html        # Selection review interface
└── assets/
    ├── seima-logo.png     # Company logo
    ├── seima-logo-white.png # White logo variant
    └── no-image.png       # Placeholder image
```

## 🔧 Configuration

### EmailJS Setup
The application uses EmailJS for email functionality. Key configuration in `js/config.js`:

```javascript
EMAIL_CONFIG: {
  SERVICE_ID: 'service_rblizfg',
  TEMPLATE_ID: 'template_8st9fhk',
  USER_ID: 'your_emailjs_user_id',
  API_KEY: 'your_emailjs_api_key'
}
```

### Product Database
Products are loaded from `pricelist.csv` with the following structure:
- OrderCode: Unique product identifier
- Description: Product name and description
- Category: Product category
- RRP_INCGST: Retail price including GST
- Website_URL: Product information link
- Image_URL: Product image URL

## 💾 Local Storage

The application uses browser localStorage for:
- **Product Selection**: Current user selection
- **User Preferences**: UI settings and preferences
- **Cache**: Product data and images for offline use
- **Session Data**: Form data and application state

## 🔍 Barcode Scanning

Barcode scanning uses the QuaggaJS library with support for:
- **EAN-13**: Standard retail barcodes
- **EAN-8**: Compact retail barcodes
- **Code 128**: Industrial barcodes
- **Camera Selection**: Front/rear camera switching
- **Mobile Optimisation**: Touch-friendly interface

## 🛡️ Security Features

- **Input Sanitisation**: All user inputs are sanitised
- **XSS Prevention**: Content Security Policy implementation
- **CORS Handling**: Proper cross-origin resource sharing
- **Data Validation**: Client-side and server-side validation
- **Error Handling**: Secure error messages without information disclosure

## 🌐 Browser Support

### Supported Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+
- Samsung Internet 12+

### Mobile Support
- iOS Safari 13+
- Android Chrome 80+
- Samsung Internet 12+

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/seima-scanner.git
   cd seima-scanner
   ```

2. **Start development server**
   ```bash
   # Python server
   python server.py
   
   # OR Node.js server
   node server.js
   ```

3. **Open in browser**
   Navigate to `http://localhost:8000`

4. **Configure EmailJS**
   - Set up EmailJS account
   - Update configuration in `js/config.js`
   - Test email functionality

## 📚 API Reference

### Main Application Service
```javascript
// Get selected products
const products = window.seimaApp.getSelectedProducts();

// Add product to selection
window.seimaApp.addProduct(product, notes, room, quantity);

// Generate PDF
const pdfBlob = await window.seimaApp.generatePDF(userDetails);

// Send email
await window.seimaApp.sendEmail(userDetails, pdfBlob, csvBlob);
```

### Debug API
```javascript
// Access debug functions
window.seimaDebug.getSelectedProducts();
window.seimaDebug.clearSelection();
window.seimaDebug.testEmail();
```

## 📈 Performance

- **Lazy Loading**: Images and components loaded on demand
- **Caching**: Intelligent caching of product data and images
- **Optimisation**: Image compression and PDF optimisation
- **Minification**: CSS and JavaScript minification for production

## 🔒 Privacy & Data

- **No Server Storage**: All data stored locally in browser
- **GDPR Compliant**: No personal data transmitted without consent
- **Data Portability**: Export selections as CSV/PDF
- **Clear Data**: Users can clear all stored data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

Copyright © 2024 SEIMA. All rights reserved.

## 🆘 Support

For support, please contact:
- Email: info@seima.com.au
- Website: www.seima.com.au
- Phone: [Contact Number]

---

*This application is designed and developed for SEIMA's internal use and customer service.* 