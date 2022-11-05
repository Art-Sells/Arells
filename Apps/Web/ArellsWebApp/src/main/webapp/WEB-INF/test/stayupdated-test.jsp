<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
	<head>
		
				<!-- Change below links after test -->
		<link rel="stylesheet" type="text/css" href="css/test/stayupdated-test.css">	
			
		<meta charset="UTF-8">
		
<!-- Below information for social media sharing and search-engine/browser optimization -->		
		<meta name="title" content="Arells">
		<meta name="description" content="Make Money With Your Life Story">
		<meta name="google" content="nositelinkssearchbox">
		<meta name="keywords" content="Arells">
		<meta name="author" content="Arells">
		<meta name="viewport" id="viewport" content="width=device-width,user-scalable=yes,initial-scale=1" >
	
		<link rel="icon" type="image/x-icon" href="/icons&images/Arells-Ico.ico" sizes="156x156">
				<!-- Change below link after test -->
		<link rel="canonical" href="https://arells.com/stayupdated-test">
		
		<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/197365387-1384787a-0dd7-4e78-88f9-7464a8eb07c1.jpg">	
		<meta property="og:site_name" content="Arells">	
		<meta property="og:type" content="object">				
		<meta property="og:title" content="Arells">
				<!-- Change below link after test -->
		<meta propety="og:url" content="https://arells.com/stayupdated-test">
		<meta property="og:description" content="Make Money With Your Life Story">
		<meta property="og:image:type" content="image/jpg">
		<meta property="og:image:width" content="700">
		<meta property="og:image:height" content="400">
		
		<meta name="twitter:title" content="Arells">
		<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/197365387-1384787a-0dd7-4e78-88f9-7464a8eb07c1.jpg">
				<!-- Change below link after test -->
		<meta name="twitter:url" content="https://arells.com/stayupdated-test">
		<meta name="twitter:card" content="summary_large_image">
		<meta name="twitter:description" content="Make Money With Your Life Story">
		<meta name="description" content="Make Money With Your Life Story">
<!-- Above information for social media sharing and search-engine/browser optimization -->	


<!-- Sign up Javascript Below -->

 		<script src="javascript/RWmodal.min.js"></script>
		<script type="text/javascript">
		
			function signUp() {
				if (document.getElementById('email-input').value == ""){
					document.getElementById('email-error').style.display = "block";
					}
				if (document.getElementById('first-input').value == ""){
					document.getElementById('first-error').style.display = "block";
					}
				if (document.getElementById('last-input').value == ""){
					document.getElementById('last-error').style.display = "block";
					}				
			}
		</script>

		<title>Stay Updated</title>
	
	</head>
	
	<body>
	
		<div id="wrapper">
		
			<img id="arells-icon" src="/icons&images/Arells-Icon.png"/>
			
			<h2 id="slogan">STAY UPDATED</h2>
			
			<p id="slogan">To Make Money With Your Life Story</p>			
			
            <div id="sign-up">
				<form>
					<div id="enter-content">
						<label id="label">Email</label>	
						<p id="email-error" style="display:none">Required</p>			
						<input name="email" type="email" id="email-input"></input>
					</div>	
					<div id="enter-content">
						<label id="label">First Name</label>
						<p id="first-error" style="display:none">Required</p>	
						<input name="first_name" type="text" id="first-input"></input>
					</div>
					<div id="enter-content">
						<label id="label">Last Name</label>
						<p id="last-error" style="display:none">Required</p>	
						<input name="last_name" type="text" id="last-input"></input>
					</div>														
					<br>
				    <button id="submit"  
				    onclick="signUp()">Submit</button>
				</form>
            </div>		
		
		</div>			
		

	
	
	</body>
</html>