;(function(window, undefined) {

var fizzywig;

fizzywig = {
  version: '0.0.1'
};

fizzywig.content = function(selector_or_list) {
  var content  = {}
  ,   node_list
  ,   toolbar
  ,   current_range
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

  return content.enable();
};

function fizzy_toolbar(selector_or_node, content) {
  var toolbar = {}
  ,   node
  ,   button_list
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
    toolbar.enable();
  });
  
  fizzywig.emitter.on('blur', function() {
    if (document.selection) {
      range = document.selection.createRange();
    } else {
      range = window.getSelection();
    }
    
    if (!range.rangeCount) {
      toolbar.disable();
    }    
  });
  
  return toolbar.disable();
}

function fizzy_contentNode(node, content) {
  var content_node = {}
  ,   object_tree  = {}
  ,   object_attr
  ;
  
  object_attr = node.getAttribute('data-content-editable') || 'data';
  object_reach(object_tree, object_attr, node.innerHTML);
  
  content_node.enable = function() {
    node.setAttribute('contentEditable', true);
    return content_node;
  };
  
  content_node.disable = function() {
    node.removeAttribute('contentEditable');
    return content_node;
  };
  
  content_node.json = function() {
    return object_tree;
  };
  
  element_addEventListener(node, 'focus', emit('focus'));
  element_addEventListener(node, 'blur', emit('blur'));
  element_addEventListener(node, 'keyup', emit('keyup'));
  element_addEventListener(node, 'mouseup', emit('mouseup'));
  
  function emit(event_type) {
    return function(e) {
      fizzywig.emitter.emit(event_type);
    }
  }
  
  return content_node.enable();
}

function fizzy_button(node) {
  var button = {}
  ,   command
  ;
  
  command = node.getAttribute('data-content-editor-command');
  
  button.enable = function() {
    node.removeAttribute('disabled');
  };
  
  button.disable = function() {
    node.setAttribute('disabled', 'disabled');
  };
  
  button.activate = function() {
    element_addClass(node, 'active');
  };
  
  button.deactivate = function() {
    element_removeClass(node, 'active');
  };
  
  fizzywig.emitter.on('keyup mouseup', function() {
    var active = document.queryCommandState(command);
    
    if (active) {
      button.activate();
    } else {
      button.deactivate();
    }
  });
  
  element_addEventListener(node, 'click', execute);
  
  function execute(e) {
    e.preventDefault();
    document.execCommand(command, false, null);
  }
  
  return button;
}

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
    
    return acc[cur] = acc[cur] || {};    
  }
}

function element_addEventListener(el, evt, callback, capture) {
  if (el.addEventListener) {
    el.addEventListener(evt, event_normalize.apply(this, [callback]), capture || false); 
  } else if (el.attachEvent) {
    el.attachEvent('on' + evt, event_normalize.apply(this, [callback]));
  }
}

function element_removeEventListener(el, evt, callback) {
  if (el.addEventListener) {
    el.removeEventListener(evt, event_normalize.apply(this, [callback])); 
  } else if (el.attachEvent) {
    el.detachEvent('on' + evt, event_normalize.apply(this, [callback]));
  }
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

