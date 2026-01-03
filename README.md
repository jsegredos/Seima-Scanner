# SEIMA Scanner

A modern web-based product selection and scanning application for SEIMA's bathroom and kitchen solutions. This progressive web application enables showroom staff to help customers select products, generate professional reports, and track leads through an integrated Google Sheets system.

## 🚀 Overview

SEIMA Scanner is a comprehensive product selection tool that allows users to:
- Browse and select products from SEIMA's product catalogue (hosted on Google Sheets)
- Scan product barcodes using device cameras with iOS and Android support
- Import product lists from CSV or Excel files
- Organise products by room with drag-and-drop reordering
- Generate professional PDF reports with product specifications
- Export selection data as CSV files
- Email product selections with PDF and CSV attachments
- Track customer leads and selections automatically to Google Sheets
- Manage builders and merchants with server-side lists

## 📋 Features

### Product Selection
- **Visual Product Browser**: Browse products with images, specifications, and pricing
- **Barcode Scanner**: Use device camera to scan product barcodes (EAN-13, EAN-8, Code 128)
  - iOS Safari support with polyfills
  - Android device optimisation
  - Uses BarcodeDetector API (native or polyfill)
- **Room Organisation**: Organise products by predefined or custom rooms
  - Predefined rooms: Bath 1, Bath 2, Bath 3, Ensuite, Powder, Kitchen, Butlers, Laundry, Alfresco
  - Custom room creation
  - Drag-and-drop reordering on mobile and desktop
- **Bulk Import**: Import multiple products via CSV or Excel file upload
  - Supports append or override modes
  - Automatic product matching by OrderCode
- **Search & Filter**: Find products by name, code, barcode, or category
  - Real-time search with relevance scoring
  - Shows all matching results

### Lead Tracking & Customer Management
- **Lead Wizard**: Multi-step customer information collection
  - Step 1: Customer & Project Information (name, email, phone, project, address, notes)
  - Step 2: Customer Type (Builder, Merchant, Homeowner, Other)
  - Step 3: How They Found Us (referral tracking)
- **Builder/Merchant Management**: Server-side builder and merchant lists
  - Centralised lists shared across all showrooms
  - Real-time search with duplicate detection
  - Auto-complete suggestions
  - Alphabetical sorting (case-insensitive)
- **Staff Contact Details**: Store SEIMA staff contact information
  - Included in PDF reports
  - Receives BCC copy of emails

### Document Generation
- **Professional PDF Reports**: Generate detailed product reports with:
  - Company branding and customer information
  - Product images and specifications
  - Room-by-room organisation
  - Pricing information (optional, can be excluded)
  - QR codes for product links
  - Staff contact details
  - Multiple quality options (Standard, Email Compatible, Print Ready)
- **CSV Export**: Export selection data in structured format
  - Character sanitisation for email compatibility
  - Includes all product details, rooms, quantities, and notes

### Email Integration
- **EmailJS Integration**: Send professional emails with attachments
  - HTML email templates with Australian English spelling
  - PDF and CSV file attachments
  - BCC to SEIMA staff email
  - Character sanitisation for reliable delivery
  - Download fallback if email fails
- **Microsoft Graph Ready**: Architecture prepared for Microsoft Graph API migration
  - Provider abstraction layer
  - Easy switching between email providers

### Selection Recording
- **Google Sheets Integration**: Automatic recording of all finalised selections
  - Timestamp and app version tracking
  - Complete customer and staff information
  - Full product selection details (JSON format)
  - Selection statistics (totals, rooms, estimated value)
  - Email status and file sizes
  - Builder and merchant referral tracking

### Browser Compatibility
- **Cross-Browser Support**: Works on Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Mobile Optimised**: Responsive design for tablets and smartphones
  - iOS Safari with camera polyfills
  - Android Chrome optimisation
  - Samsung Internet support
- **Progressive Web App**: Installable on mobile devices
- **Browser Compatibility Monitoring**: Real-time compatibility checking and warnings

### Version Management
- **Interactive Changelog**: Click version number to view changelog
- **Version Tracking**: Current version displayed on home page
- **Version History**: Complete changelog in `version.txt` format

## 🛠️ Technology Stack

### Frontend
- **Vanilla JavaScript**: ES6+ modules with modern syntax
- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern styling with flexbox and grid layouts
- **Web APIs**: Camera API, File API, Local Storage, Fetch API

### Libraries
- **jsPDF**: PDF generation and manipulation
- **jsPDF AutoTable**: Table generation in PDFs
- **PapaParse**: CSV parsing and generation
- **EmailJS**: Email service integration (current)
- **BarcodeDetector API**: Native barcode scanning (with polyfill for iOS/Safari)
- **SheetJS (xlsx)**: Excel file parsing
- **@undecaf/zbar-wasm**: iOS barcode scanning polyfill
- **@undecaf/barcode-detector-polyfill**: iOS BarcodeDetector API polyfill

