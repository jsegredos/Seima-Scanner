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
    // This works even if the button is added dynamically
    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'quick-pdf-btn') {
        console.log('🧙‍♂️ Lead wizard intercepted email button click!');
        e.preventDefault();
        e.stopPropagation();
        this.showLeadWizardFlow();
        return false;
      }
    }, true); // Use capture phase to intercept before other handlers
    
    console.log('✅ Lead wizard integrated with event delegation');
    
    // Also try direct integration as backup
    this.tryDirectIntegration();
  }

  /**
   * Try direct button integration as backup
   */
  tryDirectIntegration() {
    const emailButton = document.getElementById('quick-pdf-btn');
    
    if (emailButton) {
      console.log('📧 Email button found for direct integration:', !!emailButton);
      
      // Store the original click handler
      this.originalEmailHandler = emailButton.onclick;
      console.log('📧 Original handler:', this.originalEmailHandler);
      
      // Replace with our lead wizard flow
      emailButton.onclick = (e) => {
        console.log('🧙‍♂️ Lead wizard direct handler triggered!');
        e.preventDefault();
        this.showLeadWizardFlow();
      };
      
      console.log('✅ Direct integration set up successfully');
    } else {
      // Don't spam the console - only retry a few times
      if (!this.retryCount) this.retryCount = 0;
      this.retryCount++;
      
      if (this.retryCount <= 3) {
        console.log(`📧 Email button not found, retry ${this.retryCount}/3 in 2s...`);
        setTimeout(() => this.tryDirectIntegration(), 2000);
      } else {
        console.log('📧 Email button integration will use event delegation only');
      }
    }
  }

  /**
   * Show the lead wizard flow
   */
  showLeadWizardFlow() {
    console.log('🧙‍♂️ Starting lead wizard flow...');
    
    // Check if we already have lead data from this session
    const existingData = leadTracker.getLeadData();
    console.log('📊 Existing lead data:', existingData);
    
    const hasCompleteData = this.hasCompleteLeadData(existingData);
    console.log('📊 Has complete data:', hasCompleteData);
    
    if (hasCompleteData) {
      console.log('📊 Skipping wizard - using existing data');
      // Skip wizard and go straight to email form
      this.proceedToEmailForm();
    } else {
      console.log('🧙‍♂️ Showing lead wizard...');
      // Show the lead wizard
      leadWizard.show(
        (leadData) => this.onLeadWizardComplete(leadData),
        () => this.onLeadWizardCancel()
      );
    }
  }

  /**
   * Check if we have complete lead data
   */
  hasCompleteLeadData(data) {
    return data.customerType && 
           data.hearAboutUs.length > 0 && 
           data.projectType && 
           data.projectStage;
  }

  /**
   * Handle lead wizard completion
   */
  onLeadWizardComplete(leadData) {
    console.log('📊 Lead data collected:', leadData);
    
    // Store the lead data for later use in email/recording
    window.currentLeadData = leadData;
    
    // Proceed to the email form
    this.proceedToEmailForm();
  }

  /**
   * Handle lead wizard cancellation
   */
  onLeadWizardCancel() {
    console.log('📊 Lead wizard cancelled');
    // Don't proceed to email form
  }

  /**
   * Proceed to the original email form
   */
  proceedToEmailForm() {
    // Call the original handler if available
    if (this.originalEmailHandler) {
      console.log('📧 Calling original email handler');
      try {
        // Call the original handler - it doesn't expect an event parameter
        this.originalEmailHandler();
      } catch (error) {
        console.error('📧 Error calling original handler:', error);
        // Fallback to direct modal display
        this.showEmailModalDirectly();
      }
    } else {
      // Fallback: Show the email modal directly
      console.log('📧 Using fallback email modal display');
      this.showEmailModalDirectly();
    }
    
    // Setup the email form submission if not already done
    this.setupEmailFormIntegration();
  }

  /**
   * Show email modal directly as fallback
   */
  showEmailModalDirectly() {
    const emailModal = document.getElementById('pdf-email-modal');
    if (emailModal) {
      emailModal.style.display = 'block';
      
      // Focus on the first input
      const firstInput = emailModal.querySelector('input');
      if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
      }
    }
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
   * Generate PDF with lead data included
   */
  generatePDFWithLeadData(userDetails) {
    // Import and use the existing PDF generation function
    import('./pdf-generator.js').then(module => {
      module.showPdfFormScreen(userDetails);
    }).catch(error => {
      console.error('Error loading PDF generator:', error);
      
      // Fallback to app service if available
      if (window.appService) {
        window.appService.generateAndSendPDF(userDetails);
      }
    });
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
