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
    text_val = fizzywig.sanitizer(text_val, 'paste');

    object_tree[object_attr] = text_val;

    return object_tree;
  };
    
  content.toggleSourceMode = function() {
    if (content.isSourceMode()) {
      fizzywig.emitter.emit('toggle:preview');
      node.innerHTML = fizzywig.sanitizer(textarea.value.trim(), 'paste');
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
      textarea.value = fizzywig.sanitizer((user_val['sanitize:source'] && user_val['sanitize:source'][0]) || val, 'paste');
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
    var current_range = fizzywig.range.get()
    ,   ca = fizzywig.range.commonAncestor()
    ;

    if (ca && ca.nodeType === 3) ca = ca.parentNode;

    // if we're backspacing and there's no text left, don't delete the block element
    if (e && e.which === 8 && !(node.innerText || node.textContent || '').trim()) {
      node.innerHTML = '<p><br></p>';
      fizzywig.range.selectNodeContents(node);
      fizzywig.range.restore();
      return;
    }
    
    if (e && fizzywig.os.lion && e.shiftKey && e.which === 13) {
      e.preventDefault();

      var br;
      
      if (ca && ca.nodeType === 1 && ca.nodeName === 'PRE') {
        br = document.createTextNode("\n");
      } else {
        br = document.createElement("br");
      }
      
      fizzywig.range.insertNode(br);
      fizzywig.range.selectNode(br);
      fizzywig.range.collapse(false);
      fizzywig.range.restore();
     }
        
    try {
      if (e && e.which === 13) {
        if (ca.nodeType === 1 && 
            !fizzywig.grouping.test(ca.nodeName) &&
            !document.queryCommandState('insertunorderedlist') &&
            !document.queryCommandState('insertorderedlist')) {
              document.execCommand('formatBlock', false, '<p>');
        }
      }     
    } catch(e) {}
  }
  
  function paste(e) {
    setTimeout(function() {
      node.innerHTML = fizzywig.sanitizer(node.innerHTML.trim(), 'paste');
    }, 1);
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

