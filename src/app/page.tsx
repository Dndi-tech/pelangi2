import Image from "next/image";
import Navbar from "@/components/layout/navbar";
import HomeBanner from "@/components/layout/homeBanner";
import About from "@/components/layout/About";
export default function Home() {
  return (
    <main>
      <Navbar />
      <HomeBanner />
      <About />
    </main>
  );
}
