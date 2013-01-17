fizzywig.content = function(selector_or_node) {
  var content  = {}
  ,   node
  ,   toolbar
  ,   save_timer
  ,   content_tree = {}
  ,   object_attr
  ,   pasting
  ,   textarea
  ,   source_mode
  ;
  
  // clear events first
  fizzywig.emitter.clear();
  
  if (typeof selector_or_node === 'string') {
    node = document.querySelector(selector_or_node);
  } else if (selector_or_node instanceof Node) {
    node = selector_or_node;
  }
  
  object_attr = node.getAttribute('data-content-editable') || 'data';
  
  textarea = document.createElement('textarea');
  textarea.setAttribute('style', 'display:none;');
  textarea.setAttribute('class', 'fizzy-raw');
  
  node.parentNode.insertBefore(textarea, node.nextSibling);
    
  content.toolbar = function(tb_selector) {
    if (!arguments.length) return toolbar;
    
    toolbar = fizzy_toolbar(tb_selector, content);
    return content;
  };
  
  content.enable = function() {
    node.setAttribute('contentEditable', true);
    
    try {
      document.execCommand('styleWithCSS', false, false);
      document.execCommand('insertBROnReturn', false, false);
      document.execCommand('enableInlineTableEditing', false, false);
      document.execCommand('enableObjectResizing', false, false);
    } catch(e) {}
    
    return content;
  };
  
  content.disable = function() {
    node.removeAttribute('contentEditable');
    return content;
  };
  
  content.focus = function() {
    node.focus();
  };
    
  content.moveToEnd = function() {
    fizzywig.range.moveToEnd(node);
  };
  
  content.json = function(callback) {
    var object_tree = {}
    ,   text_val
    ;
    
    text_val = ((source_mode ? textarea.value : node.innerHTML) || '').trim();
    text_val = fizzywig.sanitizer(text_val, 'default');

    object_tree[object_attr] = text_val;

    return object_tree;
  };
    
  content.toggleSourceMode = function() {
    if (content.isSourceMode()) {
      fizzywig.emitter.emit('toggle:preview');
      node.innerHTML = fizzywig.sanitizer(textarea.value.trim(), 'default');
      textarea.style.display = 'none';
      node.style.display = 'block';
      
      fizzywig.emitter.emit('sanitize:preview', [node]);
      content.moveToEnd();
      source_mode = false;
    } else {
      var val      = node.innerHTML.trim()
      ,   user_val = fizzywig.emitter.emit('sanitize:source', [val])
      ;
      
      node.style.display = 'none';
      textarea.style.display = 'block';
      textarea.value = fizzywig.sanitizer((user_val['sanitize:source'] && user_val['sanitize:source'][0]) || val, 'default');
      fizzywig.emitter.emit('toggle:source', [textarea]);
      source_mode = true;
    }
  };
  
  content.isSourceMode = function() {
    return source_mode;
  };
    
  fizzywig.emitter.on('keyup change blur paste', startSaveTimer);
      
  // a proxy for our emitter
  content.on = fizzywig.emitter.on;
  
  element_addEventListener(node, 'focus blur keyup mouseup paste change', emit);
  element_addEventListener(node, 'focus blur keydown mousedown paste change', normalizeBlockFormat);
  element_addEventListener(node, 'paste', paste);
  
  function normalizeBlockFormat(e) {
    var ca = fizzywig.range.commonAncestor();
    if (ca && ca.nodeType === 3) ca = ca.parentNode;
    
    if (!node.lastChild || node.lastChild.nodeName !== 'BR') {
      node.appendChild(document.createElement('br'));
    }
    
    if (e && e.which === 13) {
      if (!document.queryCommandState('insertunorderedlist') &&
          !document.queryCommandState('insertorderedlist') &&
          ca && ca.nodeType === 1 && /^(P|DIV)$/.test(ca.nodeName)) {
            var br = document.createElement("br");
            var sel = rangy.getSelection();
            var range = sel.getRangeAt(0);
            range.deleteContents();
            range.insertNode(br);
            range.collapseAfter(br);
            sel.setSingleRange(range);
            if (e.preventDefault) {
              e.stopPropagation();
              e.preventDefault();
            } else {
              e.returnValue = false;
            }
            return false;
      }
      
      if (ca && ca.nodeType === 1 && /(H[1-6]|PRE)/.test(ca.nodeName)) {
        setTimeout(function() {
          var sel = rangy.getSelection();
          var range = sel.getRangeAt(0);
          if (range.commonAncestorContainer && range.commonAncestorContainer.nodeType === 1 && /^P|DIV$/.test(range.commonAncestorContainer.nodeName)) {
            while (range.commonAncestorContainer.firstChild) {
              range.insertNode(range.commonAncestorContainer.firstChild);
              range.commonAncestorContainer.removeChild(range.commonAncestorContainer.firstChild);
            }
            range.commonAncestorContainer.parentNode.removeChild(range.commonAncestorContainer);
            range.collapse(false);
            sel.setSingleRange(range);
            if (e.preventDefault) {
              e.stopPropagation();
              e.preventDefault();
            } else {
              e.returnValue = false;
            }
          }
        }, 1);
      }
    }
  }
  
  function paste(e) {
    // Store selection
    var savedSel = rangy.saveSelection();

    // Remove and store the editable content
    var frag = extractContent(node);

    // Schedule the post-paste processing
    window.setTimeout(function() {
      // Get and sanitize pasted content
      var div = document.createElement('div');
      div.innerHTML = fizzywig.sanitizer(node.innerHTML.trim(), 'paste');
      node.innerHTML = '';
      var pastedFrag = extractContent(div);
      
      // Restore original DOM
      node.appendChild(frag);

      // Restore previous selection
      var sel = rangy.getSelection();
      rangy.restoreSelection(savedSel);

      // Delete previous selection
      sel.deleteFromDocument();
      var lastNode = pastedFrag.lastChild;

      // Insert pasted content
      var range = sel.getRangeAt(0);
      range.insertNode(pastedFrag);

      // Move selection to after the pasted content
      range.collapseAfter(lastNode);
      rangy.getSelection().setSingleRange(range);
    }, 1);
  }
  
  function extractContent(nod) {
    var frag = document.createDocumentFragment()
    ,   child
    ;
    
    while (child = nod.firstChild) {
      frag.appendChild(child);
    }
    
    return frag;
  }
  
  function emit(e) {
    fizzywig.range.get();
    fizzywig.emitter.emit(e.type, [e]);
  }
  
  function debounce(callback, delay) {
    var timeout;

    return function() {
      var args = arguments
      ,   self = this;

      function exec() {
        callback.apply(self, args);
        timeout = null;
      }

      clearTimeout(timeout);
      timeout = setTimeout(exec, delay);    
    }
  }
  
  function startSaveTimer() {
    if (save_timer) { return; }
    
    var current_content_tree = content.json();
    
    // do we have any real changes?
    if (JSON.stringify(content_tree) !== JSON.stringify(current_content_tree)) {
      
      // let's let someone know
      fizzywig.emitter.emit('dirty');
      
      // save in 2 seconds
      save_timer = setTimeout(function() {
        fizzywig.emitter.emit('save', [content_tree = content.json()]);
        save_timer = null;
      }, 2000);
    }
  }
  
  return content.enable();
};

