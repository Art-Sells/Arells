import '../../css/prototype/cart/cart.css';

import PrototypeCart from '../../../components/prototype/cart/Cart';

export async function generateMetadata({}) {
  let title = "Cart Prototype";
  let description = "Prototype for Cart";

  let openGraph = {
    site_name: "Arells",
    title: title,
    description: description,
    // Change this link after testing
    url: "/prototype/cart", 
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/twitter-image.jpg"
      }
    ]
  };

  let twitter = {
    title: title,
    // Change this link after testing
    url: "/prototype/cart",
    card: "summary_large_image",
    description: description,
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/twitter-image.jpg"
      }
    ]
  };

  return {
    robots: "noimageindex",
    httpEquiv: {
      "X-UA-Compatible": "IE=edge"
    },
    charSet: "UTF-8",
    linkCanonical: "/prototype/cart",
    title,
    description,
    openGraph,
    twitter
  };
}

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