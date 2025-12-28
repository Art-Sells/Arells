'use client';

import React from 'react';
import '../css/connect/connect.css';
import VavityTester from '../../components/Vavity/VavityTester';

const VavityTesterPage = () => {
  return (
    <>
      <style jsx global>{`
        body {
          background-color: #000000 !important;
          color: #ffffff !important;
        }
        #connect-wrapper {
          background-color: #000000 !important;
          color: #ffffff !important;
        }
        #connect-wrapper * {
          color: #ffffff !important;
        }
        #connect-wrapper button {
          color: #ffffff !important;
        }
        #connect-wrapper input {
          background-color: #1a1a1a !important;
          color: #ffffff !important;
          border-color: #333333 !important;
        }
        #connect-wrapper select {
          background-color: #1a1a1a !important;
          color: #ffffff !important;
          border-color: #333333 !important;
        }
      `}</style>
      <div id="connect-wrapper" style={{ backgroundColor: '#000000', color: '#ffffff', minHeight: '100vh' }}>
            <VavityTester/>
      </div>
    </>
  );
}

export default VavityTesterPage;