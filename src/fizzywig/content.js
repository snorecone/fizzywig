fizzywig.content = function(selector_or_node) {
  var content  = {}
  ,   node
  ,   toolbar
  ,   save_timer
  ,   content_tree = {}
  ,   object_attr
  ,   pasting
  ,   textarea
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
  
  content.json = function() {
    var object_tree = {};
    object_tree[object_attr] = (node.innerHTML || '').trim();
    
    return object_tree;
  };
  
  content.tidy = function(callback) {
    if (content.isSourceMode()) {
      content.toggleSourceMode();
    }
    
    content.sanitize();
  };
  
  content.toggleSourceMode = function() {
    if (content.isSourceMode()) {
      node.innerHTML = fizzywig.sanitizer(textarea.value.trim(), 'paste');
      textarea.style.display = 'none';
      node.style.display = 'block';
      
      fizzywig.emitter.emit('sanitize:preview', [node]);
      normalizeBlockFormat();
      content.moveToEnd();
    } else {
      var val      = node.innerHTML.trim()
      ,   user_val = fizzywig.emitter.emit('sanitize:source', [val])
      ;
            
      textarea.value = fizzywig.sanitizer((user_val['sanitize:source'] && user_val['sanitize:source'][0]) || val, 'paste');
      node.style.display = 'none';
      textarea.style.display = 'block';
    }
  };
  
  content.isSourceMode = function() {
    return textarea.style.display !== 'none'
  };
  
  content.sanitize = function() {
    if (content_node.isSourceMode()) {
      textarea.value = fizzywig.sanitizer(textarea.value.trim(), 'paste');      
    } else {
      var val, user_val;
      val = node.innerHTML.trim();
      user_val = fizzywig.emitter.emit('sanitize:source', [val]);
      
      node.innerHTML = fizzywig.sanitizer((user_val['sanitize:source'] && user_val['sanitize:source'][0]) || val, 'paste');
      fizzywig.emitter.emit('sanitize:preview', [node]);
    }
  };
    
  fizzywig.emitter.on('keyup change blur paste', startSaveTimer);
      
  // a proxy for our emitter
  content.on = fizzywig.emitter.on;
  
  element_addEventListener(node, 'focus blur keyup mouseup paste change', emit);
  element_addEventListener(node, 'focus blur keyup mouseup paste change', debounce(normalizeBlockFormat, 50));
  element_addEventListener(node, 'paste', paste);
  
  function normalizeBlockFormat(e) {    
    fizzywig.range.get();
    
    // if we're backspacing and there's no text left, don't delete the block element
    if ((!e || e.which === 8) && !(node.innerText || node.textContent || '').trim()) {
      node.innerHTML = '<p><br></p>';
      fizzywig.range.selectNodeContents(node);
      fizzywig.range.restore();
      return;
    }
        
    try {
      var children = Array.prototype.slice.apply(node.childNodes);
      
      children.forEach(function(child) {
        if (child.nodeType === 3 && child.textContent.trim()) {
          fizzywig.range.selectNode(child);
          document.execCommand('formatBlock', false, '<p>');
          
        } else if (child.nodeType === 1 && !fizzywig.grouping.test(child.nodeName)) {
          fizzywig.range.selectNode(child);
          document.execCommand('formatBlock', false, '<p>');
        }
      });
      
    } catch(e) {}
  }
  
  function paste(e) {
    setTimeout(function() {
      content.sanitize();
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

