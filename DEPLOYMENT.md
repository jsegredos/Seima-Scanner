# Deployment Guide

Complete guide for deploying and setting up the SEIMA Scanner application in various environments.

## 🚀 Overview

This guide covers deployment options for the SEIMA Scanner application:
- Development environment setup
- Production deployment
- Server configuration
- Security considerations
- Monitoring and maintenance

## 🛠️ Prerequisites

### System Requirements

- **Web Server**: Apache, Nginx, or IIS
- **SSL Certificate**: Required for camera access and security
- **Domain**: Registered domain name recommended
- **Email Service**: EmailJS account (Microsoft Graph API migration-ready)
- **Google Sheets**: Google account for product catalog and selection recording
- **Google Apps Script**: For selection recording and builder/merchant management

### Development Tools

- **Git**: For version control
- **Text Editor**: VS Code, Sublime Text, or similar
- **Web Browser**: Chrome/Firefox with developer tools
- **Terminal**: Command line access

## 📁 File Structure

Ensure your deployment includes all necessary files:

```
SEIMA-Scanner/
├── index.html              # Main entry point
├── style.css               # Global styles
├── app.js                  # Browser compatibility (legacy)
├── version.txt             # Version tracking and changelog
├── js/                     # JavaScript modules
│   ├── app-service.js     # Main service coordinator
│   ├── data-service.js    # Product catalog management
│   ├── email-service.js   # Email functionality
│   ├── pdf-service.js     # PDF/CSV generation
│   ├── selection-recorder.js # Google Sheets integration
│   ├── lead-tracker.js    # Lead tracking
│   └── ...                # Other modules
├── screens/               # HTML screens
├── assets/                # Images and resources
├── server.py              # Python dev server
├── server.js              # Node.js dev server
└── README.md              # Documentation
```

## 🔧 Development Environment

### Local Development

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/seima-scanner.git
   cd seima-scanner
   ```

2. **Python Server** (Recommended)
   ```bash
   # Python 3.x
   python -m http.server 8000
   
   # Python 2.x
   python -m SimpleHTTPServer 8000
   ```

3. **Node.js Server** (Alternative)
   ```bash
   node server.js
   ```

4. **Access Application**
   - Open browser to `http://localhost:8000`
   - Application should load immediately

### Development Configuration

Update `js/config.js` for development:

```javascript
// Development configuration
export const CONFIG = {
  // EmailJS settings
  EMAIL: {
    PROVIDER: 'emailjs',
    PUBLIC_KEY: 'your_dev_public_key',
    SERVICE_ID: 'your_dev_service_id',
    TEMPLATE_ID: 'your_dev_template_id',
    FROM_EMAIL: 'noreply@seima.com.au',
    FROM_NAME: 'Seima Team',
    BCC_EMAIL: 'your_dev_email@example.com'
  },
  
  // Product catalog (Google Sheets)
  CATALOG_URL: 'https://docs.google.com/spreadsheets/d/e/.../pub?gid=0&single=true&output=csv',
  
  // Selection recording (Google Sheets Apps Script)
  SELECTION_RECORDING: {
    ENABLED: true,
    GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/.../exec'
  }
};
```

## 🌐 Production Deployment

### Apache HTTP Server

1. **Install Apache**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install apache2
   
   # CentOS/RHEL
   sudo yum install httpd
   ```

2. **Configure Virtual Host**
   ```apache
   # /etc/apache2/sites-available/seima-scanner.conf
   <VirtualHost *:80>
       ServerName seima-scanner.yourdomain.com
       DocumentRoot /var/www/seima-scanner
       
       # Redirect to HTTPS
       RewriteEngine On
       RewriteCond %{HTTPS} off
       RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
   </VirtualHost>
   
   <VirtualHost *:443>
       ServerName seima-scanner.yourdomain.com
       DocumentRoot /var/www/seima-scanner
       
       # SSL Configuration
       SSLEngine on
       SSLCertificateFile /path/to/certificate.crt
       SSLCertificateKeyFile /path/to/private.key
       
       # Security Headers
       Header always set X-Frame-Options DENY
       Header always set X-Content-Type-Options nosniff
       Header always set X-XSS-Protection "1; mode=block"
       Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
       
       # Compression
       LoadModule deflate_module modules/mod_deflate.so
       <Location />
           SetOutputFilter DEFLATE
           SetEnvIfNoCase Request_URI "\.(?:gif|jpe?g|png)$" no-gzip dont-vary
       </Location>
   </VirtualHost>
   ```

3. **Enable Site**
   ```bash
   sudo a2ensite seima-scanner.conf
   sudo a2enmod rewrite ssl headers deflate
   sudo systemctl reload apache2
   ```

### Nginx Configuration

1. **Install Nginx**
   ```bash
   # Ubuntu/Debian
   sudo apt install nginx
   
   # CentOS/RHEL
   sudo yum install nginx
   ```

2. **Configure Server Block**
   ```nginx
   # /etc/nginx/sites-available/seima-scanner
   server {
       listen 80;
       server_name seima-scanner.yourdomain.com;
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name seima-scanner.yourdomain.com;
       
       root /var/www/seima-scanner;
       index index.html;
       
       # SSL Configuration
       ssl_certificate /path/to/certificate.crt;
       ssl_certificate_key /path/to/private.key;
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
       
       # Security Headers
       add_header X-Frame-Options DENY;
       add_header X-Content-Type-Options nosniff;
       add_header X-XSS-Protection "1; mode=block";
       add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
       
       # Compression
       gzip on;
       gzip_types text/plain text/css application/javascript application/json;
       gzip_min_length 1000;
       
       # Static file caching
       location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }
       
       # Main application
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

3. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/seima-scanner /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## 🔐 SSL Certificate Setup

### Let's Encrypt (Free)

1. **Install Certbot**
   ```bash
   # Ubuntu/Debian
   sudo apt install certbot python3-certbot-apache
   
   # CentOS/RHEL
   sudo yum install certbot python3-certbot-apache
   ```

2. **Generate Certificate**
   ```bash
   sudo certbot --apache -d seima-scanner.yourdomain.com
   ```

3. **Auto-renewal**
   ```bash
   sudo crontab -e
   # Add line:
   0 12 * * * /usr/bin/certbot renew --quiet
   ```

### Commercial Certificate

1. **Generate CSR**
   ```bash
   openssl req -new -newkey rsa:2048 -nodes -keyout private.key -out certificate.csr
   ```

2. **Install Certificate**
   - Upload CSR to certificate authority
   - Download signed certificate
   - Install certificate and key on server

## 🔄 Production Configuration

### Update Configuration

Update `js/config.js` for production:

```javascript
// Production configuration
export const CONFIG = {
  // EmailJS settings
  EMAIL: {
    PROVIDER: 'emailjs',
    PUBLIC_KEY: 'your_prod_public_key',
    SERVICE_ID: 'your_prod_service_id',
    TEMPLATE_ID: 'your_prod_template_id',
    FROM_EMAIL: 'noreply@seima.com.au',
    FROM_NAME: 'Seima Team',
    BCC_EMAIL: 'your_prod_bcc_email@example.com',
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 2000
  },
  
  // Product catalog (Google Sheets - production URL)
  CATALOG_URL: 'https://docs.google.com/spreadsheets/d/e/.../pub?gid=0&single=true&output=csv',
  
  // Selection recording (Google Sheets Apps Script - production URL)
  SELECTION_RECORDING: {
    ENABLED: true,
    GOOGLE_SHEETS_URL: 'https://script.google.com/macros/s/.../exec',
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
  }
};
```

### Google Sheets Setup

1. **Product Catalog**
   - Create Google Sheet with product data
   - Publish as CSV (File > Share > Publish to web > CSV format)
   - Copy the published URL to `CONFIG.CATALOG_URL`

2. **Selection Recording**
   - Follow instructions in `SELECTION-RECORDING-SETUP.md`
   - Deploy Google Apps Script
   - Copy web app URL to `CONFIG.SELECTION_RECORDING.GOOGLE_SHEETS_URL`

### Environment Variables

For sensitive configuration, consider using environment variables (requires build process):

```bash
# .env file (not committed to git)
EMAILJS_PUBLIC_KEY=your_public_key
EMAILJS_SERVICE_ID=your_service_id
EMAILJS_TEMPLATE_ID=your_template_id
GOOGLE_SHEETS_URL=https://script.google.com/macros/s/.../exec
```

Note: Current implementation uses direct configuration in `js/config.js`. For production, consider implementing a build process to inject environment variables.

## 🔒 Security Configuration

### Content Security Policy

Add CSP headers to prevent XSS attacks:

```html
<!-- In index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' cdn.emailjs.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  connect-src 'self' api.emailjs.com;
  font-src 'self';
  media-src 'self';
">
```

### HTTP Security Headers

Configure security headers in web server:

