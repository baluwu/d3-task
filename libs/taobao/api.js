
'use strict';

var _ = require('underscore')
    , moment = require('moment')
    , querystring = require('querystring')
    , URL = require('url')
    , crypto = require('crypto')
    , cfg = require('../../config/open'),
    , request = require('../../common/http/http').request;

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

    request(u.hostname, u.pathname, u.port, {}, querystring.stringify(params), callback);
}

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
