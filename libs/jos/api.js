
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
var _buildUrl = function(uri, pam) {
    var url = uri + '?';

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
    var auth = cfg.get_auth('jos', params.app_type);

    /* system params */
    var sp = {
        access_token: params.access_token,
        app_key: auth.k,
        v: '2.0',
        timestamp: moment(new Date()).format('YYYY-MM-DD HH:mm:ss').toString(),
        method: params.method
    };
    
    delete params.method;
    delete params.app_type;

    /* api param */
    var ap = {
        '360buy_param_json': _appParam(params.param_json)   
    };

    sp.sign = _genSign(_.extend(sp, ap), auth.s);

    var u = URL.parse(_buildUrl(auth.u, sp));
    
    request('POST', u.hostname, u.path, u.port, {}, querystring.stringify(ap), callback);
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
