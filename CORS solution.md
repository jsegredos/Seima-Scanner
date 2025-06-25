# CORS Solution for Seima Product Selector

## What is the CORS Problem?

CORS (Cross-Origin Resource Sharing) is a browser security feature that restricts web pages from making requests to a different domain than the one that served the web page. This affects loading images, fonts, scripts, and especially using images in JavaScript (e.g., for PDF generation or canvas operations).

**In our case:**
- The Seima Product Selector web app (hosted on GitHub Pages or another domain) needs to load product images from `pages.seima.com.au`.
- If the image server does not send the correct CORS headers, browsers will block access to the image data for security reasons.
- This results in errors when generating PDFs or using images in JavaScript, even if the images display fine in `<img>` tags.

## How to Check CORS in a Browser

1. **Open Developer Tools**
   - Right-click the page and select **Inspect** (or press `F12`).
2. **Go to the Network Tab**
   - Click the **Network** tab.
3. **Reload the Page**
   - Press `F5` to reload and capture all requests.
4. **Find the Image Request**
   - Filter by "Img" or search for the image filename (e.g., `obello-370-diag.jpg`).
5. **Click the Image Request**
   - Select the image in the list.
6. **Check Response Headers**
   - In the right pane, under **Headers > Response Headers**, look for:
     - `Access-Control-Allow-Origin`
   - The value should be `*` (any origin) or your app's domain (e.g., `https://yourusername.github.io`).

**If this header is missing or set to a different domain, CORS is not enabled for your app.**

## What to Tell the Webmaster

To allow the Seima Product Selector app to use images from `pages.seima.com.au` for PDF generation and other features, the image server must send the following HTTP header with all image responses:

```
Access-Control-Allow-Origin: *
```

- For more security, you can use your app's domain instead of `*`:
  ```
  Access-Control-Allow-Origin: https://yourusername.github.io
  ```
- This header should be sent for all image file types (e.g., `.jpg`, `.png`, `.svg`).

### Example Configurations

**Apache (.htaccess):**
```apache
<FilesMatch "\.(jpg|jpeg|png|gif|webp|svg)$">
    Header set Access-Control-Allow-Origin "*"
</FilesMatch>
```

**Nginx:**
```nginx
location ~* \.(jpg|jpeg|png|gif|webp|svg)$ {
    add_header 'Access-Control-Allow-Origin' '*';
}
```

**AWS S3 (CORS Policy):**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

## After Making the Change
- Clear any CDN or server cache.
- Test by reloading an image URL in the browser and checking the response headers as described above.
- The header should appear in the response for all image requests.

---

**Summary:**
- CORS must be enabled on the image server for cross-origin PDF/image features to work.
- The key header is `Access-Control-Allow-Origin`.
- Without this, browsers will block access to image data for security reasons. 