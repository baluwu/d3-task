
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
    var auth = cfg.get_auth('vip', params.app_type);

    delete params.app_type;

    var sp = {
        service: params.service,
        appKey: auth.k,
        version: '1.0.0',
        format: 'JSON',
        timestamp: Math.floor((new Date()).getTime() / 1000),
        method: params.method
    }; 

    if (params.access_token) {
        sp.accessToken = params.access_token;    
    }

    delete params.service;
    delete params.method;
    delete params.access_token;

    sp.sign = _genSign(sp, params, auth.k, auth.s);

    var u = URL.parse( 
        auth.u + '?' + 
        querystring.stringify(sp)    
    );
    
    request('post', u.hostname, u.path, 80, {
        'Content-Type': 'application/json',
    }, JSON.stringify(params), callback);
}

/**
 * 签名 API
 * @param params
 * @param secret
 * @return {String}
 * @constructor
 */
var _genSign = function (sys_params, api_params, key, secret) {
    var sign = '';

    if(sys_params.accessToken){
        sign += "accessToken" + sys_params.accessToken;
    }
    sign += "appKey" + key;
    sign += "format" + sys_params.format;
    if(sys_params.language) {
        sign += "language" + sys_params.language;
    }
    sign += "method" + sys_params.method;
    sign += "service" + sys_params.service;
    sign += "timestamp" + sys_params.timestamp;
    sign += "version" + sys_params.version;
    sign += JSON.stringify(api_params);

    return crypto.createHmac('md5', secret)
        .update(new Buffer(sign, 'utf8'))
        .digest('hex').toUpperCase();
}

exports.post = post;

