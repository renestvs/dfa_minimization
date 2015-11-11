/* Some http-relative functions
    Copyright (C) 2011 JAKSE Raphaël

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

/*eslint no-console:0*/

/*global console:0*/

(function (that) {
	"use strict";

	if (!that.libD) {
		that.libD = {};
	}

	var libD = that.libD;


	libD.repeatRequestOnEmptyResponse = false;
	libD.repeatRequestTimeout = 1000; // empty response === server overloaded ?
	libD.xhrTimeout = 10000;

	/* Will return a newly created XMLHttpRequest object. Cross-navigator-compatible. */
	libD.createXhrObject = function () { // thanks http://fr.wikipedia.org/wiki/XMLHttpRequest
	    if (window.XMLHttpRequest) {
	        return new XMLHttpRequest();
		}

	    if (window.ActiveXObject) {
	        var names = [
	            "Msxml2.XMLHTTP.6.0",
	            "Msxml2.XMLHTTP.3.0",
	            "Msxml2.XMLHTTP",
	            "Microsoft.XMLHTTP"
	        ];

	        for (var i in names) {
				if (names.hasOwnProperty(i)) {
		            try {
						return new window.ActiveXObject(names[i]);
					} catch (e) {}
				}
	        }
	    }
	    return null; // non supporté
	};

	// thx http://www.quirksmode.org/js/cookies.html for these two functions. I modified them slightly.

	/*
		set or remove a cookie.
		@param name The name of the cookie to set / remove
		@param value (optionnal) The value of the cookie. If an empty string is given, the cookie will be erased. Default : an empty string.
		@param the number of days the cookie should stay. 0 for a cookie that stays only for a session.
	*/
	libD.setCookie = function (name, value, days) {
		if (!value) {
			value = "";
			days = -1;
		}

		var expires = "";

		if (days) {
			var date = new Date();
			date.setTime(date.getTime() + (days * 24 * 3600000));
			expires = "; expires=" + date.toGMTString();
		}

		document.cookie = name + "=" + value + expires + "; path=/";
	};

	/* return the value of the cookie, or null if the cookie doesn't exist. */
	libD.getCookie = function (name) {
		var nameEQ = name + "=";
		var c, clen, ca = document.cookie.split(";"), len = ca.length;
		for (var i = 0; i < len; i++) {
			c = ca[i];
			clen = c.length;

			while (c.charAt(0) === " ") {
				c = c.substring(1, clen);
			}

			if (c.indexOf(nameEQ) === 0) {
				return c.substring(nameEQ.length, clen);
			}
		}
		return null;
	};


	libD.urlencode = function (o) {
		var i, r = "";

		for (i in o) {
			if (o.hasOwnProperty(i)) {
				r += (r ? "&" : "") + encodeURIComponent(i) + "=" + encodeURIComponent(o[i]);
			}
		}

		return r;
	};

	libD.request = function (method, url, callback, args, type, context) {
		if (!context) {
			context = window;
		}

		if (!type) {
			type = "text";
		}

		var xhr = libD.createXhrObject(),
		    rArg = typeof args === "object" ? libD.urlencode(args) : args || "",
		    cancelRepeat = false;

		if (method === "POST") {
			xhr.open("POST", url, true);
		} else {
			xhr.open("GET", url + (rArg ? "?" + rArg : ""), true);
		}

		var send, requestTimeout;

		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				clearTimeout(requestTimeout);

				if (xhr.responseText === "" && libD.repeatRequestOnEmptyResponse && !cancelRepeat) {
					cancelRepeat = true;
					setTimeout(
						function () {
							if (method === "POST") {
								xhr.open("POST", url, true);
							} else {
								xhr.open("GET", url + (rArg ? "?" + rArg : ""), true);
							}

							send();
						}, libD.repeatRequestTimeout);

					if (window.console && typeof console.error === "function") {
						console.error("libD.request: WARNING : empty response, retrying...");
					}

					return;
				} else if (xhr.status === 200 || !xhr.status) {
					if (type === "json") {
						try {
							var json = JSON.parse(xhr.responseText);
						} catch (e) {
							xhr = null;
							try {
								callback.call(context, false, "json");
							} catch (er) {
								console.error("libD.request: callback failed.", er);
							}
							return;
						}

						try {
							callback.call(context, true, json);
						} catch (e) {
							console.error("libD.request: callback failed.", e);
						}

					} else if (type === "xml") {
						try {
							callback.call(context, true, xhr.responseXML);
						} catch (e) {
							console.error("libD.request: callback failed.", e);
						}
					} else {
						try {
							callback.call(context, true, xhr.responseText);
						} catch (e) {
							console.error("libD.request: callback failed.", e);
						}
					}
				} else {
					try {
						callback.call(context, false, "status", xhr.status);
					} catch (e) {
						console.error("libD.request: callback failed.", e);
					}
				}

				xhr = null;
			}
		};

		send = function () {
			if (method === "POST") {
				xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
				xhr.setRequestHeader("Content-Length", rArg.length);
				xhr.send(rArg);
			} else {
				try {
					xhr.send(null);
				} catch (e) {
					try {
						callback.call(context, false, "request", xhr.status);
					} catch (er) {
						console.error("request could not be sent", er);
					}
				}
			}

			requestTimeout = setTimeout(function () {
				if (xhr) {
					xhr.abort();
					callback.call(context, false, "timeout");
				}
			}, libD.xhrTimeout);
		};

		if (!window.JSON && type === "json") {
			return libD.need(["json"], send);
		}

		send();
	};

	if (libD.moduleLoaded) {
		libD.moduleLoaded("http");
	}
}());
