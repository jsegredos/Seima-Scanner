# Troubleshooting Guide

Comprehensive troubleshooting guide for common issues with the SEIMA Scanner application.

## 🚨 Quick Fixes

### Application Won't Load
1. **Refresh the page** (Ctrl+F5 or Cmd+Shift+R)
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Try a different browser**
4. **Check internet connection**
5. **Disable browser extensions**

### Email Not Sending
1. **Check internet connection**
2. **Verify email address format**
3. **Check spam folder**
4. **Try again after 5 minutes**
5. **Use smaller PDF file**

### Camera Not Working
1. **Allow camera permissions** when prompted
2. **Check if camera is in use** by another app
3. **Try refreshing the page**
4. **Switch to different camera** (front/back)
5. **Try different browser**

## 🔧 Common Issues

### 1. Application Loading Problems

#### Product Catalog Not Loading
**Symptoms:** Products not appearing, empty product list
**Causes:** Google Sheets access issues, network problems, CORS errors

**Solutions:**
1. **Google Sheets Access**
   - Verify Google Sheet is published correctly (File > Share > Publish to web)
   - Check CSV export URL in `js/config.js` (`CATALOG_URL`)
   - Ensure sheet is accessible without authentication
   - Test URL directly in browser

2. **Network Issues**
   - Check internet connection
   - Verify CORS headers on Google Sheets
   - Try different network
   - Check browser console for CORS errors

3. **Cache Issues**
   - Clear browser cache and localStorage
   - Check browser console for cache-related errors
   - Force reload (Ctrl+Shift+R or Cmd+Shift+R)

### 2. Product Selection Issues

#### Blank Screen on Load
**Symptoms:** Application shows blank white screen
**Causes:** JavaScript errors, browser compatibility, network issues

**Solutions:**
1. **Check Browser Console**
   - Press F12 to open Developer Tools
   - Look for error messages in Console tab
   - Common errors:
     ```
     Uncaught ReferenceError: CONFIG is not defined
     Failed to load resource: net::ERR_BLOCKED_BY_CLIENT
     ```

2. **Browser Compatibility**
   - Use supported browsers: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
   - Update browser to latest version
   - Disable ad blockers and privacy extensions

3. **Network Issues**
   - Check internet connection
   - Try different network (mobile hotspot)
   - Check if corporate firewall is blocking resources

#### Slow Loading
**Symptoms:** Application takes long time to load
**Causes:** Slow network, large CSV file, browser performance

**Solutions:**
1. **Network Optimization**
   - Check network speed
   - Use wired connection instead of WiFi
   - Close other applications using bandwidth

2. **Browser Performance**
   - Close unnecessary tabs
   - Restart browser
   - Clear browser cache and cookies
   - Disable unnecessary extensions

3. **Device Performance**
   - Close other applications
   - Restart device
   - Check available memory and storage

### 3. Email Functionality Issues

#### Email Not Sending
**Symptoms:** Email fails to send, error messages in console
**Causes:** EmailJS configuration, network issues, attachment size

**Solutions:**
1. **EmailJS Configuration**
   ```javascript
   // Check in browser console
   console.log(CONFIG.EMAIL);
   
   // Verify configuration
   PROVIDER: 'emailjs'
   PUBLIC_KEY: 'MHAEjvnc_xx8DIRCA'
   SERVICE_ID: 'service_rblizfg'
   TEMPLATE_ID: 'template_8st9fhk'
   FROM_EMAIL: 'noreply@seima.com.au'
   BCC_EMAIL: 'jsegredos@gmail.com'
   ```

2. **Network and Connectivity**
   - Check internet connection
   - Try different network
   - Verify EmailJS service status
   - Check browser's network requests in DevTools

3. **Attachment Issues**
   - Reduce PDF file size by using "Email Compatible" option
   - Check if CSV contains problematic characters
   - Try sending without attachments first

#### Email Received but No Attachments
**Symptoms:** Email arrives but PDF/CSV files missing
**Causes:** EmailJS variable attachments not configured, file size limits

**Solutions:**
1. **EmailJS Template Configuration**
   - Log into EmailJS dashboard
   - Go to email template settings
   - Enable "Variable Attachments"
   - Add parameters: `pdf_attachment`, `csv_attachment`

