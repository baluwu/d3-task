
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
 * @param callback
 * @constructor
 */
var post = function (params, callback) {
    var now = moment(new Date()).format("YYYY-MM-DD HH:mm:ss").toString();
    
    /* post data */
    var pd = params.param_json;

    /* request head */
    var head = {
        appMethod: params.method,
        appRequestTime: now,
        format: 'json',
        appKey: cfg.SUNING_APPKEY,
        access_token: params.access_token,
        signInfo: 
            _genSign({
                method: params.method,
                timespan: now,
                appKey: cfg.SUNING_APPKEY,
                v: 'V1.2',
                postData: pd
            }, cfg.SUNING_APPSECRET),
        versionNo: 'V1.2',
        'Content-Type': 'text/xml; charset=utf-8'
    };
    
    var u = URL.parse(cfg.SUNING_URL);
    
    _httpPost(u.hostname, u.path, u.port, head, pd, callback);
}

/**
 * HTTP Post请求
 * @param host 主机名
 * @param path 请求路径
 * @param port 端口
 * @param head http头
 * @param data 请求的body参数
 * @param callback 回调函数，接受返回的数据
 * @constructor
 */
var _httpPost = function (host, path, port, head, data, callback) {

    var result = ''
        , timeout
        , post_data = data;//querystring.stringify(data);
    
    var options = {
        hostname: host,
        port: port || 80,
        path: path || "/",
        method: 'POST',
        headers: _.extend(head, {
            'Content-Type': "application/x-www-form-urlencoded;charset=utf-8",
            'Content-Length': post_data.length,
            'timeout': 15000
        })
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

    var tobeSigned = secret
        + params.method
        + params.timespan
        + params.appKey 
        + params.v
        + (new Buffer(params.postData).toString('base64'));

    tobeSigned = new Buffer(tobeSigned, 'utf8');

    return require("crypto")
        .createHash("md5")
        .update(tobeSigned)
        .digest('hex')
        .toUpperCase();
}

exports.post = post;
