"use client";

export default function About() {
  return (
    <section className="max-w-screen-3xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-center p-10 items-stretch">
        <div className="relative self-stretch flex-1 px-[5%]">
          <div className="bg-amber-800 w-[60%] h-[60%] absolute top-0 left-0"></div>
          <div className="bg-green-800 w-[50%] h-[60%] absolute bottom-0 right-0 border border-white"></div>
        </div>
        <div className="flex-1 pl-[5%] flex flex-col gap-3 ">
          <h3 className="text-amber-700 text-xl bold font-sans">
            Tentang Kami
          </h3>
          <h2 className="bold text-black   text-3xl">
            Lebih dari Sekadar <br />
            Toko Pakaian
          </h2>
          <div className="px-3 bg-red-400/20 py-2  border border-dashed border-red-400">
            <p className="text-red-400  ">
              ✏️ Teks perkenalan toko Anda di sini
            </p>
          </div>
          <p className="text-sm">
            Dari seragam sekolah hingga pakaian batik modern, kami hadir untuk
            memenuhi kebutuhan berpakaian keluarga Indonesia.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 h-[50px]"></div>
            <div className="bg-white border border-gray-200 h-[50px]"></div>
            <div className="bg-white border border-gray-200 h-[50px]"></div>
            <div className="bg-white border border-gray-200 h-[50px]"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
