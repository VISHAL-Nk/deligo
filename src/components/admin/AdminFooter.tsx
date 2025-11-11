// src/components/admin/AdminFooter.tsx
import React from "react";
import Link from "next/link";
import { FaChartBar, FaUsers, FaTruck, FaCog } from "react-icons/fa";

interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const AdminFooter: React.FC = () => {
  const quickLinks: NavLink[] = [
    { href: "/admin", label: "Dashboard", icon: <FaChartBar /> },
    { href: "/admin/users", label: "Users", icon: <FaUsers /> },
    { href: "/admin/delivery", label: "Delivery", icon: <FaTruck /> },
    { href: "/admin/settings", label: "Settings", icon: <FaCog /> },
  ];

  const supportLinks: NavLink[] = [
    { href: "/admin/statistics", label: "Statistics", icon: null },
    { href: "/admin/sellers", label: "Sellers", icon: null },
    { href: "/admin/hero", label: "Hero Section", icon: null },
  ];

  return (
    <footer className="bg-gray-100 text-gray-700 mt-12 border-t">
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand Section */}
        <div>
          <h2 className="text-2xl font-bold text-green-600">Deligo Admin</h2>
          <p className="mt-2 text-sm text-gray-500">
            Manage your platform efficiently and effectively 🎯
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Quick Links</h3>
          <ul className="space-y-2">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-center gap-2 hover:text-green-600 transition-colors duration-200 text-sm"
                >
                  {link.icon && <span className="text-gray-400">{link.icon}</span>}
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Support Links */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Management</h3>
          <ul className="space-y-2">
            {supportLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="hover:text-green-600 transition-colors duration-200 text-sm"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-200 text-center py-3 text-sm text-gray-600">
        © {new Date().getFullYear()} Deligo Admin Panel. All rights reserved.
      </div>
    </footer>
  );
};

export default AdminFooter;
