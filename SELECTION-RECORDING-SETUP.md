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
3. **Set up columns** in Row 1 (copy and paste this header row):

```
Timestamp	Date	Time	App Version	Staff Name	Staff Email	Staff Mobile	Customer Name	Customer Email	Customer Phone	Customer Project	Customer Address	Total Products	Total Quantity	Total Rooms	Rooms List	Estimated Value	Email Sent	PDF Generated	CSV Generated	PDF Size	Products JSON
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
    
    // Prepare row data in the correct order
    const rowData = [
      data.timestamp || '',
      data.date || '',
      data.time || '',
      data.appVersion || '',
      data.staffName || '',
      data.staffEmail || '',
      data.staffMobile || '',
      data.customerName || '',
      data.customerEmail || '',
      data.customerPhone || '',
      data.customerProject || '',
      data.customerAddress || '',
      data.totalProducts || 0,
      data.totalQuantity || 0,
      data.totalRooms || 0,
      data.roomsList || '',
      data.estimatedValue || '0.00',
      data.emailSent || false,
      data.pdfGenerated || false,
      data.csvGenerated || false,
      data.pdfSize || '',
      data.productsJson || ''
    ];
    
    // Add the row to the sheet
    sheet.appendRow(rowData);
    
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
  // Handle GET requests (for testing)
  return ContentService
    .createTextOutput('Seima Selection Recorder is running!')
    .setMimeType(ContentService.MimeType.TEXT);
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
// In browser console
import('./js/selection-recorder.js').then(module => {
  module.selectionRecorder.testConnection().then(result => {
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

## 🎉 You're Done!

Your Seima Scanner will now automatically record every finalised selection. You can access your data anytime in Google Sheets and create powerful reports to track performance across your showrooms!
