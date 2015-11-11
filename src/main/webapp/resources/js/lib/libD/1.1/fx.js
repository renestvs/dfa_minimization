/*
	@fileOverview Let show and hide stuffs smoothly :).
	@requires (optional) libD's sizepos.js to have the "shrink" fonctionnality
	@author Raphaël JAKSE
	@verion 1.0-dev

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

(function (that) {
	"use strict";

	if (!that.libD) {
		that.libD = {};
	}

	var libD = that.libD;

	if (!libD.need) {
		libD.need = function (o, f, thatt, arg) {
			f.apply(thatt || window, arg);
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

	libD.animationSupported = false;
	libD.transitionSupported = false;
	// thx https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Using_CSS_animations/Detecting_CSS_animation_support

	libD.transitionString = "transition";
	libD.animationString = "animation";

	libD.ready(function () {
		if (document.body.transitionDuration !== undefined) {
			libD.transitionSupported = true;
			return;
		}

		var domPrefixes = ["Webkit", "Moz", "O", "ms", "Khtml"],
		    elm = document.body,
		    pfx = "";


		for (var i = 0; i < domPrefixes.length; i++) {
			if (elm.style[domPrefixes[i] + "TransitionDuration"] !== undefined) {
				pfx = domPrefixes[i];
				libD.transitionString = pfx + "Transition";
				libD.transitionSupported = true;
				return;
			}
		}
	});

	libD._restoreTransitions = function (e, afterHide, shrink) {
		e.style[libD.transitionString + "TimingFunction"] = e._libDTransTF;
		e.style[libD.transitionString + "Duration"] = e._libDTransDur;
		e.style[libD.transitionString + "Property"] = e._libDTransPro;

		delete e._libDTransDur;
		delete e._libDTransTF;
		delete e._libDTransPro;

		e._libDAppearing = false;
		e._libDDisappearing = false;

		if (afterHide) {
			e.style.display = "none";
			if (shrink) {
				e.style.height = "";
			}
		}
	};

	libD._showSmoothly = function (e, t) {
		e.style.opacity = 1;
		setTimeout(libD._restoreTransitions, t, e);
		e._libDAppearing = false;
	};

	/*
	 Function: showSmoothly
		Show the element with a smooth transition, not to disturb the user.
		Parameters:
			e - The dom element to show. It e is undefined, will throw an error
			t - (optional) The duration in ms of the effect. Default : 500
			d - (optional) The delay in ms before begining the effect. Default : 0.
			s - (optional) The number of steps used to make the effect. Less for higher performences. Default : t * 0.03 in order to get a 30 FPS effect.
	*/
	libD.showSmoothly = function (e, t, d, s) {
		if (e._libDAppearing) {
			return;
		}

		e._libDDisappearing = false;
		e._libDAppearing = true;

		if (!t) {
			t = 350;
		}

		if (!d) {
			d = 0;
		}

		if (!s) {
			s = t * 0.03; // 30 fps
		}

		s = 1 / s;

		if (libD.getStyle(e, "display") === "none" || !e.parentNode) {
			e.style.opacity = "0";
			e.style.display = "";
		} else {
			var opac = e.style.opacity;
			if (opac !== "0" || opac === undefined || opac == null || opac === "1" || !opac) {
				e._libDDisappearing = false;
				return;
			}
		}

		e._libDTransDur = e.style[libD.transitionString + "Duration"];
		e._libDTransTF = e.style[libD.transitionString + "TimingFunction"];
		e._libDTransPro = e.style[libD.transitionString + "Property"];

		e.style[libD.transitionString + "TimingFunction"] = "linear";
		e.style[libD.transitionString + "Duration"] = t + "ms";
		e.style[libD.transitionString + "Property"] = "opacity";

		setTimeout(libD._showSmoothly, d, e, t);
	};

	libD._hideSmoothly = function (e, shrink, t) {
		if (shrink) {
			e.style.height = "0";
		}

		e.style.opacity = "0";

		setTimeout(libD._restoreTransitions, t, e, true);
	};

	/*
	 Function: hideSmoothly
	 Hide the element quietly.
	 Parameters:
		e - The dom element to show. It e is undefined, will throw an error
		settings (optional)- An object with the following possible values that enables you to define hideSmoothly"s behavior :
		- time   : The duration in ms of the effect. Default : 500
		- delay  : The delay in ms before begining the effect. Default : 0.
		- steps  : The number of steps used to make the effect. Less for higher performences. Default : t * 0.03 in order to get a 30 FPS effect or 10 if t < 800
		- deleteNode : If true, will delete the dom element after the effect. Default : false
		- fade   : If true, will make the object fade. Default : true
		- shrink : If true and libD.height is defined, will make the object shrink. Default : false
		fade and shrink can be set to true at the same time.

		@returns Nothing
	*/
	libD.hideSmoothly = function (e, settings) {
		if (e._libDDisappearing) {
			// opération en cours
			return;
		}

		settings = settings || {};
		var deleteNode = settings.deleteNode || false,
		    shrink = false,
		    eHeight = 1,
		    t = settings.time || 500,
		    d = settings.delay || 0,
		    steps = settings.steps,
		    s;

		e._libDAppearing = false;
		e._libDDisappearing = true;

		if (settings.shrink && libD.height) {
			eHeight = libD.height(e);
			e.style.height = eHeight + "px";
			shrink = true;
		}

		s = s ? 1 / s : 1 / (t < 800 ? 10 : t * 0.03);

		if (libD.getStyle(e, "display") === "none") {
			e.style.opacity = "";

			if (shrink) {
				e.style.height = "";
			}

			return;
		}

		var opac = libD.getStyle(e, "opacity");

		if (opac === "0" || opac === undefined) {
			if (deleteNode) {
				e.parentNode.removeChild(e);
				return;
			}

			e.style.display = "none";
			e.style.opacity = "";
			return;
		}

		if (opac === "" || opac === "1") {
			e.style.opacity = "1";
		}

		e._libDTransDur = e.style[libD.transitionString + "Duration"];
		e._libDTransTF = e.style[libD.transitionString + "TimingFunction"];
		e._libDTransPro = e.style[libD.transitionString + "Property"];
		e.style[libD.transitionString + "TimingFunction"] = "linear";
		e.style[libD.transitionString + "Duration"] = t + "ms";

		if (shrink) {
			e.style[libD.transitionString + "Property"] = "opacity height";
		} else {
			e.style[libD.transitionString + "Property"] = "opacity";
		}

		setTimeout(libD._hideSmoothly, d, e, shrink, t);
	};

	if (libD.moduleLoaded) {
		libD.moduleLoaded("fx");
	}
}(this));
