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
        r.selectNode(selection.startContainer.parentNode);
        sel.addRange(r);
      }
      
    } else if (document.selection && selection.select) {
      selection.select();
    }
  };
  
  range.insert = function(node) {
    if (window.getSelection) {
      var sel = window.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        var range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(node);
      }
    } else if (document.selection && document.selection.createRange) {
      alert('incompatible for now');
      document.selection.createRange().pasteHTML(node);
    }
  };
  
  return range;
}

fizzywig.emitter.on('keyup mouseup paste change blur', function() {
  fizzywig.range = fizzy_range();
});

