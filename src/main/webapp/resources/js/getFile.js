/*
    Copyright (c) 2013, Raphaël Jakse (Université Joseph Fourier)
    All rights reserved.
    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of Université Joseph Fourier nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

    THIS SOFTWARE IS PROVIDED BY THE REGENTS AND CONTRIBUTORS ``AS IS'' AND ANY
    EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
    WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
    DISCLAIMED. IN NO EVENT SHALL THE REGENTS AND CONTRIBUTORS BE LIABLE FOR ANY
    DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
    (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
    LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
    ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
    SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

/*eslint-env browser*/
/*jslint browser: true, ass: true, indent:4 */

(function (pkg) {
    "use strict";
    var cache = {};
    pkg.getFile = function (fname, success, failure, keep) {
        if (keep && cache[fname] !== undefined) {
            success(cache[fname]);
            return;
        }

        try {
            var xhr = new XMLHttpRequest();
            //workaround chromium issue #45702
            xhr.open("get", fname + (location.protocol === "file:" ? "?" + (new Date().toString()) : ""), true);
            xhr.setRequestHeader("Cache-Control", "no-cache");

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (!xhr.status || (xhr.status === 200 && success)) {
                        if (keep) {
                            cache[fname] = xhr.responseText;
                        }
                        success(xhr.responseText);
                    } else if (failure) {
                        failure("status", xhr.status);
                    }
                }
            };

            xhr.overrideMimeType("text/plain");

            try {
                xhr.send();
            } catch (e) {
                failure("send", 0);
            }
        } catch (e) {
            if (failure) {
                failure(e.message);
            }
        }
    };

    window.setFile = function (fname, data) {
        cache[fname] = data;
    };
}(this));
