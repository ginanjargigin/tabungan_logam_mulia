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

    if (!data) return DEFAULT_BRANDS;

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

  const [editingId, setEditingId] =
    useState(null);

  const [theme, setTheme] =
    useState("emerald");

  const [form, setForm] = useState({
    jenisLM: "Antam",
    customJenisLM: "",
    gramasi: "",
    jumlah: 1,
    hargaTotal: "",
  });

  const [saleForm, setSaleForm] = useState({
    jenisLM: "",
    gramasi: "",
    jumlah: 1,
    hargaTotal: "",
  });

  const todayString = new Date().toISOString().slice(0, 10);
  const last30DaysString = new Date(
    Date.now() - 29 * 24 * 60 * 60 * 1000
  ).toISOString().slice(0, 10);

  const [profitPeriod, setProfitPeriod] = useState({
    start: last30DaysString,
    end: todayString,
  });

  const formatRupiah = (number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(number) || 0);

  const formatNumber = (number) =>
    new Intl.NumberFormat("id-ID", {
      maximumFractionDigits: 2,
    }).format(Number(number) || 0);

  const formatPriceInput = (value) => {
    if (!value) return "";

    const number = Number(
      String(value).replace(/\D/g, "")
    );

    if (!number) return "";

    return new Intl.NumberFormat("id-ID").format(number);
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  const totalGram = useMemo(
    () =>
      transactions.reduce((total, item) => {
        const gram =
          Number(item.gramasi) *
          Number(item.jumlah);

        return item.type === "sale"
          ? total - gram
          : total + gram;
      }, 0),
    [transactions]
  );

  const totalModal = useMemo(
    () =>
      transactions.reduce((total, item) => {
        if (item.type === "sale") {
          return total - Number(item.costBasis || 0);
        }

        return total + Number(item.hargaTotal || 0);
      }, 0),
    [transactions]
  );

  const totalKeping = useMemo(
    () =>
      transactions.reduce(
        (total, item) =>
          item.type === "sale"
            ? total - Number(item.jumlah)
            : total + Number(item.jumlah),
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

  const brandSummary = useMemo(
    () =>
      brands
        .map((brand) => {
          const brandTransactions =
            transactions.filter(
              (item) => item.jenisLM === brand
            );

          const gram =
            brandTransactions.reduce(
              (total, item) => {
                const itemGram =
                  Number(item.gramasi) *
                  Number(item.jumlah);

                return item.type === "sale"
                  ? total - itemGram
                  : total + itemGram;
              },
              0
            );

          const keping =
            brandTransactions.reduce(
              (total, item) =>
                item.type === "sale"
                  ? total - Number(item.jumlah)
                  : total + Number(item.jumlah),
              0
            );

          const modal =
            brandTransactions.reduce(
              (total, item) =>
                item.type === "sale"
                  ? total -
                    Number(item.costBasis || 0)
                  : total +
                    Number(item.hargaTotal || 0),
              0
            );

          const rataRata =
            gram > 0 ? modal / gram : 0;

          return {
            brand,
            gram,
            keping,
            modal,
            rataRata,
            percentage:
              totalGram > 0
                ? (gram / totalGram) * 100
                : 0,
          };
        })
        .filter((item) => item.gram > 0),
    [brands, transactions, totalGram]
  );

  // Lot yang masih tersedia untuk penjualan,
  // dihitung berdasarkan merk + gramasi.
  const getAvailableLots = (brand) => {
    const lotMap = new Map();

    transactions
      .filter((item) => item.jenisLM === brand)
      .forEach((item) => {
        const gramasi = Number(item.gramasi);

        if (!gramasi) return;

        const current = lotMap.get(gramasi) || 0;

        if (item.type === "sale") {
          lotMap.set(
            gramasi,
            current - Number(item.jumlah)
          );
        } else {
          lotMap.set(
            gramasi,
            current + Number(item.jumlah)
          );
        }
      });

    return [...lotMap.entries()]
      .filter(([, jumlah]) => jumlah > 0)
      .sort((a, b) => a[0] - b[0])
      .map(([gramasi, jumlah]) => ({
        gramasi,
        jumlah,
      }));
  };

  const ownedBrandOptions = brandSummary.filter(
    (item) => item.gram > 0 && item.keping > 0
  );

  const selectedSaleBrand =
    brandSummary.find(
      (item) => item.brand === saleForm.jenisLM
    ) || null;

  const availableSaleLots = selectedSaleBrand
    ? getAvailableLots(selectedSaleBrand.brand)
    : [];

  const selectedSaleLot =
    availableSaleLots.find(
      (item) =>
        Number(item.gramasi) ===
        Number(saleForm.gramasi)
    ) || null;

 const saleTotalGram =
  (Number(saleForm.gramasi) || 0) *
  (Number(saleForm.jumlah) || 0);

// Harga beli rata-rata per gram berdasarkan
// merk yang dipilih pada portofolio.
const salePurchasePricePerGram =
  selectedSaleBrand?.rataRata || 0;

// Total uang yang diterima dari penjualan.
const saleTotalPrice =
  Number(saleForm.hargaTotal) || 0;

// Harga jual per gram.
const salePricePerGram =
  saleTotalGram > 0
    ? saleTotalPrice / saleTotalGram
    : 0;

// Modal dari emas yang dijual.
const saleCostBasis =
  salePurchasePricePerGram *
  saleTotalGram;

// Laba / rugi total.
// Positif = laba.
// Negatif = rugi.
const saleDifferenceTotal =
  saleTotalPrice -
  saleCostBasis;

// Laba / rugi per gram.
const saleDifferencePerGram =
  saleTotalGram > 0
    ? saleDifferenceTotal / saleTotalGram
    : 0;

  const profitReport = useMemo(() => {
    const start = profitPeriod.start
      ? new Date(`${profitPeriod.start}T00:00:00`)
      : null;

    const end = profitPeriod.end
      ? new Date(`${profitPeriod.end}T23:59:59`)
      : null;

    const sales = transactions.filter((item) => {
      if (item.type !== "sale" || !item.tanggal) {
        return false;
      }

      const saleDate = new Date(item.tanggal);

      if (Number.isNaN(saleDate.getTime())) {
        return false;
      }

      if (start && saleDate < start) return false;
      if (end && saleDate > end) return false;

      return true;
    });

    const totalSales = sales.reduce(
      (total, item) =>
        total + Number(
          item.hargaJualTotal ??
          item.hargaTotal ??
          0
        ),
      0
    );

    const totalCost = sales.reduce(
      (total, item) =>
        total + Number(item.costBasis || 0),
      0
    );

    const totalProfit = sales.reduce(
      (total, item) => {
        const difference =
          item.differenceTotal ??
          (
            Number(
              item.hargaJualTotal ??
              item.hargaTotal ??
              0
            ) -
            Number(item.costBasis || 0)
          );

        return total + Number(difference || 0);
      },
      0
    );

    const totalGramSold = sales.reduce(
      (total, item) =>
        total +
        Number(item.gramasi || 0) *
        Number(item.jumlah || 0),
      0
    );

    return {
      sales,
      totalSales,
      totalCost,
      totalProfit,
      totalGramSold,
    };
  }, [transactions, profitPeriod]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "hargaTotal") {
      const cleanValue =
        value.replace(/\D/g, "");

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

  const handleSaleChange = (e) => {
  const { name, value } = e.target;

  if (name === "hargaTotal") {
    const cleanValue = value.replace(/\D/g, "");

    setSaleForm((prev) => ({
      ...prev,
      hargaTotal: cleanValue,
    }));

    return;
  }

  setSaleForm((prev) => ({
    ...prev,
    [name]: value,
  }));
};

  const handleSubmitSale = (e) => {
    e.preventDefault();

    const jenisLM =
      saleForm.jenisLM.trim();

    const gramasi = Number(saleForm.gramasi);
    const jumlah = Number(saleForm.jumlah);
    const hargaTotal = Number(saleForm.hargaTotal);

    const brand = brandSummary.find(
      (item) => item.brand === jenisLM
    );

    const availableLot =
      getAvailableLots(jenisLM).find(
        (item) =>
          Number(item.gramasi) === gramasi
      );

    const availableJumlah =
      availableLot?.jumlah || 0;

    if (!brand) {
      alert("Pilih merk logam mulia.");
      return;
    }

    if (gramasi <= 0 || jumlah <= 0 || hargaTotal <= 0) {
      alert("Lengkapi semua data penjualan.");
      return;
    }

    if (availableJumlah <= 0) {
      alert("Gramasi tersebut tidak tersedia.");
      return;
    }

    if (jumlah > availableJumlah) {
      alert(
        `Stok ${gramasi} gram hanya tersedia ${availableJumlah} keping.`
      );
      return;
    }

    const purchasePricePerGram =
      brand.rataRata;

    const totalGram =
      gramasi * jumlah;

    const salePricePerGram =
      hargaTotal / totalGram;

    const costBasis =
      purchasePricePerGram * totalGram;

    const differencePerGram =
      salePricePerGram -
      purchasePricePerGram;

    const differenceTotal =
      differencePerGram * totalGram;

    const newSale = {
      id: Date.now(),
      type: "sale",
      jenisLM,
      gramasi,
      jumlah,
      hargaJualTotal: hargaTotal,
      purchasePricePerGram,
      costBasis,
      differencePerGram,
      differenceTotal,
      tanggal:
        new Date().toISOString(),
    };

    const updatedTransactions = [
      newSale,
      ...transactions,
    ];

    setTransactions(updatedTransactions);
    saveGoldData(updatedTransactions);

    setSaleForm({
      jenisLM: "",
      gramasi: "",
      jumlah: 1,
      hargaTotal: "",
    });

    setPage("history");
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

    let updatedTransactions;

    if (editingId !== null) {
      updatedTransactions =
        transactions.map((item) => {
          if (item.id !== editingId) {
            return item;
          }

          return {
            ...item,
            jenisLM,
            gramasi,
            jumlah,
            hargaTotal,
          };
        });
    } else {
      const newTransaction = {
        id: Date.now(),
        jenisLM,
        gramasi,
        jumlah,
        hargaTotal,
        tanggal:
          new Date().toISOString(),
      };

      updatedTransactions = [
        newTransaction,
        ...transactions,
      ];
    }

    setTransactions(updatedTransactions);
    saveGoldData(updatedTransactions);

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
      jenisLM: brands.includes(jenisLM)
        ? jenisLM
        : "Antam",
      customJenisLM: "",
      gramasi: "",
      jumlah: 1,
      hargaTotal: "",
    });

    setEditingId(null);
    setPage("history");
  };

  const handleDelete = (id) => {
    const confirmed = window.confirm(
      "Hapus transaksi ini?"
    );

    if (!confirmed) return;

    const updatedTransactions =
      transactions.filter(
        (item) => item.id !== id
      );

    setTransactions(updatedTransactions);
    saveGoldData(updatedTransactions);
  };

  const handleEdit = (transaction) => {
    const isDefaultBrand =
      brands.includes(transaction.jenisLM);

    setEditingId(transaction.id);

    setForm({
      jenisLM: isDefaultBrand
        ? transaction.jenisLM
        : "Lainnya",
      customJenisLM: isDefaultBrand
        ? ""
        : transaction.jenisLM,
      gramasi: String(transaction.gramasi),
      jumlah: Number(transaction.jumlah),
      hargaTotal: String(transaction.hargaTotal),
    });

    setPage("purchase");
  };

  return (
    <div
      className={`app theme-${theme}`}
    >
      <header className="topbar">

        <div className="brand">
          <div className="logo">
            GOLD<span>SAVE</span>
          </div>

          <p className="subtitle">
            Personal Gold Savings
          </p>
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
            onClick={() => {
              setEditingId(null);
              setForm({
                jenisLM: "Antam",
                customJenisLM: "",
                gramasi: "",
                jumlah: 1,
                hargaTotal: "",
              });
              setPage("purchase");
            }}
          >
            Pembelian
          </button>

          <button
            className={
              page === "sale"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() => {
              setEditingId(null);

              const firstBrand =
                brandSummary[0]?.brand || "";

              setSaleForm({
                jenisLM: firstBrand,
                gramasi: "",
                jumlah: 1,
                hargaTotal: "",
              });

              setPage("sale");
            }}
          >
            Penjualan
          </button>

          <button
            className={
              page === "history"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() =>
              setPage("history")
            }
          >
            Riwayat
          </button>

          <button
            className={
              page === "profit"
                ? "nav-button active"
                : "nav-button"
            }
            onClick={() =>
              setPage("profit")
            }
          >
            Laba/Rugi
          </button>

        </nav>

        <div className="nav-actions">
          {page === "dashboard" && (
            <select
              className="theme-select"
              id="nav-dashboard-theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              aria-label="Pilih tema dashboard"
            >
                <option value="emerald">Emerald</option>
                <option value="dark-gold">Dark Gold</option>
                <option value="midnight">Midnight</option>
              </select>
          )}
        </div>

      </header>

      <main className="main-container">

        {page === "dashboard" ? (

          <Dashboard
            totalGram={totalGram}
            totalModal={totalModal}
            hargaRataRata={hargaRataRata}
            totalKeping={totalKeping}
            theme={theme}
            setTheme={setTheme}
            transactions={transactions}
            brandSummary={brandSummary}
            formatRupiah={formatRupiah}
            formatNumber={formatNumber}
            formatDate={formatDate}
            handleDelete={handleDelete}
            onAddPurchase={() => {
              setEditingId(null);
              setForm({
                jenisLM: "Antam",
                customJenisLM: "",
                gramasi: "",
                jumlah: 1,
                hargaTotal: "",
              });
              setPage("purchase");
            }}
          />

        ) : page === "purchase" ? (

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
            onBack={() => {
              setEditingId(null);
              setPage("dashboard");
            }}
            editingId={editingId}
          />

        ) : page === "sale" ? (

          <Sale
            form={saleForm}
            ownedBrandOptions={ownedBrandOptions}
            selectedSaleBrand={selectedSaleBrand}
            availableSaleLots={availableSaleLots}
            selectedSaleLot={selectedSaleLot}
            handleChange={handleSaleChange}
            handleSubmit={handleSubmitSale}
            totalGramInput={saleTotalGram}
            hargaPerGramInput={salePricePerGram}
            purchasePricePerGram={salePurchasePricePerGram}
            differencePerGram={saleDifferencePerGram}
            differenceTotal={saleDifferenceTotal}
            costBasis={saleCostBasis}
            formatRupiah={formatRupiah}
            formatNumber={formatNumber}
            formatPriceInput={formatPriceInput}
            onBack={() => {
              setPage("dashboard");
            }}
          />

        ) : page === "profit" ? (

          <ProfitReport
            profitPeriod={profitPeriod}
            setProfitPeriod={setProfitPeriod}
            report={profitReport}
            formatRupiah={formatRupiah}
            formatNumber={formatNumber}
            formatDate={formatDate}
            onBack={() => setPage("dashboard")}
          />

        ) : (

          <TransactionHistory
            transactions={transactions}
            formatRupiah={formatRupiah}
            formatNumber={formatNumber}
            formatDate={formatDate}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            onAddPurchase={() => {
              setEditingId(null);
              setForm({
                jenisLM: "Antam",
                customJenisLM: "",
                gramasi: "",
                jumlah: 1,
                hargaTotal: "",
              });
              setPage("purchase");
            }}
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
  theme,
  setTheme,
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

        <div className="panel portfolio-panel">

          <div className="panel-header">

            <div>
              <h2>Portofolio LM</h2>

              <p>
                Kepemilikan berdasarkan jenis logam
              </p>
            </div>

            <span className="count-badge">
              {brandSummary.length} LM
            </span>

          </div>

          {brandSummary.length === 0 ? (

            <div className="empty-small">
              Belum ada data emas.
            </div>

          ) : (

            <div className="portfolio-list">

              {brandSummary.map((item) => (

                <div
                  className="portfolio-card"
                  key={item.brand}
                >

                  <div className="portfolio-top">

                    <div className="portfolio-brand">

                      <div className="portfolio-icon">
                        Au
                      </div>

                      <div>
                        <strong>
                          {item.brand}
                        </strong>

                        <span>
                          {item.keping} keping
                        </span>
                      </div>

                    </div>

                    <div className="portfolio-percent">
                      {item.percentage.toFixed(1)}%
                    </div>

                  </div>

                  <div className="portfolio-gram">

                    <strong>
                      {formatNumber(item.gram)}
                    </strong>

                    <span>
                      gram
                    </span>

                  </div>

                  <div className="portfolio-details">

                    <div>
                      <span>Modal</span>

                      <strong>
                        {formatRupiah(item.modal)}
                      </strong>
                    </div>

                    <div>
                      <span>Rata-rata</span>

                      <strong>
                        {formatRupiah(
                          item.rataRata
                        )}
                        <small>/g</small>
                      </strong>
                    </div>

                  </div>

                  <div className="portfolio-progress">

                    <div
                      style={{
                        width:
                          `${item.percentage}%`,
                      }}
                    />

                  </div>

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

                        <span className={
                          item.type === "sale"
                            ? "transaction-sale-label"
                            : "transaction-buy-label"
                        }>
                          {item.type === "sale"
                            ? "Penjualan"
                            : "Pembelian"}
                        </span>

                        <small>
                          {item.gramasi} gram ×{" "}
                          {item.jumlah}
                        </small>

                        <small>
                          {formatDate(
                            item.tanggal
                          )}
                        </small>

                      </div>

                      <div className="recent-value">

                        <strong>
                          {formatRupiah(
                            item.type === "sale"
                              ? item.hargaJualTotal
                              : item.hargaTotal
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
  editingId,
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
          {editingId !== null
            ? "Edit Transaksi"
            : "Tambah Pembelian"}
        </h1>

        <p>
          {editingId !== null
            ? "Perbarui data pembelian logam mulia."
            : "Catat pembelian logam mulia kamu."}
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
              {editingId !== null
                ? "Simpan Perubahan"
                : "Simpan Pembelian"}
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

/* =========================
   SALE
========================= */

function Sale({
  form,
  ownedBrandOptions,
  selectedSaleBrand,
  availableSaleLots,
  selectedSaleLot,
  handleChange,
  handleSubmit,
  totalGramInput,
  hargaPerGramInput,
  purchasePricePerGram,
  differencePerGram,
  differenceTotal,
  costBasis,
  formatRupiah,
  formatNumber,
  formatPriceInput,
  onBack,
}) {
  const isPositive = differencePerGram >= 0;

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
          TRANSAKSI PENJUALAN
        </p>

        <h1>
          Jual Logam Mulia
        </h1>

        <p>
          Harga beli rata-rata diambil otomatis
          dari portofolio merk yang dipilih.
        </p>

      </div>

      <div className="purchase-layout">

        <div className="purchase-card">

          <form onSubmit={handleSubmit}>

            <div className="form-group">

              <label>
                Merk Logam Mulia
              </label>

              <select
                name="jenisLM"
                value={form.jenisLM}
                onChange={handleChange}
              >

                <option value="">
                  Pilih merk LM
                </option>

                {ownedBrandOptions.map((item) => (

                  <option
                    key={item.brand}
                    value={item.brand}
                  >
                    {item.brand}
                  </option>

                ))}

              </select>

            </div>

            {selectedSaleBrand && (

              <div className="stock-info-box">

                <span>
                  Stok tersedia
                </span>

                <strong>
                  {formatNumber(
                    selectedSaleBrand.gram
                  )} gram
                </strong>

                <small>
                  {selectedSaleBrand.keping} keping
                </small>

              </div>

            )}

            <div className="form-row">

              <div className="form-group">

                <label>
                  Gramasi
                </label>

                <select
                  name="gramasi"
                  value={form.gramasi}
                  onChange={(e) => {
                    handleChange(e);

                    const selected =
                      availableSaleLots.find(
                        (item) =>
                          Number(item.gramasi) ===
                          Number(e.target.value)
                      );

                    if (selected) {
                      const next =
                        Number(form.jumlah) >
                        selected.jumlah
                          ? selected.jumlah
                          : Number(form.jumlah) || 1;

                      handleChange({
                        target: {
                          name: "jumlah",
                          value: next,
                        },
                      });
                    }
                  }}
                  disabled={
                    !selectedSaleBrand ||
                    availableSaleLots.length === 0
                  }
                >

                  <option value="">
                    Pilih gramasi
                  </option>

                  {availableSaleLots.map((item) => (

                    <option
                      key={item.gramasi}
                      value={item.gramasi}
                    >
                      {item.gramasi} gram •{" "}
                      {item.jumlah} keping tersedia
                    </option>

                  ))}

                </select>

              </div>


              <div className="form-group">

                <label>
                  Jumlah
                </label>

                <input
                  type="number"
                  name="jumlah"
                  value={form.jumlah}
                  onChange={handleChange}
                  min="1"
                  max={
                    selectedSaleLot?.jumlah || 1
                  }
                  step="1"
                  disabled={
                    !selectedSaleLot
                  }
                />

              </div>

            </div>


            <div className="form-group">

              <label>
                Harga Penjualan
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
                  placeholder="Contoh: 2.600.000"
                />

              </div>

              <div className="input-hint">
                Masukkan total harga yang kamu
                terima dari penjualan.
              </div>

            </div>


            <div className="calculation-box sale-calculation">

              <div>
                <span>
                  Total emas dijual
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
                  Harga jual / gram
                </span>

                <strong>
                  {formatRupiah(
                    hargaPerGramInput
                  )}
                </strong>
              </div>


              <div className="sale-auto-price">
                <span>
                  Harga beli rata-rata
                </span>

                <strong>
                  {formatRupiah(
                    purchasePricePerGram
                  )}
                </strong>

                <small>
                  Otomatis dari Portofolio LM
                </small>
              </div>


              <div
                className={
                  isPositive
                    ? "sale-difference positive"
                    : "sale-difference negative"
                }
              >
                <span>
                  Selisih harga / gram
                </span>

                <strong>
                  {isPositive ? "+" : "-"}
                  {formatRupiah(
                    Math.abs(differencePerGram)
                  )}
                </strong>
              </div>


              <div>
                <span>
                  Modal yang dilepas
                </span>

                <strong>
                  {formatRupiah(
                    costBasis
                  )}
                </strong>
              </div>


              <div
                className={
                  differenceTotal >= 0
                    ? "sale-profit positive"
                    : "sale-profit negative"
                }
              >
                <span>
                  {differenceTotal >= 0
                    ? "Keuntungan"
                    : "Kerugian"}
                </span>

                <strong>
                  {differenceTotal >= 0
                    ? "+"
                    : "-"}
                  {formatRupiah(
                    Math.abs(differenceTotal)
                  )}
                </strong>
              </div>

            </div>


            <button
              type="submit"
              className="save-button"
              disabled={
                !selectedSaleBrand ||
                !selectedSaleLot ||
                totalGramInput <= 0 ||
                Number(form.hargaTotal) <= 0
              }
            >
              Simpan Penjualan
            </button>

          </form>

        </div>


        <aside className="purchase-info">

          <div className="info-icon">
            Au
          </div>

          <h2>
            Harga beli dihitung otomatis.
          </h2>

          <p>
            Sistem mengambil harga rata-rata
            pembelian dari merk LM yang dipilih
            pada Portofolio Dashboard. Selisih
            dibandingkan dengan harga jual
            ditampilkan sebagai keuntungan
            atau kerugian.
          </p>

          <div className="formula">

            <span>
              Rumus selisih
            </span>

            <strong>
              Harga Jual / Gram − Harga Beli / Gram
            </strong>

          </div>

        </aside>

      </div>

    </section>
  );
}

/* =========================
   PROFIT REPORT
========================= */

function ProfitReport({
  profitPeriod,
  setProfitPeriod,
  report,
  formatRupiah,
  formatNumber,
  formatDate,
  onBack,
}) {
  const isProfit = report.totalProfit >= 0;

  const handlePeriodChange = (e) => {
    const { name, value } = e.target;

    setProfitPeriod((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <section className="profit-page">

      <button
        className="back-button"
        onClick={onBack}
      >
        ← Kembali ke Dashboard
      </button>

      <div className="profit-heading">

        <div>
          <p className="eyebrow">
            LAPORAN PENJUALAN
          </p>

          <h1>
            Laba / Rugi
          </h1>

          <p>
            Hitung hasil penjualan berdasarkan
            periode yang kamu pilih.
          </p>
        </div>

      </div>


      <div className="profit-filter">

        <div className="profit-filter-title">
          <div>
            <h2>
              Periode Perhitungan
            </h2>

            <p>
              Default: 30 hari terakhir
            </p>
          </div>

          <button
            type="button"
            className="period-reset"
            onClick={() => {
              const today =
                new Date()
                  .toISOString()
                  .slice(0, 10);

              const start =
                new Date(
                  Date.now() -
                  29 * 24 * 60 * 60 * 1000
                )
                  .toISOString()
                  .slice(0, 10);

              setProfitPeriod({
                start,
                end: today,
              });
            }}
          >
            30 Hari
          </button>
        </div>


        <div className="profit-date-row">

          <div className="form-group">

            <label>
              Tanggal Mulai
            </label>

            <input
              type="date"
              name="start"
              value={profitPeriod.start}
              onChange={handlePeriodChange}
            />

          </div>


          <div className="form-group">

            <label>
              Tanggal Akhir
            </label>

            <input
              type="date"
              name="end"
              value={profitPeriod.end}
              onChange={handlePeriodChange}
            />

          </div>

        </div>

      </div>


      <section className="profit-stats">

        <div className="profit-stat">

          <span>
            Total Penjualan
          </span>

          <strong>
            {formatRupiah(
              report.totalSales
            )}
          </strong>

          <small>
            Uang hasil penjualan
          </small>

        </div>


        <div className="profit-stat">

          <span>
            Modal Terjual
          </span>

          <strong>
            {formatRupiah(
              report.totalCost
            )}
          </strong>

          <small>
            Modal yang dilepas
          </small>

        </div>


        <div
          className={
            isProfit
              ? "profit-stat result-positive"
              : "profit-stat result-negative"
          }
        >

          <span>
            {isProfit
              ? "Laba Bersih"
              : "Rugi"}
          </span>

          <strong>
            {isProfit ? "+" : "-"}
            {formatRupiah(
              Math.abs(report.totalProfit)
            )}
          </strong>

          <small>
            {formatNumber(
              report.totalGramSold
            )}{" "}
            gram terjual
          </small>

        </div>

      </section>


      <div className="profit-card">

        <div className="profit-card-header">

          <div>
            <h2>
              Detail Penjualan
            </h2>

            <p>
              {report.sales.length} transaksi dalam periode
            </p>
          </div>

          <span className="count-badge">
            {report.sales.length}
          </span>

        </div>


        {report.sales.length === 0 ? (

          <div className="empty-small">
            Tidak ada transaksi penjualan
            pada periode ini.
          </div>

        ) : (

          <div className="profit-list">

            {report.sales.map((item) => {

              const difference =
                Number(
                  item.differenceTotal ??
                  (
                    Number(
                      item.hargaJualTotal ??
                      item.hargaTotal ??
                      0
                    ) -
                    Number(item.costBasis || 0)
                  )
                );

              const totalGram =
                Number(item.gramasi || 0) *
                Number(item.jumlah || 0);

              return (

                <div
                  className="profit-row"
                  key={item.id}
                >

                  <div className="profit-main">

                    <div className="gold-circle">
                      Au
                    </div>

                    <div>
                      <strong>
                        {item.jenisLM}
                      </strong>

                      <span>
                        {formatNumber(totalGram)} gram
                      </span>

                      <small>
                        {formatDate(item.tanggal)}
                      </small>
                    </div>

                  </div>


                  <div className="profit-row-value">

                    <span>
                      Penjualan
                    </span>

                    <strong>
                      {formatRupiah(
                        item.hargaJualTotal ??
                        item.hargaTotal ??
                        0
                      )}
                    </strong>

                  </div>


                  <div className="profit-row-value">

                    <span>
                      Modal
                    </span>

                    <strong>
                      {formatRupiah(
                        item.costBasis || 0
                      )}
                    </strong>

                  </div>


                  <div
                    className={
                      difference >= 0
                        ? "profit-row-result positive"
                        : "profit-row-result negative"
                    }
                  >

                    <span>
                      {difference >= 0
                        ? "Laba"
                        : "Rugi"}
                    </span>

                    <strong>
                      {difference >= 0
                        ? "+"
                        : "-"}
                      {formatRupiah(
                        Math.abs(difference)
                      )}
                    </strong>

                  </div>

                </div>

              );
            })}

          </div>

        )}

      </div>

    </section>
  );
}

/* =========================
   TRANSACTION HISTORY
========================= */

function TransactionHistory({
  transactions,
  formatRupiah,
  formatNumber,
  formatDate,
  handleEdit,
  handleDelete,
  onAddPurchase,
}) {
  return (
    <section className="history-page">

      <div className="history-heading">

        <div>
          <p className="eyebrow">
            DATA TRANSAKSI
          </p>

          <h1>
            Riwayat Transaksi
          </h1>

          <p>
            Semua pembelian logam mulia kamu.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={onAddPurchase}
        >
          + Tambah Pembelian
        </button>

      </div>

      <div className="history-card">

        <div className="history-card-header">

          <div>
            <h2>
              Semua Pembelian
            </h2>

            <p>
              {transactions.length} transaksi tercatat
            </p>
          </div>

          <span className="count-badge">
            {transactions.length}
          </span>

        </div>

        {transactions.length === 0 ? (

          <div className="history-empty">

            <div className="history-empty-icon">
              Au
            </div>

            <h3>
              Belum ada transaksi
            </h3>

            <p>
              Tambahkan pembelian emas
              pertama kamu.
            </p>

            <button
              className="primary-button"
              onClick={onAddPurchase}
            >
              Tambah Pembelian
            </button>

          </div>

        ) : (

          <div className="history-list">

            {transactions.map((item) => {

              const gram =
                Number(item.gramasi) *
                Number(item.jumlah);

              const hargaTotalDisplay =
                item.type === "sale"
                  ? Number(item.hargaJualTotal || 0)
                  : Number(item.hargaTotal || 0);

              const hargaPerGram =
                item.type === "sale"
                  ? Number(item.purchasePricePerGram || 0)
                  : gram > 0
                    ? hargaTotalDisplay / gram
                    : 0;

              return (

                <div
                  className="history-item"
                  key={item.id}
                >

                  <div className="history-main">

                    <div className="gold-circle">
                      Au
                    </div>

                    <div>

                      <small className="history-brand-label">
                        Merk LM
                      </small>

                      <strong>
                        {item.jenisLM}
                      </strong>

                      <span
                        className={
                          item.type === "sale"
                            ? "history-sale-tag"
                            : "history-buy-tag"
                        }
                      >
                        {item.type === "sale"
                          ? "Penjualan"
                          : "Pembelian"}
                      </span>

                      <small>
                        {item.gramasi} gram ×{" "}
                        {item.jumlah} keping
                      </small>

                      <small>
                        {formatDate(
                          item.tanggal
                        )}
                      </small>

                    </div>

                  </div>

                  <div className="history-detail">

                    <div>
                      <span>Total Gram</span>

                      <strong>
                        {formatNumber(gram)} gram
                      </strong>
                    </div>

                    <div>
                      <span>Harga Pembelian</span>

                      <strong>
                        {formatRupiah(
                          hargaTotalDisplay
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Harga / Gram</span>

                      <strong>
                        {formatRupiah(
                          hargaPerGram
                        )}
                      </strong>
                    </div>

                    {item.type === "sale" && (
                      <div
                        className={
                          Number(item.differenceTotal || 0) >= 0
                            ? "history-profit positive"
                            : "history-profit negative"
                        }
                      >
                        <span>
                          {Number(item.differenceTotal || 0) >= 0
                            ? "Keuntungan"
                            : "Kerugian"}
                        </span>

                        <strong>
                          {Number(item.differenceTotal || 0) >= 0
                            ? "+"
                            : "-"}
                          {formatRupiah(
                            Math.abs(
                              Number(
                                item.differenceTotal || 0
                              )
                            )
                          )}
                        </strong>
                      </div>
                    )}

                  </div>

                  <div className="history-actions">

                    {item.type !== "sale" && (
                      <button
                        type="button"
                        className="edit-button"
                        onClick={() =>
                          handleEdit(item)
                        }
                      >
                        Edit
                      </button>
                    )}

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() =>
                        handleDelete(item.id)
                      }
                    >
                      Hapus
                    </button>

                  </div>

                </div>

              );
            })}

          </div>

        )}

      </div>

    </section>
  );
}

export default App;
