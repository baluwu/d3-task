
'use strict';

var  _ = require("underscore")
    , moment = require('moment')
    , URL = require('url')
    , crypto = require('crypto')
    , cfg = require('../../config/open')
    , request = require('../../common/http/http').request; 

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
    
    request(u.hostname, u.path, u.port, {}, '', callback);
}

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
