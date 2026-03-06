import type { Metadata } from "next";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
    title: "Privacy Policy - Deligo",
    description:
        "Read Deligo's Privacy Policy to understand how we collect, use, and protect your personal information.",
};

export default function PrivacyPolicyPage() {
    const lastUpdated = "March 6, 2026";

    return (
        <main className="min-h-screen bg-white">
            {/* Header */}
            <section className="bg-gradient-to-br from-green-600 to-emerald-500 text-white">
                <div className="max-w-6xl mx-auto px-4 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mb-4">
                        <Shield className="w-7 h-7" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-3">
                        Privacy Policy
                    </h1>
                    <p className="text-green-50">Last updated: {lastUpdated}</p>
                </div>
            </section>

            {/* Content */}
            <section className="max-w-4xl mx-auto px-4 py-12">
                <div className="prose prose-lg prose-gray max-w-none space-y-8">
                    {/* Introduction */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            1. Introduction
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            Welcome to Deligo (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to
                            protecting your privacy and personal information. This Privacy
                            Policy explains how we collect, use, disclose, and safeguard your
                            information when you visit our website and use our online shopping
                            platform.
                        </p>
                        <p className="text-gray-600 leading-relaxed">
                            By accessing or using Deligo, you agree to this Privacy Policy. If
                            you do not agree with the terms of this policy, please do not
                            access the platform.
                        </p>
                    </div>

                    {/* Information We Collect */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            2. Information We Collect
                        </h2>

                        <h3 className="text-xl font-semibold text-gray-800 mb-3">
                            2.1 Personal Information
                        </h3>
                        <p className="text-gray-600 leading-relaxed mb-3">
                            We may collect personal information that you voluntarily provide to us when you:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>Register for an account (name, email address, phone number)</li>
                            <li>Make a purchase (billing and shipping addresses, payment information)</li>
                            <li>Complete your profile (date of birth, gender, preferences)</li>
                            <li>Contact our customer support (communication records)</li>
                            <li>Apply as a seller or delivery partner (business details, identification documents)</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
                            2.2 Automatically Collected Information
                        </h3>
                        <p className="text-gray-600 leading-relaxed mb-3">
                            When you access our platform, we automatically collect certain information, including:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>Device information (browser type, operating system, device identifiers)</li>
                            <li>Log data (IP address, access times, pages viewed, referring URLs)</li>
                            <li>Usage data (products viewed, search queries, browsing patterns)</li>
                            <li>Location data (general geographic location based on IP address)</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">
                            2.3 Cookies and Tracking Technologies
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            We use cookies, web beacons, and similar tracking technologies to
                            collect information about your browsing activities. Cookies help us
                            provide a better user experience by remembering your preferences,
                            keeping you logged in, and providing personalized product
                            recommendations. You can control cookies through your browser
                            settings, though disabling them may affect your experience on our
                            platform.
                        </p>
                    </div>

                    {/* How We Use Information */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            3. How We Use Your Information
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-3">
                            We use the information we collect for the following purposes:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li><strong>Account Management:</strong> To create and manage your account, process your registrations, and authenticate your identity.</li>
                            <li><strong>Order Processing:</strong> To process and fulfill your orders, manage payments, and communicate about your purchases.</li>
                            <li><strong>Personalization:</strong> To provide personalized product recommendations using our AI-powered recommendation engine based on your browsing and purchase history.</li>
                            <li><strong>Communication:</strong> To send you order confirmations, shipping updates, customer service responses, and promotional communications (with your consent).</li>
                            <li><strong>Platform Improvement:</strong> To analyze usage patterns, troubleshoot issues, and improve our platform&apos;s functionality and user experience.</li>
                            <li><strong>Security:</strong> To detect and prevent fraud, abuse, and unauthorized access to our platform.</li>
                            <li><strong>Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes.</li>
                        </ul>
                    </div>

                    {/* Third-Party Services */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            4. Third-Party Services
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-3">
                            We work with trusted third-party services to operate our platform. These include:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li><strong>Google AdSense:</strong> We use Google AdSense to display advertisements on our platform. Google may use cookies and tracking technologies to serve ads based on your interests. You can learn more about Google&apos;s privacy practices at <a href="https://policies.google.com/privacy" className="text-green-600 hover:text-green-700 underline" target="_blank" rel="noopener noreferrer">Google&apos;s Privacy Policy</a>.</li>
                            <li><strong>Google Analytics / Vercel Analytics:</strong> We use analytics services to understand how visitors interact with our platform. These services may collect information about your browsing behavior.</li>
                            <li><strong>Payment Processors:</strong> We use secure third-party payment processors to handle transactions. Your payment information is processed directly by these services and is not stored on our servers.</li>
                            <li><strong>Authentication Providers:</strong> We offer social login options (Google, Facebook) for account creation. When you use these services, you authorize them to share certain information with us.</li>
                        </ul>
                    </div>

                    {/* Data Sharing */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            5. Information Sharing and Disclosure
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-3">
                            We do not sell your personal information. We may share your information in the following circumstances:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li><strong>With Sellers:</strong> We share necessary order information (shipping address, contact details) with sellers to fulfill your orders.</li>
                            <li><strong>With Delivery Partners:</strong> We share delivery-related information with our delivery partners to complete shipments.</li>
                            <li><strong>Service Providers:</strong> We share data with trusted third-party service providers who assist us in operating our platform (hosting, analytics, email services).</li>
                            <li><strong>Legal Requirements:</strong> We may disclose information when required by law, court order, or governmental authority.</li>
                            <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction.</li>
                        </ul>
                    </div>

                    {/* Data Security */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            6. Data Security
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            We implement industry-standard security measures to protect your
                            personal information. These include encryption (SSL/TLS), secure
                            authentication mechanisms, access controls, and regular security
                            audits. However, no method of electronic transmission or storage
                            is 100% secure, and we cannot guarantee absolute security.
                        </p>
                    </div>

                    {/* Data Retention */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            7. Data Retention
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            We retain your personal information for as long as your account is
                            active or as needed to provide you with our services. We may also
                            retain and use your information to comply with legal obligations,
                            resolve disputes, and enforce our agreements. If you request
                            account deletion, we will remove your personal data within 30 days,
                            except where retention is required by law.
                        </p>
                    </div>

                    {/* Your Rights */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            8. Your Rights
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-3">
                            Depending on your location, you may have the following rights regarding your personal data:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li><strong>Access:</strong> You can request a copy of the personal data we hold about you.</li>
                            <li><strong>Correction:</strong> You can update or correct inaccurate personal data through your profile settings.</li>
                            <li><strong>Deletion:</strong> You can request that we delete your personal data, subject to certain legal exceptions.</li>
                            <li><strong>Opt-out:</strong> You can unsubscribe from marketing communications at any time by clicking the unsubscribe link in our emails.</li>
                            <li><strong>Cookie Control:</strong> You can manage cookies through your browser settings.</li>
                        </ul>
                        <p className="text-gray-600 leading-relaxed mt-3">
                            To exercise any of these rights, please contact us at{" "}
                            <a href="mailto:support@deligo.in" className="text-green-600 hover:text-green-700 underline">
                                support@deligo.in
                            </a>.
                        </p>
                    </div>

                    {/* Children's Privacy */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            9. Children&apos;s Privacy
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            Our platform is not intended for children under the age of 13. We
                            do not knowingly collect personal information from children. If we
                            become aware that we have collected personal data from a child
                            under 13, we will take steps to delete that information promptly.
                        </p>
                    </div>

                    {/* Changes to Policy */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            10. Changes to This Policy
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            We may update this Privacy Policy from time to time. We will
                            notify you of any material changes by posting the new Privacy
                            Policy on this page and updating the &quot;Last updated&quot; date. We
                            encourage you to review this Privacy Policy periodically.
                        </p>
                    </div>

                    {/* Contact */}
                    <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            11. Contact Us
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            If you have any questions or concerns about this Privacy Policy or
                            our data practices, please contact us at:
                        </p>
                        <div className="mt-4 space-y-2 text-gray-700">
                            <p><strong>Deligo</strong></p>
                            <p>Email: <a href="mailto:support@deligo.in" className="text-green-600 hover:text-green-700 underline">support@deligo.in</a></p>
                            <p>Phone: +91 98765 43210</p>
                            <p>Address: Bangalore, Karnataka, India</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
