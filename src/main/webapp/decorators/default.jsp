<%@ page language="java" pageEncoding="UTF-8" contentType="text/html;charset=utf-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <%@ taglib prefix="decorator" uri="http://www.opensymphony.com/sitemesh/decorator" %>
 
 	<meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="">
    <meta name="author" content="">
    
    <title><decorator:title></decorator:title></title>
 	
 	<!-- Bootstrap Core CSS -->
    <link rel="stylesheet" type="text/css" href="${pageContext.request.contextPath}/assets/bootstrap/3.3.5/css/bootstrap.min.css" media="all"/>
 	
 	<!-- Custom Fonts -->
    <link href="http://fonts.googleapis.com/css?family=Montserrat:400,700" rel="stylesheet" type="text/css">
    <link href="http://fonts.googleapis.com/css?family=Lato:400,700,400italic,700italic" rel="stylesheet" type="text/css">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/resources/font-awesome/css/font-awesome.min.css" type="text/css">
 	
 	<!-- Plugin CSS -->
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/animate.css/3.3.0/animate.min.css" type="text/css">
 	
 	<!-- Custom CSS -->
    <link rel="stylesheet" href="${pageContext.request.contextPath}/resources/css/freelancer.css" type="text/css">
 	
    <!-- HTML5 Shim and Respond.js IE8 support of HTML5 elements and media queries -->
    <!-- WARNING: Respond.js doesn't work if you view the page via file:// -->
    <!--[if lt IE 9]>
        <script src="https://oss.maxcdn.com/libs/html5shiv/3.7.0/html5shiv.js"></script>
        <script src="https://oss.maxcdn.com/libs/respond.js/1.4.2/respond.min.js"></script>
    <![endif]-->
 
    <decorator:head></decorator:head>
 
</head>
<body id="page-top" class="index">

   <!-- Navigation -->
    <nav class="navbar navbar-default navbar-fixed-top">
        <div class="container">
            <!-- Brand and toggle get grouped for better mobile display -->
            <div class="navbar-header page-scroll">
                <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
                    <span class="sr-only">Toggle navigation</span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                    <span class="icon-bar"></span>
                </button>
                <a class="navbar-brand" href="/automaton">Automaton Project</a>
            </div>

            <!-- Collect the nav links, forms, and other content for toggling -->
            <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
                <ul class="nav navbar-nav navbar-right">
                    <li class="hidden">
                        <a href="#page-top"></a>
                    </li>
                    <li class="page-scroll">
                        <a href="#">Approximate Automaton</a>
                    </li>
                    <li class="page-scroll">
                        <a href="/automaton/dfa_minimizer">DFA Minimizer</a>
                    </li>
                    <li class="page-scroll">
                        <a href="#">NFA to DFA</a>
                    </li>
                    <li class="page-scroll">
                        <a href="#">Regex to Automaton</a>
                    </li>
                </ul>
            </div>
            <!-- /.navbar-collapse -->
        </div>
        <!-- /.container-fluid -->
    </nav>
	 
	<div class="index">
	 
	    <c:if test="${page_error != null }">
	        <div class="alert alert-error">
	            <button type="button" class="close" data-dismiss="alert">&times;</button>
	            <h4>Error!</h4>
	                ${page_error}
	        </div>
	    </c:if>
	 
	    <decorator:body></decorator:body>
	 
	   <!-- Footer -->
	    <footer class="text-center">
	        <div class="footer-above">
	            <div class="container">
	                <div class="row">
	                    <div class="footer-col col-md-4">
	                        <h3>Location</h3>
	                        <p>50, Prc. Marechal Eduardo Gomes<br>Sao Jose dos Campos, SP 12228-900</p>
	                    </div>
	                    <div class="footer-col col-md-4">
	                        <h3>Around the Web</h3>
	                        <ul class="list-inline">
	                            <li>
	                                <a href="#" class="btn-social btn-outline"><i class="fa fa-fw fa-facebook"></i></a>
	                            </li>
	                            <li>
	                                <a href="#" class="btn-social btn-outline"><i class="fa fa-fw fa-google-plus"></i></a>
	                            </li>
	                            <li>
	                                <a href="#" class="btn-social btn-outline"><i class="fa fa-fw fa-twitter"></i></a>
	                            </li>
	                            <li>
	                                <a href="#" class="btn-social btn-outline"><i class="fa fa-fw fa-linkedin"></i></a>
	                            </li>
	                            <li>
	                                <a href="http://ita.br" class="btn-social btn-outline"><i class="fa fa-fw fa-dribbble"></i></a>
	                            </li>
	                        </ul>
	                    </div>
	                    <div class="footer-col col-md-4">
	                        <h3>About Us</h3>
	                        <p>The Automaton Project was performed by graduate students led by Prof. Dr. Tasinaffo.</p>
	                    </div>
	                </div>
	            </div>
	        </div>
	        <div class="footer-below">
	            <div class="container">
	                <div class="row">
	                    <div class="col-lg-12">
	                        <span class="copy-left">©</span> Automaton Project 2015
	                    </div>
	                </div>
	            </div>
	        </div>
	    </footer>
	</div>
	 
	<!-- jQuery -->
	<script type="text/javascript" src="${pageContext.request.contextPath}/assets/jquery/2.1.4/jquery.min.js"></script>
	
	<!-- Bootstrap Core JavaScript -->
	<script type="text/javascript" src="${pageContext.request.contextPath}/assets/bootstrap/3.3.5/js/bootstrap.min.js"></script>

	

</body>
</html>