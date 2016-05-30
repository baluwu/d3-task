'use strict';

var ENV = require('../../config/server')['ENV'];
var dbcfg = require('../../config/db')[ENV];
var db = require('../../common/database/mysql');

module.exports = function(platform, app_type, session, seller_nick, fn, resp) {
    var v = {};
    v.platform = platform;
    v.edit_trades = {};
    v.add_trades = {};
    v.o_trades = JSON.parse(resp);
    v.o_trades = fn.get_trades(v.o_trades);
    v.tids = [];
    v.q_tids = [];
    v.trade_status = {};

    v.o_trades.forEach(function(el) {
         var tid = fn.get_tid(el);

         v.tids.push(tid);
         v.trade_status[tid] = fn.get_status(el);
    });

    return Promise.resolve(1).then( () => {
        return get_sys_trade(v).then(r => {

            var sys_trade_status = {};
            r.forEach(function(el) {
                sys_trade_status[el.tid] = el.status;
            });

            for (var tid in v.trade_status) {
                var p_status = v.trade_status[tid];
                var s_status = sys_trade_status[tid]; 
                
                //console.log(p_status, s_status);
                if (!s_status) {
                    v.add_trades[tid] = 0;
                    v.q_tids.push(tid);
                }
                else if (p_status != s_status) {
                    v.edit_trades[tid] = 0;
                    v.q_tids.push(tid);
                }
            }

            return 1;
        });
    }).then(() => {
        return fn.get_platfrom_trades(app_type, session, v);              
    })
    .then(r => {
        var p_sql = [];
        for (var tid in v.edit_trades ) {
            var resp = v.edit_trades[tid];
            resp && p_sql.push(
                db.doQuery('update jdp_' + v.platform + '_trade set jdp_flag=0, jdp_modified=now(), jdp_response=\'' + 
                    v.edit_trades[tid] + '\' where tid=\'' + tid + '\'')
            );    
        }

        var insert_sql = `INSERT INTO jdp_meilishuo_trade VALUES`;
        var have_insert = false;

        for (var tid in v.add_trades ) {
            var resp = v.add_trades[tid];
            
            if (have_insert) {
                insert_sql += ',';    
            }
            else have_insert = true;
            
            insert_sql += `('${tid}', '${v.trade_status[tid]}', 0, 0, '${seller_nick}', '', now(), now(), NULL, 0, '${resp}', now(), now())`;
        }
        console.log(insert_sql);
        have_insert && p_sql.push(db.doQuery(insert_sql));
    });
};

var get_sys_trade = function(v) {
    db.init(dbcfg);
    var sql = 'select tid, status from jdp_' + v.platform + '_trade where tid in(\'' + v.tids.join('\',\'') + '\')';
    return db.doQuery(sql);
};


