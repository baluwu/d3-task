'use strict';

var http = require('http')
    , querystring = require('querystring')
    , url = require('url')
    , port = require('../config/server').PORT
    , route = require('./router').route;

module.exports.start = function(route) {

    http.createServer(function(req, res) {
        req.setEncoding('utf8');

        var act = url.parse(req.url).pathname;
        
        if (req.method == 'POST') {

            var buffers = [], nread = 0, body = '';

            req.on('data', function(trunk) { 
                /* too much POST data, kill the connection! */
                /* 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB */
                if (nread > 1e6) {
                    console.log('POST data overdue');
                    return req.connection.destroy();
                }

                body += trunk;
                nread += trunk.length;
            });

            req.on('end', function() { 
                route(act, res, req, querystring.parse(body));
            });
        }
        else route(act, res, req);

    }).listen(port);

    console.log('Server running at ' + port);
}
