import { createBrowserRouter, Navigate, RouterProvider, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import InvoiceEditor from './pages/InvoiceEditor';
import Receipts from './pages/Receipts';

import BankDetails from './pages/BankDetails';

function InvoiceEditRoute() {
  const { id } = useParams();
  return <InvoiceEditor invoiceId={id} />;
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
        handle: {
          title: 'Dashboard',
          subtitle: 'Ladina Travel Safaris invoicer',
          headerActions: null,
        },
      },
      {
        path: 'invoices',
        element: <Invoices />,
        handle: {
          title: 'Invoices',
          subtitle: 'Create, edit, and delete invoices',
          headerActions: null,
        },
      },
      {
        path: 'invoice/new',
        element: <InvoiceEditor />,
        handle: {
          title: 'New invoice',
          subtitle: 'Add line items and save',
          headerActions: 'backInvoices',
        },
      },
      {
        path: 'invoice/:id',
        element: <InvoiceEditRoute />,
        handle: {
          title: 'Edit invoice',
          subtitle: 'Update line items and save',
          headerActions: 'backInvoices',
        },
      },
      {
        path: 'receipts',
        element: <Receipts />,
        handle: {
          title: 'Receipts',
          subtitle: 'Generated from invoices',
          headerActions: null,
        },
      },

      {
        path: 'bank-details',
        element: <BankDetails />,
        handle: { title: 'Bank Details', subtitle: 'Company payment info', headerActions: null },
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
