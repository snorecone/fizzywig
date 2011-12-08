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
  
  fizzywig.emitter.on('keyup', function() {
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

