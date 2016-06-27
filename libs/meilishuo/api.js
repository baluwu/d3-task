
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
    var auth = cfg.get_auth('meilishuo', params.app_type);

    delete params.app_type;

    var sp = {
        app_key: auth.k,
        v: '1.0',
        format: 'json',
        sign_method: 'md5',
        timestamp: moment(new Date()).format('YYYY-MM-DD HH:mm:ss').toString(),
        session: params.access_token,
        method: params.method
    }; 
    
    delete params.access_token;
    delete params.method;

    var p = _.extend(sp, params);

    p.sign = _genSign(p, auth.s);

    var u = URL.parse( 
        auth.u + '/' + 
        params.method + '?' +
        querystring.stringify(sp)    
    );
    
    request('post', u.hostname, u.path, 443, {}, querystring.stringify(params), callback);
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
        .update(new Buffer(query, 'utf8'))
        .digest('hex').toUpperCase();
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
