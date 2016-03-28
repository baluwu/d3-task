
'use strict';

exports.serial = function (arr, fn, cb) {
    var l = arr.length, ret = [];

    function* g() {
        for (var i = 0; i < l; i++) {
            yield arr[i]    
        }   
    }

    var gi = g(), it = gi.next();

    more();

    function more() {
        if (it.done) { return cb(null, ret); }

        fn(it.value, function(err, r) {
            if (err) { cb(error, null); }
            else {
                ret.push(r);    
                it = gi.next();
                more();
            }
        });
    }
}

exports.parallel = function (arr, fn, cb) {
    var l = arr.length, tmp = {}, n_call = 0;

    function* g() {
        for (var i = 0; i < l; i++) {
            yield arr[i]    
        }   
    }

    var gi = g();

    more(gi.next());

    function more(it) {
        if (it.done) { return ; }
    
        fn(it.value, function(err, r) {
            n_call++;

            if (err) {
                cb(error, null);
            }
            else {
                tmp[it.value] = r;    

                if (n_call === l) {
                    var ret = [];
                    for (var x = 0; x < l; x++) {
                        ret.push(tmp[arr[x]]);
                    }
                    return cb(null, ret)
                }
            }
        });

        more(gi.next());
    }
}
