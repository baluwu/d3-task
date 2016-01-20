'use strict';

/**
 * 数组切分
 * @param arr {Object Array} 数组
 * @param n {Integer} 步长
 * @return {Object Array}
 * @constructor
 */
var _array_split = function(arr, n) {

    var s = 0
        , o = n || 50
        , e = o
        , w
        , r = [];

    while((w = arr.slice(s, e)) && w.length > 0) {

        r.push(w);

        if(w.length < o) break;

        s += w.length;
        e = s + o;
    }

    return r;
};

exports.array_split = _array_split;
