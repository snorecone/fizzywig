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
    return selection && selection.startContainer.parentNode.nodeName.toLowerCase();
  };
  
  range.restore = function() {
    if (window.getSelection) {
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(selection);
    } else if (document.selection && selection.select) {
      selection.select();
    }
  };
  
  return range;
}

fizzywig.range = fizzy_range();
fizzywig.emitter.on('keyup mouseup paste change blur', function() {
  fizzywig.range = fizzy_range();
});