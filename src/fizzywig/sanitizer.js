fizzywig.sanitizer = function(html, policy) {
  if (typeof fizzywig.sanitizer.policies[policy] === 'undefined' || typeof html_sanitizer === 'undefined') return html;
  return html_sanitizer.sanitizeWithPolicy(html, fizzywig.sanitizer.policies[policy]);
};

fizzywig.sanitizer.policies = {};

fizzywig.sanitizer.policies.paste = function(tag_name, attributes) {
  if (fizzywig.sanitizer.paste_elements.indexOf(tag_name) !== -1) {
    return fizzywig.sanitizer.sanitizeAttribs(
      tag_name, attributes, fizzywig.sanitizer.policies.paste.uri, fizzywig.sanitizer.policies.paste.tokens);
  }
};

fizzywig.sanitizer.policies.paste.uri = function(uri) { return uri };
fizzywig.sanitizer.policies.paste.tokens = function(atype, val) {
  if (atype === html4.atype.STYLE) {
    return null
  }
  
  return val;
};

fizzywig.sanitizer.sanitizeAttribs = function(tagName, attribs, opt_uriPolicy, opt_nmTokenPolicy) {
  for (var i = 0; i < attribs.length; i += 2) {
    var attribName = attribs[i];
    var value = attribs[i + 1];
    var atype = null;
    var attribKey = tagName + '::' + attribName;
    var globKey = '*::' + attribName;
    
    if (html4.ATTRIBS.hasOwnProperty(attribKey)) {
      atype = html4.ATTRIBS[attribKey];
    } else if (html4.ATTRIBS.hasOwnProperty(globKey)) {
      atype = html4.ATTRIBS[globKey];
    } else if (fizzywig.sanitizer.allowed_attributes.hasOwnProperty(attribKey)) {
      atype = fizzywig.sanitizer.allowed_attributes[attribKey];
    } else if (fizzywig.sanitizer.allowed_attributes.hasOwnProperty(globKey)) {
      atype = fizzywig.sanitizer.allowed_attributes[globKey];
    }
    
    if (atype !== null) {
      switch (atype) {
        case html4.atype.URI:
          var parsedUri = ('' + value).match(html_sanitizer.URI_SCHEME_RE);
          if (!parsedUri) {
            value = null;
          } else if (!parsedUri[1] ||
              html_sanitizer.WHITELISTED_SCHEMES.test(parsedUri[1])) {
            value = opt_uriPolicy ? opt_uriPolicy(value) : null;
          } else {
            value = null;
          }
          break;
        case html4.atype.URI_FRAGMENT:
          if (value && '#' === value.charAt(0)) {
            value = value.substring(1);  // remove the leading '#'
            value = opt_nmTokenPolicy ? opt_nmTokenPolicy(value) : value;
            if (value !== null && value !== void 0) {
              value = '#' + value;  // restore the leading '#'
            }
          } else {
            value = null;
          }
          break;
        default:
          value = opt_nmTokenPolicy ? opt_nmTokenPolicy(atype, value) : value;
          break;
      }
    } else {
      value = null;
    }
    attribs[i + 1] = value;
  }
  return attribs;
};


// object for building our paste policy
// add block, inline and void elements
fizzywig.sanitizer.paste_elements = fizzywig.whitelist;
fizzywig.sanitizer.allowed_attributes = {
  'iframe::src': 1,
  '*::data-embed-url': 0
};
