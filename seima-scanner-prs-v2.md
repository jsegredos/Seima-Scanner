# Seima Showroom Scanner - Product Requirements Specification (PRS) v2.2

## Implementation Summary (June 2025)
- Room Selection: 3-column grid, compact, custom icons, fits on one screen, minimal padding.
- Product Details: Always includes quantity input, robust error handling, room selector, annotation field, all mobile-first.
- Review Selection: Amazon-style cards, white background, soft shadow, top-aligned image left, info right, compact spacing, price right-aligned with 'ea', no dividers, quantity pill below image, bin icon black, no image border, no long description, notes shown, minimal vertical margin, no room dividers, all touch-friendly.
- Product search: Manual barcode entry replaced with live product search by description, dropdown selection.
- PDF Generation: A4 landscape, cover page with client details, product table with image, diagram, code, description (with notes), qty, price ea, total, grouped by room, www.seima.com.au footer, page number, SEIMA branding bar, matches provided sample.
- General: All screens mobile-first, touch-friendly, modern Apple-like/clean design, robust error handling, persistent selection, CORS/local dev notes, all recent UI/UX improvements.

## Recent Changes (June 2025)
- Room Selection: 3-column grid, compact, fits on one screen, custom icons.
- Product Details: Always includes quantity input, robust error handling.
- Review Selection: Amazon-style cards, white background, soft shadow, top-aligned image left, info right, compact spacing, price right-aligned with 'ea', no dividers, quantity pill below image, bin icon black, no image border, no long description, notes shown, minimal vertical margin, no room dividers.
- Product search: Manual barcode entry replaced with live product search by description.
- PDF Generation: A4 landscape, cover page with client details, product table with image, diagram, code, description (with notes), qty, price ea, total, grouped by room, www.seima.com.au footer, page number, SEIMA branding bar.
- General: All screens mobile-first, touch-friendly, modern Apple-like/clean design, robust error handling, persistent selection, CORS/local dev notes.

# Product Requirements Specification (PRS) v0.2
## Seima Showroom Scanner - Progressive Web Application

### 1. Project Overview

This document outlines the product requirements for a web-based progressive web application designed for use in Seima showrooms. The application enables customers and showroom staff to scan products using barcodes, organize them by room location, add annotations, and generate professional PDF reports that can be downloaded or emailed directly to customers.

### 2. Objectives

* Enable barcode scanning via device cameras without app installation
* Provide intuitive room-based product organization with flexible reassignment
* Deliver a premium mobile-first user experience
* Support offline functionality with local data persistence
* Generate and email professional PDF summaries with customer details
* Ensure cross-platform compatibility (iOS, Android, Desktop)
* Minimize friction in the product selection process

### 3. Functional Requirements

#### 3.1 Core Features

1. **Barcode Scanning**
   - Camera-based barcode scanning using device camera
   - Support for multiple barcode formats (EAN-13, UPC, Code 128, Code 39)
   - Product search by Description as fallback option
     - User can type part of the product description
     - Dropdown shows matching products to select
   - Real-time visual feedback with animated scanning overlay
   - Audio and haptic feedback on successful scan (where supported)
   - Error handling for camera permissions and scan failures
   - Visual cues including green highlight on successful scan

2. **Room Management**
   - Pre-defined room categories: Bath 1, Bath 2, Ensuite, Powder, Kitchen, Laundry, Alfresco, Butlers, Other
   - Custom room creation: Users can add their own room names
   - Visual room selection with compact 3-column grid layout, custom icons, minimal padding, fits on one screen
   - "Add Custom Room" option with:
     - Text input for room name
     - Validation for duplicate names
   - Dynamic room list management:
     - View all rooms (predefined + custom)
     - Remove custom rooms
     - Edit custom room names
   - Room persistence across sessions
   - Maximum 20 total rooms (to maintain UI clarity)
   - Dynamic room assignment/reassignment after product scanning
   - Room-based product grouping in review screen
   - Clickable room badge for quick changes
   - Visual indication of selected room
   - Edit room assignment capability in review screen

3. **Product Information Display**
   - Product images from catalog (with graceful fallback)
   - Comprehensive product details:
     - Product name (from Description field)
     - Order code (from OrderCode field)
     - Full description (from LongDescription field)
     - Price including GST (from RRP_INCGST field)
     - Barcode number
   - Direct links to:
     - Product datasheets (PDF) via "View Datasheet" button
     - Technical diagrams
     - Product website pages
   - Multi-line free-text annotation field for each product
   - Quantity input (always present, robust error handling)
   - Room selector (always present)
   - Price display with GST included
   - Clear "Add to Selection" action button

