
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
    var auth = cfg.get_auth('zhe800', params.app_type);

    delete params.app_type;
    
    /* params */
    var p = _.extend({
        app_key: auth.k,
        access_token: params.access_token
    }, params);
    
    delete p.method;

    p.sign = _genSign(p);

    var u = URL.parse( 
        auth.u + '/' + 
        params.method + '?' +
        querystring.stringify(p)    
    );
    
    request('GET', u.hostname, u.path, 443, {}, '', callback);
}

/**
 * 签名 API
 * @param params
 * @param secret
 * @return {String}
 * @constructor
 */
var _genSign = function (params) {
    
    params = _keySort(params);
    
    var query = params.access_token;
    _.each(params, function (item, index) {
        query += index + item;
    })
    query += params.access_token;
    
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
