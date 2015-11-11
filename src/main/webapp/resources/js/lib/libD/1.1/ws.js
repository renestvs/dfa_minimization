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

/*
 Class: libD.wm
 A window system to use with a libD-compliant window manager like libD.wm.

 Usage:
	You need to create an object that will allow you to open new windows. A good idea is to create the object at libD.winSys, which is a common place. After that, you have to specify the window manager (usually <libD.wm>) and the "area" (usually document.body).

	> var WS = libD.winSys = new libD.WS();
	> WS.setArea(document.body);
	> WS.setWM(libD.wm); // if libD's wm module is loaded

	After that, you can create a new window by calling WS.newWin.
	e.g:
	> var win = WS.newWin({
	> 	width:200,
	> 	height:"75%",
	> 	show:true, // automatically show the windows after its creation
	> 	title:"My awesome window",
	> 	content:myDomElementBeingTheWindowContent_usuallyADiv
	> });

	That"s the flexible way, but there is much simpler for basic usage: you simply call *libD.newWin* as shown just above directly, it will do all these things for you (including the setWM(libD.wm) call). It"s less flexible and you don"t have the control on the WS object, but it"s okay in most cases. A <libD.WS> object will be automatically created when first calling <libD.newWin>. You can access it with <libD.defaultWS>.

	Needs:
		Package sizepos
		Package numbers
*/

/*global libD:true*/

