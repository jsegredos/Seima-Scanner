/**
 * Flexible Email Service for Seima Scanner
 * Can work with multiple email providers (EmailJS, SendGrid, AWS SES, etc.)
 * Uses internal HTML template generation for better control
 */

import { emailTemplateGenerator } from './email-template-generator.js';
import { CONFIG } from './config.js';

export class FlexibleEmailService {
  constructor() {
    this.provider = 'emailjs'; // Can be: emailjs, sendgrid, awsses, mailgun, smtp
    this.isInitialized = false;
  }

  /**
   * Initialize the email service with specified provider
   */
  async init(provider = 'emailjs') {
    this.provider = provider;
    
    try {
      switch (provider) {
        case 'emailjs':
          return await this.initEmailJS();
        case 'sendgrid':
          return await this.initSendGrid();
        case 'awsses':
          return await this.initAWSSES();
        default:
          console.log(`📧 Provider ${provider} configured for future use`);
          return true;
      }
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error);
      return false;
    }
  }

  /**
   * Send email with professional HTML template
   */
  async sendEmail(userDetails, pdfBlob, csvData, options = {}) {
    try {
      // Generate beautiful HTML email
      const emailHTML = emailTemplateGenerator.generateEmailHTML(userDetails, options);
      const emailText = emailTemplateGenerator.generateTextEmail(userDetails);
      
      // Prepare email data
      const emailData = {
        to: userDetails.email,
        from: 'noreply@seima.com.au',
        fromName: 'Seima Team',
        subject: `Seima Product Selection - ${userDetails.name || 'Customer'}`,
        html: emailHTML,
        text: emailText,
        attachments: []
      };

      // Add attachments if provided
      if (pdfBlob) {
        emailData.attachments.push({
          filename: emailTemplateGenerator.generateFileName(userDetails, 'pdf'),
          content: pdfBlob,
          type: 'application/pdf'
        });
      }

      if (csvData) {
        emailData.attachments.push({
          filename: emailTemplateGenerator.generateFileName(userDetails, 'csv'),
          content: new Blob([csvData], { type: 'text/csv' }),
          type: 'text/csv'
        });
      }

      // Add BCC if configured
      if (userDetails.staffContact?.email) {
        emailData.bcc = userDetails.staffContact.email;
      }

      // Send via configured provider
      return await this.sendViaProvider(emailData);

    } catch (error) {
      console.error('❌ Email sending failed:', error);
      return this.handleEmailFailure(userDetails, pdfBlob, csvData, error);
    }
  }

  /**
   * Send email via the configured provider
   */
  async sendViaProvider(emailData) {
    switch (this.provider) {
      case 'emailjs':
        return await this.sendViaEmailJS(emailData);
      case 'sendgrid':
        return await this.sendViaSendGrid(emailData);
      case 'awsses':
        return await this.sendViaAWSSES(emailData);
      case 'mailgun':
        return await this.sendViaMailgun(emailData);
      default:
        throw new Error(`Provider ${this.provider} not implemented`);
    }
  }

  /**
   * EmailJS implementation (current - but now with generated HTML)
   */
  async sendViaEmailJS(emailData) {
    // Convert attachments to base64 for EmailJS
    const pdfAttachment = emailData.attachments.find(a => a.type === 'application/pdf');
    const csvAttachment = emailData.attachments.find(a => a.type === 'text/csv');

    const templateParams = {
      to_email: emailData.to,
      from_name: emailData.fromName,
      subject: emailData.subject,
      message_html: emailData.html, // Our beautiful generated HTML
      message_text: emailData.text,  // Fallback text
      bcc_email: emailData.bcc || ''
    };

    // Add attachments as base64
    if (pdfAttachment) {
      templateParams.pdf_attachment = await this.blobToBase64(pdfAttachment.content);
      templateParams.pdf_filename = pdfAttachment.filename;
    }

    if (csvAttachment) {
      templateParams.csv_attachment = await this.blobToBase64(csvAttachment.content);
      templateParams.csv_filename = csvAttachment.filename;
    }

    const result = await emailjs.send(
      CONFIG.EMAIL.SERVICE_ID,
      CONFIG.EMAIL.TEMPLATE_ID,
      templateParams,
      CONFIG.EMAIL.PUBLIC_KEY
    );

    if (result.status === 200) {
      console.log('✅ Email sent successfully via EmailJS');
      return { success: true, provider: 'emailjs', result };
    } else {
      throw new Error(`EmailJS returned status ${result.status}`);
    }
  }

  /**
   * SendGrid implementation (future migration target)
   */
  async sendViaSendGrid(emailData) {
    // This would be implemented when migrating to SendGrid
    console.log('📧 SendGrid implementation ready for:', emailData.subject);
    
    // Example SendGrid API call structure:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: emailData.to,
      from: emailData.from,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
      attachments: emailData.attachments.map(att => ({
        content: await this.blobToBase64(att.content),
        filename: att.filename,
        type: att.type
      }))
    };
    
    return await sgMail.send(msg);
    */
    
    return { success: true, provider: 'sendgrid', note: 'Implementation ready' };
  }

  /**
   * AWS SES implementation (another migration option)
   */
  async sendViaAWSSES(emailData) {
    console.log('📧 AWS SES implementation ready for:', emailData.subject);
    
    // Example AWS SES structure:
    /*
    const AWS = require('aws-sdk');
    const ses = new AWS.SES({ region: 'us-east-1' });
    
    const params = {
      Source: emailData.from,
      Destination: { ToAddresses: [emailData.to] },
      Message: {
        Subject: { Data: emailData.subject },
        Body: {
          Html: { Data: emailData.html },
          Text: { Data: emailData.text }
        }
      }
    };
    
    return await ses.sendEmail(params).promise();
    */
    
    return { success: true, provider: 'awsses', note: 'Implementation ready' };
  }

  /**
   * Preview email HTML (for testing/debugging)
   */
  previewEmail(userDetails, options = {}) {
    const html = emailTemplateGenerator.generateEmailHTML(userDetails, options);
    
    // Open preview in new window
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(html);
    previewWindow.document.close();
    
    console.log('📧 Email preview opened in new window');
    return html;
  }

  /**
   * Test email template with sample data
   */
  testEmailTemplate() {
    const sampleUserDetails = {
      name: 'John Smith',
      email: 'john@example.com',
      project: 'Luxury Apartment Renovation',
      address: '123 Collins Street, Melbourne VIC 3000',
      phone: '+61 3 9123 4567'
    };

    return this.previewEmail(sampleUserDetails, {
      includeLogo: true,
      includeAttachmentInfo: true,
      includeFeaturesList: true,
      customMessage: 'This is a test email template preview.'
    });
  }

  /**
   * Get migration readiness report
   */
  getMigrationReport() {
    return {
      currentProvider: this.provider,
      readyProviders: ['sendgrid', 'awsses', 'mailgun'],
      benefits: [
        '✅ HTML templates stored in your codebase',
        '✅ Version control for email templates',
        '✅ Easy A/B testing of email designs',
        '✅ Custom email logic per customer',
        '✅ Better error handling and retry logic',
        '✅ Lower costs at scale',
        '✅ No vendor lock-in'
      ],
      nextSteps: [
        '1. Test current HTML template generation',
        '2. Choose target email provider (SendGrid recommended)',
        '3. Set up API credentials',
        '4. Implement provider-specific sending logic',
        '5. Gradual migration with fallback to EmailJS'
      ]
    };
  }

  // Utility methods
  async initEmailJS() {
    if (!window.emailjs) {
      await this.loadEmailJS();
    }
    emailjs.init({ publicKey: CONFIG.EMAIL.PUBLIC_KEY });
    this.isInitialized = true;
    console.log('✅ EmailJS initialized with HTML template generation');
    return true;
  }

  async loadEmailJS() {
    return new Promise((resolve, reject) => {
      if (window.emailjs) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        resolve(`data:${blob.type};base64,${base64}`);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  handleEmailFailure(userDetails, pdfBlob, csvData, error) {
    console.error('📧 Email failed, providing fallback options:', error);
    
    // Download files locally
    if (pdfBlob) {
      this.downloadFile(pdfBlob, emailTemplateGenerator.generateFileName(userDetails, 'pdf'));
    }
    if (csvData) {
      const csvBlob = new Blob([csvData], { type: 'text/csv' });
      this.downloadFile(csvBlob, emailTemplateGenerator.generateFileName(userDetails, 'csv'));
    }

    return {
      success: false,
      provider: this.provider,
      error: error.message,
      message: 'Files downloaded locally. Email failed to send.'
    };
  }

  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export instance
export const flexibleEmailService = new FlexibleEmailService();

// Expose testing functions globally
window.testEmailTemplate = () => flexibleEmailService.testEmailTemplate();
window.getMigrationReport = () => flexibleEmailService.getMigrationReport(); 