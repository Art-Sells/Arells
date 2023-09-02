import '../../../css/prototype/cart/cart.css';

import PrototypeCart from '../../../../components/prototype/asset/Cart';

const CartPage = () => {

  return (
    <>
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
    linkCanonical: "https://arells.com/prototype/cart",
    og: {
      site_name: "Arells",
      type: "website",
      title: "Cart Prototype",
      // Change below link after test    
      url: "https://arells.com/prototype/cart",
      description: "Prototype for Cart",
    },
    twitter: {
      title: "Cart Prototype",
      // Change below link after test
      url: "https://arells.com/prototype/asset/cart",
      description: "Prototype for Cart"
    }
  };