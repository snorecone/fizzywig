function event_normalize(callback) {
  return function(evt) {
    if (!evt) evt = window.event;
    
    if (!evt.preventDefault) {
      evt.preventDefault = function() {
        evt.returnValue = false;
      }
    }
    
    evt.target = evt.target || evt.srcElement;
    evt.which  = evt.keyCode || evt.charCode;
    
    callback.apply(this, [evt]);
  }
}