import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import './index.css';
import './i18n';

import Dashboard from './pages/Dashboard';
import Machines from './pages/Machines';
import Repairs from './pages/Repairs';
import Plans from './pages/Plans';
import Templates from './pages/Templates';
import Users from './pages/Users';
import Audit from './pages/Audit';
import Reports from './pages/Reports';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="machines" element={<Machines />} />
          <Route path="repairs" element={<Repairs />} />
          <Route path="plans" element={<Plans />} />
          <Route path="templates" element={<Templates />} />
          <Route path="users" element={<Users />} />
          <Route path="audit" element={<Audit />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
