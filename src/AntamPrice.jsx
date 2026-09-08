function AntamPrice() {
  const hargaJual = 2627000;
  const hargaBuyback = 2480000;

  const selisih = hargaJual - hargaBuyback;

  const formatRupiah = (value) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <section className="antam-price">

      <div className="antam-price-header">
        <div>
          <p className="eyebrow">
            HARGA ANTAM
          </p>

          <h2>
            Harga Emas Hari Ini
          </h2>

          <p>
            Update 08 Sep 2026 • 08:40 WIB
          </p>
        </div>

        <span className="antam-badge">
          ANTAM LM
        </span>
      </div>

      <div className="antam-price-grid">

        <div className="antam-price-card sell">
          <span>
            Harga Jual
          </span>

          <strong>
            {formatRupiah(hargaJual)}
          </strong>

          <small>
            per gram
          </small>
        </div>

        <div className="antam-price-card buyback">
          <span>
            Harga Buyback
          </span>

          <strong>
            {formatRupiah(hargaBuyback)}
          </strong>

          <small>
            per gram
          </small>
        </div>

      </div>

      <div className="antam-spread">
        <span>
          Selisih harga jual & buyback
        </span>

        <strong>
          {formatRupiah(selisih)}
        </strong>

        <small>
          per gram
        </small>
      </div>

      <div className="antam-source">
        <span>
          Sumber: ANTAM Logam Mulia
        </span>

        <a
          href="https://www.logammulia.com/id/harga-emas-hari-ini"
          target="_blank"
          rel="noreferrer"
        >
          Lihat harga resmi →
        </a>
      </div>

    </section>
  );
}

export default AntamPrice;
