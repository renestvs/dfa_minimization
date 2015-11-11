// A libD.notify wrapper to make nice choices box.

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

/*global libD:1*/

libD.need(["notify"], function () {
	"use strict";

	/* Function choice
		use libD.notify to ask the user to make a choice.
	   Parameters:
	      title - the tite of the question
	      descr - the question to ask
	      callback - the function to call when the question is answered
	      extraArg - a parameter to give to the callback function
	      options -
	*/

	libD.choice = function (title, descr, callback, extraArg, options, checks) {
		var notify = new libD.Notify(),
		    checkslen = checks.length,
		    optionslen = options.length,
		    i,
		    o = [
				["p", descr],
				["div", {"#": "dRadio"}],
				checkslen ? [
					["div", {"#": "dChecks"}]
				] : [],
				["div", ["input", {type: "button", "#": "val", "value": "OK"}]]
			],
		    refs = [];

		notify.setDescription(libD.jso2dom(o, refs));
		notify.setTitle(title);

		var n = "libDChoice" + new Date().getTime();

		for (i = 0; i < optionslen; ++i) {
			refs.dRadio.appendChild(
				libD.jso2dom(
					["div", ["label", [
						["input", {type: "radio", "name": n, "#loop": "radio"}],
						["#", " " + options[i]]
					]]], refs)
			);
		}

		refs.radio[0].checked = "checked";

		for (i = 0; i < checkslen; ++i) {
			refs.dChecks.appendChild(
				libD.jso2dom(
					["div", ["label", [
						["input", {type: "checkbox", "#loop": "checks"}],
						["#", " " + checks[i]]
					]]], refs)
			);
		}

		refs.val.onclick = function () {
			var radio, opts = [], j;
			for (j = 0; j < options; ++j) {
				if (refs.radio[j].checked) {
					radio = j;
					break;
				}
			}

			for (j = 0; j < checkslen; ++j) {
				opts.push(!!refs.radio[j].checked);
			}

			try {
				callback(extraArg, radio, opts);
			} catch (e) {}

			if (this.nodeName) {
				notify.close();
			}

			return true;
		};

		notify.onclose = refs.val.onclick;

	//	w.center();
	//	w.minimizable = false;
		notify.show();
	};

	libD.yesNo = function (title, descr, callback, extraArg) {
		var notify = new libD.Notify();
		notify.setTitle(title);
		notify.setDescription(descr);

		notify.addButton(
			libD.yes,
			function () {
				callback(true, extraArg);
				notify.onclose = null;
			}
		);

		notify.addButton(
			libD.no,
			function () {
				callback(false, extraArg);
				notify.onclose = null;
			}
		);

		notify.onclose = function () {
			callback(null, extraArg);
		};

		notify.show();
		return notify; // yes, that's crappy. We should use an abstraction layer.
		// But that's currently useless since the only function used is close(); notifier has a close function.
	};

	libD.yes = "Yes";
	libD.no = "No";

	libD.moduleLoaded("choice");
});
