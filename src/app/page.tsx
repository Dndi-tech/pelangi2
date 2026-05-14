import Navbar from "@/components/layout/navbar";
import HomeBanner from "@/components/layout/homeBanner";
import About from "@/components/layout/About";
import Location from "@/components/layout/location";
import Footer from "@/components/layout/footer";
import ProductSection from "@/components/layout/product";
export default function Home() {
  return (
    <main>
      <Navbar />
      <HomeBanner />
      <About />
      <ProductSection />
      <Location />
      <Footer />
    </main>
  );
}
