/**
	@fileOverview Some selection relative functions
	@author Raphaël JAKSE
	@verion 1.0-dev

    Copyright (C) 2010, 2011 JAKSE Raphaël

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

/*eslint valid-jsdoc:0*/

(function (that) {
	"use strict";

	if (!that.libD) {
		that.libD = {};
	}

	var libD = that.libD;

	/** enable or disable selection on a specific DOM element. Don't use it for preventing user from copying your texts, use it for ergonomic purpose. (when selection is likely to annoy the user)
		@param o The DOM element involved
		@param s If s === false, selection will be disabled. Otherwize, it will be allowed.
		@returns Nothing
	*/

	libD.allowSelection = function (o, s) {
		// s is true : allow Selection. Else, deny it.
		if (s === false) {
			o.unselectable = "on";
			o.style.MozUserSelect = "none";
			o.ondragstart = libD.none;
			o.onselectstart = libD.none;
			o.style.KhtmltUserSelect = "none";
			o.style.webkitUserSelect = "none";
			o.style.userSelect = "none";
		} else {
			o.unselectable = null;
			o.ondragstart = null;
			o.onselectstart = null;
			o.style.MozUserSelect = "";
			o.style.KhtmlUserSelect = ""; // doesn't work.
			o.style.webkitUserSelect = "";
			o.style.userSelect = "";
		}
	};

	/* You can thank IE for these one hundred following lines... */
	function substrCount (haystack, needle, offset, length) {
		// Returns the number of times a substring occurs in the string
		//
		// version: 1009.2513
		// discuss at: http://phpjs.org/functions/substrCount	// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
		// +   bugfixed by: Onno Marsman
		// *	 example 1: substrCount("Kevin van Zonneveld", "e");
		// *	 returns 1: 3
		// *	 example 2: substrCount("Kevin van Zonneveld", "K", 1);	// *	 returns 2: 0
		// *	 example 3: substrCount("Kevin van Zonneveld", "Z", 0, 10);
		// *	 returns 3: false

		var cnt = 0;
		if (isNaN(offset)) {
			offset = 0;
		}

		if (isNaN(length)) {
			length = 0;
		}

		offset--;

		while ((offset = haystack.indexOf(needle, offset + 1)) !== -1) {
			if (length > 0 && (offset + needle.length) > length) {
				return false;
			}
			cnt++;
		}
		return cnt;
	}


	/** set the selection from start to end on the DOM object o. (W3C's o.setSelectionRange)
		@param o The DOM Object
		@param start the begining of the selection
		@param end   the end of the selection
	*/
	libD.select = function (o, start, end) {
		if (o.setSelectionRange) {
			//W3C
			return o.setSelectionRange(start, end);
		}

	/* thx CSTruter post #2 at http://www.codingforums.com/archive/index.php/t-90176.html */

		var toStrip = substrCount(o.value.substring(0, start), "\r\n");
		start -= toStrip;
		end -= toStrip + substrCount(o.value.substring(start, end), "\r\n");
		var range = o.createTextRange();
		range.collapse(true);
		range.moveEnd("character", end);
		range.moveStart("character", start);
		range.select();
	};

		/* thx :
			- http://the-stickman.com/web-development/javascript/finding-selection-cursor-position-in-a-textarea-in-internet-explorer/
			- https://mootools.lighthouseapp.com/projects/24057/tickets/99-elementinsertatcursor-ie7-and-newlines#ticket-99-2
		*/

	/** Return W3C's o.selectionStart on W3C and IE navs
		@param o the DOM object
	*/
	libD.selectionStart = function (o) {
		if (o.selectionStart !== undefined) {
			//W3C
			return o.selectionStart;
		}

		//IE :
		var range = document.selection.createRange();
		// We'll use this as a 'dummy'
		var dup = range.duplicate();
		var value = o.value ? o.value : o.innerHTML;
		var offset = value.length;
		dup.moveToElementText(o);

		dup.setEndPoint("StartToStart", range);
		return offset - dup.text.length;
	};

	/** Return W3C's o.selectionEnd on W3C and IE navs
		@param o the DOM object
	*/
	libD.selectionEnd = function (o) {
		if (o.selectionEnd !== undefined) {
			//W3C
			return o.selectionEnd;
		}

		//IE
		var range = document.selection.createRange();
		// We'll use this as a 'dummy'
		var dup = range.duplicate();
		var value = o.value ? o.value : o.innerHTML;
		var offset = value.length;
		dup.moveToElementText(o);

		dup.setEndPoint("StartToEnd", range);
		return offset - dup.text.length;
	};

	libD.getStyle = function (o, property) {
		var styleObj = (
			o.currentStyle || (
				o.currentStyle = document.defaultView.getComputedStyle(o, null)
			)
		);

		if (property) {
			return (
				(property === "float")
					? (styleObj.cssFloat || o.currentStyle.styleFloat)
					: styleObj[property]
			);
		}

		return styleObj;
	};


	libD.surround = function (textbox, before, after, start, end) {
		if (!after && after !== "") {
			after = before;
		}

		if (textbox.nodeName.toLowerCase() === "textarea") {
			if (typeof start !== "number") {
				start = libD.selectionStart(textbox);
			}

			if (typeof end !== "number") {
				end = libD.selectionEnd(textbox);
			}

			var val = textbox.value,
				begin = val.substr(0, start) + before, bl = begin.length,
				middle = val.substring(start, end);

			textbox.value = begin + middle + after + val.substr(end);
			libD.select(textbox, bl, bl + middle.length);
		}
		// FIXME handle the 'else' case
	};

	if (libD.moduleLoaded) {
		libD.moduleLoaded("selection");
	}
}(this));
