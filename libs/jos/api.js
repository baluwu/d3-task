
'use strict';

var http = require('http')
    , _ = require("underscore")
    , moment = require('moment')
    , URL = require('url')
    , crypto = require('crypto')
    , querystring = require('querystring')
    , cfg = require('../../config/open'); 

var _appParam = function(pam) {
    return JSON.stringify(_keySort(pam));
};

/**
 * generate request url
 * @param pam
 * @return {String}
 * @constructor
 */
var _buildUrl = function(pam) {
    var url = cfg.JOS_URL + '?';

    _.each(pam, function(v, k) {
        url += k + '=' + encodeURIComponent(v) + '&'; 
    });
    
    return url.substr(0, url.length - 1);
};

/**
 * request method
 * @param params api param
 * @constructor
 */
var post = function (params, callback) {
    
    /* system params */
    var sp = {
        access_token: params.access_token,
        app_key: cfg.JOS_APPKEY,
        v: '2.0',
        timestamp: moment(new Date()).format("YYYY-MM-DD HH:mm:ss").toString(),
        method: params.method
    };
    
    delete params.method;

    /* api param */
    var ap = {
        '360buy_param_json': _appParam(params.param_json)   
    };

    sp.sign = _genSign(_.extend(sp, ap), cfg.JOS_APPSECRET);

    var u = URL.parse(_buildUrl(sp));
    
    _httpPost(u.hostname, u.path, u.port, ap, callback);
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
            'Content-Type': "application/x-www-form-urlencoded;charset=utf-8",
            'Content-Length': post_data.length,
            'timeout': 30000
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
    
    var _tempbytes = new Buffer(query, 'utf8')
        var result = require("crypto").createHash("md5")
        .update(_tempbytes)
        .digest('hex').toUpperCase();
    return result;
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
