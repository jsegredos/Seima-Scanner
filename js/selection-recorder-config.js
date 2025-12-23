/**
 * Selection Recorder Configuration Helper
 * Provides easy setup and testing functions for the selection recording system
 */

import { selectionRecorder } from './selection-recorder.js';
import { CONFIG } from './config.js';

/**
 * Configure the selection recorder with Google Apps Script URL
 * @param {string} googleSheetsUrl - The deployed Google Apps Script web app URL
 */
export function configureSelectionRecorder(googleSheetsUrl) {
  if (!googleSheetsUrl) {
    console.error('❌ Google Sheets URL is required');
    return false;
  }

  // Update the recorder configuration
  selectionRecorder.configure(googleSheetsUrl);
  
  // Also update the CONFIG for persistence (optional)
  CONFIG.SELECTION_RECORDING.GOOGLE_SHEETS_URL = googleSheetsUrl;
  
  console.log('✅ Selection recorder configured successfully');
  console.log('📊 URL:', googleSheetsUrl);
  
  return true;
}

/**
 * Test the selection recorder connection
 */
export async function testSelectionRecorder() {
  console.log('🧪 Testing selection recorder connection...');
  
  try {
    const result = await selectionRecorder.testConnection();
    
    if (result.success) {
      console.log('✅ Selection recorder test successful!');
      console.log('📊 Your Google Sheets integration is working correctly');
      return true;
    } else {
      console.error('❌ Selection recorder test failed:', result.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Selection recorder test error:', error);
    return false;
  }
}

/**
 * Get current selection recorder status
 */
export function getSelectionRecorderStatus() {
  const status = {
    enabled: selectionRecorder.isEnabled,
    configured: !!selectionRecorder.googleSheetsUrl,
    url: selectionRecorder.googleSheetsUrl ? 'Set' : 'Not set',
    retryAttempts: selectionRecorder.retryAttempts,
    retryDelay: selectionRecorder.retryDelay
  };
  
  console.log('📊 Selection Recorder Status:', status);
  return status;
}

/**
 * Enable or disable selection recording
 */
export function toggleSelectionRecording(enabled = true) {
  selectionRecorder.setEnabled(enabled);
  console.log(`📊 Selection recording ${enabled ? 'enabled' : 'disabled'}`);
  return enabled;
}

/**
 * Quick setup wizard for console use
 */
export function setupSelectionRecorder() {
  console.log(`
🚀 SEIMA SELECTION RECORDER SETUP
================================

Follow these steps to set up selection recording:

1. Create a Google Sheet with the column headers from SELECTION-RECORDING-SETUP.md
2. Create a Google Apps Script (Extensions > Apps Script)
3. Deploy as a Web App with "Anyone" access
4. Copy the deployment URL
5. Run: configureSelectionRecorder('YOUR_URL_HERE')
6. Test with: testSelectionRecorder()

Current status:
`);
  
  getSelectionRecorderStatus();
  
  console.log(`
Need help? Check SELECTION-RECORDING-SETUP.md for detailed instructions.
  `);
}

// Make functions available globally for easy console access
if (typeof window !== 'undefined') {
  window.configureSelectionRecorder = configureSelectionRecorder;
  window.testSelectionRecorder = testSelectionRecorder;
  window.getSelectionRecorderStatus = getSelectionRecorderStatus;
  window.toggleSelectionRecording = toggleSelectionRecording;
  window.setupSelectionRecorder = setupSelectionRecorder;
}
