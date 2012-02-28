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
    fizzywig.range = fizzy_range(node);
    fizzywig.range.moveToEnd(node);
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
      
  element_addEventListener(node, 'focus blur keyup mouseup paste change', emit);
  element_addEventListener(node, 'focus blur keyup mouseup paste change', makeRange);
  element_addEventListener(node, 'keydown mousedown focus blur paste change', normalizeBlockFormat);
  element_addEventListener(node, 'paste', paste);
  
  function makeRange(e) {
    fizzywig.range = fizzy_range(node);
  }
  
  function normalizeBlockFormat(e) {
    fizzywig.range = fizzy_range(node);
    
    // if we're backspacing and there's no text left, don't delete the block element
    if (e.which === 8 && !(node.innerText || node.textContent || '').trim()) {
      e.preventDefault();
      node.innerHTML = '';
    }
    
    // make sure the default format is a paragraph, and not text nodes or divs
    if (fizzywig.block_elements.indexOf(document.queryCommandValue('formatBlock')) === -1) {
      var n = fizzywig.range.commonAncestor();

      if (!n || n.nodeName.toLowerCase() === 'div') {
        document.execCommand('formatBlock', false, '<p>');
      }
    }
  }
  
  function paste(e) {
    setTimeout(function() {
      node.innerHTML = fizzywig.sanitizer(node.innerHTML, 'paste');
    }, 1);
  }
  
  function emit(e) {
    fizzywig.emitter.emit(e.type, [e]);
  }
  
  return content_node.enable();
}

