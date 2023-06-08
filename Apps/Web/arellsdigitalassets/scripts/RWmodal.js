import '../src/app/css/components/stayupdated-modal.css';

const RWmodal = {
    closer: 0,
    init: function() {
      // Create elements
      let modal = document.createElement('div');
      modal.id = 'RWmodal';
      modal.className = 'RWmodal';
      let modalContent = document.createElement('div');
      modalContent.className = 'RWmodal-content';
      let modalP = document.createElement('p');
      let modalClose = document.createElement('p');
      modalClose.className = 'RWclose';
      modalClose.textContent = 'OK';
      modalClose.onclick = this.close;
  
      // Append elements
      modalContent.appendChild(modalP);
      modalContent.appendChild(modalClose);
      modal.appendChild(modalContent);
      document.body.appendChild(modal);
  
      // Set up click handler
      window.onclick = function(event) {
        if (event.target === document.getElementById('RWmodal')) {
          if (RWmodal.closer === 1) {
            document.getElementById('RWmodal').style.display = "none";
          }
        }
      };
    },
    open: function(mode, msg) {
      if (arguments.length < 2) {
        alert("Missing mode arg in RWmodal.open(mode, msg)");
        return;
      }
      this.closer = mode;
      let p = document.querySelector(".RWmodal-content p");
      p.textContent = msg;
      if (msg.length > 1800) {
        p.style = "overflow: auto; height: 250px;";
      }
      document.getElementById('RWmodal').style.display = "block";
    },
    close: function() {
      document.getElementById('RWmodal').style.display = "none";
    },
    confirm: function(routine, msg) {
      let button = document.createElement('button');
      button.onclick = routine;
      button.textContent = 'Confirm';
      msg += button.outerHTML;
      this.open(0, msg);
    },
    prompt: function(routine, msg) {
      let input = document.createElement('input');
      input.type = "text";
      input.id = "RWid";
      input.size = "32";
      let button = document.createElement('button');
      button.onclick = routine;
      button.textContent = 'OK';
      msg += input.outerHTML + button.outerHTML;
      this.open(0, msg);
    }
  };

  export default RWmodal;