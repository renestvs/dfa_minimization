/*
	Copyright (C) 2014 JAKSE Raphaël

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

(function () {
	"use strict";
	libD.Uploader = function (o) {
		if (!o) {
			o = {};
		}

		this.bubbling = o.bubbling || false;

		if (o.fileInput) {
			this.addFileInput(o.fileInput);
		}

		this.acceptedMimes = o.acceptedMimes || null;

		if (o.uploadURL) {
			this.uploadURL = o.uploadURL;
		} else if (o.fileInput && !o.dontGuessUploadURL) {
			var form = o.fileInput.parentNode;
			while (form && form.nodeName.toLowerCase() !== "form") {
				form = form.parentNode;
			}

			if (form) {
				this.uploadURL = form.action;
			}
		}

		if (o.fileArea) {
			this.addFileArea(o.fileArea);
		}

		if (o.fileAreas) {
			for (var i = 0; i < o.fileAreas.length; i++) {
				this.addFileArea(o.fileAreas[i]);
			}
		}

		this.chunkSize = o.chunkSize || this.defaultChunckSize;

		this.uploadSource = o.uploadSource || "libDUploader";

		this.currentFileList = [];

		libD.setListenerSystem(this, libD.Uploader.prototype);
	};

	libD.Uploader.prototype = {
		defaultChunckSize: 2 * 1024 * 1024,

		addFileInput: function (fileInput) {
			if (!this._fileInputChange) {
				this._fileInputChange = this.fileInputChange.bind(this);
			}
			fileInput.addEventListener("change", this._fileInputChange, false);
		},

		releaseFileInput: function (fileInput) {
			fileInput.removeEventListener("change", this._fileInputChange, false);
		},

		addFileArea: function (fileArea) {
			if (!this._areaDragOver) {
				this._areaDragOver = this.areaDragOver.bind(this);
			}

			if (!this._areaDrop) {
				this._areaDrop = this.areaDrop.bind(this);
			}

			if (!this._areaDragLeave) {
				this._areaDragLeave = this.areaDragLeave.bind(this);
			}

			fileArea.addEventListener("dragover", this._areaDragOver, this.bubbling);
			fileArea.addEventListener("dragenter", this._areaDragOver, this.bubbling);
			fileArea.addEventListener("dragleave", this._areaDragLeave, this.bubbling);
			fileArea.addEventListener("drop", this._areaDrop, this.bubbling);
		},

		fileListCheckMime: function (files) {
			var list = files;
			if (this.acceptedMimes) {
				list = [];
				for (var i = 0; i < files.length; i++) {
					for (var j = 0; j < this.acceptedMimes.length; j++) {
						if (files[i].type.match(this.acceptedMimes[j])) {
							list.push(files[i]);
							break;
						}
					}
				}
			}
			return list;
		},

		listChanged: function (list) {
			this.currentFileList = list || [];

			this.totalSize = 0;

			for (var i = 0; i < list.length; i++) {
				this.totalSize += list[i].size;
			}

			this.emit("filelistchanged", list);
		},

		fileInputChange: function (e) {
			var list = this.fileListCheckMime(e.currentTarget.files);
			if (list.length) {
				this.listChanged(list);
			} else {
				this.emit("fileinputrejected");
				this.emit("filelistrejected");
			}
		},

		areaDragOver: function (e) {
			var types = e.dataTransfer.types,
				containsFiles = (
					types.contains
						? types.contains("Files")
						: types.indexOf("Files") !== -1
				);

			if (containsFiles) {
				this.emit("dragenter", e);
				e.preventDefault();
				e.currentTarget.classList.add("libD-uploader-dragging");
				return false;
			}

			return null;
		},

		areaDragLeave: function (e) {
			e.currentTarget.classList.remove("libD-uploader-dragging");
		},

		areaDrop: function (e) {
			e.preventDefault();
			e.stopPropagation();
			var dragList = this.fileListCheckMime(e.dataTransfer.files);

			e.currentTarget.classList.remove("libD-uploader-dragging");

			if (!dragList.length) {
				this.emit("dropcancelled", e);
				return false;
			}

			this.emit("drop", e);
			this.listChanged(dragList);
		},

		getFileList: function () {
			return this.currentFileList || [];
		},

		clearFileList: function () {
			this.currentFileList = null;
		},

		getTotalSize: function () {
			return this.totalSize;
		},

		upload: function (fromFileIndex, list, dontResetTotal) {
			if (!fromFileIndex) {
				fromFileIndex = 0;
			}

			if (!list) {
				list = this.currentFileList;
			}

			var callback = null;

			callback = (
				(fromFileIndex + 1 < list.length)
					? this.upload.bind(this, fromFileIndex + 1, list, true)
					: this.emit.bind(this, "uploadlistcomplete")
			);

			this.uploadFile(list[fromFileIndex], callback, dontResetTotal);
		},

		uploadFile: function (f, callback, dontResetTotal, curSize, chunkSize, chunkIndex) {
			if (!curSize) {
				curSize = 0;
			}

			if (!chunkIndex) {
				chunkIndex = 0;
				this.emit("uploadfile", f);
			}

			if (!chunkSize) {
				chunkSize = this.chunkSize;
			}

			if (!dontResetTotal) {
				this.totalLoaded = 0;
			}

			var callbackBlob = null, that = this;


			callbackBlob = (
				(curSize + chunkSize < f.size)
					? this.uploadFile.bind(this, f, callback, true, curSize + chunkSize, chunkSize, chunkIndex + 1)
					: function () {
						that.emit("uploadfilecomplete", f);
						callback();
					}
			);

			var endSlice = Math.min(f.size, curSize + chunkSize);
			var slice = (
				(curSize === 0 && endSlice === f.size)
					? f
					: f.slice(curSize, endSlice)
			);

			this.uploadBlob(slice, callbackBlob, true, f.name, chunkIndex, f, curSize, endSlice);
		},

		uploadBlob: function (b, callback, dontResetTotal, fname, chunkIndex, f, curSize, endSlice) {
			var xhr = new XMLHttpRequest();
			var that = this;

			if (!dontResetTotal) {
				this.totalLoaded = 0;
			}

			xhr.upload.addEventListener("progress", function (e) {
				if (e.lengthComputable) {
					that.emit("progress", e.loaded + that.totalLoaded);
				}
			}, false);

			xhr.upload.addEventListener("load", function (e) {
				that.emit("blobcomplete");

				that.totalLoaded += e.loaded;

				if (e.lengthComputable) {
					that.emit("progress", that.totalLoaded);
				}

				callback();
			});

			xhr.overrideMimeType("text/plain; charset=x-user-defined-binary");
			xhr.open("POST", this.uploadURL + "uploadChunkIndex=" + chunkIndex + "&uploadFileName=" + encodeURIComponent(fname) + "&uploadFileSize=" + f.size + "&uploadChunkBegin=" + curSize + "&uploadChunkEnd=" + endSlice);
			xhr.send(b);
		},

		setUploadURL: function (url) {
			this.uploadURL = url;
		}
	};
	libD.moduleLoaded("upload");
}());
