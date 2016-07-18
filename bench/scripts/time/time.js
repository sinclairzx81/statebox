define("time", ["require", "exports"], function (require, exports) {
    "use strict";
    function start(box) {
        setInterval(function () { return box.set(new Date()); });
    }
    exports.start = start;
});
