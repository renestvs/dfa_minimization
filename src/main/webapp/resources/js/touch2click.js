//thx http://stackoverflow.com/questions/1517924/javascript-mapping-touch-events-to-mouse-events#1781750

function touchHandler(event) {
    var nn = event.target.nodeName.toLowerCase();

    if (nn === "input" || nn === "select" || nn === "button") {
        return;
    }

    var touches = event.changedTouches,
        first   = touches ? touches[0] : event,
        type    = "";

    switch (event.type) {
    case "touchstart": type = "mousedown"; break;
    case "touchmove":  type = "mousemove"; break;
    case "touchend":   type = "mouseup";   break;
    case "tap":        type = "click";     break;
    case "dbltap":     type = "dblclick";  break;
    default: return;
    }

//initMouseEvent(type, canBubble, cancelable, view, clickCount,
//              screenX, screenY, clientX, clientY, ctrlKey,
//              altKey, shiftKey, metaKey, button, relatedTarget);

     var simulatedEvent = document.createEvent("MouseEvent");
     simulatedEvent.initMouseEvent(type, true, true, window, 1,
            first.screenX, first.screenY,
            first.clientX, first.clientY, false,
            false, false, false, 0/*left*/, null);
     first.target.dispatchEvent(simulatedEvent);
     event.preventDefault();
}

document.addEventListener('touchend', (function(speed, distance) {
/*
 * Copyright (c)2012 Stephen M. McKamey.
 * Licensed under The MIT License.
 * src: https://raw.github.com/mckamey/doubleTap.js/master/doubleTap.js
 */

    "use strict";

    // default dblclick speed to half sec (default for Windows & Mac OS X)
    speed = Math.abs(+speed) || 500;//ms
    // default dblclick distance to within 40x40 pixel area
    distance = Math.abs(+distance) || 40;//px

    // Date.now() polyfill
    var now = Date.now || function() {
        return +new Date();
    };

    var cancelEvent = function(e) {
        e = (e || window.event);

        if (e) {
            if (e.preventDefault) {
                e.stopPropagation();
                e.preventDefault();
            } else {
                try {
                    e.cancelBubble = true;
                    e.returnValue = false;
                } catch (ex) {
                    // IE6
                }
            }
        }
        return false;
    };

    var taps = 0,
        last = 0,
        // NaN will always test false
        x = NaN,
        y = NaN;

    return function (e) {
        e = (e || window.event);

        var time   = now(),
            touch  = e.changedTouches ? e.changedTouches[0] : e,
            nextX  = +touch.clientX,
            nextY  = +touch.clientY,
            target = e.target || e.srcElement,
            e2,
            parent;

        if ((last + speed) > time &&
            Math.abs(nextX - x) < distance &&
            Math.abs(nextY - y) < distance) {
            // continue series
            taps++;

        } else {
            // reset series if too slow or moved
            taps = 1;
        }

        // update starting stats
        last = time;
        x = nextX;
        y = nextY;

        // fire tap event
        if (document.createEvent) {
            e2 = document.createEvent('MouseEvents');
            e2.initMouseEvent(
                'tap',
                true,             // click bubbles
                true,             // click cancelable
                e.view,              // copy view
                taps,             // click count
                touch.screenX,     // copy coordinates
                touch.screenY,
                touch.clientX,
                touch.clientY,
                e.ctrlKey,          // copy key modifiers
                e.altKey,
                e.shiftKey,
                e.metaKey,
                e.button,            // copy button 0: left, 1: middle, 2: right
                e.relatedTarget); // copy relatedTarget

            if (!target.dispatchEvent(e2)) {
                // pass on cancel
                cancelEvent(e);
            }

        } else {
            e.detail = taps;

            // manually bubble up
            parent = target;
            while (parent && !parent.tap && !parent.ontap) {
                parent = parent.parentNode || parent.parent;
            }
            if (parent && parent.tap) {
                // DOM Level 0
                parent.tap(e);

            } else if (parent && parent.ontap) {
                // DOM Level 0, IE
                parent.ontap(e);

            } else if (typeof jQuery !== 'undefined') {
                // cop out and patch IE6-8 with jQuery
                jQuery(this).trigger('tap', e);
            }
        }

        if (taps === 2) {
            // fire dbltap event only for 2nd click
            if (document.createEvent) {
                e2 = document.createEvent('MouseEvents');
                e2.initMouseEvent(
                    'dbltap',
                    true,             // dblclick bubbles
                    true,             // dblclick cancelable
                    e.view,              // copy view
                    taps,             // click count
                    touch.screenX,     // copy coordinates
                    touch.screenY,
                    touch.clientX,
                    touch.clientY,
                    e.ctrlKey,          // copy key modifiers
                    e.altKey,
                    e.shiftKey,
                    e.metaKey,
                    e.button,            // copy button 0: left, 1: middle, 2: right
                    e.relatedTarget); // copy relatedTarget

                if (!target.dispatchEvent(e2)) {
                    // pass on cancel
                    cancelEvent(e);
                }

            } else {
                e.detail = taps;

                // manually bubble up
                parent = target;
                while (parent && !parent.dbltap && !parent.ondbltap) {
                    parent = parent.parentNode || parent.parent;
                }
                if (parent && parent.dbltap) {
                    // DOM Level 0
                    parent.dbltap(e);

                } else if (parent && parent.ondbltap) {
                    // DOM Level 0, IE
                    parent.ondbltap(e);

                } else if (typeof jQuery !== 'undefined') {
                    // cop out and patch IE6-8 with jQuery
                    jQuery(this).trigger('dbltap', e);
                }
            }
        }
    };
}()), false);

document.addEventListener("tap", touchHandler, true);
// document.addEventListener("dbltap", touchHandler, true);
document.addEventListener("touchstart", touchHandler, true);
document.addEventListener("touchmove", touchHandler, true);
document.addEventListener("touchend", touchHandler, true);
document.addEventListener("touchcancel", touchHandler, true);
