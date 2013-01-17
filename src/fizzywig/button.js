function fizzy_button(node, toolbar) {
  var key, command, value, prompt, button;
  
  command = node.getAttribute('data-content-editor-command');
  value   = node.getAttribute('data-content-editor-value');
  prompt  = node.getAttribute('data-content-editor-prompt');
  key     = value || command;
  
  if (FizzyButton.types.hasOwnProperty(key)) {
    return FizzyButton.create(key, node, command, value, prompt, toolbar);
  }
}

function FizzyButton(node, command, value, prompt, toolbar) {
  this.node    = node;
  this.command = command;
  this.value   = value;
  this.prompt  = prompt;
  this.active  = false;
  this.toolbar = toolbar;
  this.nodeTarget = node && node.nodeName.toLowerCase() === 'option' ? node.parentElement : node;
}

FizzyButton.types = {
  'insertimage': FizzyVoidButton,
  'createlink': FizzyLinkButton,
  'insertunorderedlist': FizzyListButton,
  'insertorderedlist': FizzyListButton,
  'code': FizzyInlineCustomButton,
  '<pre>': FizzyHeadingButton,
  '<p>': FizzyNormalButton,
  'togglehtml': FizzyHTMLButton
};

var i = 7;
while (--i) {
  FizzyButton.types['<h' + i + '>'] = FizzyHeadingButton;
}

['bold', 'italic', 'strikethrough', 'underline', 'indent', 'outdent'].forEach(function(f) {
  FizzyButton.types[f] = FizzyInlineButton;
});

FizzyButton.create = function(key, node, command, value, prompt, toolbar) {
  var button = new FizzyButton.types[key](node, command, value, prompt, toolbar);
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

fb_proto.restoreSelection = function() {
  this.toolbar.content().focus();
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

  if (this.isChild() && this.nodeTarget.options[this.nodeTarget.selectedIndex].value === this.node.value) {
    // restore our range since we've lost focus
    this.restoreSelection(true);

    document.execCommand(this.command, false, this.value);
    fizzywig.emitter.emit('click change');
  }
};



// Headings can be options or buttons
function FizzyNormalButton() {
  FizzyButton.apply(this, arguments);
}

var fnb_proto = FizzyNormalButton.prototype = new FizzyButton();
fnb_proto.constructor = FizzyNormalButton;

fnb_proto.check = function() {
  var active_value, active_list;

  try {
    active_value = document.queryCommandValue(this.command);
  } catch (e) {}

  this.active = !active_value;
  this.activate();
};

fnb_proto.execute = function(e) {
  e.preventDefault();
  var sel = rangy.getSelection();
  var range = sel.getRangeAt(0);
  var ca = range.commonAncestorContainer;
  if (ca && ca.nodeType === 3) {
    ca = ca.parentNode;
    range.selectNode(ca);
  }
  if (ca && ca.nodeType === 1 && fizzywig.grouping.test(ca.nodeName)) {
    while (ca.firstChild) {
      range.insertNode(ca.firstChild);
      if (ca.firstChild) ca.removeChild(ca.firstChild);
    }
    ca.parentNode.removeChild(ca);
    range.collapse(false);
    sel.setSingleRange(range);
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
  this.restoreSelection();
  
  document.execCommand(this.command, false, null);
  
  fizzywig.emitter.emit('click change');
};



function FizzyListButton() {
  FizzyButton.apply(this, arguments);
}

var flib_proto = FizzyListButton.prototype = new FizzyButton();
flib_proto.constructor = FizzyListButton;

flib_proto.check = function() {
  var active_command;

  try {
    active_command = document.queryCommandState(this.command);
  } catch (e) {}

  this.active = active_command;
  this.activate();
};

flib_proto.execute = function(e) {
  e.preventDefault();

  // restore our range since we've lost focus
  this.restoreSelection();
  
  document.execCommand(this.command, false, null);
  
  fizzywig.emitter.emit('click change');
};



function FizzyInlineCustomButton() {
  FizzyButton.apply(this, arguments);
}

var ficb_proto = FizzyInlineCustomButton.prototype = new FizzyButton();
ficb_proto.constructor = FizzyInlineCustomButton;

ficb_proto.check = function() {
  var active_command, ac;

  try {
    ac = fizzywig.range.commonAncestor();
    active_command = ac && ((ac.nodeType === 3 && ac.parentNode && ac.parentNode.nodeName === this.command.toUpperCase()) || (ac.nodeType === 1 && ac.nodeName === this.command.toUpperCase()));
  } catch (e) {}

  this.active = active_command;
  this.activate();
};

ficb_proto.execute = function(e) {
  e.preventDefault();
  var ac, n;

  // restore our range since we've lost focus
  this.restoreSelection();
  this.check();
  
  if (this.active) {
    ac = fizzywig.range.commonAncestor();
    
    if (ac.nodeType === 3 && ac.parentNode.nodeName === 'CODE') {
      n = ac.parentNode;
    } else if (ac.nodeType === 1 && ac.nodeName === 'CODE') {
      n = ac;
    }
    
    fizzywig.range.selectNode(n);
    fizzywig.range.restore();
    document.execCommand('removeFormat', false, null);
    
  } else {
    n = document.createElement(this.command);
    fizzywig.range.surroundContents(n);
  }
  
  fizzywig.emitter.emit('click change');
};



function FizzyLinkButton() {
  FizzyButton.apply(this, arguments);
}

var flb_proto = FizzyLinkButton.prototype = new FizzyButton();
flb_proto.constructor = FizzyLinkButton;

flb_proto.check = function() {
  var ac, active_command;
  
  try {
    ac = fizzywig.range.commonAncestor();
    active_command = ac && ((ac.nodeType === 3 && ac.parentNode && ac.parentNode.nodeName === 'A') || (ac.nodeType === 1 && ac.nodeName === 'A'));
  } catch(e) {}
    
  this.active = active_command;
  this.activate();
};

flb_proto.execute = function(e) {
  e.preventDefault();

  // restore our range since we've lost focus
  this.restoreSelection();
  
  if (this.active) {
    document.execCommand('unlink', false, null);
  } else {
    var return_vals = fizzywig.emitter.emit(this.prompt);

    if (return_vals[this.prompt]) {
      if (fizzywig.range.collapsed()) {
        var anchor = document.createElement('a');
        anchor.innerHTML = return_vals[this.prompt][0];
        anchor.setAttribute('href', return_vals[this.prompt][0]);
        fizzywig.range.insertNode(anchor);
      } else {
        document.execCommand(this.command, false, return_vals[this.prompt][0]);
      }
    }
  }

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
  this.restoreSelection();  
  fizzywig.emitter.emit(this.prompt, [fizzywig.range]);
  fizzywig.emitter.emit('click change');
};



function FizzyHTMLButton() {
  FizzyButton.apply(this, arguments);
}

var fhtml_proto = FizzyHTMLButton.prototype = new FizzyButton();
fhtml_proto.constructor = FizzyHTMLButton;

fhtml_proto.check = function() {
  this.active = this.toolbar.isSourceMode();
  this.activate();
};

fhtml_proto.activate = function() {
  var me = this;
  
  fb_proto.activate.call(this);
  
  if (this.active) {
    this.toolbar.disable();
    
    // hack :(
    setTimeout(function() {
      me.enable();
    }, 5);

  } else {
    this.toolbar.enable();
  }
};


fhtml_proto.execute = function(e) {
  e.preventDefault();
  
  this.toolbar.toggleSourceMode();
  fizzywig.emitter.emit('click change toggle');
};

