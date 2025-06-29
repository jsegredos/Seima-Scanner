# CORS Solution for Seima Image Server

## Problem
- Product images are not appearing in PDF exports because the image server does not send the required CORS headers.
- Browsers allow <img> tags to display images from any domain, but JavaScript (and PDF libraries like jsPDF) require CORS headers to access image data.

## Temporary Workaround
- The app currently uses a CORS proxy (e.g., https://corsproxy.io/) to fetch images for PDF export.
- This is **not a permanent solution**: it adds latency, may have rate limits, and is not under our control.

## Permanent Solution (Web Admin Action Required)
1. **Enable CORS on the image server** (e.g., https://pages.seima.com.au/images/):
   - Add the following HTTP header to all image responses:
     ```
     Access-Control-Allow-Origin: *
     ```
   - Or, restrict to our app's domain if preferred:
     ```
     Access-Control-Allow-Origin: https://your-app-domain.com
     ```
2. **How to set this header:**
   - If using Apache: add to `.htaccess` or server config:
     ```
     Header set Access-Control-Allow-Origin "*"
     ```
   - If using Nginx:
     ```
     add_header 'Access-Control-Allow-Origin' '*';
     ```
   - If using a CDN, enable CORS in the CDN settings.

## Why This Is Needed
- Without this header, JavaScript cannot access image data for PDF export, even if images display in the app.
- This is a browser security restriction.

## Next Steps
- Please update the server configuration as soon as possible.
- Once CORS is enabled, we can remove the proxy workaround and images will load directly in the PDF export.

---

**Summary:**
- CORS must be enabled on the image server for cross-origin PDF/image features to work.
- The key header is `Access-Control-Allow-Origin`.
- Without this, browsers will block access to image data for security reasons. 