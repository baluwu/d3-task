
'use strict';

var _ = require('underscore')
    , moment = require('moment')
    , URL = require('url')
    , crypto = require('crypto')
    , querystring = require('querystring')
    , request = require('../../common/http/http').request
    , cfg = require('../../config/open'); 

/**
 * request method
 * @param params api param
 * @constructor
 */
var post = function (params, callback) {
    var auth = cfg.get_auth('yhd', params.app_type);

    delete params.app_type;
    
    /* params */
    var p = _.extend({
        appKey: auth.k,
        sessionKey: params.access_token,
        format: 'json',
        ver: '1.0',
        timestamp: moment(new Date()).format('YYYY-MM-DD HH:mm:ss').toString(),
        method: params.method
    }, params);
    
    p.sign = _genSign(p, auth.s);

    var u = URL.parse(auth.u);
    
    request('POST', u.hostname, u.path, u.port, {}, querystring.stringify(p), callback);
}

/**
 * 签名 API
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
