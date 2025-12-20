import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/Footer";
import DashboardRedirectBanner from "@/components/DashboardRedirectBanner";

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
    </>
  );
}
