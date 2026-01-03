# Email Setup Guide

Complete guide for setting up email functionality in the SEIMA Scanner application, including EmailJS configuration and Microsoft Graph API migration.

## 🚀 Overview

The SEIMA Scanner application supports multiple email service providers:
- **EmailJS** (Currently implemented)
- **Microsoft Graph API** (Migration path)
- **Other providers** (Future expansion)

## 📧 EmailJS Setup (Current Implementation)

### 1. EmailJS Account Setup

1. **Create EmailJS Account**
   - Visit [emailjs.com](https://www.emailjs.com/)
   - Sign up for a free account
   - Verify your email address

2. **Create Email Service**
   - Go to Email Services tab
   - Click "Add New Service"
   - Choose your email provider (Gmail, Outlook, etc.)
   - Follow the authentication flow

3. **Create Email Template**
   - Go to Email Templates tab
   - Click "Create New Template"
   - Use your template ID (e.g., `template_xxxxxxx`)
   - Configure template variables (see below)

### 2. Template Configuration

The application uses specific template variables that must be configured in your EmailJS template:

```html
<!-- Email Template Variables -->
Subject: {{subject}}
From Name: {{from_name}}
To Email: {{to_email}}
Reply To: {{reply_to}}

<!-- Customer Information -->
Customer Name: {{customer_name}}
Customer Email: {{customer_email}}
Customer Project: {{customer_project}}
Customer Address: {{customer_address}}
Customer Phone: {{customer_phone}}

<!-- Message Content -->
Message: {{message}}
HTML Content: {{html_content}}

<!-- Attachments (Variable Attachments) -->
PDF Attachment: {{pdf_attachment}}
PDF Filename: {{pdf_filename}}
CSV Attachment: {{csv_attachment}}
CSV Filename: {{csv_filename}}
```

### 3. Variable Attachments Setup

**Critical**: EmailJS requires Variable Attachments to be enabled:

1. In your EmailJS template, go to **Settings**
2. Enable **Variable Attachments**
3. Add attachment parameters:
   - `pdf_attachment` - PDF file content (base64)
   - `pdf_filename` - PDF file name
   - `csv_attachment` - CSV file content (base64)
   - `csv_filename` - CSV file name

### 4. Application Configuration

Update the configuration in `js/config.js`:

```javascript
EMAIL: {
  PROVIDER: 'emailjs',
  PUBLIC_KEY: 'your_emailjs_public_key',    // Your EmailJS public key
  SERVICE_ID: 'your_service_id',             // Your EmailJS service ID
  TEMPLATE_ID: 'your_template_id',           // Your EmailJS template ID
  FROM_EMAIL: 'noreply@seima.com.au',   // From email address
  FROM_NAME: 'Seima Team',               // From name
  BCC_EMAIL: 'your_bcc_email@example.com',     // BCC email for record keeping
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000
}
```

**Note**: The current implementation uses `PUBLIC_KEY` instead of separate `USER_ID` and `API_KEY`. EmailJS v3 uses public keys for authentication.

### 5. Testing EmailJS Setup

Test the email functionality:

```javascript
// Open browser console and run:
window.seimaDebug.testEmail({
  name: 'Test User',
  email: 'test@example.com',
  project: 'Test Project',
  address: 'Test Address',
  phone: '1234567890',
  mobile: '1234567890'
});

// Or test with current selection:
const userDetails = {
  name: 'Test Customer',
  email: 'customer@example.com',
  project: 'Test Project',
  address: '123 Test St',
  phone: '0412 345 678',
  sendEmail: true,
  exportCsv: true
};
await window.appService.generateAndSendPDF(userDetails);
```

## 🔄 Microsoft Graph API Migration

### Why Migrate to Microsoft Graph API?

- **Enterprise Integration**: Better integration with Microsoft 365
- **Advanced Features**: Read receipts, scheduling, encryption
- **Higher Limits**: Better rate limits and attachment sizes
- **Authentication**: OAuth 2.0 with modern security
- **Compliance**: Better compliance and audit trails

### 1. Azure App Registration

1. **Azure Portal Setup**
   - Go to [Azure Portal](https://portal.azure.com)
   - Navigate to Azure Active Directory > App registrations
   - Click "New registration"

2. **App Configuration**
   ```
   Name: SEIMA Scanner Email Service
   Supported account types: Accounts in this organizational directory only
   Redirect URI: https://yourdomain.com/callback
   ```

3. **API Permissions**
   - Microsoft Graph > Application permissions
   - `Mail.Send` - Send email as application
   - `Mail.ReadWrite` - Read/write email
   - Grant admin consent

4. **Certificates & Secrets**
   - Create a new client secret
   - Save the secret value securely

### 2. Implementation Code

Create a new email service for Microsoft Graph:

```javascript
// js/email-service-msgraph.js
class MicrosoftGraphEmailService {
  constructor() {
    this.config = {
      clientId: 'your_client_id',
      clientSecret: 'your_client_secret',
      tenantId: 'your_tenant_id',
      scope: 'https://graph.microsoft.com/.default'
    };
    this.accessToken = null;
  }

  async authenticate() {
    const tokenUrl = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: this.config.scope,
        grant_type: 'client_credentials'
      })
    });

    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken;
  }

  async sendEmail(emailData) {
    if (!this.accessToken) {
      await this.authenticate();
    }

    const message = {
      message: {
        subject: emailData.subject,
        body: {
          contentType: 'HTML',
          content: emailData.html_content
        },
        toRecipients: [{
          emailAddress: {
            address: emailData.to_email,
            name: emailData.customer_name
          }
        }],
        attachments: []
      }
    };

    // Add PDF attachment
    if (emailData.pdf_attachment) {
      message.message.attachments.push({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: emailData.pdf_filename,
        contentType: 'application/pdf',
        contentBytes: emailData.pdf_attachment
      });
    }

    // Add CSV attachment
    if (emailData.csv_attachment) {
      message.message.attachments.push({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: emailData.csv_filename,
        contentType: 'text/csv',
        contentBytes: emailData.csv_attachment
      });
    }

    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    if (!response.ok) {
      throw new Error(`Microsoft Graph API error: ${response.status}`);
    }

    return { success: true, provider: 'Microsoft Graph API' };
  }
}
```

### 3. Configuration Update

Update `js/config.js` to support Microsoft Graph:

```javascript
EMAIL: {
  // Active provider
  PROVIDER: 'emailjs', // or 'microsoftGraph'
  
  // Current EmailJS config
  PUBLIC_KEY: 'your_emailjs_public_key',
  SERVICE_ID: 'your_service_id',
  TEMPLATE_ID: 'your_template_id',
  FROM_EMAIL: 'noreply@seima.com.au',
  FROM_NAME: 'Seima Team',
  BCC_EMAIL: 'your_bcc_email@example.com',
  
  // Microsoft Graph config (for future migration)
  MICROSOFT_CLIENT_ID: null, // To be configured
  MICROSOFT_TENANT_ID: null, // To be configured
  
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 2000
}
```

**Note**: The architecture is ready for Microsoft Graph migration. The `EmailService` class supports provider switching via `switchEmailProvider()` method.

### 4. Migration Steps

1. **Parallel Testing**
   - Keep EmailJS as primary
   - Test Microsoft Graph in parallel
   - Compare delivery success rates

2. **Gradual Migration**
   - Start with internal testing
   - Migrate specific user groups
   - Monitor performance and errors

3. **Full Migration**
   - Switch `CONFIG.EMAIL.PROVIDER` to `'microsoftGraph'`
   - Or use programmatic switching: `await window.appService.switchEmailProvider('microsoftGraph')`
   - Test thoroughly in production environment
   - Remove EmailJS dependencies (optional, can keep as fallback)
   - Update documentation

## 🔧 Advanced Configuration

### Email Template Customisation

The application uses `EmailTemplateGenerator` for consistent branding:

```javascript
// js/email-template-generator.js
const template = new EmailTemplateGenerator();
const htmlContent = template.generateEmailHTML(userDetails, {
  includeLogo: true,
  includeAttachmentInfo: false,
  includeFeaturesList: false,
  customMessage: 'Your custom message here'
});
```

### Character Sanitisation

The application includes comprehensive character sanitisation for email compatibility:

```javascript
// PDF Service includes CSV sanitisation for EmailJS compatibility
_sanitizeCSVForEmail(csvContent) {
  return csvContent
    .replace(/\0/g, '') // Remove null bytes
    .replace(/"/g, '"').replace(/"/g, '"') // Smart quotes to straight quotes
    .replace(/€/g, 'EUR') // Euro symbol
    .replace(/–/g, '-').replace(/—/g, '-') // En/em dashes to hyphens
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Control characters
}
```

This sanitisation ensures CSV attachments work reliably with EmailJS and prevents base64 encoding corruption issues.

### Error Handling

Both email services include comprehensive error handling:

```javascript
try {
  const result = await emailService.sendEmail(emailData);
  console.log('✅ Email sent successfully:', result);
} catch (error) {
  console.error('❌ Email sending failed:', error);
  // Fallback to alternative method
  await this.handleEmailError(error, emailData);
}
```

## 🧪 Testing

### EmailJS Testing

```javascript
// Test EmailJS configuration
window.seimaDebug.testEmail();

// Test with custom data
window.seimaDebug.testEmail({
  name: 'John Smith',
  email: 'john@example.com',
  project: 'Kitchen Renovation',
  address: '123 Main St, Sydney NSW 2000',
  phone: '0412 345 678'
});
```

### Microsoft Graph Testing

```javascript
// Test Microsoft Graph authentication
const msgraph = new MicrosoftGraphEmailService();
await msgraph.authenticate();

// Test email sending
await msgraph.sendEmail({
  subject: 'Test Email',
  to_email: 'test@example.com',
  html_content: '<h1>Test</h1>',
  customer_name: 'Test User'
});
```

## 🔍 Troubleshooting

### Common EmailJS Issues

1. **Template Not Found**
   - Check template ID in configuration
   - Verify template exists in EmailJS dashboard

2. **Authentication Errors**
   - Verify user ID and API key
   - Check service configuration

3. **Attachment Issues**
   - Ensure Variable Attachments are enabled
   - Check base64 encoding format
   - Verify file size limits

### Microsoft Graph Issues

1. **Authentication Failures**
   - Check client ID and secret
   - Verify tenant ID
   - Ensure proper permissions granted

2. **API Limits**
   - Monitor rate limits
   - Implement retry logic
   - Check throttling headers

## 📊 Monitoring

### Email Analytics

Track email sending success rates:

```javascript
// Email statistics
const stats = {
  sent: 0,
  failed: 0,
  retries: 0,
  avgResponseTime: 0
};

// Log email attempts
emailService.sendEmail(data)
  .then(() => stats.sent++)
  .catch(() => stats.failed++);
```

### Performance Monitoring

Monitor email performance:

```javascript
// Performance tracking
const startTime = Date.now();
await emailService.sendEmail(data);
const responseTime = Date.now() - startTime;
console.log(`Email sent in ${responseTime}ms`);
```

## 🔒 Security

### EmailJS Security

- Store API keys securely
- Use environment variables in production
- Implement rate limiting
- Validate all inputs

### Microsoft Graph Security

- Use OAuth 2.0 flow
- Implement token refresh
- Store credentials securely
- Monitor access logs

## 📝 Best Practices

1. **Error Handling**: Always implement fallback methods
2. **Rate Limiting**: Respect API limits
3. **Monitoring**: Track success rates and errors
4. **Security**: Secure API keys and credentials
5. **Testing**: Test thoroughly before deployment
6. **Documentation**: Keep configuration documented

## 🚀 Future Enhancements

- **Multiple Provider Support**: Support for SendGrid, AWS SES
- **Email Queuing**: Queue emails for retry
- **Template Management**: Dynamic template selection
- **Analytics**: Advanced email analytics
- **Webhooks**: Email delivery notifications

---

*For technical support with email configuration, contact the development team.* 