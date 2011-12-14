function element_addEventListener(el, events, callback, capture) {
  events = events.split(/\s+/);
  
  events.forEach(function(evt) {
    if (el.addEventListener) {
      el.addEventListener(evt, event_normalize.apply(this, [callback]), capture || false); 
    } else if (el.attachEvent) {
      el.attachEvent('on' + evt, event_normalize.apply(this, [callback]));
    }
  });
}

function element_removeEventListener(el, events, callback) {
  events = events.split(/\s+/);
  
  events.forEach(function(evt) {
    if (el.addEventListener) {
      el.removeEventListener(evt, event_normalize.apply(this, [callback])); 
    } else if (el.attachEvent) {
      el.detachEvent('on' + evt, event_normalize.apply(this, [callback]));
    }
  });
}

function element_addClass(el, klass) {
  var classes = el.className.split(/\s+/);
  
  if (classes.indexOf(klass) === -1) {
    classes.push(klass);
  }

  el.className = classes.join(' ');
}

function element_removeClass(el, klass) {
  var classes = el.className.split(/\s+/)
  ,   i       = classes.indexOf(klass)
  ;
  
  if (i !== -1) {
    classes = classes.slice(0, i).concat(classes.slice(i + 1));
  }
  
  el.className = classes.join(' ');
}

