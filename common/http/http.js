/**
 * Copyright(c) 2013-2015 www.diansan.com
 *
 * @file http.js 
 * @author W.G 2015-08-13
 * @version 1.0
 * @description http wrapper
 */

'use strict';

var util = require('util'), extend = util._extend,
    qstr = require('querystring');

exports.post = exports.get = function(url, post_data, headers, cb) {
    
    var timeout, uri = require('url').parse(url), post_string = ''; 

    uri.port = (uri.protocol == 'https:') ? 443 : 80;

    if (!uri || !uri.hostname || !uri.port || !uri.path) {
        return cb('PARSE_URL_ERROR', null);        
    }

    if (util.isArray(post_data)) {
        post_string = qstr.stringify(post_data);
    }
    else if (typeof post_data === 'object') {
        post_string = JSON.stringify(post_data);
    }
    else if(typeof post_data === 'string') {
        post_string = post_data;
    }

    var http_param = {
        host: uri.hostname,
        port: uri.port,
        path: uri.path,
        method: post_data ? 'POST' : 'GET',
        agent: false,
        headers: extend({
            'Content-Type': "application/x-www-form-urlencoded;charset=utf-8",
            'Content-Length': post_string ? post_string.length : 0,
            'Keep-Alive': true,
            'timeout': 5000
        }, headers || {})
    };

    var req = (
            uri.port == 443 ? 
            require('https') : require('http')
        ).request(http_param, function(res) {

        res.setEncoding('utf8');

        var data = '';

        res.on('data', function (chunk) {
            data += chunk;
        });

        res.on('end', function() {
            cb(null, data);
        });

    });

    req.on('socket', function (socket) {
        socket.setTimeout(5000);  
        socket.on('timeout', function() {
            req.abort();
        });
    });

    req.on('error', function(err) {
        console.log(err); 
        cb(err, null);
    });

    post_string && req.write(post_string + '\n');

    req.end();
};

exports.reponse = function(res, data, status, type, headers) {
    type = type || 'html';

    var isJson = type && type.toUpperCase() === 'JSON';

    headers = headers || {};
    headers['Content-Type'] = isJson ? 'application/json' : 'text/html';

    res.writeHead(
        status || 200, 
        headers
    );

    res.write(isJson ? JSON.stringify(data) : data);

    res.end();
};