4. **Selection Management**
   - Add products to current room selection
   - Edit capabilities in review screen:
     - Change room assignment (including to custom rooms)
     - Modify product annotations
     - Remove products from selection
     - Adjust quantity with Amazon-style pill control (below image, black bin icon, no image border)
   - Running count of selected items in navigation
   - Persistent storage using browser localStorage for:
     - Product selections
     - Custom room configurations
     - User preferences
   - Review screen with products grouped by room
   - Product thumbnails in review list (top-aligned left, info right)
   - Amazon-style cards: white background, soft shadow, compact spacing, price right-aligned with 'ea', no dividers, no long description, notes shown, minimal vertical margin, no room dividers, all touch-friendly
   - "Scan More" option to continue adding products
   - Empty room cleanup (removes rooms with no products)

5. **PDF Generation & Distribution**
   - Customer information capture:
     - Full name (required)
     - Email address (required)
     - Project notes (optional)
   - Professional PDF layout featuring:
     - A4 landscape format
     - Cover page with SEIMA branding/logo and client details
     - Product table with image, diagram, code, description (with notes), qty, price ea, total
     - Products grouped by room
     - www.seima.com.au footer, page number, SEIMA branding bar
     - Professional formatting matching provided sample
   - Distribution options:
     - "Download PDF" button for direct device download
     - "Email PDF" functionality with recipient email input
     - Email composed via mailto: link with PDF attachment instructions
     - Confirmation message upon PDF generation
   - "Start New Selection" option to clear and begin new project

#### 3.2 User Interface Requirements

1. **Mobile-First Design**
   - Native app-like appearance and behavior
   - Touch-optimized interface elements (44px minimum touch targets)
   - Bottom navigation for thumb accessibility
   - Smooth transitions and animations (60fps)
   - Safe area support for modern devices (notches, home indicators)
   - Responsive layout for tablets and desktops

2. **Visual Design**
   - Clean, modern aesthetic inspired by premium mobile apps
   - Prominent Seima Showroom branding throughout
   - High contrast for readability (WCAG AA compliant)
   - Clear visual hierarchy with consistent spacing
   - Contextual action buttons
   - Loading states and empty states with helpful messaging
   - Smooth action sheets sliding from bottom
   - Visual feedback for all interactions
   - Green success indicators for scanning and actions

3. **Navigation Flow**
   - Linear flow: Welcome → Room Selection → Scanner → Product Details → Review → PDF/Email
   - Back navigation available from any screen
   - Quick access to review from scanner with item count
   - Room change capability from product details screen
   - Consistent bottom navigation pattern
   - Clear visual breadcrumbs via header subtitles
   - "Scan More" loops back to scanner from review

### 4. Technical Requirements

#### 4.1 Architecture

* **Frontend**: Single-page application (SPA) using vanilla JavaScript
* **Styling**: Modern CSS with CSS variables for theming
* **Data Source**: Google Sheets integration with fallback options
* **Libraries**: 
  - QuaggaJS v0.12.1 for barcode scanning
  - jsPDF v2.5.1 for PDF generation
  - jsPDF-AutoTable v3.5.31 for PDF tables
  - No framework dependencies (React, Vue, Angular)

#### 4.2 Data Integration

* **Primary**: Google Sheets via direct URL access
  - Public read-only access required
  - Fallback to embedded sample data
  - Support for up to 10,000 products
* **Production Options**:
  - Google Sheets API v4 with API key
  - JSON file hosting
  - CSV export conversion
  - REST API endpoint

#### 4.3 Browser Support

* Chrome/Edge 90+ (latest 2 versions)
* Safari iOS 14+
* Firefox 90+ (latest 2 versions)
* Android WebView 7+
* Progressive enhancement for older browsers

### 5. Non-Functional Requirements

#### 5.1 Performance
* Initial load time < 3 seconds on 4G connection
* Subsequent loads < 1 second (with caching)
* Barcode scan recognition < 1 second
* Smooth 60fps animations throughout
* Efficient memory usage for sessions with 50+ products
* PDF generation < 2 seconds for typical selection

#### 5.2 Security
* HTTPS required for camera access
* No sensitive data stored locally (only product selections)
* Read-only access to product catalog
* No user authentication required
* Sanitized inputs for PDF generation
* No third-party tracking or analytics

#### 5.3 Accessibility
* High contrast ratios (WCAG AA compliant)
* Touch targets minimum 44x44 pixels
* Clear error messages and feedback
* Semantic HTML structure
* Keyboard navigation support (where applicable)
* Screen reader compatible markup

#### 5.4 Scalability
* Support for product catalogs up to 10,000 items
* Handle 50+ products per selection session
* Support up to 20 rooms per project (predefined + custom)
* Concurrent usage by unlimited devices
* Efficient data loading with minimal API calls
* Local caching for offline capability
* Room configuration persistence

### 6. User Interface Design

The application's user interface follows a clear and intuitive flow, encompassing the following key screens:

