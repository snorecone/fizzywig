require("../env");

var vows = require("vows"),
    assert = require("assert");

var suite = vows.describe("fizzywig.content");

suite.addBatch({
  "content with one node": {
    topic: function() {
      var div   = document.createElement('div')
      ,   hello = document.createTextNode('hello world')
      ;
      
      div.appendChild(hello);
      div.setAttribute('data-content-editable', 'widget.html');
      document.body.appendChild(div);
      
      return fizzywig.content('[data-content-editable^="widget"]');
    },
    
    "when given namespaced keys, has an empty json object with those keys": function(content) {
      assert.deepEqual(content.json(), { "widget": { "html": "hello world" } });
    }
  },
  
  "content with multiple nodes": {
    topic: function() {
      var div1   = document.createElement('div')
      ,   hello1 = document.createTextNode('hello world')
      ,   div2   = document.createElement('div')
      ,   hello2 = document.createTextNode('hello world2')
      ;
      
      div1.appendChild(hello1);
      div1.setAttribute('data-content-editable', 'widget.html');
      
      div2.appendChild(hello2);
      div2.setAttribute('data-content-editable', 'widget.html2');
      
      document.body.appendChild(div1);
      document.body.appendChild(div2);
      
      return fizzywig.content('[data-content-editable^="widget"]');
    },
    
    "when given namespaced keys, has an empty json object with those keys": function(content) {
      assert.deepEqual(content.json(), { "widget": { "html": "hello world", "html2": "hello world2" } });
    }
  }
});

suite.export(module);
