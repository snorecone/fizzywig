function fizzy_button(node) {
  var button = {}
  ,   command
  ,   value
  ,   active
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
      active = active_command;
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
    fizzywig.emitter.emit('click');
    document.execCommand(command, false, value);
  }
  
  return button;
}

var fizzy_button_BLOCK_NORMALIZATION = {
  "normal": 'p',
  "heading": 'h'
};

function fizzy_button_normalizeCommandValue(command_value) {
  if (/(heading|normal)/i.test(command_value)) {
    command_value = command_value.replace(/(heading|normal)\s*/i, function(match) {
      return fizzy_button_BLOCK_NORMALIZATION[match.trim().toLowerCase()];
    });
  }
  
  return command_value;
}

