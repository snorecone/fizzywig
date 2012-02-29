function fizzy_contentNode(node, content) {
  var content_node = {}
  ,   object_attr
  ,   pasting
  ,   textarea
  ;
  
  object_attr = node.getAttribute('data-content-editable') || 'data';
  
  textarea = document.createElement('textarea');
  textarea.setAttribute('style', 'display:none;');
  textarea.setAttribute('class', 'fizzy-raw');
  
  node.parentNode.insertBefore(textarea, node.nextSibling);
  
  content_node.enable = function() {
    node.setAttribute('contentEditable', true);
    return content_node;
  };
  
  content_node.disable = function() {
    node.removeAttribute('contentEditable');
    return content_node;
  };
  
  content_node.focus = function() {
    return content_node;
  };
  
  content_node.blur = function() {
    return content_node;
  };
  
  content_node.moveToEnd = function() {
    fizzywig.selection = rangy.getSelection();
    fizzywig.range = rangy.createRange();
    fizzywig.range.selectNodeContents(node);
    fizzywig.range.collapse(false);
    fizzywig.selection.setSingleRange(fizzywig.range);
  };
  
  content_node.json = function() {
    var object_tree = {};
    
    object_reach(object_tree, object_attr, (node.innerHTML || '').trim());
    return object_tree;
  };
  
  content_node.tidy = function(callback) {
    callback(node);
    content_node.sanitize();
  };
  
  content_node.toggleSourceMode = function() {
    if (content_node.isSourceMode()) {
      node.innerHTML = fizzywig.sanitizer(textarea.value.trim(), 'paste');
      textarea.style.display = 'none';
      node.style.display = 'block';
      
      fizzywig.emitter.emit('sanitize:preview', [node]);
    } else {
      var val      = node.innerHTML.trim()
      ,   user_val = fizzywig.emitter.emit('sanitize:source', [val])
      ;
            
      textarea.value = fizzywig.sanitizer((user_val['sanitize:source'] && user_val['sanitize:source'][0]) || val, 'paste');
      node.style.display = 'none';
      textarea.style.display = 'block';
    }
  };
  
  content_node.isSourceMode = function() {
    return textarea.style.display !== 'none'
  };
  
  content_node.sanitize = function() {
    if (content_node.isSourceMode()) {
      node.innerHTML = fizzywig.sanitizer(node.innerHTML.trim(), 'paste');
    } else {
      textarea.value = fizzywig.sanitizer(textarea.value.trim(), 'paste');
    }
  };
      
  element_addEventListener(node, 'focus blur keyup mouseup paste change', debounce(emit, 50));
  element_addEventListener(node, 'focus blur keyup mouseup paste change', debounce(makeRange, 50));
  element_addEventListener(node, 'paste', paste);
  
  function makeRange(e) {
    fizzywig.selection = rangy.getSelection();
    fizzywig.range = fizzywig.selection.rangeCount && fizzywig.selection.getRangeAt(0);

    normalizeBlockFormat(e);
  }
  
  function normalizeBlockFormat(e) {    
    // if we're backspacing and there's no text left, don't delete the block element
    if (e.which === 8 && !(node.innerText || node.textContent || '').trim()) {
      e.preventDefault();
      node.innerHTML = '<p><br></p>';
    }
    
    // cases where we want to format block
    // - no ancestor
    // - text ancestor with parent == node
    // - ancestor == div && ancestor parent == node
    
    try {
      var ca = fizzywig.range.commonAncestorContainer;

      if (!ca || ((ca.nodeType === 3 || ca.nodeName === 'DIV') && ca.parentNode === node)) {
        document.execCommand('formatBlock', false, '<p>');
      }
    } catch(e) {}
  }
  
  function paste(e) {
    setTimeout(function() {
      node.innerHTML = fizzywig.sanitizer(node.innerHTML, 'paste');
    }, 1);
  }
  
  function emit(e) {
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
  
  return content_node.enable();
}

