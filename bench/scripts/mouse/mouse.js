define("mouse", ["require", "exports"], function (require, exports) {
    "use strict";
    function start(box) {
        document.addEventListener("mousemove", function (e) {
            box.set({
                x: e.clientX,
                y: e.clientY
            });
        });
    }
    exports.start = start;
});
