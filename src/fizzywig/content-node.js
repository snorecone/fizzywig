function fizzy_contentNode(node, content) {
  var content_node = {}
  ,   object_attr
  ;
  
  object_attr = node.getAttribute('data-content-editable') || 'data';
  
  content_node.enable = function() {
    node.setAttribute('contentEditable', true);
    return content_node;
  };
  
  content_node.disable = function() {
    node.removeAttribute('contentEditable');
    return content_node;
  };
  
  content_node.json = function() {
    var object_tree = {};
    
    object_reach(object_tree, object_attr, node.innerHTML);
    return object_tree;
  };
    
  element_addEventListener(node, 'focus blur keyup mouseup paste change', emit);  
  element_addEventListener(node, 'keydown', keydown);
  
  function keydown(e) {
    // make sure the default format is a paragraph, and not text nodes or divs
    if (fizzywig.block_elements.indexOf(document.queryCommandValue('formatBlock')) === -1) {
      document.execCommand('formatBlock', false, '<p>');
    }
    
    // if we're backspacing and there's no text left, don't delete the block element
    if (e.which === 8 && !node.textContent.trim()) {
      e.preventDefault();
    }
  }
  
  function emit(e) {
    fizzywig.emitter.emit(e.type, [e]);
  }
  
  return content_node.enable();
}

