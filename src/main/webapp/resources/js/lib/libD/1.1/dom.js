/*
	Copyright (C) 2011, 2015 JAKSE Raphaël

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

	libD.superPreviousSibling = function (node, root) {
		var nS = null;
		do {
			nS = node.previousSibling;
		} while (!nS && (node = node.parentNode) && node !== root);
		return nS || null;
	};

	libD.superNextSibling = function (node, root) {
		var pS = null;
		do {
			pS = node.nextSibling;
		} while (!pS && (node = node.parentNode) && node !== root);
		return pS || null;
	};

	libD.applyToDeepestNodes = function (node, callback) {
		var cN = node.childNodes, i = 0, len = cN.length;
		while (i < len) {
			if (cN[i].firstChild) {
				libD.applyToDeepestNode(cN[i], callback);
			} else {
				callback(cN[i]);
			}
			++i;
		}
		return node;
	};


	libD.isBlockElement = function (node) {
		// list from MDN
		return (
			[
				"b", "big", "i", "small", "tt",
				"abbr", "acronym", "cite", "code", "dfn", "em", "kbd", "strong", "samp", "var",
				"a", "bdo", "br", "img", "map", "object", "q", "script", "span", "sub", "sup",
				"button", "input", "label", "select", "textarea", "#text"
			].indexOf(node.nodeName.toLowerCase()) === -1
		);
	};

	libD.deepestFirst = function (node) {
		while (node && node.firstChild) {
			node = node.firstChild;
		}
		return node;
	};

	libD.deepestLast = function (node) {
		while (node && node.lastChild) {
			node = node.lastChild;
		}
		return node;
	};

	libD.containsOrIs = function (parent, child) {
		if (parent === child) {
			return true;
		}

		for (var c = parent.firstChild; c; c = c.nextChild) {
			if (libD.containsOrIs(c, child)) {
				return true;
			}
		}

		return false;
	};

	function domFromCoordinates(c, dom) {
		if (!c.length) {
			return dom;
		}

		return domFromCoordinates(c.slice(1), dom.childNodes[c[0]]);
	}

	function setSideFromRangeCoordinatesPart(range, c, f, dom) {
		range[f](domFromCoordinates(c[0], dom), parseInt(c[1]));
	}

	function fromRangeCoordinates(coords, dom) {
		var range = document.createRange();
		setSideFromRangeCoordinatesPart(range, coords[0], "setStart", dom);
		setSideFromRangeCoordinatesPart(range, coords[1], "setEnd",   dom);
		return range;
	}

	function findDOMPosition(node, parent) {
		console.log("find", node, parent);
		if (node === parent) {
			return [];
		}

		return findDOMPosition(node.parentNode, parent).concat(
			[].indexOf.call(node.parentNode.childNodes, node)
		);
	}

	function toRangeCoordinates(range, dom) {
		return [
			[findDOMPosition(range.startContainer, dom), range.startOffset],
			[findDOMPosition(range.endContainer, dom),   range.endOffset]
		];
	}

	function undoKeyDown(undoManager, e) {
		if (e.keyCode === 90) {
			// z

			if (e.ctrlKey || e.metaKey) {
				if (e.shiftKey) {
					undoManager.redo();
				} else {
					undoManager.undo();
				}
				e.preventDefault();
				return false;

			}
		} else if (e.keyCode === 89) {
			// y

			if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
				undoManager.redo();
				e.preventDefault();
				return false;
			}
		} else if (
			undoManager.handlePaste && (
				(e.keyCode === 86 && (e.ctrlKey || e.metaKey)) || // ctrl+v
				(e.keyCode === 45 && e.shiftKey) // shift+insert
			)
		) {
			undoManager.checkpoint();
		}
	}

	function undoMouseDown(undoManager, e) {
		if (e.button === 1 || e.button === 4) {
			undoManager.checkpoint();
		}
	}

	function undoPaste(undoManager, e) {
		undoManager.checkpoint();
	}

	function UndoDOM() {
		this.undoStateUpdated = libD.signal();
		this.redoStateUpdated = libD.signal();
		this.currentPos = 0; // points to the dom to the current state
		this.handlePaste = true;
		this.autoCheckpoints = false;
		this.autoFocus = true;
		this.dom = null;
		this.stack = [];
	}

	UndoDOM.prototype.setDOM = function (dom) {
		if (this.dom) {
			this.mutationObserver.disconnect();
		}
		this.dom = dom;
		this.stack = [this.getCurrentDOMState()];
		this.mutationObserver = new MutationObserver(this.mutated.bind(this));
		this.mutationObserver.observe(this.dom, this.mutationObserverOptions);
	};

	UndoDOM.prototype.mutated = function (mutations) {
		console.log("mutated");

		if (this.autoCheckpoints && !this.atomicCheckpoint) {
			var doCheckPoint = false;

			mutations.forEach(
				function (mutation) {
					if (mutation.addedNodes.length || mutation.removedNodes.length || mutation.attributeName) {
						console.log("added", mutation.addedNodes);
						doCheckPoint = true;
					}
				}
			);

			if (doCheckPoint) {
				this.checkpoint();
				return;
			}
		}

		this.changed = true;
		this.forgetRedo();

	};


	UndoDOM.prototype.setAutoCheckpoints = function () {
		this.autoCheckpoints = true;
	}

	UndoDOM.prototype.checkpointsOnPaste = function (b) {
		this.setAutoCheckpoints()
		if (typeof b === "undefined" || b) {
			if (!this.boundUndoMouseDown) {
				this.boundUndoMouseDown = undoMouseDown.bind(null, this);
			}

			if (!this.boundUndokeyDown) {
				this.boundUndokeyDown = undoKeyDown.bind(null, this);
			}

			if (!this.boundUndoPaste) {
				this.boundUndoPaste = undoPaste.bind(null, this);
			}

			this.dom.addEventListener("onmousedown", this.boundUndoMouseDown, false);
			this.dom.addEventListener("onkeydown",   this.boundUndokeyDown,   false);
			this.dom.addEventListener("onpaste",	 this.boundUndoPaste,	 false);
			this.handlePaste = true;
		} else if (this.boundUndoMouseDown && this.boundUndokeyDown && this.boundUndoPaste) {
			this.dom.removeEventListener("onmousedown", this.boundUndoMouseDown, false);
			this.dom.removeEventListener("onkeydown",   this.boundUndokeyDown,   false);
			this.dom.removeEventListener("onpaste",	 this.boundUndoPaste,	 false);
			this.handlePaste = false;
		}
	};

	UndoDOM.prototype.mutationObserverOptions = {
		childList:	 true,
		attributes:	true,
		characterData: true,
		subtree:	   true
	};

	UndoDOM.prototype.checkpoint = function (atomic) {
		if (this.check()) {
			console.log("check");
			this.forgetRedo();
			this.stack[
				this.stack[this.currentPos]
					? ++this.currentPos
					: this.currentPos
			] = this.getCurrentDOMState();
		}

		if (atomic) {
			this.atomicCheckpoint = !this.atomicCheckpoint;
		}
	};

	UndoDOM.prototype.getCurrentDOMState = function () {
		var s = window.getSelection();
		var ranges = [];
		var range;

		for (var i = 0; i < s.rangeCount; i++) {
			range = s.getRangeAt(i);
			if (
				libD.containsOrIs(this.dom, range.startContainer) &&
				libD.containsOrIs(this.dom, range.endContainer)
			) {
				ranges.push(toRangeCoordinates(range, this.dom));
			}
		}

		return [this.dom.cloneNode(true), ranges];
	};

	UndoDOM.prototype.restoreStackElement = function (e) {
		var newDom = e[0].cloneNode(true);
		var newSel = e[1];

		this.mutationObserver.disconnect();

		this.dom.textContent = "";

		for (var c = newDom.firstChild; c; c = c.nextSibling) {
			this.dom.appendChild(c);
		}

		var s = window.getSelection();
		s.removeAllRanges();

		for (var i = 0; i < newSel.length; i++) {
			s.addRange(fromRangeCoordinates(newSel[i], this.dom));
		}

		if (!newSel.length) {
			s.collapse(libD.deepestFirst(this.dom), 0);
		}

		if (this.autoFocus) {
			this.dom.focus();
		}

		this.mutationObserver.observe(this.dom, this.mutationObserverOptions);
		this.changed = false;

		this.redoStateUpdated.emit(this.canRedo());
		this.undoStateUpdated.emit(this.canUndo());
	};

	UndoDOM.prototype.setAutoFocus = function (b) {
		this.autoFocus = b;
	};

	UndoDOM.prototype.check = function () {
		if (this.stack[this.currentPos]) {
			return this.changed;
		} else {
			return true;
		}
	};

	UndoDOM.prototype.undo = function () {
		if (this.canUndo()) {
			this.checkpoint(true);
			this.restoreStackElement(this.stack[--this.currentPos])
		}
	};

	UndoDOM.prototype.redo = function () {
		if (this.canRedo()) {
			this.restoreStackElement(this.stack[++this.currentPos]);
		}
	};

	UndoDOM.prototype.forgetRedo = function () {
		this.stack.splice(this.currentPos + 1);

		if (this.stack[this.currentPos]) {
			this.currentPos++;
		}

		this.redoStateUpdated.emit(this.canRedo());
		this.undoStateUpdated.emit(this.canUndo());
	};

	UndoDOM.prototype.handleShortcuts = function (b) {
		if (typeof b === "undefined" || b) {
			if (!this.boundUndoKeyDown) {
				this.boundUndoKeyDown = undoKeyDown.bind(null, this)
			}
			this.dom.addEventListener("keydown", this.boundUndoKeyDown, false);
		} else if (this.boundUndoKeyDown) {
			this.dom.removeEventListener("keydown", this.boundUndoKeyDown, false);
		}
	};

	UndoDOM.prototype.canRedo = function () {
		return this.currentPos + 1 < this.stack.length;
	};

	UndoDOM.prototype.canUndo = function () {
		return this.currentPos > 0;
	};

	libD.UndoDOM = UndoDOM;

	if (libD.moduleLoaded) {
		libD.moduleLoaded("dom");
	}
}(this));
