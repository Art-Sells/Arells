import './css/error.css';

import Error from '../components/error/Error';

// export default function Custom500() {
//   return (
//     <>
//       <div id="error-overlay">
//        <Error/>
//       </div>
//     </>
//   );
// }

function Error({ statusCode }) {
  return (
    <div id="error-overlay">
    <Error/>
    {statusCode
           ? `An error ${statusCode} occurred on the server`
           : 'An error occurred on the client'}
   </div>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;