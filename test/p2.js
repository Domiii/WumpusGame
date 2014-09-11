console.log(global.x + exports.y);

function func(input) {
  process.send('Hello ' + input);
}

process.on('message', function(m) {
  func(m.s);
});