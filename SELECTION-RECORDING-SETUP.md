# Selection Recording Setup Guide

This guide will help you set up the Google Sheets + Apps Script solution to record all finalised selections from your Seima Scanner application.

## 📋 What Gets Recorded

Every time a customer selection is finalised and emailed, the system will automatically record:

- **Timestamp** (date and time)
- **Staff Information** (name, email, mobile)
- **Customer Details** (name, email, phone, project, address)
- **Product Selection** (all products, rooms, quantities, notes)
- **Selection Summary** (total products, rooms, estimated value)
- **Email Status** (PDF generated, CSV included, file sizes)

## 🚀 Setup Instructions

### Step 1: Create Google Sheet

1. **Go to Google Sheets**: [sheets.google.com](https://sheets.google.com)
2. **Create a new sheet** called "Seima Selection Records"
3. **The script will automatically create "Builders" and "Merchants" sheets** when first accessed
4. **Set up columns** in Row 1 of the main sheet (copy and paste this header row):

```
Date	Time	App Version	Staff Name	Staff Email	Staff Mobile	Customer Name	Customer Email	Customer Phone	Customer Project	Customer Address	Customer Type	Hear About Us	Project Notes	Builder Name	Merchant Name	Referral Builder	Referral Merchant	Total Products	Total Quantity	Total Rooms	Rooms List	Estimated Value	Email Sent	PDF Generated	CSV Generated	PDF Size	Products JSON
```

### Step 2: Create Google Apps Script

1. **In your Google Sheet**, go to `Extensions > Apps Script`
2. **Replace the default code** with this script:

```javascript
function doPost(e) {
  try {
    let data;
    
    // Handle both JSON and FormData submissions
    if (e.postData.type === 'application/json') {
      data = JSON.parse(e.postData.contents);
    } else {
      // Handle FormData (to avoid CORS issues)
      const params = e.parameter;
      if (params.data) {
        data = JSON.parse(params.data);
      } else {
        throw new Error('No data received');
      }
    }
    
    // Get the active sheet
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // Skip if this is a test record
    if (data.test) {
      return ContentService
        .createTextOutput(JSON.stringify({success: true, message: 'Test successful'}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Get header row to find column positions (allows flexible column ordering)
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const columnMap = {};
    
    // Map column names to their positions
    headerRow.forEach((header, index) => {
      if (header && header.toString().trim()) {
        columnMap[header.toString().trim()] = index + 1; // Google Sheets is 1-indexed
      }
    });
    
    // Prepare data mapping (field name -> column name)
    const dataMapping = {
      'Date': data.date || '',
      'Time': data.time || '',
      'App Version': data.appVersion || '',
      'Staff Name': data.staffName || '',
      'Staff Email': data.staffEmail || '',
      'Staff Mobile': data.staffMobile || '',
      'Customer Name': data.customerName || '',
      'Customer Email': data.customerEmail || '',
      'Customer Phone': data.customerPhone || '',
      'Customer Project': data.customerProject || '',
      'Customer Address': data.customerAddress || '',
      'Customer Type': data.customerType || '',
      'Hear About Us': data.hearAboutUs || '',
      'Project Notes': data.projectNotes || '',
      'Builder Name': data.builderName || '',
      'Merchant Name': data.merchantName || '',
      'Referral Builder': data.referralBuilder || '',
      'Referral Merchant': data.referralMerchant || '',
      'Total Products': data.totalProducts || 0,
      'Total Quantity': data.totalQuantity || 0,
      'Total Rooms': data.totalRooms || 0,
      'Rooms List': data.roomsList || '',
      'Estimated Value': data.estimatedValue || '0.00',
      'Email Sent': data.emailSent || false,
      'PDF Generated': data.pdfGenerated || false,
      'CSV Generated': data.csvGenerated || false,
      'PDF Size': data.pdfSize || '',
      'Products JSON': data.productsJson || ''
    };
    
    // Create a new row array with the correct number of columns
    const newRow = new Array(headerRow.length).fill('');
    
    // Populate the row based on column positions
    Object.keys(dataMapping).forEach(columnName => {
      const columnIndex = columnMap[columnName];
      if (columnIndex) {
        newRow[columnIndex - 1] = dataMapping[columnName]; // Convert to 0-indexed
      }
    });
    
    // Add the row to the sheet
    sheet.appendRow(newRow);
    
    // Return success response
    return ContentService
      .createTextOutput(JSON.stringify({success: true, row: sheet.getLastRow()}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    console.log('doGet called with:', JSON.stringify(e));
    
    const params = e.parameter || {};
    const action = params.action;
    
    switch (action) {
      case 'getBuilders':
        return getBuilders();
      case 'getMerchants':
        return getMerchants();
      case 'addBuilder':
        return addBuilder(params.name);
      case 'addMerchant':
        return addMerchant(params.name);
      case 'searchBuilders':
        return searchBuilders(params.query);
      case 'searchMerchants':
        return searchMerchants(params.query);
      default:
        return ContentService
          .createTextOutput('Seima Selection Recorder is running!')
          .setMimeType(ContentService.MimeType.TEXT);
    }
  } catch (error) {
    console.error('Error in doGet:', error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Builder/Merchant Management Functions
function getBuilders() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let buildersSheet = getOrCreateSheet(spreadsheet, 'Builders');
    
    const data = buildersSheet.getDataRange().getValues();
    const builders = data.slice(1).map(row => row[0]).filter(name => name); // Skip header, get first column
    
    // Sort alphabetically (case-insensitive)
    builders.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, builders: builders}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getMerchants() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let merchantsSheet = getOrCreateSheet(spreadsheet, 'Merchants');
    
    const data = merchantsSheet.getDataRange().getValues();
    const merchants = data.slice(1).map(row => row[0]).filter(name => name); // Skip header, get first column
    
    // Sort alphabetically (case-insensitive)
    merchants.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, merchants: merchants}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function addBuilder(name) {
  try {
    if (!name || name.trim() === '') {
      throw new Error('Builder name is required');
    }
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let buildersSheet = getOrCreateSheet(spreadsheet, 'Builders');
    
    // Check for duplicates (case-insensitive)
    const data = buildersSheet.getDataRange().getValues();
    const existingBuilders = data.slice(1).map(row => row[0]).filter(name => name);
    const normalizedName = name.trim();
    const duplicate = existingBuilders.find(existing => 
      existing.toLowerCase() === normalizedName.toLowerCase()
    );
    
    if (duplicate) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, error: 'Builder already exists', existing: duplicate}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Add new builder
    buildersSheet.appendRow([normalizedName, new Date()]);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Builder added successfully', name: normalizedName}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function addMerchant(name) {
  try {
    if (!name || name.trim() === '') {
      throw new Error('Merchant name is required');
    }
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let merchantsSheet = getOrCreateSheet(spreadsheet, 'Merchants');
    
    // Check for duplicates (case-insensitive)
    const data = merchantsSheet.getDataRange().getValues();
    const existingMerchants = data.slice(1).map(row => row[0]).filter(name => name);
    const normalizedName = name.trim();
    const duplicate = existingMerchants.find(existing => 
      existing.toLowerCase() === normalizedName.toLowerCase()
    );
    
    if (duplicate) {
      return ContentService
        .createTextOutput(JSON.stringify({success: false, error: 'Merchant already exists', existing: duplicate}))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Add new merchant
    merchantsSheet.appendRow([normalizedName, new Date()]);
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, message: 'Merchant added successfully', name: normalizedName}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function searchBuilders(query) {
  try {
    if (!query || query.trim() === '') {
      return getBuilders(); // Return all if no query
    }
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let buildersSheet = getOrCreateSheet(spreadsheet, 'Builders');
    
    const data = buildersSheet.getDataRange().getValues();
    const allBuilders = data.slice(1).map(row => row[0]).filter(name => name);
    
    const queryLower = query.toLowerCase();
    const matches = allBuilders.filter(builder => 
      builder.toLowerCase().includes(queryLower)
    );
    
    // Sort matches alphabetically (case-insensitive)
    matches.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, builders: matches, query: query}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function searchMerchants(query) {
  try {
    if (!query || query.trim() === '') {
      return getMerchants(); // Return all if no query
    }
    
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let merchantsSheet = getOrCreateSheet(spreadsheet, 'Merchants');
    
    const data = merchantsSheet.getDataRange().getValues();
    const allMerchants = data.slice(1).map(row => row[0]).filter(name => name);
    
    const queryLower = query.toLowerCase();
    const matches = allMerchants.filter(merchant => 
      merchant.toLowerCase().includes(queryLower)
    );
    
    // Sort matches alphabetically (case-insensitive)
    matches.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    
    return ContentService
      .createTextOutput(JSON.stringify({success: true, merchants: matches, query: query}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Helper function to get or create a sheet
function getOrCreateSheet(spreadsheet, sheetName) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    // Add headers
    if (sheetName === 'Builders') {
      sheet.getRange(1, 1, 1, 2).setValues([['Builder Name', 'Date Added']]);
    } else if (sheetName === 'Merchants') {
      sheet.getRange(1, 1, 1, 2).setValues([['Merchant Name', 'Date Added']]);
    }
  }
  return sheet;
}
```

3. **Save the script** (Ctrl+S or File > Save)
4. **Name your project** (e.g., "Seima Selection Recorder")

### Step 3: Deploy the Apps Script

1. **Click "Deploy" > "New deployment"**
2. **Choose type**: Select "Web app"
3. **Configuration**:
   - Description: "Seima Selection Recorder v1"
   - Execute as: "Me"
   - Who has access: "Anyone" (this is safe - your script only accepts POST data)
4. **Click "Deploy"**
5. **Authorize permissions** when prompted
6. **Copy the Web App URL** (it will look like: `https://script.google.com/macros/s/ABC123.../exec`)

### Step 4: Configure Your Seima Scanner App

1. **Open your browser console** on your Seima Scanner app
2. **Run this command** (replace YOUR_URL with the actual URL from step 3):

```javascript
// Configure the selection recorder
import('./js/selection-recorder.js').then(module => {
  module.selectionRecorder.configure('YOUR_GOOGLE_APPS_SCRIPT_URL_HERE');
  console.log('Selection recorder configured!');
});
```

**OR** add this to your `js/config.js` file:

```javascript
// Add to CONFIG object
SELECTION_RECORDING: {
  ENABLED: true,
  GOOGLE_SHEETS_URL: 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE'
}
```

### Step 5: Test the Setup

1. **Test the connection**:
```javascript
// In browser console (after page loads)
window.testSelectionRecorder().then(result => {
  console.log('Test result:', result);
});

// OR check status
window.getSelectionRecorderStatus();

// OR use direct import (if functions not available)
import('./js/selection-recorder-config.js').then(module => {
  module.testSelectionRecorder().then(result => {
    console.log('Test result:', result);
  });
});
```

2. **Make a test selection** in your app and send an email
3. **Check your Google Sheet** - you should see a new row with the selection data!

## 📊 Using Your Data

### Basic Reporting

Your Google Sheet now contains all selection data. You can:

1. **Sort by Staff Name** to see individual performance
2. **Filter by Date Range** to see weekly/monthly trends
3. **Use Pivot Tables** for advanced analysis
4. **Create Charts** for visual reporting

### Sample Pivot Table Setup

1. **Select all data** (Ctrl+A)
2. **Insert > Pivot Table**
3. **Suggested setup**:
   - Rows: Staff Name
   - Values: Total Products (SUM), Estimated Value (SUM)
   - Filters: Date (to filter by time period)

### Advanced Analysis

The "Products JSON" column contains detailed product information. You can:
- Export to Excel for advanced analysis
- Use Google Sheets functions to parse JSON data
- Create custom reports by product type or room

## 🔧 Troubleshooting

### Common Issues

1. **"Not configured" in console**: Make sure you've set the Google Apps Script URL
2. **No data appearing**: Check the Apps Script logs (View > Logs)
3. **Permission errors**: Ensure the Apps Script is deployed with "Anyone" access
4. **Test connection fails**: Verify the URL is correct and the script is deployed

### Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Check the Google Apps Script logs
3. Verify the Google Sheet has the correct column headers
4. Test with a simple selection first

## 🏗️ Builder/Merchant Management

The system now includes **server-side builder and merchant lists** with smart duplicate prevention:

### **Features:**
- ✅ **Centralized lists** - All users share the same builder/merchant lists
- ✅ **Real-time search** - As you type, it searches for existing entries
- ✅ **Duplicate prevention** - Shows existing matches before adding new entries
- ✅ **Auto-complete suggestions** - Click to select from existing entries

### **How It Works:**
1. **Empty by default** - Lists start empty and build up as you add entries
2. **Alphabetical ordering** - All lists are automatically sorted A-Z (case-insensitive)
3. **Smart search** - Type 2+ characters to see existing matches
4. **Exact match detection** - Shows when you've typed an exact existing match
5. **One-click selection** - Click suggestions to use existing entries
6. **Automatic sheets** - "Builders" and "Merchants" sheets are created automatically

### **Testing Commands:**
```javascript
// Test the builder/merchant service (if available globally)
// Note: These functions may need to be accessed via the service directly

// Access builder/merchant service
const service = window.builderMerchantService || 
  (await import('./js/builder-merchant-service.js')).builderMerchantService;

// Get builders
await service.getBuilders();

// Get merchants
await service.getMerchants();

// Search builders
await service.searchBuilders('query');

// Add builder
await service.addBuilder('Builder Name');

// Add merchant
await service.addMerchant('Merchant Name');
```

## 🎉 You're Done!

Your Seima Scanner will now automatically record every finalised selection with centralized builder/merchant management. You can access your data anytime in Google Sheets and create powerful reports to track performance across your showrooms!
