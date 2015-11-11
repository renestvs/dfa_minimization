// Some useful function for calculating position and size of boxes. Doesn't need extra libs.

/*
    Copyright (C) 2010-2014 JAKSE Raphaël

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
/*
 Package: sizepos
*/

(function (that) {
	"use strict";

	if (!that.libD) {
		that.libD = {};
	}

	var libD = that.libD;

	if (!libD.need) {
		libD.need = function (o, f, that, arg) {
			f.apply(that || window, arg);
		};
	}

	if (!libD.getStyle) {
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
	}

	/*
	Function: borderWidth
		Returns the width taken by the border at the size given.
	 Parameters:
		o - the object of which we want to mesure the border
		side - (string) the side of the border to mesure ("left", "right", "top" or "bottom")
	*/
	libD.borderWidth = function (o, side) {// side is Left, Top, Bottom or Right (mind the Case !)
		var property = "border" + side + "Style";
		if ((o[property] || libD.getStyle(o, property)) === "none") {
			return 0;
		}

		property = "border" + side + "Width";
		var s = o[property] || libD.getStyle(o, property);
		return s === "medium" ?
			3 :
				s === "thin" ?
				 1 :
					s === "thick" ?
					 5 :
					 parseInt(s);
	};

	/* Function: left
	 Returns the absolute left of the content of the object (including padding but not border)
	 Parameter:
		o - the DOM object to mesure
	Returns:
		a Number (unit: pixel)
	*/
	libD.left = function (o) {
		// absolute left (from document)
		return o.getBoundingClientRect().left + libD.borderWidth(o, "Left");
	};

	/* Function: left
	 Returns the absolute top of the content of the object (including padding but not border)
	 Parameter:
		o - the DOM object to mesure
	Returns:
		a Number (unit: pixel)
	*/
	libD.top = function (o) {
		// absolute top (from document)
		return o.getBoundingClientRect().top + libD.borderWidth(o, "Top");
	};

	/* Function: right
	 Returns the absolute right of the content of the object (including padding but not border)
	 Parameter:
		o - the DOM object to mesure
	Returns:
		a Number (unit: pixel)
	*/
	libD.right = function (o) {
		// absolute right (from document)
		return document.body.offsetWidth - libD.left(o) - libD.width(o);
	};


	/* Function: bottom
	 Returns the absolute bottom of the content of the object (including padding but not border)
	 Parameter:
		o - the DOM object to mesure
	Returns:
		a Number (unit: pixel)
	*/
	libD.bottom = function (o) {
		// absolute bottom (from document)
		return document.body.offsetHeight - libD.top(o) - libD.height(o);
	};

	/* Function: outerHeight
	 Returns the height of the place taken by margins, paddings and borders of an object.
	 Parameters:
		o - The object to mesure
		onlyTop (optional) - if true, exclude border-bottom, padding-bottom and margin-bottom (default: false)
		withoutMargin (optional) - if true, exlude margins of the mesure.(default:false)
	 Returns:
		a Number (unit:pixels)
	*/
	libD.outerHeight = function (o, onlyTop, withoutMargin) {
		o = libD.getStyle(o);
		return	(parseFloat(o.paddingTop) || 0) +
			(withoutMargin ? 0 : parseFloat(o.marginTop) || 0) +
			(libD.borderWidth(o, "Top") || 0) +
			(onlyTop ? 0 :
				(withoutMargin ? 0 : parseFloat(o.marginBottom) || 0) +
				(libD.borderWidth(o, "Bottom") || 0) +
				(parseFloat(o.paddingBottom) || 0)
			);
	};

	/* Function: outerWidth
	 Returns the width of the place taken by margins, paddings and borders of an object.
	 Parameters:
		o - The object to mesure
		onlyLeft (optional) - if true, exclude border-right, padding-right and margin-right (default: false)
		withoutMargin (optional) - if true, exlude margins of the mesure.(default:false)
	 Returns:
		a Number (unit:pixels)
	*/
	libD.outerWidth = function (o, onlyLeft, withoutMargin) {
		o = libD.getStyle(o);
		return	(parseFloat(o.paddingLeft) || 0) +
			(withoutMargin ? 0 : parseFloat(o.marginLeft) || 0) +
			(libD.borderWidth(o, "Left") || 0) +
			(onlyLeft ? 0 :
				(withoutMargin ? 0 : parseFloat(o.marginRight) || 0) +
				(libD.borderWidth(o, "Right") || 0) +
				(parseFloat(o.paddingRight) || 0)
			);
	};

	/* Function: width
	 Returns the width of an object (excluding borders and paddings)
	 Parameters:
		o - The object to mesure
	 Returns:
		a Number (unit:pixels)
	*/
	libD.width = function (o) {
		return o.offsetWidth - libD.outerWidth(o, false, true);
	};


	/* Function: height
	 Returns the height of an object (excluding borders and paddings)
	 Parameters:
		o - The object to mesure
	 Returns:
		a Number (unit:pixels)
	*/
	libD.height = function (o) {
		return o.offsetHeight - libD.outerHeight(o, false, true);
	};

	/* Function: scrollLeft
	 Returns the scollLeft of the object or 0 if return0 is true. return0 can be used when you need to get 0 if an element is position:fixed but the real scrollLeft when it's not, for example.
	Parameters:
		o (optional) - The element to consider (default is document.body)
		return0 (optional) if true, the function will return 0 (default is false)
	Returns:
		a Number (unit: pixels)
	*/
	libD.scrollLeft = function (o, return0) {
		return return0
			? 0
			: (!o || o === document.body)
				? document.documentElement.scrollLeft || document.body.scrollLeft
				: o.scrollLeft;
	};

	/* Function: scrollTop
	 Returns the scrollTop of the object or 0 if return0 is true. return0 can be used when you need to get 0 if an element is position:fixed but the real scrollLeft when it's not, for example.
	Parameters:
		o (optional) - The element to consider (default is document.body)
		return0 (optional) if true, the function will return 0 (default is false)
	Returns:
		a Number (unit: pixels)
	*/
	libD.scrollTop = function (o, return0) {
		return return0
			? 0
			: (!o || o === document.body)
				? document.documentElement.scrollTop || document.body.scrollTop
				: o.scrollTop;
	};

	/* Function: firstRelativeElem
	 Returns de first element that is not static in o and its ancestors
		Parameters:
			o - The element from which we begin the search.
	*/
	libD.firstRelativeElem = function (o) {
		while (o !== document.body && (o.currentStyle || document.defaultView.getComputedStyle(o, null)).position === "static") {
			o = o.parentNode;
		}
		return o;
	};

	if (libD.moduleLoaded) {
		libD.moduleLoaded("sizepos");
	}
}(this));