2. **File Size Limits**
   - EmailJS has 50MB total limit
   - Use "Email Compatible" PDF option
   - Check attachment sizes in console:
     ```javascript
     window.seimaDebug.getAttachmentSizes()
     ```

3. **Character Encoding Issues**
   - CSV files with special characters may fail
   - Check for null bytes or control characters
   - Use CSV sanitization feature

### 4. Barcode Scanner Problems

#### Camera Not Accessible
**Symptoms:** Camera permission denied, black screen
**Causes:** Browser permissions, camera in use, hardware issues

**Solutions:**
1. **Browser Permissions**
   - Click camera icon in address bar
   - Allow camera access
   - Refresh page after allowing

2. **Camera Hardware**
   - Ensure camera is not in use by other apps
   - Try different camera (front/back)
   - Test camera in other applications

3. **HTTPS Requirement**
   - Camera API requires HTTPS
   - Check if site is served over HTTPS
   - Use localhost for development

#### Barcode Not Scanning
**Symptoms:** Camera works but barcodes not recognised
**Causes:** Poor lighting, barcode quality, distance, iOS compatibility

**Solutions:**
1. **Scanning Conditions**
   - Ensure good lighting
   - Hold device 10-15cm from barcode
   - Keep barcode flat and unfolded
   - Try different angles

2. **Barcode Quality**
   - Ensure barcode is clear and undamaged
   - Try different barcode types (EAN-13, EAN-8, Code 128)
   - Check if barcode exists in product database (BARCODE field)
   - Verify barcode is mapped correctly in product catalog

3. **Scanner Settings**
   - Enable flash for better lighting
   - Try different camera if available (front/rear)
   - Use manual focus by tapping screen
   - On iOS: Ensure polyfills are loaded (check console for errors)

4. **iOS-Specific Issues**
   - Use Chrome browser on iOS for best compatibility
   - Ensure camera permissions are granted
   - Check browser console for polyfill loading errors
   - Try refreshing page if scanner doesn't initialize

### 5. PDF Generation Issues

#### PDF Not Generating
**Symptoms:** PDF generation fails, error messages
**Causes:** Missing data, memory issues, browser limitations

**Solutions:**
1. **Required Fields**
   - Ensure customer name is provided
   - Check that products are selected
   - Verify all required fields are filled

2. **Memory Issues**
   - Reduce number of products
   - Use "Email Compatible" option
   - Close other browser tabs
   - Try different browser

3. **Browser Limitations**
   - Some browsers have memory limits
   - Samsung Internet may have issues
   - Try Chrome or Firefox

#### PDF Missing Images
**Symptoms:** PDF generates but product images missing
**Causes:** Image loading errors, CORS issues, network problems

**Solutions:**
1. **Image Loading**
   - Check network connection
   - Verify image URLs in product data
   - Check browser console for image errors

2. **CORS Issues**
   - Images must be served from same domain or with CORS headers
   - Check image source configuration
   - Use local image copies if needed

### 6. Lead Tracking & Selection Recording Issues

#### Lead Wizard Not Working
**Symptoms:** Lead wizard doesn't appear, form validation fails
**Causes:** JavaScript errors, missing required fields

**Solutions:**
1. **Form Validation**
   - Ensure all required fields are filled (name, email, project name)
   - Check customer type is selected
   - Verify phone number format (leading zeros preserved)
   - Check browser console for validation errors

2. **Builder/Merchant Search**
   - Verify Google Sheets Apps Script URL is configured
   - Check network connection
   - Builder/merchant lists may be empty initially (populate as you add entries)
   - Try refreshing page if lists don't load

#### Selection Not Recording to Google Sheets
**Symptoms:** Email sends but selection not recorded
**Causes:** Google Sheets URL not configured, Apps Script errors

**Solutions:**
1. **Configuration Check**
   ```javascript
   // Check in browser console
   console.log(CONFIG.SELECTION_RECORDING);
   // Should show: ENABLED: true, GOOGLE_SHEETS_URL: 'https://...'
   ```

2. **Google Apps Script**
   - Verify Apps Script is deployed as web app
   - Check "Execute as: Me" and "Who has access: Anyone"
   - Review Apps Script execution logs
   - Test connection: `window.selectionRecorder.testConnection()`

3. **Network Issues**
   - Check internet connection
   - Verify CORS is handled in Apps Script
   - Check browser console for network errors

