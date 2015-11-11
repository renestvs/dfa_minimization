/*kate: tab-width 4; space-indent on; indent-width 4; replace-tabs on; eol unix; */

/**
    @fileOverview The core of libD and some convenience functions. Covers listenerSystem, l10n, domEssential packages too.
    @author Raphaël JAKSE
    @verion 1.0-dev

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

/*eslint no-console:0*/

/*global libD:0, console:0*/

libD.need(["mappingFunction", "ws"], function () {
    "use strict";

    libD.getCSS("", "qt");

    var qt = libD.qt = {};

    qt.QObject = function () {
        libD.setListenerSystem(this, qt.QObject.prototype);
        this._connected = libD.getMappingFunction();
        this.qobjectNumber = ++this.qobjectNumberMax;
    };

    libD.objMerge(qt.QObject.prototype, {
        connect: function (sender, signal, receiver, slot) {
            var f = receiver[slot].bind(receiver);
            sender._connected([receiver, slot], f);
            sender.addListener(signal, f);
        },

        disconnect: function (sender, signal, receiver, slot) {
            if (typeof sender === "object" && typeof sender._connected === "function") {
                var f = sender._connected([receiver, slot]);
                if (typeof f === "function") {
                    sender.removeListener(signal, f);
                }
            } else {
                if (window.console) {
                    console.warn("QObject.disconnect: the sender doesn't seem to be a QObject.");
                }
            }
        },

        event: function (event) {
            /*eslint no-unused-vars:0*/
            return false;
        },

        serializeElement: function () {
            return this.qobjectName + "#" + this.qobjectNumber;
        },

        qobjectNumberMax: 0,
        qobjectName: "QObject"
    });

    qt.QEvent = function () {
        qt.QObject.call(this);
        this._accepted = false;
    };

    libD.inherit(qt.QEvent, qt.QObject, {
        accept: function () {
            this.setAccepted(true);
        },

        ignore: function () {
            this.setAccepted(false);
        },

        setAccepted: function (accepted) {
            this._accepted = accepted;
        },

        isAccepted: function () {
            return this._accepted;
        },

        qobjectName: "QEvent"
    });

    qt.QCloseEvent = function () {
        qt.QEvent.call(this);
    };

    libD.inherit(qt.QCloseEvent, qt.QEvent);

    qt.QLayout = function (parent) {
        qt.QObject.call(this);

        if (!this.dom) {
            this.dom = document.createElement("div");
        }

        if (parent) {
            this.parent = parent;
        }

        this._widgets = [];

        this.surfaceHandled = false;

        this.dom.className = "libD-qt-layout libD-qt-" + this.qobjectName;
    };

    libD.inherit(qt.QLayout, qt.QObject, {
        insertWidget: function (index, widget, stretch) {
            var newChildContainer = document.createElement("div");
            newChildContainer.appendChild(widget.dom);
            newChildContainer.className = "libD-qt-layout-item-container";
            if (stretch !== undefined) {
                newChildContainer.style.webkitFlexGrow = stretch;
                newChildContainer.style.flexGrow = stretch;
                newChildContainer.style.webkitFlexShrink = stretch;
                newChildContainer.style.flexShrink = stretch;
            }
            this.dom.insertBefore(newChildContainer, this.dom.childNodes[index]);
            var curIndex = this._widgets.indexOf(widget);

            if (curIndex !== -1) {
                this._widgets.splice(curIndex);
            }

            this._widgets.splice(index, 0, widget);
            widget.setParent(this.parentWidget());
        },

        addWidget: function (widget, stretch) {
            this.insertWidget(this._widgets.length, widget, stretch);
        },

        addLayout: function (layout, stretch) {
            var w = new qt.QWidget();
            w.setLayout(layout);
            w.setParent(this.parentWidget());
            this.addWidget(w, stretch);
        },

        parentWidget: function () {
            return this.parent;
        },

        _setParent: function (widget) {
            for (var i = 0; i < this._widgets.length; i++) {
                this._widgets[i].setParent(widget);
            }

            this.parent = widget;
        },

        showAllWidgets: function () {
            for (var i = 0; i < this._widgets.length; i++) {
                if (!this._widgets[i]._hidden) {
                    this._widgets[i].show();
                }
            }
        },

        setSurfaceHandled: function (b) {
            var win = this.parentWidget && this.parentWidget().window();
            if (win) {
                var i, len;
                if (!b && this.surfaceHandled) {
                    for (i = 0, len = this.dom.childNodes.length; i < len; i++) {
                        win.unsetWindowManagerSurface(this.dom.childNodes[i]);
                    }
                } else if (b && !this.surfaceHandled) {
                    for (i = 0, len = this.dom.childNodes.length; i < len; i++) {
                        win.setWindowManagerSurface(this.dom.childNodes[i]);
                    }
                }
            }

            this.surfaceHandled = b;
        },

        qobjectName: "QLayout"
    });

    qt.QBoxLayout = function (parent) {
        qt.QLayout.call(this, parent);
        this.surfaceHandled = false;
    };

    libD.inherit(qt.QBoxLayout, qt.QLayout, {
    });

    qt.QVBoxLayout = function (parent) {
        qt.QBoxLayout.call(this, parent);
    };

    libD.inherit(qt.QVBoxLayout, qt.QBoxLayout, {
        qobjectName: "QVBoxLayout"
    });

    qt.QHBoxLayout = function (parent) {
        qt.QBoxLayout.call(this, parent);
    };

    libD.inherit(qt.QHBoxLayout, qt.QBoxLayout, {
        qobjectName: "QHBoxLayout"
    });

    qt.QWidget = function (parent) {
        qt.QObject.call(this);

        this._layout = null;
        this._hidden = false;

        if (!this.dom) {
            this.dom = document.createElement("div");
        }

        this.dom.className = "libD-qt-widget libD-qt-" + this.qobjectName;
        this.setParent(parent);
    };

    libD.inherit(qt.QWidget, qt.QObject, {
        _parentShown: function () {
            if (!this._hidden) {
                this.show();
            }
        },

        show: function () {
            this._hidden = false;

            if (!this.parent || (this.parent instanceof libD.WSwin && !this.parent.ws)) {
                this.parent = libD.newWin({
                    left: this.x,
                    top: this.y,
                    width: this.w,
                    height: this.h,
                    title: this.title,
                    content: this.dom
                });

                this.dom.classList.add("libD-ws-colors-auto");
                this.dom.classList.add("libD-ws-size-auto");

                if (this.winDecorationArea && this.parent.ws.wm && this.parent.ws.wm.getDecorationArea) {
                    var da = this.parent.ws.wm.getDecorationArea(this.parent);
                    this.winDecorationArea.setDecorationElement(da);
                }
            }

            var win = this.window();
            if (win && win.parent && win.parent.ws && win.parent.ws.wm.handleSurface) {
                if (win === this) {
                    this.parent.ws.wm.handleSurface(this.parent, this.dom);
                }

                if (this.windowManagerSurfaces) {
                    for (var i = 0; i < this.windowManagerSurfaces.length; ++i) {
                        win.setWindowManagerSurface.apply(win, this.windowManagerSurfaces[i]);
                    }
                }
            }

            delete this.setWindowManagerSurfaces;


            this.dom.classList.remove("libD-qt-hidden");
            this.dom.classList.add("libD-qt-shown");

            if (this.isWindow()) {
                this.parent.show();
            } else {
                if (this.h !== null && this.h !== undefined) {
                    if (typeof this.h === "string") {
                        this.dom.style.height = this.h;
                    } else {
                        this.dom.style.height = this.h + "px";
                    }
                }

                if (this.w !== null && this.w !== undefined) {
                    if (typeof this.w === "string") {
                        this.dom.style.width = this.w;
                    } else {
                        this.dom.style.width = this.w + "px";
                    }
                }
            }

            if (this.winTitleElement) {
                this.getTitleElement();
            }

            if (this.layout()) {
                this.layout().showAllWidgets();
            }

            if (this.winDecorationArea) {
                this.winDecorationArea.show();
            }

            this.emit("show");
            this.updateDecorationAreaHeight();
        },

        _hide: function () {
            this.dom.classList.remove("libD-qt-shown");
            this.dom.classList.add("libD-qt-hidden");
        },

        hide: function () {
            this._hidden = true;

            if (this.isWindow()) {
                this.parent.minimize();
            }
            this._hide();
        },

        close: function () {
            var e = new qt.QCloseEvent();

            this.event(e);

            if (e.isAccepted()) {
                if (this.isWindow()) {
                    this.parent.close();
                    this._hide();
                } else {
                    this.hide();
                }
            }
        },

        event: function (event) {
            if (event instanceof qt.QCloseEvent) {
                this.closeEvent(event);
            } else {
                return false;
            }

            return true;
        },

        closeEvent: function (event) {
            event.accept();
        },

        isHidden: function () {
            return this._hidden;
        },

        resize: function (width, height) {
            this.setWidth(width);
            this.setHeight(height);
        },

        move: function (top, left) {
            this.setTop(top);
            this.setLeft(left);
        },

        setWidth: function (width) {
            this.w = width;

            if (this.isWindow()) {
                this.parent.setWidth(width);
            }
        },

        setHeight: function (height) {
            this.h = height;

            if (this.isWindow()) {
                this.parent.setHeight(height);
            }
        },

        setLeft: function (left) {
            this.x = left;

            if (this.isWindow()) {
                this.parent.setLeft(left);
            }
        },

        setTop: function (top) {
            this.y = top;

            if (this.isWindow()) {
                this.parent.setWidth(top);
            }
        },

        setTitle: function (title) {
            this.title = title;
        },

        getDecorationArea: function () {
            if (this.parent && this.parent instanceof qt.QWidget) {
                return this.parent.getDecorationArea();
            }

            this.winDecorationArea = this.winDecorationArea || new qt.QDecorationArea(this);

            if (this.isWindow() && this.parent.ws.wm && this.parent.ws.wm.getDecorationArea) {
                var da = this.parent.ws.wm.getDecorationArea(this.parent);
                this.winDecorationArea.setDecorationElement(da);
            }

            return this.winDecorationArea;
        },

        getTitleElement: function () {
            if (this.winTitleElement) {
                if (this.winTitleElement.initialized) {
                    return this.winTitleElement;
                }
            }

            if (!this.parent) {
                this.winTitleElement = this.winTitleElement || new qt.QTitleBar(this);
                return this.winTitleElement;
            }

            if (this.parent instanceof qt.QWidget) {
                this.winTitleElement = null;
                return this.parent.getTitleElement();
            }

            if (this.isWindow() && this.parent.ws && this.parent.ws.wm && this.parent.ws.wm.getTitleElement) {
                if (!this.winTitleElement) {
                    this.winTitleElement = new qt.QTitleBar(this);
                }

                this.winTitleElement.setTitleBarElement(this.parent.ws.wm.getTitleElement(this.parent));
                return this.winTitleElement;
            }

            this.winTitleElement = this.winTitleElement || new qt.QTitleBar(this);
            return this.winTitleElement;
        },

        setWindowManagerSurface: function (widget, unset) {
            if (!widget) {
                widget = this;
            }

            if (!this.parent || this._hidden) {
                if (!this.windowManagerSurfaces) {
                    this.windowManagerSurfaces = [];
                }

                this.windowManagerSurfaces.push([widget, unset]);
                return;
            }

            if (this.parent instanceof qt.QWidget) {
                this.parent.setWindowManagerSurface(widget, unset);
                return;
            }

            var win = this.getWindow();
            if (win && win.ws.wm && win.ws.wm.handleSurface) {
                win.ws.wm[unset ? "releaseSurface" : "handleSurface"](win, widget instanceof qt.QObject ? widget.dom : widget);
                if (widget instanceof qt.QLayout) {
                    widget.setSurfaceHandled(!unset);
                }
            }
        },

        unsetWindowManagerSurface: function (widget) {
            this.setWindowManagerSurface(widget, true);
        },


        setParent: function (widget) {
            if (widget === this.parent) {
                return;
            }

            if (this.parent !== widget) {
                if (this.parent) {
                    this.disconnect(this.parent, "show", this, "_parentShown");
                }

                if (widget) {
                    this.connect(widget, "show", this, "_parentShown");
                }
            }

            this.parent = widget || null;
        },

        setLayout: function (layout) {
            if (!(layout instanceof qt.QLayout)) {
                throw new Error("parameter is not a layout.")
            }

            this._layout = layout;

            this.dom.appendChild(layout.dom);
            this.dom.classList.add("libD-qt-has-layout");
            this.dom.classList.add("libD-qt-has-layout-" + layout.qobjectName);
            this.layout()._setParent(this);
        },

        layout: function () {
            return this._layout;
        },

        isWindow: function () {
            return (this.parent && !!this.parent.ws) || false;
        },

        window: function () {
            if (this.parent && this.parent instanceof qt.QObject) {
                return this.parent.window();
            }
            return this;
        },

        getWindow: function () {
            if (this.isWindow()) {
                return this.parent;
            } else if (this.parent) {
                return this.parent.getWindow();
            }

            return null;
        },

        updateDecorationAreaHeight: function () {
            if (this.winDecorationArea && this.winDecorationArea.layout()) {
                this.winDecorationArea.setHeight(this.winDecorationArea.layout().dom.offsetHeight);
            }
        },

        qobjectName: "QWidget"
    });

    qt.QTitleBar = function (parent) {
        qt.QWidget.call(this, parent);
        this.initialized = false;
        this.dom.style.textAlign = "center";
    };

    libD.inherit(qt.QTitleBar, qt.QWidget, {
        setHeight: function (size) {
            qt.QWidget.prototype.setHeight.call(this, size);
            this.dom.style.height = typeof this.h === "number" ? this.h + "px" : this.h;
        },

        setTitleBarElement: function (te) {
            te.classList.add("libD-qt-title-element");

            while (this.dom.firstChild) {
                this.dom.removeChild(this.dom.firstChild);
            }

            this.dom.appendChild(te);
            this.initialized = true;
            this.setWindowManagerSurface();
        },

        qobjectName: "QTitleBar"
    });

    qt.QDecorationArea = function (parent) {
        qt.QWidget.call(this, parent);
        this.dom.style.width = "100%";
    };

    libD.inherit(qt.QDecorationArea, qt.QWidget, {
        setDecorationElement: function (da) {
            if (da === this.da) {
                return;
            }

            this.da = da;

            da.classList.add("libD-qt-decoration-area");
            da.appendChild(this.dom);
            this.parent.setWindowManagerSurface(this);
            if (this.h) {
                this.window().parent.ws.wm.setDecorationAreaHeight(this.window().parent, this.h, true);
            }
        },

        setHeight: function (h) {
            qt.QWidget.prototype.setHeight.call(this, h);
            if (this.da) {
                this.window().parent.ws.wm.setDecorationAreaHeight(this.window().parent, this.h, true);
            }
        },

        setLayout: function (l) {
            qt.QWidget.prototype.setLayout.call(this, l);
            this.parent.setWindowManagerSurface(l);
        },

        qobjectName: "QDecorationArea"
    });

    qt.QTabBar = function () {
        qt.QWidget.call(this);
        this.domTabs = [];
    };

    libD.inherit(qt.QTabBar, qt.QWidget, {
        addTab: function (label) {
            var domTab = document.createElement("div");
            domTab.classList.add("libD-qt-inactive");
            domTab.appendChild(document.createElement("a"));
            domTab.lastChild.textContent = label;
            domTab.lastChild.href = "#";
            domTab.lastChild._that = this;
            domTab.lastChild._tabNumber = this.domTabs.length;
            domTab.lastChild.onclick = this._tabClick;
            this.domTabs[domTab.lastChild._tabNumber] = domTab;
            this.dom.appendChild(domTab);
        },

        _tabClick: function (e) {
            e.target._that.setCurrentIndex(e.target._tabNumber);

            e.preventDefault();
            e.stopPropagation();
            return false;
        },

        setCurrentIndex: function (index) {
            if (index === this._currentIndex) {
                return;
            }

            if (this._currentIndex > -1) {
                this.domTabs[this._currentIndex].classList.remove("libD-qt-active");
                this.domTabs[this._currentIndex].classList.add("libD-qt-inactive");
            }

            this.domTabs[index].classList.remove("libD-qt-inactive");
            this.domTabs[index].classList.add("libD-qt-active");
            this._currentIndex = index;
            this.emit("currentChanged", index);
        },

        qobjectName: "QTabBar"
    });

    qt.QHTMLContainer = function (child) {
        qt.QWidget.call(this);
        this.setChild(child);
    };

    libD.inherit(qt.QHTMLContainer, qt.QWidget, {
        setChild: function (child) {
            this.dom.textContent = "";

            if (child) {
                if (typeof child === "string") {
                    this.dom.innerHTML = child;
                } else {
                    this.dom.appendChild(child);
                    this.child = child;
                    return;
                }
            }

            this.child = null;
        },

        getChild: function () {
            return this.child;
        },

        canHaveLayout: false,

        qobjectName: "QHTMLContainer"
    });

    qt.QTabWidget = function () {
        qt.QWidget.call(this);
        this.pages = [];

        this.dom.appendChild(document.createElement("div"));
        this.dom.lastChild.className = "libD-qt-pages";
    };

    libD.inherit(qt.QTabWidget, qt.QWidget, {
        addTab: function (page, label) {
            if (!this.tabBarWidget) {
                this.setTabBar(new qt.QTabBar());
                this.tabBarWidget.setParent(this);
                this.dom.insertBefore(this.tabBarWidget.dom, this.dom.firstChild);
            }

            this.pages.push(page);
            this.dom.lastChild.appendChild(page.dom);
            page.hide();
            page.setParent(this);

            this.tabBarWidget.addTab(label);
        },

        setTabBar: function (tabBarWidget) {
            if (this.tabBarWidget) {
                this.disconnect(this.tabBarWidget, "currentChanged", this, "setCurrentIndex");
            }

            this.tabBarWidget = tabBarWidget;
            this.connect(this.tabBarWidget, "currentChanged", this, "setCurrentIndex");
        },

        currentWidget: function () {
            return this.pages[this._currentIndex];
        },

        setCurrentWidget: function (widget) {
            this.setCurrentIndex(this.pages.indexOf(widget));
        },

        setCurrentIndex: function (index) {
            if (index === this._currentIndex) {
                return;
            }

            this.tabBarWidget.setCurrentIndex(index);

            if (this._currentIndex > -1) {
                this.pages[this._currentIndex].hide();
            }

            this._currentIndex = index;

            this.pages[this._currentIndex].show();

            this.emit("currentChanged", index);
        },

        currentIndex: function () {
            return this._currentIndex;
        },

        qobjectName: "QTabWidget"
    });

    qt.QAbstractButton = function () {
        qt.QWidget.call(this);
        this.checked = false;
    };

    libD.inherit(qt.QAbstractButton, qt.QWidget, {
        _emitClicked: function () {
            this.emit("clicked");
            if (this.isCheckable()) {
                this.setChecked(!this.isChecked());
                this.emit("toggled");
            }
        },

        _emitPressed: function (that) {
            this.emit("pressed");
        },

        _emitReleased: function (that) {
            this.emit("released");
        },

        isChecked: function () {
            return this.checked;
        },

        isCheckable: function () {
            return this.checkable;
        },

        icon: function () {
            return this._icon;
        },

        setIcon: function (icon) {
            this._icon = icon;
            return this._icon;
        },

        text: function () {
            return this._text;
        },

        setText: function (t) {
            this._text = t;
            this.dom.style.fontSize = t ? null : "0";
        },

        toggle: function () {
            this.setChecked(!this.isChecked());
        },

        qobjectName: "QAbstractButton"
    });

    qt.QPushButton = function (a, b) {
        this.dom = document.createElement("button");
        this.dom.appendChild(document.createElement("span"));
        this.dom.lastChild.className = "libD-qt-icon";
        this.dom.appendChild(document.createElement("span"));
        this.dom.lastChild.className = "libD-qt-label";
        this.dom.onclick = this._emitClicked.bind(this);
        this.dom.onmousedown = this._emitPressed.bind(this);
        this.dom.onmouseup = this._emitReleased.bind(this);
        qt.QWidget.call(this);

        if (b === null || b === undefined) {
            this.setText(a);
        } else {
            this.setIcon(a);
            this.setText(b);
        }
    };

    libD.inherit(qt.QPushButton, qt.QAbstractButton, {
        setText: function (t) {
            qt.QAbstractButton.prototype.setText.call(this, t);
            this.dom.lastChild.textContent = this.text();
        },

        setIcon: function (icon) {
            qt.QAbstractButton.prototype.setIcon.call(this, icon);
            if (!this.dom.firstChild.firstChild) {
                this.dom.firstChild.appendChild(document.createElement("img"));
            }
            this.dom.firstChild.firstChild.src = icon;
        },
        qobjectName: "QPushButton"
    });

    qt.QScrollArea = function (parent) {
        qt.QWidget.call(this, parent);
    };

    libD.inherit(qt.QScrollArea, qt.QWidget, {
        setWidget: function (w) {
            w.setParent(this);
            this.dom.appendChild(w.dom);
        },
        qobjectName: "QScrollArea"
    });

    libD.moduleLoaded("qt");
});
