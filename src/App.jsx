import React, { useMemo, useState } from "react";
import "./App.css";
import { loadGoldData, saveGoldData } from "./storage";

const DEFAULT_BRANDS = [
  "Antam",
  "UBS",
  "Hartadinata",
  "Lotus Archi",
  "King Halim",
  "Bullion Spot",
  "Minigold",
];

const BRAND_STORAGE_KEY = "gold-save-brands";

function loadBrands() {
  try {
    const data = localStorage.getItem(BRAND_STORAGE_KEY);

    if (!data) {
      return DEFAULT_BRANDS;
    }

    const customBrands = JSON.parse(data);

    return [
      ...new Set([
        ...DEFAULT_BRANDS,
        ...customBrands,
      ]),
    ];
  } catch {
    return DEFAULT_BRANDS;
  }
}

function saveBrands(brands) {
  localStorage.setItem(
    BRAND_STORAGE_KEY,
    JSON.stringify(brands)
  );
}

function App() {
  const [transactions, setTransactions] =
    useState(loadGoldData);

  const [brands, setBrands] =
    useState(loadBrands);

  const [page, setPage] =
    useState("dashboard");

  const [theme, setTheme] =
    useState("emerald");

  const [form, setForm] = useState({
    jenisLM: "Antam",
    customJenisLM: "",
    gramasi: "",
    jumlah: 1,
    hargaTotal: "",
  });

  const formatRupiah = (number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);

  const formatNumber = (number) =>
    new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 2,
    }).format(number);

  const formatPriceInput = (value) => {
    if (!value) return "";

    const number = Number(
      String(value).replace(/\D/g, "")
    );

    if (!number) return "";

    return new Intl.NumberFormat("id-ID").format(number);
  };

  const totalGram = useMemo(
    () =>
      transactions.reduce(
        (total, item) =>
          total +
          Number(item.gramasi) *
            Number(item.jumlah),
        0
      ),
    [transactions]
  );

  const totalModal = useMemo(
    () =>
      transactions.reduce(
        (total, item) =>
          total + Number(item.hargaTotal),
        0
      ),
    [transactions]
  );

  const totalKeping = useMemo(
    () =>
      transactions.reduce(
        (total, item) =>
          total + Number(item.jumlah),
        0
      ),
    [transactions]
  );

  const hargaRataRata =
    totalGram > 0
      ? totalModal / totalGram
      : 0;

  const totalGramInput =
    (Number(form.gramasi) || 0) *
    (Number(form.jumlah) || 0);

  const hargaPerGramInput =
    totalGramInput > 0
      ? (Number(form.hargaTotal) || 0) /
        totalGramInput
      : 0;

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "hargaTotal") {
      const cleanValue = value.replace(/\D/g, "");

      setForm((prev) => ({
        ...prev,
        hargaTotal: cleanValue,
      }));

      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const jenisLM =
      form.jenisLM === "Lainnya"
        ? form.customJenisLM.trim()
        : form.jenisLM;

    const gramasi = Number(form.gramasi);
    const jumlah = Number(form.jumlah);
    const hargaTotal = Number(form.hargaTotal);

    if (!jenisLM) {
      alert("Masukkan nama logam mulia.");
      return;
    }

    if (
      gramasi <= 0 ||
      jumlah <= 0 ||
      hargaTotal <= 0
    ) {
      alert("Lengkapi semua data pembelian.");
      return;
    }

    const newTransaction = {
      id: Date.now(),
      jenisLM,
      gramasi,
      jumlah,
      hargaTotal,
      tanggal: new Date().toISOString(),
    };

    const updatedTransactions = [
      newTransaction,
      ...transactions,
    ];

    setTransactions(updatedTransactions);
    saveGoldData(updatedTransactions);

    // Simpan jenis LM baru
    if (
      form.jenisLM === "Lainnya" &&
      !brands.includes(jenisLM)
    ) {
      const updatedBrands = [
        ...brands,
        jenisLM,
      ];

      setBrands(updatedBrands);
      saveBrands(updatedBrands);
    }

    setForm({
      jenisLM,
      customJenisLM: "",
      gramasi: "",
      jumlah: 1,
      hargaTotal: "",
    });

    setPage("dashboard");
  };

  const handleDelete = (id) => {
    if (!window.confirm("Hapus transaksi ini?")) {
      return;
    }

    const updatedTransactions =
      transactions.filter(
        (item) => item.id !== id
      );

    setTransactions(updatedTransactions);
    saveGoldData(updatedTransactions);
  };

  const formatDate = (date) =>
    new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));

  const brandSummary = brands
    .map((brand) => {
      const gram = transactions
        .filter(
          (item) => item.jenisLM === brand
        )
        .reduce(
          (total, item) =>
            total +
            Number(item.gramasi) *
              Number(item.jumlah),
          0
        );

      return {
        brand,
        gram,
        percentage:
          totalGram > 0
            ? (gram / totalGram) * 100
            : 0,
      };
    })
    .filter((item) => item.gram > 0);

  return (
    <div className={`app theme-${theme}`}>

      <header className="navbar">

        <div className="brand">
          <div className="brand-mark">
            Au
          </div>

          <div>
            <div className="logo">
              GOLD<span>SAVE</span>
            </div>

            <div className="logo-subtitle">
              Personal Gold Savings
            </div>
          </div>
        </div>

        <nav className="nav-menu">

          <button
            className={
              page === "dashboard"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() =>
              setPage("dashboard")
            }
          >
            Dashboard
          </button>

          <button
            className={
              page === "purchase"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() =>
              setPage("purchase")
            }
          >
            Pembelian
          </button>

        </nav>

        <div className="nav-actions">

          <select
            className="theme-select"
            value={theme}
            onChange={(e) =>
              setTheme(e.target.value)
            }
          >
            <option value="emerald">
              Emerald
            </option>

            <option value="dark-gold">
              Dark Gold
            </option>

            <option value="midnight">
              Midnight
            </option>
          </select>

          <div className="coin-count">
            {totalKeping} Keping
          </div>

        </div>

      </header>


      <main className="main-container">

        {page === "dashboard" ? (

          <Dashboard
            totalGram={totalGram}
            totalModal={totalModal}
            hargaRataRata={hargaRataRata}
            totalKeping={totalKeping}
            transactions={transactions}
            brandSummary={brandSummary}
            formatRupiah={formatRupiah}
            formatNumber={formatNumber}
            formatDate={formatDate}
            handleDelete={handleDelete}
            onAddPurchase={() =>
              setPage("purchase")
            }
          />

        ) : (

          <Purchase
            form={form}
            brands={brands}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            totalGramInput={totalGramInput}
            hargaPerGramInput={
              hargaPerGramInput
            }
            formatRupiah={formatRupiah}
            formatNumber={formatNumber}
            formatPriceInput={
              formatPriceInput
            }
            onBack={() =>
              setPage("dashboard")
            }
          />

        )}

      </main>

      <footer>
        GOLD SAVE • Personal Gold Savings
      </footer>

    </div>
  );
}


