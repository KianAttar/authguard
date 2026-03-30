import { RouterProvider, createBrowserRouter } from "react-router-dom";

import RootLayout from "./pages/Root";
import LoginPage from "./components/Login";
import SignUpPage from "./components/SignUp";
import MFAPage from "./components/MFA";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    // errorElement: ,
    children: [
      { index: true, path: "/", element: <LoginPage /> },
      { path: "/signup", element: <SignUpPage /> },
      { path: "/mfa", element: <MFAPage></MFAPage> },
    ],
  },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
