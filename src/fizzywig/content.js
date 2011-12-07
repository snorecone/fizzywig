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
  
  content.events = fizzy_emitter(content);
  
  content.events.on('focus', function() {
    if (toolbar) {
      toolbar.enable();
    }
  });
  
  content.events.on('blur', function() {
    if (document.selection) {
      range = document.selection.createRange();
    } else {
      range = window.getSelection();
    }
    
    if (range.rangeCount > 0) {
      range = range.getRangeAt(0);
    }
    
    console.log(range);
    
    // window.getSelection().addRange(range)
    // toolbar.disable();
  });

  return content.enable();
};

