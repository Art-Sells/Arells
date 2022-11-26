<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
    pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html>
	<head>
		
				<!-- Change below links after test -->
		<link rel="stylesheet" type="text/css" href="css/test/stayupdated-test.css">	
		<link rel="stylesheet" href="css/RWmodalani.css" />	
		
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
		
		<meta property="og:image" content="https://user-images.githubusercontent.com/51394348/200199141-3bebaf4d-9052-45c0-a1fa-7bc82bdd263a.jpg">	
		<meta property="og:site_name" content="Arells">	
		<meta property="og:type" content="object">				
		<meta property="og:title" content="Arells">
				<!-- Change below link after test -->
		<meta propety="og:url" content="https://arells.com/stayupdated-test">
		<meta property="og:description" content="Make Money With Your Life Story">
		<meta property="og:image:type" content="image/jpg">
		<meta property="og:image:width" content="700">
		<meta property="og:image:height" content="400">
		
		<meta name="twitter:title" content="Make Money With Your Life Story">
		<meta name="twitter:image" content="https://user-images.githubusercontent.com/51394348/200199141-3bebaf4d-9052-45c0-a1fa-7bc82bdd263a.jpg">
				<!-- Change below link after test -->
		<meta name="twitter:url" content="https://arells.com/stayupdated-test">
		<meta name="twitter:card" content="summary_large_image">
		<meta name="twitter:description" content="Arells">
		<meta name="description" content="Arells">
<!-- Above information for social media sharing and search-engine/browser optimization -->	


<!-- Sign up Javascript Below -->


 		<script src="javascript/RWmodal.min.js"></script>
 		<script
			src="https://code.jquery.com/jquery-3.4.1.js"
			integrity="sha256-WpOohJOqMqqyKL9FccASB9O0KwACQJpFTUBLTYOVvVU="
			crossorigin="anonymous">
		</script>
		<script>		
			function signUp() {
				if (document.getElementById('email-input').value == "" &&
					document.getElementById('first-input').value == ""	&&
					document.getElementById('last-input').value == ""){
						RWmodal.open(1, 'ENTER INFORMATION');
						}	
				if (document.getElementById('email-input').value == "" ||
						document.getElementById('first-input').value == "" ||
						document.getElementById('last-input').value == ""){
							RWmodal.open(1, 'ENTER INFORMATION');
							}								
				else if (document.getElementById('email-input').value !== "" &&
					document.getElementById('first-input').value !== ""	&&
					document.getElementById('last-input').value !== ""){
						$.ajax({
							url:"https://api.apispreadsheets.com/data/uAv9KS8S9kojekky/",
							type:"post",
							data:$("#myForm").serializeArray(),
							headers:{
								accessKey: "c492c5cefcf9fdde44bbcd84a97465f1",
								secretKey: "ac667f2902e4e472c82aff475a4a7a07"}
						});					
						document.getElementById('email-input').value = "";
						document.getElementById('first-input').value = "";
						document.getElementById('last-input').value = "";					
						RWmodal.open(1, 'SUBMITTED');					
					}			
			}
		</script>
<!-- Sign up Javascript Above -->		

		<title>Stay Updated</title>
	
	</head>
	
	<body>
	
		<div id="wrapper">
		
<!-- 			<img id="arells-icon" src="/icons&images/Arells-Icon-Ivory.png"/>		
			 -->
			<br>		
			
			<img id="word-logo" src="/icons&images/Arells-Logo-Ebony.png">	
			
			<br>
			
			<p id="desc">MAKE MONEY WITH YOUR LIFE STORY</p>					
			
            <div id="sign-up">
				<form id="myForm">
					<div id="enter-content">
						<label id="label">EMAIL</label>		
						<br>
						<input name="email" type="email" 
						id="email-input" 
						class=".form-control"></input>
					</div>	
					<div id="enter-content">
						<label id="label">FIRST NAME</label>
						<br>
						<input name="first_name" type="text" 
						id="first-input" 
						class=".form-control"></input>
					</div>
					<div id="enter-content">
						<label id="label">LAST NAME</label>
						<br>
						<input name="last_name" type="text" 
						id="last-input" 
						class=".form-control"></input>
					</div>														
					<br>
				    <a id="submit"  
				    onclick="signUp()">STAY UPDATED</a>
				</form>
            </div>
            
<!--             <div id="signed-up" style="display:block">
            
            	<div id="signed-up-spacer">
            		
            		<h1 id="signed-up-text">WE'LL BE IN TOUCH</h1>
            	
            	</div>
				
            </div>    -->         
		
		</div>			
		
		<div id="footer">
		  <a href="https://twitter.com/arellsofficial"
		      target="_blank"
		      id="contact">
		      <img id="twitter" src="/icons&images/Twitter.png">
		  </a>  		
		</div>
	
	
	</body>
</html>