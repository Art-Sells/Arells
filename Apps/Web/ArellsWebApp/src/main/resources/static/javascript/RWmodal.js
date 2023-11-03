const RWmodal = {

  closer : 0,  // modal close style: 0=X only|1=Outside Box Or X
              // the value for close is set in RWmodal.open function

  // on document ready
  init : function() {
    document.getElementsByTagName("body")[0].innerHTML += `
      <div id="RWmodal" class="RWmodal">
        <div class="RWmodal-content">
          <p class="RWclose" onclick="RWmodal.close();">Ok</p>
          <p></p>
        </div>
      </div>
    `;

    window.onclick = function(event) {
      if (event.target == document.getElementById('RWmodal')) {
        if (RWmodal.closer === 1) {
          document.getElementById('RWmodal').style.display = "none";
        }
      }
    };
  },

  // call this with text to display in 'msg'
  open : function(mode, msg) {
    if (arguments.length < 2) {
      alert("Missing mode arg in RWmodal.open(mode, msg)");
      return;
    }
    RWmodal.closer = mode;
    document.querySelector(".RWmodal-content p").innerHTML = msg;

    if (msg.length > 1800) {  // large text
      document.querySelector(".RWmodal-content p").style = "overflow: auto; height: 250px;";
    }
    document.getElementById('RWmodal').style.display = "block";
  },

  // When the user clicks on <p> (Ok), close the modal
  close : function() {
    document.getElementById('RWmodal').style.display = "none";
  },

  // confirm uses open always with a 0 open mode
  confirm : function(routine, msg) {
    msg += `
      <br><br>
      <button onclick="${routine}">&nbsp;&nbsp;&nbsp;Confirm&nbsp;&nbsp;&nbsp;</button>
    `;
    RWmodal.open(0, msg);
  },

  // prompt uses open always with a 0 open mode
  prompt : function(routine, msg) {
    msg += `
      <br><br>
      <input type="text" id="RWid" size="32"><br><br>
      <button onclick="${routine}">&nbsp;&nbsp;&nbsp; OK &nbsp;&nbsp;&nbsp;</button>
    `;
    RWmodal.open(0, msg);
  }

};

document.addEventListener("DOMContentLoaded", function(event) {
  JSmodal.init();
});