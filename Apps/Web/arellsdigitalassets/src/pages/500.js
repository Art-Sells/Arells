import '../app/css/error-style.css';

import Head from 'next/head';
import Error from '../components/error/500/Error';

export default function Custom500() {
     return (
       <>
            <Head>
                <title>Server Not Found</title>
                <meta name="title" content="Server Not Found" />
                <meta name="description" content="Server for this page not found." />
                {/* Add other meta tags as needed */}
            </Head>
           <div id="error-overlay">
               <Error/>
           </div>
       </>
       );
 }
