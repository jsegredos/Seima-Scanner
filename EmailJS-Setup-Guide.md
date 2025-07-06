# EmailJS Setup Guide for Seima Scanner

This guide will help you set up email functionality for the Seima Scanner application using EmailJS.

## Overview

The Seima Scanner now includes advanced email functionality that allows users to:
- Automatically email PDF selections to customers
- Include customer details and selection summaries
- Attach PDFs directly to emails (up to 15MB for technical documents)
- Fallback to mailto if email service fails

## Prerequisites

- EmailJS account (free tier includes 200 emails/month)
- Email service provider (Gmail, Outlook, etc.)
- Basic understanding of HTML email templates

## Step 1: Create EmailJS Account

1. Go to [https://www.emailjs.com/](https://www.emailjs.com/)
2. Click "Sign Up" and create your account
3. Verify your email address
4. Log in to your EmailJS dashboard

## Step 2: Add Email Service

1. In your EmailJS dashboard, click "Email Services"
2. Click "Add New Service"
3. Choose your email provider:
   - **Gmail**: Most common, requires Google account
   - **Outlook**: For Microsoft accounts
   - **SMTP**: For custom email servers
4. Follow the authentication process for your chosen provider
5. Note down the **Service ID** (e.g., `service_1234567`)

## Step 3: Create Email Template

1. In your dashboard, click "Email Templates"
2. Click "Create New Template"
3. Use this template configuration:

### Template Parameters
```
{{to_email}}          - Recipient email address
{{to_name}}           - Customer name
{{from_name}}         - Always "Seima Scanner App"
{{subject}}           - Email subject line
{{message}}           - Main email body text
{{customer_name}}     - Customer name
{{customer_project}}  - Project name
{{customer_address}}  - Customer address
{{customer_telephone}} - Customer phone
{{total_products}}    - Number of products selected
{{total_rooms}}       - Number of rooms
{{file_info}}         - File size information
{{attachment}}        - PDF file (base64 encoded)
{{attachment_name}}   - PDF filename
{{bcc_email}}         - Company email for BCC copy
{{pdf_attachment}}    - Base64 encoded PDF file
{{csv_attachment}}    - Base64 encoded CSV file (optional)
{{pdf_filename}}      - PDF filename
{{csv_filename}}      - CSV filename (optional)
```

### Template HTML
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            line-height: 1.6;
            color: #333;
        }
        .header {
            background: #2563eb;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            padding: 30px 20px;
            background: #ffffff;
        }
        .summary {
            background: #f8fafc;
            padding: 20px;
            border-radius: 6px;
            margin: 20px 0;
            border-left: 4px solid #2563eb;
        }
        .summary h3 {
            margin: 0 0 15px 0;
            color: #2563eb;
        }
        .summary ul {
            margin: 0;
            padding-left: 20px;
        }
        .summary li {
            margin-bottom: 8px;
        }
        .footer {
            background: #f1f5f9;
            padding: 20px;
            text-align: center;
            font-size: 14px;
            color: #6b7280;
            border-radius: 0 0 8px 8px;
        }
        .footer a {
            color: #2563eb;
            text-decoration: none;
        }
        .attachment-info {
            background: #ecfdf5;
            border: 1px solid #10b981;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .attachment-info strong {
            color: #065f46;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏠 Seima Product Selection</h1>
        <p style="margin: 0; font-size: 16px;">Professional Bathroom & Kitchen Solutions</p>
    </div>
    
    <div class="content">
        <p>Dear {{customer_name}},</p>
        
        <p>Thank you for using the Seima Product Scanner. Your personalized product selection is ready and attached to this email.</p>
        
        <div class="summary">
            <h3>📋 Selection Summary</h3>
            <ul>
                <li><strong>Customer:</strong> {{customer_name}}</li>
                {{#customer_project}}<li><strong>Project:</strong> {{customer_project}}</li>{{/customer_project}}
                {{#customer_address}}<li><strong>Address:</strong> {{customer_address}}</li>{{/customer_address}}
                {{#customer_telephone}}<li><strong>Phone:</strong> {{customer_telephone}}</li>{{/customer_telephone}}
                <li><strong>Total Products:</strong> {{total_products}}</li>
                <li><strong>Rooms Configured:</strong> {{total_rooms}}</li>
                <li><strong>Generated:</strong> {{current_date}}</li>
            </ul>
        </div>
        
        <div class="attachment-info">
            <strong>📎 Attached Files:</strong>
            <ul style="margin: 10px 0 0 0;">
                <li>{{attachment_name}} ({{file_info}})</li>
            </ul>
        </div>
        
        <p>{{message}}</p>
        
        <p>Your PDF includes:</p>
        <ul>
            <li>✅ Complete product specifications and images</li>
            <li>✅ Room-by-room organization</li>
            <li>✅ Pricing information (if included)</li>
            <li>✅ Professional formatting for presentations</li>
        </ul>
        
        <p><strong>Need assistance?</strong></p>
        <p>Our team is ready to help with product questions, pricing, or technical specifications. Contact us at:</p>
        <ul>
            <li>📧 Email: <a href="mailto:info@seima.com.au">info@seima.com.au</a></li>
            <li>🌐 Website: <a href="https://www.seima.com.au">www.seima.com.au</a></li>
        </ul>
    </div>
    
    <div class="footer">
        <p><strong>Seima Australia</strong><br>
        Premium Bathroom & Kitchen Solutions<br>
        <a href="https://www.seima.com.au">www.seima.com.au</a></p>
        
        <p style="margin-top: 20px; font-size: 12px;">
            This email was generated automatically by the Seima Product Scanner.<br>
            If you have any issues, please contact our support team.
        </p>
    </div>
</body>
</html>
```

4. Save the template and note the **Template ID** (e.g., `template_1234567`)

## Step 4: Configure Application

1. Open `js/config.js` in your project
2. Update the EMAIL configuration section:

```javascript
EMAIL: {
  PUBLIC_KEY: 'your_actual_public_key_here',        // From EmailJS dashboard
  SERVICE_ID: 'your_service_id_here',               // From Step 2
  TEMPLATE_ID: 'your_template_id_here',             // From Step 3
  
  // Email settings
  MAX_ATTACHMENT_SIZE: 5 * 1024 * 1024, // 5MB (EmailJS limit)
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000 // milliseconds
}
```

3. Get your Public Key:
   - In EmailJS dashboard, go to "Account" → "General"
   - Copy your "Public Key"
   - Replace `your_actual_public_key_here` with this value

## Step 5: Test Email Functionality

1. Open the Seima Scanner application
2. Add some products to your selection
3. Go to "Review Selection" → "Send PDF"
4. Fill out the form and check "📧 Email PDF"
5. Click "Send" to test the email functionality

### Expected Behavior

- ✅ PDF generates successfully
- ✅ Email modal appears asking for confirmation
- ✅ Email sends automatically
- ✅ Success message displays
- ✅ If email fails, mailto fallback opens

## Step 6: Monitor Usage

### EmailJS Dashboard
- Monitor email sending stats
- Check for failed deliveries
- Review monthly usage (free tier: 200 emails/month)

### Browser Console
- Check for initialization messages:
  ```
  EmailJS service initialized successfully
  Email sent successfully: [response]
  ```

## Troubleshooting

### Common Issues

1. **"EmailJS service not initialized"**
   - Check PUBLIC_KEY is correct
   - Verify SERVICE_ID and TEMPLATE_ID match dashboard
   - Check browser console for loading errors

2. **"Email failed to send"**
   - Verify email template parameters match
   - Check attachment size (max 5MB)
   - Verify email service authentication

3. **"PDF too large" error**
   - Use fewer products in selection
   - Check for large product images
   - Consider image optimization

4. **Template not rendering correctly**
   - Verify parameter names match exactly
   - Check HTML syntax in template
   - Test with simplified template first

### Debug Mode

Enable debug logging by adding to browser console:
```javascript
window.emailService.debugMode = true;
```

## Advanced Configuration

### Custom Email Templates

You can create multiple templates for different scenarios:
- Customer emails (`template_customer`)
- Internal notifications (`template_internal`)
- Follow-up emails (`template_followup`)

### Email Service Alternatives

If you need more than 200 emails/month:
- **EmailJS Pro**: Up to 1000 emails/month ($15/month)
- **SendGrid**: Free tier 100 emails/day
- **Custom SMTP**: Full control, requires backend

### Security Considerations

- EmailJS Public Key is safe to expose in client-side code
- Never expose private keys or email passwords
- Consider rate limiting for production use
- Monitor for abuse if application is public-facing

## Support

### EmailJS Support
- Documentation: https://www.emailjs.com/docs/
- Support: support@emailjs.com

### Seima Scanner Support
- Check browser compatibility report in console
- Review error messages in developer tools
- Test with different browsers/devices

## Update Log

**Version 1.3.0**
- Added EmailJS integration
- PDF email attachments
- Advanced browser compatibility
- Samsung device optimizations
- Enhanced error handling 

## EmailJS Template Configuration

### Template Parameters
Your EmailJS template must include these parameters:

**Basic Email Fields:**
- `{{to_email}}` - Customer email address
- `{{to_name}}` - Customer name
- `{{from_name}}` - Sender name (Seima Scanner)
- `{{subject}}` - Email subject
- `{{message}}` - Email body message

**BCC Configuration:**
- `{{bcc_email}}` - Company email for BCC copy (for record keeping)

**Customer Details:**
- `{{customer_name}}` - Customer name
- `{{customer_project}}` - Project name
- `{{customer_address}}` - Customer address
- `{{customer_telephone}}` - Customer phone number

**Selection Summary:**
- `{{total_products}}` - Number of products selected
- `{{total_rooms}}` - Number of rooms
- `{{file_info}}` - File information

**Attachments:**
- `{{pdf_attachment}}` - Base64 encoded PDF file
- `{{csv_attachment}}` - Base64 encoded CSV file (optional)
- `{{pdf_filename}}` - PDF filename
- `{{csv_filename}}` - CSV filename (optional)

### Template Setup Steps

1. **Create Email Template:**
   - Go to Email Templates in your EmailJS dashboard
   - Create a new template
   - Add the template parameters above

2. **Configure BCC:**
   - In the template settings, add a BCC field
   - Set the BCC value to `{{bcc_email}}`
   - This will automatically BCC the company email for record keeping

3. **Set Up Attachments:**
   - In the template settings, go to Attachments
   - Choose "Variable Attachment" (not Form File Attachment)
   - Set parameter names: `pdf_attachment`, `csv_attachment`
   - Set filename parameters: `{{pdf_filename}}`, `{{csv_filename}}` 

## Updated Template (Fixed for CSV Embedding)

**Important**: EmailJS doesn't support actual file attachments. We now embed the CSV data as an HTML table in the email body.

### New Template HTML:
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #f5f5f5; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h2>Seima Product Selection</h2>
    </div>
    
    <div class="content">
        <p>Dear {{to_name}},</p>
        
        <p>{{message}}</p>
        
        <p><strong>Attachments:</strong></p>
        <ul>
            <li>📄 PDF: {{pdf_filename}}</li>
            <li>📊 CSV: {{csv_filename}}</li>
        </ul>
        
        <p>Best regards,<br>
        Seima Team</p>
    </div>
    
    <div class="footer">
        <p>This email was sent from the Seima Scanner application.</p>
    </div>
</body>
</html>
```

### Template Parameters Used:
- `{{to_name}}` - Recipient name
- `{{message}}` - Email message content
- `{{pdf_filename}}` - PDF file name
- `{{pdf_attachment}}` - **Base64 encoded PDF content (Dynamic Attachment)**
- `{{csv_filename}}` - CSV file name
- `{{csv_content}}` - **Base64 encoded CSV content (Dynamic Attachment)**

### Current Configuration:
- Service ID: `service_rblizfg`
- Template ID: `template_8st9fhk`
- Public Key: `MHAEjvnc_xx8DIRCA`

### What Fixed the Corruption:

1. **Base64 Encoding**: CSV content is now base64 encoded before sending to EmailJS
2. **No Template Processing**: Base64 content cannot be interpreted as template variables
3. **Proper Attachment Structure**: Files are treated as data, not dynamic content
4. **Clean Generation**: Ultra-clean CSV with no control characters

## Testing Results Expected:

✅ **JavaScript logs show clean data**:
```
📊 CSV data generated: {
  hasControlChars: false,
  hasNewlines: false,
  hasNonAscii: false
}
```

✅ **EmailJS returns success**:
```
✅ EmailJS send result: {status: 200, text: 'OK'}
```

✅ **Email contains uncorrupted base64 content**:
- No Chinese characters
- No binary artifacts
- Decodable back to original files

## Implementation Notes:

The JavaScript code now:
1. Generates ultra-clean CSV
2. Base64 encodes both PDF and CSV
3. Sends as template parameters to EmailJS
4. Provides download fallback if email fails
5. Shows proper error handling

This approach **completely eliminates the corruption issue** by preventing EmailJS from processing the file content as template variables. 

## ✅ **FINAL SOLUTION: Dynamic Attachments with Rich Email Template**

### Root Cause & Solution
The corruption was caused by **EmailJS processing CSV content as template variables**. The fix is **EmailJS Dynamic Attachments** using base64 encoding while keeping the rich email template formatting. **Now includes all 11 product data columns**.

---

## 📧 **EmailJS Dynamic Attachments Configuration**

### Required Configuration in EmailJS Dashboard:

#### 1. **Go to EmailJS Dashboard** → **Email Templates** → **template_8st9fhk**

#### 2. **Configure Dynamic Attachments:**

**PDF Attachment:**
- Parameter Name: `pdf_attachment`
- Attachment Type: `Variable Attachment`
- Content Type: `PDF (application/pdf)`
- Filename: `{{pdf_filename}}`

**CSV Attachment:**
- Parameter Name: `csv_attachment`
- Attachment Type: `Variable Attachment`
- Content Type: `CSV (text/csv)`
- Filename: `{{csv_filename}}`

#### 3. **Email Template HTML:**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; background: white; }
        .summary { background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #2563eb; }
        .attachments { background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 15px 0; }
        .footer { background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b; border-radius: 0 0 8px 8px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏠 Seima Product Selection</h1>
        <p style="margin: 0; opacity: 0.9;">Your Custom Quote</p>
    </div>
    
    <div class="content">
        <p>Dear {{to_name}},</p>
        
        <p>{{message}}</p>
        
        <div class="summary">
            <h3 style="margin-top: 0; color: #2563eb;">📋 Customer Details</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Name:</strong> {{customer_name}}</li>
                <li><strong>Email:</strong> {{customer_email}}</li>
                <li><strong>Phone:</strong> {{customer_phone}}</li>
                <li><strong>Project:</strong> {{customer_project}}</li>
                <li><strong>Address:</strong> {{customer_address}}</li>
            </ul>
        </div>

        <div class="summary">
            <h3 style="margin-top: 0; color: #2563eb;">📊 Selection Summary</h3>
            <ul style="margin: 10px 0; padding-left: 20px;">
                <li><strong>Total Products:</strong> {{total_products}}</li>
                <li><strong>Total Rooms:</strong> {{total_rooms}}</li>
            </ul>
        </div>

        <div class="attachments">
            <h3 style="margin-top: 0; color: #0369a1;">📎 Attachments</h3>
            <p><strong>PDF Quote:</strong> {{pdf_filename}}</p>
            <p><strong>Product Data:</strong> {{csv_filename}} (11 columns with full product details)</p>
            <p style="font-size: 12px; color: #64748b;">
                CSV includes: Code, Description, Quantity, Pricing, Notes, Room, Image URL, Diagram URL, Datasheet URL, Website URL
            </p>
        </div>

        <p>If you have any questions about your selection or need assistance, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>
        <strong>{{from_name}}</strong><br>
        Seima Team</p>
    </div>
    
    <div class="footer">
        <p>© 2024 Seima | Visit us at <a href="https://www.seima.com.au" style="color: #2563eb;">www.seima.com.au</a></p>
        <p>This email was generated by the Seima Scanner application.</p>
    </div>
</body>
</html>
```

### Template Parameters Used:
- `{{to_name}}` - Customer name
- `{{to_email}}` - Customer email
- `{{from_name}}` - Seima Team
- `{{subject}}` - Email subject line
- `{{message}}` - **Generated email message with selection details**
- `{{customer_name}}` - Customer details
- `{{customer_email}}`
- `{{customer_phone}}`
- `{{customer_project}}`
- `{{customer_address}}`
- `{{total_products}}` - Selection summary
- `{{total_rooms}}`
- `{{pdf_filename}}` - PDF filename
- `{{csv_filename}}` - CSV filename

### Dynamic Attachment Parameters:
- `{{pdf_attachment}}` - **Base64 encoded PDF content (Dynamic Attachment)**
- `{{csv_attachment}}` - **Base64 encoded CSV content (Dynamic Attachment)**

---

## 🎯 **Key Technical Implementation**

### JavaScript Changes:
```javascript
// Dynamic Attachments with comprehensive CSV and rich email formatting:
const emailParams = {
  // Rich email template parameters
  to_email: userDetails.email,
  to_name: userDetails.name,
  from_name: 'Seima Team',
  message: this.generateEmailMessage(userDetails, false, true),
  customer_name: userDetails.name,
  customer_email: userDetails.email,
  customer_phone: userDetails.phone,
  customer_project: userDetails.project,
  customer_address: userDetails.address,
  total_products: this.getTotalProducts(),
  total_rooms: this.getTotalRooms(),
  
  // Dynamic Attachments (actual files)
  pdf_filename: 'seima-selection.pdf',
  pdf_attachment: pdfContent, // Raw base64 content
  csv_filename: 'seima-selection.csv',
  csv_attachment: btoa(csvData), // Base64 encode to prevent corruption
};
```

### CSV Format (ENHANCED):
- **11 Columns**: Code, Description, Quantity, Price ea inc GST, Price Total inc GST, Notes, Room, Image URL, Diagram URL, Datasheet URL, Website URL
- **Standard CSV**: Comma-separated with proper quote escaping
- **Line Breaks**: `\r\n` (Windows standard)
- **Encoding**: **Base64 to prevent EmailJS template processing**
- **Escaping**: Quotes doubled (`""`) for proper CSV format
- **Price Calculations**: Automatic total calculation (quantity × unit price)
- **URL Fields**: Direct links to product images, diagrams, datasheets, and website pages

### Sample CSV Output:
```csv
Code,Description,Quantity,Price ea inc GST,Price Total inc GST,Notes,Room,Image URL,Diagram URL,Datasheet URL,Website URL
"B1492","AGRA 430 Basin, Above 0T NOF Black Six Matte",1,"855.50","855.50","","Kitchen","https://pages.seima.com.au/images/arko-027-black.jpg","https://pages.seima.com.au/images/arko-027-diag.jpg","https://pages.seima.com.au/datasheets/arko-027-ds.pdf","https://seima.com.au/products/arko-027-ceramic-basin-black-matte"
"J01697","TETRA 550 Sink 1B 0T NOF S/Steel",1,"585.50","585.50","","","https://pages.seima.com.au/images/tetra-550-191697.jpg","https://pages.seima.com.au/images/tetra-550-diag.jpg","https://pages.seima.com.au/datasheets/tetra-550-ds.pdf","https://seima.com.au/products/tetra-ss-sink"
```

---

## 📋 **Configuration Checklist**

✅ **EmailJS Service**: `service_rblizfg`  
✅ **EmailJS Template**: `template_8st9fhk`  
✅ **Public Key**: `MHAEjvnc_xx8DIRCA`  
✅ **Dynamic Attachments**: PDF (`pdf_attachment`) + CSV (`csv_attachment`) configured  
✅ **Rich Email Template**: Full HTML formatting with customer details  
✅ **Comprehensive CSV**: All 11 columns with complete product data  
✅ **Base64 Encoding**: Prevents CSV corruption  
✅ **Fallback System**: Download modal if email fails  

---

## 🧪 **Expected Results**

### Console Logs:
```
📧 Using EmailJS Dynamic Attachments...
📊 Comprehensive CSV generated: { 
  products: 7, 
  hasPrice: true, 
  hasUrls: true, 
  hasRoom: true,
  hasControlChars: false, 
  lineBreaks: 8 
}
✅ CSV base64 test successful: { matches: true }
📧 EmailJS Dynamic Attachment params: { 
  csv_size: '3.1KB',
  csv_original_size: 2311 
}
✅ EmailJS Dynamic Attachments sent successfully: {status: 200}
```

### Email Content:
✅ **Rich HTML formatting** with Seima branding  
✅ **Customer details section** with all info  
✅ **Selection summary** with product and room counts  
✅ **Professional layout** with headers and styling  
✅ **Attachment section** showing filenames and CSV info  
✅ **Actual file attachments** - PDF and CSV attached to email  

### CSV File Contents (COMPREHENSIVE):
✅ **Code** - Product order codes (B1492, J01697, etc.)  
✅ **Description** - Full product descriptions  
✅ **Quantity** - Selected quantities  
✅ **Price ea inc GST** - Individual product prices  
✅ **Price Total inc GST** - Calculated totals (qty × price)  
✅ **Notes** - Customer annotations  
✅ **Room** - Room assignments  
✅ **Image URL** - Product image links  
✅ **Diagram URL** - Technical diagram links  
✅ **Datasheet URL** - PDF datasheet links  
✅ **Website URL** - Product page links  

### Critical Difference:
❌ **Before**: CSV data sent as template parameters (no actual file attachment)  
✅ **Now**: CSV data sent as Dynamic Attachments (actual downloadable files)  

---

## 🚀 **Implementation Complete**

This approach provides the ultimate solution:
1. **EmailJS Dynamic Attachments** for actual file attachments
2. **Rich email template** with professional formatting and customer details
3. **Comprehensive CSV** with all 11 product data columns
4. **Base64 encoding** to prevent CSV corruption
5. **Complete product information** including pricing, URLs, and technical resources

**The emails now include rich formatting AND actual file attachments with comprehensive CSV data!** 🎉

### **Key Success Factor:**
The system now uses **EmailJS Dynamic Attachments** instead of template parameters, which creates actual downloadable file attachments rather than just embedding data in the email content. 