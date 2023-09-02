import './css/error.css';

import Error from '../components/error/Error';

export default function Custom500() {
  return (
    <>
      <div id="error-overlay">
       <Error/>
      </div>
    </>
  );
}