/**
 * OCR Product Matcher
 * Matches OCR-detected text against product catalog with spatial grouping
 * Uses CatalogIndex for O(1) lookups and fuzzy matching for OCR errors
 */

import { catalogIndex } from './catalog-index.js';

export class OCRProductMatcher {
  /**
   * Ensure catalog index is built for O(1) lookups
   * @param {Array} catalog - Product catalog array
   */
  static ensureIndexBuilt(catalog) {
    if (!catalogIndex.isReady() || catalogIndex.getCatalog() !== catalog) {
      catalogIndex.build(catalog);
    }
  }

  /**
   * Find products matching OCR-detected texts with spatial analysis
   * Uses indexed O(1) lookups and fuzzy matching for OCR errors
   * @param {Array} textData - Array of objects with {text, bbox, centerX, centerY, width, height}
   * @param {Array} catalog - Product catalog array
   * @returns {Array|Object} Array of match objects, or object with {families, selectedFamily} if multiple families detected
   */
  static findProductsByOcrTexts(textData, catalog) {
    console.log('🔍 findProductsByOcrTexts called with', textData.length, 'items');
    console.log('🔍 First item type:', textData.length > 0 ? typeof textData[0] : 'empty');
    console.log('🔍 First item sample:', textData.length > 0 ? (typeof textData[0] === 'string' ? textData[0].substring(0, 50) : JSON.stringify(textData[0]).substring(0, 100)) : 'N/A');

    // Ensure catalog index is built for O(1) lookups
    this.ensureIndexBuilt(catalog);

    // Handle legacy format (array of strings) for backward compatibility
    if (textData.length > 0 && typeof textData[0] === 'string') {
      console.log('⚠️  Using legacy format (array of strings)');
      const texts = textData;
      return this.findProductsByOcrTextsLegacy(texts, catalog);
    }

    console.log('✅ Using new format (array of objects with spatial data)');

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

      console.log(`🔎 Processing OCR text [${i+1}/${textData.length}]: "${text}"`);

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

      // Priority 1: Exact OrderCode match (O(1) indexed lookup)
      if (orderCodeRegex.test(normalized)) {
        const product = catalogIndex.getByOrderCode(normalized);

        if (product) {
          console.log(`✅ OrderCode match: "${text}" → ${product.OrderCode} (${(product['Product Name'] || product.Description || '').substring(0, 40)})`);
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
        } else {
          // Try fuzzy matching for OCR errors (1 character tolerance)
          const fuzzyResult = catalogIndex.fuzzyMatchOrderCode(normalized, 1);
          if (fuzzyResult) {
            console.log(`✅ Fuzzy OrderCode match: "${text}" → ${fuzzyResult.product.OrderCode} (distance: ${fuzzyResult.distance})`);
            allMatches.push({
              text,
              type: 'OrderCode',
              confidence: fuzzyResult.distance === 0 ? 'high' : 'medium',
              product: fuzzyResult.product,
              centerX: item.centerX,
              centerY: item.centerY,
              centerScore: centerScore,
              fuzzyMatch: fuzzyResult.distance > 0
            });
            continue;
          }
          console.log(`❌ OrderCode "${normalized}" not found in catalog (even with fuzzy matching)`);
        }
      }

      // Priority 1b: Partial OrderCode match (O(1) indexed lookup)
      const orderCodeMatch = normalized.match(/19\d{4}/);
      if (orderCodeMatch) {
        const code = orderCodeMatch[0];
        let product = catalogIndex.getByOrderCode(code);

        if (product) {
          console.log(`✅ Partial OrderCode match: "${text}" → ${code} (${(product['Product Name'] || product.Description || '').substring(0, 40)})`);
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

        // Try fuzzy match on partial code
        const fuzzyResult = catalogIndex.fuzzyMatchOrderCode(code, 1);
        if (fuzzyResult) {
          console.log(`✅ Fuzzy partial match: "${text}" → ${fuzzyResult.product.OrderCode} (distance: ${fuzzyResult.distance})`);
          allMatches.push({
            text,
            type: 'OrderCode',
            confidence: 'medium',
            product: fuzzyResult.product,
            centerX: item.centerX,
            centerY: item.centerY,
            centerScore: centerScore,
            fuzzyMatch: true
          });
          continue;
        }
      }

      // Priority 2: Product Name match (using indexed word lookup)
      const normalizeForMatch = (str) => str.replace(/\s+/g, ' ').replace(/[^\w\s]/g, '').trim();
      const searchNormalized = normalizeForMatch(normalized);

      // Only match product names if the search text is substantial and matches meaningfully
      // Skip if text is too short or looks like OCR garbage
      if (searchNormalized.length < 5) {
        console.log(`⏭️  Skipping product name match for short text: "${text}"`);
      } else {
        // Check if text looks like a valid product name (contains letters and possibly numbers)
        const hasValidProductNamePattern = /^[A-Z]+(\s+[A-Z]+)*(\s+\d+)?/.test(searchNormalized);
        if (!hasValidProductNamePattern) {
          console.log(`⏭️  Skipping product name match - doesn't look like product name: "${text}"`);
        } else {
          // Try exact name match first (O(1) indexed lookup)
          let exactMatch = catalogIndex.getByNameExact(normalized);
          if (exactMatch) {
            console.log(`📝 Exact Product Name match: "${text}" → ${exactMatch.OrderCode}`);
            allMatches.push({
              text,
              type: 'ProductName',
              confidence: 'high',
              product: exactMatch,
              centerX: item.centerX,
              centerY: item.centerY,
              centerScore: centerScore
            });
            continue;
          }

          // Try word-based matching using inverted index
          const wordMatches = catalogIndex.findByNameWords(searchNormalized);

          // Filter to products where name actually matches meaningfully
          const productNameMatches = wordMatches.filter(p => {
            const productName = (p['Product Name'] || p.productName || '').toUpperCase().trim();
            if (!productName) return false;

            const productNameNormalized = normalizeForMatch(productName);

            // Check if search text starts with product name (e.g., "AURORA 530" matches "AURORA 530 BASIN...")
            if (productNameNormalized.startsWith(searchNormalized) && searchNormalized.length >= 6) {
              return true;
            }

            // Check if product name starts with search text
            if (searchNormalized.startsWith(productNameNormalized.split(/\s+/).slice(0, 2).join(' ')) && searchNormalized.length >= 6) {
              return true;
            }

            return false;
          });

          if (productNameMatches.length > 0) {
            console.log(`📝 Product Name match: "${text}" → ${productNameMatches.length} products`);
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
        }
      }

      // Priority 3: Fuzzy product name matching (for OCR errors like "Odesso" → "Odessa")
      const fuzzyNameMatches = catalogIndex.fuzzyMatchProductName(text, 1);
      if (fuzzyNameMatches.length > 0) {
        console.log(`🔄 Fuzzy Product Name match: "${text}" → ${fuzzyNameMatches.length} products (${fuzzyNameMatches[0].matchedFamily})`);
        fuzzyNameMatches.forEach(match => {
          allMatches.push({
            text,
            type: 'ProductName',
            confidence: match.confidence,
            product: match.product,
            centerX: item.centerX,
            centerY: item.centerY,
            centerScore: centerScore,
            fuzzyMatch: match.distance > 0,
            matchedFamily: match.matchedFamily
          });
        });
        continue;
      }

      console.log(`❌ No match for: "${text}"`);
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

    console.log('🔍 Total unique matches found:', unique.length);
    console.log('📦 Matched Products:', unique.map(m => ({
      orderCode: m.product.OrderCode,
      name: (m.product['Product Name'] || m.product.Description || '').substring(0, 50),
      type: m.type,
      confidence: m.confidence,
      centerScore: m.centerScore
    })));

    // Special handling: If we have multiple distinct OrderCodes (high confidence matches),
    // show ALL of them regardless of family grouping. This ensures all detected order codes
    // are visible to the user, not just the dominant family.
    const orderCodeMatches = unique.filter(m => m.type === 'OrderCode' && m.confidence === 'high');
    const distinctOrderCodes = new Set(orderCodeMatches.map(m => m.product.OrderCode));
    
    if (distinctOrderCodes.size > 1) {
      console.log('✅ Multiple distinct OrderCodes detected:', Array.from(distinctOrderCodes));
      console.log('📋 Showing all OrderCode matches (', orderCodeMatches.length, 'products)');
      // Return all OrderCode matches, sorted by center score (center items first)
      return orderCodeMatches.sort((a, b) => b.centerScore - a.centerScore);
    }

    // Group by product family (extract base product name)
    const families = this.groupByProductFamily(unique);
    console.log('👥 Product Families Detected:', families.map(f => ({
      familyName: f.familyName,
      matchCount: f.matches.length,
      orderCodes: f.matches.map(m => m.product.OrderCode).slice(0, 5)
    })));
    
    // If only one family or one family clearly dominates center, return it
    if (families.length === 1) {
      console.log('✅ Single product family detected:', families[0].familyName);
      return families[0].matches;
    }

    // Score families by center proximity and frequency
    const scoredFamilies = families.map(family => {
      const centerMatches = family.matches.filter(m => m.centerScore >= 0.7);
      const centerScore = centerMatches.length / Math.max(family.matches.length, 1);
      const frequencyScore = family.matches.length / unique.length;
      const totalScore = (centerScore * 0.7) + (frequencyScore * 0.3);
      
      console.log(`📊 Family "${family.familyName}":`, {
        totalMatches: family.matches.length,
        centerMatches: centerMatches.length,
        centerScore: centerScore.toFixed(2),
        frequencyScore: frequencyScore.toFixed(2),
        totalScore: totalScore.toFixed(2)
      });
      
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
    // BUT only if we don't have multiple distinct OrderCodes (handled above)
    if (scoredFamilies.length > 1 && scoredFamilies[0].totalScore > 0.7) {
      console.log('🎯 Auto-selecting dominant product family:', scoredFamilies[0].familyName, 'with score:', scoredFamilies[0].totalScore.toFixed(2));
      return scoredFamilies[0].matches;
    }

    // Multiple families detected - return them for user selection
    console.log('🔀 Multiple product families detected:', scoredFamilies.map(f => `${f.familyName} (${f.matches.length} products, score: ${f.totalScore.toFixed(2)})`));
    console.log('📋 Families array:', scoredFamilies);
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

      console.log(`🏷️  Product "${productName.substring(0, 40)}..." → Family: "${familyName}" (OrderCode: ${product.OrderCode})`);

      if (!familyMap.has(familyName)) {
        familyMap.set(familyName, []);
      }
      familyMap.get(familyName).push(match);
    }

    const families = Array.from(familyMap.entries()).map(([familyName, matches]) => ({
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

    console.log('👨‍👩‍👧‍👦 Grouped into', families.length, 'families:', families.map(f => `${f.familyName} (${f.matches.length})`));
    return families;
  }

  /**
   * Legacy method for backward compatibility (handles array of strings)
   * Uses indexed O(1) lookups and fuzzy matching
   * @param {string[]} texts - Array of detected text strings
   * @param {Array} catalog - Product catalog array
   * @returns {Array} Array of match objects with product and confidence
   */
  static findProductsByOcrTextsLegacy(texts, catalog) {
    // Ensure index is built
    this.ensureIndexBuilt(catalog);

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

      // Priority 1: Exact OrderCode match (O(1) indexed lookup)
      if (orderCodeRegex.test(normalized)) {
        let product = catalogIndex.getByOrderCode(normalized);

        if (product) {
          matches.push({
            text,
            type: 'OrderCode',
            confidence: 'high',
            product
          });
          continue;
        }

        // Try fuzzy match
        const fuzzyResult = catalogIndex.fuzzyMatchOrderCode(normalized, 1);
        if (fuzzyResult) {
          matches.push({
            text,
            type: 'OrderCode',
            confidence: 'medium',
            product: fuzzyResult.product,
            fuzzyMatch: true
          });
          continue;
        }
      }

      // Priority 1b: Partial OrderCode match (O(1) indexed lookup)
      const orderCodeMatch = normalized.match(/19\d{4}/);
      if (orderCodeMatch) {
        const code = orderCodeMatch[0];
        let product = catalogIndex.getByOrderCode(code);

        if (product) {
          matches.push({
            text,
            type: 'OrderCode',
            confidence: 'medium',
            product
          });
          continue;
        }

        // Try fuzzy match
        const fuzzyResult = catalogIndex.fuzzyMatchOrderCode(code, 1);
        if (fuzzyResult) {
          matches.push({
            text,
            type: 'OrderCode',
            confidence: 'medium',
            product: fuzzyResult.product,
            fuzzyMatch: true
          });
          continue;
        }
      }

      // Normalize search text for matching
      const normalizeForMatch = (str) => str.replace(/\s+/g, ' ').replace(/[^\w\s]/g, '').trim();
      const searchNormalized = normalizeForMatch(normalized);

      // Priority 2: Product Name match (O(1) exact + indexed word lookup)
      let exactMatch = catalogIndex.getByNameExact(normalized);
      if (exactMatch) {
        matches.push({
          text,
          type: 'ProductName',
          confidence: 'high',
          product: exactMatch
        });
        continue;
      }

      // Word-based matching using inverted index
      const wordMatches = catalogIndex.findByNameWords(searchNormalized);
      if (wordMatches.length > 0) {
        wordMatches.forEach(product => {
          matches.push({
            text,
            type: 'ProductName',
            confidence: 'medium',
            product
          });
        });
        continue;
      }

      // Priority 3: Description match - kept for legacy but limited
      // Only exact matches to prevent false positives
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

