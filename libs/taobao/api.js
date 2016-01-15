
'use strict';

var http = require('http'),
    _ = require("underscore"),
    moment = require('moment'),
    URL = require('url'),
    crypto = require('crypto'),
    querystring = require('querystring'),
    cfg = require('../../open');

/**
 *
 * @param url Container Url
 * @param appkey
 * @param appSecret
 * @param session client session
 * @param method request api
 * @param params
 * @constructor
 */
var post = function (session, method, params, callback) {
    _.extend(params, {
        app_key: cfg.TAOBAO_APPKEY,
        method: method,
        session: session,
        timestamp: moment(new Date()).format('YYYY-MM-DD HH:mm:ss').toString(),
        format: 'json',
        v: '2.0',
        sign_method: 'md5'
    });

    params.sign = _genSign(params, cfg.TAOBAO_APPSECRET);

    var u = URL.parse(cfg.TAOBAO_URL);

    _HTTPPost(u.hostname, u.pathname, u.port, params, callback);
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
var _HTTPPost = function (host, path, port, data, callback) {
    var result = ''
        , post_data = querystring.stringify(data);

    var options = {
        hostname: host,
        port: port || 80,
        path: path || '/',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
            'Content-Length': post_data.length,
            'timeout': 150000
        }
    };

    var req = http.request(options, function (res) {
        res.setEncoding('utf8');

        res.on('data', function (chunk) {
            result += chunk;
        });

        res.on('end', function (chunk) {
            callback(result);
        });
    });

    req.on('error', function (e) {
        console.dir(e);
        console.log('problem with request: ' + e.message);
    });

    req.write(post_data + '\n');
    req.end();

};

/**
 * 给TOP请求签名  API v2.0
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
        .update(_tempbytes)
        .digest('hex').toUpperCase();
}

/**
 *  对hash的key字母进行排序
 * @param params
 * @return {Object}
 * @constructor
 */
var _keySort = function (params) {
    return  _.object(_.pairs(params).sort());
}

exports.post = post;
