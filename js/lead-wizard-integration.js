/**
 * Lead Wizard Integration
 * Integrates the lead tracking wizard with the existing email flow
 */

import { leadWizard } from './lead-wizard.js';
import { leadTracker } from './lead-tracker.js';

export class LeadWizardIntegration {
  constructor() {
    this.originalEmailHandler = null;
    this.isIntegrated = false;
  }

  /**
   * Initialize the integration
   */
  init() {
    if (this.isIntegrated) return;
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupIntegration());
    } else {
      this.setupIntegration();
    }
    
    this.isIntegrated = true;
  }

  /**
   * Setup the integration with existing email flow
   */
  setupIntegration() {
    console.log('🔍 Setting up lead wizard integration...');
    
    // Use event delegation to catch clicks on the email button
    // This works even if the button is added dynamically and prevents conflicts
    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'quick-pdf-btn') {
        console.log('🧙‍♂️ Lead wizard intercepted email button click via event delegation!');
        e.preventDefault();
        e.stopPropagation();
        this.showLeadWizardFlow();
        return false;
      }
    }, true); // Use capture phase to intercept before other handlers
    
    console.log('✅ Lead wizard integrated with event delegation');
    
    // Set up direct integration after a delay to ensure button exists
    setTimeout(() => this.setupDirectIntegration(), 1000);
  }

  /**
   * Set up direct button integration as backup
   */
  setupDirectIntegration() {
    const emailButton = document.getElementById('quick-pdf-btn');
    
    if (emailButton) {
      console.log('📧 Email button found - ensuring direct integration');
      
      // Clear any existing onclick handler to prevent conflicts
      emailButton.onclick = null;
      
      // Set our handler as the direct onclick
      emailButton.onclick = (e) => {
        console.log('🧙‍♂️ Lead wizard direct handler triggered!');
        e.preventDefault();
        e.stopPropagation();
        this.showLeadWizardFlow();
        return false;
      };
      
      console.log('✅ Direct integration set up successfully');
    } else {
      console.log('📧 Email button not found - event delegation will handle it');
    }
  }

  /**
   * Show the lead wizard flow
   */
  showLeadWizardFlow() {
    console.log('🧙‍♂️ Starting lead wizard flow...');

    // Always start from a completely clean slate for customer data:
    // 1) Clear any existing lead data (including anything saved from a prior session)
    // 2) User then enters fresh data
    // 3) Data will be cleared again after email is sent (handled by email service)
    this.clearCurrentLeadData();

    console.log('📧 Integration status:', {
      isIntegrated: this.isIntegrated,
      timestamp: new Date().toISOString()
    });
    
    // Always show the wizard/form to allow user to review/edit before sending
    // Reset to step 1 to always start from the beginning
    leadTracker.currentStep = 1;
    
    // The wizard will automatically pre-populate with existing data if available
    console.log('🧙‍♂️ Showing lead wizard...');
    // Show the lead wizard
    leadWizard.show(
      (leadData) => this.onLeadWizardComplete(leadData),
      () => this.onLeadWizardCancel()
    );
  }

  /**
   * Check if we have complete lead data
   */
  hasCompleteLeadData(data) {
    return data.customerName && 
           data.customerEmail && 
           data.projectName &&
           data.customerType && 
           data.hearAboutUs.length > 0;
  }

  /**
   * Handle lead wizard completion
   */
  onLeadWizardComplete(leadData) {
    console.log('📊 Lead data collected:', leadData);
    
    // Store the lead data for later use in email/recording
    window.currentLeadData = leadData;
    
    // Create userDetails object from lead data (Step 1 has all the info we need)
    const userDetails = {
      name: leadData.customerName,
      email: leadData.customerEmail,
      phone: leadData.customerPhone,
      project: leadData.projectName,
      address: leadData.projectAddress,
      excludePrice: leadData.excludePrice,
      exportCsv: leadData.exportCsv,
      sendEmail: true,
      leadData: leadData // Include full lead data for recording
    };
    
    console.log('📧 Proceeding directly to PDF generation and email with:', userDetails);
    
    // Generate and send PDF directly without showing email form
    this.generateAndSendPDFDirectly(userDetails);
  }

  /**
   * Handle lead wizard cancellation
   */
  onLeadWizardCancel() {
    console.log('📊 Lead wizard cancelled');
    // Don't proceed to email form
  }

  /**
   * Proceed to the original email form (DEPRECATED - now goes directly to PDF generation)
   */
  proceedToEmailForm() {
    console.log('📧 proceedToEmailForm called - this should not happen anymore');
    console.log('📧 Wizard should go directly to PDF generation instead');
    
    // This method should not be called anymore since we bypass the email form
    // If it is called, it means there's still old code triggering it
    console.warn('⚠️ proceedToEmailForm was called - this indicates a code path that needs updating');
  }

  /**
   * Show email modal directly as fallback (DEPRECATED)
   */
  showEmailModalDirectly() {
    console.log('📧 showEmailModalDirectly called - this should not happen anymore');
    console.warn('⚠️ Email modal should not be shown - wizard goes directly to PDF generation');
    
    // Do not show the email modal anymore
    // The wizard should handle everything and go directly to PDF generation
  }

  /**
   * Populate email form with lead data from wizard
   */
  populateEmailFormWithLeadData() {
    const leadData = leadTracker.getLeadData();
    console.log('📧 Populating email form with lead data:', leadData);
    
    // Populate customer information from Step 1
    if (leadData.customerName) {
      const nameField = document.getElementById('user-name');
      if (nameField) nameField.value = leadData.customerName;
    }
    
    if (leadData.customerEmail) {
      const emailField = document.getElementById('user-email');
      if (emailField) emailField.value = leadData.customerEmail;
    }
    
    if (leadData.customerPhone) {
      const phoneField = document.getElementById('user-telephone');
      if (phoneField) phoneField.value = leadData.customerPhone;
    }
    
    if (leadData.projectName) {
      const projectField = document.getElementById('user-project');
      if (projectField) projectField.value = leadData.projectName;
    }
    
    if (leadData.projectAddress) {
      const addressField = document.getElementById('user-address');
      if (addressField) addressField.value = leadData.projectAddress;
    }
    
    // Set checkboxes from Step 1
    if (leadData.excludePrice !== undefined) {
      const excludePriceCheckbox = document.getElementById('exclude-price-checkbox');
      if (excludePriceCheckbox) excludePriceCheckbox.checked = leadData.excludePrice;
    }
    
    if (leadData.exportCsv !== undefined) {
      const exportCsvCheckbox = document.getElementById('export-csv-checkbox');
      if (exportCsvCheckbox) exportCsvCheckbox.checked = leadData.exportCsv;
    }
    
    console.log('✅ Email form populated with lead data');
  }

  /**
   * Setup email form integration to include lead data
   */
  setupEmailFormIntegration() {
    const emailForm = document.getElementById('pdf-email-form');
    if (!emailForm || emailForm.hasLeadIntegration) return;
    
    // Mark as integrated to avoid duplicate setup
    emailForm.hasLeadIntegration = true;
    
    // Store original submit handler
    const originalSubmitHandler = emailForm.onsubmit;
    
    // Replace with enhanced handler
    emailForm.onsubmit = (e) => {
      e.preventDefault();
      
      // Collect form data
      const formData = new FormData(emailForm);
      const userDetails = {
        name: formData.get('user-name'),
        project: formData.get('user-project'),
        address: formData.get('user-address'),
        email: formData.get('user-email'),
        phone: formData.get('user-telephone'),
        excludePrice: formData.has('exclude-price'),
        exportCsv: formData.has('export-csv'),
        sendEmail: true
      };
      
      // Add lead data if available
      if (window.currentLeadData) {
        userDetails.leadData = window.currentLeadData;
      }
      
      // Close the modal
      const emailModal = document.getElementById('pdf-email-modal');
      if (emailModal) {
        emailModal.style.display = 'none';
      }
      
      // Trigger PDF generation with enhanced user details
      this.generatePDFWithLeadData(userDetails);
    };
    
    // Setup cancel button
    const cancelBtn = document.getElementById('pdf-email-cancel');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        const emailModal = document.getElementById('pdf-email-modal');
        if (emailModal) {
          emailModal.style.display = 'none';
        }
      };
    }
  }

  /**
   * Generate and send PDF directly without showing email form
   */
  async generateAndSendPDFDirectly(userDetails) {
    try {
      console.log('📄 Starting direct PDF generation and email...');
      
      // Use the app service to generate and send PDF
      if (window.appService) {
        await window.appService.generateAndSendPDF(userDetails);
        console.log('✅ PDF generated and email sent successfully');
      } else {
        throw new Error('App service not available');
      }
    } catch (error) {
      console.error('❌ Error in direct PDF generation:', error);
      
      // Show error to user
      alert('There was an error generating and sending your PDF. Please try again.');
    }
  }

  /**
   * Generate PDF with lead data included (legacy method)
   */
  generatePDFWithLeadData(userDetails) {
    // Use app service for PDF generation
    if (window.appService) {
      window.appService.generateAndSendPDF(userDetails);
    } else {
      console.error('Error: App service not available for PDF generation');
      alert('PDF generation service is not available. Please refresh the page and try again.');
    }
  }

  /**
   * Get current lead data for external use
   */
  getCurrentLeadData() {
    return window.currentLeadData || null;
  }

  /**
   * Clear current lead data
   */
  clearCurrentLeadData() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/271cbb43-06c0-4898-a939-268461524d29',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lead-wizard-integration.js:327',message:'clearCurrentLeadData called',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    window.currentLeadData = null;
    leadTracker.clearLeadData();
  }

  /**
   * Show lead wizard manually (for testing or re-entry)
   */
  showLeadWizard() {
    leadWizard.show(
      (leadData) => {
        console.log('📊 Manual lead data entry:', leadData);
        window.currentLeadData = leadData;
      },
      () => {
        console.log('📊 Manual lead entry cancelled');
      }
    );
  }

  /**
   * Setup integration when review screen is loaded
   */
  setupOnReviewScreen() {
    console.log('📧 Setting up integration for review screen...');
    this.tryDirectIntegration();
  }
}

// Create singleton instance
export const leadWizardIntegration = new LeadWizardIntegration();

// Auto-initialize when module loads
leadWizardIntegration.init();

// Make available globally for testing
if (typeof window !== 'undefined') {
  window.leadWizardIntegration = leadWizardIntegration;
}
