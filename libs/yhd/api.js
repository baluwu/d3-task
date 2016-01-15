
'use strict';

var http = require('http')
    , _ = require("underscore")
    , moment = require('moment')
    , URL = require('url')
    , crypto = require('crypto')
    , querystring = require('querystring')
    , cfg = require('../../config/open'); 

/**
 * request method
 * @param params api param
 * @constructor
 */
var post = function (params, callback) {
    
    /* params */
    var p = _.extend({
        appKey: cfg.YHD_APPKEY,
        sessionKey: params.access_token,
        format: 'json',
        ver: '1.0',
        timestamp: moment(new Date()).format('YYYY-MM-DD HH:mm:ss').toString(),
        method: params.method
    }, params);
    
    p.sign = _genSign(p, cfg.YHD_APPSECRET);

    var u = URL.parse(cfg.YHD_URL);
    
    _httpPost(u.hostname, u.path, u.port, p, callback);
}

/**
 * HTTP Post请求
 * @param host 主机名
 * @param path 请求路径
 * @param port 端口
 * @param data 请求的body参数
 * @param callback 回调函数，接受返回的数据
 * @constructor
 */
var _httpPost = function (host, path, port, data, callback) {

    var result = ''
        , timeout
        , post_data = querystring.stringify(data);
    
    var options = {
        hostname: host,
        port: port || 80,
        path: path || "/",
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            'Content-Length': post_data.length,
            'timeout': 15000
        }
    };
    
    var req = http.request(options, function (res) {

        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            result += chunk;
        });

        res.on('end', function (chunk) {
            console.dir(result);
            callback(result);
        });
    });

    req.on('error', function (e) {
        console.dir(e);
        console.log('problem with request: ' + e.message);
    });
    
    req.on('timeout', function() {
        clearTimeout(timeout);

        if (req.res) {
            req.res.emit('abort');
        }

        req.abort();
    });

    timeout = setTimeout(function() { req.emit('timeout'); }, 15000);
    
    req.write(post_data + '\n');
    req.end();
};

/**
 * 签名 API v2.0
 * @param params
 * @param secret
 * @return {String}
 * @constructor
 */
var _genSign = function (params, secret) {
    
    params = _keySort(params);
    
    var query = secret;
    _.each(params, function (item, index) {
        query += index + item;
    })
    query += secret;
    
    return crypto.createHash('md5')
        .update(new Buffer(query, 'utf-8'))
        .digest('hex');
}

/**
 * 对hash的key字母进行排序
 * @param params
 * @return {Object}
 * @constructor
 */
var _keySort = function (params) {
    return  _.object(_.pairs(params).sort());
}

exports.post = post;
