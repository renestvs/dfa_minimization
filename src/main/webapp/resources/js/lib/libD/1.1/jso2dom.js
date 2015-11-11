/*
	a JS Object to DOM converter. Useful to get a DOM structure quickly without innerHTML.
	Moreover, it let you get references to newly created DOM object. No need to use the HTML id attribute.
	This allow you to create completely safely isolated rich apps with less pain than using DOM directly.
	It saves you bytes and time :)
	Needs nothing to work
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

	/*
		JSON (Javascript) Object to DOM.

		This function turn o into DOM elems and creates references to these elements asked in o.
		If parent is a DOM elem, o DOMized is added to parent.

		The function returns o DOMized.

		 - Only o is a required argument
		 - Pass parent (DOM element) if you want o DOMized to be added to it
		 - Pass refs if you want to keep references asked in o.
		 - set childrenListing if you want the DOM children to be listed in refs under the key <childrenListing> */
	libD.jso2dom = function (o, refs, parent, childrenListing) {
		if (!refs) {
			refs = []; // Warning : refs will not be accessible from the outside
		}

		if (!parent) {
			parent = document.createDocumentFragment();
		}

		var i;

		if (typeof o[0] === "string") { // not a list of elems, just an elem
			var dom;

			if (o[0] === "#") {
				// just a text node
				dom = document.createTextNode(typeof o[1] === "string" ? o[1] : "");
			} else if (o[0] === "#g") {
				dom = parent;
			} else {
				var tag = o[0].split("."),
				    nameId = tag[0].split("#"),
				    classId;

			    dom = document.createElement(nameId[0]);

				classId = tag[1] ? tag[1].split("#") : [];

				if (nameId[1]) {
					dom.id = nameId[1];
				}

				if (classId[0]) {
					dom.className = classId[0];

					if (classId[1]) {
						dom.id = classId[1];
					}
				}
			}

			if (childrenListing) {
				if (refs[childrenListing]) {
					refs[childrenListing].push(dom);
				} else {
					refs[childrenListing] = [dom];
				}
			}

			var o2 = o[1], o3 = o[2];
			if (o2) {
				var t2 = typeof o2;
				if (t2 === "object") {
					var childHaveChildrenListing = false;
					if (o2.length === undefined) { // o2 is a list of attributes
						for (i in o2) {
							if (i.charAt(0) === "#") {
								// special jsui2dom command

								if (i === "#cloop") {
									// children of this elem will be listed as o2[i] refs' key.
									childHaveChildrenListing = o2[i];
								} else if (i === "#") {
									// dom is registered in refs as o2[i].
									refs[o2[i]] = dom;
								} else if (i === "#loop") {
									 // dom is registered in refs[o2[i] array.
									if (refs[o2[i]]) {
										refs[o2[i]].push(dom);
									} else {
										refs[o2[i]] = [dom];
									}
								}
								// Unknown commands are ignored
							} else {
								dom.setAttribute(i, o2[i]);
							}
						}
					} else {
						// o2 is a (list of) child(ren)
						o3 = o2;
					}
				} else if (t2 === "string") { // o2 is a textContent
					if (o[0] === "#") {
						dom.textContent = o2;
					} else {
						dom.appendChild(document.createTextNode(o2));
					}
				}
			}

			if (o3) {
				if (typeof o3 === "string") {
					try {
						dom.appendChild(document.createTextNode(o3));
					} catch (e) {
						dom.textContent = o3;
					}
				} else {
					// Here we assume that o3 is an array (a child or array of children).
					// We don't do tests because it's useless if you use the function correctly.

					// DOMized o3 is added to DOM. we keep the refs the user asked for.
					libD.jso2dom(o3, refs, dom, childHaveChildrenListing);
				}
			}

			if (parent !== dom) {
				parent.appendChild(dom);
			}
		} else {
			var len = o.length;
			for (i = 0; i < len; ++i) {
				libD.jso2dom(o[i], refs, parent, childrenListing);
			}
		}

		if (parent.nodeType === 11 && parent.childNodes.length === 1) {
			return parent.firstChild;
			//FIXME: What happens to the documentFragment Element ?
		}

		return parent;
	};

	if (libD.moduleLoaded) {
		libD.moduleLoaded("jso2dom");
	}
}(this));
