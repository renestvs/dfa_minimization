/**
    Copyright (C) 2012 JAKSE Raphaël

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

libD.need(["http", "json"], function () {
	"use strict";
	/*
	 Class: libD.Conf
	 This class can be used to manage your configuration in a simple way. Just do it, and libD.Conf will talk to the server.
	 It is compatible with syeConf (Simple Yet Efficient Configuration)
	*/

	/*
	 Constructor: Conf
	 Parameter:
		o - object containing values needed by libD.Conf. If a string is given, it will be used as the path value.
	Notes:
		supported values:
			- path: the path to the page on the server that handles the configuration. Default: "syeConf.php".
		It is HIGHLY recommended to set the path value.
	*/
	libD.Conf = function (o) {
		if (typeof o !== "object") {
			o = {
				path: o
			};
		}

		this.path = o.path || "syeConf.php";
	};

	libD.Conf.prototype = {
		/*
		 Method: set
		 Set given keys to given values.
		 Parameters:
			keyValues - an object which keys are keys to set and values are values to set (e.g. {color:"green"}).
			callback - the function to call once the job is done. Takes two parameters:
				- error: the code of the error. In case of success, will be set to 0.
				- errorText: if error, the text of the error, if any.
		Note:
			Values can be any javascript object that can be stringified. Types will be kept.
		*/
		set: function (keysValues, callback) {
			libD.request(
				"POST",
				this.path,
				function (success, resp, error) {
					if (success) {
						callback(resp.error, resp.errorText);
					} else {
						callback(true, resp + " (" + error + ")");
					}
				}, {
					set: JSON.stringify(keysValues)
				},
				"json"
			);
		},

		/*
		 Method: setPath
		 Set the path to the syeConf-compatible page handling configuration on the server.
		 Parameter:
			path- the path to set
		*/
		setPath: function (path) {
			this.path = path;
		},

		/*
		 Method: get
		 get values of the asked keys.
		 Parameters:
			keys - A string containing the key to get or an array containing keys to get. Actually, the notation "key1, key2" as string will work but is not recommanded if forward compatibility bothers.
			callback - the function to call once the job is done. Takes two parameters:
				- error: the code of the error. In case of success, will be set to 0.
				- values: if error, the text of the error, if any. Otherwise, an indexed object containing keys:values pairs.
		*/
		get: function (keys, callback) {
			if (typeof keys !== "string") {
				keys = keys.join(", ");
			}

			libD.request(
				"GET",
				this.path,
				function (success, resp, error) {
					if (success) {
						if (resp.error) {
							callback(resp.error, resp.errorText);
						} else {
							callback(0, resp.values);
						}
					} else {
						callback(true, resp + " (" + error + ")");
					}
				}, {
					get: keys
				},
				"json"
			);
		}
	};

	if (libD.moduleLoaded) {
		libD.moduleLoaded("conf");
	}
});
