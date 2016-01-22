'use strict';

var http = require('http')
    , querystring = require('querystring')
    , url = require('url')
    , port = require('../config/server').PORT
    , route = require('./router').route;

module.exports.start = function(route) {

    http.createServer(function(req, res) {
        req.setEncoding('utf8');

        var body = '', act = url.parse(req.url).pathname;
        
        if (req.method == 'POST') {
            req.on('data', function(trunk) { 
                // too much POST data, kill the connection!
                // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
                if (body.length > 1e6) {
                    req.connection.destroy();
                }

                body += trunk; 
            });

            req.on('end', function() { 
                route(act, res, req, querystring.parse(body));
            });
        }
        else route(act, res, req);

    }).listen(port);

    console.log('Server running at ' + port);
}
