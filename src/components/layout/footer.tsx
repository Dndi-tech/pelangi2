export default function Footer() {
  return (
    <div className="w-full bg-amber-100">
      <div className="max-w-screen-3xl w-full mx-auto flex flex-col lg:flex-row items-start justify-center lg:justify-between px-10 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 w-full">
          <div className="flex flex-col gap-3">
            <h1 className="font-sans text-yellow-700 text-xl">Pelangi2</h1>
            <p className="font-sans font-light">
              Toko pakaian lengkap untuk semua <br /> kebutuhan keluarga
              Indonesia.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="font-sans text-lg text-gray-600 tracking-widest">
              KATEGORI
            </h1>
            <div className="flex flex-col gap-2 text-gray-700 font-sans">
              <a href="">Seragam Sekolah</a>
              <a href="">Seragam Sekolah</a>
              <a href="">Seragam Sekolah</a>
              <a href="">Seragam Sekolah</a>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="font-sans text-lg text-gray-600 tracking-widest">
              INFORMASI
            </h1>
            <div className="flex flex-col gap-2 text-gray-700 font-sans">
              <a href="">Tentang Kami</a>
              <a href="">Tentang Kami</a>
              <a href="">Tentang Kami</a>
              <a href="">Tentang Kami</a>
            </div>
          </div>

          <div className="flex flex-col gap-3  ">
            <h1 className="font-sans text-lg text-gray-600 tracking-widest">
              KONTAK
            </h1>
            <div className="flex flex-col gap-2 text-gray-700 font-sans">
              <p>
                Jl. [Nama Jalan] No. XX Jakarta,
                <br /> Indonesia +62 8XX XXXX XXXX <br />
                pelangi2@email.com
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="mx-10 border-t border-t-accent py-10 relative flex items-center justify-between">
        <p className=" top-5 left-0 font-sans ">
          © 2026 Pelangi². Semua hak cipta dilindungi.
        </p>
        <p className="font-sans text-sm text-gray-600">
          Dibuat dengan ❤️ di Indonesia
        </p>
      </div>
    </div>
  );
}
