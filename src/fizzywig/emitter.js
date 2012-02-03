fizzywig.emitter = fizzy_emitter();

function fizzy_emitter() {
  var emitter   = {}
  ,   listeners = {}
  ;
  
  emitter.on = function(events, callback) {
    events = events.split(/\s+/);
    
    events.forEach(function(evt) {
      listeners[evt] = listeners[evt] || [];

      // don't create dupes
      if (listeners[evt].indexOf(callback) === -1) {
        listeners[evt].push(callback);
      }
    });
    
    return emitter;
  };
  
  emitter.off = function(events, callback) {
    events = events.split(/\s+/);
    
    events.forEach(function(evt) {
      if (listeners[evt]) {
        var i = listeners[evt].indexOf(callback);
      
        listeners[evt] = listeners[evt].slice(0, i).concat(listeners[evt].slice(i + 1));
      }
    });
    
    return emitter;
  };
  
  emitter.emit = function(events, args) {
    events = events.split(/\s+/);
    args   = args || [];
    
    var return_vals = {};
    
    events.forEach(function(evt) {
      if (listeners[evt]) {
        return_vals[evt] = [];
        
        listeners[evt].forEach(function(callback) {
          return_vals[evt].push(callback.apply(this, args));
        });
      }
    });
    
    return return_vals;
  };
  
  emitter.clear = function() {
    listeners = {};
    
    return emitter;
  };
  
  return emitter;
}

