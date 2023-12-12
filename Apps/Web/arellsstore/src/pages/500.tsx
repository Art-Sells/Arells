import type { Metadata } from 'next';
import '../app/css/error-style.css';
import PageError from '../components/error/500/ServerError';
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
        <PageError />
      </div>
    </>
  );
}
