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
      // Clean and normalize text
      let normalized = text.trim().toUpperCase();
      
      // Remove excessive whitespace
      normalized = normalized.replace(/\s+/g, ' ').trim();
      
      // Extract OrderCode from text (handle cases where OCR adds spaces: "19 12 34" -> "191234")
      const orderCodeInText = normalized.match(/19\s*\d\s*\d\s*\d\s*\d/);
      if (orderCodeInText) {
        normalized = orderCodeInText[0].replace(/\s/g, '');
      }

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

      // Priority 1: Partial OrderCode match (contains 19xxxx)
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

      // Normalize search text for matching
      const normalizeForMatch = (str) => str.replace(/\s+/g, ' ').replace(/[^\w\s]/g, '').trim();
      const searchNormalized = normalizeForMatch(normalized);

      // Priority 2: Product Name match
      const productNameMatches = catalog.filter(p => {
        const productName = (p['Product Name'] || p.productName || '').toUpperCase().trim();
        
        if (!productName) return false;
        
        const productNameNormalized = normalizeForMatch(productName);
        
        // Check exact match
        if (productName === normalized || productNameNormalized === searchNormalized) {
          return true;
        }
        
        // Check if search text contains product name or vice versa
        if (productName.includes(searchNormalized) || searchNormalized.includes(productName)) {
          return true;
        }
        
        // Check word-by-word matching (for "LIMNI 720" matching "LIMNI 720" or "LIMNI720")
        const searchWords = searchNormalized.split(/\s+/).filter(w => w.length > 2);
        if (searchWords.length > 0) {
          const allWordsMatch = searchWords.every(word => productNameNormalized.includes(word));
          if (allWordsMatch && searchWords.length >= 1) {
            return true;
          }
        }
        
        return false;
      });

      if (productNameMatches.length > 0) {
        productNameMatches.forEach(product => {
          matches.push({
            text,
            type: 'ProductName',
            confidence: 'medium',
            product
          });
        });
        continue;
      }

      // Priority 3: Description match
      const descMatches = catalog.filter(p => {
        const desc = (p['Product Description'] || p.Description || '').toUpperCase().trim();
        
        if (!desc) return false;
        
        const descNormalized = normalizeForMatch(desc);
        
        // Check exact match
        if (desc === normalized || descNormalized === searchNormalized) {
          return true;
        }
        
        // Check if search text contains description or vice versa
        if (desc.includes(searchNormalized) || searchNormalized.includes(desc)) {
          return true;
        }
        
        // Check word-by-word matching
        const searchWords = searchNormalized.split(/\s+/).filter(w => w.length > 2);
        if (searchWords.length > 0) {
          const allWordsMatch = searchWords.every(word => descNormalized.includes(word));
          if (allWordsMatch && searchWords.length >= 1) {
            return true;
          }
        }
        
        // Check partial match in description (first 50 chars)
        if (desc.includes(searchNormalized) || searchNormalized.includes(desc.substring(0, 50))) {
          return true;
        }
        
        return false;
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

