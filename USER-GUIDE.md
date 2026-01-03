# SEIMA Scanner User Guide

Complete guide for using the SEIMA Scanner application to select products, generate reports, and manage your bathroom and kitchen product selections.

## 🚀 Getting Started

### What is SEIMA Scanner?

SEIMA Scanner is a web-based application that helps you:
- Browse and select SEIMA bathroom and kitchen products
- Scan product barcodes with your device camera
- Organise products by room with drag-and-drop reordering
- Track customer leads and information
- Generate professional PDF reports
- Export product data as CSV files
- Email selections to customers or colleagues
- Automatically record selections to Google Sheets

### System Requirements

- **Web Browser**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Device**: Desktop, tablet, or smartphone
- **Camera**: Required for barcode scanning (optional)
- **Internet**: Required for product data and email functionality

### Accessing the Application

1. Open your web browser
2. Navigate to the application URL
3. The application will load automatically
4. No login required - start using immediately

## 📱 Navigation

### Main Screen

The main screen provides access to all features:

- **Select Products**: Browse and add products to your selection
- **View Selection**: Review and manage your current selection
- **Clear Selection**: Remove all selected products
- **SEIMA Contact**: Enter your staff contact details (included in PDFs and emails)

### Screen Navigation

- **Home**: Return to main screen
- **Back**: Return to previous screen
- **Clear**: Clear current selection
- **Help**: Access help information

## 🔍 Product Selection

### Browsing Products

1. **View Product Catalogue**
   - Products are displayed with images and descriptions
   - Scroll through the complete product range
   - Click on any product for detailed information

2. **Search Products**
   - Use the search bar to find specific products
   - Search by product name, code, or description
   - Filter results by category

3. **Product Details**
   - View high-resolution product images
   - Read detailed specifications
   - Check current pricing (where available)
   - Access product datasheets and installation guides

### Adding Products

1. **Select a Product**
   - Click on the product you want to add
   - Review the product details

2. **Configure Selection**
   - **Room**: Choose from predefined rooms (Bath 1, Bath 2, Bath 3, Ensuite, Powder, Kitchen, Butlers, Laundry, Alfresco) or create a custom room
   - **Quantity**: Set the number of units needed (1-10)
   - **Notes**: Add any special requirements or notes (max 140 characters)

3. **Add to Selection**
   - Click "Add to Selection"
   - Product will appear in your current selection
   - Selection counter will update

### Managing Your Selection

1. **View Current Selection**
   - Click "View Selection" from the main screen
   - Products are organised by room
   - Total count and estimated value displayed
   - Drag-and-drop to reorder products within rooms (mobile and desktop)

2. **Edit Products**
   - Tap/click the edit button on any product card
   - Change quantities, room assignments, or notes
   - Delete products from selection
   - Inline quantity display on review cards

3. **Clear Selection**
   - Remove individual products via edit screen
   - Use "Clear Selection" button on main screen to clear all
   - Confirmation dialog prevents accidental clearing

## 📷 Barcode Scanner

### Using the Scanner

1. **Access Scanner**
   - Click "Barcode Scanner" from the main screen
   - Allow camera permissions when prompted

2. **Scan Products**
   - Point your device camera at the barcode
   - Hold steady until the barcode is recognised
   - Product details will appear automatically
   - Add to selection or continue scanning

3. **Scanner Tips**
   - Ensure good lighting
   - Hold device 10-15cm from barcode
   - Keep barcode flat and unfolded
   - Try different angles if not recognised

### Camera Settings

- **Camera Selection**: Switch between front and rear cameras
- **Flash**: Enable/disable flash for better lighting
- **Focus**: Tap to focus on barcode area
- **Zoom**: Use pinch gestures to zoom in/out

## 📝 Text Scan (OCR)

### Using Text Scan Mode

1. **Start Text Scan**
   - From the scanner screen, tap the **Text Scan** button
   - Allow camera permissions if not already granted

2. **Scan Product Labels**
   - Aim the camera at the product label showing the **Order Code** (e.g., 191234) or product name
   - Hold steady - the app analyses the frame every 1-2 seconds
   - Ensure good, even lighting for best results

3. **Select Products**
   - When text is detected, a confirmation dialog lists possible matches
   - Check one or more products from the list
   - Tap "Add Selected" to add them to your selection
   - Or tap "Cancel" to continue scanning

### Text Scan Tips

- **Good Lighting**: Even, bright lighting is critical for accurate text recognition
- **Clear Text**: Ensure the 19xxxx OrderCode or product name is clearly visible and reasonably large
- **Steady Hold**: Keep the device steady while scanning
- **Offline Capable**: Works fully offline after initial load
- **Battery Efficient**: Scans every 1.5 seconds to balance accuracy and battery usage

### When to Use Text Scan

- Product labels without barcodes
- Damaged or unreadable barcodes
- Product names visible on packaging
- OrderCodes printed on labels (19xxxx format)

