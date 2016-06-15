
exports.toPromise = function toPromise(ctx, args, fn) {
    return new Promise( (resolve, reject) => {
        Array.prototype.push.call(args, (err, r) => {
            if (err) {
                reject(Error(err));
            }
            else {
                resolve(r);
            }
        });

        fn.apply(ctx, args)
    });
};

exports.serial = function(ctx, promises_factory) {
    return promises_factory.reduce((seq, factory) => {
        return seq.then(r => {
            return factory.call(ctx);
        });
    }, Promise.resolve());   
}

/**
 * fn must return promise
 */ 
exports.each_serial = function(arr, fn) {
    return arr.reduce((seq, el) => {
        return seq.then(() => {
            return fn.call(this, el);
        });
    }, Promise.resolve());   
}

