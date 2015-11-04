<%@ page language="java" pageEncoding="UTF-8" contentType="text/html;charset=utf-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <%@ taglib prefix="decorator" uri="http://www.opensymphony.com/sitemesh/decorator" %>
 
    <meta charset="utf-8"/>
 
    <title><decorator:title></decorator:title></title>
 
    <link rel="stylesheet" type="text/css"
          href="${pageContext.request.contextPath}/assets/bootstrap/2.2.2/css/bootstrap.min.css" media="all"/>
 
    <!-- HTML5 shim, for IE6-8 support of HTML5 elements -->
    <!--[if lt IE 9]>
    <script src="https://html5shim.googlecode.com/svn/trunk/html5.js"></script>
    < ![endif]-->
 
    <decorator:head></decorator:head>
 
    <style>
        body {
            padding-top: 60px; /* 60px to make the container go all the way to the bottom of the topbar */
        }
    </style>
</head>
<body>
 
<div class="navbar navbar-inverse navbar-fixed-top">
    <div class="navbar-inner">
        <div class="container">
            <a class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
                <span class="icon-bar"></span>
            </a>
            <a class="brand" href="#">DFA Minimization</a>
 
            <div class="nav-collapse collapse">
                <ul class="nav">
                    <li class="active"><a href="${pageContext.request.contextPath}/">Home</a></li>
                </ul>
            </div>
            <!--/.nav-collapse -->
        </div>
    </div>
</div>
 
<div class="container">
 
    <c:if test="${page_error != null }">
        <div class="alert alert-error">
            <button type="button" class="close" data-dismiss="alert">&times;</button>
            <h4>Error!</h4>
                ${page_error}
        </div>
    </c:if>
 
    <decorator:body></decorator:body>
 
    <footer>
 
    </footer>
</div>
 
 
<script type="text/javascript"
        src="${pageContext.request.contextPath}/assets/jquery/1.8.2/jquery.min.js"></script>
<script type="text/javascript"
        src="${pageContext.request.contextPath}/assets/bootstrap/2.2.2/js/bootstrap.min.js"></script>
</body>
</html>