### Architecture
- **Modular Design**: Service-oriented architecture with clear separation of concerns
- **Service Layer**: Dedicated services for email, PDF, data, and app coordination
  - `AppService`: Main application coordinator
  - `DataService`: Product catalog and selection management
  - `EmailService`: Email sending with provider abstraction
  - `PDFService`: PDF and CSV generation
  - `SelectionRecorder`: Google Sheets integration
  - `LeadTracker`: Customer lead management
  - `BuilderMerchantService`: Server-side builder/merchant lists
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Fallback Systems**: Multiple fallback options for critical functionality

### Data Sources
- **Product Catalog**: Google Sheets (live CSV export)
  - Automatic caching with background updates
  - Cache invalidation on changes
- **Selection Records**: Google Sheets via Apps Script
- **Builder/Merchant Lists**: Google Sheets via Apps Script

## 📁 Project Structure

```
SEIMA-Scanner/
├── index.html              # Main application entry point
├── style.css               # Global styles
├── app.js                  # Browser compatibility check (legacy)
├── version.txt             # Application version tracking and changelog
├── server.py               # Python development server
├── server.js                # Node.js development server
├── js/
│   ├── app.js              # Main application controller
│   ├── config.js           # Configuration settings
│   ├── app-service.js      # Main application service coordinator
│   ├── data-service.js     # Product catalog and selection management
│   ├── email-service.js    # Email functionality (EmailJS)
│   ├── pdf-service.js      # PDF and CSV generation
│   ├── navigation.js      # UI navigation and routing
│   ├── scanner.js          # Barcode scanning functionality
│   ├── file-import.js      # CSV/Excel file import handling
│   ├── selection-recorder.js        # Google Sheets selection recording
│   ├── selection-recorder-config.js # Selection recorder configuration
│   ├── lead-tracker.js     # Customer lead tracking
│   ├── lead-wizard.js      # Lead collection wizard UI
│   ├── lead-wizard-integration.js   # Lead wizard integration
│   ├── builder-merchant-service.js  # Builder/merchant management
│   ├── email-template-generator.js  # Email template generation
│   ├── storage.js          # Local storage management
│   ├── utils.js            # Utility functions
│   └── browser-compatibility.js     # Browser detection and compatibility
├── screens/
│   ├── scanner.html        # Barcode scanner interface
│   ├── room-selection.html # Room selection interface
│   ├── product-details.html # Product details view
│   └── review.html         # Selection review interface with lead wizard
└── assets/
    ├── seima-logo.png      # Company logo
    ├── seima-logo-white.png # White logo variant
    └── no-image.png        # Placeholder image
```

## 🔧 Configuration

### EmailJS Setup
The application uses EmailJS for email functionality. Configuration in `js/config.js`:

```javascript
EMAIL: {
  PROVIDER: 'emailjs',
  PUBLIC_KEY: 'your_emailjs_public_key',
  SERVICE_ID: 'your_service_id',
  TEMPLATE_ID: 'your_template_id',
  FROM_EMAIL: 'noreply@seima.com.au',
  FROM_NAME: 'Seima Team',
  BCC_EMAIL: 'your_bcc_email@example.com',
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000
}
```

See `EMAIL-SETUP.md` for detailed EmailJS configuration instructions.

### Product Catalog
Products are loaded from Google Sheets with automatic caching:
- **Catalog URL**: Configured in `js/config.js` as `CATALOG_URL`
- **Caching**: Products cached in localStorage with background updates
- **Format**: CSV export from Google Sheets
- **Required Fields**: OrderCode, Description, Product Name
- **Optional Fields**: RRP_INCGST, RRP_EXGST, Image_URL, Website_URL, BARCODE, Long Description

### Selection Recording
Selection recording to Google Sheets is configured in `js/config.js`:

```javascript
SELECTION_RECORDING: {
  ENABLED: true,
  GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/.../exec',
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
}
```

See `SELECTION-RECORDING-SETUP.md` for complete setup instructions.

### Room Configuration
Predefined rooms are configured in `js/config.js`:

```javascript
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
}
```

## 💾 Local Storage

The application uses browser localStorage for:
- **Product Selection**: Current user selection with room assignments
- **Product Catalog**: Cached product data from Google Sheets
- **User Preferences**: UI settings and preferences
- **Staff Contact**: SEIMA staff contact details
- **Custom Rooms**: User-created custom room names
- **Session Data**: Form data and application state

## 🔍 Barcode Scanning

Barcode scanning uses a hybrid approach with multiple engines:
- **Primary Engine**: BarcodeDetector API (native browser support)
- **iOS Support**: Polyfills for BarcodeDetector API
  - `@undecaf/zbar-wasm` for WASM-based scanning
  - `@undecaf/barcode-detector-polyfill` for API compatibility
