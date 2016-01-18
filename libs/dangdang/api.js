
'use strict';

var  _ = require("underscore")
    , moment = require('moment')
    , URL = require('url')
    , crypto = require('crypto')
    , querystring = require('querystring')
    , cfg = require('../../config/open')
    , request = require('../../common/http/http').request; 

/**
 * generate request url
 * @param pam
 * @return {String}
 * @constructor
 */
var _buildUrl = function(pam) {
    pam = _keySort(pam);

    var url = cfg.DANGDANG_URL + '?';

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
var post = function (params, xml, callback) {
    
    /* system params */
    var sp = {
        method: params.method,
        timestamp: moment(new Date()).format('YYYY-MM-DD HH:mm:ss').toString(),
        format: 'xml',
        app_key: cfg.DANGDANG_APPKEY,
        v: '1.0',
        sign_method: 'md5',
        session: params.access_token
    };

    sp.sign = _genSign(sp, cfg.DANGDANG_APPSECRET);
    
    delete params.method;
    delete params.access_token;

    /* api param */
    var ap = _.extend(sp, params);

    var u = URL.parse(_buildUrl(sp)); 
    
    request(u.hostname, u.path, u.port, {
        'Content-Type': 'application/xml;charset=GBK'
    }, xml, callback);
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
