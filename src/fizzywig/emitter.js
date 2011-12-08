fizzywig.emitter = fizzy_emitter();

function fizzy_emitter() {
  var emitter   = {}
  ,   listeners = {}
  ;
  
  emitter.on = function(evt, callback) {
    listeners[evt] = listeners[evt] || [];
    
    // don't create dupes
    if (listeners[evt].indexOf(callback) === -1) {
      listeners[evt].push(callback);
    }
    
    return emitter;
  };
  
  emitter.off = function(evt, callback) {
    if (listeners[evt]) {
      var i = listeners[evt].indexOf(callback);
      
      listeners[evt] = listeners[evt].slice(0, i).concat(listeners[evt].slice(i + 1));
    }
    
    return emitter;
  };
  
  emitter.emit = function(evt, args) {
    if (listeners[evt]) {
      listeners[evt].forEach(function(callback) {
        callback.apply(this, args);
      });
    }
  };
  
  return emitter;
}

