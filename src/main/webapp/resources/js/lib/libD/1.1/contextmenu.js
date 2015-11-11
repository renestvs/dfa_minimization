// A tiny context Menu.
/* interacts well with libD.tooltip but it's not needed.

	An action actions Array has entries like this :
	 - [String label, Function callback, Array arguments, String icon, Object context]
	 - [String label]
	 - [String label, Array actions]

	To omit....
	 - arguments : []
	 - icon : null

	- if actions and callback not supplied, you get an entry without any action
	- if context not supplied, context = window
	- arguments, icon, context are optionnal.
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

libD.need(["sizepos", "fx"], function () {
	"use strict";

	var cancelHide = false;

	if (libD.getCSS) {
		libD.getCSS("", "contextmenu");
	}

	libD.checkContextSubmenuOverflow = function (ul) {
		if (libD.left(ul) + libD.width(ul) > libD.width(document.body)) {
			ul.className = "submenu active contextmenu-left";
		}

		if (libD.top(ul) + libD.height(ul) > libD.height(document.body)) {
			ul.className = "submenu active contextmenu-bottom";
		}
	};

	libD.checkContextMenuOverflow = function (ul) {
		if (libD.left(ul) + libD.width(ul) > libD.width(document.body) + libD.scrollLeft()) {
			ul.style.left = ul.offsetLeft - libD.scrollLeft() - libD.width(ul) + "px";
		}

		if (libD.top(ul) + libD.height(ul) > libD.height(document.body) + libD.scrollTop()) {
			ul.style.bottom = (-libD.scrollTop()) + "px";
			ul.style.top = "auto";
		}
	};

	function contextMenuHideUL(e) {
		var ul = e.currentTarget._ul || e.currentTarget.parentNode.parentNode;
		libD.hideSmoothly(ul, {time: 200});
		ul.classList.remove("active");
		ul.classList.add("inactive");
		return false;
	}

	function contextMenuShowUL(e) {
		var ul;
		if (e.currentTarget.nodeName.toLowerCase() === "li") {
			ul = e.currentTarget._ul;
			e.currentTarget.firstChild.focus();
		} else {
			ul = e.currentTarget.parentNode._ul;

			if (libD.getStyle(ul, "display") !== "none") {
 				return contextMenuHideUL({currentTarget:e.currentTarget.parentNode});
			}

			try {
				e.preventDefault();
			} catch (err) {
				e.returnValue = false;
			}
		}

		ul.classList.remove("inactive");
		ul.classList.add("active");
		libD.showSmoothly(ul, 200);
		setTimeout(libD.checkContextSubmenuOverflow, 0, ul);

		return false;
	}

	function menuLinkKeydown(e) {
		if (e.keyCode === 40) {
			if (e.currentTarget.parentNode.nextSibling) {
				e.currentTarget.parentNode.nextSibling.getElementsByTagName("a")[0].focus();
			}
			return libD.none(e);
		}

		if (e.keyCode === 38) {
			if (e.currentTarget.parentNode.previousSibling) {
				e.currentTarget.parentNode.previousSibling.getElementsByTagName("a")[0].focus();
			}
			return libD.none(e);
		}

		if (e.keyCode === 37) {
			if (e.currentTarget.parentNode.parentNode.parentNode.classList.contains("lisubmenu")) {
				e.currentTarget.parentNode.parentNode.parentNode.getElementsByTagName("a")[0].focus();
				contextMenuHideUL(e);
			}
			return libD.none(e);
		}

		if (e.keyCode === 39) {
			if (e.currentTarget.parentNode.classList.contains("lisubmenu")) {
				contextMenuShowUL(e);
				e.currentTarget.nextSibling.getElementsByTagName("a")[0].focus();
			}
			return libD.none(e);
		}
	}

	var oldFocus = null;

	function isParent(p, e) {
		return e && e !== p && (p === e.parentNode || isParent(p, e.parentNode));
	}

	function linkFocus(e) {
		if (oldFocus && !isParent(oldFocus, e.currentTarget)) {
			oldFocus.classList.remove("active");
			if (oldFocus._ul) {
				contextMenuHideUL({currentTarget: oldFocus});
			}
		}

		oldFocus = e.currentTarget.parentNode;
		oldFocus.classList.add("active");
	}

	libD.populateMenu = function (ul, actions) {
		var i = 0, len = actions.length, li, a, img;

		var entryClick = function (e) {
			var o = (this === window) ? e.srcElement : this;

			o.parentNode._f[1].apply(o.parentNode._context, o.parentNode._f[2] || []);
			libD.contextMenuHide();
			return false;
		};

		var entryOver = function (e) {
			if (!libD._contextMenuElem.hiding) {
				e.currentTarget.firstChild.focus();
				if (e.currentTarget._ul) {
					contextMenuShowUL(e);
				}
				e.stopPropagation();
			}
		};

		while (i < len) {
			li = document.createElement("li");

			if (typeof actions[i] === "string") { // An entry without action, just here to inform
				if (actions[i] === "-") {
					li.className = "separator";
				} else {
					li.textContent = actions[i];
					li.className = "textInfo";
				}
			} else if (typeof actions[i] !== "undefined") {
				a = document.createElement("a");
				a.href = "#";
				a.onkeydown = menuLinkKeydown;
				a.onfocus = linkFocus;

				if (typeof actions[i][3] === "string") { // icon
					img = document.createElement("img");
					img.alt = "";
					img.src = actions[i][3];
					a.appendChild(img);
				}

				a.appendChild(document.createTextNode(actions[i][0]));
				li.appendChild(a);

				li._f = actions[i];
				li._context = li._f[4] ? li._f[4] : window;

				if (li._f[1]) {
					if (li._f[1].apply) {
						a.onclick = entryClick;

						li.onmouseover = entryOver;
					} else {
						a.onclick = contextMenuShowUL;
						li.className = "lisubmenu";
						var ul2 = document.createElement("ul");
						ul2.className = "submenu inactive";
						li.appendChild(ul2);
						libD.populateMenu(ul2, li._f[1]);

						li._ul = ul2;

						li.onmouseover = entryOver;
					}
				}
			}

			ul.appendChild(li);

			++i;
		}
	};
	/* Will show a context menu based on the cursor position and the actions defined in the second argument.
		@param e (Object) an Event from a event fonction (onclick, ...) or an object width members clientX and clientY defining the menu position.
		@param actions (Array) an Array of entries in the form [label, callback, [context]] where label is the text shown in the menu entry, callback a function and context (optional) an Array containing arguments to pass to the callback. The first element of context will be used to set this for the callback function. You can also set callback as an Array that looks like an Array like actions, this will make a submenu. In this case, context is not used.
		@param dontFocus if true, won"t make the first menu element have the focus. Default : false
		@example
	libD.contextMenu(evt, [
		["Cut", window.alert, [window, "Hello world !"]],
		["Paste", window.alert, [window, "Hello world !"]],
		["Hello", window.alert, [window, "Hello world !"]],
		["submenu", [
			["Sub-entry 1", callback1],
			["Sub-entry 2", callback1]
		]]
	]

	*/
	libD.contextMenu = function (e, actions, dontFocus) {
		libD._contextMenufocusElem = document.activeElement;

		if (!libD._contextMenuElem) {
			libD._contextMenuElem = document.createElement("ul");
			libD._contextMenuElem.id = "LibDContextMenu";
			libD._contextMenuElem.addEventListener("click", libD.none, false);
			libD._contextMenuElem.addEventListener("mouseup", libD.none, false);
			libD._contextMenuElem.addEventListener("mousedown", libD.none, false);
			libD._contextMenuElem.style.opacity = 0;
			document.body.appendChild(libD._contextMenuElem);

			document.addEventListener("click", function (e) {
				if (e.clientX || e.clentY) {
					return libD.contextMenuHide(e);
				}
			}, false);

			document.addEventListener("keydown", function (e) {
				if (e.keyCode === 27) {
					return libD.contextMenuHide(e);
				}
			}, false);
		}

		libD._contextMenuElem.className = "";

		libD._contextMenuElem.textContent = "";

		libD._contextMenuElem.hiding = false;

		libD._contextMenuElem.style.left = e.clientX + libD.scrollLeft() + 5 + "px";
		libD._contextMenuElem.style.top = e.clientY + libD.scrollTop() + 5 + "px";
		libD._contextMenuElem.style.bottom = "auto";
		libD.populateMenu(libD._contextMenuElem, actions);

		if (!dontFocus) {
			setTimeout(
				function () {
					libD._contextMenuElem.getElementsByTagName("a")[0].focus();
				}, 200);
		}

		libD.showSmoothly(libD._contextMenuElem, 200);
		setTimeout(libD.checkContextMenuOverflow, 0, libD._contextMenuElem);
		libD.blockToolTip = true;
	};

	/* Will bind a context menu to the DOM object o (please, for accessibility reasons, try to use <a href> elements as much as possible...
		@param o (Object) the DOM object that shall get a context menu
		@param a (Array) libD.contextMenu actions Array (see libD.contextMenu for more details)
	*/
	libD.bindContextMenu = function (o, actions, dontFocus) {
		o.addEventListener("mousedown", function (e) {
			o.focus();

			if (e.button === 2 || (e.touches && e.touches.length === 2)) {
				libD.contextMenu(e, actions, dontFocus);
				cancelHide = true;
				return libD.none(e);
			}
		}, false);

		o.addEventListener("keydown", function (e) {
			if (e.keyCode === 93) {
				e.clientX = libD.left(document.activeElement) + libD.width(document.activeElement) / 2;
				e.clientY = libD.top(document.activeElement) + libD.height(document.activeElement) / 2;
				libD.contextMenu(e, actions, dontFocus);
				return libD.none(e);
			}
		}, false);

		o.addEventListener("contextmenu", libD.none, false);
	};

	libD.contextMenuHide = function () {
		if (cancelHide) {
			cancelHide = false;
			return;
		}

		if (libD._contextMenufocusElem) {
			try {
				libD._contextMenufocusElem.focus();
			} catch (er) {}
			libD._contextMenufocusElem = null;
		}

		if (libD._contextMenuElem) {
			libD._contextMenuElem.hiding = true;
			libD.hideSmoothly(libD._contextMenuElem, {time: 200});
		}

		libD.blockToolTip = false;
	};

	libD.contextMenuDelete = function () {
		try {
			document.body.removeChild(libD._contextMenuElem);
			delete libD._contextMenuElem;
		} catch (e) {}
	};

	libD.moduleLoaded("contextmenu");
});
