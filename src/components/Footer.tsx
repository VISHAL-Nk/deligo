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
  const quickLinks: NavLink[] = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/cart", label: "Cart" },
    { href: "/search", label: "Search" },
  ];

  const companyLinks: NavLink[] = [
    { href: "/about", label: "About Us" },
    { href: "/contact", label: "Contact Us" },
    { href: "/sellerapplication", label: "Become a Seller" },
    { href: "/deliveryapplication", label: "Delivery Partner" },
  ];

  const legalLinks: NavLink[] = [
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
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
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Brand Section */}
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-bold text-green-600">Deligo</h2>
          <p className="mt-2 text-sm text-gray-500">
            Your trusted online shopping platform delivering quality products
            at great prices with fast, reliable shipping across India. 🚀
          </p>
          {/* Social Links */}
          <div className="flex space-x-4 mt-4">
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

        {/* Quick Links */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Quick Links</h3>
          <ul className="space-y-2">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm hover:text-green-600 transition-colors duration-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Company</h3>
          <ul className="space-y-2">
            {companyLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm hover:text-green-600 transition-colors duration-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h3 className="font-semibold text-gray-800 mb-3">Legal</h3>
          <ul className="space-y-2">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm hover:text-green-600 transition-colors duration-200"
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
        © {new Date().getFullYear()} Deligo. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;