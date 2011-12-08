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