#### 6.1 Welcome Screen
* Prominent "Seima Showroom Scanner" branding
* Product Selection Assistant tagline
* Product count display showing available items
* Clear "Start Scanning" button with arrow icon
* Brief introductory message explaining the app's purpose
* Clean, professional design establishing brand identity

#### 6.2 Room Selection Screen
* Clear header: "Select Room"
* Subtitle: "Choose where these products will go"
* Grid layout (responsive) featuring:
  - Bath 1
  - Bath 2
  - Ensuite
  - Powder
  - Kitchen
  - Laundry
  - Alfresco
  - Butlers
  - Other
  - Add Custom Room
* Custom room creation flow:
  - Tapping "Add Custom Room" opens input dialog
  - Room name input field (max 30 characters)
  - "Create" and "Cancel" buttons
  - Duplicate name validation
* Custom rooms display:
  - Appear in the same grid
  - Long-press to edit or delete (mobile)
  - Right-click menu (desktop)
  - Visual differentiation from predefined rooms
* Maximum 20 total rooms with scroll if needed
* Visual feedback on selection (highlighted border, checkmark)
* Room management button for bulk operations
* Back navigation to welcome screen

#### 6.3 Barcode Scanner Screen
* Header: "Scan Product" with current room badge
* Live camera feed with scanning overlay:
  - Green corner brackets indicating scan area
  - Animated scanning line
  - Real-time barcode detection
* Manual entry section:
  - "Or enter barcode manually" label
  - Text input field with search button
* Bottom navigation:
  - "Change Room" button
  - "Review (X)" button showing selection count
* Visual and audio cues for successful scan

#### 6.4 Product Details Screen (with Annotation Input)
* Header: "Product Details" with clickable room badge
* Back arrow for easy navigation
* Product image (or placeholder if unavailable)
* Product information display:
  - Product name (prominent)
  - Product code
  - Full description
  - Price (inc GST) in large font
  - Barcode number
* "View Datasheet" button (when available)
* Multi-line annotation field:
  - "Add Notes (Optional)" label
  - Placeholder: "E.g., Quantity needed, special requirements..."
* Clear "Add to Room" action button
* Success confirmation upon adding

#### 6.5 Review & Edit Selections Screen
* Header: "Review Selection"
* Subtitle: "Your product selections"
* Products organized by room sections:
  - Room name with item count badge
  - Product list with thumbnails
  - Product name and description
  - Annotation display (if added)
  - Remove button (×) for each item
* Edit capabilities:
  - Tap room badge to reassign products
  - Tap product to edit annotations
  - Swipe or tap × to remove
* Bottom navigation:
  - "Add More" button (returns to room selection)
  - "Send PDF" button (opens customer form)
* Empty state message when no products selected

#### 6.6 PDF/Email Generation Screen
* Action sheet sliding from bottom
* Header: "Send PDF Report"
* Customer information form:
  - "Your Name" field (required)
  - "Email Address" field (required)
  - "Project Notes" multi-line field (optional)
* "Generate & Download PDF" primary button
* Confirmation message after generation:
  - "✓ PDF Generated!"
  - Shows filename
  - Email instructions
* Additional options:
  - "Email PDF" with recipient input
  - "Start New Selection" to clear and restart
* Close button (×) to dismiss sheet

### 7. Data Structure

#### 7.1 Product Catalog Schema (Google Sheets Columns)
```javascript
{
  OrderCode: String,         // "193354" - Primary product identifier
  Description: String,       // "AGRA 430 Basin Insert, 0TH, NOF White Silk Matte"
  LongDescription: String,   // Extended product description with specifications
  RRP_EXGST: Number,        // 395 - Recommended retail price excluding GST
  RRP_INCGST: Number,       // 434.5 - Recommended retail price including GST
  Website_URL: String,      // Product page on Seima website
  Image_URL: String,        // Product image URL
  Diagram_URL: String,      // Technical diagram URL
  Datasheet_URL: String,    // PDF datasheet URL
  BARCODE: String          // "9344008031217" - Scannable barcode
}
```

#### 7.2 Internal Product Schema (App Usage)
```javascript
{
  ProductID: String,        // Maps from OrderCode
  Name: String,             // Maps from Description
  Description: String,      // Maps from LongDescription
  Price: Number,            // Maps from RRP_INCGST
  Barcode: String,          // Maps from BARCODE
  ImageURL: String,         // Maps from Image_URL
  DatasheetURL: String,     // Maps from Datasheet_URL
  WebsiteURL: String,       // Maps from Website_URL
  DiagramURL: String        // Maps from Diagram_URL
}
```

#### 7.3 Selection Schema
```javascript
{
  ...productData,
  Room: String,             // "Bath 1" or custom room name
  Notes: String,            // "Customer annotations"
  Timestamp: ISO8601        // "2024-01-20T10:30:00Z"
}
```

