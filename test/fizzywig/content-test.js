require("../env");

var vows = require("vows"),
    assert = require("assert");

var suite = vows.describe("fizzywig.content");

// suite.addBatch({
//   "content with one node": {
//     topic: function() {
//       var div   = document.createElement('div')
//       ,   hello = document.createTextNode('hello world')
//       ;
      
//       div.appendChild(hello);
//       div.setAttribute('data-content-editable', 'widget');
//       document.body.appendChild(div);
      
//       return fizzywig.content('[data-content-editable^="widget"]');
//     },
    
//     "when given namespaced keys, has an empty json object with those keys": function(content) {
//       assert.deepEqual(content.json(), { "widget": "hello world" });
//     }
//   }
// });

suite.export(module);
