;(function(window, undefined) {

var fizzywig;

fizzywig = {
  version: '0.0.1',
  block_elements: ['p', 'pre', 'Normal', 'Preformatted'],
  inline_elements: ['b', 'i', 'strong', 'em', 'a', 'del', 'strike'],
  void_elements: ['img', 'br', 'hr'],
  whitelist: [
    'a',
    'abbr',
    'acronym',
    'address',
    'area',
    'b',
    'bdo',
    'big',
    'blockquote',
    'br',
    'caption',
    'center',
    'cite',
    'code',
    'colgroup',
    'dd',
    'del',
    'dfn',
    'dir',
    'div',
    'dl',
    'dt',
    'em',
    'embed',
    'font',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'hr',
    'i',
    'img',
    'ins',
    'kbd',
    'li',
    'map',
    'menu',
    'object',
    'ol',
    'p',
    'param',
    'pre',
    'q',
    's',
    'samp',
    'small',
    'span',
    'strike',
    'strong',
    'sub',
    'sup',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'tr',
    'tt',
    'u',
    'ul',
    'var'
  ]
};

// heading levels
[1, 2, 3, 4, 5, 6].forEach(function(i) {
  fizzywig.block_elements.push('Heading ' + i);
  fizzywig.block_elements.push('h' + i);
});

fizzywig.emitter = fizzy_emitter();

function fizzy_emitter() {
  var emitter   = {}
  ,   listeners = {}
  ;
  
  emitter.on = function(events, callback) {
    events = events.split(/\s+/);
    
    events.forEach(function(evt) {
      listeners[evt] = listeners[evt] || [];

      // don't create dupes
      if (listeners[evt].indexOf(callback) === -1) {
        listeners[evt].push(callback);
      }
    });
    
    return emitter;
  };
  
  emitter.off = function(events, callback) {
    events = events.split(/\s+/);
    
    events.forEach(function(evt) {
      if (listeners[evt]) {
        var i = listeners[evt].indexOf(callback);
      
        listeners[evt] = listeners[evt].slice(0, i).concat(listeners[evt].slice(i + 1));
      }
    });
    
    return emitter;
  };
  
  emitter.emit = function(events, args) {
    events = events.split(/\s+/);
    args   = args || [];
    
    var return_vals = {};
    
    events.forEach(function(evt) {
      if (listeners[evt]) {
        return_vals[evt] = [];
        
        listeners[evt].forEach(function(callback) {
          return_vals[evt].push(callback.apply(this, args));
        });
      }
    });
    
    return return_vals;
  };
  
  emitter.clear = function() {
    listeners = {};
    
    return emitter;
  };
  
  return emitter;
}

fizzywig.content = function(selector_or_list) {
  var content  = {}
  ,   node_list
  ,   toolbar
  ,   current_range
  ,   save_timer
  ,   content_tree = {}
  ;
  
  // clear events first
  fizzywig.emitter.clear();
  
  if (typeof selector_or_list === 'string') {
    node_list = document.querySelectorAll(selector_or_list);
  } else if (selector_or_list instanceof NodeList || Array.isArray(selector_or_list)) {
    node_list = selector_or_list;
  }
  
  node_list = Array.prototype.map.apply(node_list, [function(n) {
    return fizzy_contentNode(n, content);
  }]);
  
  content.toolbar = function(tb_selector) {
    if (!arguments.length) return toolbar;
    
    toolbar = fizzy_toolbar(tb_selector, content);
    return content;
  };
  
  content.enable = function() {
    node_list.forEach(function(el) { el.enable() });
    
    try {
      document.execCommand('styleWithCSS', false, false);
      document.execCommand('insertBROnReturn', false, false);
      document.execCommand('enableInlineTableEditing', false, false);
      document.execCommand('enableObjectResizing', false, false);
    } catch(e) {}
    
    return content;
  };
  
  content.disable = function() {
    node_list.forEach(function(el) { el.disable() });
    return content;
  };
  
  content.focus = function() {
    node_list.forEach(function(el) { el.focus() });
    return content;
  };
  
  content.blur = function() {
    node_list.forEach(function(el) { el.blur() });
    return content;
  };
  
  content.moveToEnd = function() {
    node_list[0].moveToEnd();
  };
  
  content.json = function() {
    var object_tree = {}
    ,   object_list = node_list.map(function(el) { return el.json() })
    ;
    
    object_list.unshift(object_tree);
    object_deepMerge.apply(null, object_list);
    
    return object_tree;
  };
  
  content.tidy = function(callback) {
    if (content.isSourceMode()) {
      content.toggleSourceMode();
    }
    
    node_list.forEach(function(el) { el.tidy(callback) });
  };
  
  content.toggleSourceMode = function() {
    node_list.forEach(function(el) { el.toggleSourceMode() });
  };
  
  content.isSourceMode = function() {
    return node_list.some(function(node) {
      return node.isSourceMode();
    });
  };
  
  content.sanitize = function() {
    node_list.forEach(function(el) { el.sanitize() });
  };
    
  fizzywig.emitter.on('keyup change blur paste', startSaveTimer);
  
  fizzywig.emitter.on('focus', function() {
    content.focus();
  });
  
  fizzywig.emitter.on('blur', function() {
    content.blur();
  });
    
  // a proxy for our emitter
  content.on = fizzywig.emitter.on;
  
  function startSaveTimer() {
    if (save_timer) { return; }
    
    var current_content_tree = content.json();
    
    // do we have any real changes?
    if (JSON.stringify(content_tree) !== JSON.stringify(current_content_tree)) {
      
      // let's let someone know
      fizzywig.emitter.emit('dirty');
      
      // save in 2 seconds
      save_timer = setTimeout(function() {
        fizzywig.emitter.emit('save', [content_tree = content.json()]);
        save_timer = null;
      }, 2000);
    }
  }
  
  return content.enable();
};

function fizzy_toolbar(selector_or_node, content) {
  var toolbar = {}
  ,   node
  ,   button_list
  ,   keepalive
  ;
  
  if (typeof selector_or_node === 'string') {
    node = document.querySelector(selector_or_node);
  } else if (selector_or_node instanceof Element) {
    node = selector_or_node;
  }
  
  button_list = node.querySelectorAll('[data-content-editor-command]');
  button_list = Array.prototype.map.apply(button_list, [function(el) {
    return fizzy_button(el, toolbar);
  }]).filter(function(el) {
    return !!el;
  });
  
  toolbar.enable = function() {
    button_list.forEach(function(button) { button.enable() });
    return toolbar;
  };
  
  toolbar.disable = function() {
    button_list.forEach(function(button) { button.disable() });
    return toolbar;
  };
  
  toolbar.toggleSourceMode = function() {
    content.toggleSourceMode();
  };
  
  toolbar.isSourceMode = function() {
    return content.isSourceMode();
  };
  
  fizzywig.emitter.on('focus', function() {
    keepalive = true;
    toolbar.enable();
  });
  
  fizzywig.emitter.on('blur', function(e) {
    keepalive = false;
    
    setTimeout(function() {
      if (!keepalive) {
        toolbar.disable();
      }
    }, 150);
  });
  
  fizzywig.emitter.on('click', function() {
    keepalive = true;
  });
  
  return toolbar.disable();
}

function fizzy_contentNode(node, content) {
  var content_node = {}
  ,   object_attr
  ,   pasting
  ,   textarea
  ;
  
  object_attr = node.getAttribute('data-content-editable') || 'data';
  
  textarea = document.createElement('textarea');
  textarea.setAttribute('style', 'display:none;');
  textarea.setAttribute('class', 'fizzy-raw');
  
  node.parentNode.insertBefore(textarea, node.nextSibling);
  
  content_node.enable = function() {
    node.setAttribute('contentEditable', true);
    return content_node;
  };
  
  content_node.disable = function() {
    node.removeAttribute('contentEditable');
    return content_node;
  };
  
  content_node.focus = function() {
    return content_node;
  };
  
  content_node.blur = function() {
    return content_node;
  };
  
  content_node.moveToEnd = function() {
    fizzywig.range = fizzy_range(node);
    fizzywig.range.moveToEnd(node);
  };
  
  content_node.json = function() {
    var object_tree = {};
    
    object_reach(object_tree, object_attr, (node.innerHTML || '').trim());
    return object_tree;
  };
  
  content_node.tidy = function(callback) {
    callback(node);
    content_node.sanitize();
  };
  
  content_node.toggleSourceMode = function() {
    if (content_node.isSourceMode()) {
      node.innerHTML = fizzywig.sanitizer(textarea.value.trim(), 'paste');
      textarea.style.display = 'none';
      node.style.display = 'block';
      
      fizzywig.emitter.emit('sanitize:preview', [node]);
    } else {
      var val      = node.innerHTML.trim()
      ,   user_val = fizzywig.emitter.emit('sanitize:source', [val])
      ;
            
      textarea.value = fizzywig.sanitizer((user_val['sanitize:source'] && user_val['sanitize:source'][0]) || val, 'paste');
      node.style.display = 'none';
      textarea.style.display = 'block';
    }
  };
  
  content_node.isSourceMode = function() {
    return textarea.style.display !== 'none'
  };
  
  content_node.sanitize = function() {
    if (content_node.isSourceMode()) {
      node.innerHTML = fizzywig.sanitizer(node.innerHTML.trim(), 'paste');
    } else {
      textarea.value = fizzywig.sanitizer(textarea.value.trim(), 'paste');
    }
  };
      
  element_addEventListener(node, 'focus blur keyup mouseup paste change', emit);
  element_addEventListener(node, 'focus blur keyup mouseup paste change', makeRange);
  element_addEventListener(node, 'keydown mousedown focus blur paste change', normalizeBlockFormat);
  element_addEventListener(node, 'paste', paste);
  
  function makeRange(e) {
    fizzywig.range = fizzy_range(node);
  }
  
  function normalizeBlockFormat(e) {
    fizzywig.range = fizzy_range(node);
    
    // if we're backspacing and there's no text left, don't delete the block element
    if (e.which === 8 && !(node.innerText || node.textContent || '').trim()) {
      e.preventDefault();
      node.innerHTML = '';
    }
    
    // make sure the default format is a paragraph, and not text nodes or divs
    if (fizzywig.block_elements.indexOf(document.queryCommandValue('formatBlock')) === -1) {
      var n = fizzywig.range.commonAncestor();

      if (!n || n.nodeName.toLowerCase() === 'div') {
        document.execCommand('formatBlock', false, '<p>');
      }
    }
  }
  
  function paste(e) {
    setTimeout(function() {
      node.innerHTML = fizzywig.sanitizer(node.innerHTML, 'paste');
    }, 1);
  }
  
  function emit(e) {
    fizzywig.emitter.emit(e.type, [e]);
  }
  
  return content_node.enable();
}

function fizzy_button(node, toolbar) {
  var key, command, value, prompt, button;
  
  command = node.getAttribute('data-content-editor-command');
  value   = node.getAttribute('data-content-editor-value');
  prompt  = node.getAttribute('data-content-editor-prompt');
  key     = value || command;
  
  if (FizzyButton.types.hasOwnProperty(key)) {
    return FizzyButton.create(key, node, command, value, prompt, toolbar);
  }
}

function FizzyButton(node, command, value, prompt, toolbar) {
  this.node    = node;
  this.command = command;
  this.value   = value;
  this.prompt  = prompt;
  this.active  = false;
  this.toolbar = toolbar;
  this.nodeTarget = node && node.nodeName.toLowerCase() === 'option' ? node.parentElement : node;
}

FizzyButton.types = {
  'insertimage': FizzyVoidButton,
  'createlink': FizzyLinkButton,
  'code': FizzyInlineCustomButton,
  '<pre>': FizzyHeadingButton,
  '<p>': FizzyHeadingButton,
  'togglehtml': FizzyHTMLButton
};

var i = 7;
while (--i) {
  FizzyButton.types['<h' + i + '>'] = FizzyHeadingButton;
}

['insertunorderedlist', 'insertorderedlist', 'bold', 'italic', 'strikethrough', 'underline', 'indent', 'outdent'].forEach(function(f) {
  FizzyButton.types[f] = FizzyInlineButton;
});

FizzyButton.create = function(key, node, command, value, prompt, toolbar) {
  var button = new FizzyButton.types[key](node, command, value, prompt, toolbar);
  return button.init();
};

var fb_proto = FizzyButton.prototype;
fb_proto.init = function() {
  var button = this;
  fizzywig.emitter.on('keyup mouseup paste change', function() { button.check() });
  element_addEventListener(this.nodeTarget, 'blur', FizzyButton.emit('blur'));
  element_addEventListener(this.nodeTarget, 'focus', FizzyButton.emit('focus'));
  
  if (this.isChild()) {
    element_addEventListener(this.nodeTarget, 'change click', function(e) { button.execute(e) });
  } else {
    element_addEventListener(this.node, 'click', function(e) { button.execute(e) });
  }

  return this;
};

fb_proto.isChild = function() {
  return this.node !== this.nodeTarget;
};

fb_proto.enable = function() {
  this.nodeTarget.removeAttribute('disabled');
};

fb_proto.disable = function() {
  this.nodeTarget.setAttribute('disabled', 'disabled');
};

fb_proto.activate = function() {
  if (this.active) {
    element_addClass(this.nodeTarget, 'active');
    
    if (this.isChild()) {
      this.node.setAttribute('selected', 'selected');
    }
  } else {
    element_removeClass(this.nodeTarget, 'active');
    
    if (this.isChild()) {
      this.node.removeAttribute('selected');
    }
  }
};



FizzyButton.emit = function(event_name) {
  return function(evt) {
    fizzywig.emitter.emit(event_name);
  }
};

FizzyButton.block_normalization = {
  "normal": 'p',
  "heading": 'h'
};

FizzyButton.block_regexp = /(heading|normal)\s*/i;

FizzyButton.normalizeCommandValue = function(command_value) {
  if (FizzyButton.block_regexp.test(command_value)) {
    command_value = command_value.replace(FizzyButton.block_regexp, function(match) {
      return FizzyButton.block_normalization[match.trim().toLowerCase()];
    });
  }
  
  return '<' + command_value + '>';
};



// Headings can be options or buttons
function FizzyHeadingButton() {
  FizzyButton.apply(this, arguments);
}

var fhb_proto = FizzyHeadingButton.prototype = new FizzyButton();
fhb_proto.constructor = FizzyHeadingButton;

fhb_proto.check = function() {
  var active_value;

  try {
    active_value = document.queryCommandValue(this.command);
  } catch (e) {}

  active_value = FizzyButton.normalizeCommandValue(active_value);
  this.active = this.value === active_value;
  this.activate();
};

fhb_proto.execute = function(e) {
  e.preventDefault();

  if (this.isChild() && this.nodeTarget.value === this.node.value) {
    // restore our range since we've lost focus
    fizzywig.range.restore(true);

    document.execCommand(this.command, false, this.value);
    fizzywig.emitter.emit('click change');
  }
};



function FizzyInlineButton() {
  FizzyButton.apply(this, arguments);
}

var fib_proto = FizzyInlineButton.prototype = new FizzyButton();
fib_proto.constructor = FizzyInlineButton;

fib_proto.check = function() {
  var active_command;

  try {
    active_command = document.queryCommandState(this.command);
  } catch (e) {}

  this.active = active_command;
  this.activate();
};

fib_proto.execute = function(e) {
  e.preventDefault();

  // restore our range since we've lost focus
  fizzywig.range.restore();

  document.execCommand(this.command, false, null);

  fizzywig.emitter.emit('click change');
};



function FizzyInlineCustomButton() {
  FizzyButton.apply(this, arguments);
}

var ficb_proto = FizzyInlineCustomButton.prototype = new FizzyButton();
ficb_proto.constructor = FizzyInlineCustomButton;

ficb_proto.check = function() {
  var active_command;

  try {
    active_command = fizzywig.range.is(this.command);
  } catch (e) {}

  this.active = active_command;
  this.activate();
};

ficb_proto.execute = function(e) {
  e.preventDefault();

  // restore our range since we've lost focus
  fizzywig.range.restore();
  this.check();
  
  if (this.active) {
    document.execCommand('removeFormat', false, null);
  } else {
    fizzywig.range.wrap(this.command);
  }
  
  fizzywig.emitter.emit('click change');
};



function FizzyLinkButton() {
  FizzyButton.apply(this, arguments);
}

var flb_proto = FizzyLinkButton.prototype = new FizzyButton();
flb_proto.constructor = FizzyLinkButton;

flb_proto.check = function() {
  this.active = fizzywig.range.is('a');
  this.activate();
};

flb_proto.execute = function(e) {
  e.preventDefault();

  // restore our range since we've lost focus
  fizzywig.range.restore();
  
  if (this.active) {
    document.execCommand('unlink', false, null);
  } else {
    var return_vals = fizzywig.emitter.emit(this.prompt);

    if (return_vals[this.prompt]) {
      document.execCommand(this.command, false, return_vals[this.prompt][0]);
    }
  }

  fizzywig.emitter.emit('click change');
};



function FizzyVoidButton() {
  FizzyButton.apply(this, arguments);
}

var fvb_proto = FizzyVoidButton.prototype = new FizzyButton();
fvb_proto.constructor = FizzyVoidButton;

fvb_proto.check = function() {
  // no need to do anything
};

fvb_proto.execute = function(e) {
  e.preventDefault();
    
  // restore our range since we've lost focus
  fizzywig.range.restore();  
  fizzywig.emitter.emit(this.prompt, [fizzywig.range]);
  fizzywig.emitter.emit('click change');
};



function FizzyHTMLButton() {
  FizzyButton.apply(this, arguments);
}

var fhtml_proto = FizzyHTMLButton.prototype = new FizzyButton();
fhtml_proto.constructor = FizzyHTMLButton;

fhtml_proto.check = function() {
  this.active = this.toolbar.isSourceMode();
  this.activate();
};

fhtml_proto.activate = function() {
  var me = this;
  
  fb_proto.activate.call(this);
  
  if (this.active) {
    this.toolbar.disable();
    
    // hack :(
    setTimeout(function() {
      me.enable();
    }, 5);

  } else {
    this.toolbar.enable();
  }
};


fhtml_proto.execute = function(e) {
  e.preventDefault();
  
  this.toolbar.toggleSourceMode();
  fizzywig.emitter.emit('click change toggle');
};

function fizzy_range(context) {
  var selection
  ,   range = {}
  ;
  
  if (window.getSelection) {
    selection = window.getSelection();
    
    if (selection.rangeCount) {
      selection = selection.getRangeAt(0);
    }

  } else if (document.selection) {
    selection = document.selection.createRange();
  }
  
  range.is = function(el) {
    return el.toLowerCase() === range.parentNode();
  };
  
  range.parentNode = function() {
    var container;
    
    if (selection) {
      if (window.getSelection) {
        container = selection.startContainer;
        
        if (container && container.nodeType === 3) {
          container = container.parentNode;
        }

        return container && container.nodeName.toLowerCase();
        
      } else {
        return selection.parentElement().nodeName.toLowerCase();
      }
    }
  };
  
  range.restore = function(with_parent) {
    if (window.getSelection) {
      var sel = window.getSelection();
      
      context.focus();
      
      if (selection.collapsed) {
        var shim = document.createTextNode('\00');
        selection.insertNode(shim);
        selection.selectNode(shim);
        selection.collapse(false);
      }
      
      sel.removeAllRanges();
      sel.addRange(selection);

      if (with_parent) {
        var r = document.createRange();
        var a = range.commonAncestor();
        
        if (a !== context) {
          r.selectNode(a);
          
          sel.removeAllRanges();
          sel.addRange(r);
        }
      }
      
    } else if (document.selection && selection.select) {
      selection.select();
    }
  };
  
  range.commonAncestor = function() {
    var a;

    if (window.getSelection) {
      a = selection.commonAncestorContainer;
      
      if (a && a.nodeType === 3) {
        a = a.parentNode;
      }
    } else if (document.selection) {
      a = selection.parentElement();
    }
    
    return a;
  }
  
  range.selectNode = function(node) {
    var r = document.createRange();
    var sel = window.getSelection();
    
    sel.removeAllRanges();
    r.selectNode(node);
    sel.addRange(r);
  };
  
  range.moveToEnd = function(node) {
    var range, sel;
    
    if (document.createRange) {
      range = document.createRange();
      range.selectNodeContents(node);
      range.collapse(false);
      sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (document.selection) {
      range = document.createTextRange();
      range.moveToElementText(node);
      range.collapse(false);
      range.select();
    }
  };
  
  range.wrap = function(nodeName) {
    var node;
    
    try {
      node = document.createElement(nodeName);
      selection.surroundContents(node);
      range.selectNode(node);
    } catch(e) {}
  };
  
  range.insertHTML = function(str) {
    if (selection && selection.pasteHTML) {
      selection.pasteHTML(str);
      
    } else {
      var el   = document.createElement("div")
      ,   frag = document.createDocumentFragment()
      ,   node
      ,   lastNode
      ;
      
      el.innerHTML = str;

      while (node = el.firstChild) {
        lastNode = frag.appendChild(node);
      }
      
      selection.insertNode(frag);
    }
  };
  
  return range;
}

fizzywig.sanitizer = function(html, policy) {
  if (typeof html_sanitizer === 'undefined') return html;
  return html_sanitizer.sanitizeWithPolicy(html, fizzywig.sanitizer.policies[policy]);
};

fizzywig.sanitizer.policies = {
  paste: function(tag_name, attributes) {
    if (fizzywig.sanitizer.paste_elements.indexOf(tag_name) !== -1) {
      return html_sanitizer.sanitizeAttribs(
        tag_name, attributes, fizzywig.sanitizer.policies.uri, fizzywig.sanitizer.policies.tokens);
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
function object_deepMerge() {
  var args = Array.prototype.slice.apply(arguments);
  
  return args.reduce(function(acc, cur) {
    Object.keys(cur).forEach(function(prop) {
      if (acc[prop] && acc[prop].constructor === Object && cur[prop].constructor === Object) {
        object_deepMerge(acc[prop], cur[prop]);
      } else {
        acc[prop] = cur[prop];
      }
    });
    
    return acc;
  });  
}

function object_reach(object, key, value) {
  if (typeof key === 'string') {
    key = key.split('.');
  }
  
  return key.reduce(typeof value === 'undefined' ? get : set, object);
  
  function get(acc, cur, i, arr) {
    return acc[cur];
  }
  
  function set(acc, cur, i, arr) {
    if (i === arr.length - 1) {
      return acc[cur] = value;
    }
    
    return acc[cur] || (acc[cur] = {});
  }
}

function element_addEventListener(el, events, callback, capture) {
  events = events.split(/\s+/);
  
  events.forEach(function(evt) {
    if (el.addEventListener) {
      el.addEventListener(evt, event_normalize.apply(this, [callback]), capture || false); 
    } else if (el.attachEvent) {
      el.attachEvent('on' + evt, event_normalize.apply(this, [callback]));
    }
  });
}

function element_removeEventListener(el, events, callback) {
  events = events.split(/\s+/);
  
  events.forEach(function(evt) {
    if (el.addEventListener) {
      el.removeEventListener(evt, event_normalize.apply(this, [callback])); 
    } else if (el.attachEvent) {
      el.detachEvent('on' + evt, event_normalize.apply(this, [callback]));
    }
  });
}

function element_addClass(el, klass) {
  var classes = el.className.split(/\s+/);
  
  if (classes.indexOf(klass) === -1) {
    classes.push(klass);
  }

  el.className = classes.join(' ');
}

function element_removeClass(el, klass) {
  var classes = el.className.split(/\s+/)
  ,   i       = classes.indexOf(klass)
  ;
  
  if (i !== -1) {
    classes = classes.slice(0, i).concat(classes.slice(i + 1));
  }
  
  el.className = classes.join(' ');
}

function event_normalize(callback) {
  return function(evt) {
    if (!evt) evt = window.event;
    
    if (!('defaultPrevented' in evt)) {
      evt.defaultPrevented = false;
      
      var preventDefault = evt.preventDefault;
      
      evt.preventDefault = function() {
        this.defaultPrevented = true;
        this.returnValue = false;
        preventDefault && preventDefault.call(this);
      };
    }
    
    evt.target = evt.target || evt.srcElement;
    evt.which  = evt.keyCode || evt.charCode;
    
    callback.apply(this, [evt]);
  }
}

window.fizzywig = fizzywig;

}(window));

