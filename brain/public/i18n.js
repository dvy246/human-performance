/**
 * CogniArena client-side i18n engine
 * Applies translations to all elements with data-i18n attributes.
 *
 * Usage in HTML:
 *   <span data-i18n="nav.home">Home Overview</span>
 *   <h1 data-i18n-html="hero.title_1">How powerful</h1>  (allows <strong> tags etc)
 *   <input data-i18n-placeholder="search.placeholder" />
 *
 * Loads translations asynchronously on demand / interaction to keep initial HTML lightweight.
 */

// @ts-nocheck — runs as inline script
(function () {
  'use strict';

  // SEC-04: Allowlisted HTML tags for data-i18n-html elements.
  // Only inline formatting tags are permitted — no event handlers or attributes.
  var ALLOWED_HTML_TAGS = { 'strong': 1, 'em': 1, 'b': 1, 'i': 1, 'br': 1, 'span': 1 };

  /**
   * Sanitize an HTML string to only allow known-safe inline tags.
   * Strips all attributes (including event handlers) and disallowed elements.
   */
  function sanitizeHtml(html) {
    var div = document.createElement('div');
    div.innerHTML = html;

    function clean(node) {
      var children = Array.from(node.childNodes);
      for (var idx = 0; idx < children.length; idx++) {
        var child = children[idx];
        if (child.nodeType === 1) { // Element node
          var tag = child.tagName.toLowerCase();
          if (!ALLOWED_HTML_TAGS[tag]) {
            // Replace disallowed element with its text content
            node.replaceChild(document.createTextNode(child.textContent), child);
          } else {
            // Strip ALL attributes (removes onclick, onerror, style, href, etc.)
            var attrs = Array.from(child.attributes);
            for (var a = 0; a < attrs.length; a++) {
              child.removeAttribute(attrs[a].name);
            }
            clean(child);
          }
        }
      }
    }

    clean(div);
    return div.innerHTML;
  }

  var translations = window.__i18nData || null;
  var fetchPromise = null;

  function getPathLang() {
    if (typeof window === 'undefined') return 'en';
    var match = window.location.pathname.match(/^\/(es|fr|de|pt|ja)(\/|$)/);
    if (match) return match[1];
    return 'en';
  }

  var currentLang = getPathLang();

  /**
   * Fetch translations JSON asynchronously on demand.
   */
  function loadTranslations(callback) {
    if (translations) {
      if (callback) callback(translations);
      return Promise.resolve(translations);
    }
    if (!fetchPromise) {
      fetchPromise = fetch('/locales/translations.json')
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP error ' + res.status);
          return res.json();
        })
        .then(function (data) {
          translations = data;
          window.__i18nData = data;
          return data;
        })
        .catch(function (err) {
          console.warn('[i18n] Failed to load translations:', err);
          return {};
        });
    }
    return fetchPromise.then(function (data) {
      if (callback) callback(data);
      return data;
    });
  }

  function doApply(lang) {
    var dict = (translations && (translations[lang] || translations['en'])) || {};
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
    // SEC-04: Sanitize HTML to prevent XSS if translation data is ever modified
    var htmlEls = document.querySelectorAll('[data-i18n-html]');
    for (var j = 0; j < htmlEls.length; j++) {
      var htmlKey = htmlEls[j].getAttribute('data-i18n-html');
      if (dict[htmlKey] !== undefined) {
        htmlEls[j].innerHTML = sanitizeHtml(dict[htmlKey]);
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

  function applyTranslations(lang) {
    if (!lang) lang = getPathLang();
    currentLang = lang;
    try {
      localStorage.setItem('language', lang);
    } catch (e) {}
    document.documentElement.lang = lang;

    if (translations) {
      doApply(lang);
      return Promise.resolve();
    }
    return loadTranslations(function () {
      doApply(lang);
    });
  }

  // Preload on first user interaction or idle callback
  function schedulePreload() {
    var interactionEvents = ['pointerdown', 'keydown', 'touchstart'];
    function onInteract() {
      interactionEvents.forEach(function (evt) {
        window.removeEventListener(evt, onInteract);
      });
      loadTranslations();
    }
    interactionEvents.forEach(function (evt) {
      window.addEventListener(evt, onInteract, { once: true, passive: true });
    });

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(function () { loadTranslations(); }, { timeout: 3000 });
    } else {
      setTimeout(function () { loadTranslations(); }, 2000);
    }
  }

  // Expose globally
  window.__applyTranslations = applyTranslations;
  window.__loadTranslations = loadTranslations;
  window.__getCurrentLang = function () { return currentLang; };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', schedulePreload);
  } else {
    schedulePreload();
  }
})();
