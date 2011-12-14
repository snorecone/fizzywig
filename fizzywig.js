;(function(window, undefined) {

var fizzywig;

fizzywig = {
  version: '0.0.1'
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
  } else if (selector_or_list instanceof node_list || Array.isArray(selector_or_list)) {
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
      document.execCommand('insertBROnReturn', false, true);
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
    return fizzy_button(el);
  }]);
  
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
  
  function keydown(e) {
    if (!document.queryCommandValue('formatBlock')) {
      document.execCommand('formatBlock', false, '<p>');
    }
  }
  
  function emit(e) {
    fizzywig.emitter.emit(e.type, [e]);
  }
  
  return content_node.enable();
}

function fizzy_button(node) {
  var button = {}
  ,   command
  ,   value
  ,   active
  ,   heading
  ,   link
  ,   prompt
  ;
  
  command = node.getAttribute('data-content-editor-command');
  value = node.getAttribute('data-content-editor-value');
  prompt = node.getAttribute('data-content-editor-prompt');
  heading = value && value.charAt(1).toLowerCase() === 'h';
  link = command.toLowerCase() === 'createlink';
  
  button.enable = function() {
    node.removeAttribute('disabled');
  };
  
  button.disable = function() {
    node.setAttribute('disabled', 'disabled');
  };
  
  button.activate = function() {
    active ? element_addClass(node, 'active') : element_removeClass(node, 'active');
  };
  
  fizzywig.emitter.on('keyup mouseup paste change', check);
  
  function check() {
    var active_command
    ,   active_value
    ;
    
    try {
      active_command = document.queryCommandState(command);
      active_value = document.queryCommandValue(command);
    } catch (e) {}
    
    if (value) {
      active_value = fizzy_button_normalizeCommandValue(active_value);
      active = value === active_value;
    } else {
      active = active_command || (link && fizzy_range().is('a'));
    }

    button.activate();
  }
  
  element_addEventListener(node, 'click', execute);
  element_addEventListener(node, 'blur', emit('blur'));
  element_addEventListener(node, 'focus', emit('focus'));
  
  function emit(event_name) {
    return function(evt) {
      fizzywig.emitter.emit(event_name);
    }
  }
  
  function execute(e) {
    e.preventDefault();
    
    // normalize the link button to toggle on/off like ul and ol
    var toggled_command = link && active ? 'unlink' : command;
    
    // normalize the heading buttons to toggle on/off like ul and ol
    var toggled_value = heading && active ? '<p>' : value;
    
    if (prompt && !active) {
      toggled_value = fizzywig.prompter.prompt(prompt);
    }

    document.execCommand(toggled_command, false, toggled_value);
    fizzywig.emitter.emit('click change');
  }
  
  return button;
}

var fizzy_button_BLOCK_NORMALIZATION = {
  "normal": 'p',
  "heading": 'h'
};

var fizzy_button_BLOCK_REGEXP = /(heading|normal)\s*/i;

function fizzy_button_normalizeCommandValue(command_value) {
  if (fizzy_button_BLOCK_REGEXP.test(command_value)) {
    command_value = command_value.replace(fizzy_button_BLOCK_REGEXP, function(match) {
      return fizzy_button_BLOCK_NORMALIZATION[match.trim().toLowerCase()];
    });
  }
  
  return '<' + command_value + '>';
}

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
    return selection && selection.startContainer.parentNode.nodeName.toLowerCase();
  };
    
  return range;
}fizzywig.prompter = fizzy_prompter();

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
        preventDefault.call(this);
      };
    }
    
    evt.target = evt.target || evt.srcElement;
    evt.which  = evt.keyCode || evt.charCode;
    
    callback.apply(this, [evt]);
  }
}

window.fizzywig = fizzywig;

}(window));

