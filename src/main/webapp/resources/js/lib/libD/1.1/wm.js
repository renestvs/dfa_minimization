// The first libD-compliant window manager.
/* needs core.js

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

libD.need(["fx", "sizepos", "ws", "selection", "domEssential"], function () {
	"use strict";
	function setCursor(o, c) {
		if (o.cursor !== c) {
			o.cursor = c;
		}
		return c;
	}

	libD.getCSS("", "wm");
	/* Object: libD.wm
		the libD's default window manager */
	libD.wm = {
		/* Function: libD.setTitle
			set the title of the window
			Parameters:
				wsWin - the libD.dom object
				s - the new title
		*/
		setTitle: function (wsWin, s) {
			if (wsWin._libDWMTitle) {
				wsWin._libDWMTitle.textContent = s;
				wsWin._libDWMTitle.title = s;
			}
		},

		/* Function: setIcon
			set the icon of the window
		Parameters:
			wsWin - the libD.dom object
			p - the path to the icon (as string)
		*/
		setIcon: function (wsWin, p) {
			if (wsWin._libDWMIcon) {
				wsWin._libDWMIcon.src = p;
			}
		},

		/* set the height of the window
			wsWin - the libD.dom object
			N - the new size, in pixels or percentage */
		height: function (wsWin, N) {
			wsWin.content.classList.add("fixed-size");
            wsWin.content.classList.remove("auto-size");
			wsWin.dom.style.height = typeof N === "string" ? N : N + libD.height(wsWin.dom) - libD.height(wsWin.content) + "px";
		},

		/* set the height of the window
			wsWin - the libD.dom object
			N - the new size, in pixels or percentage */
		width: function (wsWin, N) {
			wsWin.dom.style.width = typeof N === "string" ? N : N + libD.width(wsWin.dom) - libD.width(wsWin.content) + "px";
		},

		/* the window will be shown in fullscreen */
		fullscreen: function (wsWin, b) {
			if (b) {
				libD.replaceClass(wsWin.dom, "decoration", "no-decoration");
				var s = wsWin.dom.style;
				s.left = 0;
				s.right = 0;
				s.bottom = 0;
				s.top = 0;
				s.width = "auto";
				s.height = "auto";
				wsWin._keepAreaOverflow = wsWin.ws.area.style.overflow;
				wsWin.ws.area.style.overflow = "hidden";
			} else {
				libD.replaceClass(wsWin.dom, "no-decoration", "decoration");
				wsWin.setPosFromDOM();
				if (wsWin.maximizedWidth) {
					wsWin.dom.style.left = "0";
					wsWin.dom.style.right = "auto";
					wsWin.dom.style.width = "100%";
				}
				if (wsWin.maximizedHeight) {
					wsWin.dom.style.top = "0";
					wsWin.dom.style.bottom = "auto";
					wsWin.dom.style.height = "100%";
				}
				wsWin.ws.area.style.overflow = wsWin._keepAreaOverflow;
			}
		},

		createWindow: function (wsWin) {
			var dom = document.createElement("div");

			if (wsWin.focused) {
				dom.className = "libD-wm-window shadows active";
			} else {
				dom.className = "libD-wm-window shadows inactive";
			}

			if (wsWin.minimized) {
				dom.style.display = "none"; //permet une apparission douce
			}

			wsWin._libDWMMaxResClick = libD.wm._maxResClick.bind(window, wsWin);
			var titlebar = wsWin._libDWMtb = document.createElement("div");
			titlebar.className = "libD-wm-titlebar libD-wm-handle";
			titlebar.ondblclick = wsWin._libDWMMaxResClick;

			if (wsWin.decoration) {
				dom.className += " decoration";
			} else {
				dom.className += " no-decoration";
			}

			var icon = document.createElement("img");

			icon.src = wsWin.icon;

			icon.alt = "";
			icon.className = "libD-wm-icon";

			var titlebarSpace = wsWin._libDWMtbarea = document.createElement("div");
			titlebarSpace.className = "libD-wm-titlebar-space libD-wm-handle";

			var title = wsWin._libDWMTitle = document.createElement("div");
			title.className = "libD-wm-title libD-wm-handle";

			titlebarSpace.appendChild(title);

			libD.allowSelection(title, false);

			wsWin._libDWMTitle = title;
			wsWin._libDWMIcon = icon;

			var min = document.createElement("a");
			min.className = "libD-wm-min";
			min.onmousedown = libD.wm._cancelEvt.bind(window, wsWin);
			min.onclick = libD.wm._minClick.bind(window, wsWin);
			if (!wsWin.minimizable) {
				min.style.display = "none";
			}
			var res = document.createElement("a");

			if (!wsWin.maximizable) {
				res.style.display = "none";
			}

			if (wsWin.maximizedHeight && wsWin.maximizedWidth) {
				res.className = "libD-wm-restore";
			} else {
				res.className = "libD-wm-max";
			}

			res.onclick = wsWin._libDWMMaxResClick;
			res.onmousedown = min.onmousedown;

			if (!wsWin.resizable) {
				res.style.display = "none";
			}

			wsWin._libDWMRes = res;
			var close = document.createElement("a");
			close.className = "libD-wm-close";

			if (!wsWin.closable) {
				close.style.display = "none";
			}

			close.onmousedown = min.onmousedown;
			close.onclick = libD.wm._closeClick.bind(window, wsWin);

			min.textContent = "_";
			libD.wm.setTitle(wsWin, wsWin.title);
			res.textContent = "+";
			close.textContent = "×";

			libD.allowSelection(titlebar, false);

			titlebar.appendChild(icon);
			titlebar.appendChild(titlebarSpace);
			titlebar.appendChild(min);
			titlebar.appendChild(res);
			titlebar.appendChild(close);

			var resizeLeft = document.createElement("div");
			var resizeRight = document.createElement("div");
			var resizeBottom = document.createElement("div");
			resizeLeft.className = "libD-wm-resize libD-wm-resize-left";
			resizeRight.className = "libD-wm-resize libD-wm-resize-right";
			resizeBottom.className = "libD-wm-resize libD-wm-resize-bottom";

			libD.wm.handleSurface(wsWin, resizeLeft);
			libD.wm.handleSurface(wsWin, resizeRight);
			libD.wm.handleSurface(wsWin, resizeBottom);

			if (wsWin.height === null || wsWin.width === null) {
				wsWin.content.className = "libD-wm-content auto-size";
			} else {
				wsWin.content.className = "libD-wm-content fixed-size";
			}

			if (wsWin.colorsAuto) {
                wsWin.content.classList.add("libD-ws-colors-auto");
            }

			libD.allowSelection(resizeLeft, false);
			libD.allowSelection(resizeRight, false);
			libD.allowSelection(resizeBottom, false);

			if (wsWin.height !== null) {
				dom.style.height = (typeof wsWin.height === "string") ? wsWin.height : wsWin.height + "px";
			}

			if (wsWin.width !== null) {
				dom.style.width = (typeof wsWin.width === "string") ? wsWin.width : wsWin.width + "px";
			}

			dom.appendChild(titlebar);
			dom.appendChild(resizeLeft);
			dom.appendChild(resizeRight);
			dom.appendChild(resizeBottom);
			dom.appendChild(wsWin.content);

			if (wsWin.top === null) {
				if (wsWin.bottom !== null) {
					dom.style.bottom = typeof wsWin.bottom === "string" ? wsWin.bottom : wsWin.bottom + "px";
				}
			} else {
				dom.style.top = typeof wsWin.top === "string" ? wsWin.top : wsWin.top + "px";
			}

			if (wsWin.left === null) {
				if (wsWin.right !== null) {
					dom.style.right = typeof wsWin.right === "string" ? wsWin.right : wsWin.right + "px";
				}
			} else {
				dom.style.left = typeof wsWin.left === "string" ? wsWin.left : wsWin.left + "px";
			}

			wsWin._libDWMMousemove = libD.wm._mousemove.bind(window, wsWin);
			wsWin._libDWMMousedown = libD.wm._mousedown.bind(window, wsWin);

			wsWin._libDWMContentMouseover = libD.wm._contentMouseover.bind(window, wsWin);
			wsWin._libDWMContentMouseout = libD.wm._contentMouseout.bind(window, wsWin);
			wsWin._libDWMState = 0;
			wsWin.content.onmouseover = wsWin._libDWMContentMouseover;
			wsWin.content.onmouseout = wsWin._libDWMContentMouseout;

			libD.wm.handleSurface(wsWin, dom);

			setTimeout(
				function () {
					wsWin.setPosFromDOM();
				}, 0);

			return dom;
		},

		show: function (wsWin) {
			wsWin.dom.style.display = "block";
			libD.showSmoothly(wsWin.dom, 200);
		},

		icon: function (wsWin) {
			wsWin.dom.firstChild.firstChild.src = wsWin.icon;
		},

		title: function (wsWin) {
			wsWin._libDWMTitle.textContent = wsWin.title;
		},

		close: function (wsWin) {
			libD.wm._removeShadows(wsWin.ws.wl);

			libD.hideSmoothly(wsWin.dom, {
				deleteNode: false,
				time: 250
			});

			setTimeout(libD.wm._restoreShadows, 300, wsWin.ws.wl);

			if (wsWin._libDWMTitle.parentNode) {
				wsWin._libDWMTitle.parentNode.removeChild(wsWin._libDWMTitle);
			}

			return 300;
		},

		maximize: function (wsWin, o) {
			wsWin._libDWMblockMaxRes = true;
			var t = libD.wm.Effects.maximize(wsWin, o);

			wsWin._libDWMRes.className = "libD-wm-restore";
			wsWin.dom.classList.add("libD-wm-maximized");
			setTimeout(
				function () {
					wsWin._libDWMblockMaxRes = false;
				}, t);
			return t;
		},

		/*eslint-disable no-unused-vars*/
		minimize: function (wsWin, o) {
			libD.hideSmoothly(wsWin.dom, {
				deleteNode:false,
				time: 150
			});
		},
		/*eslint-enable no-unused-vars*/

		restore: function (wsWin) {
			wsWin._libDWMblockMaxRes = true;
			var t = libD.wm.Effects.restore(wsWin);

			wsWin._libDWMRes.className = "libD-wm-max";
			wsWin.dom.classList.remove("libD-wm-maximized");

			setTimeout(
				function () {
					wsWin._libDWMblockMaxRes = false;
				}, t);

			return t;
		},

		focus: function (wsWin) {
			wsWin.dom.className = wsWin.dom.className.replace("inactive", "active");
		},

		blur: function (wsWin) {
			wsWin.dom.className = wsWin.dom.className.replace("active", "inactive");
		},

		getDecorationArea: function (wsWin) {
			if (!wsWin.dom) {
				wsWin.init();
			}

			try {
				wsWin._libDWMtbarea.removeChild(wsWin._libDWMTitle);
			} catch (e) {}

			if (wsWin._libDWMTitle) {
				wsWin._libDWMTitle.classList.add("libD-wm-title-embeded");
			}

			return wsWin._libDWMtbarea;
		},

		releaseDecorationArea: function (wsWin) {
			libD.emptyNode(wsWin._libDWMtbarea);
			wsWin._libDWMTitle.classList.remove("libD-wm-title-embeded");
			wsWin._libDWMtbarea.appendChild(wsWin._libDWMTitle);
		},

		setDecorationAreaHeight: function (wsWin, height, keepIfLower) {
			if (typeof height !== "number") {
				if (libD.strToPx) {
					height = libD.strToPx(height, wsWin.content, "height");
				} else {
					libD.error("libD.wm needs libD's numbers module if you use numbers with units");
					return false;
				}
			}
			var tbH = libD.height(wsWin._libDWMtbarea);

			if (keepIfLower === undefined) {
				keepIfLower = true;
			}

			if (keepIfLower && height < tbH) {
				return true;
			}

			var newTitlebarHeight = height + libD.height(wsWin._libDWMtb) - libD.height(wsWin._libDWMtbarea);
			wsWin._libDWMtb.style.height = newTitlebarHeight + "px";
			wsWin.content.style.top = newTitlebarHeight + libD.outerHeight(wsWin._libDWMtb) + "px";
			return true;
		},

		/*eslint-disable no-unused-vars*/
		getTitleElement: function (wsWin, height) {
			return wsWin._libDWMTitle;
		},
		/*eslint-enable no-unused-vars*/

		titleDisplayBlock: function (wsWin, b) {
			b = b === undefined ? true : b;
			if (b) {
				wsWin._libDWMTitle.classList.add("libD-wm-title-block");
			} else {
				wsWin._libDWMTitle.classList.remove("libD-wm-title-block");
			}
		},

		/*eslint-disable no-unused-vars*/
		handleSurface: function (wsWin, s, action) {
			// action is one of: auto, move, n-resize, w-resize, n-resize,
			// s-resize, sw-resize, se-resize, nw-resize, ne-resize.
			// not supported by libD.wm.
			s.classList.add("libD-wm-handle");
			s.addEventListener("mousemove", wsWin._libDWMMousemove, false);
			s.addEventListener("mousedown", wsWin._libDWMMousedown, false);
			s.addEventListener("dblclick", wsWin._libDWMMaxResClick, false);
		},

		releaseSurface: function (wsWin, s, action) {// specifying action in the API might be inconsistant.
			s.classList.remove("libD-wm-handle");
			s.removeEventListener("mousemove", wsWin._libDWMMousemove, false);
			s.removeEventListener("mousedown", wsWin._libDWMMousedown, false);
			s.removeEventListener("dblclick", wsWin._libDWMMaxResClick, false);
		},
		/*eslint-enable no-unused-vars*/

		hideIcon: function (wsWin) {
			wsWin.dom.classList.add("icon-hide");
		},

		showIcon: function (wsWin) {
			wsWin.dom.classList.remove("icon-hide");
		},

		setDecoration: function (wsWin) {
			if (wsWin.decoration) {
				wsWin.dom.classList.remove("no-decoration");
				wsWin.dom.classList.add("decoration");
			} else {
				wsWin.dom.classList.remove("decoration");
				wsWin.dom.classList.add("no-decoration");
			}
		},
	// Internal Functions

		_wmElem: function (o) {
			if (o.className === undefined) {
				o = o.parentNode;
			}

			return o.classList.contains("libD-wm-handle");
		},

		_opacity: function (wsWin, o) {
			wsWin.dom.style.opacity = o;
		},

		_contentMouseover: function (wsWin) {
			wsWin.dom.onmousemove = null;
			wsWin.dom.onmousemove = null;

			if (wsWin._libDWMState !== 0) {
				wsWin.dom.style.cursor = "default";
				wsWin._libDWMState = 0;
			}
		},

		_contentMouseout: function (wsWin) {
			wsWin.dom.onmousemove = wsWin._libDWMMousemove;
		},

		_winMove: function (wsWin, offsetX, offsetY, x, y) {
			var pos = wsWin._libDWMPos;

			if (wsWin._libDWMblockMaxRes && wsWin.maximizedHeight) {
				return;
			}

			if (!wsWin._libDWMblockMaxRes) {
				if (wsWin.maximizedHeight) {
					wsWin.restore();

					pos[0] = x - offsetX - (
						typeof wsWin.width === "number"
							? wsWin.width / 2
							: parseFloat(wsWin.width) * libD.width(wsWin.ws.area) / 200
				   );

					pos[1] = y - offsetY - 7;
					return;
				} else if (y < 10 && offsetY < 0) {
					wsWin.maximize();
					return;
				}
			}

			libD.wm._pos(wsWin, pos[0] + offsetX, pos[1] + offsetY, null, null);
		},

		_winSEresize: function (wsWin, offsetX, offsetY) {
			libD.wm._pos(wsWin, null, null, wsWin._libDWMSize[0] + offsetX, wsWin._libDWMSize[1] + offsetY);
		},

		_winSWresize: function (wsWin, offsetX, offsetY) {
			libD.wm._pos(wsWin, wsWin._libDWMPos + offsetX, null, wsWin._libDWMSize[0] - offsetX, wsWin._libDWMSize[1] + offsetY);
		},
		_winNWresize: function (wsWin, offsetX, offsetY) {
			var pos = wsWin._libDWMPos, size = wsWin._libDWMSize;
			libD.wm._pos(wsWin, pos[0] + offsetX, pos[1] + offsetY, size[0] - offsetX, size[1] - offsetY);
		},

		_winNEresize: function (wsWin, offsetX, offsetY) {
			var size = wsWin._libDWMSize;
			libD.wm._pos(wsWin, null, wsWin._libDWMPos + offsetY, wsWin._libDWMSize[0] + offsetX, size[1] - offsetY);
		},

		_winNresize: function (wsWin, offsetX, offsetY) {
			libD.wm._pos(wsWin, null, wsWin._libDWMPos + offsetY, null, wsWin._libDWMSize - offsetY);
		},

		/*eslint-disable no-unused-vars*/
		_winEresize: function (wsWin, offsetX, offsetY) {
			libD.wm._pos(wsWin, null, null, wsWin._libDWMSize + offsetX, null);
		},

		_winSresize: function (wsWin, offsetX, offsetY) {
			libD.wm._pos(wsWin, null, null, null, wsWin._libDWMSize + offsetY);
		},

		_winWresize: function (wsWin, offsetX, offsetY) {
			libD.wm._pos(wsWin, wsWin._libDWMPos + offsetX, null, wsWin._libDWMSize - offsetX, null);
		},

		/*eslint-enable no-unused-vars*/

		_createBodyEvents: function (wsWin) {
			var domWin = wsWin.dom,
			    m = wsWin._libDWMMouse,
			    ws = wsWin.ws,
			    wm = libD.wm,
			    area = ws.area,
			    wmState = wsWin._libDWMState;

			wsWin._libDWMBodyMoveCancel = false;

			var BodyMove;

			var BodyUp = function () {
				area.removeEventListener("mousemove", BodyMove, false);
				document.removeEventListener("mouseup", BodyUp, false);
				libD.allowSelection(area, true);
			};

			BodyMove = function (e) {
				if (wsWin._libDWMBodyMoveCancel) {
					return;
				}

				domWin.onmousemove = null;

				e = {clientX: e.clientX + libD.scrollLeft(null, wsWin.fixed()), clientY: e.clientY + libD.scrollTop(null, wsWin.fixed())};

				var deltaMin = wsWin.maximizedHeight ? 10 : 0;

				if (Math.abs(m.clientX - e.clientX) < deltaMin && Math.abs(m.clientY - e.clientY) < deltaMin) {
					return;
				}

				var s = domWin.style;
				s.width = libD.width(domWin) + "px";
				s.height = libD.height(domWin) + "px";
				s.left = domWin.offsetLeft + "px";
				s.top = domWin.offsetTop + "px";
				s.right = "auto";
				s.bottom = "auto";

				m.lastClientX = e.clientX;
				m.lastClientY = e.clientY;

				var L = ws.areaLimit, moveAction;

				wsWin._libDWMMaxSize = [libD.width(area) - L.left - L.right, libD.height(area) - L.top - L.bottom];


				libD.allowSelection(area, false);
				libD.allowSelection(domWin, false);

				wsWin.content.onmouseover = null;
				wsWin.content.onmouseout = null;

				area.appendChild(wm.divProtect);

				switch (wmState) {
					case 6:
					//move:
						moveAction = wm._winMove;
						wsWin._libDWMPos = [domWin.offsetLeft, domWin.offsetTop];
						wsWin._libDWMMoveMaximized = wsWin.maximizedHeight;
						break;
					case 5:
					//redimensionner Sud Est
						moveAction = wm._winSEresize;
						wsWin._libDWMSize = [libD.width(domWin), libD.height(domWin)];
						break;
					case 9:
					//redimensionner Est
						moveAction = wm._winEresize;
						wsWin._libDWMSize = libD.width(domWin);
						break;
					case 7:
					//redimensionner Sud
						moveAction = wm._winSresize;
						wsWin._libDWMSize = libD.height(domWin);
						break;
					case 1:
					//redimensionner Nord Ouest
						moveAction = wm._winNWresize;
						wsWin._libDWMPos = [domWin.offsetLeft, domWin.offsetTop];
						wsWin._libDWMSize = [libD.width(domWin), libD.height(domWin)];
						break;
					case 3:
					//redimensionner Nord
						moveAction = wm._winNresize;
						wsWin._libDWMPos = domWin.offsetTop;
						wsWin._libDWMSize = libD.height(domWin);
						break;
					case 8:
					//redimensionner Nord Ouest
						moveAction = wm._winWresize;
						wsWin._libDWMPos = domWin.offsetLeft;
						wsWin._libDWMSize = libD.width(domWin);
						break;
					case 2:
					//redimensionner Nord Est
						moveAction = wm._winNEresize;
						wsWin._libDWMPos = domWin.offsetTop;
						wsWin._libDWMSize = [libD.width(domWin), libD.height(domWin)];
						break;
					case 4:
					//redimensionner Sud Ouest
						moveAction = wm._winSWresize;
						wsWin._libDWMPos = domWin.offsetLeft;
						wsWin._libDWMSize = [libD.width(domWin), libD.height(domWin)];
				}

				var x, y, updated = false, askForRequest = true;

				var doMove = function () {
					if (updated) {
						updated = false;
						moveAction(wsWin, x - m.clientX, y - m.clientY, x, y);
						if (moveAction !== wm._winMove && wsWin.realTimeResizeEvent) {
							wsWin.dispatchEvent("resize");
						}

						if (doMove) {
							requestAnimationFrame(doMove);
						}
					} else {
						askForRequest = true;
					}
				};

				var BodyMoveContinue = function (e) {
					x = e.clientX + libD.scrollLeft(null, wsWin.fixed());
					y = e.clientY + libD.scrollTop(null, wsWin.fixed());

					updated = true;

					if (askForRequest) {
						askForRequest = false;
						libD.requestAnimationFrame(doMove);
					}

					if (e.preventDefault) {
						e.preventDefault();
					}
				};

				var BodyUpContinue = function () {
					doMove = null;
					libD.allowSelection(area, true);
					domWin.onmousemove = wsWin._libDWMMousemove;
					wsWin._libDWMMoveMaximized = false;
					wsWin.content.onmouseover = wsWin._libDWMContentMouseover;
					wsWin.content.onmouseout = wsWin._libDWMContentMouseover;
					libD.allowSelection(domWin, true);
					document.removeEventListener("mouseup", BodyUpContinue, false);
					area.removeEventListener("mousemove", BodyMoveContinue, false);
					area.removeEventListener("touchmove", BodyMoveContinue, false);
					document.removeEventListener("touchend", BodyUpContinue, false);

					if (!wsWin.maximizedHeight && !wsWin.maximizedWidth) {
						wsWin.content.classList.add("fixed-size");
                        wsWin.content.classList.remove("auto-size");
						wsWin.updateCoords();
					}

					wsWin._libDWMRes.className = "libD-wm-max";
					wm._restoreShadows(ws.wl);
					area.removeChild(wm.divProtect);
				};

				wm._removeShadows(ws.wl);
				area.removeEventListener("mousemove", BodyMove, false);
				document.removeEventListener("mouseup", BodyUp, false);
				area.removeEventListener("touchmove", BodyMove, false);
				document.removeEventListener("touchend", BodyUp, false);

				wsWin._libDWMBodyMoveCancel = true;
				area.addEventListener("mousemove", BodyMoveContinue, false);
				document.addEventListener("mouseup", BodyUpContinue, false);

				area.addEventListener("touchmove", BodyMoveContinue, false);
				document.addEventListener("touchend", BodyUpContinue, false);

				if (e.preventDefault) {
					e.preventDefault();
				}

			};

			area.addEventListener("mousemove", BodyMove, false);
			document.addEventListener("mouseup", BodyUp, false);

			area.addEventListener("touchmove", BodyMove, false);
			document.addEventListener("touchend", BodyUp, false);
			return true;
		},

		_mousedown: function (wsWin, e) {
			var clickedOnWM = true;

			if (e.altKey || e.metaKey) {
				wsWin._libDWMState = 6; // move
			} else {
				clickedOnWM = libD.wm._wmElem(e.target);
			}

			if ((!libD.wm.clickAnywhereToFocus && !clickedOnWM) || (!wsWin.movable && wsWin._libDWMState === 6)) {
				return;
			}

			if (e.button === 0) {
				wsWin.show();
				if (wsWin._libDWMState && clickedOnWM) {
					wsWin._libDWMMouse = {
						clientX: e.clientX + libD.scrollLeft(null, wsWin.fixed()),
						clientY: e.clientY + libD.scrollTop(null, wsWin.fixed())
					};
					libD.wm._createBodyEvents(wsWin);
				}
			} else if (e.buttons === 1 && clickedOnWM) {
				wsWin.toBeneath();
			}

			if (clickedOnWM) {
				e.stopPropagation();
				e.preventDefault();
			}
		},

		_mousemove: function (wsWin, e) {
			var width = libD.width(wsWin.dom),
			    height = libD.height(wsWin.dom),
			    x = e.clientX - libD.left(wsWin.dom),
			    y = e.clientY - libD.top(wsWin.dom),
			    clearTBCursor = true;

			if (y < 18) {
				if (x < 18) {
					setCursor(wsWin._libDWMtb.style, setCursor(wsWin.dom.style, "nw-resize"));
					wsWin._libDWMState = 1;
				} else if (width - x < 18) {
					setCursor(wsWin._libDWMtb.style, setCursor(wsWin.dom.style, "ne-resize"));
					wsWin._libDWMState = 2;
				} else if (y < 5) {
					setCursor(wsWin._libDWMtb.style, setCursor(wsWin.dom.style, "n-resize"));
					clearTBCursor = false;
					wsWin._libDWMState = 3;
				} else {
					wsWin._libDWMState = 6; //deplacer fenetre
					setCursor(wsWin.dom.style, "auto");
				}
			} else if (height - y < 18) {
				if (x < 18) {
					setCursor(wsWin.dom.style, "sw-resize");
					wsWin._libDWMState = 4;
				} else if (width - x < 18) {
					setCursor(wsWin.dom.style, "se-resize");
					wsWin._libDWMState = 5;
				} else if (height - y < 5) {
					setCursor(wsWin.dom.style, "s-resize");
					wsWin._libDWMState = 7;
				} else {
					setCursor(wsWin.dom.style, "auto");
					wsWin._libDWMState = 6;
				}
			} else if (x < 5) {
				setCursor(wsWin.dom.style, "w-resize");
				wsWin._libDWMState = 8;
			} else if (width - x < 5) {
				setCursor(wsWin.dom.style, "e-resize");
				wsWin._libDWMState = 9;
			} else {
				setCursor(wsWin.dom.style, "auto");
				wsWin._libDWMState = 6;
			}

			if (clearTBCursor && wsWin._libDWMtb.style.cursor) {
				wsWin._libDWMtb.style.cursor = "";
			}
		},

		_maxResClick: function (wsWin, e) {
			if (e.type === "click" || e.target.classList.contains("libD-wm-handle")) {
				if (wsWin.maximizedHeight && wsWin.maximizedWidth) {
					wsWin.restore();
				} else {
					wsWin.maximize();
				}

				libD.allowSelection(wsWin.ws.area, true);

				e.stopPropagation();
			}
		},

		_cancelEvt: function (wsWin, e) {
			e.stopPropagation();
			libD.allowSelection(wsWin.ws.area, false);
		},
		_closeClick: function (wsWin) {
			wsWin.close();
			libD.allowSelection(wsWin.ws.area, true);
		},

		_minClick: function (wsWin) {
			wsWin.minimize();
			libD.allowSelection(wsWin.ws.area, true);
		},

		_pos: function (wsWin, left, top, width, height) {
			var domWin = wsWin.dom,
			    L = wsWin.ws.areaLimit,
			    mS = wsWin._libDWMMaxSize,
			    maxWidth = mS[0],
			    maxHeight = mS[1],
			    res = wsWin.resizable,
			    s = domWin.style;

			if (width !== null && res) {
				width = Math.max(wsWin.minWidth, 75, width);
			}

			if (height !== null && res) {
				height = Math.max(wsWin.minHeight, 25, height);
			}

	/* FIXME: optimize this ?? */
			if (left !== null) {
				if (L.left !== null && left < L.left) {
					if (width) {
						s.width = width - (L.left - left) + "px";
						width = null;
					}
					s.left = L.left + "px";
				} else if (width) {
					if (L.right !== null && left + width > maxWidth + L.left) {
						if (width > maxWidth) {
							if (res) {
								s.width = maxWidth + "px";
							}
							s.left = L.left + "px";
						} else {
							if (res) {
								s.width = width + "px";
							}
							s.left = maxWidth + L.left - width + "px";
						}
						width = null;
					} else {
						s.left = left + "px";
						if (res) {
							s.width = width + "px";
						}
						width = null;
					}
				} else {
					var _w = libD.width(domWin);

					if (L.right !== null && left + _w > maxWidth + L.left && _w <= maxWidth) {
						s.left = maxWidth + L.left - _w + "px";
					} else {
						s.left = left + "px";
					}
				}
			}

			if (width !== null && res) {
				var _l = domWin.offsetLeft;
				if (L.right !== null && _l + width > maxWidth && _w <= maxWidth) {
					s.width = maxWidth - _l + "px";
				} else {
					s.width = width + "px";
				}
			}

			if (top !== null) {
				if (L.top !== null && top < L.top) {
					if (height && res) {
						s.height = height - (L.top - top) + "px";
					}

					s.top = L.top + "px";
					return;
				}

				if (height) {
					if (L.bottom !== null && top + height > maxHeight + L.top) {
						if (height > maxHeight) {
							if (res) {
								s.height = maxHeight + "px";
							}

							s.top = L.top + "px";
						} else {
							if (res) {
								s.height = height + "px";
							}

							s.top = maxHeight + L.top - height + "px";
						}
					} else {
						if (res) {
							s.height = height + "px";
						}

						s.top = top + "px";
					}
					return;
				}

				var _h = (wsWin._libDWMtb.clientHeight || wsWin._libDWMtb.offsetHeight) + wsWin._libDWMtb.offsetTop;

				if (L.bottom !== null && top + _h > maxHeight + L.top && _h <= maxHeight) {
					s.top = maxHeight + L.top - _h + "px";
				} else {
					s.top = top + "px";
				}
			}

			if (height !== null && res) {
				var _t = domWin.offsetTop;
				if (L.bottom !== null && _t + height > maxHeight && height <= maxHeight) {
					s.height = maxHeight - _t + "px";
				} else {
					s.height = height + "px";
				}
			}
		},

		_w: function (wsWin, s) {
			var m = wsWin.minWidth, M = wsWin.maxWidth;

			if (m > s || s < 75) {
				return m < 75 ? 75 : m;
			}

			if (M && M < s) {
				return M;
			}

			return s;
		},

		_h: function (wsWin, s) {
			var m = wsWin.minHeight, M = wsWin.maxHeight;
			if (m > s || s < 75) {
				return m < 75 ? 75 : m;
			}

			if (M && M < s) {
				return M;
			}

			return s;
		},

		_removeShadows: function (wl) {
			for (var i = 0, len = wl.length; i < len; ++i) {
				wl[i].dom.classList.remove("shadows");
			}
		},

		_restoreShadows: function (wl) {
			for (var i = 0, len = wl.length; i < len; ++i) {
				wl[i].dom.classList.add("shadows");
			}
		},

		Effects: {},

		clickAnywhereToFocus: true // will focus and a window is clicked. false = same behavior but jus on specialized elems (e.g title bar)
	};

	libD.wmMaximize_ = function (wsWin, o, top, left, sT, sL) {
		var s = wsWin.dom.style;
		s.MozTransitionProperty = "top, bottom, right, left, width, height";
		s.KhtmlTransitionProperty = "top bottom right left width height";
		s.OTransitionProperty = "top, bottom, right, left, width, height";
		s.transitionProperty = "top bottom right left width height";

		s.MozTransitionDuration = "300ms";
		s.webkitTransitionDuration = "300ms";
		s.OTransitionDuration = "300ms";
		s.transitionDuration = "300ms";

		s.MozTransitionTimingFunction = "ease-out";
		s.webkitTransitionTimingFunction = "ease-out";
		s.OTransitionTimingFunction = "ease-out";
		s.transitionTimingFunction = "ease-out";


		var aL = wsWin.ws.areaLimit, right = aL.right, bottom = aL.bottom;
		left = aL.left;
		top = aL.top;

		if (!left) {
			left = 0;
		}

		if (!right) {
			right = 0;
		}

		if (!top) {
			top = 0;
		}

		if (!bottom) {
			bottom = 0;
		}

		if (o !== "height") {
			s.left = left + sL + "px";
			s.right = right - sL + "px";
		}
		if (o !== "width") {
			s.top = top + sT + "px";
			s.bottom = bottom - sT + "px";
		}

		setTimeout(
			function () {
				s.transitionDuration = "0s";
				s.OTransitionDuration = "0s";
				s.webkitTransitionDuration = "0s";
				s.MozTransitionDuration = "0s";
			}, 350);
	};

	libD.wmRestore = function (wsWin) {
		var domWin = wsWin.dom, s = domWin.style, area = wsWin.ws.area, wArea = libD.width(area), hArea = libD.height(area);
		if (typeof wsWin.width === "number") {
			s.width = libD.width(domWin) + "px";
		} else {
			s.width = libD.width(domWin) / wArea * 100 + "%";
		}

		if (typeof wsWin.height === "number") {
			s.height = libD.height(domWin) + "px";
		} else {
			s.height = libD.height(domWin) / hArea * 100 + "%";
		}

		if (wsWin.right === null) {
			s.right = "auto";
		} else if (typeof wsWin.right === "number") {
			s.right = wArea - domWin.offsetLeft - domWin.offsetWidth + "px";
		} else {
			s.right = (wArea - domWin.offsetLeft - domWin.offsetWidth) / wArea * 100 + "%";
		}

		if (wsWin.left === null) {
			s.left = "auto";
		} else if (typeof wsWin.left === "number") {
			s.left = domWin.offsetLeft + "px";
		} else {
			s.left = domWin.offsetLeft / wArea * 100 + "%";
		}

		if (wsWin.top === null) {
			s.top = "auto";
		} else if (typeof wsWin.top === "number") {
			s.top = domWin.offsetTop + "px";
		} else {
			s.top = domWin.offsetTop / hArea * 100 + "%";
		}

		if (wsWin.bottom === null) {
			s.bottom = "auto";
		} else if (typeof wsWin.bottom === "number") {
			s.bottom = hArea - domWin.offsetTop - domWin.offsetHeight + "px";
		} else {
			s.bottom = hArea - domWin.offsetLeft - domWin.offsetHeight / hArea * 100 + "%";
		}

		libD.wm._removeShadows(wsWin.ws.wl);

		setTimeout(function () {
			s.MozTransitionProperty = "top, bottom, right, left, width, height";
			s.webkitTransitionProperty = "top bottom right left width height";
			s.OTransitionProperty = "top, bottom, right, left, width, height";
			s.transitionProperty = "top bottom right left width height";

			s.MozTransitionDuration = "300ms";
			s.webkitTransitionDuration = "300ms";
			s.OTransitionDuration = "300ms";
			s.transitionDuration = "300ms";

			s.MozTransitionTimingFunction = "ease-out";
			s.webkitTransitionTimingFunction = "ease-out";
			s.OTransitionTimingFunction = "ease-out";
			s.transitionTimingFunction = "ease-out";
		}, 0);

		setTimeout(function () {
			s.webkitTransitionDuration = "0s";
			s.MozTransitionDuration = "0s";
			s.OTransitionDuration = "0s";
			s.transitionDuration = "0s";
			libD.wm._restoreShadows(wsWin.ws.wl);
		}, 350);

		return 1;
	};

	libD.wmMaximize = function (wsWin, o) {
			var domWin = wsWin.dom,
			    left = domWin.offsetLeft,
			    t = domWin.offsetTop,
			    s = domWin.style,
			    f = wsWin.fixed(),
			    sT = libD.scrollTop(wsWin.ws.area, f),
			    sL = libD.scrollLeft(wsWin.ws.area, f);

			s.left = left + "px";
			s.top = t + "px";

			s.right = (libD.width(wsWin.ws.area) - left - domWin.offsetWidth) + "px";
			s.bottom = (libD.height(wsWin.ws.area) - t - domWin.offsetHeight) + "px";

			s.width = "auto";
			s.height = "auto";

			libD.wm._removeShadows(wsWin.ws.wl);

			setTimeout(libD.wmMaximize_, 0, wsWin, o, left, top, sT, sL);

			return 350;
	};

	libD.wm.Effects.maximize = libD.wmMaximize;
	libD.wm.Effects.restore = libD.wmRestore;

	(function () {
		// divProtect will protect the wm: the wm keep working even when we are out of windows" parent or over an iframe
		libD.wm.divProtect = document.createElement("div");

		var s = libD.wm.divProtect.style;
		s.width = "100%";
		s.zIndex = "10000";
		s.height = "100%";
		s.top = "0";
		s.left = "0";

		try {
			s.position = "fixed";
		} catch (e) {
			s.position = "absolute";
		}
	}());

	if (!libD.defaultWM) {
		libD.defaultWM = libD.wm;
	}

	libD.moduleLoaded("wm");
});
