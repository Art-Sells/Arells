import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

//Main components
import Home from "home.js";
import ErrorPage from "error-page.js";

//Testing components
// import HomeTest from "./test/HomeTest.js";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home/>,
    errorElement: <ErrorPage />,
  },


  //Test routes below (comment out after tests)
  // {
  //   path: "/test",
  //   element: <HomeTest/>,
  //   errorElement: <ErrorPage />,
  // },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
