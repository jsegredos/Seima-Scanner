/**
 * OCR Product Matcher
 * Matches OCR-detected text against product catalog
 */

export class OCRProductMatcher {
  /**
   * Find products matching OCR-detected texts
   * @param {string[]} texts - Array of detected text strings
   * @param {Array} catalog - Product catalog array
   * @returns {Array} Array of match objects with product and confidence
   */
  static findProductsByOcrTexts(texts, catalog) {
    const matches = [];
    const orderCodeRegex = /^19\d{4}$/; // Exact 19xxxx format

    for (const text of texts) {
      let normalized = text.trim().toUpperCase();

      // Priority 1: Exact OrderCode match (19xxxx format)
      if (orderCodeRegex.test(normalized)) {
        const product = catalog.find(p => {
          const orderCode = (p.OrderCode || '').toString().trim().toUpperCase();
          return orderCode === normalized;
        });

        if (product) {
          matches.push({
            text,
            type: 'OrderCode',
            confidence: 'high',
            product
          });
          continue;
        }
      }

      // Priority 2: Partial OrderCode match (contains 19xxxx)
      const orderCodeMatch = normalized.match(/19\d{4}/);
      if (orderCodeMatch) {
        const code = orderCodeMatch[0];
        const product = catalog.find(p => {
          const orderCode = (p.OrderCode || '').toString().trim().toUpperCase();
          return orderCode === code;
        });

        if (product) {
          matches.push({
            text,
            type: 'OrderCode',
            confidence: 'medium',
            product
          });
          continue;
        }
      }

      // Priority 3: Partial Description match
      const descMatches = catalog.filter(p => {
        const desc = (p['Product Description'] || p.Description || p['Product Name'] || '').toUpperCase();
        const productName = (p['Product Name'] || '').toUpperCase();
        
        // Check if detected text is in description or product name
        return desc.includes(normalized) ||
               normalized.includes(desc.substring(0, 30)) ||
               productName.includes(normalized) ||
               normalized.includes(productName);
      });

      descMatches.forEach(product => {
        matches.push({
          text,
          type: 'Description',
          confidence: 'medium',
          product
        });
      });
    }

    // Deduplicate by OrderCode
    const unique = [];
    const seen = new Set();
    for (const m of matches) {
      const orderCode = (m.product.OrderCode || '').toString().trim();
      if (orderCode && !seen.has(orderCode)) {
        seen.add(orderCode);
        unique.push(m);
      }
    }

    // Sort by confidence (high first)
    unique.sort((a, b) => {
      const confidenceOrder = { high: 3, medium: 2, low: 1 };
      return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
    });

    return unique;
  }
}