### 7. Product Database Issues

#### Products Not Loading
**Symptoms:** Product search returns no results, empty product list
**Causes:** Google Sheets access issues, parsing errors, network problems

**Solutions:**
1. **Google Sheets Validation**
   - Verify Google Sheet is published as CSV
   - Check `CATALOG_URL` in `js/config.js` is correct
   - Ensure sheet has required columns: OrderCode, Description
   - Verify BARCODE column exists for barcode scanning
   - Check sheet is accessible without authentication

2. **Network Issues**
   - Check internet connection
   - Verify Google Sheets URL is accessible
   - Check browser console for CORS or network errors
   - Try accessing catalog URL directly in browser

3. **Data Parsing**
   - Check browser console for parsing errors
   - Verify CSV structure matches expected format
   - Check for special characters causing parsing issues
   - Review cached data in localStorage (may need clearing)

#### Product Search Not Working
**Symptoms:** Search returns incorrect results or no results
**Causes:** Indexing issues, special characters, case sensitivity

**Solutions:**
1. **Search Configuration**
   - Check search is case-insensitive
   - Verify special character handling
   - Test with simple search terms

2. **Data Quality**
   - Check product descriptions for consistency
   - Verify product codes format
   - Remove special characters from search terms

### 8. File Import Problems

#### CSV/Excel Import Fails
**Symptoms:** File upload fails, error messages, products not found
**Causes:** File format issues, size limits, encoding problems, missing products

**Solutions:**
1. **File Format**
   - Use CSV or Excel (.xlsx) format
   - Check file encoding (UTF-8 recommended)
   - Verify file size is within limits (10MB max)
   - Ensure OrderCode column exists (required)

2. **Data Validation**
   - Check for required columns (OrderCode)
   - Verify product codes exist in catalog
   - Remove special characters from data
   - Products not in catalog will be added with placeholder information

3. **Import Mode**
   - **Append mode**: Adds products to existing selection (goes to "Blank" room)
   - **Override mode**: Replaces all selections (warning: clears everything)
   - Choose appropriate mode for your needs

4. **Browser Compatibility**
   - Try different browser
   - Check file API support
   - Use drag-and-drop instead of file picker
   - Ensure JavaScript is enabled

## 🔍 Diagnostic Tools

### Browser Console
Access browser console to check for errors:
- **Chrome/Edge**: F12 → Console tab
- **Firefox**: F12 → Console tab
- **Safari**: Cmd+Option+C

### Common Console Commands
```javascript
// Check application status
window.seimaDebug.getHealthStatus()

// Debug selected products
window.seimaApp.getSelectedProducts()

// Test email functionality
window.seimaDebug.testEmail()

// Check migration readiness (Microsoft Graph)
window.seimaDebug.getMigrationReadiness()

// Test selection recorder connection
window.selectionRecorder.testConnection()

// Check configuration
console.log(CONFIG)

// Get selection statistics
window.appService.getSelectionStats()

// Clear all data
localStorage.clear()
location.reload()
```

### Network Debugging
Check network requests in DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Check for failed requests (red entries)

### Storage Debugging
Check local storage:
1. Open DevTools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Check Local Storage entries
4. Clear storage if needed

## 🛠️ Advanced Troubleshooting

### Memory Issues
**Symptoms:** Application crashes, becomes unresponsive
**Solutions:**
1. **Browser Memory**
   - Close unnecessary tabs
   - Restart browser
   - Increase browser memory limits

2. **Device Memory**
   - Close other applications
   - Restart device
   - Check available RAM

### Performance Issues
**Symptoms:** Slow response times, laggy interface
**Solutions:**
1. **Browser Performance**
   - Update browser to latest version
   - Disable unnecessary extensions
   - Clear browser cache

2. **Device Performance**
   - Check CPU usage
   - Ensure sufficient storage space
   - Update device drivers

### Database Corruption
**Symptoms:** Inconsistent data, missing products
**Solutions:**
1. **Clear Cache**
   - Clear browser cache and cookies
   - Clear local storage
   - Reload application

2. **Data Refresh**
   - Update product database file
   - Verify CSV file integrity
   - Re-import product data

## 📱 Mobile-Specific Issues

