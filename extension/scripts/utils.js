'use strict';

/**
 * Check if a string is null, empty or only made of white space characters.
 * @param {string} input - Text to evaluate
 * @returns {boolean} - String nullity state
 */
function isNullOrWhitespace(input) {
  return !input || !input.trim();
}

/**
 * Remove extra content from URL.
 * @param {string} urlString - URL to clean
 * @returns {string} - Refined URL
 */
function cleanURL(urlString) {
  const url = new URL(urlString);
  return url.protocol + '//' + url.hostname + url.port + url.pathname;
}

/**
 * Display local storage content in console.
 * Handy when working in console.
 */
function getLocalStorage() {
  chrome.storage.local.get(null, data => {
    console.groupCollapsed('store.local');
    console.log(data);
    console.groupEnd();
  });
}
