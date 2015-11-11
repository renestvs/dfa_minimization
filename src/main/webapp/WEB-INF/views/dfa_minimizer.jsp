<%@ page language="java" pageEncoding="UTF-8" contentType="text/html;charset=utf-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="form" uri="http://www.springframework.org/tags/form" %>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags" %>
<html>
	<head>
		<title>DFA Minimizer</title>
	</head>
	<body id="page-top" class="index">
	    <h2> ${message} ${name} </h2>
	    <!-- Minimizer Section -->
	    <section>
	        <div class="container">
	            <div class="row">
	                <div class="col-lg-12 text-center">
	                    <h2>Your Original DFA Here</h2>   
	                    <br>
	                    <br>
	                    <br>
	                </div>
	            </div>
	            <div class="row">
	                <div class="col-lg-8 col-lg-offset-2">
	                    <form method="post" action="dfa_minimizer/results" name="sentMessage" id="contactForm" novalidate>
	                        <div class="row control-group">
	                            <div class="form-group col-xs-12 floating-label-form-group controls">
	                                <label>Input</label>
	                                <input type="text" class="form-control" placeholder="INPUT" id="name" required data-validation-required-message="Please enter your name.">
	                                <p class="help-block text-danger"></p>
	                            </div>
	                        </div>
                            <div id="success"></div>
	                        <div class="row">
	                        	<br>
	                        	<br>
	                            <div class="form-group col-xs-12">
	                                <button type="submit" class="btn btn-success btn-lg">Minimize</button>
	                            </div>
	                        </div>
	                    </form>
	                </div>
	            </div>
	        </div>
	    </section>
	</body>
</html>	