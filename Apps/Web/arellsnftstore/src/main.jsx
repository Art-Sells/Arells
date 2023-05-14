import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

//Main components
import Index from "index.jsx";
import ErrorPage from "error-page.jsx";

//Testing components
// import HomeTest from "./test/HomeTest.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index/>,
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