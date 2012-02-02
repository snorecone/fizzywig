function fizzy_button(node) {
  var key, command, value, prompt, button;
  
  command = node.getAttribute('data-content-editor-command');
  value   = node.getAttribute('data-content-editor-value');
  prompt  = node.getAttribute('data-content-editor-prompt');
  key     = value || command;
  
  if (FizzyButton.types.hasOwnProperty(key)) {
    return FizzyButton.create(key, node, command, value, prompt);
  }
}

function FizzyButton(node, command, value, prompt) {
  this.node    = node;
  this.command = command;
  this.value   = value;
  this.prompt  = prompt;
  this.active  = false;
  this.nodeTarget = node && node.nodeName.toLowerCase() === 'option' ? node.parentElement : node;
}

FizzyButton.types = {
  'insertimage': FizzyVoidButton,
  'createlink': FizzyLinkButton,
  '<pre>': FizzyCodeButton,
  '<p>': FizzyHeadingButton,
  'togglehtml': FizzyHTMLButton
};

var i = 7;
while (--i) {
  FizzyButton.types['<h' + i + '>'] = FizzyHeadingButton;
}

['insertunorderedlist', 'insertorderedlist', 'bold', 'italic', 'strikethrough', 'underline', 'indent', 'outdent'].forEach(function(f) {
  FizzyButton.types[f] = FizzyInlineButton;
});

FizzyButton.create = function(key, node, command, value, prompt) {
  var button = new FizzyButton.types[key](node, command, value, prompt);
  return button.init();
};

var fb_proto = FizzyButton.prototype;
fb_proto.init = function() {
  var button = this;
  fizzywig.emitter.on('keyup mouseup paste change', function() { button.check() });
  element_addEventListener(this.nodeTarget, 'blur', FizzyButton.emit('blur'));
  element_addEventListener(this.nodeTarget, 'focus', FizzyButton.emit('focus'));
  
  if (this.isChild()) {
    element_addEventListener(this.nodeTarget, 'change', function(e) { button.execute(e) });
  } else {
    element_addEventListener(this.node, 'click', function(e) { button.execute(e) });
  }

  return this;
};

fb_proto.isChild = function() {
  return this.node !== this.nodeTarget;
};

fb_proto.enable = function() {
  this.nodeTarget.removeAttribute('disabled');
};

fb_proto.disable = function() {
  this.nodeTarget.setAttribute('disabled', 'disabled');
};

fb_proto.activate = function() {
  if (this.active) {
    element_addClass(this.nodeTarget, 'active');
    
    if (this.isChild()) {
      this.node.setAttribute('selected', 'selected');
    }
  } else {
    element_removeClass(this.nodeTarget, 'active');
    
    if (this.isChild()) {
      this.node.removeAttribute('selected');
    }
  }
};



FizzyButton.emit = function(event_name) {
  return function(evt) {
    fizzywig.emitter.emit(event_name);
  }
};

FizzyButton.block_normalization = {
  "normal": 'p',
  "heading": 'h'
};

FizzyButton.block_regexp = /(heading|normal)\s*/i;

FizzyButton.normalizeCommandValue = function(command_value) {
  if (FizzyButton.block_regexp.test(command_value)) {
    command_value = command_value.replace(FizzyButton.block_regexp, function(match) {
      return FizzyButton.block_normalization[match.trim().toLowerCase()];
    });
  }
  
  return '<' + command_value + '>';
};



// Headings can be options or buttons
function FizzyHeadingButton() {
  FizzyButton.apply(this, arguments);
}

var fhb_proto = FizzyHeadingButton.prototype = new FizzyButton();
fhb_proto.constructor = FizzyHeadingButton;

fhb_proto.check = function() {
  var active_value;

  try {
    active_value = document.queryCommandValue(this.command);
  } catch (e) {}

  active_value = FizzyButton.normalizeCommandValue(active_value);
  this.active = this.value === active_value;
  this.activate();
};

fhb_proto.execute = function(e) {
  e.preventDefault();

  if (this.isChild() && this.nodeTarget.value === this.node.value) {
    // restore our range since we've lost focus
    fizzywig.range.restore(true);

    document.execCommand(this.command, false, this.value);
    fizzywig.emitter.emit('click change');
  }
};



function FizzyInlineButton() {
  FizzyButton.apply(this, arguments);
}

var fib_proto = FizzyInlineButton.prototype = new FizzyButton();
fib_proto.constructor = FizzyInlineButton;

fib_proto.check = function() {
  var active_command;

  try {
    active_command = document.queryCommandState(this.command);
  } catch (e) {}

  this.active = active_command;
  this.activate();
};

fib_proto.execute = function(e) {
  e.preventDefault();

  // restore our range since we've lost focus
  fizzywig.range.restore();

  document.execCommand(this.command, false, null);
  fizzywig.emitter.emit('click change');
};



function FizzyLinkButton() {
  FizzyButton.apply(this, arguments);
}

var flb_proto = FizzyLinkButton.prototype = new FizzyButton();
flb_proto.constructor = FizzyLinkButton;

flb_proto.check = function() {
  this.active = fizzywig.range.is('a');
  this.activate();
};

flb_proto.execute = function(e) {
  e.preventDefault();
  
  // normalize the link button to toggle on/off like ul and ol
  var toggled_command = this.active ? 'unlink' : this.command
  ,   value           = fizzywig.prompter.prompt(this.prompt)
  ;

  // restore our range since we've lost focus
  fizzywig.range.restore();

  document.execCommand(toggled_command, false, value);
  fizzywig.emitter.emit('click change');
};



function FizzyVoidButton() {
  FizzyButton.apply(this, arguments);
}

var fvb_proto = FizzyVoidButton.prototype = new FizzyButton();
fvb_proto.constructor = FizzyVoidButton;

fvb_proto.check = function() {
  // no need to do anything
};

fvb_proto.execute = function(e) {
  e.preventDefault();
  
  // restore our range since we've lost focus
  fizzywig.range.restore();
  
  document.execCommand(this.command, false, fizzywig.prompter.prompt(this.prompt));
  fizzywig.emitter.emit('click change');
};

function FizzyCodeButton() {
  FizzyButton.apply(this, arguments);
}

var fcb_proto = FizzyCodeButton.prototype = new FizzyButton();
fvb_proto.constructor = FizzyCodeButton;

fcb_proto.check = function() {
  var active_value;

  try {
    active_value = document.queryCommandValue(this.command);
  } catch (e) {}

  active_value = FizzyButton.normalizeCommandValue(active_value);
  this.active = this.value === active_value;
  this.activate();
};

fcb_proto.execute = function(e) {
  e.preventDefault();

  // normalize the heading buttons to toggle on/off like ul and ol
  var toggled_value = this.active ? '<p>' : this.value;

  // restore our range since we've lost focus
  fizzywig.range.restore(true);

  document.execCommand(this.command, false, toggled_value);
  fizzywig.emitter.emit('click change');
};



function FizzyHTMLButton() {
  FizzyButton.apply(this, arguments);
}

var fhtml_proto = FizzyHTMLButton.prototype = new FizzyButton();
fhtml_proto.constructor = FizzyHTMLButton;

fhtml_proto.check = function() {
  // no need to do anything
};

fhtml_proto.execute = function(e) {
  e.preventDefault();
  
  fizzywig.emitter.emit('click change toggle');
};

