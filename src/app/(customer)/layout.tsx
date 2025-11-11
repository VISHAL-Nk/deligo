import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/Footer";
import RoleSimulatorBanner from "@/components/admin/RoleSimulatorBanner";

export default function CustomerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <RoleSimulatorBanner />
    </>
  );
}
