import React from 'react';
import ReactDOM from 'react-dom';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

//Main components
import Home from 'page.js';

//Testing components
// import HomeTest from "./test/HomeTest.js";

const router = createBrowserRouter([
  {
    path: '/',
    element: React.createElement(Home),
  },
  //Test routes below (comment out after tests)
  // {
  //   path: "/test",
  //   element: React.createElement(HomeTest),
  // },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  React.createElement(
    React.StrictMode,
    {},
    React.createElement(RouterProvider, { router })
  )
);
