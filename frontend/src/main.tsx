import './index.css'
import App from './App.tsx'
import axios from 'axios';
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { LoginPage } from './components/LoginPage.tsx'
import { HelpdeskDashboardPage } from './components/helpdesk/HelpdeskDashboardPage.tsx'
import { ManageHelpdeskPage } from './components/helpdesk/ManageHelpdeskPage.tsx'
import { AuthProvider } from './components/AuthProvider.tsx'
import { PageNotFound } from './components/PageNotFound.tsx';
import "core-js/stable";
import "regenerator-runtime/runtime";
import { BpbDashboardPage } from './components/bpb/BpbDashboardPage.tsx';
import { ManageBpbPage } from './components/bpb/ManageBpbPage.tsx';

axios.defaults.withCredentials = true;

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Navigate to="/helpdesk/main/all" /> },
      { path: "/main", element: <Navigate to="/helpdesk/main/all" /> },
      { path: "/helpdesk/main/:type", element: <HelpdeskDashboardPage /> },
      { path: "/helpdesk/:mode", element: <ManageHelpdeskPage /> },
      { path: "/helpdesk/:mode/:nomor", element: <ManageHelpdeskPage /> },
      { path: "/bpb/main/:type", element: <BpbDashboardPage /> },
      { path: "/bpb/:mode", element: <ManageBpbPage /> },
      { path: "/bpb/:mode/:nomor", element: <ManageBpbPage /> },
      { path: "*", element: <PageNotFound /> }
    ]
  },
]);

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    {
      /*
      <StrictMode>
      </StrictMode>
      */
    }
    <div className="w-full m-auto overflow-clip">
      <RouterProvider router={router} />
    </div>
  </AuthProvider>
  
)
