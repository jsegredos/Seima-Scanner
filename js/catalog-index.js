/**
 * Catalog Index - O(1) Product Lookups
 * Pre-indexes the product catalog for fast searching
 */

export class CatalogIndex {
  constructor() {
    this.byOrderCode = new Map();
    this.byBarcode = new Map();
    this.byNameExact = new Map();
    this.byNameWords = new Map(); // Inverted index: word -> Set of products
    this.catalog = [];
    this.isBuilt = false;
  }

  /**
   * Build all indices from the product catalog
   * @param {Array} catalog - Product catalog array
   */
  build(catalog) {
    if (!catalog || catalog.length === 0) {
      console.warn('CatalogIndex: Empty catalog provided');
      return;
    }

    console.log(`🔨 Building catalog index for ${catalog.length} products...`);
    const startTime = performance.now();

    // Clear existing indices
    this.byOrderCode.clear();
    this.byBarcode.clear();
    this.byNameExact.clear();
    this.byNameWords.clear();
    this.catalog = catalog;

    for (const product of catalog) {
      // Index by OrderCode (normalized to uppercase, trimmed)
      const orderCode = (product.OrderCode || '').toString().trim().toUpperCase();
      if (orderCode) {
        this.byOrderCode.set(orderCode, product);
      }

      // Index by Barcode
      const barcode = (product.BARCODE || product.Barcode || '').toString().trim();
      if (barcode) {
        this.byBarcode.set(barcode, product);
      }

      // Index by exact product name (normalized)
      const productName = (product['Product Name'] || product.productName || '').toUpperCase().trim();
      if (productName) {
        this.byNameExact.set(productName, product);

        // Build inverted word index for partial matching
        const words = this.extractSignificantWords(productName);
        for (const word of words) {
          if (!this.byNameWords.has(word)) {
            this.byNameWords.set(word, new Set());
          }
          this.byNameWords.get(word).add(product);
        }
      }
    }

    this.isBuilt = true;
    const buildTime = (performance.now() - startTime).toFixed(2);
    console.log(`✅ Catalog index built in ${buildTime}ms`);
    console.log(`   - OrderCodes: ${this.byOrderCode.size}`);
    console.log(`   - Barcodes: ${this.byBarcode.size}`);
    console.log(`   - Product Names: ${this.byNameExact.size}`);
    console.log(`   - Word Index: ${this.byNameWords.size} unique words`);
  }

  /**
   * Extract significant words from text (length > 2, alphanumeric)
   * @param {string} text
   * @returns {string[]}
   */
  extractSignificantWords(text) {
    return text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .map(word => word.toUpperCase());
  }

  /**
   * O(1) lookup by OrderCode
   * @param {string} orderCode
   * @returns {Object|null}
   */
  getByOrderCode(orderCode) {
    if (!orderCode) return null;
    const normalized = orderCode.toString().trim().toUpperCase();
    return this.byOrderCode.get(normalized) || null;
  }

  /**
   * O(1) lookup by Barcode
   * @param {string} barcode
   * @returns {Object|null}
   */
  getByBarcode(barcode) {
    if (!barcode) return null;
    const normalized = barcode.toString().trim();
    return this.byBarcode.get(normalized) || null;
  }

  /**
   * O(1) lookup by exact product name
   * @param {string} name
   * @returns {Object|null}
   */
  getByNameExact(name) {
    if (!name) return null;
    const normalized = name.toString().toUpperCase().trim();
    return this.byNameExact.get(normalized) || null;
  }

  /**
   * Find products matching all given words (intersection)
   * @param {string} searchText
   * @returns {Object[]}
   */
  findByNameWords(searchText) {
    if (!searchText) return [];

    const words = this.extractSignificantWords(searchText);
    if (words.length === 0) return [];

    // Get products matching each word
    const wordMatches = words.map(word => this.byNameWords.get(word) || new Set());

    // Find intersection (products matching ALL words)
    if (wordMatches.length === 0) return [];

    let result = new Set(wordMatches[0]);
    for (let i = 1; i < wordMatches.length; i++) {
      result = new Set([...result].filter(p => wordMatches[i].has(p)));
    }

    return Array.from(result);
  }

  /**
   * Fuzzy match OrderCode with Levenshtein distance tolerance
   * @param {string} ocrCode - OCR-detected code (may have errors)
   * @param {number} maxDistance - Maximum allowed edit distance (default: 1)
   * @returns {Object|null} Best matching product or null
   */
  fuzzyMatchOrderCode(ocrCode, maxDistance = 1) {
    if (!ocrCode) return null;

    const normalized = ocrCode.toString().trim().toUpperCase();

    // Try exact match first (O(1))
    const exact = this.byOrderCode.get(normalized);
    if (exact) return { product: exact, distance: 0, confidence: 'high' };

    // Only do fuzzy matching for OrderCode format (19xxxx)
    if (!/^19\d{4}$/.test(normalized)) return null;

    // Fuzzy search through OrderCodes (optimized for 19xxxx pattern)
    let bestMatch = null;
    let bestDistance = maxDistance + 1;

    for (const [code, product] of this.byOrderCode) {
      // Only compare codes of same length and starting with 19
      if (code.length !== normalized.length || !code.startsWith('19')) continue;

      const distance = this.levenshteinDistance(normalized, code);
      if (distance <= maxDistance && distance < bestDistance) {
        bestDistance = distance;
        bestMatch = {
          product,
          distance,
          confidence: distance === 0 ? 'high' : 'medium',
          originalCode: code
        };
      }
    }

    return bestMatch;
  }

