 import '../app/css/error-style.css';

 import Error from '../components/error/Error';

export default function Custom404() {
      return (
        <>
            <div id="error-overlay">
                <Error/>
            </div>
        </>
        );
  }