/* =========================
   DASHBOARD
========================= */

function Dashboard({
  totalGram,
  totalModal,
  hargaRataRata,
  totalKeping,
  transactions,
  brandSummary,
  formatRupiah,
  formatNumber,
  formatDate,
  handleDelete,
  onAddPurchase,
}) {
  return (
    <>
      <section className="hero">

        <div>
          <p className="eyebrow">
            PORTOFOLIO EMAS
          </p>

          <h1>
            Tabungan emas kamu.
          </h1>

          <p className="hero-description">
            Pantau jumlah emas, modal pembelian,
            dan harga rata-rata dalam satu tampilan.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={onAddPurchase}
        >
          + Tambah Pembelian
        </button>

      </section>


      <section className="dashboard-stats">

        <div className="big-stat">

          <span>Total Emas</span>

          <strong>
            {formatNumber(totalGram)}
            <small>gram</small>
          </strong>

          <p>
            {totalKeping} keping emas
          </p>

        </div>


        <div className="stat-card">

          <span>Total Modal</span>

          <strong>
            {formatRupiah(totalModal)}
          </strong>

          <p>
            Seluruh pembelian
          </p>

        </div>


        <div className="stat-card">

          <span>Harga Rata-rata</span>

          <strong>
            {formatRupiah(hargaRataRata)}
          </strong>

          <p>
            Modal per gram
          </p>

        </div>

      </section>


      <section className="dashboard-grid">

        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>Distribusi Emas</h2>
              <p>
                Berdasarkan brand LM
              </p>
            </div>

          </div>

          {brandSummary.length === 0 ? (

            <div className="empty-small">
              Belum ada data emas.
            </div>

          ) : (

            <div className="brand-list">

              {brandSummary.map((item) => (

                <div
                  className="brand-row"
                  key={item.brand}
                >

                  <div className="brand-row-top">

                    <span>
                      {item.brand}
                    </span>

                    <strong>
                      {formatNumber(
                        item.gram
                      )}{" "}
                      <small>gram</small>
                    </strong>

                  </div>

                  <div className="progress">

                    <div
                      className="progress-fill"
                      style={{
                        width:
                          `${item.percentage}%`,
                      }}
                    />

                  </div>

                  <small>
                    {item.percentage.toFixed(1)}%
                    {" "}dari total emas
                  </small>

                </div>

              ))}

            </div>

          )}

        </div>


        <div className="panel">

          <div className="panel-header">

            <div>
              <h2>Pembelian Terbaru</h2>

              <p>
                Riwayat transaksi
              </p>
            </div>

            <span className="count-badge">
              {transactions.length}
            </span>

          </div>


          {transactions.length === 0 ? (

            <div className="empty-small">
              Belum ada pembelian.
            </div>

          ) : (

            <div className="recent-list">

              {transactions
                .slice(0, 5)
                .map((item) => {

                  const gram =
                    Number(item.gramasi) *
                    Number(item.jumlah);

                  return (
                    <div
                      className="recent-item"
                      key={item.id}
                    >

                      <div className="gold-circle">
                        Au
                      </div>

                      <div className="recent-info">

                        <strong>
                          {item.jenisLM}
                        </strong>

                        <span>
                          {item.gramasi} gram ×{" "}
                          {item.jumlah}
                        </span>

                        <small>
                          {formatDate(
                            item.tanggal
                          )}
                        </small>

                      </div>

                      <div className="recent-value">

                        <strong>
                          {formatRupiah(
                            item.hargaTotal
                          )}
                        </strong>

                        <span>
                          {formatNumber(gram)} gram
                        </span>

                      </div>

                      <button
                        className="mini-delete"
                        onClick={() =>
                          handleDelete(
                            item.id
                          )
                        }
                        title="Hapus"
                      >
                        ×
                      </button>

                    </div>
                  );
                })}

            </div>

          )}

        </div>

      </section>
    </>
  );
}


