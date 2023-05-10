import '../../css/components/Modal.css';

import React from 'react';

const LimitedTotalTokens = ({closeLimitedTotalTokens}) => {
  // const [modalOpen, setModalOpen] = useState(false);
  // const toggleModal = () => {
  //   setModalOpen(!modalOpen);
  // }
  return (
    <div id="Modal-Container">
        <div id="Modal-Content">
            <p>Limited Total Tokens</p>
            <p id="Modal-Close" onClick={() => closeLimitedTotalTokens(false)}>Ok</p>
        </div>
    </div>
    
  );
}

export default LimitedTotalTokens;