import type { Metadata } from "next";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
    title: "Terms of Service - Deligo",
    description:
        "Read Deligo's Terms of Service to understand the rules and guidelines for using our online shopping platform.",
};

export default function TermsPage() {
    const lastUpdated = "March 6, 2026";

    return (
        <main className="min-h-screen bg-white">
            {/* Header */}
            <section className="bg-gradient-to-br from-green-600 to-emerald-500 text-white">
                <div className="max-w-6xl mx-auto px-4 py-16 text-center">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mb-4">
                        <FileText className="w-7 h-7" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-3">
                        Terms of Service
                    </h1>
                    <p className="text-green-50">Last updated: {lastUpdated}</p>
                </div>
            </section>

            {/* Content */}
            <section className="max-w-4xl mx-auto px-4 py-12">
                <div className="prose prose-lg prose-gray max-w-none space-y-8">
                    {/* Agreement */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            1. Agreement to Terms
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            By accessing or using Deligo (&quot;the Platform&quot;), you agree to be
                            bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to
                            these Terms, you must not use the Platform. These Terms apply to
                            all users, including customers, sellers, delivery partners, and
                            visitors.
                        </p>
                    </div>

                    {/* Account Registration */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            2. Account Registration
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-3">
                            To access certain features, you must create an account. When
                            registering, you agree to:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>Provide accurate, current, and complete information</li>
                            <li>Maintain and update your account information</li>
                            <li>Keep your password secure and confidential</li>
                            <li>Be responsible for all activities under your account</li>
                            <li>Not create multiple accounts or share your account credentials</li>
                        </ul>
                        <p className="text-gray-600 leading-relaxed mt-3">
                            We reserve the right to suspend or terminate accounts that violate
                            these Terms or engage in suspicious activity.
                        </p>
                    </div>

                    {/* Use of Platform */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            3. Acceptable Use
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-3">
                            When using the Platform, you agree not to:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>Use the Platform for any unlawful purpose or in violation of any applicable laws</li>
                            <li>Post or transmit false, misleading, or fraudulent content</li>
                            <li>Interfere with or disrupt the Platform&apos;s functionality, servers, or networks</li>
                            <li>Attempt to gain unauthorized access to any part of the Platform</li>
                            <li>Use automated tools (bots, scrapers) to access the Platform without our written consent</li>
                            <li>Engage in any activity that could harm other users, sellers, or the Platform</li>
                            <li>Impersonate any person or entity, or misrepresent your affiliation</li>
                            <li>Use the Platform to distribute spam, viruses, or harmful content</li>
                        </ul>
                    </div>

                    {/* Products & Orders */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            4. Products and Orders
                        </h2>

                        <h3 className="text-xl font-semibold text-gray-800 mb-3">
                            4.1 Product Listings
                        </h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Products on Deligo are listed by third-party sellers. While we
                            strive to ensure accuracy, we do not guarantee that product
                            descriptions, images, pricing, or availability are always
                            accurate. Sellers are responsible for the accuracy of their
                            listings.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-800 mb-3">
                            4.2 Pricing
                        </h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            All prices are listed in Indian Rupees (₹) and are inclusive of
                            applicable taxes unless otherwise stated. Prices may change
                            without notice. A price change after you place an order will not
                            affect your confirmed order.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-800 mb-3">
                            4.3 Order Acceptance
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            Placing an order constitutes an offer to purchase. We reserve the
                            right to accept or decline any order at our discretion. We may
                            cancel orders due to pricing errors, product unavailability,
                            suspected fraudulent activity, or other reasons. You will be
                            notified and refunded for any cancelled orders.
                        </p>
                    </div>

                    {/* Payments */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            5. Payments
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            We accept various payment methods including credit/debit cards,
                            UPI, net banking, and cash on delivery (where available). All
                            online payments are processed through secure third-party payment
                            gateways. By providing payment information, you represent that you
                            are authorized to use the payment method. We do not store your
                            complete credit/debit card information on our servers.
                        </p>
                    </div>

                    {/* Shipping & Delivery */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            6. Shipping and Delivery
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-3">
                            Delivery times are estimates and may vary based on your location,
                            product availability, and other factors. Key points include:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>Shipping charges may apply based on order value and delivery location</li>
                            <li>Orders above ₹499 may qualify for free shipping (subject to terms)</li>
                            <li>We are not responsible for delays caused by external factors (weather, strikes, etc.)</li>
                            <li>You are responsible for providing an accurate delivery address</li>
                            <li>Risk of loss transfers to you upon delivery to the specified address</li>
                        </ul>
                    </div>

                    {/* Returns & Refunds */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            7. Returns and Refunds
                        </h2>

                        <h3 className="text-xl font-semibold text-gray-800 mb-3">
                            7.1 Return Policy
                        </h3>
                        <p className="text-gray-600 leading-relaxed mb-4">
                            Most products may be returned within 30 days of delivery, provided
                            they are in their original, unused condition with all tags and
                            packaging intact. Certain categories (perishables, personal care,
                            undergarments, customized items) may not be eligible for return.
                        </p>

                        <h3 className="text-xl font-semibold text-gray-800 mb-3">
                            7.2 Refund Process
                        </h3>
                        <p className="text-gray-600 leading-relaxed">
                            Once a return is approved, refunds will be processed within 5-7
                            business days to the original payment method. For COD orders,
                            refunds may be issued via bank transfer. Shipping charges for
                            returns may be deducted unless the return is due to a product
                            defect or incorrect shipment.
                        </p>
                    </div>

                    {/* Seller Terms */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            8. Seller Terms
                        </h2>
                        <p className="text-gray-600 leading-relaxed mb-3">
                            If you register as a seller on Deligo, you additionally agree to:
                        </p>
                        <ul className="list-disc pl-6 text-gray-600 space-y-2">
                            <li>Provide accurate and complete product information</li>
                            <li>Fulfill orders promptly and maintain adequate inventory</li>
                            <li>Comply with all applicable laws and regulations for your products</li>
                            <li>Not list prohibited, counterfeit, or illegal items</li>
                            <li>Respond to customer inquiries and resolve issues in good faith</li>
                            <li>Accept and process returns in accordance with our return policy</li>
                        </ul>
                        <p className="text-gray-600 leading-relaxed mt-3">
                            We reserve the right to remove listings, suspend seller accounts,
                            or withhold payments for violations of these Terms.
                        </p>
                    </div>

                    {/* Intellectual Property */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            9. Intellectual Property
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            All content on the Platform, including but not limited to text,
                            graphics, logos, icons, images, software, and code, is the
                            property of Deligo or its content suppliers and is protected by
                            intellectual property laws. You may not reproduce, distribute,
                            modify, or create derivative works from any content without our
                            express written permission.
                        </p>
                    </div>

                    {/* Advertisements */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            10. Advertisements
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            The Platform may display advertisements provided by third-party
                            advertising networks, including Google AdSense. These
                            advertisements may be targeted based on your browsing behavior and
                            interests. We are not responsible for the content, accuracy, or
                            opinions expressed in advertisements. Clicking on advertisements
                            may redirect you to third-party websites, which are governed by
                            their own terms and privacy policies.
                        </p>
                    </div>

                    {/* Limitation of Liability */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            11. Limitation of Liability
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            To the fullest extent permitted by law, Deligo shall not be liable
                            for any indirect, incidental, special, consequential, or punitive
                            damages, including but not limited to loss of profits, data, or
                            goodwill, arising out of or in connection with your use of the
                            Platform. Deligo acts as an intermediary marketplace and is not
                            liable for the quality, safety, or legality of products listed by
                            sellers. Our total liability shall not exceed the amount paid by
                            you for the specific product or service giving rise to the claim.
                        </p>
                    </div>

                    {/* Disclaimers */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            12. Disclaimers
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            The Platform is provided &quot;as is&quot; and &quot;as available&quot; without
                            warranties of any kind, whether express or implied. We do not
                            warrant that the Platform will be uninterrupted, error-free, or
                            free of viruses or other harmful components. We disclaim all
                            warranties, including implied warranties of merchantability,
                            fitness for a particular purpose, and non-infringement.
                        </p>
                    </div>

                    {/* Dispute Resolution */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            13. Dispute Resolution
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            Any disputes arising from these Terms or your use of the Platform
                            shall first be attempted to be resolved through good-faith
                            negotiation. If a resolution cannot be reached, disputes shall be
                            subject to the exclusive jurisdiction of the courts in Bangalore,
                            Karnataka, India. These Terms shall be governed by and construed
                            in accordance with the laws of India.
                        </p>
                    </div>

                    {/* Modifications */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            14. Modifications to Terms
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            We reserve the right to modify these Terms at any time. Changes
                            will be effective immediately upon posting to the Platform. Your
                            continued use of the Platform after any modifications constitutes
                            acceptance of the updated Terms. We will make reasonable efforts
                            to notify users of material changes through email or prominent
                            notices on the Platform.
                        </p>
                    </div>

                    {/* Termination */}
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            15. Termination
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            We may terminate or suspend your access to the Platform at any
                            time, without prior notice or liability, for any reason,
                            including breach of these Terms. Upon termination, your right to
                            use the Platform will cease immediately. Provisions that by their
                            nature should survive termination shall remain in effect.
                        </p>
                    </div>

                    {/* Contact */}
                    <div className="bg-green-50 rounded-xl p-6 border border-green-100">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                            16. Contact Us
                        </h2>
                        <p className="text-gray-600 leading-relaxed">
                            If you have any questions about these Terms of Service, please
                            contact us at:
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
