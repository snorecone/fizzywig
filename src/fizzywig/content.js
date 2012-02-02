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
  
  content.focus = function() {
    node_list.forEach(function(el) { el.focus() });
    return content;
  };
  
  content.blur = function() {
    node_list.forEach(function(el) { el.blur() });
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
  
  content.data = function() {
    
  };
  
  content.toggleHTML = function() {
    node_list.forEach(function(el) { el.toggleHTML() });
  };
  
  fizzywig.emitter.on('keyup mouseup paste change blur', function() {
    fizzywig.range = fizzy_range();
  });
  
  fizzywig.emitter.on('keyup change blur paste', startSaveTimer);
  
  fizzywig.emitter.on('focus', function() {
    content.focus();
  });
  
  fizzywig.emitter.on('blur', function() {
    content.blur();
  });
  
  fizzywig.emitter.on('toggle', function() {
    content.toggleHTML();
  });
  
  // a proxy for our emitter
  content.on = fizzywig.emitter.on;
  
  // a proxy for the prompter
  content.prompt = fizzywig.prompter.prompt;
  
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

