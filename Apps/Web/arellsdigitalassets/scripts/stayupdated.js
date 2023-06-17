import {RWmodal} from './RWmodal.js';
import axios from 'axios'; 
import '../src/app/stayupdated/page.js';

export const signUp = (email, firstName, lastName) => {
  if (email === "" || firstName === "" || lastName === "") {
    RWmodal.open(1, 'ENTER INFORMATION');
  } else {
    axios.post("https://api.apispreadsheets.com/data/uAv9KS8S9kojekky/", {
      email: email,
      first_name: firstName,
      last_name: lastName
    }, {
      headers:{
        accessKey: "c492c5cefcf9fdde44bbcd84a97465f1",
        secretKey: "ac667f2902e4e472c82aff475a4a7a07"
      }
    }).then(response => {
      // Reset the input fields after successful API request in SignUp component
      // Open your modal here with message 'SUBMITTED'
      RWmodal.open(1, 'SUBMITTED');
    });
  }
};



