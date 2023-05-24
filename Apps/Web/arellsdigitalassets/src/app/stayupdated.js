const StayUpdated = () => {
    return (
        <>
		<div id="wrapper">
			
			<p id="stay-updated">STAY UPDATED</p> 
			
			
			<br/>				
						
			
            <div id="sign-up">   
				
				<form id="myForm">
					<div id="enter-content">
						<label id="label">EMAIL</label>		
						<br/>
						<input name="email" type="email" 
						id="email-input" 
						class=".form-control"></input>
					</div>	
					<div id="enter-content">
						<label id="label">FIRST NAME</label>
						<br/>
						<input name="first_name" type="text" 
						id="first-input" 
						class=".form-control"></input>
					</div>
					<div id="enter-content">
						<label id="label">LAST NAME</label>
						<br/>
						<input name="last_name" type="text" 
						id="last-input" 
						class=".form-control"></input>
					</div>														
					<br/>
				    <a id="submit"  
				    onclick="signUp()">SUBMIT</a>
				</form>
            </div>
            
            <div id="footer">
                <a href="https://twitter.com/arellsofficial"
                    target="_blank"
                    id="contact">
                    <img id="twitter" src="/icons&images/Twitter.png"/>
                </a>  		
            </div>               
		
		</div>			
		     
        </>
    );
}

export default Home;