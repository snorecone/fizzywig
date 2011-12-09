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
    var userSelection;
    
    if (window.getSelection) {
      userSelection = window.getSelection();
      
      if (userSelection.rangeCount) {
        userSelection = userSelection.getRangeAt(0);
      }

    } else if (document.selection) {
      userSelection = document.selection.createRange();
    }
    
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

