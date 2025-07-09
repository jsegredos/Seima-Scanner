// Configuration constants
export const CONFIG = {
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
  },
  
  SCANNER: {
    DEFAULT_ENGINE: 'zxing',
    ENGINES: ['zxing', 'quagga']
  },
  
  SEARCH: {
    MAX_RESULTS: 8,
    SEARCH_FIELDS: ['Description', 'ProductName', 'OrderCode', 'BARCODE']
  },
  
  CSV: {
    URL: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQw5X0aAe5yYbfqfTlgBIdNqnDIjs-YFhNh1IQ8lIB5RfjBl5VBRwQAMKIwlXz6L6oXI8ittrQD91Ob/pub?gid=114771048&single=true&output=csv'
  },
  
  STORAGE_KEYS: {
    CUSTOM_ROOMS: 'customRooms',
    SELECTED_PRODUCTS: 'selectedProducts',
    PRODUCT_CATALOG: 'productCatalog',
    USER_PREFERENCES: 'userPreferences',
    ROOM_ASSIGNMENTS: 'roomAssignments',
    STAFF_CONTACT: 'staffContactDetails'
  },
  
  UI: {
    ANNOTATION_MAX_LENGTH: 140,
    QUANTITY_OPTIONS: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  
  // CSV import configuration
  CSV_CONFIG: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ACCEPTED_TYPES: ['.csv', '.xlsx'],
    REQUIRED_COLUMNS: ['OrderCode'],
    OPTIONAL_COLUMNS: ['Description', 'RRP_INCGST', 'Image_URL', 'Room', 'Quantity', 'Notes']
  },
  
  // Product catalog API configuration
  CATALOG_URL: 'pricelist-latest.csv',
  
  // Version information
  VERSION: '1.7.1',
  
  // Performance settings
  PERFORMANCE: {
    MAX_PRODUCTS_PER_SESSION: 1000,
    IMAGE_CACHE_SIZE: 100,
    SCANNER_TIMEOUT: 30000,
    BARCODE_SCAN_INTERVAL: 100
  },

  // EmailJS Configuration
  // Note: These are your actual EmailJS credentials - configured and ready to use
  EMAIL: {
    PUBLIC_KEY: 'MHAEjvnc_xx8DIRCA',
    SERVICE_ID: 'service_rblizfg',
    TEMPLATE_ID: 'template_8st9fhk',
    
    // Email settings
    MAX_ATTACHMENT_SIZE: 15 * 1024 * 1024, // 15MB (for future email provider)
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 2000, // milliseconds
    
    // BCC for record keeping
    BCC_EMAIL: 'jsegredos@gmail.com' // Company email for BCC copy
  },
  
  // Browser Compatibility Settings
  COMPATIBILITY: {
    MIN_CHROME_VERSION: 80,
    MIN_FIREFOX_VERSION: 75,
    MIN_SAFARI_VERSION: 13,
    
    // Feature requirements
    REQUIRED_FEATURES: [
      'localStorage',
      'fileReader',
      'blob',
      'createObjectURL'
    ],
    
    // Performance thresholds
    MIN_COMPATIBILITY_SCORE: 70,
    MEMORY_WARNING_THRESHOLD: 0.8, // 80% of heap limit
    
    // Samsung-specific settings
    SAMSUNG_OPTIMIZATIONS: true,
    EXTENDED_TIMEOUTS_FOR_SAMSUNG: true
  },


};

