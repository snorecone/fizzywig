fizzywig.prompter = fizzy_prompter();

function fizzy_prompter() {
  var prompts  = {}
  ,   prompter = {}
  ;
  
  prompter.prompt = function(key, fun) {
    if (fun !== undefined) {
      prompts[key] = fun;
    } else {
      if (typeof prompts[key] === 'function') {
        return prompts[key].call(null);
      }
    }
  };
  
  return prompter;
}

