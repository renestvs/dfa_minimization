<%@ page language="java" pageEncoding="UTF-8" contentType="text/html;charset=utf-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="form" uri="http://www.springframework.org/tags/form" %>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags" %>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
<title>DFA</title>
</head>
<body id="page-top" class="index">
	<div class="row">
        <div class="col-lg-12 text-center">
            <h2>DFA Minimized Results</h2>
            <hr class="star-primary">
        </div>
    </div>
	<div class="row">
	  <div class="col-lg-4 col-lg-offset-2">
	    <h2 class="text-center">DFA Original</h2>
	    <a href=${dfa} class="thumbnail"> 
	      <img src=${dfa} alt="DFA">
	    </a>
	  </div>
	  <div class="col-lg-4">
	    <h2 class="text-center">DFA Minimized</h2>
	    <a href=${minimized} class="thumbnail">
	      <img src=${minimized} alt="DFA Minimized">
	    </a>
	  </div>
	</div>
</body>
</html>