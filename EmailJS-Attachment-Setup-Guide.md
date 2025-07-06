# EmailJS Attachment Setup Guide

## Overview
EmailJS **does support file attachments**, but they must be properly configured in your email template **before** you can send attachment data. This guide will show you how to set up proper CSV and PDF attachments that will arrive as downloadable files (not corrupted).

## Important Discovery
The previous CSV corruption issue was caused by trying to send attachment data without first configuring the attachment settings in the EmailJS template. EmailJS requires attachments to be defined in the template configuration.

## Step-by-Step Setup Instructions

### 1. Access Your EmailJS Template

1. Go to your EmailJS Dashboard: https://dashboard.emailjs.com/
2. Navigate to **Email Templates**
3. Find and edit your existing template (or create a new one)

### 2. Configure Attachments Tab

1. Click on the **"Attachments"** tab in the template editor
2. You'll add **two dynamic attachments** - one for PDF and one for CSV

### 3. Add PDF Attachment

1. Click **"Add Attachment"**
2. Configure the PDF attachment:
   - **Attachment Type**: Select "Variable Attachment"
   - **Parameter Name**: `pdf_attachment`
   - **Filename**: `{{pdf_filename}}` (this will be dynamic)
   - **Content Type**: `application/pdf`

### 4. Add CSV Attachment

1. Click **"Add Attachment"** again
2. Configure the CSV attachment:
   - **Attachment Type**: Select "Variable Attachment"  
   - **Parameter Name**: `csv_attachment`
   - **Filename**: `{{csv_filename}}` (this will be dynamic)
   - **Content Type**: `text/csv`

### 5. Update Email Template Content

In the **Content** tab, update your email body to mention both attachments:

```html
<p>Dear {{customer_name}},</p>

<p>Thank you for using the Seima Product Scanner. Your product selection is attached as a PDF and CSV file.</p>

<p><strong>Selection Summary:</strong></p>
<ul>
  <li>Customer: {{customer_name}}</li>
  <li>Project: {{customer_project}}</li>
  <li>Total Products: {{total_products}}</li>
  <li>Rooms: {{total_rooms}}</li>
</ul>

<p><strong>Attachments:</strong></p>
<ul>
  <li>📄 PDF Report: {{pdf_filename}}</li>
  <li>📊 CSV Data: {{csv_filename}}</li>
</ul>

<p>If you have any questions about these products, please contact:</p>
<ul>
  <li>Email: info@seima.com.au</li>
  <li>Website: www.seima.com.au</li>
</ul>

<p>Best regards,<br>Seima Team</p>
```

### 6. Test Your Template

1. Use the **"Test It"** button in EmailJS
2. Provide test data for all template variables
3. For the attachment fields, use sample base64 data:
   - `pdf_attachment`: Any base64-encoded PDF content
   - `csv_attachment`: Any base64-encoded CSV content
   - `pdf_filename`: `test-document.pdf`
   - `csv_filename`: `test-data.csv`

## How the Updated Code Works

### Base64 Encoding
The updated `email-service.js` now properly:
1. Converts both PDF and CSV blobs to base64 format
2. Sends them as `pdf_attachment` and `csv_attachment` parameters
3. Includes proper filenames as `pdf_filename` and `csv_filename`

### Template Parameter Mapping
```javascript
// These parameters are sent to EmailJS:
{
  pdf_attachment: "JVBERi0xLjQKJcfs....", // base64 PDF data
  csv_attachment: "Q29kZSxEZXNjcmlwdGlvbi...", // base64 CSV data
  pdf_filename: "Project-060725-1548.pdf",
  csv_filename: "Project-060725-1548.csv",
  // ... other template variables
}
```

## File Size Limits

- **EmailJS Free Plan**: 50MB total email size
- **EmailJS Pro Plan**: 50MB total email size
- **Individual Attachment**: Should be under 10MB for best compatibility

## Expected Result

Once properly configured, recipients will receive:
- ✅ **PDF attachment**: Downloadable PDF file with all product details and images
- ✅ **CSV attachment**: Downloadable CSV file that opens correctly in Excel/Google Sheets
- ✅ **Clean email body**: Professional formatting with attachment references

## Troubleshooting

### If attachments still don't work:
1. **Check template configuration**: Ensure attachment parameter names match exactly
2. **Verify base64 encoding**: Check console logs for encoding errors
3. **Test file sizes**: Ensure attachments are under size limits
4. **Check EmailJS logs**: View sending history in your EmailJS dashboard

### Common Issues:
- **Parameter name mismatch**: `pdf_attachment` in template ≠ `pdfAttachment` in code
- **Missing attachment configuration**: Sending data without template setup
- **File size exceeded**: Attachments too large for EmailJS limits

## Alternative: Form File Attachments

If you prefer user-uploaded files, you can also use **Form File Attachments**:
1. Set **Attachment Type** to "Form File Attachment"
2. Set **Parameter Name** to match your form input name
3. Use `emailjs.sendForm()` instead of `emailjs.send()`

## Next Steps

1. **Update your EmailJS template** with the attachment configurations above
2. **Test the updated email service** with the new code
3. **Monitor EmailJS dashboard** for successful sends and any errors
4. **Check received emails** for proper attachment downloads

The CSV corruption issue should now be completely resolved! 🎉 