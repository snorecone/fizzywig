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
    element_addClass(node, 'fizzy-active');
    
    fizzywig.range = fizzy_range();
    fizzywig.range.moveToEnd(node);
    
    return content_node;
  };
  
  content_node.blur = function() {
    element_removeClass(node, 'fizzy-active');
    return content_node;
  };
  
  content_node.json = function() {
    var object_tree = {};
    
    object_reach(object_tree, object_attr, (node.innerHTML || '').trim());
    return object_tree;
  };
  
  content_node.toggleSourceMode = function() {
    if (content_node.isSourceMode()) {
      node.innerHTML = textarea.value.trim();
      textarea.style.display = 'none';
      node.style.display = 'block';
    } else {
      textarea.innerHTML = node.innerHTML.trim();
      node.style.display = 'none';
      textarea.style.display = 'block';
    }
  };
  
  content_node.isSourceMode = function() {
    return textarea.style.display !== 'none'
  };
    
  element_addEventListener(node, 'focus blur keyup mouseup paste change', emit);  
  element_addEventListener(node, 'keydown', keydown);
  element_addEventListener(node, 'paste', paste);
  element_addEventListener(node, 'mouseover', mouseover);
  element_addEventListener(node, 'mouseout', mouseout);
  
  function mouseover(e) {
    element_addClass(node, 'fizzy-hover');
  }
  
  function mouseout(e) {
    element_removeClass(node, 'fizzy-hover');
  }
  
  function keydown(e) {
    // if we're backspacing and there's no text left, don't delete the block element
    if (e.which === 8 && !(node.innerText || node.textContent || '').trim()) {
      e.preventDefault();
      return;
    }
    
    // normalize this bullshit in pre elements. when you hit the enter key,
    // you should create a new paragraph below the pre that you are in.
    if (e.which === 13 && !e.shiftKey) {
      var n = fizzywig.range.commonAncestor();

      if (n.nodeName.toLowerCase() === 'pre') {
        var end = document.createTextNode('\00');

        n.parentNode.insertBefore(end, n.nextSibling);
        fizzywig.range.selectNode(end);
        
        document.execCommand('formatBlock', false, '<p>');
      }
    }
    
    // make sure the default format is a paragraph, and not text nodes or divs
    if (fizzywig.block_elements.indexOf(document.queryCommandValue('formatBlock')) === -1) {
      document.execCommand('formatBlock', false, '<p>');
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