### iOS Safari Issues
**Common Problems:**
- Camera permission dialog not appearing
- Barcode scanning not working
- PDF download problems
- Touch gesture conflicts

**Solutions:**
1. **Camera Issues**
   - Use Chrome browser on iOS for best compatibility
   - Ensure camera permissions are granted in browser settings
   - Try refreshing page if camera doesn't initialize
   - Check browser console for polyfill loading errors
   - Use landscape mode for better scanning

2. **Barcode Scanning**
   - iOS requires polyfills for BarcodeDetector API
   - Check console for "✅ Polyfill modules loaded" message
   - Try Chrome instead of Safari
   - Ensure good lighting and steady hand

3. **PDF Download**
   - Use "Share" button
   - Save to Files app
   - Email option works reliably
   - Use desktop version if needed

### Android Browser Issues
**Common Problems:**
- Samsung Internet compatibility
- Chrome version differences
- Memory limitations

**Solutions:**
1. **Browser Choice**
   - Use Chrome instead of Samsung Internet
   - Update browser to latest version
   - Try Firefox as alternative

2. **Memory Management**
   - Close background apps
   - Restart device
   - Use airplane mode test

## 🔒 Security-Related Issues

### Mixed Content Warnings
**Symptoms:** Browser shows security warnings
**Causes:** Loading HTTP resources on HTTPS page
**Solutions:**
1. Ensure all resources use HTTPS
2. Check image URLs in product data
3. Update CSP headers if needed

### CORS Errors
**Symptoms:** Network requests blocked by CORS policy
**Causes:** Cross-origin resource sharing restrictions
**Solutions:**
1. Serve all resources from same domain
2. Configure CORS headers on server
3. Use proxy for external resources

## 🚨 Emergency Procedures

### Application Completely Broken
1. **Clear all browser data**
   - Clear cache, cookies, and local storage
   - Disable all extensions
   - Try incognito/private mode

2. **Use different browser**
   - Try Chrome, Firefox, Safari, Edge
   - Use different device if available
   - Access from different network

3. **Contact support**
   - Provide browser and device information
   - Include screenshots of error messages
   - Describe steps that led to the issue

### Data Recovery
1. **Check local storage**
   - Use browser DevTools
   - Export data if possible
   - Save important selections

2. **Backup procedures**
   - Export selections as CSV
   - Save PDF reports
   - Document product configurations

## 📊 Performance Monitoring

### Key Metrics to Monitor
- **Page load time**
- **Memory usage**
- **Network requests**
- **Error rates**
- **User actions**

### Monitoring Tools
```javascript
// Performance monitoring
performance.mark('start-load');
// ... application code ...
performance.mark('end-load');
performance.measure('load-time', 'start-load', 'end-load');
console.log(performance.getEntriesByName('load-time'));
```

## 📞 Getting Help

### Self-Help Resources
1. **User Guide**: Complete application documentation
2. **Email Setup Guide**: EmailJS configuration help
3. **Console Commands**: Built-in debugging tools
4. **Browser DevTools**: Network and error debugging

### When to Contact Support
- **Persistent errors** that don't resolve with basic troubleshooting
- **Configuration issues** requiring administrative access
- **Data corruption** or loss
- **Security concerns**
- **Feature requests** or bug reports

### Information to Provide
When contacting support, include:
- **Browser version** and operating system
- **Error messages** (screenshots preferred)
- **Steps to reproduce** the issue
- **Network environment** (corporate, home, mobile)
- **Device information** (desktop, mobile, tablet)
- **Time when issue occurred**

### Contact Information
- **Email**: info@seima.com.au
- **Website**: www.seima.com.au
- **Documentation**: Refer to user guides and setup documentation

## 📋 Troubleshooting Checklist

### Before Contacting Support
- [ ] Tried refreshing the page
- [ ] Checked browser console for errors
- [ ] Tested in different browser
- [ ] Verified internet connection
- [ ] Cleared browser cache
- [ ] Disabled browser extensions
- [ ] Tried different device/network
- [ ] Checked known issues in documentation

### Information to Gather
- [ ] Browser version and OS
- [ ] Error messages (screenshots)
- [ ] Steps to reproduce
- [ ] Network environment
- [ ] Device specifications
- [ ] Time when issue occurred

---

*This troubleshooting guide covers most common issues. For persistent problems or additional support, refer to the user guides or contact the support team.* 