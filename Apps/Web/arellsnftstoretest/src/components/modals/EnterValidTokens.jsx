import '../../css/components/Modal.css';

import React from 'react';

const EnterValidTokens = ({closeEnterValidTokens}) => {
  // const [modalOpen, setModalOpen] = useState(false);
  // const toggleModal = () => {
  //   setModalOpen(!modalOpen);
  // }
  return (
    <div id="Modal-Container">
        <div id="Modal-Content">
            <p>Enter Valid Tokens</p>
            <p id="Modal-Close" onClick={() => closeEnterValidTokens(false)}>Ok</p>
        </div>
    </div>
    
  );
}

export default EnterValidTokens;