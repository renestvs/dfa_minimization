/*
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

/*
	Needs libD.setListenerSystem in order to work.
	Can use libD.destroy if it exists, but it is not required.
*/

/*
	libD.fs is a way to handle a directories and their contents in javascript.
	It enables you to have a conveniant representation of folders with an API
	for interacting with it (add / remove files, load folders, ...)

	You can work with virtual files but libD.fs give several way of handling
	real directories hosted on a remote server. It is designed to interact
	well with a fs.php-compliant URL with its loadFolder method.

	It uses libD.setListenerSystem to provide a way to warn scripts using it
	or modification happening to it (new items, deleted items, path changes,
	folder content changes, ...).

	It is also designed for allowing several instances to interact.
	For example, if two or more libD.fs instances are bound to the /foo/bar
	directory and an item is added, modified or deleted from one of them,
	the modification will be spread to all these instances. This enable you
	to have independant applications using the "file system" while being up
	to date (the user creates a file in one application, this file shows in
	all applications).
	Of course, this behavior can be easily cancelled case by case.
*/
/*global libD:0 */

(function () {
	"use strict";
	libD.fs = function (o) {
		this._trigger = libD.setListenerSystem(this);

		this.blockEvents(o.blockEvents);
		this.allowBubbling(o.allowBubbling);

		if (typeof o.currentPath === "string") {
			this.setCurrentPath(o.currentPath);
		}

		this.setContent(o.content);
		this.setFileHandlerURL(o.fileHandler);
		this.setFileSystemURL(o.fsURL);
		this.setIconifierURL(o.iconifier);
		this.setForceDownloadSupport(o.forceDLSupport);
		this.setIconPack(o.iconPack);

		if (o.loadFolder) {
			this.loadFolder(o.loadFolder);
		}
	};

	libD.fs.prototype = {

		// the current path is the path of the folder concerned.

		setCurrentPath: function (p) {
			this.path = this.normalizePath(p);
			this._trigger("currentPathChange");
		},

		getCurrentPath: function () {
			return this.path;
		},

		// set the content of the directory, with content being a valid libD.fs directory representation (array of entries)
		setContent: function (content) {
			if (!content) {
				return;
			}

			this.content = content;
			this.vCount = -1;
			this._trigger("contentDirectoryChange");
		},

		// get it ;)
		getContent: function () {
			return this.content;
		},


		// return the number of object in the current directory. Optimized, doesn't calculate this number each time.
		count: function () {
			if (this.vCount === -1) {
				this.vCount = this.content.length;
			}

			return this.vCount;
		},

		// return the file object corresponding to the file given in argument.
		// accepts numbers or filenames.
		getFileObject: function (f) {

			if (typeof f === "number") {
				return this.content[f] || null;
			}

			if (typeof f === "string") {
				for (var i = 0, c = this.content, len = this.count(); i < len; ++i) {
					if (c[i].name === f) {
						return c[i];
					}
				}
				return null;
			}

			return f || null;
		},

		// return the number of the file given in argument
		// accepts file object or filenames.
		getFileNumber: function (file) {

			if (typeof file !== "string") {
				if (typeof file === "number") {
					return file < this.count() ? file : -1;
				}

				file = file.name;
			}

			for (var i = 0, c = this.getContent(), len = this.count(); i < len; ++i) {
				if (c[i].name === file) {
					return i;
				}
			}

			return -1;
		},

		// return the path of the file given in argument
		getFilePath: function (file) {
			if ( (file = this.getFileObject(file)) ) {
				return this.path + "/" + file.name;
			}

			return null;
		},

		// show a download dialog to the user
		userDownload: function (file) {
			if ( (file = this.getFileObject(file)) ) {
				location.href = this.getFileURL(file, true);
			}
			return false;
		},

		// The "File Handler" is an URL allowing access to files.
		setFileHandlerURL: function (u) {
			this.fileHandler = u;
			this._trigger("FileHandlerURLChange");
		},

		getFileHandlerURL: function () {
			return this.fileHandler;
		},

		// return an URL pointing to the file. if forceDL is true and force
		// download behavior supported, will give an URL that forces download
		getFileURL: function (file, forceDL) {
			if (this.fileHandler && (file = this.getFileObject(file))) {
				return this.fileHandler + encodeURIComponent(this.getCurrentPath() + "/" + file.name) + (this.forceDLSupport ? "&" + (forceDL ? "forcedl" : "nodl") : "");
			}
			return null;
		},

		// if the "File Handler" supports force download behavior, set the support to true, false otherwise.
		setForceDownloadSupport: function (b) {
			this.forceDLSupport = b;
		},

		getForceDownloadSupport: function () {
			return this.forceDLSupport;
		},

		// the "Directory Handler" is a fallback URL that will do an action (showing) with the folder.
		// used in good scripts in case javascript breaks or is disabled by the user (so used in <a href="...">)

		setDirHandlerURL: function (u) {
			this.dirHandler = u;
			this._trigger("DirHandlerURLChange");
		},

		getDirHandlerURL: function () {
			return this.dirHandler;
		},

		// the "File System URL" is an URL on the server handling file transactions (moving, copying, deleting, uploading, ...)
		// can be the fs.php script
		setFileSystemURL: function (u) {
			this.fsURL = u;
			this._trigger("fsURLChange");
		},

		getFileSystemURL: function () {
			return this.fsURL;
		},

		// The iconifier is an URL that gives an icon representating the image. Not used directly

		setIconifierURL: function (u) {
			this.iconifier = u;
			this._trigger("iconifierURLChange");
		},

		getIconifierURL: function () {
			return this.iconifier;
		},

		// Get an URL of an icon representating the file
		getIconURL: function (file, size, iconPack) {
			if (!iconPack) {
				iconPack = this.iconPack;
			}

			if ( (file = this.getFileObject(file)) ) {
				if (this.iconifier !== undefined && this.fileIsImage(file)) {
					return this.iconifier + encodeURIComponent(this.getCurrentPath() + "/" + file.name);
				}

				return libD.mime.toIcon(file.mime, this.getCurrentPath() + "/" + file.name, iconPack, size, this.iconifier);
			}
		},

		// test whether the file is an image or not
		fileIsImage: function (file) {
			if ( (file = this.getFileObject(file)) ) {
				return libD.mime.isImage(file.mime);
			}

			return null;
		},

		setIconPack: function (p) {
			this.iconPack = p;
		},

		// add an object to the directory (without adding it from the server)
		newItem: function (entry, preventBubble) {
			this.content.push(entry);

			if (this.count !== -1) {
				++this.vCount;
			}

			this._trigger("newItem", entry);

			if (!preventBubble && this.bubble) {
				this.eventBubble("newItem", [entry.name, true]);
			}
		},

		// delete an object from the directory (without deleting it from the server)
		deleteItem: function (file, preventBubble) {
			if ((file = this.getFileNumber(file)) !== -1) {
				var c = this.content, F = c[file];
				for (var i = file, len = this.count() - 1; i < len; ++i) {
					c[i] = c[i + 1];
				}

				c.pop();

				this.vCount = -1;

				this._trigger("ItemDeleted", F);

				if (!preventBubble && this.bubble) {
					this.eventBubble("deleteItem", [F.name, true]);
				}
			}
			return false;
		},

		// load the folder by AJAX (string) or directly a js object representating a fs.php-compliant AJAX response (folder.error not required. If given, must be === 0)
		loadFolder: function (folder) {
			if (typeof folder === "string") {
				folder = this.normalizePath(folder);
				libD.request("POST", this.fsURL, this._folderGot, {cmd: "ls", wd: folder}, "json", this);
				this._trigger("folderLoad", folder);
			} else if (folder.mime) {
				folder = this.normalizePath(this.getFilePath(folder));
				libD.request("POST", this.fsURL, this._folderGot, {cmd: "ls", wd: folder}, "json", this);
				this._trigger("folderLoad", folder);
			} else {
				this._folderGot(true, folder);
			}
		},


		// change e.g. "//path/.//to/./some//dir/" into "/path/to/some/dir"
		normalizePath: function (p) {
			if ( (p = p.replace(/\/+/g, "/").replace(/^.\/+/g, "").replace(/\/\.{1, 2}\//g, "/").replace(/\/+$/g, "")) ) {
				return p;
			}
			return "/";
		},

		// Allow this libD.fs to talk to others libD.fs
		allowBubbling: function (b) {
			this.bubble = b === undefined ? true : b;
		},

		// Prevent from others libD.fs to make modification to this one
		blockEvents: function (b) {
			this.allowEvents = b === undefined ? true : b;
		},

		// talk to others libD.fs instances when a modification happens (if they have the same path)
		eventBubble: function (event, argv) {
			if (!this.bubble) {
				return;
			}

			for (var i = 0, c = this.FSes, len = c.length; i < len; ++i) {
				if (c[i] && c[i] !== this && c[i].path === this.path && c[i].allowEvents) {
					c[i][event].apply(c[i], argv);
				}
			}
		},

		// call this when you don't need the libD.fs anymore and you are not leaving the page immediatly.
		destroy: function () {
			for (var i = 0, c = this.FSes, len = c.length; i < len; ++i) {
				if (c[i] === this) {
					while (i < len) {
						c[i] = c[i + 1];
						++i;
					}
				}
			}

			if (libD.destroy) {
				libD.destroy(this);
			}
		},

		// AJAX folder received
		_folderGot: function (success, r) {
			if (success && !r.error) {
				this.setCurrentPath(r.path);
				this.setContent(r.content);
				this._trigger("folderLoaded");
			} else {
				this._trigger("folderLoadFail", success, r.error, r.errorText);
			}
		},

		_ajaxCmd: function (c, args, callback) {
			args.cmd = c;
			libD.request("POST", "fs.php",
				function (success, r) {
					if (success) {
						if (r.error === 1) {
							callback(false, r.errorText);
						} else {
							callback(true, r);
						}
					} else {
						callback(false);
					}
				}, args, "json"
			);
		},

		FSes: [] // Will reference all libD.fs objects
	};

	libD.mime = {
		isImage: function (mime) {
			return mime.match(/image\/(?:png|jpeg|gif|bmp|jpg|jpe)/);
		},

		toIcon: function (mime, path, iconPack, size, iconifier) {
			if (!size) {
				size = libD.iconDefaultSize || "48";
			}

			var iconDir = "";

			if (iconPack || (iconPack = libD.iconPack)) {
				iconDir = iconPack + "/" + size + "x" + size;
			}

			if (iconifier && mime.substr(0, 6) === "image/") {
				return iconifier + encodeURIComponent(path);
			}

			switch (mime) {
				case "directory":
					return iconDir + "/places/folder.png";
				case "text/x-php":
					return iconDir + "/mimetypes/application-x-php.png";
				case "text/x-c":
					return iconDir + "/mimetypes/text-x-csrc.png";
				case "text/x-c++":
					return iconDir + "/mimetypes/text-x-c++src.png";
				case "text/x-shellscript":
					return iconDir + "/mimetypes/text-x-script.png";
				case "application/vnd.ms-office":
					mime = "application/msword";
			}

			return iconDir + "/mimetypes/" + mime.replace(/\//g, "-") + ".png";
		},

		humanSize: function (s) {
			var i = 0;
			while (s > 1023 && i < 8) {
				s /= 1024;
				++i;
			}
			return (Math.round(s * 100) / 100) + " " + ["", "Ki", "Mi", "Gi", "Ti", "Pi", "Ei", "Zi", "Yi"][i] + "B";
		}
	};

	libD.moduleLoaded("fs");
	libD.moduleLoaded("mime");
}());
