
'use strict';

var _ = require('underscore')
    , moment = require('moment')
    , URL = require('url')
    , crypto = require('crypto')
    , cfg = require('../../config/open')
    , request = require('../../common/http/http').request; 

/**
 * request method
 * @param params api param
 * @param callback
 * @constructor
 */
var post = function (params, callback) {
    var auth = cfg.get_auth('suning', params.app_type);
    var now = moment(new Date()).format('YYYY-MM-DD HH:mm:ss').toString();

    delete params.app_type;
    
    /* post data */
    var pd = params.param_json;

    /* request head */
    var head = {
        appMethod: params.method,
        appRequestTime: now,
        format: 'json',
        appKey: auth.k,
        access_token: params.access_token,
        signInfo: 
            _genSign({
                method: params.method,
                timespan: now,
                appKey: auth.k,
                v: 'V1.2',
                postData: pd
            }, auth.s),
        versionNo: 'V1.2',
        'Content-Type': 'text/xml; charset=utf-8'
    };
    
    var u = URL.parse(auth.u);
    
    request('POST', u.hostname, u.path, u.port, head, pd, callback);
}

/**
 * 签名 API v2.0
 * @param params
 * @param secret
 * @return {String}
 * @constructor
 */
var _genSign = function (params, secret) {

    var tobeSigned = secret
        + params.method
        + params.timespan
        + params.appKey 
        + params.v
        + (new Buffer(params.postData).toString('base64'));

    tobeSigned = new Buffer(tobeSigned, 'utf8');

    return crypto.createHash('md5')
        .update(tobeSigned)
        .digest('hex')
        .toUpperCase();
}

exports.post = post;