```apache
# Apache
Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.emailjs.com"
Header always set X-Frame-Options DENY
Header always set X-Content-Type-Options nosniff
Header always set X-XSS-Protection "1; mode=block"
Header always set Referrer-Policy "strict-origin-when-cross-origin"
```

### Access Control

Restrict access to sensitive files:

```apache
# Apache
<Files "*.csv">
    Require all denied
</Files>

<Files "server.py">
    Require all denied
</Files>

<Files "server.js">
    Require all denied
</Files>
```

## 📊 Monitoring and Logging

### Access Logs

Monitor application usage:

```bash
# Apache logs
tail -f /var/log/apache2/access.log

# Nginx logs
tail -f /var/log/nginx/access.log
```

### Error Monitoring

Set up error logging:

```bash
# Apache error log
tail -f /var/log/apache2/error.log

# Nginx error log
tail -f /var/log/nginx/error.log
```

### Application Monitoring

Monitor application performance:

```javascript
// Add to js/app.js
window.addEventListener('error', (event) => {
  // Log client-side errors
  fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error.toString()
    })
  });
});
```

## 🔄 Backup and Recovery

### Regular Backups

Create backup scripts:

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/seima-scanner"
APP_DIR="/var/www/seima-scanner"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz $APP_DIR

# Backup database (if using)
# mysqldump -u user -p database > $BACKUP_DIR/db_$DATE.sql

# Clean old backups (keep 30 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

### Recovery Procedures

Document recovery steps:

1. **Stop web server**
2. **Restore application files**
3. **Restore database (if applicable)**
4. **Update configuration**
5. **Test functionality**
6. **Start web server**

## 🔧 Maintenance

### Regular Updates

1. **Application Updates**
   ```bash
   cd /var/www/seima-scanner
   git pull origin main
   sudo systemctl reload apache2
   ```

2. **Product Catalog Updates**
   - Update Google Sheet with new products
   - Changes automatically reflected (cached for performance)
   - Application checks for updates in background
   - Cache invalidation on changes triggers reload
   - Validate CSV format in Google Sheets
   - Test product search functionality after updates

3. **Security Updates**
   - Update web server software
   - Renew SSL certificates
   - Update dependencies

### Performance Optimization

1. **File Compression**
   - Enable gzip compression
   - Minimize CSS and JavaScript
   - Optimize images

2. **Caching**
   - Set appropriate cache headers
   - Use browser caching
   - Implement CDN if needed

3. **Data Optimization**
   - Optimize Google Sheet structure
   - Keep product catalog columns consistent
   - Regular performance monitoring
   - Monitor selection recording performance
   - Review builder/merchant list growth

## 🧪 Testing

### Pre-deployment Testing

1. **Functionality Testing**
   - Test all major features
   - Verify email functionality
   - Test barcode scanning
   - Check PDF generation

2. **Performance Testing**
   - Load testing with multiple users
   - Memory usage monitoring
   - Response time measurement

3. **Security Testing**
   - Vulnerability scanning
   - SSL certificate validation
   - Security header verification

### Post-deployment Validation

1. **Smoke Tests**
   - Application loads correctly
   - Main features work
   - Email sending functional

2. **Integration Tests**
   - EmailJS integration
   - PDF generation
   - File uploads

## 📋 Deployment Checklist

### Pre-deployment

- [ ] Code tested in development environment
- [ ] Configuration updated for production
- [ ] SSL certificate obtained and installed
- [ ] Web server configured
- [ ] Security headers implemented
- [ ] Backup procedures in place

### Deployment

- [ ] Files uploaded to server
- [ ] Permissions set correctly
- [ ] Web server restarted
- [ ] DNS configured
- [ ] SSL certificate verified

### Post-deployment

- [ ] Application accessible via HTTPS
- [ ] All features functional
- [ ] Email sending working
- [ ] Performance acceptable
- [ ] Monitoring in place
- [ ] Team notified of deployment

## 🚨 Troubleshooting

### Common Issues

1. **Application Not Loading**
   - Check file permissions
   - Verify web server configuration
   - Check DNS settings

2. **Email Not Working**
   - Verify EmailJS configuration
   - Check API keys
   - Test email service

3. **SSL Certificate Issues**
   - Verify certificate installation
   - Check certificate expiry
   - Test SSL configuration

### Emergency Procedures

1. **Rollback Process**
   - Switch to previous version
   - Restore from backup
   - Update DNS if needed

2. **Incident Response**
   - Identify issue
   - Implement temporary fix
   - Communicate with stakeholders
   - Plan permanent solution

---

*This deployment guide ensures successful setup and maintenance of the SEIMA Scanner application in production environments.* 