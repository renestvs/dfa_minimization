/*
	@fileOverview Used to be indent.js. written in 2009. You don't need anything unless you use it with something different from TEXTAREAs. In that case, you'll need libD's dom.js.
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
		libD.need = function (o, f, that, arg) {
			f.apply(that || window, arg);
		};
	}

	if (!libD.t) {
		/* see libD/core.js ; textContent abstraction. Instead of writing o.textContent = "text", always write libD.t(o, "text"), it's shorter and supports IE via its innerText property. Thanks to IE for that one.
		*/

		libD.t = function (o, t) {
			if (t === undefined) {
				return o.textContent || o.innerText || "";
			}

			if (o.textContent !== undefined) {
				o.textContent = t;
			} else if (o.innerText !== undefined) {
				o.innerText = t;
			} else {
				o.nodeValue = t;
			}

			return t;
		};
	}

	function addEvent(o, evt, fn) {
		try {
			o.addEventListener(evt, fn, false);
		} catch (e) {
			o.attachEvent("on" + evt, fn);
		}
	}

	/* Will (des)indent the given textarea.
		@param o The textarea to manage
		@param indent if true, indent the selection. Otherwize, indent the current line (when e.g. a new line was created). The currentLine is where the caret is.
		@param unIndent If true, unIndent instead of indenting.
	*/
	libD.indentTextareaAction = function (o, indent, unIndent, afterEnterPress) {
		var IE = false;/*@cc_on var IE = true; @*/
		var NL = IE ? "\r\n" : "\n", nlLen = NL.length;

		var substrCount;
		if (document.selection) {
			substrCount = function (haystack, needle, offset, length) {
				// Returns the number of times a substring occurs in the string
				//
				// version: 1009.2513
				// discuss at: http://phpjs.org/functions/substr_count	// +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
				// +   bugfixed by: Onno Marsman
				// *	 example 1: substrCount("Kevin van Zonneveld", "e");
				// *	 returns 1: 3
				// *	 example 2: substrCount("Kevin van Zonneveld", "K", 1);	// *	 returns 2: 0
				// *	 example 3: substrCount("Kevin van Zonneveld", "Z", 0, 10);
				// *	 returns 3: false

				var cnt = 0;
				if (isNaN(offset)) {
					offset = 0;
				}

				if (isNaN(length)) {
					length = 0;
				}

				offset--;
				while ((offset = haystack.indexOf(needle, offset + 1)) !== -1) {
					if (length > 0 && (offset + needle.length) > length) {
						return false;
					}
					cnt++;
				}
				return cnt;
			};
		}

		/* thx :
			- http://the-stickman.com/web-development/javascript/endding-selection-cursor-position-in-a-textarea-in-internet-explorer/
			- https://mootools.lighthouseapp.com/projects/24057/tickets/99-elementinsertatcursor-ie7-and-newlines#ticket-99-2
		*/
		// The current selection
		var range = document.selection.createRange();
		// We'll use this as a 'dummy'
		var dup = range.duplicate();
		var value = o.value;
		var offset = value.length;
		dup.moveToElementText(o);
		dup.setEndPoint("StartToEnd", range);
		o.selectionEnd = offset - dup.text.length;
		dup.setEndPoint("StartToStart", range);
		o.selectionStart = offset - dup.text.length;

		if (typeof o.setSelectionRange !== "function") {
			o.setSelectionRange = function (start, end) {
// thx CSTruter post #2 at http://www.codingforums.com/archive/index.php/t-90176.html
				var toStrip = substrCount(o.value.substring(0, start), "\r\n");
				start -= toStrip;
				end -= toStrip + substrCount(o.value.substring(start, end), "\r\n");
				range = o.createTextRange();
				range.collapse(true);
				range.moveEnd("character", end);
				range.moveStart("character", start);
				range.select();
			};
		} else if (typeof o.setSelectionRange !== "function") {
			o.setSelectionRange = function () {};
		}

		var scrollTop = o.scrollTop;

		var begin, end = false, beginLen;

		if (indent) {
			if (o.selectionStart === o.selectionEnd && !unIndent) {
				begin = value.substring(0, o.selectionStart);
				beginLen = begin.length + 1;
				o.value = begin + "\t" + value.substring(o.selectionEnd);
				o.setSelectionRange(beginLen, beginLen);
			} else {
				var I = o.selectionStart, selEnd = o.selectionEnd;

				if (unIndent && (value.charAt(I - 1) === "\n" || value.charAt(I - 1) === "\r") && (value.charAt(I) === " " || value.charAt(I) === "	")) {
					I++;
					selEnd = Math.max(selEnd, I);
					o.setSelectionRange(I, selEnd); // désindenter aussi la première ligne
				}

				begin = value.substring(0, I);
				beginLen = begin.length;

				var i = I, c;
				while (i >= 0 && !end) {
					if (nlLen === 2 && begin.charAt(i) === "\n") {
						--i; //should never happen
					}

					if (begin.charAt(i) === NL.charAt(0)) {
						i += nlLen;
						if (unIndent) {
							c = begin.charAt(i);
							if (c === "\t" || c === " ") {
								begin = begin.substring(0, i) + begin.substring(i + 1, beginLen);
								beginLen--;
							}
						} else {
							begin = begin.substring(0, i) + "\t" + begin.substring(i, beginLen);
							beginLen++;
						}
						end = true;
					} else {
						--i;
					}
				}

				var between;

				if (unIndent) {
					c = value.charAt(0);
					if (i === -1 && (c === "\t" || c === " ")) {
						if (beginLen) {
							begin = begin.substring(1, beginLen);
							beginLen--;
						} else {
							I++;
						}
					}

					between = value.substring(I, selEnd).replace(
						new RegExp(NL + "(?:\t| {1, 4})", "g"), NL);
				} else {
					if (!end) {
						begin += "\t";
						beginLen++;
					}

					between = value.substring(I, selEnd).replace(
						new RegExp(NL + "([^" + NL + "])", "g"), NL + "	$1");
				}

				end = value.substring(selEnd);
				o.value = begin + between + end;
				beginLen = begin.length;
				o.setSelectionRange(beginLen, beginLen + between.length);
			}
			o.scrollTop = scrollTop;
		} else {
			var scrollHeight = o.scrollHeight, indenting = "";

			i = o.selectionStart - 1 - (afterEnterPress ? nlLen : 0);

			while (i >= 0) {
				c = value.charAt(i);
				if (c === " " || c === "\t") {
					indenting = c + indenting;
				} else {
					if (c === "\n" || c === "\r") {
						break;
					}
					indenting = "";
				}
				--i;
			}

			begin = value.substring(0, o.selectionStart - (afterEnterPress ? nlLen : 0));
			end = value.substring(o.selectionEnd);
			o.value = begin + NL + indenting + end;
			var select = begin.length + indenting.length + nlLen;
			o.setSelectionRange(select, select);
			o.scrollTop = scrollTop + (o.scrollHeight - scrollHeight);

		}

		if (typeof o.value === "undefined") {
			o.innerHTML = o.innerHTML.replace(/\r?\n/g, "<br />");
		}
	};

	libD.getIndentation = function (range, body) {
		var reader = new libD.DomStreamReader(range.startContainer, range.startOffset, body);

		var c, ind = "";

		while ( (c = reader.back()) ) {
			//libD.dbg("..." + c);
			if (c === "\t" || c === " ") {//libD.dbg("++");
				ind = c + ind;
			} else {
				if (c === "\n" || c === null) {//libD.dbg("stop");
					break;
				}
				ind = "";
			}
		}
		return ind;
	};

	libD.addIndentation = function (node) {
		if (node.nodeName === "#text") {
			libD.t(node, libD.t(node).replace(/\n/g, "\n\t"));
		} else {
			node.parentNode.repalceChild(node, document.createTextNode("\n\t"));
		}
	};

	libD.unIndentWithReader = function (reader) {
		var c = reader.current();
		while (c && c !== "\n") {
			c = reader.back();
		}

		c = reader.next();

		if (c === "\t") {
			reader.deleteFrom();
			reader.deleteTo(true);
		} else if (c === " ") {
			reader.deleteFrom();
			var count = 0;
			do {
				++count;
				c = reader.next();
			}
			while (c === " ");
			if (count < 8 && c === "\t") {
				reader.deleteTo(true);
			} else {
				reader.deleteTo();
			}
		}
	};

	libD.indentAction = function (o, indent, unIndent, afterEnterPress) {
		if (o.value) {
			return libD.indentTextareaAction(o, indent, unIndent, afterEnterPress);
		}

		//This is a plain DOM object. STILL BUGGY ! (unIndenting ; indenting multi lines)

		if (o.getSelection) { // W3C
			//Hacky fix for chromium
			var lastChild = o.document.body.lastChild, tC;
			if (lastChild.nodeName.toLowerCase() !== "br" && (tC = lastChild.textContent).charAt(tC.length - 1) !== "\n") {
				o.document.body.appendChild(document.createTextNode("\n"));
			}
			/* chromium doesn't seem to take in account the last \n (it is event overwritten when you type), so we create one if there isn't any.
			   This forces files to end with a \n... but the behavior of gecko keeps almost perfectly unchanged.
			   The almost only thing that changes is that you see a \n at the and of the source code.
			   The three lines make Gecko and chromium behave exactly the same way.
			*/

			var selObj = o.getSelection();

			var selI = 0,
			    selLen = selObj.rangeCount,
			    range,
			    t, // a textNode
			    reader, // abstraction for reading the dom
			    c; // buffer char

			if (indent) {
				if (unIndent) {
					while (selI < selLen) {
						range = selObj.getRangeAt(selI);

						libD.unIndentWithReader(
							new libD.DomStreamReader(range.startContainer, range.startOffset, o.document.body)
						);

						if (!range.collapsed) {
							var div = document.createElement("div");
							div.appendChild(range.extractContents());

							reader = new libD.DomStreamReader(div, 0, div);

							c = reader.current();

							while (c) {
								do {
									if (c === "\n") {
										break;
									}
								} while ( (c = reader.next()) );

								if (c === "\n") {
									libD.unIndentWithReader(reader);
									c = reader.next();
								}
							}

							while (div.lastChild) {
								range.insertNode(div.lastChild);
							}
							div = null;

						}
						++selI;
					}
					return null;
				}

				while (selI < selLen) {// manage all the ranges
					range = selObj.getRangeAt(selI);

					if (range.collapsed) {
						t = o.document.createTextNode("\t");
						range.insertNode(t);

						range.setEndAfter(t);
						range.setStartAfter(t);
					} else {
						reader = new libD.DomStreamReader(range.startContainer, range.startOffset, o.document.body);
						do {
							c = reader.back();
						} while (c && c !== "\n");

						if (reader.currentNode.nodeName === "#text") {
							libD.t(reader.currentNode, reader.currentNodeString.substr(0, reader.offset + 1) + "\t" + reader.currentNodeString.substr(reader.offset + 1));
						} else {
							reader.currentNode.parentNode.insertBefore(reader.currentNode.nextSibling, document.createTextNode("\t"));
						}

						range.insertNode(libD.applyToDeepestNodes(range.extractContents(), libD.addIndentation));
					}
					++selI;
				}
			} else { // new line
				while (selI < selLen) {// manage all the ranges
					range = selObj.getRangeAt(selI);

					t = o.document.createTextNode("\n" + libD.getIndentation(range, o.document.body));

					range.deleteContents();

					range.insertNode(t);

					range.setEndAfter(t);
					range.setStartAfter(t);

					++selI;
				}
			}

			// set the selection
			if (t) {
				selObj.removeAllRanges();
				selObj.addRange(range);
			}
	//		o.scrollTo(libD.left(t), libD.top(t));
	//		console.log(libD.left(t), libD.top(t));
		}
	};

	/* Will manage the given textarea / DOM element : helps the user typing indented code listening to the keydown event of the element (enter = new indented line, tab = indent, shift+tab = unIndent). Enter doesn't do anything special on IE.
		@param o The textarea or other DOM element to manage
	*/
	libD.indentHelper = function (o) {
		var listenedObj = o;
		if (!o.nodeName.toLowerCase() === "textarea") {
			o = o.contentWindow;
			o.document.body.style.whiteSpace = "pre"; //FIXME : support pre-wrap

			addEvent(o.document, "keypress",
				function (e) {
					if (e.keyCode === 13 || e.keyCode === 9) {
						e.preventDefault();
						e.stopPropagation();
						return false;
					}
				}
			);
			addEvent(o.document, "keyup",
				function (e) {
					if (e.keyCode === 13 || e.keyCode === 9) {
						e.preventDefault();
						e.stopPropagation();
						return false;
					}
				}
			);

			listenedObj = o.document;
		}

		addEvent(listenedObj, "keydown",
			function (e) {
				if (e.keyCode === 9) { // TAB
					libD.indentAction(o, true, e.shiftKey);

					try {
						e.preventDefault();
					} catch (er) {
						e.returnValue = false;
					}
					return false;
				}

				if (e.keyCode === 13) {
					libD.indentAction(o, false, false);
					try {
						e.preventDefault();
					} catch (er) {
						e.returnValue = false;
					}
					return false;
				}
			}
		);
	};

	if (libD.moduleLoaded) {
		libD.moduleLoaded("indentHelper");
	}
}(this));
