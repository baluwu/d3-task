
'use strict';

var cached_valid_routes = {};

exports.route = function(pathname, res, req, body) {

    var out_error = function(error, code) {
        res.writeHead(code || 404, {"Content-Type": "text/html"});
        res.write(error);
        res.end();
    };

    var ca = pathname.split('/', 3);

    if (ca.length == 3) {

        var ctrl = ca[1]
            , act = ca[2]
            , fs = require('fs')
            , r_k = ctrl + '/' + act
            , h_d = cached_valid_routes[r_k]
            , ctrl_file = './controller/' + ctrl + '.js';

        if (h_d) {
            console.log('use cached router');
            h_d(res, req, body);    
        }
        else fs.stat(ctrl_file, function(error, stats) {
            if (error) {
                return out_error("No controller named ${ctrl} found");
            }
            
            var handler = require(ctrl_file).handler;
            if (handler && handler[act]) {
                h_d = cached_valid_routes[r_k] = handler[act];
                h_d(res, req, body);       
            }
            else {
                out_error("No act named ${act} found in controller ${ctrl}");
            }
        });
    }
    else {
        out_error('pasrse error', 500);
    }
};