## 📁 File Import

### CSV/Excel File Import

1. **Prepare File**
   - Use CSV or Excel (.xlsx) format
   - Include OrderCode column (required)
   - Include Room, Quantity, Notes columns (optional)

2. **Import Process**
   - Access file import from product selection screen
   - Drag and drop file or click to browse
   - Choose import mode:
     - **Append**: Add to existing selection (items go to "Blank" room)
     - **Override**: Replace all existing selections (warning: clears everything)
   - Review import results

3. **File Format**
   ```csv
   OrderCode,Room,Quantity,Notes
   "ABC123","Kitchen",2,"Wall mounted"
   "DEF456","Bathroom",1,"Chrome finish"
   "GHI789","Laundry",3,"Standard height"
   ```

### Import Results

- **Successful**: Products added to selection
- **Not Found**: Products not in catalogue (added with placeholder information)
- **Errors**: Invalid format or missing data (displayed in results)

## 📊 Reports and Export

### Lead Collection Wizard

When you click "Email" from the review screen, a multi-step wizard collects customer information:

**Step 1: Customer & Project Information**
- Customer Name (required)
- Customer Email (required)
- Customer Phone (optional, preserves leading zeros)
- Project Name (required)
- Project Address (optional)
- Project Notes (optional)
- Options: Exclude price, Export CSV (recommended)

**Step 2: Customer Type**
- Select customer type: Builder, Merchant, Homeowner, or Other
- If Builder: Select or add builder name (searches existing list)
- If Merchant: Select or add merchant name (searches existing list)
- Builder/Merchant lists are shared across all showrooms and sorted alphabetically

**Step 3: How They Found Us**
- Select referral sources (multiple selections possible)
- If referred by builder: Select or add referral builder
- If referred by merchant: Select or add referral merchant
- Custom referral source option

### PDF Reports

1. **Generate PDF**
   - Complete the lead collection wizard
   - PDF is automatically generated with customer details

2. **PDF Features**
   - Professional SEIMA branding
   - Customer information section
   - Staff contact details (if configured)
   - Product images and specifications
   - Room-by-room organisation
   - Pricing information (optional, can be excluded)
   - QR codes for product links
   - Professional title page

3. **PDF Quality Options**
   - **Standard Quality**: Full resolution images
   - **Email Compatible**: Optimised for email attachments (smaller file size)
   - **Print Ready**: High-quality printing

### CSV Export

1. **Generate CSV**
   - Enable "Export CSV" option in Step 1 of lead wizard (recommended)
   - CSV file is automatically generated with character sanitisation for email compatibility

2. **CSV Contents**
   - Product codes and descriptions
   - Room assignments
   - Quantities and notes
   - Pricing information (if not excluded)
   - Website links
   - All data sanitised for reliable email delivery

## 📧 Email Integration

### Sending Reports

1. **Email Process**
   - Complete the lead collection wizard
   - Customer email is pre-filled from Step 1
   - Click "Send" to generate PDF and send email
   - Email is automatically sent with PDF and CSV (if selected) attachments

2. **Attachments**
   - PDF report (always included)
   - CSV file (if "Export CSV" was selected)
   - Professional HTML email template

3. **Email Features**
   - Professional SEIMA branding
   - Customer information summary
   - Project details
   - Attached documents description
   - Staff contact information
   - BCC copy sent to SEIMA staff email
   - Automatic download fallback if email fails

### Email Templates

The application sends professional HTML emails with:
- SEIMA branding and logo
- Customer information summary
- Project details
- Attached documents description
- Staff contact information
- Australian English spelling throughout

### Selection Recording

After successful email sending:
- Selection is automatically recorded to Google Sheets (if configured)
- Includes all customer and staff information
- Complete product selection details
- Selection statistics and email status
- Builder and merchant referral information

## 🔧 Settings and Preferences

### Staff Contact Details

1. **Configure Staff Contact**
   - Click "SEIMA Contact" button on main screen
   - Enter your name, mobile number, and email address
   - Click "Save Contact Details"
   - Your details will be included in all PDF reports and you'll receive BCC copies of emails

2. **Staff Contact Features**
   - Stored locally in browser
   - Included in PDF title page
   - Included in email templates
   - Receives BCC copy of all customer emails

### Data Management

- **Clear Selection**: Remove all selected products and room assignments
- **Local Storage**: All data stored locally in browser
- **Automatic Recording**: Selections automatically recorded to Google Sheets (if configured)
- **Data Portability**: Export selections as CSV/PDF at any time

### Room Management

- **Predefined Rooms**: Bath 1, Bath 2, Bath 3, Ensuite, Powder, Kitchen, Butlers, Laundry, Alfresco
- **Custom Rooms**: Create additional custom room names
- **Drag-and-Drop**: Reorder products within rooms on mobile and desktop
- **Room Organisation**: Products automatically grouped by room in review screen

