define('Html', ['domlib'], function (domlib) {
    return {
        exec: function exec(fn) {
            fn();
        },

        cleanup: function (node, fn) {
            // nothing right now -- this is primarily a hook for S.cleanup
            // will consider a non-S design, like perhaps adding a .cleanup()
            // closure to the node.
        },

        domlib: domlib
    };
});
