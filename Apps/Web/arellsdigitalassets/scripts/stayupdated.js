

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