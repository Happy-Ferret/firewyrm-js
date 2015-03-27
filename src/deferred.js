/**
 * Provides a slightly-decorated FBPromise
 */
if (typeof define !== 'function') { var define = require('amdefine')(module); }
define(['../node_modules/fbpromise/FireBreathPromise'], function(fbpromise) {
    var Deferred = fbpromise.FireBreathPromise;

    Deferred.when = function(val) {
        var dfd = Deferred();
        dfd.resolve(val);
        return dfd.promise;
    };

    Deferred.reject = function(error) {
        var dfd = Deferred();
        dfd.reject(error);
        return dfd.promise;
    };

    /**
     * Turns an array of promises into a promise for an array.  If any of
     * the promises gets rejected, the whole array is rejected immediately.
     * @param promises {Array} an array (or promise for an array)
     *   of values (or promises for values)
     * @returns {promise} a promise for an array of the corresponding values
     */
    // By Mark Miller
    // http://wiki.ecmascript.org/doku.php?id=strawman:concurrency&rev=1308776521#allfulfilled
    Deferred.all = function(promises) {
        return Deferred.when(promises).then(function(promises) {
            var resolvedPromises = [];
            var pendingCount = 0;
            var dfd = Deferred();
            promises.forEach(function(toResolve, idx) {
                pendingCount++;
                Deferred.when(toResolve).then(function(val) {
                    pendingCount--;
                    resolvedPromises[idx] = val;
                    resolveIfDone();
                }, function(error) {
                    dfd.reject(error);
                });
            });
            function resolveIfDone() {
                if (pendingCount === 0) {
                    dfd.resolve(resolvedPromises);
                }
            }
            resolveIfDone();
            return dfd.promise;
        });
    };


    // Converts a function that takes a callback as the last argument to a function that returns a
    // deferred object that is resolved to the callback value.
    Deferred.fn = function(obj, method) {
        return function() {
            var args = Array.prototype.slice.call(arguments, 0);
            var dfd = Deferred();
            var callback = function(status, resp) {
                if (status === 'success') { dfd.resolve(resp); }
                else { dfd.reject(resp); }
            };
            args.push(callback);
            obj[method].apply(obj, args);
            return dfd.promise;
        };
    };

    return Deferred;
});
