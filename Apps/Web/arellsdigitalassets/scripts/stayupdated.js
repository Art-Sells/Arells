import {RWmodal} from './RWmodal.js';
import '../src/app/stayupdated/page.js';

const [email, setEmail] = useState("");
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");

import axios from 'axios'; // Assuming you have axios installed. If not, use npm install axios
  
    export const signUp = () => {
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
          setEmail("");
          setFirstName("");
          setLastName("");
          // Open your modal here with message 'SUBMITTED'
          RWmodal.open(1, 'SUBMITTED');
        });
      }
    }
