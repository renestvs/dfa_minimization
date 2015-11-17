/*kate: tab-width 4; space-indent on; indent-width 4; replace-tabs on; eol unix; */
/*
    Copyright (c) Raphaël Jakse (Université Joseph Fourier), 2013

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/


/*jslint browser: true, ass: true, indent: 4, nomen:true, vars:true, newcap:true, plusplus:true, regexp: true */
/*jshint multistr:true*/
/*eslint-env browser*/
/*eslint no-underscore-dangle:0, no-alert:0*/
/*global Set:false, FileReader:false, libD:false, automataDesigner:false, Automaton:false, automataMap:false, MathJax:false, Viz:false, automaton2dot:false, HTMLElement:false, js18Supported: false, audescript:false, getFile:false, automaton2dot_standardizedString:false, saveAs:false, Blob:false, automaton_code, listenMouseWheel:false, aceEditor:false, automataDesignerGlue:false, read_automaton:false, automataAreEquivalent:false, regexToAutomaton:false, object2automaton:false, epsilon*/

// NEEDS : automataDesigner.js, automata.js, saveAs, automaton2dot.js, automataJS.js

(function () {
    "use strict";

    var enableAutoHandlingError = false,
        automatonResult         = null,
        deferedResultShow       = false,
        freader                 = new FileReader(),
        resultToLeft            = document.createElement("button"),
        zoom                    = {svgZoom: 1},
        loadingProgNot          =  null,
        automatonCount          = 0,
        automataList            = [],
        salc_cur_automaton      = -1,
        automataListClose,
        automataListIntro,
        automataListDiv,
        automataListBtn,
        automataListUL,
        automatoncodeedit,
        automatonFileName,       //= "automata", //This var was setted by the Automaton Project
        programFileName,
        resultsContent,
        automataNumber,
        resultsConsole,
        fileautomaton,
        svgContainer,
        fileprogram,
        offsetError,
        loadingViz,
        switchmode,
        startQuiz,
        filequiz,
        leftPane,
        splitter,
        codeedit,
        curAlgo,
        results,
        content,
        toolbar,
        open,
        quiz,
        head,
        not,
        sw,
        aceEditor;

    // This function was created by Automaton Project Team 
    function post(path, params, method) {
        method = method || "post"; // Set method to post by default if not specified.

        // The rest of this code assumes you are not using a library.
        // It can be made less wordy if you use one.
        var form = document.createElement("form");
        form.setAttribute("method", method);
        form.setAttribute("action", path);
        
        console.log(params);

        for(var key in params) {
            if(params.hasOwnProperty(key)) {
                var hiddenField = document.createElement("input");
                hiddenField.setAttribute("type", "hidden");
                hiddenField.setAttribute("name", key);
                hiddenField.setAttribute("value", params[key]);
                form.appendChild(hiddenField);
             }	
        }
        
        document.body.appendChild(form);
        form.submit();
    }
    
    function viz(code, callback) {
        if (window.Viz) {
            if (loadingViz) {
                loadingViz.close(true);
                loadingViz = null;
            }
            callback(window.Viz(code, "svg"));
        } else {
            if (!loadingViz) {
                loadingViz = libD.notify({
                    type: "info",
                    content: _("Loading Graphviz, the code whith draws automata"),
                    title: _("Wait a second..."),
                    closable:false
                });
            }

            var args = arguments;
            setTimeout(
                function () {
                    viz.apply(window, args)
                },
                500
            );
        }
    }
    
    audescript.console = {
        logg: function (type, printed) {
            var line = document.createElement("div");
            line.className = "console-line " + type;
            for (var i = 0; i < printed.length; i++) {
                line.appendChild(document.createTextNode(printed[i]));
            }
            resultsConsole.appendChild(line);
        },

        log: function () {
            audescript.console.logg("log", arguments);
        },

        error: function () {
            audescript.console.logg("error", arguments);
        },

        warn: function () {
            audescript.console.logg("warning", arguments);
        }
    };

    window.audeGui = {l10n: libD.l10n()};
    var _ = window.audeGui.l10n;

    function audescript2js(code, moduleName, fileName, data) {
        var res = audescript.toJS(code, moduleName, fileName);
        data.includes = res.neededModules;
        return babel.transform(
            "(function (run, get_automaton, get_automata, currentAutomaton) {" +
            res.code + "})", {retainLines: true}
        ).code;
    }

     function run(fun, g, f) {
        resultsConsole.textContent = "";
        if (fun === get_automata) {
            get_automata(g, function () {
                setResult(f.apply(this, arguments));
            });
        } else {
            setResult(fun.apply(window, [].slice.call(arguments, 1)));
        }
    };

    automataDesigner.getValueFunction = function (s) {
        try {
            var v = aude.getValue(s, automataMap);
            return v;
        } catch (e) {
            return s;
        }
    };

    automataDesigner.getStringValueFunction = function (s) {
        try {
            aude.getValue(s, automataMap); // s is a legal value
            return s;
        } catch (e) {
            return JSON.stringify(s); // turn into string
        }
    };

    function notify(title, content, type) {
        if (!libD.Notify) {
            libD.need(["notify"], function () {
                notify(title, content, type);
            });
            return;
        }

        if (!not || !not.displayed) {
            not = new libD.Notify({closeOnClick: true});
        }

        not.setTitle(title);
        not.setDescription(content);
        not.setType(type);
    }

    function splitterMove(e) {
        var width = document.body.offsetWidth;
        splitter.style.left = (e.clientX * 100 / width) + "%";
        leftPane.style.right = ((width - e.clientX) * 100 / width) + "%";
        results.style.left =  ((e.clientX + sw) * 100 / width) + "%";
        automataDesigner.redraw();
        if (zoom.redraw) {
            zoom.redraw();
        }
    }

    function onResize() {
        var width = document.body.offsetWidth;

        if (sw) {
            results.style.left =  ((splitter.offsetLeft + sw) * 100 / width) + "%";
        }

        automataDesigner.redraw();

        if (zoom.redraw) {
            zoom.redraw();
        }
    }

    function enableResults() {
        if (!sw) {
            if (switchmode.value === "program") {
                deferedResultShow = true;
                return;
            }
            results.classList.remove("disabled");
            splitter.classList.remove("disabled");
            sw = splitter.offsetWidth;
            splitterMove({clientX: splitter.offsetLeft});
            automataDesigner.userZoom(zoom);
            zoom.enable();
            onResize();
        }
    }

    function cleanResults() {
        resultToLeft.style.display = "none";
        resultsContent.textContent = "";
    }

    var katexAutorenderOpts = {
        delimiters: [
            {left: "$$",  right: "$$",  display: true},
            {left: "$",   right: "$",   display: false},
            {left: "\\[", right: "\\]", display: true},
            {left: "\\(", right: "\\)", display: false}
        ]
    };

    function textFormat(text, node, html) {
        if (!node) {
            node = document.createElement("span");
        }

        node[html ? "innerHTML" : "textContent"] = text instanceof Array ? text.join("") : text;

        renderMathInElement(node, katexAutorenderOpts);
        return node;
    }

    function setTextResult(t, dontNotify) {
        automatonResult = null;
        enableResults();
        var res = document.createElement("pre");
        res.textContent = t;
        cleanResults();
        resultsContent.appendChild(res);
        if (!dontNotify) {
            if ((not && not.displayed) || !codeedit.classList.contains("disabled")) {
                notify(_("Program Result"), res.cloneNode(true), "normal");
            }
        }
    }

    function setNodeResult(n, dontNotify) {
        automatonResult = null;
        enableResults();
        cleanResults();
        resultsContent.appendChild(n);
        if (!dontNotify) {
            if ((not && not.displayed) || !codeedit.classList.contains("disabled")) {
                notify(_("Program Result"), n.cloneNode(true), "normal");
            }
        }
    }

    function automaton2svg(A, callback) {
        viz(
            automaton2dot(A),
            function (result) {
                callback(result.replace(/<\?[\s\S]*?\?>/g, "").replace(/<![\s\S]*?>/g, ""));
            }
        );
    }

    function setAutomatonResult(A) {
        enableResults();
        automatonResult = A;
        automaton2svg(
            A,
            function (svgCode) {
                resultsContent.innerHTML = svgCode;
                resultToLeft.style.display = "";

                if (
                    (not && not.displayed) ||
                    !codeedit.classList.contains("disabled")
                ) {
                    notify(_("Program Result"), svgCode, "normal");
                }

                zoom.svgNode = resultsContent.querySelector("svg");

                if (zoom.redraw) {
                    zoom.redraw();
                }
            }
        );
    }

    function setResult(res) {
        if (res instanceof Automaton) {
            setAutomatonResult(res);
        } else if (HTMLElement && res instanceof HTMLElement) {
            setNodeResult(res);
        } else if (res) {
            if (typeof res === "object" && !(res instanceof Object)) {
                setTextResult(Object.prototype.toString.call(res));
            } else {
                setTextResult(res.toString());
            }
        } else {
            if (res === undefined) {
                setTextResult("undefined");
            } else if (res === null) {
                setTextResult("null");
            } else {
                setTextResult(res);
            }
        }

        var svg = resultsContent.getElementsByTagName("svg")[0];
        if (svg) {
            zoom.svgNode = svg;
            results.style.overflow = "hidden";

            if (zoom.redraw) {
                zoom.redraw();
            }
        } else {
            zoom.svgNode = null;
            if (zoom.disable) {
                zoom.disable();
            }
            results.style.overflow = "";
        }
    }

    function openAutomaton(code) {
        if (typeof code === "string") {
            automatoncodeedit.value = code;
            automataDesigner.setAutomatonCode(automatoncodeedit.value, automataDesigner.currentIndex);
            return;
        }

        freader.onload = function () {
            openAutomaton(freader.result);
        };

        freader.readAsText(fileautomaton.files[0], "utf-8");
        automatonFileName = fileautomaton.value;
    }

    function loadQuiz(code) {
        try {
            startQuiz(JSON.parse(code));
        } catch (e) {
            notify(_("Loading the quiz failed"), (libD.format(_("The quiz seems to be malformed: {0}"), e.message, "error")));
            throw e;
        }
    }

    function openProgram(code) {
        if (typeof code === "string") {
            aceEditor.setValue(code);
            return;
        }

        freader.onload = function () {
            openProgram(freader.result);
        };

        freader.readAsText(fileprogram.files[0], "utf-8");
        programFileName = fileprogram.value;
    }

    function handleError(message, line, stack, char) {
        var errorText  = message + (
                stack ? _("\nStack trace: \n") + stack
                      : ""
            ),
            errorTitle;

        if (char) {
            errorTitle = libD.format(_("Error on line {0}, character {1}"), line, char);
        } else {
            errorTitle = libD.format(_("Error on line {0}"), line);
        }

        notify(errorTitle, errorText.replace(/\n/g, "<br />").replace(/ {2}/g, "  "), "error");
        setTextResult(errorTitle + "\n" + errorText, true);
    }

    window.onselectstart = window.ondragstart = function (e) {
        e.preventDefault();
        return false;
    };

    if (!window.Viz && window.Module) { // Viz glue
        var gv = window.Module.cwrap("graphvizjs", "string", ["string", "string", "string"]);
        window.Viz = function (inputDot, outputFormat) {
            return gv(inputDot, "dot", outputFormat);
        };
    }

    if (!window.automataDesignerGlue) {
        window.automataDesignerGlue = {};
    }

    function callWithList(count, callback) {
        var k, automata = [];

        for (k = 0; k < count; ++k) {
            automata.push(get_automaton(automataList[k]));
        }

        /*jshint validthis: true */
        callback.apply(this, automata);
    }

    function automataListClick(e) {
        if (e.currentTarget.lastChild.textContent) {
            var j = parseInt(e.currentTarget.lastChild.textContent, 10);
            e.currentTarget.lastChild.textContent = "";
            automataList.splice(j, 1);

            var k, lastChild, l;

            for (l = 0; l < automatonCount; ++l) {
                lastChild = automataListUL.childNodes[l].firstChild.lastChild;
                k = parseInt(lastChild.textContent, 10);

                if (k >= j) {
                    lastChild.textContent = k - 1;
                }
            }
        } else {
            e.currentTarget.lastChild.textContent = automataList.length;
            automataList.push(e.currentTarget._index);
        }
    }

    function automataListMouseOver(e) {
        if (salc_cur_automaton !== -1) {
            automataDesigner.setCurrentIndex(e.currentTarget._index);
        }
    }

    function showAutomataListChooser(count, callback) {
        if (callback || automataListBtn.onclick) {
            automataListBtn.classList.remove("disabled");
            if (callback) {
                automataListIntro.innerHTML = libD.format(_("The algorithm you want to use needs {0} automata. Please select these automata in the order you want and click \"Continue execution\" when you are ready."), count);
                automataListBtn.onclick = function () {
                    if (automataList.length < count) {
                        window.alert(libD.format(_("You didn’t select enough automata. Please select {0} automata."), count));
                        return;
                    }
                    automataListClose.onclick();
                    automataListBtn.onclick = null;
                    callWithList(count, callback);
                };
            }
        } else {
            automataListBtn.classList.add("disabled");
            automataListIntro.textContent = _("You can choose the order in which automata will be used in algorithms.");
            count = 0;
        }

        automataListUL.textContent = "";
        var k, li, a, number, indexInList;

        for (k = 0; k < automatonCount; ++k) {
            li = document.createElement("li");
            a  = document.createElement("a");
            a.href = "#";
            a._index = k;
            indexInList = automataList.indexOf(k);
            number = document.createElement("span");
            number.className = "automaton-number";

            if (indexInList !== -1) {
                number.textContent = indexInList;
            }

            a.onclick = automataListClick;

            a.onmouseover = automataListMouseOver;

            a.appendChild(document.createElement("span"));
            a.lastChild.textContent = libD.format(_("Automaton #{0}"), k);
            a.appendChild(number);
            li.appendChild(a);
            automataListUL.appendChild(li);
        }

        automataListDiv.classList.remove("disabled");
    }


    function get_automaton(i) {
        if (isNaN(i)) {
            return undefined;
        }

        try {
            var A = automataDesigner.getAutomaton(i);
        } catch (e) {
            console.error(e);
            throw new Error(libD.format(_("get_automaton: automaton n°{0} could not be understood."), JSON.stringify(i)));
        }

        if (automataNumber <= i || !A) {
            throw new Error(libD.format(_("get_automaton: automaton n°{0} doesn’t exist or doesn’t have an initial state."), JSON.stringify(i)));
        }

        return A;
    };

    function get_automata(count, callback) {
        if (automataList.length < count) {
            showAutomataListChooser(count, callback);
        } else {
            callWithList(count, callback);
        }
    };


    var modules = {};
    var loadedModule = {};

    function loadModule(moduleName, callback) {
        if (modules[curAlgo.value]) {
            if (callback) {
                callback();
            }
            return;
        }

        if (loadedModule[moduleName]) {
            loadedModule[moduleName].push(callback);
            return;
        }

        loadedModule[moduleName] = [callback];

        getFile(
            "resources/util/" + moduleName + ".ajs?" + Date.now(),
            function (f) {
                loadAudescriptCode(moduleName, f, function (code) {
                    var m = loadedModule[moduleName];
                    while (m.length) {
                        (m.pop())();
                    }
                });
            },
            function (message, status) {
                if (message === "status") {
                    message = libD.format(
                        _("The file was not found or you don't have enough permissions to read it. (HTTP status: {0})"),
                        status
                    );
                }

                if (message === "send") {
                    message = _("This can happen with browsers like Google Chrome or Opera when using Aude locally. This browser forbids access to files which are nedded by Aude. You might want to try Aude with another browser when using it offline. See README for more information");
                }

                notify(
                    libD.format(
                        _("Unable to load module {0}"),
                        moduleName
                    ),
                    message,
                    "error"
                );
            }
        );
    }

    function loadIncludes(includes, callback) {
        for (var i = 0; i < includes.length; i++) {
            if (!modules[includes[i]]) {
                loadModule(
                    includes[i],
                    function () {
                        loadIncludes(includes, callback);
                    }
                );
                return;
            }

            if (!audescript.m(includes[i])) {
                loadLibrary(modules[includes[i]], includes[i]);
            }
        }

        if (callback) {
            callback();
        }
    }

    function loadLibrary(code, moduleName) {
        runProgramCode(
            code,
            moduleName || "<program>",
            libD.none,
            libD.none,
            libD.none
        );
    }

    function runProgram(code, moduleName) {
        if (loadingProgNot) {
            loadingProgNot.close(true);
        }

        runProgramCode(
            code,
            moduleName || "<program>",
            run,
            get_automaton,
            get_automata
        );
    }

    function launchPredefAlgo() {
        if (loadingProgNot) {
            loadingProgNot.close(true);
        }

        if (curAlgo.value === "id") {
            resultsConsole.textContent = "";
            post('dfa_minimizer/results', {automaton: automataDesigner.getAutomatonCode(automataDesigner.currentIndex, true)});
            //setResult(automataDesigner.getAutomaton(automataDesigner.currentIndex));
            return;
        } else {
            if (modules[curAlgo.value]) {
                post('dfa_minimizer/results', {automaton: automataDesigner.getAutomatonCode(automataDesigner.currentIndex, true)});
                //runProgram(modules[curAlgo.value], curAlgo.value);
            } else {
                loadingProgNot = libD.notify({
                    type: "info",
                    content: (_("Loading program, please wait...")),
                    closable: false,
                    delay: 500
                });

                loadModule(curAlgo.value, launchPredefAlgo);
            }
        }
    }

    function replaceStackLine(stackLine) {
        return stackLine.replace(/eval at .*\(.*\),[\s]+/, "").replace(/@(file|https?|ftps?|sftp):\/\/.+> eval:/, " ");
    }

    function cleanStack(stack) {
        var stackLines = stack.split("\n");
        var res = "";
//         var oldRes = "";
        for (var i = 0; i < stackLines.length; i++) {
            if (i === 0 && stackLines[0].match(/^[a-zA-Z]*Error:/)) {
                continue;
            }

            if (stackLines[i].match(/^[\s]*at run/) || stackLines[i].match(/^run(ProgramCode)?@/)) {
                break;
            }

            var line = replaceStackLine(stackLines[i]);
            if (line.match(/^\s*\d+:\d+\s*$/)) {
                break;
            }
//             oldRes = res;
            res += (res ? "\n" : "") + line;
        }

//         return oldRes;
        return res;
    }

    function runProgramCode(f, moduleName, run, get_automaton, get_automata) {
        resultsConsole.textContent = "";

        if (loadingProgNot) {
            loadingProgNot.close(true);
            loadingProgNot = null;
        }

        try {
            var res = f(run, get_automaton, get_automata, automataDesigner.currentIndex);
            if (res !== undefined) {
                setResult(res);
            }
        } catch (e) {
            libD.notify({
                type: "error",
                title: libD.format(_("Error executing {0}"), moduleName),
                content: libD.jso2dom(
                    ["div", {style:"white-space:pre-wrap"},
                        e.toString() + "\n" + cleanStack(e.stack)
                    ]
                )
            });
            throw e;
        }
    }

    function loadAudescriptCode(moduleName, audescriptCode, callback) {
        var data = {};
        var includes;
        var code;

        try {
            code = eval(
                audescript2js(audescriptCode, moduleName, moduleName + ".ajs", data)
            );

            includes = data.includes;
       } catch (e) {
            notify(
                libD.format(
                    _("Parse error (module {0})"),
                    moduleName
                ),
                e.toString(),
                "error"
            );

            if (loadingProgNot) {
                loadingProgNot.close(true);
                loadingProgNot = null;
            }

            throw e;
        }

        loadIncludes(
            includes,
            function () {
                if (moduleName) {
                    modules[moduleName] = code;
                }

                callback(code);
            }
        );
    }

    getFile("resources/util/list.txt",
        function (algoFile) {
            getFile(
                "resources/util/dirlist.txt",
                function (dirlist) {

                    dirlist = dirlist.split("\n");

                    var files = {
                        a: [],
                        q: [],
                        e: []
                    };

                    var win, langFound, i, len = false;

                    for (i = 0, len = dirlist.length; i < len; ++i) {
                        if (dirlist[i]) {
                            if (dirlist[i][0] === "l") { // l10n
                                if (libD.lang === dirlist[i].split("/")[2].split(".")[0]) {
                                    langFound = true;
                                    break;
                                }
                            } else {
                                files[dirlist[i][0]].push(dirlist[i]);
                            }
                        }
                    }

                    dirlist = null;

                    if (langFound) {
                        libD.jsLoad(
                            "l10n/js/" + libD.lang + ".js",
                            function () {
                                libD.moduleLoaded("*langPack");
                            }
                        );
                    } else {
                        libD.moduleLoaded("*langPack");
                    }

                    function makeWindow(title, textList, funList, btnText, letter, folder, ext, fileelem) {
                        var refs = {}, a, li, j, leng;

                        if (win && win.ws) {
                            win.close();
                        }

                        win = libD.newWin({
                            title:   title,
                            height:  "15%",
                            width:   "50%",
                            left:    "12.5%",
                            top:     "12.5%",
                            show:    true,
                            content: libD.jso2dom(["div#loaddistantfile.libD-ws-colors-auto libD-ws-size-auto", [
                                ["div#pane-localfile", [
                                    ["p.title", _("From your computer")],
                                    ["p", ["button", {"#": "btn"}, btnText]]
                                ]],
                                ["div#pane-distantfile", [
                                    ["p.title", textList],
                                    ["ul", {"#": "list"}]
                                ]]
                            ]], refs)
                        });

                        for (j = 0, leng = files[letter].length; j < leng; ++j) {
                            li = document.createElement("li");
                            a  = document.createElement("a");

                            a.href        = "#";
                            a.onclick     = funList;
                            a._file       = files[letter][j];
                            a.textContent = files[letter][j].replace(folder, "").replace(new RegExp("\\." + ext + "$"), "");

                            li.appendChild(a);
                            refs.list.appendChild(li);
                        }

                        refs.btn.onclick = function () {
                            win.close();
                            fileelem.click();
                        };
                    }

                    function lfile(fun, fail) {
                        return function () {
                            win.close();

                            getFile(
                                this._file,
                                fun,
                                function () {
                                    notify(fail);
                                },
                                true
                            );

                            return false;
                        };
                    }

                    libD.need(["ready", "ws", "wm", "*langPack"], function () {
                        var j, line, fname, descr, algos = algoFile.split("\n");

                        for (j = 0; j < algos.length; ++j) {
                            if (algos[j]) {
                                line = algos[j].split("/");
                                fname = line[0].trim();
                                descr = line[1].trim();
                                line = document.createElement("option");
                                line.value = fname.replace(/\.ajs$/, "");
                                line.textContent = _(descr);
                                curAlgo.appendChild(line);
                            }
                        }

                        algos = null;

                        if (files.q.length) {
                            quiz.onclick = function () {
                                makeWindow(
                                    _("Load a Quiz"),
                                    _("Ready to use quizzes"),
                                    lfile(loadQuiz, _("Loading quiz failed.")),
                                    _("Load a quiz"),
                                    "q",
                                    "quiz/",
                                    "json",
                                    filequiz
                                );
                            };
                        }

                        if (files.e.length || files.a.length) {
                            open.onclick = function () {
                                if (switchmode.value === "program") {
                                    if (files.a.length) {
                                        makeWindow(
                                            _("Load a program"),
                                            _("Built-in algorithms"),
                                            lfile(openProgram, _("Loading program failed.")),
                                            _("Load a program"),
                                            "a",
                                            "algos/",
                                            "ajs",
                                            fileprogram
                                        );
                                    } else {
                                        fileprogram.click();
                                    }
                                } else if (files.e.length) {
                                    makeWindow(
                                        _("Load an automaton"),
                                        _("Examples of automaton"),
                                        lfile(openAutomaton, _("Loading automaton failed.")),
                                        _("Load an automaton"),
                                        "e",
                                        "examples-automata/",
                                        "txt",
                                        fileautomaton
                                    );
                                } else {
                                    fileprogram.click();
                                }
                            };
                        }
                    });
                }
            );
        },
        function (message, status) {
            if (message === "status") {
                message = libD.format(_("The file was not found or you don't have enough permissions to read it. (HTTP status: {0})"), status);
            }

            if (message === "send") {
                message = _("This can happen with browsers like Google Chrome or Opera when using Aude locally. This browser forbids access to files which are nedded by Aude. You might want to try Aude with another browser when using it offline. See README for more information");
            }
            notify(_("Unable to get the list of predefined algorithms"), message);
        });

    libD.need(["ready", "dom", "notify", "wm", "ws", "jso2dom", "*langPack"], function () {
        automataDesigner.standardizeStringValueFunction = automaton2dot_standardizedString;
        automataDesigner.prompt = (function () {
            var refs = {},
                win,
                func,
                winContent = libD.jso2dom(
                    ["div.libD-ws-colors-auto",
                        [
                            ["div", {"style":"display:inline-block"},
                                ["label", {"#": "descr", "for": "window.prompt-input", "style": "white-space:pre-wrap"}]
                            ],
                            ["div.prompt-container",
                                [
                                    ["input.prompt-input", {"#": "input", type: "text", style: ""}],
                                    ["input.prompt-btn", {"#": "ok", type: "button", value: _("OK")}]
                                ]
                            ]
                        ]
                    ],
                    refs
                );

            function close() {
                if (func) {
                    func(null);
                }
            }
            refs.ok.onclick = function () {
                func(refs.input.value);
                func = null;
                win.close();
            };
            refs.input.onkeydown = function (e) {
                if (e.keyCode === 13) {
                    refs.ok.onclick();
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }

                if (e.keyCode === 27) {
                    win.close();
                    return false;
                }
            };

            return function (title, descr, def, fun) {
                func = fun;

                if (!win || !win.ws) {
                    win = libD.newWin({
                        content:     winContent,
                        minimizable: false,
                        center:      true
                    });

                    win.addListener("close", close);
                    win.ws.wm.handleSurface(win, winContent);
                }

                win.show();
                win.setTitle(title);
                refs.descr.textContent = descr;
                refs.input.value = def;
                refs.input.select();
            };
        }());

        automataDesigner.msg = function (o) {
            return libD.notify(o);
        };

        head = document.querySelector("head");

        if (window.js18Supported) {
            libD.jsLoad("resources/js/setIterators.js", libD.none, "application/javascript;version=1.8");
        } else if (window.Symbol) {
            libD.jsLoad("resources/js/setIterators.js");
        }

        automataDesigner.load();
        var automataContainer = document.getElementById("automata-container"),
            automatonMinus    = document.getElementById("automaton_minus"),
            automatoncode     = document.getElementById("automatoncode"),
            automatonPlus     = document.getElementById("automaton_plus"),
            automataedit      = document.getElementById("automataedit"),
            exportResult      = document.getElementById("export-result"),
            executeBtn        = document.getElementById("execute"),
            exportBtn         = document.getElementById("export"),
            wordDiv           = document.getElementById("word"),
            divQuiz           = document.getElementById("div-quiz"),
            saveas            = document.getElementById("saveas"),
            save              = document.getElementById("save"),
            localStorage      = window.localStorage || {},
            executionTimeout    = 0,
            exportFN            = "",
            CURRENT_FINAL_STATE_COLOR            = localStorage.CURRENT_FINAL_STATE_COLOR || "rgba(90, 160, 0, 0.5)",
            CURRENT_TRANSITION_COLOR             = localStorage.CURRENT_TRANSITION_COLOR  || "#BD5504",
            CURRENT_STATE_COLOR                  = localStorage.CURRENT_STATE_COLOR       || "#FFFF7B",
            STATE_REFUSED                        = localStorage.STATE_REFUSED             || "rgba(255, 50, 50, 0.5)",
            CURRENT_TRANSITION_PULSE_TIME_FACTOR = parseFloat(localStorage.CURRENT_TRANSITION_PULSE_TIME_FACTOR) || 0.6,
            EXECUTION_STEP_TIME                  = parseInt(localStorage.EXECUTION_STEP_TIME, 10),
            CURRENT_TRANSITION_PULSE_TIME_STEP   = 600,
            HAND_STEP_TIME                       = 250,
            executeWin,
            execute;

        if (isNaN(EXECUTION_STEP_TIME)) {
            EXECUTION_STEP_TIME = 1200;
        }

        automataListClose = document.getElementById("automata-list-chooser-close"),
        automataListIntro = document.getElementById("automata-list-chooser-intro"),
        automataListDiv   = document.getElementById("automata-list-chooser"),
        automataListBtn   = document.getElementById("automata-list-chooser-btn"),
        automataListUL    = document.getElementById("automata-list-chooser-content"),
        resultsConsole    = document.getElementById("results-console");
        automatoncodeedit = document.getElementById("automatoncodeedit");
        svgContainer      = document.getElementById("svg-container"),
        results           = document.getElementById("results");
        resultsContent    = document.getElementById("results-content");
        splitter          = document.getElementById("splitter");
        leftPane          = document.getElementById("left-pane");
        content           = document.getElementById("content");
        toolbar           = document.getElementById("toolbar");
        switchmode        = document.getElementById("switchmode");
        codeedit          = document.getElementById("codeedit");
        fileautomaton     = document.getElementById("fileautomaton");
        fileprogram       = document.getElementById("fileprogram");
        filequiz          = document.getElementById("filequiz");
        curAlgo           = document.getElementById("predef-algos");
        open              = document.getElementById("open");
        quiz              = document.getElementById("quiz");
        automataNumber    = document.getElementById("n-automaton"),
        zoom.svgContainer = results;


        automatoncodeedit.spellcheck = false;

        var exportResultFN     = _("automaton.txt"),
            exportResultTextFN = _("result.txt");

        resultToLeft.appendChild(libD.jso2dom([
            ["img", {alt: "", src: "resources/img/panel/arrow-left.png"}],
            ["span", _("Edit this automaton")]
        ]));

        document.getElementById("results-tb").insertBefore(resultToLeft, exportResult);

        (function () {
            var divWelcome = document.createElement("div");
            divWelcome.id = "welcome";
            divWelcome.innerHTML = libD.format(_(
                "<h3> Never used it before? </h3>" +
                "<ul>" +
                "    <li>Create your first automaton by clicking on the <strong>New state</strong> button at the bottom left of the screen.</li>" +
                "    <li>You can apply an algorithm on your automaton with the <strong>Select an algo</strong> toolbar button.</li>" +
                "</ul>" +
                "<h3> Using a keyboard and a mouse? You can be faster. </h3>" +
                "<ul>" +
                "    <li>To add a <strong>new state</strong>, double-click where you want the state to be.</li>" +
                "    <li>To add a <strong>new transition</strong>, Shift+click on the start state then click on the destination state.</li>" +
                "    <li>To <strong>rename</strong> a state, to <strong>modify symbols</strong> of a transition, double-click on it.</li>" +
                "    <li>To set a state as the <strong>initial</strong> state, ctrl+right click on the state.</li>" +
                "    <li>To set a state as <strong>(non-)accepting</strong>, right-click on it.</li>" +
                "    <li>To <strong>remove</strong> a state or a transition, ctrl-click on it.</li>" +
                "</ul>" +
                "<p> Now it’s your turn!</p>"
            ), "Automaton Project/AUDE");

            automataDesigner.svgContainer.parentNode.appendChild(divWelcome);
            function hideWelcome() {
                automataDesigner.svgContainer.parentNode.removeChild(divWelcome);
                document.getElementById("new-state-btn-wrap").classList.add("welcome-hidden");
                document.body.removeEventListener("click", hideWelcome, false);
                automataDesigner.setViewBoxSize();
            }
            document.body.addEventListener("click", hideWelcome, false);
        }());

        function stopExecution(index) {
            if (executionTimeout) {
                clearTimeout(executionTimeout);
                executionTimeout = 0;
                wordDiv.textContent = "";
                automataDesigner.cleanSVG(index);
            }
        }

        window.addEventListener("keydown", function (e) {
            if (e.ctrlKey || e.metaKey) {
                if (e.keyCode === 83) {
                    save.onclick();
                    e.preventDefault();
                    return false;
                }
                if (e.keyCode === 69) {
                    if (e.shiftKey) {
                        exportResult.onclick();
                    } else {
                        exportBtn.onclick();
                    }
                    e.preventDefault();
                    return false;
                }
            }
        });

        executeBtn.onclick = function () {
            enableResults();
            if (!executeWin || !executeWin.ws) {
                var refs = {};
                executeWin = libD.newWin({
                    minimizable: false,
                    title:       _("Execute the current automaton with a word"),
                    right:       results.offsetWidth  + 10,
                    top:         toolbar.offsetHeight + 5,
                    content:     libD.jso2dom(["div.libD-ws-colors-auto", {"style": "height:100%"}, [
                        ["div", {"#": "root"}, [
                            ["label", {"for":"execute-word-input"}, _("Word: ")],
                            ["input#execute-word-input", {type: "text", "#": "word"}],
                            ["input", {type: "button", value: _("Run"),  "#": "run"}],
                            ["input", {type: "button", value: _("Step"), "#": "step"}]
                        ]],
                        ["div", [
                            ["label", {"for":"execute-delay-input"}, _("Delay between steps (ms): ")],
                            ["input#execute-delay-input", {type: "text", "#": "delay", value: EXECUTION_STEP_TIME}]
                        ]]
                    ]], refs)
                });
                executeWin.__refs = refs;
                executeWin.addListener("close", function () {
                    wordDiv.textContent = "";
                    automataDesigner.cleanSVG(automataDesigner.currentIndex);
                });
                libD.wm.handleSurface(executeWin, refs.root);
                refs.run.onclick = function () {
                    refs.run.focus(); // make the virtual keyboard disappear on tablets
                    stopExecution();
                    automataDesigner.cleanSVG(automataDesigner.currentIndex);
                    refs.delay.onchange();
                    execute(false, refs.word.value, automataDesigner.currentIndex);
                };

                refs.step.onclick = function () {
                    if (executionTimeout) {
                        clearTimeout(executionTimeout);
                        execute(true);
                    } else {
                        execute(true, refs.word.value, automataDesigner.currentIndex);
                    }
                };

                refs.delay.onchange = function () {
                    EXECUTION_STEP_TIME = parseInt(refs.delay.value, 10);
                    if (isNaN(EXECUTION_STEP_TIME)) {
                        EXECUTION_STEP_TIME = localStorage.EXECUTION_STEP_TIMEv;
                    }
                    localStorage.EXECUTION_STEP_TIME = EXECUTION_STEP_TIME;
                };

                refs.word.onkeypress = function (e) {
                    if (e.keyCode === 13) {
                        refs.run.onclick();
                    }
                };
            }
            executeWin.show();
            executeWin.__refs.word.focus();
        };

        exportBtn.onclick = function () {
            var fn = window.prompt(_("Which name do you want to give to the exported image? (give a .dot extension to save as dot format, .svg to save as svg)"), exportFN);

            if (fn) {
                exportFN = fn;

                if (fn.length > 4 && fn.substr(fn.length - 4) === ".svg") {
                    if (switchmode.value !== "design") {
                        automataDesigner.setAutomatonCode(automatoncodeedit.value, automataDesigner.currentIndex);
                    }

                    saveAs(new Blob([automataDesigner.getSVG(automataDesigner.currentIndex)], {type: "text/plain;charset=utf-8"}), fn);
                } else {
                    if (switchmode.value === "design") {
                        automatoncodeedit.value = automataDesigner.getAutomatonCode(automataDesigner.currentIndex, false);
                    } else {
                        automataDesigner.setAutomatonCode(automatoncodeedit.value, automataDesigner.currentIndex);
                    }

                    var A = automataDesigner.getAutomaton(automataDesigner.currentIndex);

                    if (A) {
                        saveAs(new Blob([automaton2dot(A)], {type: "text/plain;charset=utf-8"}), fn);
                    } else {
                        notify(_("There is no automaton to save."));
                    }
                }
            }
        };

        document.getElementById("redraw").onclick = function () {
            automatoncodeedit.value = automataDesigner.getAutomatonCode(automataDesigner.currentIndex, true);
            if (automatoncodeedit.value) {
                automataDesigner.setAutomatonCode(automatoncodeedit.value, automataDesigner.currentIndex);
            }
        };

        exportResult.onclick = function () {
            var fn;
            if (automatonResult) {
                fn = window.prompt(_("Which name do you want to give to the exported file? (give a .dot extension to save as dot format, .svg to save as svg, .txt to save as automaton code)"), exportResultFN);

                if (fn) {
                    exportResultFN = fn;
                    var format = ".txt";
                    if (fn.length > 4) {
                        format = fn.substr(fn.length - 4);
                    }

                    switch (format) {
                    case ".svg":
                        saveAs(new Blob([automataDesigner.outerHTML(resultsContent.querySelector("svg"))], {type: "text/plain;charset=utf-8"}), fn);
                        break;
                    case ".dot":
                        saveAs(new Blob([automaton2dot(automatonResult)], {type: "text/plain;charset=utf-8"}), fn);
                        break;
                    default:
                        saveAs(new Blob([automaton_code(automatonResult)], {type: "text/plain;charset=utf-8"}), fn);
                    }
                }
            } else {
                fn = window.prompt(_("Which name do you want to give to the exported text file?"), exportResultTextFN);

                if (fn) {
                    exportResultTextFN = fn;
                    saveAs(new Blob([resultsContent.textContent], {type: "text/plain;charset=utf-8"}), fn);
                }
            }
        };

        splitter.onmousedown = function () {
            window.onmousemove = splitterMove;
            window.onmouseup = function () {
                window.onmousemove = null;
            };
        };

        window.addEventListener("resize", onResize, false);

        window.heap = function (a) {
            Object.defineProperty(a, "top", {
                enumerable: false,
                configurable: false,
                writable: false,
                value: function () { return a[a.length - 1]; }
            });

            return a;
        };

        var currentMode = switchmode.value;

        function automatonSetNumber(index) {
            automataDesigner.setCurrentIndex(index);
            if (currentMode === "automatoncode") {
                try {
                    automatoncodeedit.value = automataDesigner.getAutomatonCode(index, false);
                } catch (e) {
                    switchmode.value = "design";
                    switchmode.onchange();
                    libD.notify({
                        type:    "error",
                        title:   libD.format(_("Unable to access the code of automaton n°{0}"), automataDesigner.currentIndex),
                        content: _("You need to fix the automaton in design mode before accessing its code.")
                    });
                }
            }
        }

        switchmode.onchange = function (e) {
            switch (this.value) {
            case "program":
                toolbar.className = "algomode";
                codeedit.classList.remove("disabled");
                automataedit.classList.add("disabled");

                if (!aceEditor) {
                    aceEditor = ace.edit(codeedit.id);
                    aceEditor.getSession().setOption("useWorker", false);
                    aceEditor.getSession().setMode("ace/mode/audescript");
                    aceEditor.$blockScrolling = Infinity

//                     var codemirrorNode = cm.getWrapperElement();

//                     listenMouseWheel(function (e, delta) {
//                         if (e.ctrlKey || e.metaKey) {
//                             var fs = parseFloat(window.getComputedStyle(codemirrorNode, null).fontSize);
//                             codemirrorNode.style.fontSize = (fs + 2 * delta) + "px";
//                             cm.refresh();
//                             e.preventDefault();
//                             e.stopPropagation();
//                             return false;
//                         }
//                     });
                }

                onResize();
                break;
            case "design":
                if (deferedResultShow) {
                    setTimeout(enableResults, 0);
                    deferedResultShow = false;
                }

                if (aceEditor && aceEditor.getValue()) {
                    toolbar.className = "designmode";
                } else {
                    toolbar.className = "designmode launch-disabled";
                }

                codeedit.classList.add("disabled");
                automataedit.classList.remove("disabled");
                automatoncode.classList.add("disabled");
                svgContainer.classList.remove("disabled");
                onResize();
                break;
            case "automatoncode":
                try {
                    automatoncodeedit.value = automataDesigner.getAutomatonCode(automataDesigner.currentIndex, false);
                } catch (e) {
                    libD.notify({
                        type:    "error",
                        title:   libD.format(_("Unable to access the code of automaton n°{0}"), automataDesigner.currentIndex),
                        content: _("You need to fix the automaton in design mode before accessing its code."),
                    });
                    this.value = "design";
                    switchmode.onchange();
                    return;
                }

                if (deferedResultShow) {
                    setTimeout(enableResults, 0);
                    deferedResultShow = false;
                }


                if (aceEditor && aceEditor.getValue()) {
                    toolbar.className = "designmode codemode";
                } else {
                    toolbar.className = "designmode codemode launch-disabled";
                }

                codeedit.classList.add("disabled");
                automataedit.classList.remove("disabled");
                automatoncode.classList.remove("disabled");
                svgContainer.classList.add("disabled");
                onResize();
                break;
            }
            currentMode = this.value;
        };

        automatoncodeedit.onchange = function () {
            if (this.value) {
                automataDesigner.setAutomatonCode(this.value, automataDesigner.currentIndex);
            }
        };

        automatonPlus.onclick = function () {
            var o = document.createElement("option");
            o.value = automatonCount;
            o.textContent = _("n°") + automatonCount;
            o.id = "automaton_n" + automatonCount;
            automataNumber.appendChild(o);
            automataNumber.value = automatonCount;
            automataDesigner.newAutomaton(automatonCount);
            automatonSetNumber(automatonCount++);

            if (!automataListDiv.classList.contains("disabled")) {
                showAutomataListChooser();
            }
        };

        automatonMinus.onclick = function () {
                var curAutomaton = parseInt(automataNumber.value, 10);
                automataNumber.removeChild(document.getElementById("automaton_n" + (automatonCount - 1)));
                automataDesigner.removeAutomaton(curAutomaton);

                if (curAutomaton === automatonCount - 1) {
                    automatonSetNumber(automataNumber.value = automatonCount - 2);
                } else {
                    automatonSetNumber(curAutomaton);
                }

                --automatonCount;

                if (automatonCount < 1) {
                    automatonPlus.onclick();
                }

                var j, len, i = automataList.indexOf(curAutomaton);

                if (i !== -1) {
                    automataList.splice(i, 1);
                    for (j = 0, len = automataList.length; j < len; ++j) {
                        if (automataList[j] > i) {
                            --automataList[j];
                        }
                    }
                }

                if (!automataListDiv.classList.contains("disabled")) {
                    showAutomataListChooser();
                }
        };

        resultToLeft.onclick = function () {
            if (automatonResult) {
                automatonPlus.onclick();
                automataDesigner.setSVG(resultsContent.querySelector("svg"), automataDesigner.currentIndex);
                automatoncodeedit.value = automaton_code(automatonResult);
            }
        };

        automataNumber.onchange = function () {
            automatonSetNumber(parseInt(automataNumber.value, 10));
        };

        document.getElementById("automaton_plus").onclick();

        document.getElementById("algo-exec").onclick = function () {
            if (aceEditor) {
                if (loadingProgNot) {
                    loadingProgNot.close(true);
                }

                loadingProgNot = libD.notify({
                    type: "info",
                    content: (_("Loading program, please wait...")),
                    closable: false,
                    delay: 1000
                });

                loadAudescriptCode(null, aceEditor.getValue(), runProgram);
            }
        };

        automataListDiv.querySelector("p:last-child").innerHTML = libD.format(_("This order will be used for future algorithm executions. If you want to change this order, you can call this list using the <img src=\"{0}\" /> toolbar icon.<br />Notice: Algorithms taking only one automaton work with the current automaton, they don’t use this ordering."), "resources/img/panel/format-list-ordered.png");

        automataListUL.onmouseout = function (e) {
            e = e.toElement || e.relatedTarget;
            if ((e === automataListUL || e === automataListUL.parentNode) && salc_cur_automaton !== -1) {
                automataDesigner.setCurrentIndex(salc_cur_automaton);
                salc_cur_automaton = -1;
            }
        };

        automataListUL.onmouseover = function () {
            if (salc_cur_automaton === -1) {
                salc_cur_automaton = automataDesigner.currentIndex;
            }
        };

        document.getElementById("automata-list").onclick = function () { showAutomataListChooser(); };

        document.getElementById("automata-list-chooser-close").onclick = function () {
            automataListDiv.classList.add("disabled");
        };

        automataDesignerGlue.requestSVG = function (index) {
            viz(
                automaton2dot(read_automaton(automatoncodeedit.value)),
                function (res) {
                    automataDesigner.setSVG(res, index);
                }
            );
        };

        function automatonFromObj(o) {
            var k, A = new Automaton();

            A.setInitialState(o.states[0]);

            for (k = 1; k < o.states.length; ++k) {
                A.addState(o.states[k]);
            }

            for (k = 0; k < o.finalStates.length; ++k) {
                A.addFinalState(o.states[k]);
            }

            for (k = 0; k < o.transitions.length; ++k) {
                A.addTransition(o.transition[k][0], o.transition[k][1], o.transition[k][2]);
            }

            return A;
        }

        function openQuiz() {
            freader.onload = function () {
                loadQuiz(freader.result);
            };
            freader.readAsText(filequiz.files[0], "utf-8");
        }

        fileprogram.onchange   = openProgram;
        fileautomaton.onchange = openAutomaton;
        filequiz.onchange      = openQuiz;

        function closeQuiz() {
            automatonMinus.onclick();
            automataContainer.style.display = "";
            automataContainer.style.top     = "";
            divQuiz.textContent = "";
            divQuiz.classList.remove("enabled");
            automataDesigner.redraw();
            zoom.redraw();
        }

        var nextQuizQuestion;

        function nextQuestion(quiz, previous, delta) {
            return function () {
                if (delta) {
                    quiz.currentQuestion -= 2;
                }

                try {
                    nextQuizQuestion(quiz, previous);
                } catch (e) {
                    if (typeof e === "string") {
                        notify(_("Error in the Quiz"), libD.format(_("There is an error in the Quiz: {0}"), e), "error");
                    } else {
                        throw e;
                    }
                }
                return false;
            };
        }

        nextQuizQuestion = function (quiz, previousQuestion) {
            divQuiz.classList.remove("intro");
            divQuiz.classList.add("started");
            automataContainer.style.display = "none";

            var q, refs, answers, respA, i, len, possibilities, j, leng;

            if (typeof previousQuestion === "number" && previousQuestion >= 0) {
                q = quiz.questions[previousQuestion];
                var r = quiz.answers[previousQuestion];


                quiz.answers[previousQuestion].reasons = [];

                switch (q.type) {
                case "mcq":
                    answers = r.userResponse = new Set();

                    possibilities = q.possibilities;

                    for (j = 0, leng = possibilities.length; j < leng; ++j) {
                        if (quiz.currentAnswersRefs["answer-" + j].checked) {
                            answers.add(possibilities[j].hasOwnProperty("id") ? possibilities[j].id : parseInt(j, 10) + 1);
                        }
                    }

                    var diff = answers.symDiff(q.answers);

                    r.isCorrect = diff.card() === 0;
                    if (!r.isCorrect) {
                        var diffL = aude.toArray(diff);
                        diffL.sort();
                        r.reasons.push(libD.format(_("Wrong answer for {0}."), diffL.toString()));
                    }

                    break;
                case "word":
                    respA = automataDesigner.getAutomaton(automataDesigner.currentIndex);
                    var words = q.words,
                        regex = "";

                    r.userResponse = automataDesigner.getSVG(automataDesigner.currentIndex);

                    if (respA) {
                        for (i = 0, len = words.length; i < len; ++i) {
                            if (!respA.acceptedWord(words[i])) {
                                r.isCorrect = false;
                                r.reasons.push(
                                    words[i] ? libD.format(_("Word <i>{0}</i> is not accepted while it should be."), words[i])
                                             : _("The empty word is not accepted while it should be.")
                                );
                            }

                            if (regex) {
                                regex += "+";
                            }

                            regex += words[i].replace(/([^0-9a-zA-Z])/g, "\\$1");
                        }

                        if (!r.reasons[0]) {
                            r.isCorrect = automataAreEquivalent(regexToAutomaton(regex), respA);
                            if (!r.isCorrect) {
                                r.reasons.push(_("The given automaton accepts too many words."));
                            }
                        }
                    } else {
                        r.isCorrect = false;
                        r.reasons.push(_("Question was not answered."));
                    }
                    break;
                case "automatonEquiv":
                    respA = automataDesigner.getAutomaton(automataDesigner.currentIndex);

                    r.userResponse = automataDesigner.getSVG(automataDesigner.currentIndex);

                    if (respA) {
                        var A;

                        if (q.automaton) {
                            try {
                                A = object2automaton(q.automaton);
                            } catch (e) {
                                throw _("Automaton given in the quiz is not correct.");
                            }
                        } else if (q.regex) {
                            try {
                                A = regexToAutomaton(q.regex);
                            } catch (e) {
                                throw _("The regex given in the quiz is not valid.");
                            }
                        } else {
                            throw _("No regular expression or automaton was given in the quiz.");
                        }

                        r.isCorrect = automataAreEquivalent(A, respA);
                        if (!r.isCorrect) {
                            if (q.examples instanceof Array) {
                                for (i = 0, len = q.examples.length; i < len; ++i) {
                                    if (!respA.acceptedWord(q.examples[i])) {
                                        r.reasons.push(
                                            q.examples[i]
                                                ? libD.format(_("Word <i>{0}</i> is not accepted while it should be."), q.examples[i])
                                                : _("The empty word is not accepted while it should be.")
                                        );
                                    }
                                }
                            }

                            if (q.counterExamples instanceof Array) {
                                for (i = 0, len = q.counterExamples.length; i < len; ++i) {
                                    if (respA.acceptedWord(q.counterExamples[i])) {
                                        r.reasons.push(
                                            q.counterExamples[i]
                                                ? libD.format(_("Word <i>{0}</i> is accepted while it shouldn’t be."), q.counterExamples[i])
                                                : _("The empty word is accepted while it shouldn’t be.")
                                        );
                                    }
                                }
                            }

                            if (!r.reasons[0]) {
                                r.reasons.push(_("The given automaton isn’t equivalent to the expected one."));
                            }
                        }
                    } else {
                        r.isCorrect = false;
                        r.reasons.push(_("Question was not answered."));
                    }
                    break;
                }
            }

            ++quiz.currentQuestion;

            if (quiz.currentQuestion >= quiz.questions.length) {
                quiz.refs.content.textContent = "";
                quiz.refs.content.appendChild(libD.jso2dom(["p", _("The Quiz is finished! Here are the details of the correction.")]));

                var question_i, reasons, li, ul;

                refs = {};

                answers = libD.jso2dom(["table#correction-table",
                    ["tr", [
                        ["th", _("Instruction")],
                        ["th", _("Correct answer?")],
                        ["th", _("Comments")]
                    ]]]);

                for (i = 0, len = quiz.answers.length; i < len; ++i) {
                    question_i = quiz.questions[i];

                    answers.appendChild(libD.jso2dom(["tr", [
                        ["td.qinst", {"#": "answerInstr"}, [
                            ["span.qid", (question_i.hasOwnProperty("id") ? question_i.id : (parseInt(i, 10) + 1)) + ". "],
                            ["div.qinstr-content"]
                        ]],
                        ["td.qstate", quiz.answers[i].isCorrect ? _("Yes") : _("No")],
                        ["td.qcmt", {"#": "answerCmt"}]
                    ]], refs));

                    reasons = quiz.answers[i].reasons;

                    if (reasons[1]) {
                        ul = document.createElement("ul");

                        for (j = 0, leng = reasons.length; j < leng; ++j) {
                            li = document.createElement("li");
                            li.innerHTML = reasons[j];
                            ul.appendChild(li);
                        }

                        refs.answerCmt.appendChild(ul);
                    } else {
                        refs.answerCmt.innerHTML = reasons[0] || "";
                    }

                    if (question_i.instructionHTML) {
                        textFormat(question_i.instructionHTML, refs.answerInstr.lastChild, true);
                    } else {
                        textFormat(question_i.instruction, refs.answerInstr.lastChild);
                    }

                    refs.answerInstr.appendChild(document.createElement("ul"));
                    refs.answerInstr.lastChild.className = "possibilities";

                    possibilities = question_i.possibilities;

                    if (possibilities) {
                        for (j = 0, leng = possibilities.length; j < leng; ++j) {
                            refs.answerInstr.lastChild.appendChild(libD.jso2dom(["li", [
                                ["span.quiz-answer-id", (possibilities[j].hasOwnProperty("id") ? possibilities[j].id : (parseInt(i, 10) + 1)) + ". "],
                                ["span", {"#": i + "content"}]
                            ]], refs));

                            if (possibilities[j].automaton) {
                                automaton2svg(
                                    automatonFromObj(possibilities[j].automaton),
                                    function (res) {
                                        refs[i + "content"].innerHTML = res;
                                    }
                                );
                            } else if (possibilities[j].html) {
                                refs[i + "content"].innerHTML = possibilities[j].html;
                            } else if (possibilities[j].text) {
                                textFormat(possibilities[j].text, refs[i + "content"]);
                            } else if (possibilities[j].html) {
                                textFormat(possibilities[j].html, refs[i + "content"], true);
                            }
                        }
                    }
                }

                quiz.refs.content.appendChild(answers);
                quiz.refs.content.appendChild(libD.jso2dom([
                    ["p", _("We are willing to don’t give you any mark. Your progress is the most important thing, above any arbitrary absolute meaningless mark. Keep your efforts ;-)")],
                    ["div.button-container", ["button", {"#": "prev"}, _("Previous page")]]
                ], refs));
                refs.prev.onclick = nextQuestion(quiz, null, true);
                return;
            }

            q = quiz.questions[quiz.currentQuestion];

            var qid = q.hasOwnProperty("id") ? q.id : (quiz.currentQuestion + 1);

            refs = {};

            quiz.currentAnswersRefs = refs;
            quiz.refs.content.textContent = "";

            quiz.refs.content.appendChild(
                libD.jso2dom([
                    ["div#quiz-question", [
                        ["span.quiz-question-id", libD.format(
                            _("Question {0}: "),
                            qid
                        )],
                        ["span", {"#": "questionContent"}]
                    ]],
                    ["div#quiz-answers", {"#": "answers"}],
                    ["div.button-container", [
                        ["button", {"#": "prev"}, _("Previous question")],
                        ["button", {"#": "ok"}, _("Next question")]
                    ]]
                ], refs)
            );

            if (q.instructionHTML) {
                textFormat(q.instructionHTML, refs.questionContent, true);
            } else {
                textFormat(q.instruction, refs.questionContent);
            }

            switch (q.type) {
            case "mcq":
                possibilities = q.possibilities;

                if (!possibilities) {
                    throw libD.format(_("Question {0} has no answers."), qid);
                }

                refs.answers.appendChild(document.createElement("ul"));

                for (j = 0, leng = possibilities.length; j < leng; ++j) {
                    qid = possibilities[j].hasOwnProperty("id") ? possibilities[j].id : (parseInt(i, 10) + 1);
                    refs.answers.firstChild.appendChild(libD.jso2dom(["li", ["label", [
                        ["input", {"type": "checkbox", "#": "answer-" + j}],
                        ["span.quiz-answer-id", qid + ". "],
                        ["span", {"#": j + "content"}]
                    ]]], refs));

                    if (possibilities[j].automaton) {
                        automaton2svg(
                            automatonFromObj(possibilities[j].automaton),
                            function (res) {
                                refs[j + "content"].innerHTML = res;
                            }
                        );
                    } else if (possibilities[j].html) {
                        refs[j + "content"].innerHTML = possibilities[j].html;
                    } else if (possibilities[j].text) {
                        textFormat(possibilities[j].text, refs[j + "content"]);
                    } else if (possibilities[j].html) {
                        textFormat(possibilities[j].html, refs[j + "content"], true);
                    }

                    if (quiz.answers[quiz.currentQuestion].userResponse instanceof Set && quiz.answers[quiz.currentQuestion].userResponse.has(qid)) {
                        refs["answer-" + j].checked = true;
                    }
                }
                break;
            case "word":
                refs.answers.innerHTML = "<p>" +  _("You can draw the automaton bellow.") + "</p>";
                automataDesigner.setSVG(quiz.answers[quiz.currentQuestion].userResponse, automataDesigner.currentIndex);

                setTimeout(function () {
                    automataContainer.style.top = (divQuiz.offsetHeight + divQuiz.offsetTop) + "px";
                    automataContainer.style.display = "";
                    automataDesigner.redraw();
                    zoom.redraw();
                }, 0);

                break;
            case "automatonEquiv":
                refs.answers.innerHTML = "<p>" +  _("You can draw the automaton bellow.") + "</p>";
                automataDesigner.setSVG(quiz.answers[quiz.currentQuestion].userResponse, automataDesigner.currentIndex);

                setTimeout(function () {
                    automataContainer.style.top = (divQuiz.offsetHeight + divQuiz.offsetTop) + "px";
                    automataContainer.style.display = "";
                    automataDesigner.redraw();
                    zoom.redraw();
                }, 0);

                break;
            case "program":
                break;
            case "algo":
                break;
            default:
                notify(_("Question type not known"), libD.format(_("Type of question {0} is not known. Known types are: <ul><li>\"mcq\" for multiple choices question,</li><li>\"word\" (to draw an automaton which accepts a given list of words).</li></ul>")), "error");
            }

            refs.ok.onclick = nextQuestion(quiz, quiz.currentQuestion);

            if (quiz.currentQuestion) {
                refs.prev.onclick = nextQuestion(quiz, quiz.currentQuestion, true);
            } else {
                refs.prev.style.display = "none";
            }
        };

        startQuiz = function (quiz) {
            if (switchmode.value === "program") {
                switchmode.value = "design";
                switchmode.onchange();
            }

            automataContainer.style.display = "none";
            loadIncludes(["equivalence", "regex2automaton", "automaton2json"]);
            automatonPlus.onclick();

            if (!(quiz.questions && quiz.questions instanceof Array)) {
                throw new Error(_("The quiz doesn't have its list of question."));
            }

            quiz.currentQuestion = -1;

            var i, len = quiz.questions.length, a = quiz.answers = [];
            quiz.answers.length = len;

            for (i = 0, len; i < len; ++i) {
                a[i] = {
                    userResponse: null,
                    isCorrect:    false,
                    reasons:      []
                };
            }

            divQuiz.classList.add("intro");
            divQuiz.classList.remove("started");
            divQuiz.textContent = "";
            divQuiz.classList.add("enabled");

            var refs = {};
            divQuiz.appendChild(libD.jso2dom([
                ["h1#quiz-title", [
                    ["#", quiz.title ? _("Quiz: ") : _("Quiz")],
                    ["span", {"#": "quizTitleContent"}]
                ]],
                ["h2#quiz-author", {"#": "author"}],
                ["div#quiz-descr", {"#": "descr"}],
                ["a#close-quiz", {"#": "closeQuiz", "href": "#"}, _("Close the Quiz")],
                ["div#quiz-content", {"#": "content"},
                    ["div.button-container",
                        ["button", {"#": "startQuiz"}, _("Start the Quiz")]]]
            ], refs));

            textFormat(quiz.title || "", refs.quizTitleContent);
            textFormat((quiz.author || "") + (quiz.date ? " - " + quiz.date : ""), refs.author);
            textFormat(quiz.description || "", refs.descr);

            quiz.refs = refs;
            refs.closeQuiz.onclick = closeQuiz;
            refs.startQuiz.onclick = nextQuestion(quiz);
        };

        if (!quiz.onclick) {
            quiz.onclick = function () {
                filequiz.click();
            };
        }

        if (!open.onclick) {
            open.onclick = function () {
                if (switchmode.value === "program") {
                    fileprogram.click();
                } else {
                    fileautomaton.click();
                }
            };
        }

        function saveProgram(fname) {
            saveAs(new Blob([aceEditor.getValue()], {type: "text/plain;charset=utf-8"}), fname);
        }

        function saveAutomaton(fname) {
            saveAs(new Blob([automataDesigner.getAutomatonCode(automataDesigner.currentIndex, false)], {type: "text/plain"}), fname);
        }

        saveas.onclick = function () {
            var prog = switchmode.value === "program";
            var n = window.prompt(
                    (
                        prog ? _("Please enter a name for the file in which the program will be saved.")
                         : _("Please enter a name for the file in which the automaton will be saved.")
                    ),
                    (prog ? _("algo.ajs") : _("automaton.txt"))
                );

            if (n) {
                if (prog) {
                    saveProgram(programFileName = n);
                } else {
                    saveAutomaton(automatonFileName = n);
                }
            }
        };

        save.onclick = function () {
            if (switchmode.value === "program") {
                if (!programFileName) {
                    saveas.onclick();
                } else {
                    saveProgram(programFileName);
                }
            } else {
                if (switchmode.value === "automatoncode") {
                    automataDesigner.setAutomatonCode(automatoncodeedit.value, automataDesigner.currentIndex);
                }

                if (!automatonFileName) {
                    saveas.onclick();
                } else {
                    saveAutomaton(automatonFileName);
                }
            }
        };

        (function () {
            var accepting, word, index, stepNumber, currentAutomaton, currentStates, currentSymbolNumber, listOfExecutions, executionByStep;

            execute = function (byStep, w, ind) {
                if (typeof w === "string") {
                    word  = w;
                    index = ind;
                    currentSymbolNumber = 0;
                    stepNumber = 0;
                    executionByStep = byStep;
                }

                if (byStep) {
                    executionByStep = byStep;
                }

                var currentTransitions, i, len, accepted;

                if (stepNumber) {
                    if (EXECUTION_STEP_TIME || executionByStep || !word[0]) {
                        if (stepNumber % 2) {
                            if (currentStates) {
                                for (i = 0, len = currentStates.length; i < len; ++i) {
                                    automataDesigner.stateRemoveBackgroundColor(index, currentStates[i].toString());
                                }
                            }

                            currentStates = aude.toArray(currentAutomaton.getCurrentStates());
                            accepting = false;
                            for (i = 0, len = currentStates.length; i < len; ++i) {
                                accepted = currentAutomaton.isAcceptingState(currentStates[i]);
                                if (!accepting && accepted) {
                                    accepting = true;
                                }

                                automataDesigner.stateSetBackgroundColor(
                                    index,
                                    currentStates[i],
                                    accepted
                                        ? CURRENT_FINAL_STATE_COLOR
                                        : CURRENT_STATE_COLOR
                                );
                            }
                        } else {
                            currentStates = aude.toArray(currentAutomaton.getCurrentStates());
                            currentAutomaton.runSymbol(word[0]);
                            wordDiv.firstChild.childNodes[currentSymbolNumber++].className = "eaten";
                            word = word.substr(1);
                            currentTransitions = aude.toArray(currentAutomaton.getLastTakenTransitions());

                            for (i = 0, len = currentTransitions.length; i < len; ++i) {
                                automataDesigner.transitionPulseColor(index, currentTransitions[i].startState, currentTransitions[i].symbol, currentTransitions[i].endState, CURRENT_TRANSITION_COLOR, CURRENT_TRANSITION_PULSE_TIME_FACTOR * (byStep ? CURRENT_TRANSITION_PULSE_TIME_STEP : EXECUTION_STEP_TIME));
                            }
                        }
                    } else {
                        currentAutomaton.runSymbol(word[0]);
                        word = word.substr(1);
                        currentTransitions = aude.toArray(currentAutomaton.getLastTakenTransitions());
                    }
                } else {
                    stepNumber = 0; // we start everything.

                    if (index === undefined) {
                        index = automataDesigner.currentIndex;
                    }

                    wordDiv.textContent = "";

                    var layer1 = document.createElement("div");
                    layer1.id = "word-layer1";

                    var span;

                    for (i = 0, len = word.length; i < len; ++i) {
                        span = document.createElement("span");
                        span.textContent = word[i];
                        layer1.appendChild(span);
                    }

                    wordDiv.appendChild(layer1);

                    var layer2 = layer1.cloneNode(true);
                    layer2.id = "word-layer2";
                    wordDiv.appendChild(layer2);

                    currentAutomaton = automataDesigner.getAutomaton(index, true);
                    var q_init = currentAutomaton.getInitialState();
                    listOfExecutions = [[[q_init, epsilon]]];
                    currentAutomaton.setCurrentState(q_init);
                    currentTransitions = aude.toArray(currentAutomaton.getLastTakenTransitions());

                    accepting = false;
                    currentStates = aude.toArray(currentAutomaton.getCurrentStates());

                    for (i = 0, len = currentStates.length; i < len; ++i) {
                        accepted = currentAutomaton.isAcceptingState(currentStates[i]);

                        if (!accepting && accepted) {
                            accepting = true;
                        }

                        if (EXECUTION_STEP_TIME || executionByStep) {
                            automataDesigner.stateSetBackgroundColor(
                                index,
                                currentStates[i],
                                accepted
                                    ? CURRENT_FINAL_STATE_COLOR
                                    : CURRENT_STATE_COLOR
                            );
                        }
                    }
                }

                var j, leng;

                if (currentTransitions) {
                    var t, l, transitionsByStartState = {};

                    for (i = 0, len = currentTransitions.length; i < len; ++i) {
                        t = currentTransitions[i];

                        if (!transitionsByStartState[t.startState]) {
                            transitionsByStartState[t.startState] = [];
                        }

                        transitionsByStartState[t.startState].push([t.endState, t.symbol]);
                    }

                    var newListOfExecutions = [], startState, newL;

                    for (i = 0, len = listOfExecutions.length; i < len; ++i) {
                        l = listOfExecutions[i];
                        startState = l[l.length - 1][0];
                        if (transitionsByStartState[startState]) {
                            for (j = 0, leng = transitionsByStartState[startState].length; j < leng; ++j) {
                                newL = l.slice();
                                newL.push(transitionsByStartState[startState][j]);
                                newListOfExecutions.push(newL);
                            }
                        }
                    }

                    listOfExecutions = newListOfExecutions;
                }

                if (stepNumber && !currentStates.length) {
                    stepNumber = -1;
                }

                if ((currentTransitions && EXECUTION_STEP_TIME) || stepNumber === -1) {
                    cleanResults();
                    var res, s;

                    for (i = 0, len = listOfExecutions.length; i < len; ++i) {
                        resultsContent.appendChild(document.createElement("div"));
                        resultsContent.lastChild.className = "execution";
                        res = "";

                        for (j = 0, leng = listOfExecutions[i].length; j < leng; ++j) {
                            s = listOfExecutions[i][j][1];
                            res += j ? ": " + (s === epsilon ? "ε" : aude.elementToString(s, automataMap)) + " → " + aude.elementToString(listOfExecutions[i][j][0]) : aude.elementToString(listOfExecutions[i][j][0]);
                        }

                        resultsContent.lastChild.textContent = res;
                    }
                }

                if (stepNumber === -1) {
                    executionTimeout = 0;
                    var color = accepting ? CURRENT_FINAL_STATE_COLOR : STATE_REFUSED;
                    wordDiv.firstChild.style.color = color;
                    wordDiv.childNodes[1].style.color = color;
                } else {
                    if (!word[0]) { // the word is completely eaten
                        stepNumber = -1;
                    } else {
                        ++stepNumber;
                    }

                    if (!executionByStep) {
                        if (stepNumber && EXECUTION_STEP_TIME) {
                            executionTimeout = setTimeout(execute, EXECUTION_STEP_TIME - ((stepNumber % 2) ? 0 : 1) * EXECUTION_STEP_TIME / 2);
                        } else {
                            execute();
                        }
                    } else if (stepNumber % 2) {
                        executionTimeout = setTimeout(execute, HAND_STEP_TIME);
                    }
                }
            };
        }());


        document.getElementById("algorun").onclick = launchPredefAlgo;

        window.helpSymbols = function (e) {
            if (e === "show") {
                notify(_("Howto: input symbols"), "<div style='max-width:80ex'>" + _("<p>In the window which will invit you to input symbols, simply enter the symbol you want to attach to the transition.</p><p>If you want to attach more than one symbol, separate them with commas.</p><p>If you want to input symbols containing spaces or commas, surrond them with double quotes.</p><p>If you need to input a symbol containing double-quotes or slashes, put a slash behind them and surround the symbol with double-quuotes.</p><p>to insert an epsilon (ε-transition), you can input it directly or use <code>\\e</code></p>") + "</div>", "info");
            } else {
                setTimeout(window.helpSymbols, 0, "show");
            }
        };

        switchmode.onchange();

        var i, len, translatedNodes = document.querySelectorAll("[data-translated-content]");

        for (i = 0, len = translatedNodes.length; i < len; ++i) {
            translatedNodes[i].textContent = _(translatedNodes[i].textContent);
        }

        translatedNodes = document.querySelectorAll("[data-translated-title]");

        for (i = 0, len = translatedNodes.length; i < len; ++i) {
            if (translatedNodes[i].title) {
                translatedNodes[i].title = _(translatedNodes[i].title);
            }

            if (translatedNodes[i].alt) {
                translatedNodes[i].alt = _(translatedNodes[i].alt);
            }
        }

        onResize();
    }, false);
}());
