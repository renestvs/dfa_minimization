/*
    Copyright (C) 2014 JAKSE Raphaël

    The JavaScript code in this page is free software: you can
    redistribute it and/or modify it under the terms of the GNU
    General Public License (GNU GPL) as published by the Free Software
    Foundation, either version 3 of the License, or (at your option)
    any later version.  The code is distributed WITHOUT ANY WARRANTY;
    without even the implied warranty of MERCHANTABILITY or FITNESS
    FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.

    As additional permission under GNU GPL version 3 section 7, you
    may distribute non-source (e.g., minimized or compacted) forms of
    that code without the copy of the GNU GPL normally required by
    section 4, provided you include this license notice and a URL
    through which recipients can access the Corresponding Source.
*/

(function (that) {
	"use strict";

	if (!that.libD) {
		that.libD = {};
	}

	var libD = that.libD;

	function boot() {
		libD.getMappingFunction = function () {
		    var m = {}, f = function (a1, a2, a3) {
		        switch (arguments.length) {
		        case 1:
		            return f.getKey(a1);
		        case 2:
		            f.setKey(a1, a2);
		            return undefined;
		        case 3:
		            if (a2 === null && a3 === null) {
		                f.removeKey(a1);
		            }
		            return undefined;
		        default:
		            throw new Error("Bad arguments number.");
		        }
		    };

		    f.hasKey = function (k) {
		        return m.hasOwnProperty(libD.Set.prototype.elementToString(k));
		    };

		    f.getKey = function (k) {
		        var key = libD.Set.prototype.elementToString(k);
		        if (m.hasOwnProperty(key)) {
		            return m[key];
		        }
		        throw new Error("This key is not mapped to anything.");
		    };

		    f.setKey = function (k, v) {
		        switch (arguments.length) {
		        case 1:
		            f.removeKey(k);
		            break;
		        case 2:
		            m[libD.Set.prototype.elementToString(k)] = v;
		            return;
		        default:
		            throw new Error("Bad arguments number.");
		        }
		    };

		    f.removeKey = function (k) {
		        delete m[libD.Set.prototype.elementToString(k)];
		    };

		    return f;
		};

		if (libD.moduleLoaded) {
			libD.moduleLoaded("mappingFunction");
		}
	}

	if (libD.need) {
		libD.need(["set"], boot);
	} else {
		boot();
	}
}(this));
