// A nice number-with-units selector.

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

libD.need(["numbers"], function () {
	"use strict";

	libD.formInputNumber = function (units, auto, step) {
		var input = document.createElement("input");
		input.type = "text";

		if (units) {
			var select = document.createElement("select"),
			    option,
			    i = 0,
			    len = units.length;

			while (i < len) {
				option = document.createElement("option");
				option.value = units[i][0];
				option.textContent = units[i][1];
				if (units[i][2]) {
					option.selected = "selected";
				}
				select.appendChild(option);
				++i;
			}
		}

		if (typeof auto !== "undefined" && auto !== null) {
			input.value = auto;
		}

		if (!step) {
			step = 1;
		}

		return [input, select, {
			set: function (s) {
				input.value = parseFloat(s) || "0";
				select.value = libD.getUnit(s);
			},
			get: function () {
				return (parseFloat(input.value) || "0") + select.value;
			}
		}];
	};

	libD.formCSSNumber = function (auto, unit, step) {
		if (!unit) {
			if (typeof auto === "string") {
				unit = libD.getUnit(auto);
				auto = parseFloat(auto);
			} else {
				unit = "px";
			}
		}

		var units = [
			["mm", "mm"],
			["cm", "cm"],
			["in", "pouces"],
			["pc", "picas"],
			["pt", "points"],
			["px", "pixels"],
			["%", "%"]
		];

		var toAutoSelect = 5;

		switch (unit) {
		case "mm":
			toAutoSelect = 0;
			break;
		case "cm":
			toAutoSelect = 1;
			break;
		case "in":
			toAutoSelect = 2;
			break;
		case "pc":
			toAutoSelect = 3; break;
		case "pt": toAutoSelect = 4; break;
		case "%": toAutoSelect = 6;
		}

		units[toAutoSelect][2] = true;

		return libD.formInputNumber(units, auto, step);
	};

	if (libD.moduleLoaded) {
		libD.moduleLoaded("formNumbers");
	}
});
