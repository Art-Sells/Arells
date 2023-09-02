import '../../css/prototype/cart/cart.css';

import PrototypeCart from '../../../components/prototype/cart/Cart';
import Head from 'next/head';

const CartPage = () => {

  return (
    <>
      <Head>
        <meta property="og:image" content="<generated>" />
        <meta property="og:image:type" content="<generated>" />
        <meta property="og:image:width" content="<generated>" />
        <meta property="og:image:height" content="<generated>" />
        <meta name="twitter:image" content="<generated>" />
        <meta name="twitter:image:type" content="<generated>" />
        <meta name="twitter:image:width" content="<generated>" />
        <meta name="twitter:image:height" content="<generated>" />
      </Head>    
      <div id="cart-wrapper">
       <PrototypeCart/>
      </div>
    </>
  );
}

export default CartPage;

export const metadata = {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    title: "Cart Prototype",
    description: "Prototype for Cart",
    google: "nositelinkssearchbox",
    keywords: ["Arells"],
    author: "Arells",
    // Change below link after test  
    linkCanonical: "/prototype/cart",
    og: {
      site_name: "Arells",
      type: "website",
      title: "Cart Prototype",
      // Change below link after test    
      url: "/prototype/cart",
      description: "Prototype for Cart",
    },
    twitter: {
      title: "Cart Prototype",
      // Change below link after test
      url: "/prototype/cart",
      card: "summary_large_image",
      description: "Prototype for Cart"
    }
  };