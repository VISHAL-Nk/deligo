// src/components/Footer.tsx
import React from "react";
import Link from "next/link";
import { FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";

interface SocialLink {
  href: string;
  icon: React.ReactNode;
  label: string;
}

interface NavLink {
  href: string;
  label: string;
}

const Footer: React.FC = () => {
  const navLinks: NavLink[] = [
    { href: "/", label: "Home" },
    { href: "/cart", label: "Cart" },
    { href: "/login", label: "Login" },
  ];

  const socialLinks: SocialLink[] = [
    {
      href: "https://facebook.com",
      icon: <FaFacebook size={20} />,
      label: "Facebook",
    },
    {
      href: "https://twitter.com",
      icon: <FaTwitter size={20} />,
      label: "Twitter",
    },
    {
      href: "https://instagram.com",
      icon: <FaInstagram size={20} />,
      label: "Instagram",
    },
  ];

  return (
    <footer className="bg-gray-100 text-gray-700 mt-12 border-t">
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand Section */}
        <div>
          <h2 className="text-2xl font-bold text-green-600">Deligo</h2>
          <p className="mt-2 text-sm text-gray-500">
            Delivering groceries and essentials at lightning speed 🚀
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Quick Links</h3>
          <ul className="space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="hover:text-green-600 transition-colors duration-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Social Links */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Follow Us</h3>
          <div className="flex space-x-4">
            {socialLinks.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-green-600 transition-colors duration-200"
                aria-label={`Follow us on ${social.label}`}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="bg-gray-200 text-center py-3 text-sm text-gray-600">
        © {new Date().getFullYear()} Deligo. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;