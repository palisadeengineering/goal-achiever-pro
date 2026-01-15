/**
 * Email validation utilities to prevent bounced emails
 * Validates format, blocks disposable domains, and catches common typos
 */

// Common disposable email domains that cause high bounce rates
const DISPOSABLE_DOMAINS = new Set([
  // Most common disposable email services
  'tempmail.com',
  'temp-mail.org',
  'guerrillamail.com',
  'guerrillamail.org',
  'guerrillamail.net',
  'sharklasers.com',
  'mailinator.com',
  'mailinator.net',
  'mailinator.org',
  'throwaway.email',
  'throwawaymail.com',
  'fakeinbox.com',
  'fakemailgenerator.com',
  'getnada.com',
  'getairmail.com',
  'dispostable.com',
  '10minutemail.com',
  '10minutemail.net',
  '10minute.email',
  'minutemail.com',
  'tempail.com',
  'tempr.email',
  'discard.email',
  'discardmail.com',
  'spamgourmet.com',
  'mytrashmail.com',
  'trashmail.com',
  'trashmail.net',
  'trash-mail.com',
  'mailnesia.com',
  'mailcatch.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'maildrop.cc',
  'mailsac.com',
  'inboxkitten.com',
  'mohmal.com',
  'tempinbox.com',
  'emailondeck.com',
  'burnermail.io',
  'harakirimail.com',
  'spamex.com',
  'mailnull.com',
  'e4ward.com',
  'spamfree24.org',
  'jetable.org',
  'meltmail.com',
  'dodgeit.com',
  'deadaddress.com',
  'sogetthis.com',
  'spamavert.com',
  'veryrealemail.com',
  'nobulk.com',
  'devnull.email',
  'mailslurp.com',
  'crazymailing.com',
  'tempmailaddress.com',
  'emailfake.com',
  'fakemail.net',
  'anonymbox.com',
  'binkmail.com',
  'bobmail.info',
  'chammy.info',
  'mailexpire.com',
  'mailmoat.com',
  'mailzilla.org',
  'nomail.xl.cx',
  'nospamfor.us',
  'nowmymail.com',
  'pookmail.com',
  'shortmail.net',
  'sneakemail.com',
  'spam.la',
  'spambox.us',
  'spamcannon.net',
  'spamherelots.com',
  'spamthis.co.uk',
  'tempomail.fr',
  'thankyou2010.com',
  'willselfdestruct.com',
  'xagloo.com',
]);

// Common email domain typos and their corrections
const DOMAIN_TYPO_SUGGESTIONS: Record<string, string> = {
  // Gmail typos
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmali.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gmail.om': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmailcom': 'gmail.com',
  'g]mail.com': 'gmail.com',
  // Outlook/Hotmail typos
  'outlok.com': 'outlook.com',
  'outook.com': 'outlook.com',
  'outlool.com': 'outlook.com',
  'outlook.cm': 'outlook.com',
  'hotmal.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotamil.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmail.cm': 'hotmail.com',
  'hotmail.co': 'hotmail.com',
  // Yahoo typos
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'yaoo.com': 'yahoo.com',
  'yahoo.cm': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  // iCloud typos
  'icoud.com': 'icloud.com',
  'iclod.com': 'icloud.com',
  'icluod.com': 'icloud.com',
  'icloud.cm': 'icloud.com',
  // ProtonMail typos
  'protonmai.com': 'protonmail.com',
  'protonmal.com': 'protonmail.com',
  'protommail.com': 'protonmail.com',
};

// Valid TLDs for basic validation (most common ones)
const COMMON_TLDS = new Set([
  'com', 'org', 'net', 'edu', 'gov', 'io', 'co', 'us', 'uk', 'ca', 'au', 'de',
  'fr', 'es', 'it', 'nl', 'be', 'ch', 'at', 'se', 'no', 'dk', 'fi', 'pl', 'cz',
  'ru', 'jp', 'cn', 'kr', 'in', 'br', 'mx', 'ar', 'za', 'nz', 'sg', 'hk', 'tw',
  'ie', 'pt', 'gr', 'hu', 'ro', 'bg', 'hr', 'sk', 'si', 'lt', 'lv', 'ee', 'is',
  'info', 'biz', 'me', 'tv', 'cc', 'ws', 'ai', 'app', 'dev', 'tech', 'online',
  'site', 'xyz', 'club', 'email', 'pro', 'cloud', 'digital', 'agency', 'store',
]);

export interface EmailValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
}

/**
 * Validates email format using a robust regex
 */
function isValidEmailFormat(email: string): boolean {
  // RFC 5322 compliant email regex (simplified but robust)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
}

/**
 * Extracts the domain from an email address
 */
function getDomain(email: string): string {
  const parts = email.toLowerCase().split('@');
  return parts.length === 2 ? parts[1] : '';
}

/**
 * Checks if the domain is a disposable email service
 */
function isDisposableDomain(domain: string): boolean {
  return DISPOSABLE_DOMAINS.has(domain.toLowerCase());
}

/**
 * Checks for common domain typos and returns a suggestion
 */
function getTypoSuggestion(domain: string): string | undefined {
  const lowerDomain = domain.toLowerCase();
  return DOMAIN_TYPO_SUGGESTIONS[lowerDomain];
}

/**
 * Validates that the TLD is reasonable
 */
function hasValidTLD(domain: string): boolean {
  const parts = domain.split('.');
  if (parts.length < 2) return false;
  const tld = parts[parts.length - 1].toLowerCase();
  // Accept any TLD that's 2-10 characters (allows for country codes and new TLDs)
  // But flag suspicious single-char or very long TLDs
  return tld.length >= 2 && tld.length <= 10;
}

/**
 * Main email validation function
 * Returns validation result with helpful error messages and suggestions
 */
export function validateEmail(email: string): EmailValidationResult {
  // Trim and lowercase for consistent validation
  const trimmedEmail = email.trim();

  // Check if empty
  if (!trimmedEmail) {
    return {
      isValid: false,
      error: 'Please enter your email address.',
    };
  }

  // Check basic format
  if (!isValidEmailFormat(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address.',
    };
  }

  const domain = getDomain(trimmedEmail);

  // Check for valid TLD
  if (!hasValidTLD(domain)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address with a proper domain.',
    };
  }

  // Check for disposable email domains
  if (isDisposableDomain(domain)) {
    return {
      isValid: false,
      error: 'Please use a permanent email address. Temporary email services are not allowed.',
    };
  }

  // Check for common typos
  const suggestion = getTypoSuggestion(domain);
  if (suggestion) {
    const localPart = trimmedEmail.split('@')[0];
    return {
      isValid: false,
      error: `Did you mean ${localPart}@${suggestion}?`,
      suggestion: `${localPart}@${suggestion}`,
    };
  }

  return {
    isValid: true,
  };
}

/**
 * Quick check if email is valid (for form validation)
 */
export function isValidEmail(email: string): boolean {
  return validateEmail(email).isValid;
}
