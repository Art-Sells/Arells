import {RWmodal} from './RWmodal.js';
import axios from 'axios'; 
import '../src/app/stayupdated/page.js';

export const signUp = () => {
  // get the input fields
  let emailInput = document.getElementById("email-input");
  let firstNameInput = document.getElementById("first-input");
  let lastNameInput = document.getElementById("last-input");

  // get the values
  let email = emailInput.value;
  let firstName = firstNameInput.value;
  let lastName = lastNameInput.value;

  if (email === "" || firstName === "" || lastName === "") {
    // Open your modal here with message 'ENTER INFORMATION'
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
      // You might want to do something with the response here
      // reset the input fields
      emailInput.value = "";
      firstNameInput.value = "";
      lastNameInput.value = "";
      // Open your modal here with message 'SUBMITTED'
      RWmodal.open(1, 'SUBMITTED');
    });
  }
}
