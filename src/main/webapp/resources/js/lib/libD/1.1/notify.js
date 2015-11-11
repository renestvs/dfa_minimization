/*
	Copyright (C) 2010-2014 JAKSE Raphaël

	The JavaScript code in this page is free software: you can
	redistribute it and/or modify it under the terms of the GNU
	General Public License (GNU GPL) as published by the Free Software
	Foundation, either version 3 of the License, or (at your option)
	any later version. The code is distributed WITHOUT ANY WARRANTY;
	without even the implied warranty of MERCHANTABILITY or FITNESS
	FOR A PARTICULAR PURPOSE. See the GNU GPL for more details.

	As additional permission under GNU GPL version 3 section 7, you
	may distribute non-source (e.g., minimized or compacted) forms of
	that code without the copy of the GNU GPL normally required by
	section 4, provided you include this license notice and a URL
	through which recipients can access the Corresponding Source.
*/

/*
 Package: notify
 Class: libD.Notify
 A tiny notifier like Gnome's or KDE's one.

 Needs:
	libD's fx package
	<libD.getCSS> (optional)
*/

/*eslint no-console:0*/
/*global libD:0, console:0*/

libD.need(["fx"], function () {
	"use strict";

	if (libD.getCSS) {
		libD.getCSS("", "notify");
	}
/* Constructor:
 Creates a notification.
 Options:
	- icon: the path to the icon of the notification. Default: nothing
	- title: the title of the notification.Default: nothing
	- type: an arbitrary string defining the type of the notification, to allow custom style via CSS. Supported types by libD.Notify:ok, error. the notification will have the "<type>" class (will probably have to change in the future). Default: "" (normal type).
	- content: a string representing the content of the notification in HTML, or a DOM element that will be its content. Default: nothing
	- closable: whether the user can close the notifier directly or not (will show the close button or hide it). Default: true
	- delay: the time to wait before showing the notification. Default: 0
	- show: whether the notification is shown automatically after the constructor call or not.Default: true
	- onclose: callback function called before the notification closes.
 Parameters :
	o (optional) - options to pass, as an indexed object, or the string to show (in HTML)
	autoclose (optional) - if it's a Number different from 0, the time, in milliseconds, of display. When elapsed, the notification will be closed. Default: 0 (the notification won't be closed)

 See Also:
 <libD.notify>
*/
	libD.Notify = function (o, autoclose) { // call with "new"
		if (this === libD) {
			return new libD.Notify(o, autoclose);
		}

		var descr = null;

		if (typeof o !== "object") {
			if (typeof o === "string") {
				descr = o;
			}

			o = {};
		}

		this.closeBound = this.close.bind(this);

		this.displayFor = o.autoClose || 0;
		this.area = o.area || this.defaultArea || document.body;
		this.closing = false;
		this.iconNotifier = this.system = null;

		this.divIcon = document.createElement("div");
		this.divIcon.className = "libD_notify-icon";
		this.elemIcon = document.createElement("img");
		this.elemIcon.alt = "";
		this.divIcon.appendChild(this.elemIcon);
		this.setIcon(o.icon);

		var close = document.createElement("a");
		close.textContent = "×";
		close.className = "libD_notify-close";
		close.onclick = this.closeBound;

		this.btnclose = close;

		this.infoNotify = document.createElement("div");
		this.infoNotify.className = "libD_notify-area";

		this.progressbar = document.createElement("div");
		this.progressbar.className = "libD_notify-pbar";
		this.progression = document.createElement("div");
		this.progressbar.appendChild(this.progression);
		this.progressbar.style.display = "none";

		this.elemTitle = document.createElement("span");
		this.elemTitle.className = "libD_notify-title";
		this.elemTitle.textContent = o.title || "";

		this.elemDescr = document.createElement("div");
		this.elemDescr.className = "libD_notify-descr";

		this.elemProgressInfo = document.createElement("div");
		this.elemProgressInfo.className = "libD_notify-progressinfo";

		this.buttonArea = document.createElement("div");
		this.buttonArea.className = "libD_notify-buttonarea";

		this.infoNotify.appendChild(this.elemTitle);
		this.infoNotify.appendChild(this.elemDescr);
		this.infoNotify.appendChild(this.progressbar);
		this.infoNotify.appendChild(this.elemProgressInfo);
		this.infoNotify.appendChild(this.buttonArea);

		this.bubble = document.createElement("div");
		this.bubble.className = "libD_notify" + (o.type ? " libD-not-" + o.type : "");
		this.bubble.appendChild(close);
		this.bubble.appendChild(this.divIcon);
		this.bubble.appendChild(this.infoNotify);

		this.displayed = false;

		this.canClose = true;

		if (typeof descr === "string") {
			this.setDescription(descr);
			close.style.display = "none";
			this.elemTitle.style.display = "none";
			this.show();
		} else {
			var d = o.content || o.description;
			if (d) {
				this.setDescription(d);
			}

			if (o.closable !== undefined) {
				this.setClosable(o.closable);
			}

			if (o.onclose) {
				this.onclose = o.onclose;
			}

			if (o.delay) {
				this.delay(o.delay);
			} else if (o.show !== false) {
				this.show();
			}
		}

		if (typeof descr === "string" || o.closeOnClick) {
			this.bubble.onclick = this.closeBound;
		}

		if (autoclose) {
			this.autoClose(autoclose);
		}
	};

	libD.Notify.prototype = {
		/*
			Method: show
			Will show the notification and cancel the delay if any.
			Returns:
				true if it succeded
				undefined if the notification was already shown
				false if it failed (never happens here)
		*/
		show: function () {
			if (this.delayTO) {
				clearTimeout(this.delayTO);
			}

			if (this.displayed) {
				return null;
			}

			libD.showSmoothly(this.bubble);
			this.area.appendChild(this.bubble);

			this.displayed = true;

			if (this.displayFor) {
				this.displayFor = setTimeout(this.closeBound, this.displayFor);
			}

			return true;
		},

		/* Method: setArea
		  Sets the DOM element which will receive the notification element.
		  Parameter:
				area - The DOM element which will receive the notification. Default: document.body
		*/
		setArea: function (area) {
			this.area = area;
		},

		/* Method: close
		 Closes the notification, if it is closable.
		 Parameter:
			force: if true, forces the notification to close, even if it's not closable.

		*/
		close: function (force) {
			if (!this.canClose && !force) {
				return;
			}

			if (typeof this.onclose === "function") {
				try {
					this.onclose();
				} catch (e) {
					if (window.console && typeof console.warn === "function") {
						console.warn(e);
					}
				}
			}

			if (this.displayFor) {
				clearTimeout(this.displayFor);
			}

			if (this.delayTO) {
				clearTimeout(this.delayTO);
			}

			if (this.bubble && this.bubble.parentNode) {
				libD.hideSmoothly(this.bubble, {
					deleteNode: true
				});
			} else {
				delete this.bubble;
			}

			this.displayed = false;
		},

		/* Method: setTitle
		 set the title of the notication
		 Parameter:
			s - the title to set
		*/
		setTitle: function (s) {
			this.elemTitle.style.display = null;
			this.elemTitle.textContent = s;
		},

		/* Method: setDescription
		 set the content of the notification
		 Parameter:
			o - the ontent to set, as an HTML string or DOM object.
		*/
		setDescription: function (o, html) {
			if (typeof o === "string") {
				if (html) {
					this.elemDescr.innerHTML = o;
				} else {
					this.elemDescr.textContent = o;
				}
			} else {
				this.elemDescr.textContent = "";
				this.elemDescr.appendChild(o);
			}
		},

		setContent: libD.Notify.prototype.setDescription,

		/* Method: setProgressInfo
		 shows a text describing the state of the task associated to the notification.
		 Parameter:
			s - the string to show (not HTML)
		*/
		setProgressInfo: function (s) {
			this.elemProgressInfo.textContent = s;
		},

		/* Method: addButton
		 adds a button to the notification
		 Parameters:
			s - the text of the button
			fct - the function to call when the button is pressed. if the function doesn't return false, the notification will be closed, if it is closable.
		*/
		addButton: function (s, fct) {
			var b = document.createElement("button");
			b.className = "libD_notify-button";

			var that = this;
			b.onclick = function () {
				if (fct() !== false) {
					that.close();
				}
			};

			b.textContent = s;
			this.buttonArea.appendChild(b);
			return b;
		},

		removeButtons: function () {
			this.buttonArea.textContent = "";
		},

		removeButton: function (b) {
			this.buttonArea.removeChild(b);
		},

		/* Method: setProgress
		 informs the user about the progression of the task associated to the notification. (typically, with a progressbar)
		 Parameter:
			i - if >= 0, represents the progression in percents. Otherwise, it will hide the information (progressbar) to the user.
		*/
		setProgress: function (i, info) {
			i = i > 100 ? 100 : i;

			if (i < 0) {
				this.progressbar.style.display = "none";
			} else if (this.progressbar.style.display === "none") {
				this.progressbar.style.display = "";
			}

			this.progression.style.width = i + "%";

			if (info !== undefined) {
				this.setProgressInfo(info);
			}
		},

		/* Method: autoClose
		 Will close the notification after the given time is elapsed. If the notication is not displayed, this will take effect when the notication is shown
		 Parameter:
			i - the time to wait, in milliseconds
		*/
		autoClose: function (i) {
			if (this.displayed) {
				if (this.displayFor) {
					clearTimeout(this.displayFor);
				}

				if (!i) {
					i = 3000;
				}

				var that = this;
				this.displayFor = setTimeout(
					function () {
						that.close.call(that, true);
					}, i);
			} else {
				this.displayFor = i;
			}
		},
		/* Method setClosable
		 set the setClosable state of the notification, see the <libD.Notify>'s constructor
		 Parameter:
			c - the value to give to the state
		*/
		setClosable: function (c) {
			this.btnclose.style.display = c ? "" : "none";
			this.canClose = c;
		},
		/* Method: setIcon
		 set the icon of the notication
		 Parameter:
			s - the path to the image
		*/
		setIcon: function (s) {
			var clean = false;
			if (typeof Blob !== "undefined" && s instanceof Blob) {
				s = URL.createObjectURL(s);
				clean = true;
			}

			this.elemIcon.src = s || "";

			if (clean) {
				URL.revokeObjectURL(s);
			}

			this.divIcon.style.display = s ? "" : "none";
		},

		/* Method: setType
		 set the type of the notification, typically "", "ok" or "error". See <libD.Notify>'s constructor
		 Method:
			s - the type to set
		*/
		setType: function (s) {
			this.bubble.className = "libD_notify";
			switch (s) {
			case "error":
				this.bubble.className += " libD-not-error";
				break;
			case "info":
				this.bubble.className += " libD-not-info";
				break;
			case "ok":
				this.bubble.className += " libD-not-ok";
				break;
			}
		},
		/*Method: delay
		 if the notification is not displayed, shows the notification after the time given in argument is elapsed
		Parameter:
			d - the time to wait, in milliseconds
		*/
		delay: function (d) {
			if (!this.displayed) {
				this.delayTO = setTimeout(this.show.bind(this), d);
			}
		},

		defaultArea: null
	};

	/*
	 Class: libD

	Value: libD.notify
		if availble, pointq to a libD-compliant notifier, see libD.Notify for the reference implementation.
		set to lib.Notify by notify.js
	*/
	libD.notify = libD.Notify;

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
				var ret = callback(true, extraArg);
				notify.onclose = null;
				return ret;
			}
		);

		notify.addButton(
			libD.no,
			function () {
				var ret = callback(false, extraArg);
				notify.onclose = null;
				return ret;
			}
		);

		notify.onclose = function () {
			callback(null, extraArg);
		};

		notify.show();
		return notify;
	};

	libD.yes = "Yes";
	libD.no = "No";

	if (libD.moduleLoaded) {
		libD.moduleLoaded("notify");
	}
});
