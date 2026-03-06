import type { Metadata } from "next";
import Link from "next/link";
import {
    ShoppingBag,
    Truck,
    Shield,
    Clock,
    Users,
    Heart,
    Star,
    Zap,
    Globe,
    Headphones,
} from "lucide-react";

export const metadata: Metadata = {
    title: "About Us - Deligo",
    description:
        "Learn about Deligo - your trusted online shopping platform delivering quality products at great prices with fast, reliable shipping.",
};

const stats = [
    { label: "Happy Customers", value: "50,000+", icon: Users },
    { label: "Products Available", value: "10,000+", icon: ShoppingBag },
    { label: "Cities Served", value: "100+", icon: Globe },
    { label: "Orders Delivered", value: "200,000+", icon: Truck },
];

const values = [
    {
        icon: Shield,
        title: "Trust & Transparency",
        description:
            "We believe in honest pricing, genuine products, and clear communication. Every transaction on Deligo is backed by our trust guarantee.",
    },
    {
        icon: Clock,
        title: "Speed & Reliability",
        description:
            "From order placement to doorstep delivery, we optimize every step to ensure your products arrive quickly and in perfect condition.",
    },
    {
        icon: Heart,
        title: "Customer First",
        description:
            "Your satisfaction drives everything we do. Our dedicated support team is available around the clock to help with any questions.",
    },
    {
        icon: Zap,
        title: "Innovation",
        description:
            "We leverage AI-powered recommendations, smart search, and cutting-edge technology to make your shopping experience effortless.",
    },
    {
        icon: Star,
        title: "Quality Assurance",
        description:
            "Every seller on our platform goes through a rigorous verification process. We maintain strict quality standards for all products.",
    },
    {
        icon: Headphones,
        title: "24/7 Support",
        description:
            "Our customer support team is always ready to assist you. Whether it's tracking an order or processing a return, we're here to help.",
    },
];

const team = [
    {
        name: "Vishal Naik",
        role: "Founder & CEO",
        bio: "Passionate about creating seamless e-commerce experiences that connect customers with quality products.",
    },
    {
        name: "Development Team",
        role: "Engineering",
        bio: "A talented group of engineers building the technology that powers Deligo's platform and delivery network.",
    },
    {
        name: "Operations Team",
        role: "Logistics & Support",
        bio: "Ensuring every order is processed, shipped, and delivered with care and precision.",
    },
];

export default function AboutPage() {
    return (
        <main className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative bg-gradient-to-br from-green-600 via-green-500 to-emerald-400 text-white">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptMC00djJoLTJ2LTJoMnptLTQgOHYyaC0ydi0yaDJ6bTAgNHYyaC0ydi0yaDJ6bS00LTh2MmgtMnYtMmgyek0yNCAyNHYyaC0ydi0yaDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
                <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 relative">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                            About <span className="text-yellow-300">Deligo</span>
                        </h1>
                        <p className="text-lg md:text-xl text-green-50 leading-relaxed">
                            We&apos;re on a mission to make online shopping accessible, affordable,
                            and delightful for everyone. Founded with the vision of connecting
                            customers with quality products from trusted sellers.
                        </p>
                    </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
            </section>

            {/* Stats Section */}
            <section className="max-w-6xl mx-auto px-4 -mt-8 relative z-10 mb-16">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={stat.label}
                                className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 text-center hover:shadow-xl transition-shadow duration-300"
                            >
                                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                                    <Icon className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-gray-900">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Our Story Section */}
            <section className="max-w-6xl mx-auto px-4 py-16">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                        Our Story
                    </h2>
                    <div className="space-y-4 text-gray-600 leading-relaxed text-lg">
                        <p>
                            Deligo was born out of a simple observation: online shopping should be
                            easy, trustworthy, and enjoyable. We noticed that many platforms
                            compromise on quality, customer service, or pricing — and we decided
                            to build something better.
                        </p>
                        <p>
                            Starting as a small e-commerce platform, we&apos;ve grown into a
                            comprehensive marketplace that connects thousands of sellers with
                            customers across the country. Our AI-powered recommendation engine
                            helps you discover products tailored to your preferences, while our
                            logistics network ensures fast and reliable delivery.
                        </p>
                        <p>
                            Today, Deligo is more than just an online store. We&apos;re a
                            community of shoppers, sellers, and delivery partners working
                            together to create the best possible shopping experience.
                        </p>
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="bg-gray-50 py-16">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            Our Values
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            These core principles guide every decision we make and every feature
                            we build.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {values.map((value) => {
                            const Icon = value.icon;
                            return (
                                <div
                                    key={value.title}
                                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
                                >
                                    <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4">
                                        <Icon className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        {value.title}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {value.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="max-w-6xl mx-auto px-4 py-16">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        Meet Our Team
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        The passionate people behind Deligo who work tirelessly to bring you
                        the best shopping experience.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                    {team.map((member) => (
                        <div
                            key={member.name}
                            className="text-center bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300"
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <span className="text-2xl font-bold text-white">
                                    {member.name.charAt(0)}
                                </span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {member.name}
                            </h3>
                            <p className="text-green-600 text-sm font-medium mb-2">
                                {member.role}
                            </p>
                            <p className="text-gray-600 text-sm leading-relaxed">
                                {member.bio}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Why Choose Us */}
            <section className="bg-gradient-to-br from-green-600 to-emerald-500 text-white py-16">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Why Choose Deligo?
                        </h2>
                        <p className="text-green-50 max-w-2xl mx-auto">
                            We&apos;re committed to delivering an exceptional shopping experience
                            every single time.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            {
                                title: "Free Shipping",
                                desc: "On orders above ₹499",
                            },
                            {
                                title: "Easy Returns",
                                desc: "30-day hassle-free returns",
                            },
                            {
                                title: "Secure Payments",
                                desc: "100% secure checkout",
                            },
                            {
                                title: "Best Prices",
                                desc: "Competitive pricing guaranteed",
                            },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="text-center bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
                            >
                                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                                <p className="text-green-100 text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="max-w-6xl mx-auto px-4 py-16 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    Ready to Start Shopping?
                </h2>
                <p className="text-gray-600 max-w-2xl mx-auto mb-8">
                    Join thousands of happy customers who trust Deligo for their everyday
                    shopping needs.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/products"
                        className="inline-flex items-center justify-center px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                        <ShoppingBag className="w-5 h-5 mr-2" />
                        Browse Products
                    </Link>
                    <Link
                        href="/contact"
                        className="inline-flex items-center justify-center px-8 py-3 border-2 border-green-600 text-green-600 font-semibold rounded-lg hover:bg-green-50 transition-colors duration-200"
                    >
                        Get in Touch
                    </Link>
                </div>
            </section>
        </main>
    );
}
