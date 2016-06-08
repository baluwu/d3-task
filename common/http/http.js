'use strict';

var http = require('http')
    , https = require('https')
    , querystring = require('querystring')
    , _ = require('underscore')
    , env = require('../../config/server').ENV;

/**
 * HTTP Post请求
 * @param type POST or GET
 * @param host 主机名
 * @param path 请求路径
 * @param port 端口
 * @param data {String} 请求的body参数 
 * @param head {Object} 请求头 
 * @param callback 回调函数
 * @constructor
 */
var _httpRequest = function (type, host, path, port, head, data, callback) {
    
    var result = ''
        , called = 0
        , timeout
        , post_data = data;

    var options = {
        hostname: host,
        port: port || 80,
        path: path || '/',
        method: type || 'POST',
        headers: _.extend({
            'Content-Length': post_data.length,
            'timeout': 150000
        }, head)
    };

    if (!options.headers['Content-Type']) {
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=utf-8';
    }

    var req = (options.port == 80 ? http : https).request(options, function (res) {
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            result += chunk;
        });

        res.on('end', function (chunk) {
            if (env == 'DEV' || env == 'TEST') {
                //console.log(result);
            }

            callback(null, result);
        });
    });

    req.on('socket', function (socket) {
        socket.setTimeout(5000);  
        socket.on('timeout', function() {
            req.abort();
        });
    });

    req.on('error', function (e) {
        console.log(e); 
        callback(e, null);
    });

    data.length > 0 && req.write(post_data + '\n');

    req.end();
};

exports.request = _httpRequest;

exports.response = function(res, data, status, type, headers) {
    type = type || 'html';

    var isJson = type && type.toUpperCase() === 'JSON';

    headers = headers || {};
    headers['Content-Type'] = isJson ? 'application/json' : 'text/html';

    res.writeHead(status || 200, headers);
    res.write(isJson ? JSON.stringify(data) : data);
    res.end();
};
