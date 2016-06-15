
Date.prototype.Format = function(fmt) 
{
    var o = { 
        "M+" : this.getMonth()+1,
        "d+" : this.getDate(),
        "h+" : this.getHours(),
        "m+" : this.getMinutes(),
        "s+" : this.getSeconds(),
        "q+" : Math.floor((this.getMonth()+3)/3),
        "S"  : this.getMilliseconds()
    }; 

    if(/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length)); 
    }

    for(var k in o)  {
        if(new RegExp("("+ k +")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length))); 
        }
    }

    return fmt; 
};

exports.cn_date = function(i_date) {

    var dt = new Date();
    if (i_date) {
        dt.setTime(i_date);    
    }   

    return dt.Format('yyyy-MM-dd hh:mm:ss');
} 