libD.need(["sizepos", "numbers"], function () {
	"use strict";

	/*
	Supported Events:
		- show: the window is shown
		- close: the window is closed
		- decoration: the window is decorted
		- preventClosing: Meta event allowing you to prevent a window from closing. When a window is about to close, and before the close event is dispatched, the preventClosing is dispached. If a function returns false to this event, the window won"t be closed.
		- "focus"
		- "blur"
		- "ring"
		- "back"
		- "minimize"
		- "maximize"
		- "fullscreen"
		- "move"
		- "resize"
		- "restore"
		- "sticky"
		- "changeIcon"
		- "changeTitle"
		- "changeWorkplace"
		- "changeType"
		- "iconifiable"
		- "all"
	*/

	libD.WS = function () {
		// libD Window System. Constructor.
		this.wm = null; // window manager à utiliser
		this.wl = [];
		this.nextPos = [0, 0]; // proposition pour la prochaine position par défaut à utiliser
		this.workplaces = [{activeWindow: null, wl: []}]; // wle des fenêtres par bureau
		this.currentWorkplace = 0; // bureau actuel
		this.libDWS = true;
		this.area = null;
		this.areaHeight = 0;
		this.areaWidth = 0;
		this.realTimeResizeEvent = false;

		this.areaLimit = {
			left: null,
			right: null,
			top: null,
			bottom: null
		};

		this.limits = {
			left: [],
			right: [],
			top: [],
			bottom: []
		};

		this.errno = -1;
		this.registeredEvents = [];
		this.domEvents = [];

		this.autoFocus = true; // auto focus new windows

		this.onBack = null; // always on back windows;
		this.jsError = function () {};
		/*
			0: unknown
			1: bad wm
		*/

		// maximal delay before proposing forced closing of the window
		this.preventClosingTimeout = 5000;

		// minimal z-index for the windows
		this.zIndexMin = 0;

		// icon to use if not supplied
		this.defaultIcon = "";

		// when handling a window pos, prefer percentages over absolute numbers.
		this.xPreferRelative = this.yPreferRelative = false;

		var that = this;

		this.newWin = function (o) {
			return new libD.WSwin(that, o);
		};

		libD.setListenerSystem(this, libD.WS.prototype);
	};

	libD.WS.prototype = {
		/*
			Method: setArea
			Set the area of the window system. The area is the DOM object windows will leave ; they will be its children in terms of DOM. usually, it"s document.body.
			Parameters:
				n - the node that will be the area.
		*/
		setArea: function (n) {
			if (this.area !== null) {
				return false;
			}

			this.area = n;
			this.areaWidth = libD.width(n);
			this.areaHeight = libD.height(n);
			var that = this;

			window.addEventListener("resize", that.redraw.bind(that), false);

			var s = window.getComputedStyle(n, null);

			if (s.position === "static") {
				n.style.position = "relative";
			}

			if (n === document.body && !libD.wsDontApplyBodyWorkaround) {
				if (document.body.clientHeight < document.body.parentNode.clientHeight) {
					document.body.parentNode.style.height = "100%";
					document.body.parentNode.style.boxSizing = "border-box";
					document.body.style.height = "100%";
					document.body.style.boxSizing = "border-box";
					document.body.style.paddingLeft = parseInt(s.marginLeft) + parseInt(s.paddingLeft) + "px";
					document.body.style.paddingRight = parseInt(s.marginRight) + parseInt(s.paddingRight) + "px";
					document.body.style.paddingTop = parseInt(s.marginTop) + parseInt(s.paddingTop) + "px";
					document.body.style.paddingBottom = parseInt(s.marginBottom) + parseInt(s.paddingBottom) + "px";
					document.body.style.margin = "0";
				}
			}
		},
		/*
			Method: getWindowList
			get the list of loaded windows in this system.
			Returns:
			an Array of objects corresponding to the currently loaded windows
		*/
		getWindowList: function () {
			return this.wl;
		},

	/*
		Method: redraw
		This function must be called each time the area is resized (e.g. via CSS), or things will go wrong. If the area is resized because the window of the browser is resized, redraw is automatically done provided the browser supports window"s resize event.
	*/
		redraw: function () {
			var W = libD.width(this.area), H = libD.height(this.area);
			if (this.areaWidth !== W || this.areaHeight !== H) {
				this.areaWidth = W;
				this.areaHeight = H;
				var i = 0, len = this.wl.length;
				while (i < len) {
					if (typeof this.wl[i].left === "string" || typeof this.wl[i].bottom === "string" || typeof this.wl[i].top === "string" || typeof this.wl[i].right === "string") {
						this.wl[i].dispatchEvent("move");
					}

					if (typeof this.wl[i].width === "string" || typeof this.wl[i].height === "string") {
						this.wl[i].dispatchEvent("resize");
					}

					if (this.wl[i].centeredX) {
						this.wl[i].centerX();
					}

					if (this.wl[i].centeredY) {
						this.wl[i].centerY();
					}

					++i;
				}
			}
		},
	/*
		Method: isWindowable
		Returns true if the given node can be used as the content of a window, false otherwise.
		Parameter:
			n - the node to test
		Returns:
			A boolean
	*/
		isWindowable: function (n) {
			return (n === 1 || n === 9 || n === 11 || n === 3);
		},
	/*
		Method: setWM
		use the libD-compliant window manager given in argument for this system. TODO: Calling this method when wibdows are loaded is BUGGY and still not supported.
		Parameter:
			wm - the libD-compatible wm to load
		Returns:
			true if it succeded, false otherwise. (example: because wm is buggy)
	*/
		setWM: function (wm) {
			if (typeof wm !== "object") {
				return false;
			}

			var i = 0, len = this.wl.length, dom, content;

			if (this.wm) {
				while (i < len) {//FIXME:check this code, never tested
					content = null;
					dom = null;

					if (wm.createWindow) {
						dom = wm.createWindow(this.wl[i]);
					}

					content = document.createElement("div");

					if (dom) {
						for (var j = 0, children = this.wl[i].content.childNodes, jlen = children.length ; j < jlen ; ++j) {
							if (!content.appendChild(children[j])) {
								this.wl[i].errno = 4; //FIXME
							}
						}

						if (this.wm.unload) {
							this.wm.unload(this.wl[i]);
						}

						this.wl[i].dom = dom;
						this.wl[i].content = content;
					} else {
						this.errno = 1;

						for (; i; --i) {
							if (this.wm.unload) {
								this.wm.unload(this.wl[i]);
							}
						}

						if (this.wm.unloadCompletely) {
							this.wm.unloadCompletely();
						}

						return false;
					}
					++i;
				}
				if (this.wm.unloadCompletely !== undefined) {
					this.wm.unloadCompletely();
				}

			}

			dom = null;

			while (i < len) {
				if (typeof wm.createWindow === "function") {
					dom = wm.createWindow(this.wl[i]);
				}

				if (dom) {
					try {
						this.area.replaceChild(dom, this.wl[i].dom);
					} catch (e) {
						libD.error("loading WM failed: replaceChild method failded.", this, wm, e);
						this.wl[i].errno = 4; //FIXME
					}

					this.wl[i].dom = dom;
					dom._libDWSWin = this.wl[i];
				} else {
					this.wl[i].errno = 4; //FIXME
				}

				++i;
			}

			this.wm = wm;
			this.fixZIndexes();
			return true;
		},

	/*
	 Method: dispatchEvent
		Called when a event occurs. Should not be called by foreign scripts.
		Parameter:
			e - the name of the event that happened
	*/
		dispatchEvent: function (e) {
			this.emit(e);
			this.emit("all");
		},
	/*
		Method: setCurrentWorkplace
		Set the current workplace.
		Parameter:
			n - the number of the workplace to set. Minimum: 0, maximum: n-1 where n is the number of workplaces available
		See Also:
			<libD.WS.setWorkplaceNumber>
			<libD.WS.sendToWorkplace>
	*/
		setCurrentWorkplace: function (n) {
			n = parseInt(n, 10);
			if (isNaN(n) || this.workplace.wl[n] === undefined) {
				return false;
			}
			this.currentWorkplace = n;
			this.dispatchEvent("changeWorkplace");
		},
	/*
		Method: setWorkplaceNumber
		Set the number of workplaces available. If the current number of workplaces is greter than the number being set, windows of workplaces of greatest number will be moved to other workplaces

		Parameter:
			n - the numberof workplaces to set
		See Also:
			<libD.WS.setCurrentWorkplace>
			<libD.WS.sendToWorkplace>
	*/

		setWorkplaceNumber: function (n) {
			if (isNaN(n = parseInt(n, 10)) || n < 1) {
				return false;
			}

			var wps = this.workplaces, i = wps.length;

			while (i < n) {
				wps[i++] = {activeWindow: null, wl: []};
			}

			var wp = wps[n - 1], len = wp.length;

			while (i > n) {
				for (var j = 0, formerWP = wps[i - 1], wsWin; j < len; ++j) {
					wsWin = wp.wl[wp.wl.length] = formerWP.wl[j];
					wsWin.workplace = n - 1;
					if (wsWin.focused) {
						wsWin.focused = false;
						wsWin.dispatchEvent("blur");
						if (this.ws.wm && this.ws.wm.blur) {
							this.ws.wm.blur(j);
						}
					}

					wsWin.dispatchEvent("changeWorkplace");
				}
				--i;
				this.workplace.pop();
			}

			return true;
		},
	/*
		Method: sendToWorkplace
		Send a window to the workplace number n
		Parameters:
			wsWin - the window to move
			n - the number of the workplace of destination
		See Also:
			<libD.WS.setWorkplaceNumber>
			<libD.WS.setCurrentWorkplace>
	*/
		sendToWorkplace: function (wsWin, n) {
			var winWorkplace = this.workplaces[wsWin.workplace],
			    i = winWorkplace.indexOf(wsWin);

			if (i === -1) {
				if (this.wl.indexOf(wsWin) === -1) {
					libD.error("bug detected in libD.WS.sendToWorkplace");
					return false;
				}
			} else {
				winWorkplace.splice(i, 1);
			}

			this.workplaces[n][this.workplaces[n].length] = wsWin;

			return false;
		},
	/*
		Method: minimizeAll
		Minimize all windows of the system
		See Also:
			<libD.WS.showAll>
	*/
		minimizeAll: function () {
			var i = 0;
			while (i < this.wl.length) {
				this.wl[i].minimize();
				this.wl[i].restored = true;
			}
		},
	/*
		Method: showAll
		Show all windows of the system
		Parameter:
			alsoShowRestoredWindows (optional) - if true, restaured windows will also be shown, to e.g. send an event to all windows. Default: false
		See Also:
			<libD.WS.minimizeAll>
	*/
		showAll: function (alsoShowRestoredWindows) {
			var i = 0;
			while (i < this.wl.length) {
				if (alsoShowRestoredWindows || this.wl[i].restored) {
					this.wl[i].show();
					this.wl[i].restored = false;
				}
			}
		},
	/*
		Method: focus
		focus a window. You should use the focus method of the window instead.
		Parameter:
			wsWin - the window to focus
		See Also:
			<libD.WSWin.focus>
	*/
		focus: function (wsWin) {
			var wp = this.workplaces[wsWin.workplace];
			if (wp.activeWindow) {
				wp.activeWindow.focused = false;

				if (this.wm && this.wm.blur) {
					this.wm.blur(wp.activeWindow);
				}

				wp.activeWindow.dispatchEvent("blur");
			}

			wsWin.focused = true;

			if (this.wm && this.wm.focus) {
				this.wm.focus(wsWin);
			}

			wsWin.dispatchEvent("focus");
			this.dispatchEvent("focusChange", wsWin, wp.activeWindow);
			wp.activeWindow = wsWin;
		},
	/*
		Method: blur
		Blurs ("unfocus") a window. You should use the blur method of the window instead.
		Parameter:
			wsWin - the window to focus
		See Also:
			<libD.WSWin.focus>
	*/
		blur: function (wsWin) {
			wsWin.focused = false;

			if (this.wm && this.wm.blur) {
				this.wm.blur(wsWin);
			}

			wsWin.dispatchEvent("blur");
			this.dispatchEvent("focusChange", null, wsWin);

			this.workplaces[wsWin.workplace].activeWindow = null;
		},

		_wmFailed: function (wsWin) {
			var formerWM = this.wm;
			this.wm = null;

			for (var i = 0, wl = this.wl, len = wl.length; i < len; ++i) {
				if (formerWM.unload) {
					formerWM.unload(wl[i]);
				}

				wl[i].init();
			}

			if (formerWM.unload) {
				formerWM.unload(wsWin);
			}

			this.dom.init(); // NOTE: infinite loop if libD.WS is really buggy

			if (formerWM.unloadCompleted) {
				formerWM.unloadCompleted();
			}
		},
		/*
			Method: addWin
			Appends a window to a system. Doesn"t handle the "desafectation" of the previous system of the window if any.
			Parameter:
			wsWin - the window to add
		*/
		addWin: function (wsWin) {
			if (!wsWin.workplace) {
				wsWin.workplace = this.currentWorkplace;
			}

			this.area.appendChild(wsWin.dom);
			this.wl[this.wl.length] = wsWin;

			var wp = this.workplaces[wsWin.workplace];
			if (!wp) {
				wp = this.workplaces[wsWin.workplace] = [];
			}

			wp[wp.length] = wsWin;
			this.dispatchEvent("newWin", wsWin);
		},
		/*
			Method: closeWin
			Close a window. Use the close method of the window instead
			Parameter:
			wsWin - the window to close
		See Also:
			<libD.WSWin.close>
		*/
		closeWin: function (wsWin) {
			var wp = this.workplaces[wsWin.workplace];
			if (wsWin === wp.activeWindow) {
				wp.activeWindow = null;
			}

			this.area.removeChild(wsWin.dom);

			libD.removeValue(this.wl, wsWin);
			libD.removeValue(wp.wl, wsWin);

			this.dispatchEvent("closeWin", wsWin);
		},
		/*
			Method: fixZIndexes
			Will order the windows as they should be. Used internally.
		*/
		fixZIndexes: function () {
			for (var i = 0, len = this.wl.length; i < len; ++i) {
				this.wl[i].dom.style.zIndex = this.zIndexMin + (
					this.wl[i].alwaysOnTop
						? 2000
						: (this.wl[i].alwaysBeneath ? 0 : 1000)
				) + i;
				// FIXME: hard coded limit 1000
			}
		},
	/*
		Method: addLimit
		Set a limit that windows should not exceed.
		Parameters:
			limit - the limit in pixels from the side of the screen
			side - string representing the side affected ("left", "right", "top", "bottom")
		Returns:
			The number associated to the limit; this is the number you will give to removeLimit if you want to cancel the limit.
		Note:
			There can be several limits for each side. The greatest will be applied and then if it is removed, the second greatest limit will be applied.

		See Also:
			<libD.WS.removeLimit>
	*/
		addLimit: function (limit, side) {
			if (!this.limits[side] || typeof limit !== "number") {
				return false;
			}

			var index = this.limits[side].length;
			this.limits[side][index] = limit;

			if (limit > this.areaLimit[side]) {
				this.areaLimit[side] = limit;
			}

			return index;
		},
	/*
		Method: removeLimit
		Removes a limit previously set with addLimit.
		Parameter:
			index - the index of the limit to unset, as returned by addLimit
			side - the side of the limit
		See Also:
			<libD.WS.addLimit>
	*/
		removeLimit: function (index, side) {
			var sideLimits = this.limits[side];

			if (sideLimits === undefined) {
				return false;
			}

			var len = sideLimits.length;

			if (len <= index) {
				return false;
			}

			var limit = sideLimits[index];

			libD.freeIndex(sideLimits, index);

			// we determine the new limit
			if (limit === this.areaLimit[side]) {
				for (var newLimit = null, i = 0; i < len; ++i) {
					if (!newLimit || sideLimits[i] > newLimit) {
						newLimit = sideLimits[i];
					}
				}
				this.areaLimit[side] = newLimit;
			}

			return true;
		},

	/*
	 	Method: preferRelative
		Determine if windows should be relatively positionned (position:relative) and sized, rather than absolute. That allows the system to adapt the size and the position of a window if the area is resized. The configuration is done for each axis independently.

		Parameters:
			x - true if relative is prefered for the x axis, false if absolute is prefered. if null is given, the current configuration won"t be modified
			y - true if relative is prefered for the y axis, false if absolute is prefered. if null is given, the current configuration won"t be modified

		Notes:
			preferRelative() is equivalent to preferRelative(null, null)
			preferRelative(x) is equivalent to preferRelative(x, null)
	*/
		preferRelative: function (x, y) {
			if (x === undefined) {
				this.xPreferRelative = this.yPreferRelative = true;
			} else {
				if (x !== null) {
					this.xPreferRelative = x;
				}

				if (y !== null && y !== "undefined") {
					this.yPreferRelative = y;
				}
			}
		},

		setRealTimeResizeEvent: function (b) {
			this.realTimeResizeEvent = b;
		}
	};
	/*
	 Class: libD.WSWin
		This is the class of windows objects.
	*/
	libD.WSwin = function (ws, o) {
		if (!o) {
			o = {};
		}

		this.registeredEvents = []; // event handling

		this.dom = null; // root DOM element corresponding to the window (incuding border)

		this.content = document.createElement("div");  // content of the window

		if (o.content) {
			this.content.appendChild(o.content);
		}

		this.state = -1; // not created

		// 0: OK

		this.minimized = libD.ch(o.minimize, true);
		this.focused = false;

		this.askingForFocus = (ws.autoFocus && o.focus === undefined) || o.focus || false;
		this.ringing = false;

		this.restored = false;

		this.jsError = null;
		this.errno = -1;
		/*
			-1: no error
			0: unknown
			1: bad child
			2: bad window
			3: bad system
			4: bad WM
		*/

		this.top = libD.ch(o.top, null);
		this.left = libD.ch(o.left, null);
		this.right = libD.ch(o.right, null);
		this.bottom = libD.ch(o.bottom, null);

		this.xPreferRelative = o.preferRelative || o.xPreferRelative || typeof this.left === "string" || typeof this.right === "string" || ws.xPreferRelative;
		this.yPreferRelative = o.preferRelative || o.yPreferRelative || typeof this.top === "string" || typeof this.bottom === "string" || ws.yPreferRelative;

		this.width = libD.ch(o.width, null);
		this.height = libD.ch(o.height, null);
		this.minHeight = o.minHeight || 0;
		this.minWidth = o.minWidth || 0;
		this.maxHeight = libD.ch(o.maxHeight, null);
		this.maxWidth = libD.ch(o.maxWidth, null);

		this.closable = libD.ch(o.closeable, true);
		this.resizable = libD.ch(o.resizable, true);
		this.minimizable = libD.ch(o.minimizable, true);
		this.maximizable = libD.ch(o.maximizable, true);
		this.decoration = libD.ch(o.decoration, true); // activer les décorations
		this.sticky = o.sticky || false; // sur tous les bureaux
		this.iconifiable = libD.ch(o.iconifiable, true); // apparait dans la taskbar
		this.fullscreen = o.fullscreen || false;
		this.type = o.type || "normal";

		/*
			normal
			panel
			dialog
			tooltip
			popup-menu
			dropdown-menu
			splash
		*/

		this.centeredX = o.center || o.centerX || false;
		this.centeredY = o.center || o.centerY || false;

      this.colorsAuto = o.colorsAuto || false;

		this.iconifier = null;

		this.workplace = libD.ch(o.workplace, ws.currentWorkplace);

		this.title = o.title || "";
		this.icon = o.icon || ws.defaultIcon;

		this.alwaysOnTop = o.alwaysOnTop || false;
		this.alwaysBeneath = o.alwaysBeneath || false;

		//FIXME:bad name
		this.preventClosing = o.preventClosing || null; // empêche la fermeture de la fenêtre, fonction à appeler avant de fermer la fenêtre, fonction qui donne son feux vert.
		this.preventClosingTimer = null; // le timer qui fixe une limite à cette fonction en cas de non-réponse de l"appli

		this.movable = libD.ch(o.movable, true);
		this.ws = ws;

		this.realTimeResizeEvent = ws.realTimeResizeEvent;

		libD.setListenerSystem(this, libD.WSwin.prototype);

		if (o.show) {
			this.show();
		}
	};

	libD.WSwin.prototype = {
		/* Method: setPosFromDOM
			Guess windows properties from it"s actual position and size in the browser.

		Note:
			Useful for windows managers that want to allow the user to resize or move the window graphically. Once resizing or positioning is done, this method can be called to set width, height, top, bottom, left, right properties of the window in the best maneer possible. Will take in account what properties were set before the movement and if they values were relative or absolute to set these properties accordingly. E.g. if the position of the window on the x-axis was set with the "right" property with a relative value, the new position will be described the same maneer.
		*/
		setPosFromDOM: function () {
			if (this.width !== null) {
				if (this.ws && this.ws.wm && this.ws.wm.width) {
					this.ws.wm.width(this, this.width);
				} else if (typeof this.width === "string") {
					this.dom.style.width = this.width;
				} else {
					this.dom.style.width = this.width + "px";
				}
			}

			if (this.height !== null) {
				if (this.ws && this.ws.wm && this.ws.wm.height) {
					this.ws.wm.height(this, this.height);
				} else if (typeof this.height === "string") {
					this.dom.style.height = this.height;
				} else {
					this.dom.style.height = this.height + "px";
				}
			}

			if (this.centeredX) {
				if (this.left === null) {
					this.left = this.ws.area.clientWidth / 2 - libD.width(this.dom) / 2 + libD.scrollLeft(this.ws.area, this.fixed());
				}

				this.dom.style.left = this.left + "px";
			} else {
				if (this.left === null && this.right === null) {
					this.dom.style.left = this.ws.nextPos[0] + "px";
				} else if (this.right === null) {
					if (typeof this.left === "string") {
						this.dom.style.left = this.left;
					} else {
						this.dom.style.left = this.left + "px";
					}
					this.dom.style.right = "auto";
				}

				if (this.bottom !== null) {
					if (typeof this.bottom === "string") {
						this.dom.style.bottom = this.bottom;
					} else {
						this.dom.style.bottom = this.bottom + "px";
					}
					this.dom.style.top = "auto";
				}
			}

			if (this.centeredY) {
				if (this.top === null) {
					this.top = this.ws.area.clientHeight / 2 - libD.height(this.dom) / 2 + libD.scrollTop(this.ws.area, this.fixed());
				}
				this.dom.style.top = this.top + "px";
			} else {
				if (this.top === null && this.bottom === null) {
					this.dom.style.top = this.ws.nextPos[1] + "px";
				} else if (this.bottom === null) {
					if (typeof this.top === "string") {
						this.dom.style.top = this.top;
					} else {
						this.dom.style.top = this.top + "px";
					}
					this.dom.style.bottom = "auto";
				}

				if (this.right !== null) {
					if (typeof this.right === "string") {
						this.dom.style.right = this.right;
					} else {
						this.dom.style.right = this.right + "px";
					}
					this.dom.style.left = "auto";
				}
			}
		},
		/*
			Method: init
			inits the window object.
		*/
		init: function () {
			if (this.ws.wm === null) {
				if (this.dom !== null) {
					try {
						this.ws.area.removeChild(this.dom);
					} catch (e) {}
				}

				this.dom = document.createElement("div");
				this.dom.style.display = this.minimized ? "none" : "block";
				this.dom.style.position = "absolute";

				if (this.fullscreen) {
					this.dom.style.left = 0;
					this.dom.style.top = 0;
					this.dom.style.right = 0;
					this.dom.style.bottom = 0;

				} else if (this.maximizeWidth && this.maximizeHeight) {
					this.dom.style.left = this.ws.offsetLeft + "px";
					this.dom.style.top = this.ws.offsetTop + "px";
					this.dom.style.right = this.ws.offsetRight + "px";
					this.dom.style.bottom = this.ws.offsetBottom + "px";
				} else {
					this.setPosFromDOM();
				}

				this.dom.appendChild(this.content);
			} else {
				if (typeof this.ws.wm.createWindow === "function") {
					this.dom = this.ws.wm.createWindow(this);
				}

				if (!this.dom) {
					this.ws._wmFailed(this);
				}

				if (this.ws.wm.redraw) {
					setTimeout(this.ws.wm.redraw, 0, this);
				}
			}

			this.dom._libDWSWin = this;
			this.ws.addWin(this);

			if (this.ws.workplaces[this.workplace].activeWindow === null) {
				this.ws.focus(this);
			}

			this.state = 0;

			if (this.askingForFocus) {
				this.focus();
			}

			if (!this.minimized) {
				this.dispatchEvent("show");
			}

			return true;
		},

		/*
			Method: dispatchEvent
			fires an event. Third party scripts should never call this function and forward-compatibity is not yet decided.
			Parameter:
			e - the name of the event to fire.
		*/

		dispatchEvent: function (e, arg) {
			if (arg === undefined) {
				this.emit(e);
				this.emit("all");
			} else {
				this.emit(e, arg);
				this.emit("all", arg);
			}
		},

	/*
		Method: show
		Display the window.
		Parameter:
			focus - if true, set the focus on this window.
	*/
		show: function (focus) {
			var len = this.ws.wl.length;
			if (this.state === -1) {
				// window not created
				this.askingForFocus = true;
				this.init();
				++len;
			} else {
				if (this.ws.wl[len - 1] !== this && (arguments[1] === undefined || arguments[1])) {
					for (var i = this.ws.wl.indexOf(this), wl = this.ws.wl, wsWin; i < len - 1; ++i) {
						wsWin = wl[i] = this.ws.wl[i + 1];
						wsWin.dom.style.zIndex = this.ws.zIndexMin + (wsWin.alwaysOnTop ? 2000 : (wsWin.alwaysBeneath ? 0 : 1000)) + i - 1;
						//FIXME: 1000 is an hard coded limit
					}

					wl[i] = this;

					if (this.ws.onBack === this) {
						this.ws.onBack = null;
					}
				}

				if (this.focused || this.askingForFocus || focus) {
					this.focus();
				}
			}

			this.dispatchEvent("show");

			this.dom.style.zIndex = this.ws.zIndexMin + (
				this.alwaysOnTop
					? 2000
					: (this.alwaysBeneath ? 0 : 1000)
			) + len - 1;
			//FIXME: 1000 is an hard coded limit

			if (this.minimized) {
				if (this.ws.wm === null || this.ws.wm.show === undefined) {
					this.dom.style.display = "block";
				} else {
					this.ws.wm.show(this);
				}

				this.minimized = false;
			}
		},
		/*
			Method: reallyClose
			Close the window (like killing it) without bothering with the preventClosing mechanism. Please consider using the <libD.WSWin.close> method instead.
		*/
		reallyClose: function () {
			this.dispatchEvent("close");
			this.ws.closeWin(this);
			this.ws = null;
			setTimeout(libD.destroy, 50, this, false);
		},

		close: function (closeStage) {
		/*
			closeStage Values:
			0: like SIGTERM on POSIX-compliant systems: will send a signal asking to close andlet the application behind the window to do its stuffs before closing the window.
			1: same but a timeout is set: the window will be forced to close (with the reallyClose method) after
			2: preventClosing + immediatly close: SIGKILL
		*/
			var close = true;
			if (!closeStage) {
				closeStage = 0;
			}

			if (this.preventClosing && !this.preventClosing.call(this.preventClosingContext || window)) {
				// we call preventClosing if exists, check the return value.
				close = false;
			}

			if (close || closeStage === 2) {
				 // preventClosing is ok to close, so we actually close the window
				if (this.ws.wm && this.ws.wm.close) {
					var T = this.ws.wm.close(this);
					if (typeof T === "number") {
						var that = this;
						setTimeout(
							function () {
								that.reallyClose();
							}, T);
						return;
					}
				}
				this.reallyClose();
			} else if (closeStage === 1) {
				// the user wants to quit the window anyway, so we ask the window manager
				if (this.ws.wm && this.ws.wm.forceClosing !== null && this.preventClosingTimer === null) {
					this.preventClosingTimer = setTimeout(libD.WS.wm.forceClosing, this.ws.preventClosingTimeout, this);
				}
				this.dispatchEvent("preventClosing");
			}
		},

		/*
			Method: setPreventClosing
			Set the function that will be called when the user wants to quit the window
			Parameter:
				f - the function
			Note:
				FIXME
		*/
		setPreventClosing: function (f) {
			this.preventClosing = f;
		},

		setFullscreen: function (b) {
			if (b === undefined) {
				b = true;
			}

			if (b) {
				if (this.state === 0) {
					if (this.ws.wm === null || this.ws.wm.fullscreen === undefined) {
						this.dom.style.left = 0;
						this.dom.style.right = 0;
						this.dom.style.bottom = 0;
						this.dom.style.top = 0;
						this.dom.style.width = "auto";
						this.dom.style.height = "auto";
					} else {
						this.ws.wm.fullscreen(this, true);
					}
					this.dispatchEvent("fullscreen", true);
				}
				this.fullscreen = true;
			} else {
				if (this.ws.wm === null || this.ws.wm.fullscreen === undefined) {
					this.setPosFromDOM();
				} else {
					this.ws.wm.fullscreen(this, false);
				}
				this.dispatchEvent("fullscreen", false);
				this.fullscreen = false;
			}
		},

		ring: function () { //FIXME
			if (this.ws.wm === null || this.ws.wm.ring === undefined) {
				if (!this.focused) {
					this.show(); // FIXME handle events
					this.focus();
				}
			} else {
				this.ws.wm.ring(this);
			}

			this.ringing = true;
			this.dispatchEvent("ring");
		},

		stopRinging: function () {
			if (this.ws.wm && this.ws.wm.stopRinging) {
				this.ws.wm.stopRinging(this);
			}

			this.ringing = false;
			this.dispatchEvent("ring");
		},

		focus: function () {
			this.ws.focus(this);
		},

		_backMoveUp: function (i) {
			if (!i) {
				return;
			}

			var wl = this.ws.wl, curW = wl[i];

			if (wl[i - 1] && (curW === this || curW === null)) {
				wl[i] = wl[i - 1];
				wl[i - 1] = null;
			}

			this._backMoveUp(i - 1);
		},

		_back: function () {
			this.dispatchEvent("back");
			this.ws.fixZIndexes();
		},

		toBeneath: function () {
			if (!this.alwaysOnTop && this.ws.onBack !== this) {
				if (this.ws.wm && this.ws.wm.onBack) {
					var Ta = this.ws.wm.onBack(this);
				}

				var len = this.ws.wl.length;

				this._backMoveUp(len - 1);
				this.ws.wl[0] = this;

				this.ws.onBack = this;
				if (typeof Ta === "number" && Ta) {
					var that = this;
					setTimeout(that._back, Ta);
				} else {
					this._back();
				}
			}

		},

		minimize: function () {
			if (this.minimizable) {
				if (this.ws.wm === null || this.ws.wm.minimize === undefined) {
					this.dom.style.display = "none";
				} else {
					this.ws.wm.minimize(this);
				}
				this.dispatchEvent("minimize");
				this.minimized = true;
				this.ws.blur(this);
			}
		},

		_maximize: function (W, width, height) { // FIXME
			if (height && width) {
				W.dispatchEvent("maximize", "both");
			} else {
				W.dispatchEvent("maximize", height ? "height" : "width");
			}

			if (height) {
				var limitBottom = W.ws.areaLimit.bottom - libD.scrollTop(W.ws.area, W.fixed());
				var limitTop = Math.max(libD.scrollTop(W.ws.area, W.fixed()), W.ws.areaLimit.top);

				W.dom.style.top = limitTop + "px";
				W.dom.style.bottom = limitBottom + "px";
				W.dom.style.height = "auto";
			}

			if (width) {
				var limitRight = W.ws.areaLimit.right - libD.scrollLeft(W.ws.area, W.fixed());
				var limitLeft = Math.max(libD.scrollLeft(W.ws.area, W.fixed()), W.ws.areaLimit.left);

				W.dom.style.left = limitLeft + "px";
				W.dom.style.right = limitRight + "px";
				W.dom.style.width = "auto";
			}
		},

		maximize: function (side) {
			//optional
			var height = false,
			    width = false,
			    ownMax = true;

			if (side !== "width") {
				height = this.maximizedHeight = true;
			}

			if (side !== "height") {
				width = this.maximizedWidth = true;
			}

			if (this.ws.wm && this.ws.wm.maximize) {
				ownMax = this.ws.wm.maximize(this, width && height ? "both" : side);
			}

			if (ownMax) {
				setTimeout(this._maximize, ownMax, this, width, height);
			}
		},

		_restored: function (that) {
			that.dispatchEvent("restore", "both");
		},

		_Restore: function (that) {
			if (!that) {
				that = this;
			}

			that.setPosFromDOM();
			setTimeout(that._restored, 500, that); //FIXME hack
		},

		restore: function () {
			this.maximizedHeight = this.maximizedWidth = false;

			var ret;

			if (this.ws.wm && this.ws.wm.restore && (ret = this.ws.wm.restore(this))) {
				if (typeof ret === "number") {
					setTimeout(this._Restore, ret, this);
				} else {
					this._Restore();
				}
			} else {
				this._Restore();
			}
		},

		setDecoration: function (b) {
			if (b !== this.decoration) {
				this.decoration = b;
				if (this.ws.wm && this.ws.wm.setDecoration) {
					this.ws.wm.setDecoration(this);
				}

				this.dispatchEvent("decoration");
			}
		},

		setTop: function (n) {
			n = libD.checkNumber(n);
			if (n === null) {
				return false;
			}

			if (this.state === 0) {
				this.dom.style.bottom = "auto";
				this.dom.style.top = n + (typeof n === "string" ? "" : "px");
			}

			this.top = n;
			this.bottom = null;
			this.dispatchEvent("move");
			this.centeredY = false;
			return true;
		},

		setLeft: function (n) {

			n = libD.checkNumber(n);

			if (n === null) {
				return false;
			}

			if (this.state === 0) {
				this.dom.style.right = "auto";
				this.dom.style.left = n + (typeof n === "string" ? "" : "px");
			}

			this.left = n;
			this.right = null;
			this.dispatchEvent("move");
			this.centeredX = false;

			return true;
		},

		setRight: function (n) {
			n = libD.checkNumber(n);

			if (n === null) {
				return false;
			}

			if (this.state === 0) {
				this.dom.style.left = "auto";
				this.dom.style.right = n + (typeof n === "string" ? "" : "px");
			}

			this.left = null;
			this.right = n;
			this.dispatchEvent("move");
			this.centeredX = false;
			return true;
		},

		setBottom: function (n) {
			n = libD.checkNumber(n);

			if (n === null) {
				return false;
			}

			if (this.state === 0) {
				this.dom.style.top = "auto";
				this.dom.style.bottom = n + (typeof n === "string" ? "" : "px");
			}

			this.bottom = n;
			this.top = null;
			this.dispatchEvent("move");
			this.centeredY = false;

			return true;
		},

		setHeight: function (n) {
			n = libD.checkNumber(n);

			if (n === null) {
				return false;
			}

			if (this.state === 0) {
				if (this.ws && this.ws.wm && this.ws.wm.height) {
					this.ws.wm.height(this, n);
				} else {
					this.dom.style.height = n + (typeof n === "string" ? "" : "px");
				}
			}

			this.height = n;

			if (this.centeredX) {
				this.centerY();
			}

			this.dispatchEvent("resize");

		},

		setWidth: function (n) {
			n = libD.checkNumber(n);

			if (n === null) {
				return false;
			}

			if (!this.state) {
				if (this.ws && this.ws.wm && this.ws.wm.width) {
					this.ws.wm.width(this, n);
				} else {
					this.dom.style.width = n + (typeof n === "string" ? "" : "px");
				}
			}

			this.width = n;

			if (this.centeredX) {
				this.centerX();
			}

			this.dispatchEvent("resize");
		},

		setType: function (s) {
			if (!s) {
				return false;
			}

			if (this.ws.wm && this.ws.wm.type) {
				this.ws.wm.type(s);
			}

			this.type = s;
			this.dispatchEvent("typeChange");
			return true;
		},

		getTop: function () {
			if (this.dom.offsetTop !== undefined) {
				if (arguments[0] !== undefined && arguments[0]) {
					return this.dom.offsetTop / libD.height(this.ws);
				}

				return this.dom.offsetTop;
			}

			this.errno = 2;
			this.ws.error(this);

			return false;
		},

		getLeft: function (relativeToArea) {
			if (this.dom.offsetLeft !== undefined) {
				if (relativeToArea) {
					return this.dom.offsetLeft / this.ws.area.clientWidth;
				}
				return this.dom.offsetLeft;
			}

			this.errno = 2;
			this.ws.error(this);

			return false;
		},

		getBottom: function (relativeToArea) {
			if (this.dom.offsetTop !== undefined) {
				var areaH = this.ws.area.clientHeight;

				if (areaH !== false) {
					return (
						areaH - this.dom.offsetTop - libD.height(this.dom)
					) / (relativeToArea ? 1 : areaH);
				}

				this.errno = 3;
				return false;
			}

			this.errno = 2;
			this.ws.error(this);

			return false;
		},

		updateCoords: function () { //FIXME: aucune gestion des margins des fenetres
			this.centeredX = this.centeredY = false;
			var posUpdated = false;
			var sizeUpdated = false;
			this.maximizedWidth = false;
			this.maximizedHeight = false;
			var newWidth = libD.width(this.dom);

			if (typeof this.width === "string") {
				newWidth = newWidth / this.ws.area.clientWidth * 100 + "%";
				if (newWidth !== this.width) {
					this.width = newWidth;
					sizeUpdated = true;
					this.dom.style.width = this.width;
				}
			} else if (newWidth !== this.width) {
				this.width = newWidth;
				sizeUpdated = true;
				this.dom.style.width = this.width + "px";
			}

			var newHeight = libD.height(this.dom);
			if (typeof this.height === "string") {
				newHeight = newHeight / this.ws.area.clientHeight * 100 + "%";
				if (newHeight !== this.height) {
					this.height = newHeight;
					sizeUpdated = true;
					this.dom.style.height = this.height;
				}
			} else if (newHeight !== this.height) {
					this.height = newHeight;
					sizeUpdated = true;
					this.dom.style.height = this.height + "px";
			}

			if (sizeUpdated) {
				this.dispatchEvent("resize");
			}

			if (this.right === null) {
				if (this.xPreferRelative) {
					var newLeft = this.dom.offsetLeft / this.ws.area.clientWidth * 100 + "%";
					if (newLeft !== this.left) {
						this.left = newLeft;
						posUpdated = true;
					}
					this.dom.style.left = this.left;
				} else if (this.dom.offsetLeft !== this.left) {
					this.left = this.dom.offsetLeft;
					posUpdated = true;
					this.dom.style.left = this.left + "px";
				}
				this.dom.style.right = "auto";
			} else {
				var widthArea = this.ws.area.clientWidth,
				    newRight = (widthArea - (this.dom.offsetLeft + this.dom.offsetWidth));

				if (this.xPreferRelative) {
					newRight = (newRight / widthArea) * 100 + "%";
					if (newRight !== this.right) {
						this.right = newRight;
						posUpdated = true;
					}
					this.dom.style.right = this.right;
				} else {
					if (newRight !== this.right) {
						this.right = newRight;
						posUpdated = true;
					}
					this.dom.style.right = this.right + "px";
				}
				this.dom.style.left = "auto";
			}

			if (this.bottom === null) {
				if (this.yPreferRelative) {
					var newTop = this.dom.offsetTop / this.ws.area.clientHeight * 100 + "%";
					if (newTop !== this.top) {
						this.top = newTop;
						posUpdated = true;
					}
					this.dom.style.top = this.top;
				} else {
					if (this.dom.offsetTop !== this.top) {
						this.top = this.dom.offsetTop;
						posUpdated = true;
					}
					this.dom.style.top = this.top + "px";
				}
				this.dom.style.bottom = "auto";
			} else {
				var heightArea = this.ws.area.clientHeight;
				var newBottom = (heightArea - (this.dom.offsetTop + this.dom.offsetHeight)) / (
					this.yPreferRelative
						? heightArea * 100 + "%"
						: 1
				);

				if (newBottom !== this.bottom) {
					this.bottom = newBottom;
					posUpdated = true;
				}

				this.dom.style.bottom = this.bottom + (this.yPreferRelative ? "" : "px");

				this.dom.style.top = "auto";
			}

			if (posUpdated) {
				this.dispatchEvent("move");
			}
		},

		getRight: function (relativeToArea) {
			if (this.dom.offsetLeft !== undefined) {
				var areaW = this.ws.area.clientWidth;
				if (areaW !== false) {
					return (
						areaW - this.dom.offsetLeft - libD.width(this.dom)
					) / (relativeToArea ? 1 : areaW);
				}

				this.errno = 3;
				this.ws.error(this);
				return false;
			}

			this.errno = 2;
			this.ws.error(this);
			return false;
		},

		getContentTop: function (relativeToArea) {
			if (relativeToArea) {
				var areaH = this.ws.area.clientHeight;

				if (areaH !== false) {
					return (libD.top(this.content) - libD.top(this.ws.area)) / areaH;
				}

				this.errno = 3;
				this.ws.error(this);
				return false;
			}

			return libD.top(this.content) - libD.top(this.ws.area);
		},

		getContentLeft: function (relativeToArea) {
			if (relativeToArea) {
				var areaW = this.ws.area.clientWidth;

				if (areaW !== false) {
					return (libD.left(this.content) - libD.left(this.ws.area)) / this.ws.area.clientWidth;
				}

				this.errno = 3;
				this.ws.error(this);
				return false;
			}

			return libD.left(this.content) - libD.left(this.ws.area);
		},
		getContentBottom: function (relativeToArea) {
			var areaH = this.ws.area.clientHeight;

			if (areaH !== false) {
				return (
					areaH - libD.top(this.content) - libD.top(this.ws.area) - libD.height(this.content)
				) / (relativeToArea ? 1 : areaH);
			}

			this.errno = 3;
			this.ws.error(this);
			return false;
		},

		getContentRight: function (relativeToArea) {
			var areaW = this.ws.area.clientWidth;
			if (areaW !== false) {
				return (
					areaW - libD.left(this.content) - libD.left(this.ws.area) - libD.width(this.content)
				) / (relativeToArea ? 1 : areaW);
			}

			this.errno = 3;
			this.ws.error(this);
			return false;
		},

		getWidth: function () {
			return libD.width(this.dom);
		},

		getHeight: function () {
			return libD.height(this.dom);
		},

		getContentWidth: function () {
			return libD.width(this.content || this.dom);
		},

		getContentHeight: function () {
			return libD.height(this.content || this.dom);
		},

		setSticky: function (b) {
			if (this.sticky !== (this.sticky = libD.ch(!!b, true))) {
				if (this.ws.wm && this.ws.wm.sticky) {
					this.ws.wm.sticky(this);
				}

				this.dispatchEvent("sticky");
			}
		},

		isSticky: function () {
			return this.sticky;
		},

		setIconifiable: function (b) {
			if (this.iconifiable !== (this.iconifiable = libD.ch(!!b, true))) {
				if (this.ws.wm && this.ws.wm.iconifiable !== undefined) {
					this.ws.wm.iconifiable(this);
				}

				this.dispatchEvent("iconifiable");
			}
		},

		isIconifiable: function () {
			return this.iconifiable;
		},

		setIcon: function (p) {
			if (this.icon !== p) {
				if (typeof p !== "string") {
					return false;
				}

				if (this.ws.wm && this.ws.wm.setIcon) {
					this.ws.wm.setIcon(this, p = libD.getIcon(p));
				}

				this.icon = p;
				this.dispatchEvent("changeIcon");
			}
			return true;
		},

		setTitle: function (s) {
			if (this.title !== s) {
				if (typeof s !== "string") {
					return false;
				}

				if (this.ws.wm && this.ws.wm.setTitle) {
					this.ws.wm.setTitle(this, s);
				}

				this.title = s;

				this.dispatchEvent("changeTitle");
			}
			return true;
		},

		getTitle: function () {
			return this.title;
		},

		setAlwaysOnTop: function (b) {
			if (this.dom) {
				// We restablish zIndex stuff
				if (this.alwaysOnTop && !b) {
					this.dom.style.zIndex -= 1000;
				} else if (!this.alwaysOnTop && b) {
					this.dom.style.zIndex += 1000;
				}
			}
			//FIXME 1000 is an hard coded limit

			this.alwaysOnTop = b;
			if (b) {
				this.alwaysBeneath = false;
			}
		},

		setAlwaysBeneath: function (b) {
			if (this.dom) {
				// We restablish zIndex stuff
				if (this.alwaysBeneath && !b) {
					this.dom.style.zIndex += 1000;
				} else if (!this.alwaysBeneath && b) {
					this.dom.style.zIndex -= 1000;
				}
				//FIXME 1000 is an hard coded limit
			}
			this.alwaysBeneath = b;
		},

		appendChild: function (o) {
			if (this.content.appendChild === undefined) {
				this.errno = 2;
				this.ws.error(this);
			} else {
				if (this.content.appendChild(o)) {
					return true;
				}

				this.errno = 1;
				this.ws.error(this);
			}
			return false;
		},

		setWorkplace: function (n) {
			if (isNaN(n)) {
				n = parseInt(n, 10);
			}

			if (!this.ws.workplaces[n]) {
				return false;
			}

			this.ws.workplaces[this.workplace].activeWindow = this;

			if (this.ws.wm && this.ws.wm.setWorkplace) {
				this.ws.setWorkplace(this, n);
			}

			this.ws.setWindowWorkplace(this, n);
			this.workplace = n;
			this.dispatchEvent("changeWorkplace");
		},

		setWS: function (o) {
			if (o.ws !== undefined && o.ws === true) {
				if (this.ws === null || this.state === -1) {
					this.ws = o;
				} else { // FIXME: BROKEN
					if (o.wm === null) {
						var dom = null;
						if (o.wm !== null && typeof o.wm.createWindow === "function") {
							dom = o.wm.createWindow(this);
						}

						if (dom) {
							var j = 0;
							while (this.content.childNodes[j] !== undefined) { // completely broken...
								try {
									this.content.appendChild(this.content.childNodes[j]);
								} catch (e) {
									this.errno = 4;
									this.jsError = e;
									this.ws.error(this);
								}
								++j;
							}

							if (this.wm && this.ws.wm.unload !== undefined) {
								this.ws.wm.unload(this);
							}
							this.dom = dom;
						} else {
							if (o.wm !== null && o.wm.unload !== undefined) {
								o.wm.unload(dom);
							}

							if (dom.parentNode !== undefined) {
								dom.parentNode.removeChild(dom);
							}

							o._wmFailed(this);
						}

						this.ws.closeWin(this);
						this.ws = o;
					}
				}
			} else {
				this.errno = 3;
				this.ws.error(this);
				return false;
			}
			return true;
		},

		centerX: function () {
			if (this.state === 0) {
				this.dom.style.left =
					  this.ws.area.clientWidth / 2
					- libD.width(this.dom) / 2
					+ libD.scrollLeft(this.ws.area, this.fixed()) + "px";
			}

			this.centeredX = true;
		},

		centerY: function () {
			if (this.state === 0) {
				this.dom.style.top =
					 this.ws.area.clientHeight / 2
					- libD.height(this.dom) / 2
					+ libD.scrollTop(this.ws.area, this.fixed()) + "px";
			}

			this.centeredY = true;
		},

		center: function () {
			this.centerX();
			this.centerY();
			//FIXME: two events
		},

		fixed: function () {
			return this.dom ? libD.getStyle(this.dom, "position") === "fixed" : false;
		},

		setMovable: function (b) {
			this.movable = b;
		},

		isMovable: function (b) {
			this.movable = b;
		},

		setRealTimeResizeEvent: libD.WS.prototype.setRealTimeResizeEvent
	};

	libD.defaultWS = function () {
		if (libD.libDWS) {
			return libD.libDWS;
		}

		libD.libDWS = new libD.WS();
		libD.libDWS.setArea(document.body);
		if (libD.defaultWM) {
			libD.libDWS.setWM(libD.defaultWM);
		}
		return libD.libDWS;
	};

	// Will create a new window with the default window system. If it doesn"t exists, it create it.
	// winSettings is the object to pass to ws.newWin()
	// that (optional but recommended) is the object using libD.newWin. Default to libD
	// The last argument allow the user of your class to define the ws it should use.
	libD.newWin = function (winSettings, that) {
		return (
			(that && that.libDWS)
				? that.libDWS.newWin(winSettings)
				: libD.defaultWS().newWin(winSettings)
		);
	};

	libD.setDefaultWS = function (ws, self) {
		var w = (typeof self === "object") ? self : libD;

		if (ws) {
			w.libDWS = ws;
		} else {
			delete w.libDWS;
		}

		return ws;
	};

	libD.getDefaultWS = function (o) {
		return o.libDWS || libD.defaultWS();
	};

	libD.moduleLoaded("ws");
});