// EmailJS Template Configuration
export const EMAIL_TEMPLATE_CONFIG = {
  // Template parameters that will be sent to EmailJS
  TEMPLATE_PARAMS: {
    // User info
    to_email: '{{USER_EMAIL}}',
    to_name: '{{USER_NAME}}',
    from_name: 'Seima Team',
    
    // Email content
    subject: 'Your Seima Product Selection',
    message: '{{EMAIL_MESSAGE}}',
    
    // Customer details
    customer_name: '{{CUSTOMER_NAME}}',
    customer_project: '{{CUSTOMER_PROJECT}}',
    customer_address: '{{CUSTOMER_ADDRESS}}',
    customer_telephone: '{{CUSTOMER_TELEPHONE}}',
    customer_email: '{{CUSTOMER_EMAIL}}',
    
    // Selection info
    total_products: '{{TOTAL_PRODUCTS}}',
    total_rooms: '{{TOTAL_ROOMS}}',
    file_info: '{{FILE_INFO}}',
    
    // Attachment
    pdf_attachment: '{{PDF_BASE64}}',
    pdf_filename: '{{PDF_FILENAME}}',
    csv_attachment: '{{CSV_BASE64}}',
    csv_filename: '{{CSV_FILENAME}}'
  },
  
  // Professional Email template HTML (for reference - actual template is created in EmailJS dashboard)
  HTML_TEMPLATE: `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Seima Product Selection</title>
      <style>
            * { box-sizing: border-box; }
            body {
                font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                margin: 0;
                padding: 0;
                background-color: #f8f8fa;
                color: #222;
                line-height: 1.6;
            }
            .email-container {
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 32px rgba(0,0,0,0.08);
            }
            .header {
                background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
                position: relative;
            }
            .header::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('https://raw.githubusercontent.com/your-repo/assets/seima-logo-white.png') center center no-repeat;
                background-size: 180px auto;
                opacity: 0.1;
            }
            .logo {
                width: 180px;
                height: auto;
                margin-bottom: 16px;
                filter: brightness(0) invert(1);
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
                color: #4b5563;
            }
            .summary-card {
                background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                border-left: 4px solid #2563eb;
                border-radius: 12px;
                padding: 24px;
                margin: 24px 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }
            .summary-title {
                margin: 0 0 20px 0;
                font-size: 20px;
                font-weight: 600;
                color: #1e40af;
                display: flex;
                align-items: center;
            }
            .summary-title::before {
                content: '📋';
                margin-right: 8px;
            }
            .summary-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 16px;
            }
            .summary-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e5e7eb;
            }
            .summary-item:last-child {
                border-bottom: none;
            }
            .summary-label {
                font-weight: 600;
                color: #374151;
            }
            .summary-value {
                color: #6b7280;
                text-align: right;
            }
            .attachments-card {
                background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
                border-left: 4px solid #10b981;
                border-radius: 12px;
                padding: 24px;
                margin: 24px 0;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
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
                background: #ffffff;
                border: 1px solid #e5e7eb;
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
                color: #4b5563;
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
                color: #2563eb;
                text-decoration: none;
                font-weight: 600;
            }
            .contact-link:hover {
                text-decoration: underline;
            }
            .footer {
                background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
                color: #e5e7eb;
                padding: 30px;
                text-align: center;
            }
            .footer-content {
                margin-bottom: 20px;
            }
            .footer-links {
                margin: 16px 0;
            }
            .footer-link {
                color: #93c5fd;
                text-decoration: none;
                margin: 0 12px;
                font-weight: 500;
            }
            .footer-link:hover {
                color: #dbeafe;
                text-decoration: underline;
            }
            .footer-copyright {
                font-size: 14px;
                opacity: 0.8;
                margin-top: 16px;
                border-top: 1px solid #4b5563;
                padding-top: 16px;
            }
            @media (max-width: 600px) {
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
    </head>
    <body>
        <div class="email-container">
      <div class="header">
                <h1>🏠 Seima Product Selection</h1>
                <p class="subtitle">Professional Bathroom & Kitchen Solutions</p>
      </div>
            
      <div class="content">
                <p class="greeting">Dear {{customer_name}},</p>
                
                <p class="intro-text">
                    Thank you for choosing Seima for your project. We're pleased to provide your personalized product selection, 
                    professionally formatted and ready for your review.
                </p>
                
                <div class="summary-card">
                    <h3 class="summary-title">Project Summary</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span class="summary-label">Customer:</span>
                            <span class="summary-value">{{customer_name}}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Email:</span>
                            <span class="summary-value">{{customer_email}}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Project:</span>
                            <span class="summary-value">{{customer_project}}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Address:</span>
                            <span class="summary-value">{{customer_address}}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Phone:</span>
                            <span class="summary-value">{{customer_telephone}}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Total Products:</span>
                            <span class="summary-value">{{total_products}}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Rooms:</span>
                            <span class="summary-value">{{total_rooms}}</span>
                        </div>
                    </div>
                </div>
                
                <div class="attachments-card">
                    <h3 class="attachments-title">Attached Documents</h3>
                    <div class="attachment-item">
                        <span class="attachment-icon">📄</span>
                        <div class="attachment-details">
                            <p class="attachment-name">{{pdf_filename}}</p>
                            <p class="attachment-description">Complete product selection with images, specifications, and pricing</p>
                        </div>
                    </div>
                    <div class="attachment-item">
                        <span class="attachment-icon">📊</span>
                        <div class="attachment-details">
                            <p class="attachment-name">{{csv_filename}}</p>
                            <p class="attachment-description">Structured data file for easy import into your systems</p>
                        </div>
                    </div>
                </div>
                
                <div class="features-list">
                    <h4>Your selection includes:</h4>
                    <ul>
                        <li>Professional product specifications and high-resolution images</li>
                        <li>Room-by-room organization for easy project management</li>
                        <li>Current pricing information (where applicable)</li>
                        <li>Direct links to product datasheets and installation guides</li>
                        <li>Structured CSV data for seamless system integration</li>
          </ul>
        </div>
        
                <div class="contact-section">
                    <h4 class="contact-title">Need Expert Assistance?</h4>
                    <p class="contact-info">Our technical team is ready to help with product specifications, installation guidance, or project consultation.</p>
                    <p class="contact-info">
                        📧 <a href="mailto:info@seima.com.au" class="contact-link">info@seima.com.au</a><br>
                        🌐 <a href="https://www.seima.com.au" class="contact-link">www.seima.com.au</a>
                    </p>
                </div>
                
                <p style="margin-top: 32px; color: #6b7280;">
                    This selection was generated using the Seima Product Scanner application. 
                    If you have any questions or need to make changes to your selection, please don't hesitate to contact our team.
                </p>
                
                <p style="margin-top: 24px; color: #374151;">
                    Best regards,<br>
                    <strong>The Seima Team</strong>
                </p>
      </div>
            
      <div class="footer">
                <div class="footer-content">
                    <p style="margin: 0 0 8px 0; font-weight: 600;">Seima - Professional Bathroom & Kitchen Solutions</p>
                    <p style="margin: 0; font-size: 14px;">Quality products, expert support, trusted by professionals</p>
                </div>
                <div class="footer-links">
                    <a href="https://www.seima.com.au" class="footer-link">Website</a>
                    <a href="https://www.seima.com.au/products" class="footer-link">Products</a>
                    <a href="https://www.seima.com.au/support" class="footer-link">Support</a>
                    <a href="mailto:info@seima.com.au" class="footer-link">Contact</a>
                </div>
                <div class="footer-copyright">
                    <p>© 2024 Seima. All rights reserved. | Generated by Seima Scanner v{{app_version}}</p>
                </div>
            </div>
      </div>
    </body>
    </html>
  `
}; 