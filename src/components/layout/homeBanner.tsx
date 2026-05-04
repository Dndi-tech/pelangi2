"use client";

export default function HomeBanner() {
  return (
    <main className="w-full mx-auto max-w-screen-3xl    ">
      <div className="flex flex-col lg:flex-row px-10  h-[50svh]">
        <div className="px-[5%] py-8 flex flex-col items-start justify-center gap-5 flex-1">
          <div className="flex flex-row items-center ">
            <hr className="w-3 h-[2px] bg-green-800 mr-3" />
            <p className="font-sans text-green-700">Koleksi Terbaru 2026</p>
          </div>
          <h1 className="font-serif text-6xl font-bold leading-[0.95] tracking-tight text-[#1A110A]">
            Pakaian
            <br />
            Untuk <em className="italic text-[#C8392B]">Semua</em>
            <br />
            Kesempatan
          </h1>
          <p className="text-sm text-[#7C6E62] leading-relaxed max-w-sm border-l-[3px] border-[#D4920A] pl-4">
            [Teks perkenalan toko Pelangi² — ceritakan visi dan misi toko Anda
            di sini]
          </p>

          <div className="flex flex-row gap-5">
            <a
              href=""
              className="py-2 px-3 cursor-pointer bg-red-500 text-white"
            >
              Belanja Sekarang
            </a>
            <a
              href=""
              className="py-2 px-3 cursor-pointer border-red-500 text-red-500 border"
            >
              Tentang Kami
            </a>
          </div>
        </div>
        <div className="border-x border-accent flex-1">
          <div className="flex gap-1 h-full">
            <div className="flex-1 bg-accent"></div>
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex-1 bg-green-500"></div>
              <div className="flex-1 bg-accent"></div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex lg:h-[100px] flex-col lg:flex-row w-full border border-y-[#EAE0D0]  bg-white divide-x divide-[#EAE0D0]">
        <div className="flex-1 lg:h-auto h-[75px]"></div>
        <div className="flex-1 lg:h-auto h-[75px]"></div>
        <div className="flex-1 lg:h-auto h-[75px]"></div>
      </div>
    </main>
  );
}
