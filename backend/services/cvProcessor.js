/**
 * CV Processor (Shell)
 * 
 * Logic has been moved to the Python CV module and the Frontend client.
 * The backend now only acts as a relay for processed CV results.
 */

function processFrame(session, landmarks, timestamp) {
  // This function is now deprecated in favor of client-side processing (Python/Web).
  // It returns a minimal valid state to avoid breaking old callers if any remain.
  return {
    valid: false,
    message: 'Backend CV processing disabled. Please use the Python CV client or updated Web client.',
  };
}

module.exports = { processFrame };
