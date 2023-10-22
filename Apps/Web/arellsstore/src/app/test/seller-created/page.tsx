import '../../css/prototype/seller-created.css';

import React from "react";
import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import {SignerProvider} from "../../../state/signer";
import type { Metadata } from 'next';

import SellerCreatedTest from '../../../components/test/SellerCreatedTest';

export const metadata: Metadata = {
  title: "Seller Creations Test",
  description: "Test for Seller Creations",
  robots: "noimageindex",

  openGraph: {
    title: "Seller Creations Test",
    description: "Test for Seller Creations",
    // Change this link after testing
    url: "https://arells.com/test/seller-created", 
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner-prototype.jpg"
      }
    ]
  },

  twitter: {
    title: "Seller Creations Test",
    description: "Test for Seller Creations",
    // Change this link after testing
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner-prototype.jpg"
      }
    ]
  }
}

const GRAPH_URL = process.env.NEXT_PUBLIC_GRAPH_URL as string;
console.log("GraphQL URL: ", GRAPH_URL);
const client = new ApolloClient({
  cache: new InMemoryCache(),
  uri: GRAPH_URL
});


const SellerCreatedPageTest = () => {

  return (
    <>
      <SignerProvider>  
        <ApolloProvider client={client}>
          <div id="prototype-seller-created-wrapper">
              <SellerCreatedTest/>
          </div>
        </ApolloProvider>  
      </SignerProvider>    
    </>
  );
}

export default SellerCreatedPageTest;


