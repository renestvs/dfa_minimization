/**
	@fileOverview The core of libD and some convenience functions. Covers listenerSystem, l10n, domEssential packages too.
	@author Raphaël JAKSE
	@verion 1.1-dev

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

/*eslint no-console:0*/
/*global console:0*/

(function (that) {
	"use strict";

	/*
	   Class: libD
	   A lightweight and (hopefully) handful library.
	*/

	if (!that.libD) {
		/** @namespace */
		that.libD = {};
	}

	var libD = that.libD;

	/*
	Function: False

		This function lets you cancel a javascript event given in argument.

		Parameter:
			e (optional) - a JS Event object

		Returns:
			false

		Usage:
			> button.onclick = function (e)
			> {
			> 	// ...
			> 	return libD.none(e);
			> }

			or

			> button.onclick = libD.none;

		Notes:
			"Canceling an event" here means stopping the event propagation (stopPropagation and cancelBubble). It will also prevent default action assiociated with the event (preventDefault).

			If nothing is given in arguments, libD.none will simply return false.
	*/

	libD.none = function (e) {
		if (e && e instanceof Event) {
			e.preventDefault(e);
			e.stopPropagation();
		}

		return false;
	};

	libD.removeValue = function (array, value) {
		var i = array.indexOf(value);
		if (i !== -1) {
		    return array.splice(i, 1);
		}
		return false;
	};

	/*
	 Function: ready
	 Call callback when the dom is ready as soon as possible (even if all images are not loaded) or if the dom is ready (you are sure your callback will be called)
	 Parameter:
		callback - The function to call
	 See Also:
		<libD.load>
	*/
	libD.ready = function (callback) {
		if (libD.domReady) {
			callback();
		} else {
			if (!libD.waitingReady) {
				libD.waitingReady = [callback];
				document.addEventListener("DOMContentLoaded", libD._domIsReady, false);
			} else {
				libD.waitingReady.push(callback);
			}
		}
	};

	/* PRIVATE - Fired when the dom is ready (as soon as possible), you should not use this function. */
	libD._domIsReady = function (force) {
		if (libD.domReady || (libD.pendingDomReady && !force)) {
			return;
		}

		if (!libD.pendingDomReady
			&& ( // test for missing standard features
				!document.body.classList
				|| !libD.requestAnimationFrame
				|| (!document.documentElement.dataset &&
					// FF is empty while IE gives empty object
					(!Object.getOwnPropertyDescriptor(Element.prototype, 'dataset') ||
					!Object.getOwnPropertyDescriptor(Element.prototype, 'dataset').get)
				)
			)
			&& libD.modulesLoaded["js:" + libD.path + "/3rd/shim.js"] === undefined
		) {
			libD.pendingDomReady = true;
			libD.need(["js:" + libD.path + "/3rd/shim.js"], libD._domIsReady.bind(libD, true));
			return;
		}

		libD.domReady = true;

		for (var i in libD.waitingReady) {
			if (libD.waitingReady.hasOwnProperty(i)) {
				try {
					libD.waitingReady[i]();
				} catch (e) {
					libD.error("ready event failed", e);
				}
			}
		}

		delete libD.waitingReady;

		libD.moduleLoaded("ready");
	};

	/* Function: load
	 Call callback when the window's "load" event is fired or if the load event already happened (you are sure your callback will be called)
	 Parameter:
		callback - The function to call
	 See Also:
		<libD.ready>
	*/

	libD.load = function (callback) {
		if (libD.loadFired) {
			setTimeout(libD.catchErrors, 0, callback);
		} else {
			window.addEventListener("load", callback, false);
		}
	};

	/*
	 Function: destroy
	 Recursively destroy an object ; returns nothing.
	 Parameters:
		obj - The object to destruct
		recursive (optional) - If true, destroy recursively. default: true
	*/
	libD.destroy = function (obj, recursive) {
		for (var i in obj) {
			if (((typeof recursive === "undefined") || recursive)
				&& (typeof obj[i] === "object")
				&& obj[i] !== obj
			) {
				libD.destruct(obj[i]);
			} else {
				delete obj[i];
			}
		}
	};

	/*
	 Function: htmlspecialchars
	 Returns s with "&" replaced by "&amp;", "<" by "&lt;" and ">" by "&gt;"
	 Parameter:
		s - the String to escape
	 Returns:
		a String
	*/
	libD.htmlspecialchars = function (s) {
		return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	};

	/*
	 Function: ch
	 "ch" as in "choice" - if defined, returns a. Otherwise, returns b.
	 Parameters:
		a - user's variable
		b - default value
	 Usage:
		> function createWindow(w, h)
		> {
		> 	win = newWin();
		> 	win.Width = libD.ch(w, 420); // Width will be set to w is defined, 420 otherwise
		> 	win.Height = libD.ch(h, 130); // Height will be set to h is defined, 130 otherwise
		> 	// ...
		> 	return win; // win's default size is 420×130.
		> }
	*/
	libD.ch = function (a, b) {
		return a === undefined ? b : a;
	};


	/*
	 Function: getExtStart
	 Returns the position of the extension of the file, including the dot. If no extension is found, returns f.length
	 Parameters;
	  f - the filename, as String
	  negativeIfNot (optional) - boolean. if True, and if no extension is found, return -1 instead of f.length
	 Returns:
		a Number
	 Usage:
	 > function rename(file)
	 > { // allow renaming a file forbiding extension changes
	 > 	var extPos = libD.getExtStart(file),
	 > 	    basename = file.name.substr(0, extPos),
	 > 	    extension = file.name.substr(extPos); // if file doesn't have extension, will be an empty string. But take care, in this case user CAN set an extension...
	 > 	    newName = window.prompt("Please give a new name to the file, or press cancel to abort", basename);
	 >
	 > 	if (newName)
	 > 		file.name = basename + extension;
	 > }
	*/
	libD.getExtStart = function (f, negativeIfNot) {
		var len = f.length, i = Math.max(0, len - 1), lastPos = len;
		while (i) {
			if (f.charAt(i) === ".") {
				if (lastPos === len || f.substr(i + 1, 3) === "tar") {
					lastPos = i;
				} else {
					return lastPos;
				}
			}
			--i;
		}

		if (negativeIfNot && lastPos === len) {
			return -1;
		}

		return lastPos;
	};

	/*
	 Function: isJsLoaded
	 Verifies whether the given javascript file is already loaded
	 Parameter:
	  fname - filename as String. Must match EXACTLY the src argument of the srcipt tag
	 Returns:
		true if the js file is loaded, false otherwise.
	 Usage:
		> if (!libD.isLoaded("/scripts/libEndTheWorld.js"))
		> 	libD.jsLoad("/scripts/libEndTheWorld.js");
	 See Also:
		<libD.jsLoad>
		<libD.getJS>
		<libD.isCssLoaded>
		<libD.cssLoad>
		<libD.getCSS>
	*/
	libD.isJsLoaded = function (fname) {
		for (var j = 0, scripts = document.getElementsByTagName("script"), slen = scripts.length; j < slen; ++j) {
			if (scripts[j].src === fname) {
				return true;
			}
		}
		return false;
	};

	/*
	 Function: jsLoad
	 loads the javascript file given as argument
	 Parameter
		fname - The path to the javascript file to load
	 See Also:
		<libD.isJsLoaded>
		<libD.getJS>
		<libD.isCssLoaded>
		<libD.cssLoad>
		<libD.getCSS>
	*/
	libD.jsLoad = function (fname, callback, type, defer, async) {
		var script = document.createElement("script");
		script.src = fname;
		script.type = type || "text/javascript";

		if (callback) {
			script.onload = callback;
			script.onerror = callback.bind(that, true);
		}

	   if (defer) {
	      script.defer = "defer";
	   }

	   if (async) {
	      script.async = "async";
	   }

	   document.getElementsByTagName("head")[0].appendChild(script);
	};

	/*
	 Function: getJS
	 Loads the given javascript file. Won't load already loaded files.
	 If the path giver is not absolute, will use the current javascript working directory (See <libD.jsPath>)
	 If module is given, handle file like a libD module (module must start with "*")
	 Parameters:
		fname - the name of the file to load
		force - load the file even if it is already loaded
		module - will treat this file as a libD module, thus allowing you benefit from libD's module loading infrastructure (See <libD.need>, <libD.getModule>, <libD.moduleLoaded>, <libD.unloadModule>, <libD.modulesLoaded>
	 Note:
		Don't use it to load "official" libD modules. Use <libD.need> or <libD.getModule> instead.
	 Usage:
		Load a simple script
		> libD.getJS("ControlTheWorld/2.0.js");

		Load a module - a good pratice is using a personnal prefix for your modules, in addition to the "*".
		> libD.need(["*god.shutDownEarth", "matrix", "sizepos"], function ()
		> { // this function will be called when your module and libD's matrix and sizepos modules will be available
		>	shutDownEarth.init();
		> 	//...
		> 	var Earth = God.getElement("Earth"),
		> 	    dEarth = Earth.toDOMFormat(), // turn Earth into Javascript compliant format for easier manipulation
		> 	    width = libD.width(dEarth),
		> 	    height = libD.width(dEarth);
		> 	// ...
		> 	var topLeftPosOfTheEarth = libD.getRealPos( // We need the position of the top left corner of the Earth
		> 		libD.getTransformMatrix(dEarth, null, width, height),
		> 		libD.left(dEarth),
		> 		libD.top(dEarth),
		> 		libD.getTransformMatrixCenter(dEarth, null, width, height)
		> 	);
		> 	shutDownEarth.byExplodingIt({method:"vogon", topLeftPosition:topLeftPosOfTheEarth});
		> });
		>
		> libD.getJS("/scripts/god/earthTools/shutdown.js", false, "*.god.shutDownEarth");
	 Note:
		When loading a third-party module, this module must call libD.moduleLoaded at its end to register itself. Otherwise, functions which need it will never be called by the libD's module infrastructure.
		e.g. here, /scripts/god/earthTools/shutdown.js must have this piece of code *at its end* :

		> if (this.libD && libD.moduleLoaded) // this allows usage of the script without libD's core module
		> 	libD.moduleLoaded("*god.shutDownEarth");

	See Also:
		<libD.need>
		<libD.getModule>
		<libD.unloadModule>
		<libD.moduleLoaded>
	*/
	libD.getJS = function (fname, force, module) {
		if (module && libD.modulesLoaded[module] !== undefined) {
			return;
		}

		if (!fname.match(/^(?:(?:(?:ftp|http)s?|file):\/)?\//)) {
			fname = libD.jsPath + fname;
		}

		if (!force && libD.isJsLoaded(fname)) {
			return;
		}

		libD.jsLoad(fname);

		if (module) {
			libD.modulesLoaded[module] = false;
		}
	};

	/*
	 Function: isCssLoaded
	 Check whether the stylesheet given in argument is loaded.
	 Parameter:
		fname - the path to the stylesheet EXACTLY as in the href attribute of the link tag
	 Returns:
		true if the stylesheet is loaded, false otherwise
	*/
	libD.isCssLoaded = function (fname) {
		for (var j = 0, links = document.getElementsByTagName("link"), slen = links.length; j < slen; ++j) {
			if (links[j].href === fname) {
				return true;
			}
		}
		return false;
	};

	/*
	 Function: cssLoad
	 Loads the CSS given in argument
	 Parameter:
	  fname - the path of the stylesheet to load
	*/
	libD.cssLoad = function (fname) {
		var link = document.createElement("link");
		link.href = fname;
		link.rel = "stylesheet";
		link.type = "text/css"; // useless for HTML 5, useful for XHTML.
		document.getElementsByTagName("head")[0].appendChild(link);
	};

	/*
	 Function: getCSS
	 You could have different themes for a single thing, and want to load the default theme of the thing only if another theme was not loaded yet for this thing.
	 You could also want to use libD's default theme for everything, excepted for one of it's specific feature, like it's window manager or it's notifier.
	 This function loads :
	  - the stylesheet corresponding to the whatFor libD's feature in the chosen theme if fname is not given
	  - the stylesheet of which you give the filename otherwise
	 and register the stylesheet for the whatFor feature if given, so any getCSS call for this feature will be ignored

	 Parameters:
	  fname (optional) - the path to the stylesheet to load. If not given, will be calculated from whatFor an theme values
	  whatFor (optional) - the feature corresponding to the stylesheet to load. If it is not a libD native feature, prefix it with a "*"
	  theme (optional) - libD's theme to use. Defaults to the current theme used (see <libD.theme)

	*/
	libD.getCSS = function (fname, whatFor, theme) {
		if (!fname) {
			fname = libD.path + "css/" + (theme || libD.theme) + "/" + whatFor + ".css";
		}

		if (typeof whatFor === "string" && libD.cssLoaded[whatFor]) {
			return;
		}

		if (libD.isCssLoaded(fname)) {
			return;
		}

		libD.cssLoad(fname);

		if (typeof whatFor === "string") {
			libD.cssLoaded[whatFor] = fname;
		}
	};

	/*
	 Function: getModule
	 Loads the libD module given in argument.
	 Note:
		Should not be needed by a normal script, used by libD internally.

		You can use this function for debugging purpose in a interractive javascript shell, though.

		If "firebug" is given as a module, Firebug Lite will be loaded, but as i'ts not a real libD module, you cannot use e.g libD.need with it. "firebug-beta" will load Firebug Lite Beta.
	 Parameters:
		module - the libD module to load.
		forceReload - if true, will reload the module, if already loaded. Otherwise, if the module is already loaded, getModule will do nothing
	 See Also:
		<libD.need>
		<libD.getJS>
		<libD.unloadModule>
		<libD.moduleLoaded>
	*/
	libD.getModule = function (module, forceReload) {
		if (libD.modulesLoaded[module] === undefined) {
			libD.modulesLoaded[module] = false;

			var path = null;

			if (module === "json") {
				libD.need(["js:" + libD.path + "/3rd/json2.js"],
					function () {
						libD.moduleLoaded("json");
					}
				);
				return;
			}

			if (module === "history") {
				libD.need(["js:" + libD.path + "/3rd/history.min.js"],
					function () {
						libD.moduleLoaded("history");
					}
				);
				return;
			}

			if (module.substring(0, 3) === "js:") {
				var js = module.substring(3);
				if (forceReload || !libD.isJsLoaded(js)) {
					libD.jsLoad(js, function () {
						libD.moduleLoaded(module);
					});
				}
				return;
			}

			if (module === "firebug") {
				path = "https://getfirebug.com/firebug-lite.js";
			} else if (module === "firebug-beta") {
				path = "https://getfirebug.com/firebug-lite-beta.js";
			}

			if (!path) {
				path = libD.path + module + ".js";
			}

			libD.getJS(path, forceReload);
		}
	};

	/*
	 Function: getIcon
		returns the path of the icon asked.
	 Parameters:
		icon - the name of the icon needed
		iconSize (optional) - string representating the size needed. Defaults to <libD.iconSize>.
		iconPack (optional) - path to the icon theme to use. Should follow the freedesktop naming convension, see <http://standards.freedesktop.org/icon-naming-spec/icon-naming-spec-latest.html>. Defaults to <libD.iconPack>. *Do not forget the trailing slash*.
	 Usage:
		> var redo = libD.getIcon("actions/edit-redo");
		> // redo is : "/share/icons/oxigen/22x22/actions/edit-redo.png"

		> var paste = libD.getIcon("action/edit-paste", "32x32", "/MyFreakinGreatIconTheme/");
		> // paste is : "/MyFreakinGreatIconTheme/32x32/actions/edit-paste.png"

		> var newdoc = libD.getIcon("action/document-new", null, "/MyFreakinGreatIconTheme/");
		> // newdoc is : "/MyFreakinGreatIconTheme/22x22/actions/document-new.png"
	 Returns:
		a path (String)
	 See Also:
		<libD.iconIMG>
	*/
	libD.getIcon = function (icon, iconSize, iconPack) {
		if (libD.getExtStart(icon, true) === -1) {
			if (!iconPack) {
				iconPack = libD.iconPack;
			}

			if (!iconSize) {
				iconSize = libD.iconSize;
			}
			return iconPack + iconSize + "/" + icon + ".png";
		}
		return icon;
	};

	/*
	 Function:iconIMG
		Returns a DOM Img element having alt and title attribute set to alt and src attribute set according to the icon wanted.

		Parameters:
			icon - the name of the icon
			alt (optional) - the alt / title text to set. Default: ""
			iconSize (optional) - the size of the icon wanted. Default: <libD.iconSize>
			iconPack (optional) - path to the icon theme to use. Defaults to <libD.iconPack>.

		Notes:
			- For iconPack, *Do not forget the trailing slash*. The icon pack should follow the freedesktop naming convention, see <http://standards.freedesktop.org/icon-naming-spec/icon-naming-spec-latest.html>.
			- the argument alt is optional but highly recommanded for usability.

		See Also:
			<libD.getIcon>
	*/
	libD.iconIMG = function (icon, alt, iconSize, iconPack) {
		var img = document.createElement("img");
		img.alt = img.title = alt || "";
		img.src = libD.getIcon(icon, iconSize, iconPack);
		return img;
	};

	/*
		Function:need
			Make modules given in argument available and then call the callback.

		Parameters:
			modules  - Array containing names of the modules you need. e.g. : ["wm", "fx"]
			callback - the function to call when modules are loaded
			context  (optional) - "this" for your function. Default : this (often window)
			argv (optional) - array of arguments which should be given to your function when called

		See Also:
			<libD.getModule>
			<libD.getJS>
			<libD.unloadModule>
			<libD.moduleLoaded>
		Note:
			There are some fake modules that can be used:
			 - "ready": this module is "loaded" when/if the page is ready for DOM manipulations (when DOMContentLoaded is fired)
			 - "load": this module is "loaded" when/if the page is completely loaded (window's load event)

			 These modules are guaranteed to be loaded even if the browser doesn't support the DOMContentLoaded event / libD is loaded after the page is ready/loaded.
	*/

	libD.need = function (modules, callback, context, argv) {
		if (!context) {
			context = this;
		}

		if (!argv) {
			argv = [];
		}

		var needs = {}, nDependencies = 0;

		for (var i = 0, len = modules.length; i < len; ++i) {
			if (!libD.modulesLoaded[modules[i]]) {
				if (!needs[modules[i]]) {
					needs[modules[i]] = true;
					++nDependencies;
				}

				if (libD.modulesLoaded[modules[i]] !== false && modules[i].charAt(0) !== "*") {
					// modules starting with "*" are third party script.
					// libD can handle them but not load them automatically.
					if (libD.pendingDomReady || libD.domReady) {
						libD.getModule(modules[i]);
					} else {
						libD.ready(libD.getModule.bind(that, modules[i]));
					}
				}
			}
		}

		if (nDependencies) {
			libD.waitingForModules.push({
				needs: needs,
				context: context,
				callback: callback,
				argv: argv,
				nDependencies: nDependencies
			});
		} else {
			callback.apply(context, argv);
		}
	};

	/*
		Function: moduleLoaded
			modules using the libD's Modules Infrastructure must call this function when they are ready.
		Parameter:
			module - the name of the module

		Note:
			Modules that are not part of libD should begin their name with a star (*).
			libD Apps should begin their name with "*app.". (like: "*app.imageViewer")
	*/
	libD.moduleLoaded = function (module) {
		libD.modulesLoaded[module] = true;
		for (var W, i = 0, w = libD.waitingForModules, len = w.length, tmpLen; i < len; ++i) {
			W = w[i];
			if (W.needs[module]) {
				delete W.needs[module];
				if (!--W.nDependencies) {
					w.splice(i, 1);
					try {
						W.callback.apply(W.context, W.argv);
					} catch (e) {
						console.error(e);
					}

					tmpLen = w.length;
					if (tmpLen < len - 1) {
						i = -1; // callback resolved dependencies ; recheck all waiting functions.
					} else {
						--i;
					}
					len = tmpLen;
				}
			}
		}
	};

	/*
		Function: unloadModule
			Make libD forget about a module. Useful to force a module reload.
		Parameter:
			module - the name of the module

		Note:
			This function is still not supported
	*/
	libD.unloadModule = function (module) {
		delete libD.modulesLoaded[module];
	};

	/*
		Value: waitingForModules
			Array of functions that are waiting for some modules to load.
	*/
	libD.waitingForModules = [];

	/*
		Value: cssLoaded
			Array of style that were loaded with <libD.cssLoad>.
	*/
	libD.cssLoaded = [];

	if (!libD.modulesLoaded) {
		libD.modulesLoaded = {
			l10n: true,
			ready: false,
			load: false,
			listenerSystem: true,
			json: true,
			domEssential: true,
			history: history.pushState ? true : undefined
		};

		if (typeof JSON === "undefined") {
			delete libD.modulesLoaded.json;
		}
	}

	//ready and load are metapackages. They are present when the page is ready / loaded.
	//You can depend on them to have your function executed when the page is ready/loaded

	libD.styles = {};

	/*
	 Value: domReady
		if the document is ready, true, false otherise. In case libD is run outside a browser, this value is set to true by <libD._domIsReady>.
	*/

	libD.domReady = false;

	if (!that.document) {
	/*
	 Value: loadFired
		if the page is loaded, true, false otherise. If libD is run outside a browser, this value is set to true.
	*/
		libD.loadFired = true; // not in a navigator
	} else {
		libD.loadFired = document.readyState === "complete";
	}

	if (libD.loadFired) {
		libD._domIsReady();
		libD.moduleLoaded("load");
	} else {
		window.addEventListener("load", function () {
			if (!libD.domReady) {
				libD._domIsReady();
			}

			libD.loadFired = true;
			libD.moduleLoaded("load");
		}, false);
	}
	/*
		Value: jsPath
			Defines the place libD has to hit to load javascript files (see <libD.jsLoad>.
			Default: "/share/js/".
	*/
	if (!libD.jsPath) {
		libD.jsPath = "/share/js/"; // default js path. Mind the "/" at the end.
	}

	/*
	 Contant: majorVersion
		libD's major version, as string. For the version of libD you are exploring, it is set to "1.1".
	*/
	libD.majorVersion = "1.1";

	/*
		Value: path
			Defines the place where libD is located.
			Default:
				- the actual path from where libD was loaded if libD succeeds in determining it
				- <libD.jsPath> + "libD/" + <libD.majorVersion> + "/" otherwise
	*/
	if (!libD.path) {
		libD.path = libD.jsPath + "libD/" + libD.majorVersion + "/"; // if libD doesn't manage to determine where it is stored, default value.
	}

	/*
		Value: appPath
			Defines the place where libD Apps are located. Default: <libD.jsPath> + "apps/".
	*/
	if (!libD.appPath) {
		libD.appPath = libD.jsPath + "apps/"; // default libD.app path. Mind the "/" at the end.
	}

	/*
		Value: theme
			The default theme used by concerned libD's various modules. Default: "default".
			themes are usually located in <libD.path> + "css/"
	*/
	if (!libD.theme) {
		libD.theme = "default";
	}

	/*
		Value: iconPack
			The default icon pack to use, when needed. Third party scripts / apps using libD are encouraged to use this value for integration matters.
	*/
	if (!libD.iconPack) {
		libD.iconPack = "/share/icons/oxygen/";
	}

	/*
		Value: iconSize
			The default icon size to use, when needed. Third party scripts / apps are encouraged to use this value as a fallback.
	*/
	if (!libD.iconSize) {
		libD.iconSize = "22x22";
	}

	/*
	 Contant: pathWasGuessed
	 If libD actually succeeded in finding it's location, this value is set to true. False otherwise.
	*/
	libD.pathWasGuessed = false;

	(function () { // Here we try to determine where the libD is stored (sets libD.path).
	  // if it fails, set it manually after loading libD's core.js. (not in libD.ready or window.onload)
		if (!that.document) {
			return;
		}

		var scripts = document.getElementsByTagName("script");
		var len = scripts.length, i = len - 1;

		while (i > -1) {
			if (scripts[i].src.match("libD/" + libD.majorVersion.replace(/\./g, "\\.") + "/core\\.js")) {
				break;
			}
			--i;
		}

		if (i === -1) {
			return;
		}

		libD.path = scripts[i].src.replace(/core\.js$/, "");
		libD.pathWasGuessed = true;

	}());


	/*
	 Function: objMerge
		Concatenate the two objects passed in argument inside the first. This function thus modifies its first parameter.

		Parameters:
			o1 - first object
			o2 - second object

		Returns:
			o1, after the concatenation
	*/
	libD.objMerge = function (o1, o2) {
		for (var i in o2) {
			if (o2.hasOwnProperty(i)) {
				o1[i] = o2[i];
			}
		}
		return o1;
	};

	/*
	 Function: objCat
		Concatenate the two objects passed in argument.

		Parameters:
			o1 - first object
			o2 - second object
	*/

	libD.objCat = function (o1, o2) {
		return libD.objMerge(libD.objMerge({}, o1), o2);
	};

	/*
	 Function: objCopy
		Copies an object or an array.

		Parameters:
			o - the object to copy
			noRecursive - (optional) if given and true, the copy won't be
			                         recursive
	*/
	libD.objCopy = function (o, noRecursive) {
		if (typeof o === "object") {
			var res = o instanceof Array ? [] : {};

			for (var i in o) {
				if (o.hasOwnProperty(i)) {
					res[i] = noRecursive ? o[i] : libD.objCopy(o[i]);
				}
			}

			return res;
		}

		return o;
	};

	/*
		Function: inherit
			Makes a class inherit from a parent class.

		Parameters:
			constructor - the constructor of your class
			parentConstructor - The parent class' constructor
			prototype (optional) - an object containing methods to add to the prototype of the class.
	*/

	libD.inherit = function (constructor, parentConstructor, prototype) {
		constructor.prototype = Object.create(parentConstructor.prototype);
		constructor.prototype.constructor = constructor;

		if (prototype) {
			libD.objMerge(constructor.prototype, prototype);
		}
	};

	// PACKAGE : domEssential

	/*
	 Function: previousElementSibling
		n.previousElementSibling in all browsers
		Parameter:
			n - the node to get the previousElementSibling.
	 Note:
		libD.previousSibling is deprecated.
	*/
	libD.previousElementSibling = libD.previousSibling = function (n) {
		if (n.previousElementSibling) {
			return n.previousElementSibling;
		}

		var pS = n.previousSibling;

		while (pS !== null && pS.nodeType !== 1) {
			pS = pS.previousSibling;
		}

		return pS;
	};

	/*
	 Function: nextElementSibling
		n.nextElementSibling in all browsers
		Parameter:
			n - the node to get the nextElementSibling.
	 Note:
		libD.nextSibling is deprecated.
	*/
	libD.nextElementSibling = libD.nextSibling = function (n) {
		var nS = n.nextSibling;

		while (nS !== null && nS.nodeType !== 1) {
			nS = nS.nextSibling;
		}

		return nS;
	};

	/*
	 Function: firstElementChild
		n.firstElementChild in all browsers
		Parameter:
			n - the node to get the firstElementChild.
	 Note:
		libD.firstChild is deprecated.
	*/
	libD.firstElementChild = libD.firstChild = function (n) {
		var fC = n.firstChild;

		while (fC !== null && fC.nodeType !== 1) {
			fC = fC.nextSibling;
		}

		return fC;
	};

	/*
		Function: replaceClass
			Replace the class f to n from o : if o has the class f, it will be replaced by n.

		Parameters:
			o - The DOM element to modify
			f - The class to replace
			n - The new class
	*/
	libD.replaceClass = function (o, f, n) {
		if (o.classList.contains(f)) {
			o.classList.remove(f);
			o.classList.add(n);
		}
	};

	/*
		Function: getStyle
			Get the actual (currently used) value of a CSS property for the given element.

		Parameters:
			o - the DOM element
			property - (optional) the CSS property as string, writen as in a CSS file.

		Notes:
			for the "float" property, both "float" and "cssFloat" work.
			If property is not given, the entire style collection is returned.

		Returns:
			The value of the property if property was given, or what getComputedStyle returns otherwise.

			In browsers that don't support o.currentStyle (The IE way), the style object returned by getComputedStyle is "cached" in o.currentStyle. However, this is not a behavior you should rely on if you want your script to be forward-compatible.

	*/
	libD.getStyle = function (o, property) {
		var styleObj = (
			o.currentStyle || (
				o.currentStyle = document.defaultView.getComputedStyle(o, null)
			)
		);

		if (property) {
			return (
				(property === "float")
					? (styleObj.cssFloat || o.currentStyle.styleFloat)
					: styleObj[property]
			);
		}

		return styleObj;
	};

	// PACKAGE : listenerSystem

	/*
	 Function: setListenerSystem
		Make an object able to trigger events. This sets addListener and removeListener method on the object to allow monitoring events of the object. In short, makes an object follow the node.js' EventEmitter API (http://nodejs.org/api/events.html), without 'error', 'newListener' and 'removeListener' EventEmitter's events (might be supported in the future, don't use them).

		Parameter:
			o - the object to "eventize".

		Returns:
			Nothing.

		Usage:
			You want to make instances of your class MyClass event-enabled :
			> var MyClass = function ()
			> {
			> 	// ...
			> };

			> MyClass.prototype =
			> {
			> 	// ...
			> };

			All you have to do is calling libD.setListenerSystem on your instance and storing the result somewhere. A convenient way to do this is to call setListenerSystem in the constructor of your class:

			> var MyClass = function ()
			> {
			> 	// ...
			>
			> 	libD.setListenerSystem(this, MyClass.prototype); // the second parameter is optional but recommanded, so methods of the listener system are shared between instances.
			> };

			In the methods of your class, you can call this._trigger("myEvent") to trigger an event.
			Now, let's create an instance of your class.

			> var myInstance = new MyClass();

			The script that created the instance needs to monitor your event "myEvent". addListener is available on your instance and ready to be used:

			> myInstance.addListener("myEvent", callback);

			Callback we be called whenever you fire "myEvent".
			If the script that created myInstance needs the callback to be called within a certain context (let's say the instance belong to an instance of another class we will call Host), this is also possible:

			> myInstance.addListener("myEvent", callback, Host);

			Here, the "this" object will refer to Host for the callback function.

			Now, you want to share data relative to the event with the callback function when it is fired. It is possible by passing an arguments that will be applied to the callback function when you fire the event:

			> this.emit("myEvent", arguments_to_pass_to_the_callback_function, ...);

			The callback function will receveive elements of array_of_arguments_to_pass_to_the_callback_function as arguments when it is called.

			Now, the script doesn't need to monitor the event anymore. A call to the removeListener method of the instance with the exact same arguments as those of addEventListener will do the job:

			> myInstance.removeListener("myEvent", callback, Host);


			= Example:
			Let's say we have a Despertador class that is used to conceive alarm clocks.
			It has:
			 - a setAlam method to set the "ringing time"
			 - a snooze  method to stop the alarm temporarly and make the alarm ring again in ten minutes.
			 - a stopAlarm method to stop the alarm definitively

			Users of the Despertador class can access to these events:
			 - "snooze" : The sleeper called the snooze method
			 - "alarmStop" : the sleeper definitively stopped the alarm. The user of the class has to know how many time the sleeper used the snooze function.
			 - "alarmSet" : The sleeper set the alarm time
			 - "alarmStart" : the alarm starts ringing.

			> function Despertador()
			> {
			> 	this.nbSnooze = 0; // the number of time the user pressed the snooze button. Private.
			> 	this.ringing = false; // the alarm clock is not ringing
			> 	libD.setListenerSystem(this, Despertador.prototype); // you would initialize the event system here.
			> 	// [code to make the alarm clock work]
			> }
			>
			> Despertador.prototype = {
			> 	setAlam : function (hours, minutes)
			> 	{
			> 		this.hours = hours;
			> 		this.minutes = minutes;
			> 		this._tiggrer("alarmSet"); // the event is triggered without any data
			>	},
			>
			> 	snooze : function ()
			> 	{
			> 		if (this.ringing)
			> 		{
			> 			this.ringing = false;
			> 			this.nbSnooze++;
			> 			this._tiggrer("snooze", [nbSnooze]); // the event snooze is fired with the number of snoozes the user did, this one included
			> 			// [code to make the alarm clock ring in ten minutes]
			> 		}
			> 	},
			>
			> 	stopAlarm : function ()
			> 	{
			> 		if (this.ringing || this.nbSnooze)
			> 		{
			> 			this.ringing = false;
			> 			this._tiggrer("alarmStop", [nbSnooze]); // the event alarmStop is fired with the number of snoozes it took to the user to stop the alarm.
			> 			this.nbSnooze = 0;
			> 		}
			> 	}
			> };

			Now we need to know if our child is lazy.

			> var despertador_of_my_child = new Despertador; // instance of Despertador
			> // [we bind the instance of Despertador to a real alarm clock and give it to the child]
			>
			> despertador_of_my_child.addListener("alarmStop", function (nb_snooze)
			> {
			> 	if (nb_snooze > 3)
			> 		alert("My child is lazy");
			> 	else
			> 		alert("The early bird catches the worm");
			> }); // we monitor the alarmStop event and use the data given
			>
			> despertador_of_my_child.setAlam(6, 30); // alarm should ring at 6:30am. Here the alarmSet event is fired but not caught.
		Notes:
			events are specific to each instance of the class, the prototype is only affected if you pass it as a second parameter of setListenerSystem, in which case addListener, removeListener and others methods for handling events will belong to the prototype of the object.

	*/
	libD.setListenerSystem = function (o, prototype) {
		o._libDListeners = {};

		if (!prototype) {
			prototype = o;
		}

		if (!prototype.addListener) {
			prototype.addListener = prototype.on = libD._listenerSystem.addListener;
			prototype.once = libD._listenerSystem.once;
			prototype.removeListener = libD._listenerSystem.removeListener;
			prototype.removeAllListeners = libD._listenerSystem.removeAllListeners;
			prototype.emit = libD._listenerSystem.emit;
		}
	};

	libD._listenerSystem = {
		addListener: function (event, callback) {
			if (!this._libDListeners[event]) {
				this._libDListeners[event] = [];
			}

			this._libDListeners[event].push([callback, false]);
		},

		once: function (event, callback) {
			if (!this._libDListeners[event]) {
				this._libDListeners[event] = [];
			}

			this._libDListeners[event].push([callback, true]);
		},

		removeListener: function (event, callback) {
			var lt = this._libDListeners[event];

			if (!lt) {
				return;
			}

			var i = 0, len = lt.length;
			while (i < len) {
				if (lt[i][0] === callback) {
					while (i + 1 < len) {
						lt[i] = lt[++i];
					}

					lt.splice(i, 1);
					return;
				}
				++i;
			}
		},

		removeAllListeners: function (event) {
			if (event === undefined) {
				this._libDListeners = {};
			} else {
				delete this._libDListeners[event];
			}
		},

		emit: function (event, a1, a2) {
			var lt = this._libDListeners[event];

			if (!lt) {
				return;
			}

			for (var i = 0, len = lt.length; i < len; ++i) {
				if (lt[i]) {
					try {
						switch (arguments.length) {
							case 1:
								lt[i][0].call(this);
								break;
							case 2:
								lt[i][0].call(this, a1);
								break;
							case 3:
								lt[i][0].call(this, a1, a2);
								break;
							default:
								[].shift.call(arguments);
								lt[i][0].apply(this, arguments);
								break;
						}
					} catch (e) {
						console.error(e);
					}

					if (lt[i][1]) {
						libD._listenerSystem.removeListener.call(this, event, lt[i][0]);
					}
				}
			}
		}
	};

    libD.signal = function () {
        return new libD.Signal();
    };

    libD.Signal = function () {
        this.listeners = new Set();
        this.signalListeners = new Set();
    };

    (function () {
        function e(args, f) {
            f.apply(that, args);
        }

        function es(args, s) {
            s.emit.apply(s, args);
        }

        libD.Signal.prototype.emit = function () {
            this.listeners.forEach(e.bind(null, arguments));
            this.signalListeners.forEach(es.bind(null, arguments));
        };
    }());

    libD.Signal.prototype.connect = function (f) {
        if (f instanceof libD.Signal) {
            this.signalListeners.add(f);
        } else {
            this.listeners.add(f);
        }
    };

    libD.Signal.prototype.disconnect = function (f) {
        if (f instanceof libD.Signal) {
            this.signalListeners.remove(f);
        } else {
            this.listeners.remove(f);
        }
    };


	// PACKAGE : l10n
	/*
	Function: l10n
		LibD's little localization tool. Returns a function (named here the localization function) that can be called is two ways.

	Notes:
		libD.l10n uses the global value libD.lang. Changing it will make libD.l10n use the new language on the fly.
		libD.l10n is NOT a constructor. Don't call it will "new".

	Usage:
		> var _ = libD.l10n();

		> _("lang", "hard-coded string", "translation in the lang 'lang'")
			Will register a new translation for the given string in the given language

		> _("Hard coded string")
			Will return the localized string or the hard-coded string itself

		In fact, "hard-coded string" can be anything that can be used as a Javascript Array index.
		Strings are good for that ; you should never use anything other that strings containing real sentences because it will be used as fallback if no translation is found.
		Ideally, use (one of) the most usual language(s) of your world that is Unicode compliant.
		e.g Earthmen/women, in 2012, you can use English.

		Obviously you can also choose your native language especially if the majority
		of the people who will use your app speak this language, if you don't speak any major language of your world or if you're anti-{put the name of the most usual language of your world}.
	*/
	libD.l10n = function () {
		var t = [];

		var f = function (lang, orig, translated) {
			if (!orig) {
				return (
					(libD.lang && t[libD.lang] && t[libD.lang][lang])
						? t[libD.lang][lang]
						: lang // lang is the default string
				);
			}

			if (!t[lang]) {
				t[lang] = [];
			}

			t[lang][orig] = translated;
		};

		return f;
	};

	libD._ajaxResponse = function (xhr, o, e) {
		if (xhr.readyState === 4) {
			var error = o.error || o.fail;
			if (!xhr.status || xhr.status === 200) {
				var success = o.success || o.done;
				if (success) {
					try {
						var a = xhr.responseText;
						var contentType = o.dataType || xhr.getResponseHeader('Content-Type');
						switch (contentType) {
							case "text":
							case "html":
							case "text/html":
							case "text/plain":
								break;
							case "script":
								eval(a);
								break;
							case "json":
							case "application/json":
								a = JSON.parse(a);
								break;
							case "xml":
							case "application/xml":
							case "application/xhtml+xml":
							case "image/svg+xml":
								a = xhr.responseXML;
								break;
						}

						if (o.checkFail) {
							if (o.checkFail(a, xhr.statusText, xhr)) {
								error(xhr, xhr.statusText, true);
								return;
							}
						}

						success(a, xhr.statusText, xhr);
					} catch (err) {
						if (error) {
							error(xhr, xhr.statusText, false, e);
						}
					}
				}
			} else {
				if (error) {
					error(xhr, xhr.statusText, false);
				}
			}
		}
	};

	libD.ajax = function (a1, a2) {
		var url = typeof a1 === "string" ? a1 : a1.url;
		var o = a2 || (typeof a1 !== "string" && a1) || {};
		var xhr = new XMLHttpRequest();
		var data = o.data || "";
		var processData = (
			(o.processData === undefined)
				? (
					(
						typeof data === "string"
						|| data instanceof Document
						|| data instanceof FormData
					)
						? false
						: true
				)
				: o.processData
		);

		xhr.open(o.type || "GET", url, o.async !== undefined ? o.async : true);

		if (o.contentType || processData || typeof data === "string") {
			xhr.setRequestHeader("Content-Type", o.contentType || "application/x-www-form-urlencoded");
		}

		xhr.setRequestHeader("Content-Length", data.length);

		if (o.headers) {
			for (var i in o.headers) {
				if (o.headers.hasOwnProperty(i)) {
					xhr.setRequestHeader(i, o.headers[i]);
				}
			}
		}

		var sent;
		if (processData) {
			sent = "";
			for (var field in data) {
				sent += (
					(sent ? "&" : "")
					+ encodeURIComponent(field)
					+ "="
					+ encodeURIComponent(data[field])
				);
			}
		} else {
			sent = data;
		}

		xhr.onreadystatechange = libD._ajaxResponse.bind(xhr, xhr, o);
		xhr.send(sent);
	};

	/*
	Function: format
		Format arguments into a string. This function is there to ease translations.

	Usage:
		> var actualString = libD.format("My name is {0} and I'm {1}", Roger, 42); // returns "My name is Roger and I'm 42";

	Notes:
		thx http://stackoverflow.com/questions/1353408/messageformat-in-javascript-parameters-in-localized-ui-strings
	Returns:
		The formatted string.
	*/

	libD.format = function (s) {
		var args = arguments;

		return s.replace(/\{(\d+)\}/g, function () {
			return args[(parseInt(arguments[1]) || 0) + 1];
		});
	};

	/*
	 Value: lang
	 Defines the language to use in scripts using libD and supporting localization. See <libD.l10n> for a convenient way to support localization in your app. Default: the navigator's language, or "en" otherwise.
	*/
	libD.lang = (
			that.navigator && (
				(navigator.language || navigator.userLanguage)
					? (navigator.language || navigator.userLanguage).split("-")[0].toLowerCase()
					: "en"
			)
		) || "en";

	libD.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
	                               window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

	if (libD.requestAnimationFrame) {
		libD.requestAnimationFrame = libD.requestAnimationFrame.bind(window);
	}

	libD.cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame ||
	                               window.webkitCancelAnimationFrame || window.msCancelAnimationFrame;

	if (libD.cancelAnimationFrame) {
		libD.cancelAnimationFrame = libD.cancelAnimationFrame.bind(window);
	}

	if (libD.needs) {
		libD.need(libD.needs[0], libD.needs[1]);
		delete libD.needs;
	}

	// shims

	if (!Function.prototype.bind) {
		// thx https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind
		Function.prototype.bind = function(oThis) {
			if (typeof this !== "function") {
				throw new TypeError("Function.prototype.bind: object is not callable");
			}

			var s       = [].slice,
			    aArgs   = s.call(arguments, 1),
			    fToBind = this,
			    fNOP    = function() {},
			    fBound  = function() {
			        return fToBind.apply(this instanceof fNOP && oThis
			            ? this
			            : oThis,
				        aArgs.concat(s.call(arguments)));
				};

			fNOP.prototype = this.prototype;
			fBound.prototype = new fNOP();

			return fBound;
		};
	}

	libD.ie = (function() {
		// thx http://stackoverflow.com/a/16657946
		var ua = navigator.userAgent;
		var msie = ua.indexOf("MSIE ");
		var v = false;

		if (msie > 0) {
			// IE < 11
			v = parseInt(ua.substring(msie + 5, ua.indexOf(".", msie)), 10);
		} else if (ua.indexOf("Trident/") > 0) {
			// IE 11+
			var rvNum = ua.indexOf("rv:");
			v = parseInt(ua.substring(rvNum + 3, ua.indexOf(".", rvNum)), 10);
		}

		if (v) {
			if (!libD.dontFixSetTimeout) {
				var fix = function (f) {
					var fu = window[f].bind(window);
					window[f] = function (callback, time) {
						if (arguments.length < 3 || typeof callback === "string") {
							return fu(callback, time);
						}

						return fu(fu.apply.bind(callback, window, [].slice.call(arguments, 2)), time);
					};
				};

				fix("setTimeout");
				fix("setInterval");
			}

			if (v < 10 && !libD.dontFixResponseXML) {
				Object.defineProperty(
					XMLHttpRequest.prototype,
					"responseXML", {
						enumerable: false,
						configurable: false,
						get: function () {
							return new DOMParser().parseFromString(
								this.responseText,
								this.getResponseHeader("Content-Type").split(";")[0] || "text/xml"
							);
						}
					}
				);
			}
		}

		return v;
	}());
}(this));
