
'use strict';

var  _ = require("underscore")
    , moment = require('moment')
    , URL = require('url')
    , crypto = require('crypto')
    , querystring = require('querystring')
    , cfg = require('../../config/open')
    , request = require('../../common/http/http').request; 

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
        timestamp: moment(new Date()).format('YYYY-MM-DD HH:mm:ss').toString(),
        method: params.method
    };
    
    delete params.method;

    /* api param */
    var ap = {
        '360buy_param_json': _appParam(params.param_json)   
    };

    sp.sign = _genSign(_.extend(sp, ap), cfg.JOS_APPSECRET);

    var u = URL.parse(_buildUrl(sp));
    
    request(u.hostname, u.path, u.port, querystring.stringify(ap), callback);
}

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
        .update(new Buffer(query, 'utf8'))
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
