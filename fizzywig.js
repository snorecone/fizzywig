;(function(window, undefined) {

var fizzywig;

fizzywig = {
  version: '0.0.1',
  block_elements: ['p', 'pre', 'Normal'],
  inline_elements: ['b', 'i', 'strong', 'em', 'a', 'del', 'strike'],
  void_elements: ['img', 'br', 'hr']
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
    
    events.forEach(function(evt) {
      if (listeners[evt]) {
        listeners[evt].forEach(function(callback) {
          callback.apply(this, args);
        });
      }
    });
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
    
    toolbar = fizzy_toolbar(tb_selector);
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
  
  content.json = function() {
    var object_tree = {}
    ,   object_list = node_list.map(function(el) { return el.json() })
    ;
    
    object_list.unshift(object_tree);
    object_deepMerge.apply(null, object_list);
    
    return object_tree;
  };
  
  // a proxy for our emitter
  content.on = fizzywig.emitter.on;
  fizzywig.emitter.on('keyup change blur paste', startSaveTimer);
  
  // a proxy for the prompter
  content.prompt = fizzywig.prompter.prompt;
  
  function startSaveTimer() {
    if (save_timer) { return; }
    
    save_timer = setTimeout(function() {
      var current_content_tree = content.json();
      
      if (JSON.stringify(content_tree) !== JSON.stringify(current_content_tree)) {
        fizzywig.emitter.emit('save', [current_content_tree]);
        content_tree = current_content_tree;
      }
      
      save_timer = null;
    }, 2000);
  }
  
  return content.enable();
};

function fizzy_toolbar(selector_or_node) {
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
    return fizzy_button(el);
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
  ;
  
  object_attr = node.getAttribute('data-content-editable') || 'data';
  
  content_node.enable = function() {
    node.setAttribute('contentEditable', true);
    return content_node;
  };
  
  content_node.disable = function() {
    node.removeAttribute('contentEditable');
    return content_node;
  };
  
  content_node.json = function() {
    var object_tree = {};
    
    object_reach(object_tree, object_attr, node.innerHTML);
    return object_tree;
  };
    
  element_addEventListener(node, 'focus blur keyup mouseup paste change', emit);  
  element_addEventListener(node, 'keydown', keydown);
  element_addEventListener(node, 'paste', paste);
  
  function keydown(e) {
    // make sure the default format is a paragraph, and not text nodes or divs
    if (fizzywig.block_elements.indexOf(document.queryCommandValue('formatBlock')) === -1) {
      // document.execCommand('formatBlock', false, '<p>');
    }
    
    // if we're backspacing and there's no text left, don't delete the block element
    if (e.which === 8 && !(node.innerText || node.textContent || '').trim()) {
      e.preventDefault();
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

function fizzy_button(node) {
  var key, command, value, prompt, button;
  
  command = node.getAttribute('data-content-editor-command');
  value   = node.getAttribute('data-content-editor-value');
  prompt  = node.getAttribute('data-content-editor-prompt');
  key     = value || command;
  
  if (FizzyButton.types.hasOwnProperty(key)) {
    return FizzyButton.create(key, node, command, value, prompt);
  }
}

function FizzyButton(node, command, value, prompt) {
  this.node    = node;
  this.command = command;
  this.value   = value;
  this.prompt  = prompt;
  this.active  = false;
}

FizzyButton.types = {
  'insertimage': FizzyVoidButton,
  'createlink': FizzyLinkButton,
  '<pre>'     : FizzyCodeButton
};

var i = 7;
while (--i) {
  FizzyButton.types['<h' + i + '>'] = FizzyHeadingButton;
}

['insertunorderedlist', 'insertorderedlist', 'bold', 'italic', 'strikethrough', 'underline'].forEach(function(f) {
  FizzyButton.types[f] = FizzyInlineButton;
});

FizzyButton.create = function(key, node, command, value, prompt) {
  var button = new FizzyButton.types[key](node, command, value, prompt);
  return button.init();
};

var fb_proto = FizzyButton.prototype;
fb_proto.init = function() {
  var button = this;
  fizzywig.emitter.on('keyup mouseup paste change', function() { button.check() });
  element_addEventListener(this.node, 'click', function(e) { button.execute(e) });
  element_addEventListener(this.node, 'blur', FizzyButton.emit('blur'));
  element_addEventListener(this.node, 'focus', FizzyButton.emit('focus'));

  return this;
};

fb_proto.enable = function() {
  this.node.removeAttribute('disabled');
};

fb_proto.disable = function() {
  this.node.setAttribute('disabled', 'disabled');
};

fb_proto.activate = function() {
  this.active ? element_addClass(this.node, 'active') : element_removeClass(this.node, 'active');
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

  // normalize the heading buttons to toggle on/off like ul and ol
  var toggled_value = this.active ? '<p>' : this.value;

  // restore our range since we've lost focus
  fizzywig.range.restore(true);

  document.execCommand(this.command, false, toggled_value);
  fizzywig.emitter.emit('click change');
};



function FizzyInlineButton() {
  FizzyButton.apply(this, arguments);
}

var fib_proto = FizzyInlineButton.prototype = new FizzyButton();
fib_proto.constructor = FizzyInlineButton;

fib_proto.check = function() {
  var active_command;

  try {
    active_command = document.queryCommandState(command);
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
  
  // normalize the link button to toggle on/off like ul and ol
  var toggled_command = this.active ? 'unlink' : this.command
  ,   value           = fizzywig.prompter.prompt(this.prompt)
  ;

  // restore our range since we've lost focus
  fizzywig.range.restore();

  document.execCommand(toggled_command, false, value);
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
  
  document.execCommand(this.command, false, fizzywig.prompter.prompt(this.prompt));
  fizzywig.emitter.emit('click change');
};

function FizzyCodeButton() {
  FizzyButton.apply(this, arguments);
}

var fcb_proto = FizzyCodeButton.prototype = new FizzyButton();
fvb_proto.constructor = FizzyCodeButton;

fcb_proto.check = function() {
  var active_value;

  try {
    active_value = document.queryCommandValue(this.command);
  } catch (e) {}

  active_value = FizzyButton.normalizeCommandValue(active_value);
  this.active = this.value === active_value;
  this.activate();
};

fcb_proto.execute = function(e) {
  e.preventDefault();

  // normalize the heading buttons to toggle on/off like ul and ol
  var toggled_value = this.active ? '<p>' : this.value;

  // restore our range since we've lost focus
  fizzywig.range.restore(true);

  document.execCommand(this.command, false, toggled_value);
  fizzywig.emitter.emit('click change');
};

function fizzy_range() {
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
    if (selection) {
      if (window.getSelection) {
        return selection.startContainer.parentNode.nodeName.toLowerCase();
      } else {
        return selection.parentElement().nodeName.toLowerCase();
      }
    }
  };
  
  range.restore = function(with_parent) {
    if (window.getSelection) {
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(selection);
      
      if (with_parent) {
        var r = document.createRange();
        r.selectNode(selection.startContainer.parentNode);
        sel.addRange(r);
      }
      
    } else if (document.selection && selection.select) {
      selection.select();
    }
  };
  
  range.insert = function(node) {
    if (window.getSelection) {
      var sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        var range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(node);
      }
    } else if (document.selection && document.selection.createRange) {
      alert('incompatible for now');
      document.selection.createRange().pasteHTML(node);
    }
  };
  
  return range;
}

fizzywig.emitter.on('keyup mouseup paste change blur', function() {
  fizzywig.range = fizzy_range();
});

fizzywig.prompter = fizzy_prompter();

function fizzy_prompter() {
  var prompts  = {}
  ,   prompter = {}
  ;
  
  prompter.prompt = function(key, fun) {
    if (fun !== undefined) {
      prompts[key] = fun;
    } else {
      if (typeof prompts[key] === 'function') {
        return prompts[key].call(null);
      }
    }
  };
  
  return prompter;
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
fizzywig.sanitizer.paste_elements = 
  fizzywig.block_elements.concat(fizzywig.inline_elements, fizzywig.void_elements);
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

