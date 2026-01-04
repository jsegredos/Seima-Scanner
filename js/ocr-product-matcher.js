/**
 * OCR Product Matcher
 * Matches OCR-detected text against product catalog with spatial grouping
 */

export class OCRProductMatcher {
  /**
   * Find products matching OCR-detected texts with spatial analysis
   * @param {Array} textData - Array of objects with {text, bbox, centerX, centerY, width, height}
   * @param {Array} catalog - Product catalog array
   * @returns {Array|Object} Array of match objects, or object with {families, selectedFamily} if multiple families detected
   */
  static findProductsByOcrTexts(textData, catalog) {
    // Handle legacy format (array of strings) for backward compatibility
    if (textData.length > 0 && typeof textData[0] === 'string') {
      const texts = textData;
      return this.findProductsByOcrTextsLegacy(texts, catalog);
    }

    // Extract texts and spatial data
    const texts = textData.map(item => item.text);
    const imageWidth = textData[0]?.width || 640;
    const imageHeight = textData[0]?.height || 480;
    
    // Define center region (middle 60% of image)
    const centerLeft = imageWidth * 0.2;
    const centerRight = imageWidth * 0.8;
    const centerTop = imageHeight * 0.2;
    const centerBottom = imageHeight * 0.8;

    // First, find all matches with spatial data
    const allMatches = [];
    const orderCodeRegex = /^19\d{4}$/;

    for (let i = 0; i < textData.length; i++) {
      const item = textData[i];
      const text = item.text;
      
      // Clean and normalize text
      let normalized = text.trim().toUpperCase();
      normalized = normalized.replace(/\s+/g, ' ').trim();
      
      // Extract OrderCode from text
      const orderCodeInText = normalized.match(/19\s*\d\s*\d\s*\d\s*\d/);
      if (orderCodeInText) {
        normalized = orderCodeInText[0].replace(/\s/g, '');
      }

      // Check if in center region
      const isInCenter = item.centerX >= centerLeft && item.centerX <= centerRight &&
                         item.centerY >= centerTop && item.centerY <= centerBottom;
      const centerScore = isInCenter ? 1.0 : 0.3; // Higher weight for center region

      // Priority 1: Exact OrderCode match
      if (orderCodeRegex.test(normalized)) {
        const product = catalog.find(p => {
          const orderCode = (p.OrderCode || '').toString().trim().toUpperCase();
          return orderCode === normalized;
        });

        if (product) {
          allMatches.push({
            text,
            type: 'OrderCode',
            confidence: 'high',
            product,
            centerX: item.centerX,
            centerY: item.centerY,
            centerScore: centerScore
          });
          continue;
        }
      }

      // Priority 1: Partial OrderCode match
      const orderCodeMatch = normalized.match(/19\d{4}/);
      if (orderCodeMatch) {
        const code = orderCodeMatch[0];
        const product = catalog.find(p => {
          const orderCode = (p.OrderCode || '').toString().trim().toUpperCase();
          return orderCode === code;
        });

        if (product) {
          allMatches.push({
            text,
            type: 'OrderCode',
            confidence: 'medium',
            product,
            centerX: item.centerX,
            centerY: item.centerY,
            centerScore: centerScore
          });
          continue;
        }
      }

      // Priority 2: Product Name match
      const normalizeForMatch = (str) => str.replace(/\s+/g, ' ').replace(/[^\w\s]/g, '').trim();
      const searchNormalized = normalizeForMatch(normalized);

      const productNameMatches = catalog.filter(p => {
        const productName = (p['Product Name'] || p.productName || '').toUpperCase().trim();
        if (!productName) return false;
        
        const productNameNormalized = normalizeForMatch(productName);
        
        if (productName === normalized || productNameNormalized === searchNormalized) {
          return true;
        }
        
        if (productName.includes(searchNormalized) || searchNormalized.includes(productName)) {
          return true;
        }
        
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
          allMatches.push({
            text,
            type: 'ProductName',
            confidence: 'medium',
            product,
            centerX: item.centerX,
            centerY: item.centerY,
            centerScore: centerScore
          });
        });
        continue;
      }

      // Priority 3: Description match
      const descMatches = catalog.filter(p => {
        const desc = (p['Product Description'] || p.Description || '').toUpperCase().trim();
        if (!desc) return false;
        
        const descNormalized = normalizeForMatch(desc);
        
        if (desc === normalized || descNormalized === searchNormalized) {
          return true;
        }
        
        if (desc.includes(searchNormalized) || searchNormalized.includes(desc)) {
          return true;
        }
        
        const searchWords = searchNormalized.split(/\s+/).filter(w => w.length > 2);
        if (searchWords.length > 0) {
          const allWordsMatch = searchWords.every(word => descNormalized.includes(word));
          if (allWordsMatch && searchWords.length >= 1) {
            return true;
          }
        }
        
        if (desc.includes(searchNormalized) || searchNormalized.includes(desc.substring(0, 50))) {
          return true;
        }
        
        return false;
      });

      descMatches.forEach(product => {
        allMatches.push({
          text,
          type: 'Description',
          confidence: 'medium',
          product,
          centerX: item.centerX,
          centerY: item.centerY,
          centerScore: centerScore
        });
      });
    }

