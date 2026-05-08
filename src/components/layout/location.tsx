export default function Location() {
  return (
    <section className="w-full mx-auto max-w-screen-3xl py-10">
      <div className="w-full flex flex-col lg:flex-row justify-center gap-10">
        <div className="flex-1">
          <iframe
            src="https://www.google.com/maps/embed?pb=YOUR_EMBED_URL_HERE"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
        <div className="flex flex-col gap-5 flex-1">
          <h2 className="bold text-yellow-600 font-sans">Temukan kami</h2>
          <h1 className="text-3xl text-black ">Lokasi & Kontak</h1>
          <div className="flex flex-col gap-5">
            <div className="flex gap-3 items-center">
              <div className="rounded-full bg-red-600 w-5 aspect-square"></div>
              <div className="text-sm font-sans gap-3 flex flex-col">
                <p>Alamat Toko</p>
                <p className="font-light">
                  Jl. [Nama Jalan] No. [Nomor], Jakarta, Indonesia [Kode Pos]
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-center">
              <div className="rounded-full bg-red-600 w-5 aspect-square"></div>
              <div className="text-sm font-sans gap-3 flex flex-col">
                <p>Alamat Toko</p>
                <p className="font-light">
                  Jl. [Nama Jalan] No. [Nomor], Jakarta, Indonesia [Kode Pos]
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-center">
              <div className="rounded-full bg-red-600 w-5 aspect-square"></div>
              <div className="text-sm font-sans gap-3 flex flex-col">
                <p>Alamat Toko</p>
                <p className="font-light">
                  Jl. [Nama Jalan] No. [Nomor], Jakarta, Indonesia [Kode Pos]
                </p>
              </div>
            </div>
            <div className="flex w-[80%] justify-start">
              <div className="bg-white py-1 px-2 rounded-l-full rounded-r-full font-sans">
                Instagram
              </div>
              <div className="bg-white py-1 px-2 rounded-l-full rounded-r-full font-sans">
                Instagram
              </div>
              <div className="bg-white py-1 px-2 rounded-l-full rounded-r-full font-sans">
                Instagram
              </div>
              <div className="bg-white py-1 px-2 rounded-l-full rounded-r-full font-sans">
                Instagram
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
