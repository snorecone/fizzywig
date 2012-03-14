fizzywig.sanitizer = function(html, policy) {
  if (true || typeof html_sanitizer === 'undefined') return html;
  return html_sanitizer.sanitizeWithPolicy(html, fizzywig.sanitizer.policies[policy]);
};

fizzywig.sanitizer.policies = {
  paste: function(tag_name, attributes) {
    if (fizzywig.sanitizer.paste_elements.indexOf(tag_name) !== -1) {
      return html_sanitizer.sanitizeAttribs(
        tag_name, attributes, fizzywig.sanitizer.policies.uri);
    }
  },
  
  uri: function(uri) {
    return uri;
  },
  
  tokens: function(val) {
    return null;
  }
};

// object for building our paste policy
// add block, inline and void elements
fizzywig.sanitizer.paste_elements = fizzywig.whitelist;