    // Deduplicate by OrderCode
    const unique = [];
    const seen = new Set();
    for (const m of allMatches) {
      const orderCode = (m.product.OrderCode || '').toString().trim();
      if (orderCode && !seen.has(orderCode)) {
        seen.add(orderCode);
        unique.push(m);
      }
    }

    // Group by product family (extract base product name)
    const families = this.groupByProductFamily(unique);
    
    // If only one family or one family clearly dominates center, return it
    if (families.length === 1) {
      return families[0].matches;
    }

    // Score families by center proximity and frequency
    const scoredFamilies = families.map(family => {
      const centerMatches = family.matches.filter(m => m.centerScore >= 0.7);
      const centerScore = centerMatches.length / Math.max(family.matches.length, 1);
      const frequencyScore = family.matches.length / unique.length;
      const totalScore = (centerScore * 0.7) + (frequencyScore * 0.3);
      
      return {
        ...family,
        centerScore: centerScore,
        frequencyScore: frequencyScore,
        totalScore: totalScore
      };
    });

    // Sort by total score
    scoredFamilies.sort((a, b) => b.totalScore - a.totalScore);

    // If top family has significantly higher score (>70% dominance), auto-select it
    if (scoredFamilies.length > 1 && scoredFamilies[0].totalScore > 0.7) {
      console.log('🎯 Auto-selecting dominant product family:', scoredFamilies[0].familyName);
      return scoredFamilies[0].matches;
    }

    // Multiple families detected - return them for user selection
    console.log('🔀 Multiple product families detected:', scoredFamilies.map(f => f.familyName));
    return {
      families: scoredFamilies,
      requiresSelection: true
    };
  }

  /**
   * Group matches by product family (base product name)
   * @param {Array} matches - Array of match objects
   * @returns {Array} Array of family objects with {familyName, matches}
   */
  static groupByProductFamily(matches) {
    const familyMap = new Map();

    for (const match of matches) {
      const product = match.product;
      const productName = (product['Product Name'] || product.productName || product.Description || '').toUpperCase().trim();
      
      // Extract base product name (e.g., "AURORA 530" from "AURORA 530 BASIN ABOVE 0T NOF WHITE GLOSS")
      // Look for pattern: WORD + NUMBER (e.g., "AURORA 530", "MODIA FM", "SYROS 401")
      const baseNameMatch = productName.match(/^([A-Z]+(?:\s+[A-Z]+)?)\s*(\d+)/);
      let familyName = productName;
      
      if (baseNameMatch) {
        familyName = `${baseNameMatch[1]} ${baseNameMatch[2]}`.trim();
      } else {
        // Fallback: use first two significant words
        const words = productName.split(/\s+/).filter(w => w.length > 2);
        if (words.length >= 2) {
          familyName = `${words[0]} ${words[1]}`;
        } else if (words.length === 1) {
          familyName = words[0];
        }
      }

      if (!familyMap.has(familyName)) {
        familyMap.set(familyName, []);
      }
      familyMap.get(familyName).push(match);
    }

    return Array.from(familyMap.entries()).map(([familyName, matches]) => ({
      familyName,
      matches: matches.sort((a, b) => {
        // Sort by confidence first, then center score
        const confidenceOrder = { high: 3, medium: 2, low: 1 };
        if (confidenceOrder[b.confidence] !== confidenceOrder[a.confidence]) {
          return confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
        }
        return b.centerScore - a.centerScore;
      })
    }));
  }

  /**
   * Legacy method for backward compatibility (handles array of strings)
   * @param {string[]} texts - Array of detected text strings
   * @param {Array} catalog - Product catalog array
   * @returns {Array} Array of match objects with product and confidence
   */
  static findProductsByOcrTextsLegacy(texts, catalog) {
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

