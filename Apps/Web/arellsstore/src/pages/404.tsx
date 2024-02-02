import type { Metadata } from 'next';
import '../app/css/error-style.css';
import PageError from '../components/error/404/PageError';
import React from 'react';

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "This page cannot be found.",
  robots: "noimageindex",
  openGraph: {
    siteName: "Arells",
    title: "Page Not Found",
    description: "This page cannot be found.",
    url: "https://arells.com",  // Change this link after testing
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner.jpg"
      }
    ]
  },
  twitter: {
    title: "Page Not Found",
    description: "This page cannot be found.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner.jpg"
      }
    ]
  }
};

export default function Custom404() {
  return (
    <>
      <div id="error-overlay">
        <PageError />
      </div>
    </>
  );
}

  
  
  