  /**
   * Calculate Levenshtein distance between two strings
   * Optimized for short strings (OrderCodes)
   * @param {string} a
   * @param {string} b
   * @returns {number}
   */
  levenshteinDistance(a, b) {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    // For short strings, use simple matrix approach
    const matrix = [];

    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Find similar OrderCodes for OCR correction suggestions
   * @param {string} ocrCode
   * @param {number} limit
   * @returns {Array<{code: string, distance: number}>}
   */
  findSimilarOrderCodes(ocrCode, limit = 3) {
    if (!ocrCode) return [];

    const normalized = ocrCode.toString().trim().toUpperCase();
    const results = [];

    for (const [code, product] of this.byOrderCode) {
      if (code.length !== normalized.length) continue;

      const distance = this.levenshteinDistance(normalized, code);
      if (distance <= 2) { // Allow up to 2 edits for suggestions
        results.push({ code, product, distance });
      }
    }

    return results
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
  }

  /**
   * Fuzzy match product name with Levenshtein distance tolerance
   * ONLY matches "WORD NUMBER" patterns (e.g., "ODESSA 922") to avoid false positives
   * Requires exact number match when number is present in OCR text
   * @param {string} text - OCR-detected text (may contain errors)
   * @param {number} maxDistance - Maximum allowed edit distance for name (default: 1)
   * @returns {Array<{product: Object, distance: number, matchedFamily: string}>}
   */
  fuzzyMatchProductName(text, maxDistance = 1) {
    if (!text || text.length < 5) return [];

    const normalized = text.toUpperCase().trim();
    const results = [];

    // ONLY extract "WORD NUMBER" patterns (e.g., "ODESSA 922", "AURORA 530")
    // We require a number to avoid false positives like "pares" → "SPARES"
    const familyPatterns = [];

    // Find "WORD NUMBER" patterns in the text
    const wordNumberMatch = normalized.match(/([A-Z]{4,})\s*(\d{3,4})/g);
    if (wordNumberMatch) {
      wordNumberMatch.forEach(match => {
        const parts = match.match(/([A-Z]{4,})\s*(\d{3,4})/);
        if (parts) {
          familyPatterns.push({
            name: parts[1],
            number: parts[2],
            full: `${parts[1]} ${parts[2]}`
          });
        }
      });
    }

    // If no "WORD NUMBER" pattern found, don't do fuzzy matching
    // Single words are too prone to false positives
    if (familyPatterns.length === 0) return [];

    // Build a set of known product family names WITH NUMBERS from catalog
    const knownFamilies = new Map(); // "ODESSA 922" -> [products]

    for (const product of this.catalog) {
      const productName = (product['Product Name'] || product.productName || '').toUpperCase().trim();
      if (!productName) continue;

      // Extract family name WITH number (e.g., "ODESSA 922")
      const familyMatch = productName.match(/^([A-Z]+)\s+(\d{3,4})/);
      if (familyMatch) {
        const familyKey = `${familyMatch[1]} ${familyMatch[2]}`;

        if (!knownFamilies.has(familyKey)) {
          knownFamilies.set(familyKey, []);
        }
        knownFamilies.get(familyKey).push(product);
      }
    }

    // Match OCR patterns against known families with fuzzy matching
    for (const pattern of familyPatterns) {
      for (const [familyKey, products] of knownFamilies) {
        const familyParts = familyKey.split(/\s+/);
        const familyName = familyParts[0];
        const familyNumber = familyParts[1];

        // REQUIRE exact number match - this is the key fix
        if (pattern.number !== familyNumber) {
          continue;
        }

        // Calculate distance for the name part only
        const nameDistance = this.levenshteinDistance(pattern.name, familyName);

        // Accept if name is within tolerance
        if (nameDistance <= maxDistance) {
          products.forEach(product => {
            // Check if we already have this product
            const existing = results.find(r => r.product.OrderCode === product.OrderCode);
            if (!existing || existing.distance > nameDistance) {
              if (existing) {
                results.splice(results.indexOf(existing), 1);
              }
              results.push({
                product,
                distance: nameDistance,
                matchedFamily: familyKey,
                ocrText: pattern.full,
                confidence: nameDistance === 0 ? 'high' : 'medium'
              });
            }
          });
        }
      }
    }

    console.log(`🔍 Fuzzy name matching: "${text}" → found ${results.length} products`);
    return results;
  }

  /**
   * Get the raw catalog array
   * @returns {Array}
   */
  getCatalog() {
    return this.catalog;
  }

  /**
   * Check if index is built
   * @returns {boolean}
   */
  isReady() {
    return this.isBuilt && this.catalog.length > 0;
  }
}

// Export singleton instance
export const catalogIndex = new CatalogIndex();
