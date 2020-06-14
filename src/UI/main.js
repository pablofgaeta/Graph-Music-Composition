var input = document.createElement('input');


relatives = []

var btn = document.createElement('button');
btn.innerHTML = 'Add new value';
document.body.appendChild(btn);

btn.onclick = () => {
   var input = document.createElement('input');
   document.body.appendChild(input);
   relatives.append(input);
}

// var keypress = require('keypress');
//
// keypress(process.stdin);
//
// process.stdin.on('keypress', function (ch, key) {
//    if (key && key.ctrl && key.name == 'c') {
//       console.log("exit")
//       process.stdin.pause();
//    }
//    else if (key) {
//       console.log(key.name);
//    }
// })
//
// process.stdin.setRawMode(true);
// process.stdin.resume();
