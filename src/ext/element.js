function element_addEventListener(el, evt, callback, capture) {
  if (el.addEventListener) {
    el.addEventListener(evt, event_normalize.apply(this, [callback]), capture || false); 
  } else if (el.attachEvent) {
    el.attachEvent('on' + evt, event_normalize.apply(this, [callback]));
  }
}

function element_removeEventListener(el, evt, callback) {
  if (el.addEventListener) {
    el.removeEventListener(evt, event_normalize.apply(this, [callback])); 
  } else if (el.attachEvent) {
    el.detachEvent('on' + evt, event_normalize.apply(this, [callback]));
  }
}

