'use strict';

var ENV = require('../../config/server')['ENV'];
var dbcfg = require('../../config/db')[ENV];
var db = require('../../common/database/mysql');

/**
 * @param p {Array}
 * @return {Promise}
 */
module.exports = function(p) {
    var v = {};
    v.platform = p.platform;
    v.edit_trades = {};
    v.add_trades = {};
    v.o_trades = p.o_resp;
    v.o_trades = p.fn.get_trades(p.o_resp);
    v.tids = [];

    v.q_tids = [];
    v.trade_status = {};
    v.trade_body = {};
    
    v.o_trades.forEach(function(el) {
         var tid = p.fn.get_tid(el);

         v.tids.push(tid);
         v.trade_status[tid] = p.fn.get_status(el);
         v.trade_body[tid] = el;
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
        return p.fn.get_platfrom_trades(p.app_type, p.seller_nick, p.session, v);              
    })
    .then(r => {
        var p_sql = [], add_goods = {};
    
        db.init(dbcfg.PLATFORM_DATA);
    
        for (var tid in v.edit_trades ) {
            var resp = v.edit_trades[tid];
            var body = v.trade_body[tid];

            if (p.fn.get_trade_resp) {
                body = p.fn.get_trade_resp(body, resp, add_goods);
            }
            else {
                body = resp;    
            }

            resp && p_sql.push(
                db.doQuery(
                    'update jdp_' + v.platform + '_trade set jdp_flag=0, status=\'' + 
                    v.trade_status[tid] + '\', jdp_modified=now(), jdp_response=\'' + 
                    body + '\' where tid=\'' + tid + '\''
                )
            );    
        }

        var insert_sql = `INSERT INTO jdp_${v.platform}_trade VALUES`;
        var have_insert = false;

        for (var tid in v.add_trades ) {
            var resp = v.add_trades[tid];
            var body = v.trade_body[tid];

            if (p.fn.get_trade_resp) {
                body = p.fn.get_trade_resp(body, resp, add_goods);
            }
            else {
                body = resp;    
            }
            
            if (have_insert) {
                insert_sql += ',';    
            }
            else have_insert = true;
            
            insert_sql += `('${tid}', '${v.trade_status[tid]}', 0, 0, '${p.seller_nick}', '', now(), now(), NULL, 0, '${body}', now(), now())`;
        }
        
        if (have_insert) {
            //console.log(insert_sql);
            p_sql.push(db.doQuery(insert_sql));
        }

        return Promise.all(p_sql).then(() => {
            return add_goods;    
        });
    }).then(r => {
        return p.fn.add_goods(p.store_id, p.bid, r);
    });
};

var get_sys_trade = function(v) {
    db.init(dbcfg.PLATFORM_DATA);
    var sql = 'select tid, status from jdp_' + v.platform + '_trade where tid in(\'' + v.tids.join('\',\'') + '\')';
    return db.doQuery(sql);
};


