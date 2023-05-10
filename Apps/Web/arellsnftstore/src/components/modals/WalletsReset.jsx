import '../../css/components/Modal.css';

import React from 'react';

const WalletsReset = ({closeWalletsReset}) => {
  // const [modalOpen, setModalOpen] = useState(false);
  // const toggleModal = () => {
  //   setModalOpen(!modalOpen);
  // }
  return (
    <div id="Modal-Container">
        <div id="Modal-Content">
            <p>Wallets Reset</p>
            <p id="Modal-Close" onClick={() => closeWalletsReset(false)}>Ok</p>
        </div>
    </div>
    
  );
}

export default WalletsReset;