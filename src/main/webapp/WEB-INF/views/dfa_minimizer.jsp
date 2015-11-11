<%@ page language="java" pageEncoding="UTF-8"
	contentType="text/html;charset=utf-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="form" uri="http://www.springframework.org/tags/form"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>
<html>
<head>
<title>DFA Minimizer</title>
<link rel="stylesheet"
	href="${pageContext.request.contextPath}/resources/css/gui.css" />
<link rel="stylesheet"
	href="${pageContext.request.contextPath}/assets/katex-build/0.3.0/katex.min.css" />
</head>
<!-- <body id="page-top" class="index"> -->
<body>
	<h2>${message}${name}</h2>
	<!-- Minimizer Section -->
	<section>
		<div class="container">
			<div class="row">
				<div class="col-lg-12 text-center">
					<h2>Your Original DFA Here</h2>
					<br> <br> <br>
				</div>
			</div>
			<div class="row">
				<div class="col-lg-8 col-lg-offset-2">
					<form method="post" action="dfa_minimizer/results"
						name="sentMessage" id="contactForm" novalidate>
						<div class="row control-group">
							<div
								class="form-group col-xs-12 floating-label-form-group controls">
								<label>Input</label> <input type="text" class="form-control"
									placeholder="INPUT" id="name" required
									data-validation-required-message="Please enter your name.">
								<p class="help-block text-danger"></p>
							</div>
						</div>
						<div id="success"></div>
						<div class="row">
							<br> <br>
							<div class="form-group col-xs-12">
								<button type="submit" class="btn btn-success btn-lg">Minimize</button>
							</div>
						</div>
					</form>
				</div>
			</div>
		</div>
	</section>
	<section>
		<div id="toolbar" class="designmode">
			<span class="left"> <span> <select id="switchmode">
						<option value="design" data-translated-content="true">Design</option>
						<option value="program" data-translated-content="true">Program</option>
						<option value="automatoncode" data-translated-content="true">Code</option>
				</select>
			</span> <input type="file" id="fileautomaton" style="display: none" /> <input
				type="file" id="fileprogram" style="display: none" /> <input
				type="file" id="filequiz" style="display: none" /> <span>
					<button id="open" data-translated-title="true" title="Open">
						<img
							src="${pageContext.request.contextPath}/resources/img/panel/document-open.png"
							alt="Open" data-translated-title="true" />
					</button>
					<button id="save" data-translated-title="true" title="Save">
						<img
							src="${pageContext.request.contextPath}/resources/img/panel/document-save.png"
							alt="Save" data-translated-title="true" />
					</button>
					<button id="saveas" data-translated-title="true" title="Save As">
						<img
							src="${pageContext.request.contextPath}/resources/img/panel/document-save-as.png"
							alt="Save As" data-translated-title="true" />
					</button>
					<button class="designmode-specific" id="export"
						data-translated-title="true" title="Export">
						<img
							src="${pageContext.request.contextPath}/resources/img/panel/document-export.png"
							alt="Export" data-translated-title="true" />
					</button>
			</span> <span class="sep text">&nbsp;</span> <label for="n_automaton">
					<span data-translated-content="true" class="text algomode-specific">Automaton</span>
					<span class="text algomode-specific">&nbsp;</span>
			</label> <span> <select id="n-automaton"></select>
					<button class="designmode-specific" id="automaton_plus"
						title="Create a new automaton" data-translated-title="true">
						<img alt="+"
							src="${pageContext.request.contextPath}/resources/img/panel/list-add.png" />
					</button>
					<button class="designmode-specific" id="automaton_minus"
						title="Remove current automaton" data-translated-title="true">
						<img alt="-"
							src="${pageContext.request.contextPath}/resources/img/panel/list-remove.png" />
					</button>
			</span> <span class="designmode-specific">
					<button id="redraw" data-translated-content="true">Redraw</button>
			</span> <span> <span class="sep"></span> <span>
						<button id="execute" class="designmode-specific"
							data-translated-content="true">Run a word</button>
				</span> <span> <select id="predef-algos" class="designmode-specific"><option
								data-translated-content="true" value="id">Select an
								algo</option></select>
						<button id="algorun" class="designmode-specific" title="Run"
							data-translated-title="true">
							<img alt="Run" data-translated-title="true"
								src="${pageContext.request.contextPath}/resources/img/panel/system-run.png" />
						</button>
						<button id="algo-exec" data-translated-content="true">Execute
							Program</button>
				</span> <span>
						<button id="automata-list" class="designmode-specific"
							title="Choose and order the parameter automata"
							data-translated-title="true">
							<img alt="#"
								src="${pageContext.request.contextPath}/resources/img/panel/format-list-ordered.png" />
						</button>
				</span>
			</span>
			</span> <span class="right"> <span>
					<button id="quiz" data-translated-content="true">Load a
						Quiz</button>
			</span>
			</span>
		</div>
		<div id="content">
			<div id="automataedit" class="pane">
				<div id="left-pane">
					<div id="automata-container">
						<div id="svg-container" class="pane"></div>
						<div id="automatoncode" class="pane disabled">
							<textarea id="automatoncodeedit"></textarea>
						</div>
					</div>
					<div id="word"></div>
					<div id="div-quiz"></div>
				</div>
				<div id="splitter" class="disabled"></div>
				<div id="results" class="disabled">
					<div id="results-tb">
						<button id="export-result">
							<span data-translated-content="true">Export result</span>
						</button>
					</div>
					<div id="results-content"></div>
					<div id="results-console"></div>
				</div>
				<div id="automata-list-chooser" class="disabled">
					<p id="automata-list-chooser-intro"></p>
					<a href="#" data-translated-content="true"
						id="automata-list-chooser-close">Close</a>
					<ul id="automata-list-chooser-content">
					</ul>
					<button id="automata-list-chooser-btn"
						data-translated-content="true">Continue execution</button>
					<p></p>
				</div>
			</div>
			<div id="codeedit" class="pane disabled"></div>
		</div>
	</section>

	<!-- Local Scripts -->
	<script type="text/javascript;version=1.8">
		
		
            var js18Supported = true;
        
	
	</script>
	<script>
		var libD = {
			path : "${pageContext.request.contextPath}/resources/js/lib/libD/1.1/"
		};

		window.require = function(m) {
			if (m === "audescript-runtime") {
				return audescript;
			}

			if (m === "source-map") {
				return sourceMap;
			}

			throw new Error(
					"this require is dummy and is only for requiring audescript");
		}
	</script>
	<script>
		/*<!--//*/
		if (!window.js18Supported) {
			var js18Supported = false;
		}

		function boot(files) {
			for (var i = 0; i < files.length; i++) {
				document
						.write('<script src="'
								+ files[i]
								+ '"'
								+ (js18Supported ? 'type="application/javascript;version=1.8"'
										: '') + '></'+'script>');
			}
		}
		boot([ "resources/js/lib/source-map.min.js",
				"resources/js/lib/libD/1.1/core.js",
				"resources/js/lib/hammer.min.js", "resources/js/mousewheel.js",
				"resources/js/getFile.js",
				"resources/js/lib/babel-core/browser.min.js",
				"resources/js/lib/babel-core/browser-polyfill.min.js",
				"resources/js/audescript/audescript.js", "resources/js/set.js",
				"resources/js/setIterators.js", "resources/js/map.js",
				"resources/js/audescript/runtime.js", "resources/js/aude.js",
				"resources/js/automaton.js", "resources/js/automaton2dot.js",
				"resources/js/lib/requestAnimationFrame.js",
				"resources/js/automatadesigner.js",
				"assets/katex-build/0.3.0/katex.min.js",
				"assets/katex-build/0.3.0/contrib/auto-render.min.js",
				"resources/js/gui.js", "resources/js/touch2click.js",
				"resources/js/lib/fileSaver.js",
				"resources/js/lib/ace-builds/src-noconflict/ace.js" ]);

		window
				.addEventListener(
						'load',
						function() {
							setTimeout(
									libD.jsLoad,
									0,
									"${pageContext.request.contextPath}/resources/js/lib/viz.js",
									null, '', false, false);
						}, false);
		/* --> //*/
	</script>

</body>
</html>
