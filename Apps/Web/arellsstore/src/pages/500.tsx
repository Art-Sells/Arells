import type { Metadata } from 'next';
import '../app/css/error-style.css';
import React from 'react';

export const metadata: Metadata = {
  title: "Server Not Found",
  description: "The server for this page cannot be found.",
  robots: "noimageindex",
  openGraph: {
    siteName: "Arells",
    title: "Server Not Found",
    description: "The server for this page cannot be found.",
    url: "https://arells.com",
    type: "website",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner.jpg"
      }
    ]
  },
  twitter: {
    title: "Server Not Found",
    description: "The server for this page cannot be found.",
    card: "summary_large_image",
    images: [
      {
        url: "https://arellsimages.s3.us-west-1.amazonaws.com/icons&images/metadata-images/banner.jpg"
      }
    ]
  }
};

export default function Custom500() {
  return (
    <>
      <div id="error-overlay">
        <div style={{ color: '#fff', padding: '32px', textAlign: 'center' }}>
          <h1>Server Error</h1>
          <p>Something went wrong.</p>
        </div>
      </div>
    </>
  );
}
