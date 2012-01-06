function fizzy_range() {
  var selection
  ,   range = {}
  ;
  
  if (window.getSelection) {
    selection = window.getSelection();
    
    if (selection.rangeCount) {
      selection = selection.getRangeAt(0);
    }

  } else if (document.selection) {
    selection = document.selection.createRange();
  }
  
  range.is = function(el) {
    return el.toLowerCase() === range.parentNode();
  };
  
  range.parentNode = function() {
    if (selection) {
      if (window.getSelection) {
        return selection.startContainer.parentNode.nodeName.toLowerCase();
      } else {
        return selection.parentElement().nodeName.toLowerCase();
      }
    }
  };
  
  range.restore = function(with_parent) {
    if (window.getSelection) {
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(selection);
      
      if (with_parent) {
        var r = document.createRange();
        var a = range.commonAncestor();
                
        r.selectNode(a);
        sel.addRange(r);
      }
      
    } else if (document.selection && selection.select) {
      selection.select();
    }
  };
  
  range.commonAncestor = function() {
    var a = selection.commonAncestorContainer;
    
    if (a.nodeType === 3) {
      a = a.parentNode;
    }
    
    return a;
  }
  
  range.selectNode = function(node) {
    var r = document.createRange();
    var sel = window.getSelection();
    
    sel.removeAllRanges();
    r.selectNode(node);
    sel.addRange(r);
  };
  
  return range;
}

fizzywig.emitter.on('keyup mouseup paste change blur', function() {
  fizzywig.range = fizzy_range();
});

