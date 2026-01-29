/**
 * Detects if the current device is an iOS mobile device (iPhone, iPad, or iPod)
 * by checking the user agent string.
 *
 * @returns {boolean} True if the device is iOS, false otherwise
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}
