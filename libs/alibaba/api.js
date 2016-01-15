
'use strict';

var http = require('http')
    , _ = require("underscore")
    , moment = require('moment')
    , URL = require('url')
    , crypto = require('crypto')
    , querystring = require('querystring')
    , cfg = require('../../config/open'); 

/**
 * generate request url
 * @param sys_pam
 * @param api_pam
 * @return {String}
 * @constructor
 */
var _buildUrl = function(sys_pam, api_pam) {
    var arr = []
        , str = '';

    _.each(sys_pam, function(v, k) {
        arr.push(v); 
    });

    str = arr.join('/');

    var url = cfg.ALIBABA_URL + '/' + str + '?';

    _.each(api_pam, function(v, k) {
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
        param: 'param2',
        version: '1',
        namespace: 'cn.alibaba.open',
        method: params.method,
        app_key: cfg.ALIBABA_APPKEY
    };
    
    delete params.method;

    params._aop_signature = _genSign(sp, params, cfg.ALIBABA_APPSECRET);

    var u = URL.parse(_buildUrl(sp, params));
    
    _httpPost(u.hostname, u.path, u.port, callback);
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
var _httpPost = function (host, path, port, callback) {

    var result = ''
        , timeout;
    
    var options = {
        hostname: host,
        port: port || 80,
        path: path || "/",
        method: 'POST',
        headers: {
            'Content-Type': "application/x-www-form-urlencoded;charset=utf-8",
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
    
    req.end();
};

/**
 * 签名 API 
 * @param sys_pams
 * @param api_pams
 * @param secret
 * @return {String}
 * @constructor
 */
var _genSign = function (sys_pams, api_pams, secret) {
    var arr = []
        , str1 = ''
        , str2 = '';

    _.each(sys_pams, function(v, k) {
        arr.push(v);       
    });
 
    str1 = arr.join('/');

    api_pams = _keySort(api_pams);
       
    _.each(api_pams, function (v, k) {
        str2 += k + v;
    })
    
    return crypto.createHmac('sha1', secret)
        .update(new Buffer(str1 + str2, 'utf8'))
        .digest('hex')
        .toUpperCase();
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
