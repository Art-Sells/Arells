import '../../css/components/Modal.css';

import React from 'react';

const ConnectWallets = ({closeConnectWallets}) => {
  // const [modalOpen, setModalOpen] = useState(false);
  // const toggleModal = () => {
  //   setModalOpen(!modalOpen);
  // }
  return (
    <div id="Modal-Container">
        <div id="Modal-Content">
            <p>Connect Both Wallets</p>
            <p id="Modal-Close" onClick={() => closeConnectWallets(false)}>Ok</p>
        </div>
    </div>
    
  );
}

export default ConnectWallets;