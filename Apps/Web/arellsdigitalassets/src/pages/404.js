 import '../app/css/error-style.css';
 
import Head from 'next/head';
import PageError from '../components/error/404/PageError';

export default function Custom404() {
      return (
        <>
            <Head>
                <title>Page Not Found</title>
                <meta name="title" content="Page Not Found" />
                <meta name="description" content="The page you're looking for was not found." />
            </Head>
            <div id="error-overlay">
                <PageError/>
            </div>
        </>
        );
  }
  
  
  
  