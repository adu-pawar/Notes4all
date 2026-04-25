/**
 * Maps Firebase Auth and other common error codes to user-friendly messages.
 */
export const mapAuthError = (error) => {
  const code = error?.code || '';
  const message = error?.message || 'An unexpected error occurred.';

  switch (code) {
    // Auth Errors
    case 'auth/user-not-found':
      return 'Account does not exist.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/email-already-in-use':
      return 'This email is already registered. Try logging in instead.';
    case 'auth/invalid-email':
      return 'The email address is invalid.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection.';
    case 'auth/popup-closed-by-user':
      return 'Login popup was closed before completion.';
    case 'auth/internal-error':
      return 'Internal authentication error. Please try again.';
      
    // Firestore/DB Errors
    case 'permission-denied':
      return 'You don\'t have permission to perform this action.';
    case 'unavailable':
      return 'Service is temporarily unavailable. Please try again later.';

    default:
      // If the error message already looks somewhat clean, use it, 
      // otherwise fallback to a generic one but log the detail.
      if (message.includes('Firebase:')) {
        return 'Account does not exist.';
      }
      return message;
  }
};