/* =========================
   PURCHASE
========================= */

function Purchase({
  form,
  brands,
  handleChange,
  handleSubmit,
  totalGramInput,
  hargaPerGramInput,
  formatRupiah,
  formatNumber,
  formatPriceInput,
  onBack,
}) {
  return (
    <section className="purchase-page">

      <button
        className="back-button"
        onClick={onBack}
      >
        ← Kembali ke Dashboard
      </button>


      <div className="purchase-heading">

        <p className="eyebrow">
          TRANSAKSI
        </p>

        <h1>
          Tambah Pembelian
        </h1>

        <p>
          Catat pembelian logam mulia kamu.
        </p>

      </div>


      <div className="purchase-layout">

        <div className="purchase-card">

          <form onSubmit={handleSubmit}>

            <div className="form-group">

              <label>
                Jenis Logam Mulia
              </label>

              <select
                name="jenisLM"
                value={form.jenisLM}
                onChange={handleChange}
              >

                {brands.map((brand) => (

                  <option
                    key={brand}
                    value={brand}
                  >
                    {brand}
                  </option>

                ))}

                <option value="Lainnya">
                  + Tambahkan LM Baru
                </option>

              </select>

            </div>


            {form.jenisLM === "Lainnya" && (

              <div className="form-group">

                <label>
                  Nama Logam Mulia Baru
                </label>

                <input
                  type="text"
                  name="customJenisLM"
                  value={
                    form.customJenisLM
                  }
                  onChange={handleChange}
                  placeholder="Contoh: Galeri 24"
                />

                <div className="input-hint">
                  Nama ini akan tersimpan
                  untuk pembelian berikutnya.
                </div>

              </div>

            )}


            <div className="form-row">

              <div className="form-group">

                <label>
                  Gramasi
                </label>

                <div className="input-unit">

                  <input
                    type="number"
                    name="gramasi"
                    value={form.gramasi}
                    onChange={handleChange}
                    placeholder="Contoh: 10"
                    min="0"
                    step="0.01"
                  />

                  <span>
                    gram
                  </span>

                </div>

              </div>


              <div className="form-group">

                <label>
                  Jumlah Barang
                </label>

                <input
                  type="number"
                  name="jumlah"
                  value={form.jumlah}
                  onChange={handleChange}
                  min="1"
                  step="1"
                />

              </div>

            </div>


            <div className="form-group">

              <label>
                Harga Pembelian
              </label>

              <div className="input-unit">

                <span>
                  Rp
                </span>

                <input
                  type="text"
                  inputMode="numeric"
                  name="hargaTotal"
                  value={formatPriceInput(
                    form.hargaTotal
                  )}
                  onChange={handleChange}
                  placeholder="Contoh: 15.000.000"
                />

              </div>

              <div className="input-hint">
                Gunakan angka saja. Pemisah
                ribuan ditambahkan otomatis.
              </div>

            </div>


            <div className="calculation-box">

              <div>

                <span>
                  Total emas
                </span>

                <strong>
                  {formatNumber(
                    totalGramInput
                  )}{" "}
                  gram
                </strong>

              </div>


              <div>

                <span>
                  Harga per gram
                </span>

                <strong>
                  {formatRupiah(
                    hargaPerGramInput
                  )}
                </strong>

              </div>

            </div>


            <button
              type="submit"
              className="save-button"
            >
              Simpan Pembelian
            </button>

          </form>

        </div>


        <aside className="purchase-info">

          <div className="info-icon">
            Au
          </div>

          <h2>
            Catat dengan konsisten.
          </h2>

          <p>
            Setiap pembelian akan menambah
            jumlah gram dan modal emas kamu.
            Harga rata-rata dihitung otomatis
            berdasarkan total modal dibagi
            total gram.
          </p>

          <div className="formula">

            <span>
              Rumus harga rata-rata
            </span>

            <strong>
              Total Modal ÷ Total Gram
            </strong>

          </div>

        </aside>

      </div>

    </section>
  );
}

export default App;
