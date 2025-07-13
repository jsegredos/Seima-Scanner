/**
 * Email Template Generator for Seima Scanner
 * Generates professional HTML emails within the application
 * Makes it easy to migrate away from EmailJS to any email service
 */

import { CONFIG } from './config.js';

export class EmailTemplateGenerator {
  constructor() {
    this.brandColors = {
      primary: '#a09484',
      primaryDark: '#8b7a6e',
      background: '#f8f8fa',
      cardBackground: '#ffffff',
      textPrimary: '#222',
      textSecondary: '#4b5563',
      textMuted: '#6b7280',
      success: '#10b981',
      warning: '#f59e0b',
      border: '#e5e7eb'
    };
  }

  /**
   * Generate complete professional email HTML
   */
  generateEmailHTML(userDetails, options = {}) {
    const {
      includeLogo = true,
      includeAttachmentInfo = false,
      includeFeaturesList = false,
      customMessage = null,
      theme = 'default'
    } = options;

    const emailData = this.prepareEmailData(userDetails);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>SEIMA Product Selection - ${emailData.customerName}</title>
          ${this.generateEmailCSS(theme)}
      </head>
      <body>
          <div class="email-container">
              ${this.generateHeader(emailData, includeLogo)}
              ${this.generateContent(emailData, customMessage)}
              ${this.generateSummaryCard(emailData)}
              ${includeAttachmentInfo ? this.generateAttachmentsCard(emailData) : ''}
              ${includeFeaturesList ? this.generateFeaturesList() : ''}
              ${this.generateContactSection()}
              ${this.generateFooter(emailData)}
          </div>
      </body>
      </html>
    `;
  }

  /**
   * Prepare email data from user details
   */
  prepareEmailData(userDetails) {
    return {
      customerName: userDetails.name || 'Customer',
      customerEmail: userDetails.email || '',
      customerProject: userDetails.project || '',
      customerAddress: userDetails.address || '',
      customerPhone: userDetails.phone || '',
      totalProducts: this.getProductCount(),
      totalRooms: this.getRoomCount(),
      appVersion: CONFIG.VERSION || '1.7.0',
      currentDate: new Date().toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      pdfFilename: this.generateFileName(userDetails, 'pdf'),
      csvFilename: this.generateFileName(userDetails, 'csv')
    };
  }

  /**
   * Generate professional CSS for email
   */
  generateEmailCSS(theme = 'default') {
    return `
      <style>
          * { box-sizing: border-box; }
          body {
              font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              margin: 0;
              padding: 20px;
              background-color: ${this.brandColors.background};
              color: ${this.brandColors.textPrimary};
              line-height: 1.6;
          }
          .email-container {
              max-width: 600px;
              margin: 0 auto;
              background-color: ${this.brandColors.cardBackground};
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 4px 32px rgba(0,0,0,0.08);
          }
          .header {
              background: linear-gradient(135deg, ${this.brandColors.primary} 0%, ${this.brandColors.primaryDark} 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
              position: relative;
          }
          .header h1 {
              margin: 0 0 8px 0;
              font-size: 28px;
              font-weight: 600;
              letter-spacing: 0.5px;
          }
          .header .subtitle {
              margin: 0;
              font-size: 16px;
              opacity: 0.9;
              font-weight: 400;
          }
          .content {
              padding: 40px 30px;
          }
          .greeting {
              font-size: 18px;
              margin-bottom: 24px;
              color: #374151;
          }
          .intro-text {
              font-size: 16px;
              margin-bottom: 32px;
              color: ${this.brandColors.textSecondary};
          }
          .card {
              border-radius: 12px;
              padding: 24px;
              margin: 24px 0;
              box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          }
          .summary-card {
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border-left: 4px solid ${this.brandColors.primary};
          }
          .summary-title {
              margin: 0 0 20px 0;
              font-size: 20px;
              font-weight: 600;
              color: ${this.brandColors.primaryDark};
              display: flex;
              align-items: center;
          }
          .summary-title::before {
              content: '📋';
              margin-right: 8px;
          }
          .summary-table {
              display: table;
              width: 100%;
              border-collapse: separate;
              border-spacing: 0;
          }
          .summary-row {
              display: table-row;
              border-bottom: 1px solid ${this.brandColors.border};
          }
          .summary-row:last-child {
              border-bottom: none;
          }
          .summary-label {
              display: table-cell;
              font-weight: 600;
              color: #374151;
              padding: 10px 24px 10px 0;
              width: 40%;
              vertical-align: top;
          }
          .summary-value {
              display: table-cell;
              color: ${this.brandColors.textMuted};
              padding: 10px 0;
              width: 60%;
              vertical-align: top;
          }
          .attachments-card {
              background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
              border-left: 4px solid ${this.brandColors.success};
          }
          .attachments-title {
              margin: 0 0 16px 0;
              font-size: 18px;
              font-weight: 600;
              color: #065f46;
              display: flex;
              align-items: center;
          }
          .attachments-title::before {
              content: '📎';
              margin-right: 8px;
          }
          .attachment-item {
              display: flex;
              align-items: center;
              padding: 12px 0;
              border-bottom: 1px solid rgba(16, 185, 129, 0.1);
          }
          .attachment-item:last-child {
              border-bottom: none;
          }
          .attachment-icon {
              width: 24px;
              height: 24px;
              margin-right: 12px;
              font-size: 18px;
          }
          .attachment-details {
              flex: 1;
          }
          .attachment-name {
              font-weight: 600;
              color: #065f46;
              margin: 0;
          }
          .attachment-description {
              font-size: 14px;
              color: #047857;
              margin: 4px 0 0 0;
          }
          .features-list {
              background: ${this.brandColors.cardBackground};
              border: 1px solid ${this.brandColors.border};
              border-radius: 8px;
              padding: 20px;
              margin: 24px 0;
          }
          .features-list h4 {
              margin: 0 0 12px 0;
              color: #374151;
              font-weight: 600;
          }
          .features-list ul {
              margin: 0;
              padding-left: 20px;
              list-style: none;
          }
          .features-list li {
              margin-bottom: 8px;
              position: relative;
              padding-left: 24px;
              color: ${this.brandColors.textSecondary};
          }
          .features-list li::before {
              content: '✅';
              position: absolute;
              left: 0;
              top: 0;
          }
          .contact-section {
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border-radius: 8px;
              padding: 20px;
              margin: 24px 0;
              text-align: center;
          }
          .contact-title {
              margin: 0 0 12px 0;
              font-weight: 600;
              color: #92400e;
          }
          .contact-info {
              margin: 8px 0;
              color: #a16207;
          }
          .contact-link {
              color: ${this.brandColors.primary};
              text-decoration: none;
              font-weight: 600;
          }
          .footer {
              background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
              color: #ffffff;
              padding: 30px;
              text-align: center;
          }
          .footer-links {
              margin: 16px 0;
          }
          .footer-link {
              color: #ffffff;
              text-decoration: none;
              margin: 0 12px;
              font-weight: 500;
          }
          .footer-link:hover {
              color: #93c5fd;
              text-decoration: underline;
          }
          .footer-copyright {
              font-size: 14px;
              color: #ffffff;
              margin-top: 16px;
              border-top: 1px solid #4b5563;
              padding-top: 16px;
          }
          @media (max-width: 600px) {
              body { padding: 10px; }
              .header, .content, .footer {
                  padding: 20px 16px;
              }
              .summary-grid {
                  grid-template-columns: 1fr;
              }
              .header h1 {
                  font-size: 24px;
              }
          }
      </style>
    `;
  }

  /**
   * Generate email header
   */
  generateHeader(emailData, includeLogo = true) {
    return `
      <div class="header">
                        <h1>SEIMA Product Selection</h1>
      </div>
    `;
  }

  /**
   * Generate main content section
   */
  generateContent(emailData, customMessage = null) {
    const message = customMessage || `
      Thank you for choosing SEIMA for your project. We're pleased to provide your personalised product selection, 
      professionally formatted and ready for your review.
    `;

    return `
      <div class="content">
          <p class="greeting">Dear ${emailData.customerName},</p>
          <p class="intro-text">${message}</p>
      </div>
    `;
  }

  /**
   * Generate customer summary card
   */
  generateSummaryCard(emailData) {
    return `
      <div class="content">
          <div class="card summary-card">
              <h3 class="summary-title">Project Summary</h3>
              <div class="summary-table">
                  <div class="summary-row">
                      <span class="summary-label">Customer:</span>
                      <span class="summary-value">${emailData.customerName}</span>
                  </div>
                  <div class="summary-row">
                      <span class="summary-label">Email:</span>
                      <span class="summary-value">${emailData.customerEmail}</span>
                  </div>
                  <div class="summary-row">
                      <span class="summary-label">Project:</span>
                      <span class="summary-value">${emailData.customerProject || 'Not specified'}</span>
                  </div>
                  <div class="summary-row">
                      <span class="summary-label">Address:</span>
                      <span class="summary-value">${emailData.customerAddress || 'Not specified'}</span>
                  </div>
                  <div class="summary-row">
                      <span class="summary-label">Phone:</span>
                      <span class="summary-value">${emailData.customerPhone || 'Not provided'}</span>
                  </div>
                  <div class="summary-row">
                      <span class="summary-label">Total Products:</span>
                      <span class="summary-value">${emailData.totalProducts}</span>
                  </div>
                  <div class="summary-row">
                      <span class="summary-label">Rooms:</span>
                      <span class="summary-value">${emailData.totalRooms}</span>
                  </div>
                  <div class="summary-row">
                      <span class="summary-label">Generated:</span>
                      <span class="summary-value">${emailData.currentDate}</span>
                  </div>
              </div>
          </div>
      </div>
    `;
  }

  /**
   * Generate attachments card
   */
  generateAttachmentsCard(emailData) {
    return `
      <div class="content">
          <div class="card attachments-card">
              <h3 class="attachments-title">Attached Documents</h3>
              <div class="attachment-item">
                  <span class="attachment-icon">📄</span>
                  <div class="attachment-details">
                      <p class="attachment-name">${emailData.pdfFilename}</p>
                      <p class="attachment-description">Complete product selection with images, specifications, and pricing</p>
                  </div>
              </div>
              <div class="attachment-item">
                  <span class="attachment-icon">📊</span>
                  <div class="attachment-details">
                      <p class="attachment-name">${emailData.csvFilename}</p>
                      <p class="attachment-description">Structured data file for easy import into your systems</p>
                  </div>
              </div>
          </div>
      </div>
    `;
  }

  /**
   * Generate features list
   */
  generateFeaturesList() {
    return `
      <div class="content">
          <div class="features-list">
              <h4>Your selection includes:</h4>
              <ul>
                  <li>Professional product specifications and high-resolution images</li>
                  <li>Room-by-room organisation for easy project management</li>
                  <li>Current pricing information (where applicable)</li>
                  <li>Direct links to product datasheets and installation guides</li>
                  <li>Structured CSV data for seamless system integration</li>
              </ul>
          </div>
      </div>
    `;
  }

  /**
   * Generate contact section
   */
  generateContactSection() {
    return `
      <div class="content">
          <p style="margin-top: 32px; color: #6b7280;">
              This selection was generated using the SEIMA Product Scanner application. 
              If you have any questions or need to make changes to your selection, please don't hesitate to contact our team.
          </p>
          
          <p style="margin-top: 24px; color: #374151;">
              Best regards,<br>
              <strong>The SEIMA Team</strong>
          </p>
      </div>
    `;
  }

  /**
   * Generate footer
   */
  generateFooter(emailData) {
    return `
      <div class="footer">
          <div class="footer-links">
              <a href="https://www.seima.com.au" class="footer-link">Website</a>
              <a href="https://www.seima.com.au/products" class="footer-link">Products</a>
              <a href="https://www.seima.com.au/support" class="footer-link">Support</a>
              <a href="mailto:info@seima.com.au" class="footer-link">Contact</a>
          </div>
          <div class="footer-copyright">
              <p>© SEIMA. All rights reserved.</p>
          </div>
      </div>
    `;
  }

  /**
   * Generate simple text email for fallback
   */
  generateTextEmail(userDetails) {
    const emailData = this.prepareEmailData(userDetails);
    
    return `Dear ${emailData.customerName},

Thank you for choosing SEIMA for your project. Your product selection is attached.

PROJECT SUMMARY:
Customer: ${emailData.customerName}
Email: ${emailData.customerEmail}
Project: ${emailData.customerProject}
Address: ${emailData.customerAddress}
Phone: ${emailData.customerPhone}
Total Products: ${emailData.totalProducts}
Total Rooms: ${emailData.totalRooms}
Generated: ${emailData.currentDate}

ATTACHMENTS:
- ${emailData.pdfFilename} (Complete product selection)
- ${emailData.csvFilename} (Structured data file)

If you have any questions about these products, please contact us:
Email: info@seima.com.au
Website: www.seima.com.au

Best regards,
The Seima Team

© 2024 Seima | Generated by Seima Scanner v${emailData.appVersion}`;
  }

  // Utility methods (reuse from existing email service)
  getProductCount() {
    const selectedProducts = JSON.parse(localStorage.getItem('selectedProducts') || '[]');
    return selectedProducts.length;
  }

  getRoomCount() {
    const selectedProducts = JSON.parse(localStorage.getItem('selectedProducts') || '[]');
    const rooms = new Set(selectedProducts.map(item => item.room).filter(Boolean));
    return rooms.size || 1;
  }

  generateFileName(userDetails, extension) {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const projectName = (userDetails.project || 'seima-selection').replace(/[^a-zA-Z0-9\s]/g, '');
    
    return `${projectName}-${dd}${mm}${yy}.${hh}${min}.${extension}`;
  }
}

// Test function to verify the cleaned up email template
export function testCleanedUpTemplate() {
  console.log('🧪 Testing cleaned up email template...');
  
  const testUserDetails = {
    name: 'cleaned',
    email: 'jsegredos@gmail.com',
    project: 'cleaned',
    address: 'Seima Pty Ltd',
    phone: '0418486702'
  };
  
  try {
    const generator = new EmailTemplateGenerator();
    const htmlContent = generator.generateEmailHTML(testUserDetails);
    
    // Open in new window for preview
    const previewWindow = window.open('', '_blank', 'width=800,height=600');
    previewWindow.document.write(htmlContent);
    previewWindow.document.close();
    
    console.log('✅ Cleaned up email template preview opened in new window');
    console.log('🎨 Changes applied:');
    console.log('   • Header: Removed house icon and subtitle, changed to gold/brown background');
    console.log('   • Sections: Removed "Attached Documents" and "Your selection includes" sections');
    console.log('   • Footer: Removed top two lines');
    
    return true;
  } catch (error) {
    console.error('❌ Template test failed:', error);
    return false;
  }
}

// Make test function globally available
window.testCleanedUpTemplate = testCleanedUpTemplate;

// Export instance
export const emailTemplateGenerator = new EmailTemplateGenerator(); 