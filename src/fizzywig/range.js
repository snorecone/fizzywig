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
        return selection.startContainer && selection.startContainer.parentNode.nodeName.toLowerCase();
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
    
    if (a && a.nodeType === 3) {
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
  
  range.moveToEnd = function(node) {
    var range, selection;
    
    if (document.createRange) {
      range = document.createRange();
      range.selectNodeContents(node);
      range.collapse(false);
      selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    } else if (document.selection) {
      range = document.body.createTextRange();
      range.moveToElementText(node);
      range.collapse(false);
      range.select();
    }
  };
  
  return range;
}

