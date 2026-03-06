"use client";

import { useState } from "react";
import {
    Mail,
    Phone,
    MapPin,
    Clock,
    Send,
    MessageSquare,
    HelpCircle,
    ShoppingBag,
} from "lucide-react";
import { FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";
import toast from "react-hot-toast";

const contactInfo = [
    {
        icon: Mail,
        label: "Email",
        value: "support@deligo.in",
        href: "mailto:support@deligo.in",
    },
    {
        icon: Phone,
        label: "Phone",
        value: "+91 98765 43210",
        href: "tel:+919876543210",
    },
    {
        icon: MapPin,
        label: "Address",
        value: "Bangalore, Karnataka, India",
        href: null,
    },
    {
        icon: Clock,
        label: "Business Hours",
        value: "Mon - Sat: 9:00 AM - 6:00 PM IST",
        href: null,
    },
];

const faqItems = [
    {
        question: "How do I track my order?",
        answer:
            "You can track your order by going to the Orders section in your account. You'll see real-time updates on the status of your delivery.",
    },
    {
        question: "What is your return policy?",
        answer:
            "We offer a 30-day hassle-free return policy for most products. Items must be in their original packaging and unused condition.",
    },
    {
        question: "How can I become a seller on Deligo?",
        answer:
            "You can apply to become a seller by visiting our Seller Application page. Our team will review your application and get back to you within 2-3 business days.",
    },
    {
        question: "Is my payment information secure?",
        answer:
            "Absolutely. We use industry-standard encryption and secure payment gateways to protect your financial information. We never store your credit card details on our servers.",
    },
    {
        question: "How do I contact customer support?",
        answer:
            "You can reach us through this contact form, by email at support@deligo.in, or by calling our helpline during business hours.",
    },
];

const socialLinks = [
    { icon: FaFacebook, href: "https://facebook.com", label: "Facebook" },
    { icon: FaTwitter, href: "https://twitter.com", label: "Twitter" },
    { icon: FaInstagram, href: "https://instagram.com", label: "Instagram" },
];

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });
    const [sending, setSending] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);

        // Simulate form submission
        await new Promise((resolve) => setTimeout(resolve, 1500));

        toast.success("Message sent successfully! We'll get back to you soon.");
        setFormData({ name: "", email: "", subject: "", message: "" });
        setSending(false);
    };

    return (
        <main className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 text-white">
                <div className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Get in Touch
                    </h1>
                    <p className="text-lg text-green-50 max-w-2xl mx-auto">
                        Have a question, feedback, or need help? We&apos;d love to hear from you.
                        Our team is ready to assist you.
                    </p>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
            </section>

            {/* Contact Info Cards */}
            <section className="max-w-6xl mx-auto px-4 -mt-8 relative z-10 mb-16">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {contactInfo.map((info) => {
                        const Icon = info.icon;
                        return (
                            <div
                                key={info.label}
                                className="bg-white rounded-xl shadow-lg border border-gray-100 p-5 text-center hover:shadow-xl transition-shadow duration-300"
                            >
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                                    <Icon className="w-5 h-5 text-green-600" />
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    {info.label}
                                </h3>
                                {info.href ? (
                                    <a
                                        href={info.href}
                                        className="text-sm text-green-600 hover:text-green-700 transition-colors"
                                    >
                                        {info.value}
                                    </a>
                                ) : (
                                    <p className="text-sm text-gray-600">{info.value}</p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Contact Form & Info */}
            <section className="max-w-6xl mx-auto px-4 pb-16">
                <div className="grid lg:grid-cols-5 gap-12">
                    {/* Contact Form */}
                    <div className="lg:col-span-3">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <MessageSquare className="w-5 h-5 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                Send Us a Message
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid sm:grid-cols-2 gap-5">
                                <div>
                                    <label
                                        htmlFor="contact-name"
                                        className="block text-sm font-medium text-gray-700 mb-1.5"
                                    >
                                        Full Name *
                                    </label>
                                    <input
                                        id="contact-name"
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="contact-email"
                                        className="block text-sm font-medium text-gray-700 mb-1.5"
                                    >
                                        Email Address *
                                    </label>
                                    <input
                                        id="contact-email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label
                                    htmlFor="contact-subject"
                                    className="block text-sm font-medium text-gray-700 mb-1.5"
                                >
                                    Subject *
                                </label>
                                <select
                                    id="contact-subject"
                                    required
                                    value={formData.subject}
                                    onChange={(e) =>
                                        setFormData({ ...formData, subject: e.target.value })
                                    }
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-white"
                                >
                                    <option value="">Select a subject</option>
                                    <option value="order">Order Related</option>
                                    <option value="product">Product Inquiry</option>
                                    <option value="return">Return / Refund</option>
                                    <option value="seller">Seller Partnership</option>
                                    <option value="delivery">Delivery Partner Inquiry</option>
                                    <option value="feedback">Feedback / Suggestion</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label
                                    htmlFor="contact-message"
                                    className="block text-sm font-medium text-gray-700 mb-1.5"
                                >
                                    Message *
                                </label>
                                <textarea
                                    id="contact-message"
                                    required
                                    rows={5}
                                    value={formData.message}
                                    onChange={(e) =>
                                        setFormData({ ...formData, message: e.target.value })
                                    }
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none"
                                    placeholder="How can we help you?"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={sending}
                                className="inline-flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                {sending ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Send Message
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Quick Help */}
                        <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                            <div className="flex items-center gap-2 mb-4">
                                <ShoppingBag className="w-5 h-5 text-green-600" />
                                <h3 className="font-semibold text-gray-900">Quick Help</h3>
                            </div>
                            <ul className="space-y-3 text-sm">
                                <li>
                                    <a
                                        href="/orders"
                                        className="text-green-600 hover:text-green-700 flex items-center gap-2"
                                    >
                                        → Track your orders
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="/profile"
                                        className="text-green-600 hover:text-green-700 flex items-center gap-2"
                                    >
                                        → Manage your account
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="/sellerapplication"
                                        className="text-green-600 hover:text-green-700 flex items-center gap-2"
                                    >
                                        → Become a seller
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="/deliveryapplication"
                                        className="text-green-600 hover:text-green-700 flex items-center gap-2"
                                    >
                                        → Become a delivery partner
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Social Links */}
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                            <h3 className="font-semibold text-gray-900 mb-4">
                                Follow Us
                            </h3>
                            <div className="flex gap-4">
                                {socialLinks.map((social) => {
                                    const Icon = social.icon;
                                    return (
                                        <a
                                            key={social.label}
                                            href={social.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="w-10 h-10 bg-white rounded-full shadow-sm border border-gray-200 flex items-center justify-center text-gray-500 hover:text-green-600 hover:border-green-200 transition-all duration-200"
                                            aria-label={`Follow us on ${social.label}`}
                                        >
                                            <Icon size={18} />
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="bg-gray-50 py-16">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex items-center justify-center gap-3 mb-10">
                        <HelpCircle className="w-6 h-6 text-green-600" />
                        <h2 className="text-3xl font-bold text-gray-900">
                            Frequently Asked Questions
                        </h2>
                    </div>
                    <div className="space-y-3">
                        {faqItems.map((faq, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                            >
                                <button
                                    onClick={() =>
                                        setOpenFaq(openFaq === index ? null : index)
                                    }
                                    className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <span className="font-medium text-gray-900">
                                        {faq.question}
                                    </span>
                                    <span
                                        className={`text-gray-400 transition-transform duration-200 ${openFaq === index ? "rotate-180" : ""
                                            }`}
                                    >
                                        ▼
                                    </span>
                                </button>
                                {openFaq === index && (
                                    <div className="px-6 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </main>
    );
}
