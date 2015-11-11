// A script that enable you to make scrolling texts easily
// Doesn't need extra libs to work.

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

	libD.scroll = function (opt) {
		//direction = -1 : bottom to top; direction=1: top to bottom
		this.timer = opt.timer || 50;
		this.direction = opt.direction || -1;
		this.child = opt.child || opt.parent.getElementsByTagName("div")[0];
		this.parent = opt.parent;
		this.offset = opt.offset || 25; // when this.down() and this.up() are called, it is the offset applied in px
		this.pauseTime = opt.pauseTime || 400; // when this.down() and this.up() are called, wait pauseTime ms.
		this.currentTop = 0;
		this.stopped = this.stoppedPermanantly = true;
		var thatt = this;

		opt.parent.style.overflow = "hidden";

		var s = this.child.style;
		s.position = "relative";
		s.top = "0px";
		s.marginTop = "0px";
		s.marginBottom = "0px";
		s.marginRight = "0px";
		s.marginLeft = "0px";

		if (!opt.hideArrows) {
			var img1 = document.createElement("img");
			img1.alt = "haut";
			img1.style.position = "absolute";
			img1.style.top = "0px";
			img1.style.right = "0px";
			img1.style.zIndex = "100";
			img1.src = "data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAABsAAAASCAYAAACq26WdAAAAAXNSR0IArs4c6QAAAj1JREFUOMu1lM9LFGEcxr8TCAnGZmXJHgqlTlEZdOgQLV06du7SIYigjp3saF7SouiHeEro1mlJjCDyD0iIxd296GHdIIRB0bGZWWeneff76TID6zSam/pc5uUdhs/3ed5nXks6FJAvFovjruuawcHBh4VCYVMOQsAFY8wr27Z/1mq1uuM4D4BjBwG6CnxV1YhYxpg1VX0K9O8n6BLwBTAJSFWTpauqY8DJ/QCdB2baQRnaAJ4AvXsBDQBFIOIfUtUV4DFwvGOQquZV9T0QtkXGdutYq8BoR5EC/cA7YDM1PYCGYUgURfHWX0AHeA7kdwM6AUyoapABwnEc5ubmyrVarRyGYaZDVfWAZ+lID6Wi6wWGReSOiBwWEZJ3lmVJEASBbdsT1Wr1dqPRuGuM+aiqkWVZtM9rWVaPiNwTkUdAX5ajHDCmqhvJgClXq67rjs7Pzx9NvgnD8IwxZgpopNxpW0tfbIlUVXvi6jpZIFVdN8aM+L7fm3W+qvoacNMFjZ8eMAmcTmD3gZVtQL+CIHizuLg4sMM59wEvd3DYAKYEyAOzaVAM2/R9/0OlUrmyywa/jZ1kAX+Lql4EltL9bbVaDdd1i+Vy+UYHv8ypuIUbWcPL8vLyOd/3q3FkiaPQ87yZUql08z9unT5VHQHWtoakyPT0dFe9Xh+PomhJVUNjzJrneZ8qlcqtPVxzR4Bh4EdMagKfLRGRhYWF/lwud727u/tss9l0bdv+NjQ09H2PF3iXiFwTkcsisg7M/gEoyqIRkNUtqgAAAABJRU5ErkJggg==";

			var img2 = document.createElement("img");
			img2.alt = "bas";
			img2.style.position = "absolute";
			img2.style.top = "0px";
			img2.style.left = "0px";
			img2.style.zIndex = "100";
			img2.src = "data:image/gif;base64, iVBORw0KGgoAAAANSUhEUgAAABsAAAASCAYAAACq26WdAAAAAXNSR0IArs4c6QAAAj9JREFUOMutlMFLVFEYxe9ALoRiMtMGF4VSi4jKokWLSNq07M8I+g9qaRJkSlEZbUxw18oQI4jcCgkhznOhLsYJQhgUffbemzfznDvn1+aNjcNzGtOzevDd853vnHu/lzLGmJWVlUw6nb7b3t5+sVwue4VC4Xt/f/8PcwQAbcaYO8aYG8B2KpWaNdPT0235fP5FpVJZkxRZa7d83//sOM6DIwidAh4DPwEklYEvZn19/VIQBEuSkERcjHzfn1lYWLj/H0JdkgaBLf5CkjCSrgFrNKBarRY9z5vKZrP3WhWSdE7SCLBTE6nvaYAeYDapKCkMguCj4zi3WnCUAcYAv2HuWs/d2kQPgY1GwTja36VS6e3q6mpvE0ddwCugWLuKhl5FYKI21UngKeAeILhtrR0MgqAjyZGkN4CX5EiSD7wHzteT0pKGk/KOp930PG9ocXHxdI0TRdEFa+1EE0c7wEugJymODmAU8GLyvg5hGIbLy8tj4+Pjlx3HuVksFj9Vq9XdhnM1Ry7wTFJXs4s+C7wDSg2PBQDXdZmfn8/mcrlsFEX7anVnfWAE6GzlCWeAD0CYIKgoiqhUKnv70wBX0mhidE0c9kiaBKL6hgd9x9gEhoDuQ/92JPUCU0CFf2ND0pOWomvi8AowA9gmQjvx6nSYo0LSdeCrJJsQoRevTLc5LgC3gW+S9iK11m5Jeg5kzHEDuGqtfV0oFH7lcrm867qPgDOt8k8cRiyVSi0Bw3Nzc52e59m+vr7JgYGBsFX+HxHZ0H/ULZfVAAAAAElFTkSuQmCC";

			opt.parent.appendChild(img2);
			opt.parent.appendChild(img1);

			img1.onmousedown = function (e) {
				thatt.up();
				e.preventDefault();
				e.stopPropagation();
			};

			img2.onmousedown = function (e) {
				thatt.down();
				e.preventDefault();
				e.stopPropagation();
			};
		}
		this.parent.addEventListener("mouseover", function () {
			thatt.stop(true);
		}, false);

		this.parent.addEventListener("mouseout", function () {
			thatt.start(true);
		}, false);

		if (!opt.dontScrollAuto) {
			this.start();
		}
	};

	libD.scroll.prototype = {
		up: function () {
			if (this.currentTop > -this.child.offsetHeight) {
				this.currentTop -= this.offset;
				this.child.style.top = this.currentTop + "px";
				clearTimeout(this.to);
				this.to = setTimeout(this._handleScroll, this.pauseTime, this);
			}
		},

		down: function () {
			if (this.currentTop < this.parent.offsetHeight - this.child.offsetTop) {
				this.currentTop += this.offset;
				this.child.style.top = this.currentTop + "px";
				clearTimeout(this.to);
				this.to = setTimeout(this._handleScroll, this.pauseTime, this);
			}
		},

		_handleScroll: function (thatt) {
			if (thatt.currentTop <= thatt.child.offsetHeight * thatt.direction) {
				thatt.currentTop = thatt.parent.offsetHeight;
			} else {
				thatt.currentTop += thatt.direction;
			}

			thatt.child.style.top = thatt.currentTop + "px";
		},

		start: function (ifNotPermanantlyStopped) {
			if (!this.stopped || (ifNotPermanantlyStopped && this.stoppedPermanantly)) {
				return;
			}

			this.stoppedPermanantly = this.stopped = false;
			this.to = setInterval(this._handleScroll, this.timer, this);
		},

		stop: function (notPermanant) {
			if (!notPermanant) {
				this.stoppedPermanantly = true;
			}

			if (this.stopped) {
				return;
			}

			this.stopped = true;
			clearTimeout(this.to);
		},

		stopAtOrigin: function (nP, restoreAtOrigin) {
			if (restoreAtOrigin) {
				this.currentTop = 0;
			}

			this.child.style.top = "0";
			this.stop(nP);
		}
	};

	if (libD.moduleLoaded) {
		libD.moduleLoaded("scroll");
	}
}(this));
