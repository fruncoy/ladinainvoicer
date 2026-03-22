import { useState } from 'react';
import { Link, NavLink, Outlet, useMatches } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/invoices', label: 'Invoices' },
  { to: '/receipts', label: 'Receipts' },

  { to: '/bank-details', label: 'Bank Details' },
];

/** @typedef {{ title?: string; subtitle?: string; headerActions?: 'newInvoice' | 'backInvoices' | null }} RouteHandle */

function HeaderActions({ type }) {
  if (type === 'newInvoice') {
    return (
      <Link className="btn btn-primary" to="/invoice/new">
        New Invoice
      </Link>
    );
  }

  if (type === 'backInvoices') {
    return (
      <Link className="btn" to="/invoices">
        Back to invoices
      </Link>
    );
  }
  return null;
}

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const matches = useMatches();
  /** @type {RouteHandle} */
  const handle = matches[matches.length - 1]?.handle ?? {};

  const title = handle.title ?? 'Ladina Invoicer';
  const subtitle = handle.subtitle ?? 'Invoice & receipt management';
  const headerActions = handle.headerActions ?? null;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className={`layout${isSidebarOpen ? ' nav-open' : ''}`}>
      {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}
      <aside className={`sidebar${isSidebarOpen ? ' open' : ''}`} aria-label="Main navigation">
        <div className="brand">
          <img src="/logo.png" alt="Ladina Logo" className="sidebar-logo" />
          Ladina Invoicer
        </div>
        <nav className="sidebar-nav">
          {links.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              onClick={closeSidebar}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <hr className="sidebar-rule" />

      </aside>

      <div className="layout-shell">
        <header className="layout-header">
          <div className="layout-header-left">
            <button className="menu-toggle" onClick={toggleSidebar} aria-label="Toggle menu">
              ☰
            </button>
            <div className="layout-header-text">
              <h1 className="layout-header-title">{title}</h1>
              <p className="muted layout-header-sub">{subtitle}</p>
            </div>
          </div>
          <div className="layout-header-actions">
            <HeaderActions type={headerActions} />
          </div>
        </header>

        <div className="layout-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
