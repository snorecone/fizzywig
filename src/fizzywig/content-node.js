function fizzy_contentNode(node, content) {
  var content_node = {}
  ,   object_tree  = {}
  ,   object_attr
  ;
  
  object_attr = node.getAttribute('data-content-editable') || 'data';
  object_reach(object_tree, object_attr, node.innerHTML);
  
  content_node.enable = function() {
    node.setAttribute('contentEditable', true);
    return content_node;
  };
  
  content_node.disable = function() {
    node.removeAttribute('contentEditable');
    return content_node;
  };
  
  content_node.json = function() {
    return object_tree;
  };
  
  element_addEventListener(node, 'focus', focus);
  element_addEventListener(node, 'blur', blur);
  
  function focus() {
    content.events.emit('focus');
  }
  
  function blur() {
    content.events.emit('blur');
  }
  
  return content_node.enable();
}

