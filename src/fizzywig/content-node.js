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
    if (!document.queryCommandValue('formatBlock')) {
      document.execCommand('formatBlock', false, '<p>');
    }
  }
  
  function emit(e) {
    fizzywig.emitter.emit(e.type, [e]);
  }
  
  return content_node.enable();
}