## 💡 Tips and Best Practices

### Efficient Product Selection

1. **Use Rooms**: Always assign products to rooms for better organisation
2. **Add Notes**: Include important details like finishes, heights, or special requirements
3. **Check Quantities**: Verify quantities before generating reports
4. **Review Selection**: Use the review screen to check everything before finalising

### Professional Reports

1. **Complete Information**: Fill in all customer details for professional appearance
2. **Accurate Data**: Double-check product selections and quantities
3. **Clear Notes**: Write clear, professional notes for each product
4. **Consistent Naming**: Use consistent room names throughout your selection

### Email Best Practices

1. **Professional Subject**: Use clear, descriptive subject lines
2. **Personal Message**: Include a personal message for customers
3. **Check Recipients**: Verify email addresses before sending
4. **Follow Up**: Confirm receipt of important selections

## 🔍 Troubleshooting

### Common Issues

1. **Camera Not Working**
   - Check camera permissions in browser
   - Ensure camera is not being used by another app
   - Try refreshing the page
   - Use a different browser

2. **Products Not Found**
   - Check product codes for accuracy
   - Verify product is in current catalogue
   - Try manual search instead of barcode
   - Contact support for new products

3. **Email Not Sending**
   - Check internet connection
   - Verify email address format
   - Try reducing PDF file size
   - Check spam folder for confirmation

4. **PDF Generation Issues**
   - Ensure all required fields are filled
   - Check for special characters in notes
   - Try reducing number of products
   - Use "Email Compatible" option

### Performance Tips

1. **Browser Performance**
   - Use latest browser version
   - Clear browser cache regularly
   - Close unnecessary tabs
   - Restart browser if slow

2. **Mobile Performance**
   - Ensure good internet connection
   - Close other apps while using scanner
   - Keep device charged
   - Use landscape mode for better viewing

## 🛡️ Data Privacy

### Information Handling

- **Local Storage**: All data stored locally on your device
- **No Server Storage**: Selections not stored on external servers
- **Email Privacy**: Email addresses only used for sending reports
- **Data Clearing**: Clear all data at any time

### Security

- **Secure Connections**: All communications use HTTPS
- **No Personal Data**: Only product selections are stored
- **Data Portability**: Export your data at any time
- **Privacy Controls**: Full control over your information

## 📞 Support

### Getting Help

1. **In-App Help**: Click help buttons throughout the application
2. **User Guide**: Refer to this guide for detailed instructions
3. **Technical Support**: Contact IT support for technical issues
4. **Product Support**: Contact SEIMA for product-related questions

### Contact Information

- **Email**: info@seima.com.au
- **Website**: www.seima.com.au
- **Phone**: [Contact Number]

### Feedback

We welcome your feedback to improve the application:
- Report bugs or issues
- Suggest new features
- Share user experience feedback
- Request additional product information

## 🚀 Advanced Features

### Keyboard Shortcuts

- **Ctrl+F**: Search products
- **Ctrl+S**: Save current selection
- **Ctrl+P**: Generate PDF
- **Ctrl+E**: Send email
- **Ctrl+C**: Clear selection
- **Ctrl+Z**: Undo last action

### Mobile Gestures

- **Swipe**: Navigate between screens
- **Pinch**: Zoom in scanner
- **Tap**: Select products
- **Long Press**: Access additional options

### Browser Features

- **Bookmark**: Save application for quick access
- **Add to Home Screen**: Install as mobile app
- **Offline Mode**: Limited functionality without internet
- **Print**: Print PDF reports directly

## 📚 Appendices

### Product Code Format

SEIMA product codes follow this format:
- Letters and numbers (e.g., ABC123)
- May include hyphens (e.g., ABC-123)
- Case insensitive
- Usually 6-8 characters long

### Room Categories

Predefined room categories:
- Bath 1
- Bath 2
- Bath 3
- Ensuite
- Powder
- Kitchen
- Butlers
- Laundry
- Alfresco
- Custom rooms (user-created)

### File Formats

Supported file formats:
- **PDF**: Adobe PDF format (generated reports)
- **CSV**: Comma-separated values (import/export)
- **Excel**: .xlsx format (import only)
- **Images**: JPEG, PNG for product images

### Builder/Merchant Management

- **Shared Lists**: Builder and merchant lists are shared across all showrooms
- **Real-Time Search**: As you type, the system searches for existing entries
- **Duplicate Prevention**: Shows existing matches before allowing new entries
- **Auto-Complete**: Click suggestions to select from existing entries
- **Alphabetical Sorting**: All lists automatically sorted A-Z (case-insensitive)
- **Server-Side Storage**: Lists stored in Google Sheets and cached locally

---

*Thank you for using SEIMA Scanner. This guide will help you make the most of the application's features for your bathroom and kitchen product selection needs.* 