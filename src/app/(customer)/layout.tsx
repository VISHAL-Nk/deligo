import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/Footer";
import DashboardRedirectBanner from "@/components/DashboardRedirectBanner";
import ChatWidget from "@/components/chatWidget";

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <DashboardRedirectBanner />
      <Navbar />
      {children}
      <Footer />
      {/* Floating AI chatbot — appears on every customer-facing page */}
      <ChatWidget />
    </>
  );
}
