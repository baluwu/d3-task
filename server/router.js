
'use strict';

var response = require('../common/http/http').response;
var cached_valid_routes = {};

exports.route = function(pathname, res, req, body) {

    var ca = pathname.split('/', 3);

    if (ca.length == 3) {

        var 
            ctrl = ca[1]
            , act = ca[2]
            , fs = require('fs')
            , r_k = ctrl + '/' + act
            , h_d = cached_valid_routes[r_k]
            , file = './controller/' + ctrl + '.js';

        if (h_d) { h_d(res, req, body); }
        else fs.exists(file, function(exist) {
            if (!exist) {
                return response(res, `No controller named ${ctrl} found`, 404);
            }
            
            var handler = require(ctrl_file).handler;

            if (handler && handler[act]) {
                h_d = cached_valid_routes[r_k] = handler[act];
                h_d(res, req, body);       
            }
            else {
                response(res, `No act named ${act} found in controller ${ctrl}`, 404);
            }
        });
    }
    else {
        response(res, 'pasrse error', 404);
    }
};
