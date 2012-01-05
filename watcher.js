var fs = require('fs');
var spawn = require('child_process').spawn;
var building = false;

var watchdir = function(directory) {
  fs.readdir(directory, function(err, dir) {
    dir.forEach(function(f) {
      var file = directory + '/' + f;
      
      fs.stat(file, function(err, fd) {
        if (fd.isFile()) {
          fs.watch(file, function() {
            if (!building) {
              building = true;
              
              var build = spawn('make', ['test']);
              build.on('exit', function(c) {
                if (c === 0) {
                  console.log('build ok');
                }
                
                building = false;
              });
              
              build.stderr.on('data', function(data) {
                console.log(data.toString());
              });
            }
          });
        } else if (fd.isDirectory()) {
          watchdir(file);
        }
      });
    });
  });
};

watchdir('./src');

