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

            var buffers = [], nread = 0;

            /* trunck is a instance of Buffer */
            req.on('data', function(trunk) { 

                /* too much POST data, kill the connection! */
                /* 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB */
                if (body.length > 1e6) {
                    return req.connection.destroy();
                }

                buffers.push(trunk);
                nread += trunk.length;
            });

            req.on('end', function() { 
                var body = Buffer.concat(buffers, nread).toString();
                console.dir(body);
                process.exit();

                route(act, res, req, querystring.parse(body));
            });
        }
        else route(act, res, req);

    }).listen(port);

    console.log('Server running at ' + port);
}
