/** @license WTFPL <http://www.wtfpl.net/txt/copying/> */

/*jslint indent:4, plusplus:true, browser:true*/
/*eslint-env browser*/

// thx http://www.adomas.org/javascript-mouse-wheel/ for explanations

var listenMouseWheel;

(function () {
    "use strict";

    var scrollFunctions = [];

    function hasParent(ele, parent) {
        do {
            if (ele === parent) {
                return true;
            }
            ele = ele.parentNode;
        } while (ele);
        return false;
    }

    function handleWheel(e) {
        var i, len, delta = (e.wheelDelta ? e.wheelDelta / 120 : (e.detail ? -e.detail / 3 : 0));

        if (delta) {
            for (i = 0, len = scrollFunctions.length; i < len; ++i) {
                if (!scrollFunctions[i][1] || hasParent(e.target, scrollFunctions[i][1])) {
                    scrollFunctions[i][0](e, delta);
                }
            }
        }
    }

    if ("onmousewheel" in window) {
        window.onmousewheel = handleWheel;
    } else if ("onmousewheel" in document) {
        document.onmousewheel = handleWheel;
    } else {
        window.addEventListener("DOMMouseScroll", handleWheel, false);
    }

    listenMouseWheel = function (f, target) {
        scrollFunctions.push([f, target]);
    };
}());
