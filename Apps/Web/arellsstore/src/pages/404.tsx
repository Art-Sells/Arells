import type { Metadata } from 'next';
import '../app/css/error-style.css';
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
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <h1>404</h1>
          <h2>Page Not Found</h2>
          <p>The page you are looking for does not exist.</p>
        </div>
      </div>
    </>
  );
}

  
  
  