// Utility functions for the application

/**
 * Formats a date to a human-readable string
 * @param {string|Date} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return '';
  
  const d = new Date(date);
  const now = new Date();
  const diffTime = Math.abs(now - d);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

/**
 * Formats file size to human-readable string
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes) {
  if (!bytes) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Truncates text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 100) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.substring(0, maxLength) + '...';
}

/**
 * Debounce function to limit API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @returns {object} Validation result with score and feedback
 */
export function validatePassword(password) {
  const result = {
    score: 0,
    feedback: [],
    isValid: false
  };
  
  if (!password) {
    result.feedback.push('Password is required');
    return result;
  }
  
  if (password.length >= 8) {
    result.score += 1;
  } else {
    result.feedback.push('Password must be at least 8 characters long');
  }
  
  if (/[a-z]/.test(password)) {
    result.score += 1;
  } else {
    result.feedback.push('Password must contain lowercase letters');
  }
  
  if (/[A-Z]/.test(password)) {
    result.score += 1;
  } else {
    result.feedback.push('Password must contain uppercase letters');
  }
  
  if (/\d/.test(password)) {
    result.score += 1;
  } else {
    result.feedback.push('Password must contain numbers');
  }
  
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.score += 1;
  } else {
    result.feedback.push('Password must contain special characters');
  }
  
  result.isValid = result.score >= 3;
  
  return result;
}

/**
 * Extracts YouTube video ID from URL
 * @param {string} url - YouTube URL
 * @returns {string|null} Video ID or null if invalid
 */
export function extractYouTubeId(url) {
  if (!url) return null;
  
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[7].length === 11) ? match[7] : null;
}

/**
 * Generates a random color for avatars
 * @param {string} seed - Seed for consistent color generation
 * @returns {string} CSS background gradient
 */
export function generateAvatarColor(seed) {
  const colors = [
    'from-blue-500 to-purple-600',
    'from-green-500 to-blue-600',
    'from-purple-500 to-pink-600',
    'from-yellow-500 to-red-600',
    'from-indigo-500 to-purple-600',
    'from-pink-500 to-rose-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-600'
  ];
  
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  const index = Math.abs(hash) % colors.length;
  return `bg-gradient-to-r ${colors[index]}`;
}

/**
 * Copies text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        document.execCommand('copy');
        textArea.remove();
        return true;
      } catch (err) {
        textArea.remove();
        return false;
      }
    }
  } catch (err) {
    return false;
  }
}

/**
 * Converts duration in seconds to readable format
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration (e.g., "2:30", "1:05:30")
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

/**
 * Calculates reading time for text
 * @param {string} text - Text to analyze
 * @param {number} wordsPerMinute - Reading speed (default: 200 WPM)
 * @returns {number} Reading time in minutes
 */
export function calculateReadingTime(text, wordsPerMinute = 200) {
  if (!text) return 0;
  
  const wordCount = text.trim().split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  
  return Math.max(1, readingTime); // Minimum 1 minute
}

/**
 * Formats numbers with appropriate units (K, M, B)
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  if (!num) return '0';
  
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else {
    return num.toString();
  }
}

/**
 * Capitalizes the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Checks if user prefers dark mode
 * @returns {boolean} True if dark mode is preferred
 */
export function prefersDarkMode() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}
