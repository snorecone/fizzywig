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
  
  element_addEventListener(node, 'click', execute);
  
  function execute(e) {
    e.preventDefault();
    console.log(document.activeElement)
    document.execCommand(command, false, null);
  }
  
  return button;
}

