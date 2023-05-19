import '../../css/components/Modal.css';

import React from 'react';

const ExchangeSuccessful = ({closeExchangeSuccessful}) => {
  // const [modalOpen, setModalOpen] = useState(false);
  // const toggleModal = () => {
  //   setModalOpen(!modalOpen);
  // }
  return (
    <div id="Modal-Container">
        <div id="Modal-Content">
            <p>Exchange Successful</p>
            <p id="Modal-Close" onClick={() => closeExchangeSuccessful(false)}>Ok</p>
        </div>
    </div>
    
  );
}

export default ExchangeSuccessful;