- **Supported Formats**: EAN-13, EAN-8, Code 128
- **Camera Selection**: Front/rear camera switching
- **Mobile Optimisation**: Touch-friendly interface with iOS-specific fixes

## 🛡️ Security Features

- **Input Sanitisation**: All user inputs are sanitised
- **XSS Prevention**: Content Security Policy implementation
- **CORS Handling**: Proper cross-origin resource sharing
- **Data Validation**: Client-side validation for all inputs
- **Error Handling**: Secure error messages without information disclosure
- **HTTPS Required**: Camera API requires secure connections

## 🌐 Browser Support

### Supported Browsers
- Chrome 80+
- Firefox 75+
- Safari 13+ (with polyfills)
- Edge 80+
- Samsung Internet 12+

### Mobile Support
- iOS Safari 13+ (with camera polyfills)
- Android Chrome 80+
- Samsung Internet 12+

### Feature Detection
The application includes comprehensive browser compatibility checking:
- Feature detection for required APIs
- Compatibility scoring
- User warnings for incompatible browsers
- Graceful degradation

## 🚀 Getting Started

### Prerequisites
- Modern web browser (see Browser Support above)
- Web server (for development: Python 3.x or Node.js)
- Google Sheets account (for product catalog and selection recording)
- EmailJS account (for email functionality)

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/seima-scanner.git
   cd seima-scanner
   ```

2. **Start development server**
   ```bash
   # Python server (recommended)
   py server.py
   
   # OR Node.js server
   node server.js
   ```

3. **Open in browser**
   Navigate to `http://localhost:8000`

4. **Configure Google Sheets**
   - Set up product catalog Google Sheet
   - Update `CATALOG_URL` in `js/config.js`
   - Set up selection recording (see `SELECTION-RECORDING-SETUP.md`)

5. **Configure EmailJS**
   - Set up EmailJS account
   - Update configuration in `js/config.js`
   - Test email functionality

### Production Deployment

See `DEPLOYMENT.md` for complete production deployment instructions including:
- Web server configuration (Apache/Nginx)
- SSL certificate setup
- Security headers
- Performance optimisation
- Monitoring and logging

## 📚 API Reference

### Main Application Service
```javascript
// Get selected products
const products = window.seimaApp.getSelectedProducts();

// Add product to selection
window.seimaApp.addProduct(product, notes, room, quantity);

// Generate PDF and send email
await window.seimaApp.appService.generateAndSendPDF(userDetails);

// Get selection statistics
const stats = window.seimaApp.appService.getSelectionStats();
```

### Debug API
```javascript
// Access debug functions
window.seimaDebug.getHealthStatus();
window.seimaDebug.getMigrationReadiness();
window.seimaDebug.testEmail();
window.seimaDebug.getErrorLog();
```

### Service Access
```javascript
// Direct service access
window.dataService    // Product catalog and selection management
window.emailService   // Email sending
window.pdfService     // PDF/CSV generation
window.appService     // Main coordinator
```

## 📈 Performance

- **Lazy Loading**: Images and components loaded on demand
- **Caching**: Intelligent caching of product data and images
  - Product catalog cached in localStorage
  - Background updates from Google Sheets
  - Cache invalidation on changes
- **Optimisation**: Image compression and PDF optimisation
- **Memory Management**: Monitoring and warnings for high memory usage
- **Network Efficiency**: Minimal API calls with caching

## 🔒 Privacy & Data

- **No Server Storage**: All selection data stored locally in browser
- **Google Sheets Integration**: Optional recording to Google Sheets (configurable)
- **GDPR Compliant**: No personal data transmitted without consent
- **Data Portability**: Export selections as CSV/PDF
- **Clear Data**: Users can clear all stored data
- **Staff Contact**: Staff details stored locally and included in PDFs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly across browsers and devices
5. Submit a pull request

## 📄 License

Copyright © 2024 SEIMA. All rights reserved.

## 🆘 Support

For support, please contact:
- **Email**: info@seima.com.au
- **Website**: www.seima.com.au

## 📖 Documentation

- **User Guide**: See `USER-GUIDE.md` for complete user instructions
- **Deployment Guide**: See `DEPLOYMENT.md` for production setup
- **Email Setup**: See `EMAIL-SETUP.md` for EmailJS configuration
- **Selection Recording**: See `SELECTION-RECORDING-SETUP.md` for Google Sheets setup
- **Troubleshooting**: See `TROUBLESHOOTING.md` for common issues

## 🎯 Current Version

**Version 3.1.3** - Lead Tracking Improvements

See `version.txt` for complete version history and changelog. Click the version number on the home page to view the interactive changelog.

---

*This application is designed and developed for SEIMA's showroom staff and customer service.*
