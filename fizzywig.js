;(function(window, undefined) {

var fizzywig;

fizzywig = {
  version: '0.0.1',
  grouping: /^BR|P|UL|OL|PRE|BLOCKQUOTE|H[1-6]$/,
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
    'iframe',
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
  ],
  os: {
    lion: navigator && navigator.userAgent && navigator.userAgent.indexOf('Mac OS X 10_7') !== -1
  }
  
};

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

fizzywig.content = function(selector_or_node) {
  var content  = {}
  ,   node
  ,   toolbar
  ,   save_timer
  ,   content_tree = {}
  ,   object_attr
  ,   pasting
  ,   textarea
  ,   source_mode
  ;
  
  // clear events first
  fizzywig.emitter.clear();
  
  if (typeof selector_or_node === 'string') {
    node = document.querySelector(selector_or_node);
  } else if (selector_or_node instanceof Node) {
    node = selector_or_node;
  }
  
  object_attr = node.getAttribute('data-content-editable') || 'data';
  
  textarea = document.createElement('textarea');
  textarea.setAttribute('style', 'display:none;');
  textarea.setAttribute('class', 'fizzy-raw');
  
  node.parentNode.insertBefore(textarea, node.nextSibling);
    
  content.toolbar = function(tb_selector) {
    if (!arguments.length) return toolbar;
    
    toolbar = fizzy_toolbar(tb_selector, content);
    return content;
  };
  
  content.enable = function() {
    node.setAttribute('contentEditable', true);
    
    try {
      document.execCommand('styleWithCSS', false, false);
      document.execCommand('insertBROnReturn', false, false);
      document.execCommand('enableInlineTableEditing', false, false);
      document.execCommand('enableObjectResizing', false, false);
    } catch(e) {}
    
    return content;
  };
  
  content.disable = function() {
    node.removeAttribute('contentEditable');
    return content;
  };
  
  content.focus = function() {
    node.focus();
  };
    
  content.moveToEnd = function() {
    fizzywig.range.moveToEnd(node);
  };
  
  content.json = function(callback) {
    var object_tree = {}
    ,   text_val
    ;
    
    text_val = ((source_mode ? textarea.value : node.innerHTML) || '').trim();
    text_val = fizzywig.sanitizer(text_val, 'paste');

    object_tree[object_attr] = text_val;

    return object_tree;
  };
    
  content.toggleSourceMode = function() {
    if (content.isSourceMode()) {
      fizzywig.emitter.emit('toggle:preview');
      node.innerHTML = fizzywig.sanitizer(textarea.value.trim(), 'paste');
      textarea.style.display = 'none';
      node.style.display = 'block';
      
      fizzywig.emitter.emit('sanitize:preview', [node]);
      normalizeBlockFormat();
      content.moveToEnd();
      source_mode = false;
    } else {
      var val      = node.innerHTML.trim()
      ,   user_val = fizzywig.emitter.emit('sanitize:source', [val])
      ;
      
      node.style.display = 'none';
      textarea.style.display = 'block';
      textarea.value = fizzywig.sanitizer((user_val['sanitize:source'] && user_val['sanitize:source'][0]) || val, 'paste');
      fizzywig.emitter.emit('toggle:source', [textarea]);
      source_mode = true;
    }
  };
  
  content.isSourceMode = function() {
    return source_mode;
  };
    
  fizzywig.emitter.on('keyup change blur paste', startSaveTimer);
      
  // a proxy for our emitter
  content.on = fizzywig.emitter.on;
  
  element_addEventListener(node, 'focus blur keyup mouseup paste change', emit);
  element_addEventListener(node, 'focus blur keydown mousedown paste change', normalizeBlockFormat);
  element_addEventListener(node, 'paste', paste);
  
  function normalizeBlockFormat(e) {    
    var current_range = fizzywig.range.get()
    ,   ca = fizzywig.range.commonAncestor()
    ;

    if (ca && ca.nodeType === 3) ca = ca.parentNode;

    // if we're backspacing and there's no text left, don't delete the block element
    if ((!e || e.which === 8) && !(node.innerText || node.textContent || '').trim()) {
      node.innerHTML = '<p><br></p>';
      fizzywig.range.selectNodeContents(node);
      fizzywig.range.restore();
      return;
    }
    
    if (e && fizzywig.os.lion && e.shiftKey && e.which === 13) {
      e.preventDefault();

      var br;
      
      if (ca && ca.nodeType === 1 && ca.nodeName === 'PRE') {
        br = document.createTextNode("\n");
      } else {
        br = document.createElement("br");
      }
      
      fizzywig.range.insertNode(br);
      fizzywig.range.selectNode(br);
      fizzywig.range.collapse(false);
      fizzywig.range.restore();
     }
        
    try {
      if (e && e.which === 13) {
        if (ca.nodeType === 1 && 
            !fizzywig.grouping.test(ca.nodeName) &&
            !document.queryCommandState('insertunorderedlist') &&
            !document.queryCommandState('insertorderedlist')) {
              document.execCommand('formatBlock', false, '<p>');
        }
      }     
    } catch(e) {}
  }
  
  function paste(e) {
    setTimeout(function() {
      node.innerHTML = fizzywig.sanitizer(node.innerHTML.trim(), 'paste');
    }, 1);
  }
  
  function emit(e) {
    fizzywig.range.get();
    fizzywig.emitter.emit(e.type, [e]);
  }
  
  function debounce(callback, delay) {
    var timeout;

    return function() {
      var args = arguments
      ,   self = this;

      function exec() {
        callback.apply(self, args);
        timeout = null;
      }

      clearTimeout(timeout);
      timeout = setTimeout(exec, delay);    
    }
  }
  
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
  
  toolbar.content = function() {
    return content;
  };
    
  fizzywig.emitter.on('click', function() {
    keepalive = true;
  });
  
  return toolbar.enable();
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
  'insertunorderedlist': FizzyListButton,
  'insertorderedlist': FizzyListButton,
  'code': FizzyInlineCustomButton,
  '<pre>': FizzyHeadingButton,
  '<p>': FizzyNormalButton,
  'togglehtml': FizzyHTMLButton
};

var i = 7;
while (--i) {
  FizzyButton.types['<h' + i + '>'] = FizzyHeadingButton;
}

['bold', 'italic', 'strikethrough', 'underline', 'indent', 'outdent'].forEach(function(f) {
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
    element_addEventListener(this.nodeTarget, 'change', function(e) { button.execute(e) });
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

fb_proto.restoreSelection = function() {
  this.toolbar.content().focus();
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

  if (this.isChild() && this.nodeTarget.options[this.nodeTarget.selectedIndex].value === this.node.value) {
    // restore our range since we've lost focus
    this.restoreSelection(true);

    document.execCommand(this.command, false, this.value);
    fizzywig.emitter.emit('click change');
  }
};



// Headings can be options or buttons
function FizzyNormalButton() {
  FizzyHeadingButton.apply(this, arguments);
}

var fnb_proto = FizzyNormalButton.prototype = new FizzyHeadingButton();
fnb_proto.constructor = FizzyNormalButton;

fnb_proto.check = function() {
  var active_value, active_list;

  try {
    active_value = document.queryCommandValue(this.command);
    // active_list = document.queryCommandState('insertunorderedlist') || document.queryCommandState('insertorderedlist');
  } catch (e) {}

  active_value = FizzyButton.normalizeCommandValue(active_value);
  this.active = this.value === active_value;
  this.activate();
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
  this.restoreSelection();
  
  document.execCommand(this.command, false, null);
  
  fizzywig.emitter.emit('click change');
};



function FizzyListButton() {
  FizzyButton.apply(this, arguments);
}

var flib_proto = FizzyListButton.prototype = new FizzyButton();
flib_proto.constructor = FizzyListButton;

flib_proto.check = function() {
  var active_command;

  try {
    active_command = document.queryCommandState(this.command);
  } catch (e) {}

  this.active = active_command;
  this.activate();
};

flib_proto.execute = function(e) {
  e.preventDefault();

  // restore our range since we've lost focus
  this.restoreSelection();
  
  document.execCommand(this.command, false, null);
  
  fizzywig.emitter.emit('click change');
};



function FizzyInlineCustomButton() {
  FizzyButton.apply(this, arguments);
}

var ficb_proto = FizzyInlineCustomButton.prototype = new FizzyButton();
ficb_proto.constructor = FizzyInlineCustomButton;

ficb_proto.check = function() {
  var active_command, ac;

  try {
    ac = fizzywig.range.commonAncestor();
    active_command = ac && ((ac.nodeType === 3 && ac.parentNode && ac.parentNode.nodeName === this.command.toUpperCase()) || (ac.nodeType === 1 && ac.nodeName === this.command.toUpperCase()));
  } catch (e) {}

  this.active = active_command;
  this.activate();
};

ficb_proto.execute = function(e) {
  e.preventDefault();
  var ac, n;

  // restore our range since we've lost focus
  this.restoreSelection();
  this.check();
  
  if (this.active) {
    ac = fizzywig.range.commonAncestor();
    
    if (ac.nodeType === 3 && ac.parentNode.nodeName === 'CODE') {
      n = ac.parentNode;
    } else if (ac.nodeType === 1 && ac.nodeName === 'CODE') {
      n = ac;
    }
    
    fizzywig.range.selectNode(n);
    fizzywig.range.restore();
    document.execCommand('removeFormat', false, null);
    
  } else {
    n = document.createElement(this.command);
    fizzywig.range.surroundContents(n);
  }
  
  fizzywig.emitter.emit('click change');
};



function FizzyLinkButton() {
  FizzyButton.apply(this, arguments);
}

var flb_proto = FizzyLinkButton.prototype = new FizzyButton();
flb_proto.constructor = FizzyLinkButton;

flb_proto.check = function() {
  var ac, active_command;
  
  try {
    ac = fizzywig.range.commonAncestor();
    active_command = ac && ((ac.nodeType === 3 && ac.parentNode && ac.parentNode.nodeName === 'A') || (ac.nodeType === 1 && ac.nodeName === 'A'));
  } catch(e) {}
    
  this.active = active_command;
  this.activate();
};

flb_proto.execute = function(e) {
  e.preventDefault();

  // restore our range since we've lost focus
  this.restoreSelection();
  
  if (this.active) {
    document.execCommand('unlink', false, null);
  } else {
    var return_vals = fizzywig.emitter.emit(this.prompt);

    if (return_vals[this.prompt]) {
      if (fizzywig.range.collapsed()) {
        var anchor = document.createElement('a');
        anchor.innerHTML = return_vals[this.prompt][0];
        anchor.setAttribute('href', return_vals[this.prompt][0]);
        fizzywig.range.insertNode(anchor);
      } else {
        document.execCommand(this.command, false, return_vals[this.prompt][0]);
      }
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
  this.restoreSelection();  
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

fizzywig.range = fizzy_range();

function fizzy_range() {
  var range = {}
  ,   range_adapter
  ,   selection_adapter
  ,   _range
  ,   _selection
  ;
  
  if (typeof rangy !== 'undefined') {
    range_adapter = rangy;
    selection_adapter = rangy;
  } else {
    range_adapter = document;
    selection_adapter = window;
  }
  
  range.get = function() {
    _selection = selection_adapter.getSelection();
    _range = _selection.rangeCount && _selection.getRangeAt(0);
    return _range && _range.cloneRange();
  };
  
  range.log = function() {
    console.log(_range)
  };
  
  range.refresh = function() {
    _range && _range.refresh && _range.refresh();
  };
  
  range.restore = function(r) {
    if (!((r || _range) && _selection)) return;
    
    _range = r || _range;
    _selection.removeAllRanges();
    _selection.addRange(_range);
  };
  
  range.commonAncestor = function() {
    return _range && _range.commonAncestorContainer;
  };
  
  range.moveToEnd = function(node) {
    var r = range_adapter.createRange();
    
    _selection = selection_adapter.getSelection();
    
    r.selectNodeContents(node.lastChild);
    r.collapse(false);
    _selection.setSingleRange(r);
  };
  
  range.selectNode = function(node) {
    _range && _range.selectNode(node);
  };
  
  range.selectNodeContents = function(node) {
    _range && _range.selectNodeContents(node);
  };
  
  range.extractContents = function(node) {
    return _range && _range.extractContents(node);
  };
  
  range.surroundContents = function(node) {
    if (!_range) return;
    
    try {
      _range.surroundContents(node);
    } catch(e) {}
  };
  
  range.insertNode = function(node) {
    if (!_range) return;
    
    try {
      _range.insertNode(node);
      _range.selectNode(node);
      _range.collapse(false);
      _selection.setSingleRange(_range);
    } catch(e) {}
  };
  
  range.collapsed = function() {
    return _range && _range.collapsed;
  }
  
  range.startContainer = function() {
    return _range && _range.startContainer;
  };
  
  range.endContainer = function() {
    return _range && _range.endContainer;
  };

  range.collapse = function(bool) {
    _range && _range.collapse(bool);
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

