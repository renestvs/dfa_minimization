// A tiny tooltip.

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

/*
 Package: tooltip
 A tiny tooltip for your applications
*/

libD.need(["fx"], function () {
	"use strict";
	libD.getCSS("", "tooltip");

	/* Function: tooltip
	 Show / set the position of the tooltip.
	 Parameter:
		html - (optional) the content to show, in html. Default: null
		e - (optional) a mouse event or any object that has clientX and clientY values to set the position of the tooltip
		timeout - hide the tooltip other this amount of time, in miliseconds
	Notes:
		if html is not given, the current text of the tooltip won't be affected.
		if e is not given, the current position of the tooltip is kept.
		For a more automated/convenient way to show tooltip, see <libD.tooltipBind>
	*/
	libD.tooltip = function (html, e, timeout) { // mouse event
		if (timeout !== -1 && libD.tooltipTo) {
			clearTimeout(libD.tooltipTo);
		}

		if (libD.blockToolTip) {
			return libD.tooltipHide();
		}

		if (typeof timeout === "number") {
			libD.tooltipTo = setTimeout(libD.tooltipHide, timeout);
		}

		if (!libD._tooltipElem) {
			libD._tooltipElem = document.createElement("div");
			libD._tooltipElem.id = "LibDToolTip";
			libD._tooltipElem.style.opacity = 0;
			document.body.appendChild(libD._tooltipElem);
		}

		if (e) {
			libD._tooltipElem.style.left = e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft) + 20 + "px";
			libD._tooltipElem.style.top = e.clientY + (document.documentElement.scrollTop || document.body.scrollTop) + 20 + "px";
		}

		if (html) {
			libD._tooltipElem.innerHTML = html;
			libD.showSmoothly(libD._tooltipElem, 300);
		}
	};

/*
	Function: tooltipHide
	Manually hide the tooltip.
	Parameter:
		e - (optional) a mouse event or any object that has clientX and clientY values in order to set the position of the tooltip correctly
*/
	libD.tooltipHide = function (e) {
		if (!libD._tooltipElem) {
			return;
		}

		libD.hideSmoothly(libD._tooltipElem, {
			delay: 300,
			time: 250
		});

		if (e) {
			libD._tooltipElem.style.left = e.clientX + ( document.documentElement.scrollLeft || document.body.scrollLeft ) + 20 + "px";
			libD._tooltipElem.style.top = e.clientY + ( document.documentElement.scrollTop || document.body.scrollTop ) + 20 + "px";
		}
	};

/*
	Function: tooltipPos
	Manually position the tooltip.
	Parameter:
		e - a mouse event or any object that has clientX and clientY values in order to set the position of the tooltip correctly.
*/
	libD.tooltipPos = function (e) {
		if (!libD._tooltipElem || libD._tooltipElem.style.display === "none") {
			return;
		}

		libD.tooltip(false, e);
	};

/*
	Function: tooltipDelete
	Remove the tooltip DOM element from the page.
*/
	libD.tooltipDelete = function () {
		try {
			document.body.removeChild(libD._tooltipElem);
			delete libD._tooltipElem;
		} catch (e) {}
	};

/*
	Function: tooltipBind
		Make a tooltip appear when hovering the given element with the given text.
		Parameters:
			o - the element on which you need to set a tooltip
			html - the content of the tooltip you want to set, in html
			timeout - the amount of time of inactivity after which the tooltip will disappear
*/
	libD.tooltipBind = function (o, html, timeout) {
		libD.tooltipUnbind(o);
		o._libDTooltipCrap = function (e) {
			libD.tooltip(html, e);
			if (timeout) {
				setTimeout(libD.tooltipHide, timeout);
			}
		};

		o.addEventListener("mouseover", o._libDTooltipCrap, false);
		o.addEventListener("mousemove", libD.tooltipPos, false);
		o.addEventListener("mouseout", libD.tooltipHide, false);
		o.addEventListener("mousedown", libD.tooltipHide, false);
	};

/*
	Function: tooltipUnbind
	Cancel the tooltip on an element
	Parameter:
		o - the element on which you don't want the tooltip anymore
*/
	libD.tooltipUnbind = function (o) {
		o.removeEventListener("mouseover", o._libDTooltipCrap, false);
		o.removeEventListener("mousemove", libD.tooltipPos, false);
		o.removeEventListener("mouseout", libD.tooltipHide, false);
		o.removeEventListener("mousedown", libD.tooltipHide, false);
	};

	if (libD.moduleLoaded) {
		libD.moduleLoaded("tooltip");
	}
});
