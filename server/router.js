
exports.route = function(pathname, res, req, body) {

    var out_error = function(error) {
        res.writeHead(500, {"Content-Type": "text/html"});
        res.write(error);
        res.end();
    };

    var ca = pathname.split('/', 3);

    if (ca.length == 3) {

        var ctrl = ca[1], act = ca[2], fs = require('fs'),
            ctrl_file = './controller/' + ctrl + '.js';
        console.log(ctrl_file, ca);
        fs.stat(ctrl_file, function(error, stats) {
            if (error) {
                return out_error('No controller named ' + ctrl + ' found');
            }

            var handler = require(ctrl_file).handler;
            if (handler && handler[act]) {
                handler[act](res, req, body);       
            }
            else {
                out_error('No act named ' + act + ' found in controller ' + ctrl);
            }
        });
    }
    else {
        out_error('pasrse error');
    }
};
