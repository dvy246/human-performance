/**
 * CogniArena client-side i18n engine
 * Applies translations to all elements with data-i18n attributes.
 * 
 * Usage in HTML:
 *   <span data-i18n="nav.home">Home Overview</span>
 *   <h1 data-i18n-html="hero.title_1">How powerful</h1>  (allows <strong> tags etc)
 *   <input data-i18n-placeholder="search.placeholder" />
 * 
 * Called automatically on language change and page load.
 */

// @ts-nocheck — runs as inline script
(function() {
  'use strict';

  // Will be populated by inline script in <head> with window.__i18nData
  var translations = window.__i18nData || {};
  var currentLang = localStorage.getItem('language') || 'en';

  function applyTranslations(lang) {
    if (!lang) lang = currentLang;
    currentLang = lang;
    var dict = translations[lang] || translations['en'] || {};
    if (!dict) return;

    // Text content replacements
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-i18n');
      if (dict[key] !== undefined) {
        els[i].textContent = dict[key];
      }
    }

    // HTML content replacements (for strings with <strong> etc)
    var htmlEls = document.querySelectorAll('[data-i18n-html]');
    for (var j = 0; j < htmlEls.length; j++) {
      var htmlKey = htmlEls[j].getAttribute('data-i18n-html');
      if (dict[htmlKey] !== undefined) {
        htmlEls[j].innerHTML = dict[htmlKey];
      }
    }

    // Placeholder replacements
    var phEls = document.querySelectorAll('[data-i18n-placeholder]');
    for (var k = 0; k < phEls.length; k++) {
      var phKey = phEls[k].getAttribute('data-i18n-placeholder');
      if (dict[phKey] !== undefined) {
        phEls[k].setAttribute('placeholder', dict[phKey]);
      }
    }

    // Title replacements
    var titleEls = document.querySelectorAll('[data-i18n-title]');
    for (var m = 0; m < titleEls.length; m++) {
      var titleKey = titleEls[m].getAttribute('data-i18n-title');
      if (dict[titleKey] !== undefined) {
        titleEls[m].setAttribute('title', dict[titleKey]);
      }
    }

    // Update document lang
    document.documentElement.lang = lang;
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('cogniarena:langchange', { detail: { lang: lang } }));
  }

  // Expose globally
  window.__applyTranslations = applyTranslations;
  window.__getCurrentLang = function() { return currentLang; };

  // Apply on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      applyTranslations();
    });
  } else {
    applyTranslations();
  }
})();
