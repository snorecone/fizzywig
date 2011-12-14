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
      active = active_command || (link && fizzywig.range.is('a'));
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
    
    // restore our range since we've lost focus
    fizzywig.range.restore();
    
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