#### 7.4 Room Configuration Schema
```javascript
{
  predefinedRooms: [
    { name: "Bath 1", removable: false },
    { name: "Bath 2", removable: false },
    { name: "Ensuite", removable: false },
    { name: "Powder", removable: false },
    { name: "Kitchen", removable: false },
    { name: "Laundry", removable: false },
    { name: "Alfresco", removable: false },
    { name: "Butlers", removable: false },
    { name: "Other", removable: false }
  ],
  customRooms: [
    { name: "Master Ensuite", removable: true },
    { name: "Guest Bath", removable: true },
    { name: "Pool House", removable: true }
  ]
}
```

#### 7.4 Sample Data
- Basin products with various finishes (White Gloss, White Silk Matte, Black Silk Matte)
- Price range: $385 - $676.50 (inc GST)
- All products include high-resolution images and PDF datasheets
- Consistent barcode format (13 digits)
- Product codes follow pattern: 19XXXX

### 8. Email Functionality

#### 8.1 Email PDF Feature
* **Method 1**: Mailto Link (Current Implementation)
  - Opens device's default email client
  - Pre-fills subject: "Seima Product Selection - [Customer Name]"
  - Pre-fills body with instructions to attach downloaded PDF
  - Customer manually attaches the PDF file

* **Method 2**: Server-Side Email (Future Enhancement)
  - Requires backend service (Node.js, Python, etc.)
  - Direct SMTP integration
  - Automatic PDF attachment
  - Delivery confirmation

* **Method 3**: Third-Party Service (Alternative)
  - Integration with EmailJS or similar
  - No backend required
  - Limited free tier usage
  - API key management needed

### 9. Deployment Options

1. **Static Hosting** (Recommended)
   - GitHub Pages (free, reliable, custom domain support)
   - Netlify (automatic deployments, form handling)
   - Vercel (edge functions, analytics)

2. **Progressive Web App Features**
   - Service worker for offline functionality
   - Web app manifest for installability
   - Cache-first strategy for product images
   - Background sync for selections

3. **Production Configuration**
   - Google Sheets API key setup
   - CORS handling for API access
   - Environment variables for configuration
   - SSL certificate for HTTPS

### 10. Future Enhancements

* **Phase 1 Enhancements**
  - Advanced room management:
    - Room templates for common projects
    - Import/export room configurations
    - Room-specific product suggestions
    - Room dimension tracking
  - Multi-language support (Chinese, Italian, Spanish)
  - Barcode label printing for showroom use
  - Direct email sending with PDF attachment
  - Customer account creation and history

* **Phase 2 Enhancements**
  - Real-time inventory checking
  - Price calculator with running totals
  - Product comparison features
  - QR code support for digital catalogs

* **Phase 3 Enhancements**
  - Integration with Seima CRM/ERP systems
  - Wishlist and saved selections
  - Augmented reality product preview
  - Voice-activated scanning

### 11. Success Metrics

* **Technical Metrics**
  - Scan success rate > 95%
  - PDF generation success > 99%
  - Page load time < 2 seconds
  - Zero critical errors per session

* **User Experience Metrics**
  - Average session duration > 5 minutes
  - Task completion rate > 90%
  - Products per selection: 5-15 average
  - Return user rate > 40%

* **Business Metrics**
  - Selections converted to orders > 30%
  - Staff efficiency improvement > 50%
  - Customer satisfaction score > 4.5/5
  - Reduction in selection errors > 80%

### 12. Testing Requirements

* **Functional Testing**
  - All barcode formats scan correctly
  - Room assignment/reassignment works
  - Custom room creation and management
  - Room name validation and limits
  - PDF generation includes all data
  - Email functionality operates correctly
  - Custom rooms persist across sessions

* **Device Testing**
  - iOS: iPhone 12+ and iPad
  - Android: Samsung, Google Pixel
  - Tablets: iPad, Android tablets
  - Desktop: Chrome, Safari, Firefox

* **Performance Testing**
  - Load testing with 1000+ products
  - Concurrent user simulation
  - Network throttling tests
  - Memory leak detection

### 13. Documentation

* **User Documentation**
  - Quick start guide for staff
  - Troubleshooting common issues
  - Best practices for scanning
  - PDF customization options

* **Technical Documentation**
  - API integration guide
  - Deployment instructions
  - Configuration options
  - Maintenance procedures

### 14. Support & Maintenance

* **Launch Support**
  - Staff training sessions
  - On-site assistance first week
  - Quick reference cards
  - Video tutorials

* **Ongoing Maintenance**
  - Monthly product catalog updates
  - Quarterly feature updates
  - Security patches as needed
  - Performance monitoring

---

**Document Version**: 2.1  
**Last Updated**: January 2024  
**Status**: Implementation Complete with Email Enhancement Pending  
**Next Review**: February 2024  
**Approved By**: Seima Management Team