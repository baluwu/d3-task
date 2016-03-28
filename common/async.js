
'use strict';

var fs = require('fs');
var arr = [
    'test1', 'test2', 'test3', 'test4'
];

function serial(arr, fn, cb) {
    var l = arr.length, ret = [];

    function* g() {
        for (var i = 0; i < l; i++) {
            yield arr[i]    
        }   
    }

    var gi = g(), it = gi.next();

    more();

    function more() {
        if (it.done) {
            return cb(null, ret);
        }

        fn(it.value, function(err, r) {
            if (err) {
                cb(error, null);
            }
            else {
                ret.push(r);    
                it = gi.next();
                more();
            }
        });
    }
}

serial(arr, function(el, icb) { 
    fs.exists('test.md', function(err) {
        icb(null, 1); 
    });
}, function(err, r) { console.dir(r); });
