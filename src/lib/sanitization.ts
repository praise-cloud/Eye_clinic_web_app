/**
 * Input sanitization utilities for security
 * Prevents XSS and injection attacks by cleaning user inputs
 */

/**
 * Sanitize text input for database queries
 * Removes potentially dangerous characters and patterns
 */
export function sanitizeSearchInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    // Remove SQL injection patterns
    .replace(/['"\\;]/g, '')
    // Remove script tags and event handlers
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Limit length to prevent DoS
    .slice(0, 100);
}

/**
 * Sanitize text input for display
 * Allows basic formatting but removes dangerous elements
 */
export function sanitizeTextInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    // Remove script tags and event handlers
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+\s*=/gi, '')
    // Remove dangerous HTML tags
    .replace(/<(script|iframe|object|embed|form|input|button)[^>]*>/gi, '')
    // Limit length
    .slice(0, 1000);
}

/**
 * Validate and sanitize email addresses
 */
export function sanitizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return '';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmed = email.trim().toLowerCase().slice(0, 254); // RFC 5321 limit
  
  return emailRegex.test(trimmed) ? trimmed : '';
}

/**
 * Validate and sanitize phone numbers
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  
  // Keep only digits, plus, spaces, hyphens, and parentheses
  return phone
    .replace(/[^\d\+\s\-\(\)]/g, '')
    .trim()
    .slice(0, 20);
}

/**
 * Validate and sanitize names (first name, last name, etc.)
 */
export function sanitizeName(name: string): string {
  if (!name || typeof name !== 'string') return '';
  
  // Allow letters, spaces, hyphens, apostrophes, and periods
  return name
    .replace(/[^a-zA-Z\s\-\.'\u00C0-\u017F]/g, '') // Include accented characters
    .trim()
    .slice(0, 100);
}

/**
 * Validate and sanitize patient numbers
 */
export function sanitizePatientNumber(number: string): string {
  if (!number || typeof number !== 'string') return '';
  
  // Allow alphanumeric characters, hyphens, and underscores
  return number
    .replace(/[^a-zA-Z0-9\-_]/g, '')
    .toUpperCase()
    .trim()
    .slice(0, 50);
}

/**
 * Create a safe search query for Supabase
 * Prevents injection in ILIKE queries
 */
export function createSafeSearchQuery(searchTerm: string, fields: string[]): string {
  const sanitized = sanitizeSearchInput(searchTerm);
  if (!sanitized) return '';
  
  // Create safe OR query for multiple fields
  const conditions = fields.map(field => `${field}.ilike.%${sanitized}%`);
  return conditions.join(',');
}
