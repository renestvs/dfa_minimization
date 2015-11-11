/**
	Some CSS 3 & Matrix functions.
	covers two packages : css3 and matrix

	Here are some link I used to understand how matrices work.

	First, a good start is https://developer.mozilla.org/en/CSS/-moz-transform
	This explains what transformations are possible and they are examples.

	After that, you can read the link present in the first page : http://www.mathamazement.com/Lessons/Pre-Calculus/08_Matrices-and-Determinants/coordinate-transformation-matrices.html

	Then, I would suggest you to read http://en.wikipedia.org/wiki/Transformation_matrix
	Transformation matrices are well explained by the english version of their wikipedia page.

	Finally, http://www.w3.org/TR/SVG/coords.html#TransformMatrixDefined
	When you understand transformation matrices, the "Coordinate Systems, Transformations and Units" (7) part of the W3C SVG specification is the simplest to understand, it explains what matrices are used with transformations.

	Please also take a look at the libD.getRealPos() function.

IMPORTANT : Please note that "shear" = "skew" (for transformations)
*/

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

/*global libD:0*/
/*eslint eqeqeq:0*/
libD.need(["numbers"], function () {
	"use strict";
	libD.setMatrix = function (o, matrix) {
		var tmp = "matrix(" + matrix[0] + ", " + matrix[1] + ", " + matrix[2] + ", " + matrix[3] + ", " + matrix[4];

		o.style.MozTransform = tmp + "px, " + matrix[5] + "px)";

		tmp += ", " + matrix[5] + ")";
		o.style.KhtmlTransform = tmp; // Don't set webkitTransform ! it will hurt...
		o.style.OTransform = tmp;
		o.style.msTransform = tmp;
		o.style.transform = tmp; // Currently, W3C Working Draft is like WebKit and Opera, not Mozilla.
	};

	libD.getRealPos = function (mat, x, y, C, Cnd) { // we calculate x' and y' with the matrix
		var Cx, Cy;

		if (typeof Cnd === "number") {
			Cx = C;
			Cy = Cnd;
		} else {
			Cx = C.x;
			Cy = C.y;
		}

		x -= Cx; y -= Cy;

		return {
			x: mat[0] * x + mat[2] * y + mat[4] + Cx,
			y: mat[1] * x + mat[3] * y + mat[5] + Cy
		};
	};

	libD.getTransformMatrixCenter = function (o, fontSize, width, height) {
		if (!fontSize) {
			fontSize = libD.fontSizeInPx(o);
		}

		if (!width) {
			width = libD.width(o);
		}

		if (!height) {
			height = libD.height(o);
		}

		var C = {
				x: width / 2,
				y: height / 2
			},
		    style = libD.getStyle(o),
		    torigin;

		if ( (torigin = style.webkitTransformOrigin) ) {
			// https://bugs.webkit.org/show_bug.cgi?id=41541, https://bugs.webkit.org/show_bug.cgi?id=18994
			torigin = torigin.replace(/, /g, ".").replace(/\. /g, ", ");
		} else {
			torigin = style.transformOrigin || style.MozTransformOrigin || style.OTransformOrigin || style.msTransformOrigin || style.khtmlTransformOrigin;
		}

		if (!torigin) {
			return C;
		}

		var v = torigin.split(" "), i = 0, len = v.length;
		while (i < len) {
			switch (v[i]) {
				case "left":
					C.x = 0;
					break;
				case "right":
					C.x = width;
					break;
				case "top":
					C.y = 0;
					break;
				case "bottom":
					C.y = height;
					break;
				case "center":
					break;
				default:
					if (i === 0) {
						C.x = libD.toPx(parseFloat(v[0]), libD.getUnit(v[0]), fontSize, width);
					} else {
						C.y = libD.toPx(parseFloat(v[1]), libD.getUnit(v[1]), fontSize, height);
					}
			}
			++i;
		}
		return C;
	};

	libD.getAbsTransformMatrixCenter = function (o, fontSize, width, height) {
		var c = libD.getTransformMatrixCenter(o, fontSize, width, height);
		c.x += libD.left(o);
		c.y += libD.top(o);
		return c;
	};

	libD.getTransformMatrix = function (o, fontSize, width, height) {
		if (!fontSize) {
			fontSize = libD.fontSizeInPx(o);
		}

		if (!width) {
			width = libD.width(o);
		}

		if (!height) {
			height = libD.height(o);
		}

		var style = libD.getStyle(o),
		    matrix = [1, 0, 0, 1, 0, 0],
		    transform;

			if ( (transform = style.webkitTransform) ) {
				transform = transform.replace(/, /g, ".").replace(/\. /g, ", "); // https://bugs.webkit.org/show_bug.cgi?id=41541, https://bugs.webkit.org/show_bug.cgi?id=18994
			} else {
				transform = style.transform || style.MozTransform || style.OTransform || style.msTransform || style.khtmlTransform || "none";
			}

		if (transform === "none") {
			return matrix;
		}

		var val = transform.replace(/[\s]+/g, "").split(")");

		var i = 0, len = val.length - 1, n, v, tmp, Cos, Sin;
		while (i < len) {
			n = val[i].split("(");
			v = n[1].split(", ");

			switch (n[0]) {
			// name
			case "matrix":
				v[0] = parseFloat(v[0]);
				v[1] = parseFloat(v[1]);
				v[2] = parseFloat(v[2]);
				v[3] = parseFloat(v[3]);

				tmp = parseFloat(v[4]);

				if (v[4] == tmp) {
					// don't change == into ===
					v[4] = tmp;
				} else {
					v[4] = libD.toPx(parseFloat(v[4]), libD.getUnit(v[4]), fontSize, width);
				}

				tmp = parseFloat(v[5]);

				if (v[5] == tmp) {
					// don't change == into ===
					v[5] = tmp;
				} else {
					v[5] = libD.toPx(parseFloat(v[5]), libD.getUnit(v[5]), fontSize, height);
				}

				matrix = libD.mixCSSMatrix(matrix, v);
				break;
			case "rotate":
				v[0] = v[0].trim();
				if (libD.getUnit(v[0]) === "deg") {
					tmp = parseFloat(v[0]) * Math.PI / 180;
				} else {
					tmp = parseFloat(v[0]);
				}
				Sin = Math.sin(tmp); Cos = Math.cos(tmp);
				matrix = libD.mixCSSMatrix(matrix, [Cos, -Sin, Sin, Cos, 0, 0]);
			break;
			case "scale": //FIXME : continue conding this for opera ;)
			case "scaleX":
			case "scaleY":
			case "skew":
			case "skewX":
			case "skewY":
			case "translate":
			case "translateX":
			case "translateY":
			//FIXME : what to do on unknown value ?
			}
			++i;
		}
	//	console.log(matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]);
		return matrix;
	};

	libD.getAngle = function (ox, oy, cx, cy, x, y) {
		return Math.atan2(oy, ox) - Math.atan2(y - cy, x - cx);
	};

	libD.rotate = function (matrix, angle) {
		var Cos = Math.cos(angle), Sin = Math.sin(angle);
		return libD.mixCSSMatrix(matrix, [Cos, -Sin, Sin, Cos, 0, 0]);
	};

	libD.skewX = function (matrix, angle) {
		return libD.mixCSSMatrix([1, 0, Math.tan(angle), 1, 0, 0], matrix);
	};

	libD.skewY = function (matrix, angle) {
		return libD.mixCSSMatrix([1, Math.tan(-angle), 0, 1, 0, 0], matrix);
	};

	libD.mixCSSMatrix = function (a, b) {
	/* a, b are unidimensionnal arrays.
	The matrix :

	| 1  2 |
	| 3  4 |
	| 5  6 |

	becomes [1, 2, 3, 4, 5, 6]
	*/
		return [
			a[0] * b[0] + a[1] * b[2], // We do a matrix multiplication
			a[0] * b[1] + a[1] * b[3], // for the 4 1st numbers of each arrays
			a[2] * b[0] + a[3] * b[2],
			a[2] * b[1] + a[3] * b[3],
			a[4] + b[4], // and a addition for the 2 last numbers
			a[5] + b[5]  // That's how CSS works.
		];
	};

	// cross-browser cssText and CSS3
	libD.cssText = function (o) { //FIXME : greedy, sometimes useless vendor properties are generated for CSS 3.
		var styles = (o.style.cssText || o.getAttribute("style")).split(";"),
		    i = 0,
		    prop,
		    value,
		    len = styles.length,
		    s = "",
		    reg = /^-([a-z]+)-([\S]+)$/,
		    r,
		    vendor = ["moz", "khtml", "o", "ms"], // no webkit, it handles khtml.
		    vi,
		    vlen = vendor.length,
		    regTMP,
		    excludeVendor = "",
		    io;

		while (i < len) {
			if (styles[i]) {
				prop = libD.trim(styles[i].substring(0, io = styles[i].indexOf(":")));
				value = libD.trim(styles[i].substring(io + 1));
				r = reg.exec(prop);

				if (r && !styles[r[2]]) {
					s += prop + ":" + value + ";";

					if ( (regTMP = /-moz-border-radius-(bottom|top)(right|left)/.exec(prop)) ) {
						r[1] = "border-radius-" + regTMP[1] + "-" + regTMP[2];
					} else if (prop.match("-moz-transform") && value.match("matrix")) {
						value = value.replace(/matrix\(([^, ]+, [^, ]+, [^, ]+, [^, ]+), ([^a-z, ]+)[a-z]+, ([^a-z)]+)[a-z]+/g, "matrix($1, $2, $3");
					} else if ( (regTMP = /border-(top|bottom)-(left|right)-radius/.exec(r[1]) && regTMP[0]) ) {
						s += "-moz-border-radius-" + regTMP[1] + regTMP[2] + ":" + value + ";";
						excludeVendor = "moz";
					} else if (r[1].match("transform") && value.match("matrix")) {
						s += "-moz-" + r[1] + ":" + value.replace(/matrix\(([^, ]+, [^, ]+, [^, ]+, [^, ]+), ([^, ]+), ([^)]+)/g, "matrix($1, $2px, $3px") + ";";
						excludeVendor = "moz";
					}

					vi = 0;
					while (vi < vlen) {
						if (vendor[vi] !== r[1].toLowerCase() && vendor[vi] !== excludeVendor) {
							s += "-" + vendor[vi] + "-" + r[2] + ":" + value + ";";
						}
						++vi;
					}

					s += r[2] + ":" + value + ";";
					excludeVendor = "";
				} else if (prop.match("transform") && value.match("matrix")) {
					vi = 0;
					while (vi < vlen) {
						if (vendor[vi] === "moz") {
							s += "-moz-" + prop + ":" + value.replace(/matrix\(([^, ]+, [^, ]+, [^, ]+, [^, ]+), ([^, ]+), ([^)]+)/g, "matrix($1, $2px, $3px") + ";";
						} else {
							s += "-" + vendor[vi] + "-" + prop + ":" + value + ";";
						}
						++vi;
					}
					s += prop + ":" + value + ";";
				} else if (prop.match("radius") && prop !== "border-radius") {
					regTMP = /^border-([a-z]+)-([a-z]+)-radius$/.exec(prop);
					vi = 0;
					while (vi < vlen) {
						if (vendor[vi] === "moz") {
							s += "-moz-border-radius-" + regTMP[1] + regTMP[2] + ":" + value + ";";
						} else {
							s += "-" + vendor[vi] + "-" + r[1] + ":" + value + ";";
						}
						++vi;
					}
					s += r[1] + ":" + value;
				} else if (prop === "border-radius" || prop === "box-shadow" || prop === "background-clip" || prop === "background-origin" || prop === "background-size" || prop.match(/transition/) || prop.match(/image$/)) {
					vi = 0;
					while (vi < vlen) {
						s += "-" + vendor[vi] + "-" + prop + ":" + value + ";";
						++vi;
					}
					s += prop + ":" + value;
				} else {
					s += prop + ":" + value + ";";
				}
			}
			++i;
		}

		return s;
	};

	if (libD.moduleLoaded) {
		libD.moduleLoaded("matrix");
		libD.moduleLoaded("css3");
	}

});
