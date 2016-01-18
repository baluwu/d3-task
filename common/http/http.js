'use strict';

var http = require('http')
    , https = require('https')
    , querystring = require('querystring')
    , _ = require('underscore');

/**
 * HTTP Post请求
 * @param host 主机名
 * @param path 请求路径
 * @param port 端口
 * @param data {String} 请求的body参数 
 * @param head {Object} 请求头 
 * @param callback 回调函数
 * @constructor
 */
var _HTTPPost = function (host, path, port, head, data, callback) {
    
    var result = ''
        , timeout
        , post_data = data;

    var options = {
        hostname: host,
        port: port || 80,
        path: path || '/',
        method: 'POST',
        headers: _.extend(head, {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            'Content-Length': post_data.length,
            'timeout': 150000
        })
    };
    
    var req = (port == 80 ? http : https).request(options, function (res) {
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            result += chunk;
        });

        res.on('end', function (chunk) {
            callback(null, result);
        });
    });

    req.on('error', function (e) {
        console.log('problem with request: ' + e.message);
        callback(e.message, null);
    });

    req.on('timeout', function() {
        clearTimeout(timeout);

        if (req.res) {
            req.res.emit('abort');
        }

        req.abort();
    });

    timeout = setTimeout(function() { req.emit('timeout'); }, 15000);

    data.length > 0 && req.write(post_data + '\n');
    req.end();
};

exports.request = _HTTPPost;
