var fork = require('child_process').fork;

var p2 = fork(__dirname + '/p2.js');
p2.on('message', function(response) {
  console.log(response);
});

p2.send({s: 'input'});