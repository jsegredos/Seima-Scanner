/**
 * Lead Tracking Wizard UI Component
 * 3-step wizard for collecting customer lead information
 */

import { leadTracker } from './lead-tracker.js';

export class LeadWizard {
  constructor() {
    this.isVisible = false;
    this.onCompleteCallback = null;
    this.onCancelCallback = null;
  }

  /**
   * Show the lead wizard
   */
  show(onComplete, onCancel) {
    this.onCompleteCallback = onComplete;
    this.onCancelCallback = onCancel;
    this.createWizardHTML();
    this.showStep(leadTracker.currentStep);
    this.isVisible = true;
  }

  /**
   * Hide the lead wizard
   */
  hide() {
    const modal = document.getElementById('lead-wizard-modal');
    if (modal) {
      modal.remove();
    }
    this.isVisible = false;
  }

  /**
   * Create the wizard HTML structure
   */
  createWizardHTML() {
    // Remove existing modal if present
    const existing = document.getElementById('lead-wizard-modal');
    if (existing) {
      existing.remove();
    }

    const modalHTML = `
      <div id="lead-wizard-modal" class="modal" style="display: block; z-index: 1000;">
        <div class="modal-content lead-wizard-content">
          <div class="lead-wizard-header">
            <h3 id="wizard-title">Customer Information</h3>
            <div class="wizard-progress">
              <div class="progress-steps">
                <div class="progress-step active" data-step="1">
                  <span class="step-number">1</span>
                  <span class="step-label">Customer & Project</span>
                </div>
                <div class="progress-step" data-step="2">
                  <span class="step-number">2</span>
                  <span class="step-label">Customer Type</span>
                </div>
                <div class="progress-step" data-step="3">
                  <span class="step-number">3</span>
                  <span class="step-label">How They Found Us</span>
                </div>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: 33.33%"></div>
              </div>
            </div>
          </div>
          
          <div class="lead-wizard-body">
            <div id="wizard-step-content">
              <!-- Step content will be inserted here -->
            </div>
          </div>
          
          <div class="lead-wizard-footer">
            <button id="wizard-back-btn" class="secondary-btn" style="display: none;">
              Back
            </button>
            <div class="wizard-footer-right">
              <button id="wizard-cancel-btn" class="secondary-btn">
                Cancel
              </button>
              <button id="wizard-next-btn" class="primary-btn">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.attachEventListeners();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const backBtn = document.getElementById('wizard-back-btn');
    const nextBtn = document.getElementById('wizard-next-btn');
    const cancelBtn = document.getElementById('wizard-cancel-btn');

    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.goToPreviousStep();
    });
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.goToNextStep();
    });
    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.cancel();
    });

    // Close on outside click
    const modal = document.getElementById('lead-wizard-modal');
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.cancel();
      }
    });
  }

  /**
   * Show specific step
   */
  async showStep(step) {
    leadTracker.currentStep = step;
    this.updateProgressIndicator(step);
    this.updateNavigationButtons(step);
    
    // Update title based on step
    const titleElement = document.getElementById('wizard-title');
    if (titleElement) {
      switch (step) {
        case 1:
          titleElement.textContent = 'Customer Information';
          break;
        case 2:
          titleElement.textContent = 'Customer Type';
          break;
        case 3:
          titleElement.textContent = 'How you heard about us';
          break;
      }
    }
    
    const content = document.getElementById('wizard-step-content');
    
    switch (step) {
      case 1:
        content.innerHTML = this.getStep1HTML();
        this.attachStep1Listeners();
        break;
      case 2:
        content.innerHTML = this.getStep2HTML();
        this.attachStep2Listeners();
        await this.loadBuilderMerchantOptions(step);
        break;
      case 3:
        content.innerHTML = this.getStep3HTML();
        this.attachStep3Listeners();
        await this.loadBuilderMerchantOptions(step);
        break;
    }
    
    // Load existing data
    this.loadStepData(step);
  }

  /**
   * Get Step 1 HTML (Customer & Project Information)
   */
  getStep1HTML() {
    return `
      <div class="wizard-step-content">
        <div class="form-field">
          <label class="form-label">Customer Name *</label>
          <input type="text" id="customer-name" class="form-input" required maxlength="60" placeholder="Enter customer name...">
        </div>

        <div class="form-field">
          <label class="form-label">Email Address *</label>
          <input type="email" id="customer-email" class="form-input" required maxlength="80" placeholder="Enter email address...">
        </div>

        <div class="form-field">
          <label class="form-label">Phone Number <span style="color:#888;font-size:0.95em;">(optional)</span></label>
          <input type="tel" id="customer-phone" class="form-input" maxlength="20" placeholder="Enter phone number...">
        </div>

        <div class="form-field">
          <label class="form-label">Project Name *</label>
          <input type="text" id="project-name" class="form-input" required maxlength="60" placeholder="Enter project name...">
        </div>

        <div class="form-field">
          <label class="form-label">Project Address <span style="color:#888;font-size:0.95em;">(optional)</span></label>
          <input type="text" id="project-address" class="form-input" maxlength="100" placeholder="Enter project address...">
        </div>

        <div class="form-field">
          <label class="form-label">Project Notes <span style="color:#888;font-size:0.95em;">(optional)</span></label>
          <textarea id="project-notes" class="form-input" rows="2" maxlength="500" placeholder="Enter any additional details about the project..."></textarea>
        </div>

        <div class="form-options">
          <label class="checkbox-label">
            <input type="checkbox" id="exclude-price-checkbox">
            <span>Exclude pricing from documents</span>
          </label>
          <label class="checkbox-label">
            <input type="checkbox" id="export-csv-checkbox" checked>
            <span>Include CSV export (recommended)</span>
          </label>
        </div>
      </div>
    `;
  }

  /**
   * Get Step 2 HTML (Customer Type)
   */
  getStep2HTML() {
    // Note: Builder and merchant options will be loaded dynamically
    const builderOptions = ''; // Will be populated by loadBuilderOptions()
    const merchantOptions = ''; // Will be populated by loadMerchantOptions()

    return `
      <div class="wizard-step-content">
        <h4>What type of customer are you?</h4>
        <p class="step-description">This helps us understand your needs better</p>
        
        <div class="form-field">
          <label class="form-label">Customer Type *</label>
          <select id="customer-type-select" class="form-input" required>
            <option value="">Select customer type...</option>
            <option value="Builder">Builder</option>
            <option value="Merchant">Merchant</option>
            <option value="Client of Builder/Merchant">Client of Builder/Merchant</option>
            <option value="Architect">Architect</option>
            <option value="Designer">Designer</option>
            <option value="Plumber">Plumber</option>
            <option value="Developer">Developer</option>
            <option value="Consumer">Consumer</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div id="builder-dropdown" class="form-field conditional-field" style="display: none;">
          <label class="form-label">Builder Name <span class="field-note">(if applicable)</span></label>
          <div class="select-with-add">
            <select id="builder-name-select" class="form-input">
              <option value="">Select builder...</option>
              ${builderOptions}
              <option value="Other">Other (specify below)</option>
            </select>
            <button type="button" id="add-builder-btn" class="add-btn" title="Add new builder">+</button>
          </div>
          <div id="builder-other-input" class="form-field" style="display: none; margin-top: 8px;">
            <input type="text" id="builder-other-name" class="form-input" 
                   placeholder="Enter builder name..." maxlength="50">
          </div>
        </div>

        <div id="merchant-dropdown" class="form-field conditional-field" style="display: none;">
          <label class="form-label">Merchant Name <span class="field-note">(if applicable)</span></label>
          <div class="select-with-add">
            <select id="merchant-name-select" class="form-input">
              <option value="">Select merchant...</option>
              ${merchantOptions}
              <option value="Other">Other (specify below)</option>
            </select>
            <button type="button" id="add-merchant-btn" class="add-btn" title="Add new merchant">+</button>
          </div>
          <div id="merchant-other-input" class="form-field" style="display: none; margin-top: 8px;">
            <input type="text" id="merchant-other-name" class="form-input" 
                   placeholder="Enter merchant name..." maxlength="50">
          </div>
        </div>

        <div id="other-input" class="form-field conditional-field" style="display: none;">
          <label class="form-label">Please specify</label>
          <input type="text" id="customer-type-other" class="form-input" 
                 placeholder="Enter customer type..." maxlength="50">
        </div>
      </div>
    `;
  }

  /**
   * Get Step 3 HTML (How They Heard About Us)
   */
  getStep3HTML() {
    // Note: Builder and merchant options will be loaded dynamically
    const builderOptions = ''; // Will be populated by loadBuilderOptions()
    const merchantOptions = ''; // Will be populated by loadMerchantOptions()

    return `
      <div class="wizard-step-content">
        <div class="checkbox-grid">
          <div class="checkbox-item-wrapper">
            <label class="checkbox-item">
              <input type="checkbox" value="Builder Referral" class="hear-about-checkbox">
              <span class="checkbox-label">Builder Referral</span>
            </label>
            <div id="builder-referral-dropdown" class="form-field conditional-field" style="display: none; margin-top: 8px;">
              <label class="form-label">Which Builder?</label>
              <div class="select-with-add">
                <select id="referral-builder-select" class="form-input">
                  <option value="">Select builder...</option>
                  ${builderOptions}
                  <option value="Other">Other (specify below)</option>
                </select>
                <button type="button" id="add-referral-builder-btn" class="add-btn" title="Add new builder">+</button>
              </div>
              <div id="referral-builder-other-input" class="form-field" style="display: none; margin-top: 8px;">
                <input type="text" id="referral-builder-other-name" class="form-input" 
                       placeholder="Enter builder name..." maxlength="50">
              </div>
            </div>
          </div>
          
          <div class="checkbox-item-wrapper">
            <label class="checkbox-item">
              <input type="checkbox" value="Merchant Referral" class="hear-about-checkbox">
              <span class="checkbox-label">Merchant Referral</span>
            </label>
            <div id="merchant-referral-dropdown" class="form-field conditional-field" style="display: none; margin-top: 8px;">
              <label class="form-label">Which Merchant?</label>
              <div class="select-with-add">
                <select id="referral-merchant-select" class="form-input">
                  <option value="">Select merchant...</option>
                  ${merchantOptions}
                  <option value="Other">Other (specify below)</option>
                </select>
                <button type="button" id="add-referral-merchant-btn" class="add-btn" title="Add new merchant">+</button>
              </div>
              <div id="referral-merchant-other-input" class="form-field" style="display: none; margin-top: 8px;">
                <input type="text" id="referral-merchant-other-name" class="form-input" 
                       placeholder="Enter merchant name..." maxlength="50">
              </div>
            </div>
          </div>
          
          <label class="checkbox-item">
            <input type="checkbox" value="Architect/Designer Referral" class="hear-about-checkbox">
            <span class="checkbox-label">Architect/Designer Referral</span>
          </label>
          
          <label class="checkbox-item">
            <input type="checkbox" value="Google Search" class="hear-about-checkbox">
            <span class="checkbox-label">Google Search</span>
          </label>
          
          <label class="checkbox-item">
            <input type="checkbox" value="Social Media" class="hear-about-checkbox">
            <span class="checkbox-label">Social Media</span>
          </label>
          
          <label class="checkbox-item">
            <input type="checkbox" value="Trade Show/Exhibition" class="hear-about-checkbox">
            <span class="checkbox-label">Trade Show/Exhibition</span>
          </label>
          
          <label class="checkbox-item">
            <input type="checkbox" value="Website" class="hear-about-checkbox">
            <span class="checkbox-label">Website</span>
          </label>
          
          <label class="checkbox-item">
            <input type="checkbox" value="Word of Mouth/Friend" class="hear-about-checkbox">
            <span class="checkbox-label">Word of Mouth/Friend</span>
          </label>
          
          <label class="checkbox-item">
            <input type="checkbox" value="Previous Customer" class="hear-about-checkbox">
            <span class="checkbox-label">Previous Customer</span>
          </label>
          
          <div class="checkbox-item-wrapper">
            <label class="checkbox-item">
              <input type="checkbox" value="Other" class="hear-about-checkbox">
              <span class="checkbox-label">Other</span>
            </label>
            <div id="hear-about-other-input" class="form-field conditional-field" style="display: none; margin-top: 8px;">
              <label class="form-label">Please specify</label>
              <input type="text" id="hear-about-other" class="form-input" 
                     placeholder="How did you hear about us?" maxlength="100">
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Attach Step 1 event listeners (Customer & Project Information)
   */
  attachStep1Listeners() {
    // Customer information fields
    document.getElementById('customer-name').addEventListener('input', (e) => {
      leadTracker.updateLeadData({ customerName: e.target.value });
      this.updateNextButtonState();
    });

    document.getElementById('customer-email').addEventListener('input', (e) => {
      leadTracker.updateLeadData({ customerEmail: e.target.value });
      this.updateNextButtonState();
    });

    document.getElementById('customer-phone').addEventListener('input', (e) => {
      leadTracker.updateLeadData({ customerPhone: e.target.value });
    });

    // Project information fields
    document.getElementById('project-name').addEventListener('input', (e) => {
      leadTracker.updateLeadData({ projectName: e.target.value });
      this.updateNextButtonState();
    });

    document.getElementById('project-address').addEventListener('input', (e) => {
      leadTracker.updateLeadData({ projectAddress: e.target.value });
    });

    document.getElementById('project-notes').addEventListener('input', (e) => {
      leadTracker.updateLeadData({ projectNotes: e.target.value });
    });

    // Options checkboxes
    document.getElementById('exclude-price-checkbox').addEventListener('change', (e) => {
      leadTracker.updateLeadData({ excludePrice: e.target.checked });
    });

    document.getElementById('export-csv-checkbox').addEventListener('change', (e) => {
      leadTracker.updateLeadData({ exportCsv: e.target.checked });
    });
  }

  /**
   * Attach Step 2 event listeners (Customer Type)
   */
  attachStep2Listeners() {
    const customerTypeSelect = document.getElementById('customer-type-select');
    const builderDropdown = document.getElementById('builder-dropdown');
    const merchantDropdown = document.getElementById('merchant-dropdown');
    const otherInput = document.getElementById('other-input');

    customerTypeSelect.addEventListener('change', (e) => {
      const value = e.target.value;
      
      // Hide all conditional fields
      builderDropdown.style.display = 'none';
      merchantDropdown.style.display = 'none';
      otherInput.style.display = 'none';
      
      // Show relevant conditional fields based on selection
      if (value === 'Builder') {
        builderDropdown.style.display = 'block';
      } else if (value === 'Merchant') {
        merchantDropdown.style.display = 'block';
      } else if (value === 'Client of Builder/Merchant') {
        // Show both builder and merchant dropdowns
        builderDropdown.style.display = 'block';
        merchantDropdown.style.display = 'block';
      } else if (value === 'Other') {
        otherInput.style.display = 'block';
      }
      
      // Update lead data
      leadTracker.updateLeadData({ customerType: value });
      this.updateNextButtonState();
    });

    // Builder and merchant dropdowns
    document.getElementById('builder-name-select').addEventListener('change', (e) => {
      const value = e.target.value;
      const otherInput = document.getElementById('builder-other-input');
      
      if (value === 'Other') {
        otherInput.style.display = 'block';
        document.getElementById('builder-other-name').focus();
      } else {
        otherInput.style.display = 'none';
        leadTracker.updateLeadData({ builderName: value });
      }
    });

    document.getElementById('merchant-name-select').addEventListener('change', (e) => {
      const value = e.target.value;
      const otherInput = document.getElementById('merchant-other-input');
      
      if (value === 'Other') {
        otherInput.style.display = 'block';
        document.getElementById('merchant-other-name').focus();
      } else {
        otherInput.style.display = 'none';
        leadTracker.updateLeadData({ merchantName: value });
      }
    });

    // Other name inputs
    document.getElementById('builder-other-name').addEventListener('input', (e) => {
      leadTracker.updateLeadData({ builderName: e.target.value });
    });

    document.getElementById('merchant-other-name').addEventListener('input', (e) => {
      leadTracker.updateLeadData({ merchantName: e.target.value });
    });

    document.getElementById('customer-type-other').addEventListener('input', (e) => {
      leadTracker.updateLeadData({ customerTypeOther: e.target.value });
    });

    // Add builder/merchant buttons
    document.getElementById('add-builder-btn').addEventListener('click', () => {
      this.showAddBuilderModal();
    });

    document.getElementById('add-merchant-btn').addEventListener('click', () => {
      this.showAddMerchantModal();
    });
  }

  /**
   * Attach Step 3 event listeners (How They Heard About Us)
   */
  attachStep3Listeners() {
    const checkboxes = document.querySelectorAll('.hear-about-checkbox');
    const builderReferralDropdown = document.getElementById('builder-referral-dropdown');
    const merchantReferralDropdown = document.getElementById('merchant-referral-dropdown');
    const otherInput = document.getElementById('hear-about-other-input');

    checkboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const checkedValues = Array.from(checkboxes)
          .filter(cb => cb.checked)
          .map(cb => cb.value);
        
        // Show/hide conditional fields
        builderReferralDropdown.style.display = 
          checkedValues.includes('Builder Referral') ? 'block' : 'none';
        merchantReferralDropdown.style.display = 
          checkedValues.includes('Merchant Referral') ? 'block' : 'none';
        otherInput.style.display = 
          checkedValues.includes('Other') ? 'block' : 'none';
        
        // Update lead data
        leadTracker.updateLeadData({ hearAboutUs: checkedValues });
        this.updateNextButtonState();
      });
    });

    // Referral dropdowns
    document.getElementById('referral-builder-select').addEventListener('change', (e) => {
      const value = e.target.value;
      const otherInput = document.getElementById('referral-builder-other-input');
      
      if (value === 'Other') {
        otherInput.style.display = 'block';
        document.getElementById('referral-builder-other-name').focus();
      } else {
        otherInput.style.display = 'none';
        leadTracker.updateLeadData({ referralBuilder: value });
      }
    });

    document.getElementById('referral-merchant-select').addEventListener('change', (e) => {
      const value = e.target.value;
      const otherInput = document.getElementById('referral-merchant-other-input');
      
      if (value === 'Other') {
        otherInput.style.display = 'block';
        document.getElementById('referral-merchant-other-name').focus();
      } else {
        otherInput.style.display = 'none';
        leadTracker.updateLeadData({ referralMerchant: value });
      }
    });

    // Referral other name inputs
    document.getElementById('referral-builder-other-name').addEventListener('input', (e) => {
      leadTracker.updateLeadData({ referralBuilder: e.target.value });
    });

    document.getElementById('referral-merchant-other-name').addEventListener('input', (e) => {
      leadTracker.updateLeadData({ referralMerchant: e.target.value });
    });

    document.getElementById('hear-about-other').addEventListener('input', (e) => {
      leadTracker.updateLeadData({ hearAboutUsOther: e.target.value });
    });

    // Add referral builder/merchant buttons
    document.getElementById('add-referral-builder-btn').addEventListener('click', () => {
      this.showAddBuilderModal('referral');
    });

    document.getElementById('add-referral-merchant-btn').addEventListener('click', () => {
      this.showAddMerchantModal('referral');
    });
  }

  /**
   * Load existing data for current step
   */
  loadStepData(step) {
    const data = leadTracker.getLeadData();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/271cbb43-06c0-4898-a939-268461524d29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lead-wizard.js:591',message:'loadStepData called',data:{step:step,hasCustomerName:!!data.customerName,hasCustomerEmail:!!data.customerEmail,customerName:data.customerName,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    
    switch (step) {
      case 1:
        // Load customer and project information
        if (data.customerName) {
          document.getElementById('customer-name').value = data.customerName;
        }
        if (data.customerEmail) {
          document.getElementById('customer-email').value = data.customerEmail;
        }
        if (data.customerPhone) {
          document.getElementById('customer-phone').value = data.customerPhone;
        }
        if (data.projectName) {
          document.getElementById('project-name').value = data.projectName;
        }
        if (data.projectAddress) {
          document.getElementById('project-address').value = data.projectAddress;
        }
        if (data.projectNotes) {
          document.getElementById('project-notes').value = data.projectNotes;
        }
        if (data.excludePrice !== undefined) {
          document.getElementById('exclude-price-checkbox').checked = data.excludePrice;
        }
        if (data.exportCsv !== undefined) {
          document.getElementById('export-csv-checkbox').checked = data.exportCsv;
        }
        break;
        
      case 2:
        // Load customer type information
        if (data.customerType) {
          document.getElementById('customer-type-select').value = data.customerType;
          
          // Trigger change event to show conditional fields
          const event = new Event('change');
          document.getElementById('customer-type-select').dispatchEvent(event);
          
          // Load conditional field values
          if (data.builderName) {
            document.getElementById('builder-name-select').value = data.builderName;
          }
          if (data.merchantName) {
            document.getElementById('merchant-name-select').value = data.merchantName;
          }
          if (data.customerTypeOther) {
            document.getElementById('customer-type-other').value = data.customerTypeOther;
          }
        }
        break;
        
      case 3:
        // Load how they heard about us information
        if (data.hearAboutUs && data.hearAboutUs.length > 0) {
          data.hearAboutUs.forEach(value => {
            const checkbox = document.querySelector(`input[value="${value}"]`);
            if (checkbox) {
              checkbox.checked = true;
            }
          });
          
          // Trigger change to show conditional fields
          const firstCheckbox = document.querySelector('.hear-about-checkbox');
          if (firstCheckbox) {
            const event = new Event('change');
            firstCheckbox.dispatchEvent(event);
          }
        }
        
        // Load conditional field values
        if (data.referralBuilder) {
          document.getElementById('referral-builder-select').value = data.referralBuilder;
        }
        if (data.referralMerchant) {
          document.getElementById('referral-merchant-select').value = data.referralMerchant;
        }
        if (data.hearAboutUsOther) {
          document.getElementById('hear-about-other').value = data.hearAboutUsOther;
        }
        break;
    }
    
    this.updateNextButtonState();
  }

  /**
   * Update progress indicator
   */
  updateProgressIndicator(step) {
    const steps = document.querySelectorAll('.progress-step');
    const progressFill = document.querySelector('.progress-fill');
    
    steps.forEach((stepEl, index) => {
      stepEl.classList.toggle('active', index + 1 === step);
      stepEl.classList.toggle('completed', index + 1 < step);
    });
    
    const progressPercent = (step / 3) * 100;
    progressFill.style.width = `${progressPercent}%`;
  }

  /**
   * Update navigation buttons
   */
  updateNavigationButtons(step) {
    const backBtn = document.getElementById('wizard-back-btn');
    const nextBtn = document.getElementById('wizard-next-btn');
    
    backBtn.style.display = step > 1 ? 'block' : 'none';
    nextBtn.textContent = step === 3 ? 'Complete' : 'Next';
    
    this.updateNextButtonState();
  }

  /**
   * Update next button enabled state
   */
  updateNextButtonState() {
    const nextBtn = document.getElementById('wizard-next-btn');
    const isValid = leadTracker.validateStep(leadTracker.currentStep);
    
    nextBtn.disabled = !isValid;
    nextBtn.classList.toggle('disabled', !isValid);
  }

  /**
   * Go to next step
   */
  goToNextStep() {
    const currentStep = leadTracker.currentStep;
    
    if (!leadTracker.validateStep(currentStep)) {
      this.showValidationError(currentStep);
      return;
    }
    
    if (currentStep < 3) {
      this.showStep(currentStep + 1);
    } else {
      this.complete();
    }
  }

  /**
   * Go to previous step
   */
  goToPreviousStep() {
    const currentStep = leadTracker.currentStep;
    if (currentStep > 1) {
      this.showStep(currentStep - 1);
    }
  }

  /**
   * Show validation error
   */
  showValidationError(step) {
    let message = '';
    
    switch (step) {
      case 1:
        message = 'Please select a customer type';
        break;
      case 2:
        message = 'Please select at least one option for how you heard about us';
        break;
      case 3:
        message = 'Please select at least one option for how you heard about us';
        break;
    }
    
    // Show temporary error message
    const existingError = document.querySelector('.wizard-error');
    if (existingError) {
      existingError.remove();
    }
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'wizard-error';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
      color: #dc3545;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      padding: 8px 12px;
      border-radius: 4px;
      margin-top: 10px;
      font-size: 14px;
    `;
    
    const content = document.getElementById('wizard-step-content');
    content.appendChild(errorDiv);
    
    // Remove error after 3 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 3000);
  }

  /**
   * Complete the wizard
   */
  complete() {
    // Ensure latest checkbox states are captured before finalising
    const excludePriceEl = document.getElementById('exclude-price-checkbox');
    const exportCsvEl = document.getElementById('export-csv-checkbox');
    if (excludePriceEl) {
      leadTracker.updateLeadData({ excludePrice: !!excludePriceEl.checked });
    }
    if (exportCsvEl) {
      leadTracker.updateLeadData({ exportCsv: !!exportCsvEl.checked });
    }

    // Use raw lead data here so we keep all fields (name, email, project, etc.)
    // Formatting for reporting/email is handled downstream.
    const leadData = leadTracker.getLeadData();
    
    if (this.onCompleteCallback) {
      this.onCompleteCallback(leadData);
    }
    
    this.hide();
  }

  /**
   * Cancel the wizard
   */
  cancel() {
    if (this.onCancelCallback) {
      this.onCancelCallback();
    }
    
    this.hide();
  }

  /**
   * Show add builder modal
   */
  showAddBuilderModal(type = 'customer') {
    const modal = this.createAddModal('Builder', async (name) => {
      const result = await leadTracker.addCustomBuilder(name);
      if (result.success) {
        await this.refreshBuilderDropdowns();
        
        // Auto-select the new builder
        const selectId = type === 'referral' ? 'referral-builder-select' : 'builder-name-select';
        const select = document.getElementById(selectId);
        if (select) {
          select.value = result.name || name;
          select.dispatchEvent(new Event('change'));
        }
      } else if (result.error === 'Builder already exists') {
        // Show duplicate modal
        this.showDuplicateModal('Builder', result.existing, () => {
          // Auto-select the existing builder
          const selectId = type === 'referral' ? 'referral-builder-select' : 'builder-name-select';
          const select = document.getElementById(selectId);
          if (select) {
            select.value = result.existing;
            select.dispatchEvent(new Event('change'));
          }
        });
        return false; // Don't close the add modal yet
      }
    });
  }

  /**
   * Show add merchant modal
   */
  showAddMerchantModal(type = 'customer') {
    const modal = this.createAddModal('Merchant', async (name) => {
      const result = await leadTracker.addCustomMerchant(name);
      if (result.success) {
        await this.refreshMerchantDropdowns();
        
        // Auto-select the new merchant
        const selectId = type === 'referral' ? 'referral-merchant-select' : 'merchant-name-select';
        const select = document.getElementById(selectId);
        if (select) {
          select.value = result.name || name;
          select.dispatchEvent(new Event('change'));
        }
      } else if (result.error === 'Merchant already exists') {
        // Show duplicate modal
        this.showDuplicateModal('Merchant', result.existing, () => {
          // Auto-select the existing merchant
          const selectId = type === 'referral' ? 'referral-merchant-select' : 'merchant-name-select';
          const select = document.getElementById(selectId);
          if (select) {
            select.value = result.existing;
            select.dispatchEvent(new Event('change'));
          }
        });
        return false; // Don't close the add modal yet
      }
    });
  }

  /**
   * Create add modal for builder/merchant
   */
  createAddModal(type, onAdd) {
    const modalHTML = `
      <div id="add-${type.toLowerCase()}-modal" class="modal" style="display: block; z-index: 1100;">
        <div class="modal-content" style="max-width: 450px;">
          <h3>Add New ${type}</h3>
          <div class="form-field" style="position: relative;">
            <label class="form-label">${type} Name *</label>
            <input type="text" id="new-${type.toLowerCase()}-name" class="form-input" 
                   placeholder="Enter ${type.toLowerCase()} name..." maxlength="50" required>
            <div id="add-modal-suggestions" class="add-modal-suggestions" style="display: none;"></div>
          </div>
          <div id="similarity-warning" class="similarity-warning" style="display: none;">
            <div class="warning-icon">⚠️</div>
            <div class="warning-text">
              <strong>Similar entries found:</strong>
              <div id="similar-entries"></div>
              <small>Consider using an existing entry to avoid duplicates.</small>
            </div>
          </div>
          <div class="modal-actions">
            <button type="button" id="cancel-add-${type.toLowerCase()}" class="secondary-btn">Cancel</button>
            <button type="button" id="save-add-${type.toLowerCase()}" class="primary-btn">Add ${type}</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById(`add-${type.toLowerCase()}-modal`);
    const nameInput = document.getElementById(`new-${type.toLowerCase()}-name`);
    const cancelBtn = document.getElementById(`cancel-add-${type.toLowerCase()}`);
    const saveBtn = document.getElementById(`save-add-${type.toLowerCase()}`);
    const suggestionsDiv = document.getElementById('add-modal-suggestions');
    const warningDiv = document.getElementById('similarity-warning');
    const similarEntriesDiv = document.getElementById('similar-entries');

    // Focus on input
    setTimeout(() => nameInput.focus(), 100);

    // Setup real-time search
    let searchTimeout;
    nameInput.addEventListener('input', async (e) => {
      clearTimeout(searchTimeout);
      const query = e.target.value.trim();
      
      if (query.length >= 2) {
        searchTimeout = setTimeout(async () => {
          await this.showAddModalSuggestions(type, query, suggestionsDiv, warningDiv, similarEntriesDiv, nameInput);
        }, 300); // Debounce 300ms
      } else {
        this.hideAddModalSuggestions(suggestionsDiv, warningDiv);
      }
    });

    // Handle save
    const handleSave = async () => {
      const name = nameInput.value.trim();
      if (name) {
        // Disable button during save
        saveBtn.disabled = true;
        saveBtn.textContent = 'Adding...';
        
        try {
          const result = await onAdd(name);
          // Only close modal if callback doesn't return false
          if (result !== false) {
            modal.remove();
          } else {
            // Re-enable button if modal should stay open
            saveBtn.disabled = false;
            saveBtn.textContent = `Add ${type}`;
          }
        } catch (error) {
          console.error(`❌ Error adding ${type.toLowerCase()}:`, error);
          // Re-enable button on error
          saveBtn.disabled = false;
          saveBtn.textContent = `Add ${type}`;
          nameInput.style.borderColor = '#dc3545';
          setTimeout(() => nameInput.style.borderColor = '', 2000);
        }
      } else {
        nameInput.focus();
        nameInput.style.borderColor = '#dc3545';
        setTimeout(() => nameInput.style.borderColor = '', 2000);
      }
    };

    // Event listeners
    saveBtn.addEventListener('click', handleSave);
    cancelBtn.addEventListener('click', () => modal.remove());
    nameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    return modal;
  }

  /**
   * Refresh builder dropdowns with new data
   */
  async refreshBuilderDropdowns() {
    try {
      const builders = await leadTracker.getBuilderList();
      const builderOptions = builders.map(builder => 
        `<option value="${builder}">${builder}</option>`
      ).join('');

      // Update all builder dropdowns
      const selects = ['builder-name-select', 'referral-builder-select'];
      selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
          const currentValue = select.value;
          const firstOption = select.querySelector('option[value=""]');
          const otherOption = '<option value="Other">Other (specify below)</option>';
          select.innerHTML = (firstOption ? firstOption.outerHTML : '<option value="">Select builder...</option>') + builderOptions + otherOption;
          if (currentValue && currentValue !== 'Loading...') select.value = currentValue;
        }
      });
    } catch (error) {
      console.error('❌ Error refreshing builder dropdowns:', error);
    }
  }

  /**
   * Refresh merchant dropdowns with new data
   */
  async refreshMerchantDropdowns() {
    try {
      const merchants = await leadTracker.getMerchantList();
      const merchantOptions = merchants.map(merchant => 
        `<option value="${merchant}">${merchant}</option>`
      ).join('');

      // Update all merchant dropdowns
      const selects = ['merchant-name-select', 'referral-merchant-select'];
      selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
          const currentValue = select.value;
          const firstOption = select.querySelector('option[value=""]');
          const otherOption = '<option value="Other">Other (specify below)</option>';
          select.innerHTML = (firstOption ? firstOption.outerHTML : '<option value="">Select merchant...</option>') + merchantOptions + otherOption;
          if (currentValue && currentValue !== 'Loading...') select.value = currentValue;
        }
      });
    } catch (error) {
      console.error('❌ Error refreshing merchant dropdowns:', error);
    }
  }

  /**
   * Load builder and merchant options from server
   */
  async loadBuilderMerchantOptions(step) {
    try {
      // Show loading indicators
      this.showLoadingIndicators(step);
      
      // Load builders and merchants in parallel
      const [builders, merchants] = await Promise.all([
        leadTracker.getBuilderList(),
        leadTracker.getMerchantList()
      ]);
      
      // Update dropdowns
      this.updateBuilderDropdowns(builders);
      this.updateMerchantDropdowns(merchants);
      
      // Hide loading indicators
      this.hideLoadingIndicators(step);
      
      // Setup real-time search for "Other" inputs
      this.setupSearchInputs();
      
      console.log(`📋 Loaded ${builders.length} builders and ${merchants.length} merchants for step ${step}`);
    } catch (error) {
      console.error('❌ Error loading builder/merchant options:', error);
      this.hideLoadingIndicators(step);
    }
  }

  /**
   * Show loading indicators for dropdowns
   */
  showLoadingIndicators(step) {
    const selects = [];
    if (step === 1) {
      selects.push('builder-name-select', 'merchant-name-select');
    } else if (step === 2) {
      selects.push('referral-builder-select', 'referral-merchant-select');
    }
    
    selects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (select) {
        select.innerHTML = '<option value="">Loading...</option>';
        select.disabled = true;
      }
    });
  }

  /**
   * Hide loading indicators for dropdowns
   */
  hideLoadingIndicators(step) {
    const selects = [];
    if (step === 1) {
      selects.push('builder-name-select', 'merchant-name-select');
    } else if (step === 2) {
      selects.push('referral-builder-select', 'referral-merchant-select');
    }
    
    selects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (select) {
        select.disabled = false;
      }
    });
  }

  /**
   * Update builder dropdowns with new data
   */
  updateBuilderDropdowns(builders) {
    const builderOptions = builders.map(builder => 
      `<option value="${builder}">${builder}</option>`
    ).join('');

    // Update all builder dropdowns
    const selects = ['builder-name-select', 'referral-builder-select'];
    selects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (select) {
        const currentValue = select.value;
        const firstOption = select.querySelector('option[value=""]');
        const otherOption = '<option value="Other">Other (specify below)</option>';
        select.innerHTML = (firstOption ? firstOption.outerHTML : '<option value="">Select builder...</option>') + builderOptions + otherOption;
        if (currentValue && currentValue !== 'Loading...') select.value = currentValue;
      }
    });
  }

  /**
   * Update merchant dropdowns with new data
   */
  updateMerchantDropdowns(merchants) {
    const merchantOptions = merchants.map(merchant => 
      `<option value="${merchant}">${merchant}</option>`
    ).join('');

    // Update all merchant dropdowns
    const selects = ['merchant-name-select', 'referral-merchant-select'];
    selects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (select) {
        const currentValue = select.value;
        const firstOption = select.querySelector('option[value=""]');
        const otherOption = '<option value="Other">Other (specify below)</option>';
        select.innerHTML = (firstOption ? firstOption.outerHTML : '<option value="">Select merchant...</option>') + merchantOptions + otherOption;
        if (currentValue && currentValue !== 'Loading...') select.value = currentValue;
      }
    });
  }

  /**
   * Setup real-time search for builder/merchant inputs
   */
  setupSearchInputs() {
    // Setup search for "Other" text inputs
    const searchInputs = [
      { id: 'builder-other-name', type: 'builder' },
      { id: 'merchant-other-name', type: 'merchant' }
    ];
    
    searchInputs.forEach(({ id, type }) => {
      const input = document.getElementById(id);
      if (input) {
        let searchTimeout;
        
        input.addEventListener('input', (e) => {
          clearTimeout(searchTimeout);
          const query = e.target.value.trim();
          
          if (query.length >= 2) {
            searchTimeout = setTimeout(async () => {
              await this.performSearch(query, type, input);
            }, 300); // Debounce 300ms
          } else {
            this.hideSearchSuggestions(input);
          }
        });
        
        // Hide suggestions when input loses focus
        input.addEventListener('blur', () => {
          setTimeout(() => this.hideSearchSuggestions(input), 200);
        });
      }
    });
  }

  /**
   * Perform real-time search and show suggestions
   */
  async performSearch(query, type, input) {
    try {
      const results = type === 'builder' 
        ? await leadTracker.searchBuilders(query)
        : await leadTracker.searchMerchants(query);
      
      this.showSearchSuggestions(input, results, query);
    } catch (error) {
      console.error(`❌ Error searching ${type}s:`, error);
    }
  }

  /**
   * Show search suggestions dropdown
   */
  showSearchSuggestions(input, results, query) {
    // Remove existing suggestions
    this.hideSearchSuggestions(input);
    
    if (results.length === 0) return;
    
    const suggestions = document.createElement('div');
    suggestions.className = 'search-suggestions';
    suggestions.style.cssText = `
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 4px 4px;
      max-height: 150px;
      overflow-y: auto;
      z-index: 1000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;
    
    // Add exact match indicator
    const exactMatch = results.find(r => r.toLowerCase() === query.toLowerCase());
    if (exactMatch) {
      const exactDiv = document.createElement('div');
      exactDiv.className = 'suggestion-item exact-match';
      exactDiv.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        background-color: #e8f5e8;
        border-bottom: 1px solid #ddd;
        font-weight: bold;
      `;
      exactDiv.textContent = `✓ ${exactMatch} (exact match)`;
      exactDiv.addEventListener('click', () => {
        input.value = exactMatch;
        this.hideSearchSuggestions(input);
      });
      suggestions.appendChild(exactDiv);
    }
    
    // Add other suggestions
    results.slice(0, 5).forEach(result => {
      if (exactMatch && result.toLowerCase() === query.toLowerCase()) return;
      
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      div.style.cssText = `
        padding: 8px 12px;
        cursor: pointer;
        border-bottom: 1px solid #eee;
      `;
      div.textContent = result;
      
      div.addEventListener('mouseenter', () => {
        div.style.backgroundColor = '#f5f5f5';
      });
      div.addEventListener('mouseleave', () => {
        div.style.backgroundColor = 'white';
      });
      div.addEventListener('click', () => {
        input.value = result;
        this.hideSearchSuggestions(input);
      });
      
      suggestions.appendChild(div);
    });
    
    // Position relative to input
    input.parentNode.style.position = 'relative';
    input.parentNode.appendChild(suggestions);
  }

  /**
   * Hide search suggestions
   */
  hideSearchSuggestions(input) {
    const existing = input.parentNode.querySelector('.search-suggestions');
    if (existing) {
      existing.remove();
    }
  }

  /**
   * Show duplicate detection modal
   */
  showDuplicateModal(type, existingName, onUseExisting) {
    const modalHTML = `
      <div id="duplicate-${type.toLowerCase()}-modal" class="modal" style="display: block; z-index: 1200;">
        <div class="modal-content" style="max-width: 450px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 48px; color: #ff9800; margin-bottom: 10px;">⚠️</div>
            <h3 style="margin: 0; color: #333;">${type} Already Exists</h3>
          </div>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; text-align: center; font-size: 16px;">
              <strong>"${existingName}"</strong> is already in the ${type.toLowerCase()} list.
            </p>
          </div>
          
          <div style="text-align: center; margin-bottom: 20px; color: #666;">
            Would you like to use the existing ${type.toLowerCase()} or try a different name?
          </div>
          
          <div class="modal-actions">
            <button type="button" id="duplicate-try-again" class="secondary-btn">Try Different Name</button>
            <button type="button" id="duplicate-use-existing" class="primary-btn">Use "${existingName}"</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modal = document.getElementById(`duplicate-${type.toLowerCase()}-modal`);
    const tryAgainBtn = document.getElementById('duplicate-try-again');
    const useExistingBtn = document.getElementById('duplicate-use-existing');

    // Handle try again (just close duplicate modal)
    tryAgainBtn.onclick = () => {
      modal.remove();
    };

    // Handle use existing
    useExistingBtn.onclick = () => {
      modal.remove();
      
      // Close the add modal
      const addModal = document.querySelector(`[id*="add-${type.toLowerCase()}-modal"]`);
      if (addModal) {
        addModal.remove();
      }
      
      // Call the callback to select existing item
      if (onUseExisting) {
        onUseExisting();
      }
    };

    // Close on outside click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // Focus on "Use Existing" button
    setTimeout(() => useExistingBtn.focus(), 100);
  }

  /**
   * Show suggestions and similarity warnings in add modal
   */
  async showAddModalSuggestions(type, query, suggestionsDiv, warningDiv, similarEntriesDiv, nameInput) {
    try {
      // Search for existing entries
      const results = type === 'Builder' 
        ? await leadTracker.searchBuilders(query)
        : await leadTracker.searchMerchants(query);
      
      // Check for exact match
      const exactMatch = results.find(r => r.toLowerCase() === query.toLowerCase());
      
      // Check for similar matches (fuzzy matching)
      const similarMatches = this.findSimilarEntries(query, results);
      
      if (exactMatch) {
        // Show exact match warning
        this.showSimilarityWarning(warningDiv, similarEntriesDiv, [exactMatch], 'exact');
        this.hideAddModalSuggestions(suggestionsDiv);
      } else if (similarMatches.length > 0) {
        // Show similarity warning
        this.showSimilarityWarning(warningDiv, similarEntriesDiv, similarMatches, 'similar');
        this.showAddModalSuggestionsDropdown(suggestionsDiv, results.slice(0, 5), nameInput);
      } else if (results.length > 0) {
        // Show regular suggestions
        this.hideAddModalSuggestions(null, warningDiv);
        this.showAddModalSuggestionsDropdown(suggestionsDiv, results.slice(0, 5), nameInput);
      } else {
        // No matches
        this.hideAddModalSuggestions(suggestionsDiv, warningDiv);
      }
    } catch (error) {
      console.error(`❌ Error searching ${type.toLowerCase()}s:`, error);
      this.hideAddModalSuggestions(suggestionsDiv, warningDiv);
    }
  }

  /**
   * Find similar entries using fuzzy matching
   */
  findSimilarEntries(query, allEntries) {
    const queryLower = query.toLowerCase();
    const similarEntries = [];
    
    allEntries.forEach(entry => {
      const entryLower = entry.toLowerCase();
      
      // Skip exact matches (handled separately)
      if (entryLower === queryLower) return;
      
      // Check for various similarity patterns
      const similarity = this.calculateSimilarity(queryLower, entryLower);
      
      if (similarity > 0.6) { // 60% similarity threshold
        similarEntries.push({ entry, similarity });
      }
    });
    
    // Sort by similarity (highest first) and return just the entries
    return similarEntries
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3) // Top 3 similar entries
      .map(item => item.entry);
  }

  /**
   * Calculate similarity between two strings
   */
  calculateSimilarity(str1, str2) {
    // Simple similarity calculation
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    // Check if one contains the other
    if (longer.includes(shorter)) return 0.8;
    if (shorter.includes(longer)) return 0.8;
    
    // Check for common words
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    
    if (commonWords.length > 0) {
      return 0.7; // High similarity for common words
    }
    
    // Levenshtein distance for character-level similarity
    return (longer.length - this.levenshteinDistance(str1, str2)) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Show similarity warning
   */
  showSimilarityWarning(warningDiv, similarEntriesDiv, entries, type) {
    const warningText = type === 'exact' 
      ? 'This entry already exists:'
      : 'Similar entries found:';
    
    const entriesHTML = entries.map(entry => 
      `<span class="similar-entry">"${entry}"</span>`
    ).join(', ');
    
    similarEntriesDiv.innerHTML = entriesHTML;
    warningDiv.style.display = 'block';
  }

  /**
   * Show suggestions dropdown in add modal
   */
  showAddModalSuggestionsDropdown(suggestionsDiv, results, nameInput) {
    if (results.length === 0) {
      suggestionsDiv.style.display = 'none';
      return;
    }
    
    suggestionsDiv.innerHTML = '';
    suggestionsDiv.style.display = 'block';
    
    results.forEach(result => {
      const div = document.createElement('div');
      div.className = 'suggestion-item';
      div.textContent = result;
      
      div.addEventListener('click', () => {
        nameInput.value = result;
        this.hideAddModalSuggestions(suggestionsDiv);
        nameInput.focus();
      });
      
      suggestionsDiv.appendChild(div);
    });
  }

  /**
   * Hide add modal suggestions and warnings
   */
  hideAddModalSuggestions(suggestionsDiv, warningDiv) {
    if (suggestionsDiv) {
      suggestionsDiv.style.display = 'none';
    }
    if (warningDiv) {
      warningDiv.style.display = 'none';
    }
  }
}

// Create singleton instance
export const leadWizard = new LeadWizard();
