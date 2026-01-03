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

      // Priority 3: Product Name/Description match (flexible matching)
      const descMatches = catalog.filter(p => {
        // Get all possible text fields
        const desc = (p['Product Description'] || p.Description || '').toUpperCase().trim();
        const productName = (p['Product Name'] || p.productName || '').toUpperCase().trim();
        const longDesc = (p['Long Description'] || p.LongDescription || '').toUpperCase().trim();
        
        // Normalize both search text and product text (remove extra spaces, special chars)
        const normalizeForMatch = (str) => str.replace(/\s+/g, ' ').replace(/[^\w\s]/g, '').trim();
        const searchNormalized = normalizeForMatch(normalized);
        
        // Check exact match
        if (desc === normalized || productName === normalized) {
          return true;
        }
        
        // Check if search text contains product name or vice versa
        if (productName && (productName.includes(searchNormalized) || searchNormalized.includes(productName))) {
          return true;
        }
        
        // Check word-by-word matching (for "LIMNI 720" matching "LIMNI 720" or "LIMNI720")
        const searchWords = searchNormalized.split(/\s+/).filter(w => w.length > 2);
        if (searchWords.length > 0) {
          const productText = normalizeForMatch(productName || desc);
          // Check if all significant words from search are in product text
          const allWordsMatch = searchWords.every(word => productText.includes(word));
          if (allWordsMatch && searchWords.length >= 1) {
            return true;
          }
        }
        
        // Check partial match in description (first 50 chars)
        if (desc && (desc.includes(searchNormalized) || searchNormalized.includes(desc.substring(0, 50)))) {
          return true;
        }
        
        // Check long description
        if (longDesc && longDesc.includes(searchNormalized)) {
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

