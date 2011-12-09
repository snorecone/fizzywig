var fizzy_button_BLOCK_FORMATS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'];

function fizzy_button(node) {
  var button = {}
  ,   command
  ,   value
  ;
  
  command = node.getAttribute('data-content-editor-command');
  value = node.getAttribute('data-content-editor-value');
  
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
  
  fizzywig.emitter.on('keyup mouseup', check);
  
  function check() {
    // var active_command = document.queryCommandState(command)
    // ,   active_value   = document.queryCommandValue(command)
    // ;
    // console.log(active_value)
    // // if (active) {
    // //   button.activate();
    // // } else {
    // //   button.deactivate();
    // // }
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
    fizzywig.emitter.emit('click');
    document.execCommand(command, false, value);
  }
  
  return button;
}

