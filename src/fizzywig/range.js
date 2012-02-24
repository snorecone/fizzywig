function fizzy_range(context) {
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
      
      if (selection.collapsed) {
        var shim = document.createTextNode('\00');
        selection.insertNode(shim);
        selection.selectNode(shim);
      }
      
      sel.removeAllRanges();
      sel.addRange(selection);

      if (with_parent) {
        var r = context.createRange();
        var a = range.commonAncestor();
                
        r.selectNode(a);
        sel.addRange(r);
      }
      
    } else if (document.selection && selection.select) {
      selection.select();
    }
  };
  
  range.commonAncestor = function() {
    var a;

    if (window.getSelection) {
      a = selection.commonAncestorContainer;
      
      if (a && a.nodeType === 3) {
        a = a.parentNode;
      }
    } else if (document.selection) {
      a = selection.parentElement();
    }
    
    return a;
  }
  
  range.selectNode = function(node) {
    var r = context.createRange();
    var sel = window.getSelection();
    
    sel.removeAllRanges();
    r.selectNode(node);
    sel.addRange(r);
  };
  
  range.moveToEnd = function(node) {
    var range, sel;
    
    if (context.createRange) {
      range = context.createRange();
      range.selectNodeContents(node);
      range.collapse(false);
      sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (document.selection) {
      range = context.createTextRange();
      range.moveToElementText(node);
      range.collapse(false);
      range.select();
    }
  };
  
  range.insertHTML = function(str) {
    if (selection && selection.pasteHTML) {
      selection.pasteHTML(str);
      
    } else {
      var el   = document.createElement("div")
      ,   frag = document.createDocumentFragment()
      ,   node
      ,   lastNode
      ;
      
      el.innerHTML = str;

      while (node = el.firstChild) {
        lastNode = frag.appendChild(node);
      }
      
      selection.insertNode(frag);
    }
  };
  
  return range;
}

