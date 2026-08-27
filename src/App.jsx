import { useMemo, useState } from "react";
import "./App.css";
import { loadGoldData, saveGoldData } from "./storage";

function App() {
  const [transactions, setTransactions] = useState(loadGoldData);

  const [form, setForm] = useState({
    jenisLM: "Antam",
    gramasi: "",
    jumlah: 1,
    hargaTotal: "",
  });

  const totalGram = useMemo(() => {
    return transactions.reduce(
      (total, item) => total + item.gramasi * item.jumlah,
      0
    );
  }, [transactions]);

  const totalModal = useMemo(() => {
    return transactions.reduce(
      (total, item) => total + item.hargaTotal,
      0
    );
  }, [transactions]);

  const hargaRataRata = totalGram > 0 ? totalModal / totalGram : 0;

  const totalKeping = transactions.reduce(
    (total, item) => total + item.jumlah,
    0
  );

  const formatRupiah = (number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(number);
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat("id-ID").format(number);
  };

  const hargaInput = Number(form.hargaTotal) || 0;
  const gramasiInput = Number(form.gramasi) || 0;
  const jumlahInput = Number(form.jumlah) || 0;

  const totalGramInput = gramasiInput * jumlahInput;

  const hargaPerGramInput =
    totalGramInput > 0
      ? hargaInput / totalGramInput
      : 0;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !form.jenisLM ||
      gramasiInput <= 0 ||
      jumlahInput <= 0 ||
      hargaInput <= 0
    ) {
      alert("Lengkapi semua data pembelian.");
      return;
    }

    const newTransaction = {
      id: Date.now(),
      jenisLM: form.jenisLM,
      gramasi: gramasiInput,
      jumlah: jumlahInput,
      hargaTotal: hargaInput,
      tanggal: new Date().toISOString(),
    };

    const updatedTransactions = [
      newTransaction,
      ...transactions,
    ];

    setTransactions(updatedTransactions);
    saveGoldData(updatedTransactions);

    setForm({
      jenisLM: "Antam",
      gramasi: "",
      jumlah: 1,
      hargaTotal: "",
    });

    alert("Pembelian berhasil disimpan.");
  };

  const handleDelete = (id) => {
    const confirmDelete = window.confirm(
      "Hapus transaksi ini?"
    );

    if (!confirmDelete) return;

    const updatedTransactions = transactions.filter(
      (item) => item.id !== id
    );

    setTransactions(updatedTransactions);
    saveGoldData(updatedTransactions);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(date));
  };

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <div className="logo">
            GOLD<span>SAVE</span>
          </div>
          <p className="subtitle">
            Personal Gold Savings
          </p>
        </div>

        <div className="header-badge">
          {totalKeping} Keping
        </div>
      </header>

      <main className="container">

        {/* STATISTIC CARDS */}
        <section className="stats-grid">

          <div className="stat-card primary">
            <div className="stat-label">
              TOTAL EMAS
            </div>

            <div className="stat-value">
              {formatNumber(totalGram)}
              <span> gram</span>
            </div>

            <div className="stat-bottom">
              {totalKeping} keping emas
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              TOTAL MODAL
            </div>

            <div className="stat-value small">
              {formatRupiah(totalModal)}
            </div>

            <div className="stat-bottom">
              Total harga pembelian
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">
              HARGA RATA-RATA
            </div>

            <div className="stat-value small">
              {formatRupiah(hargaRataRata)}
            </div>

            <div className="stat-bottom">
              Per gram
            </div>
          </div>

        </section>

        <section className="content-grid">

          {/* FORM */}
          <div className="card">

            <div className="card-header">
              <div>
                <h2>Tambah Pembelian</h2>
                <p>Catat pembelian logam mulia</p>
              </div>

              <div className="card-icon">
                +
              </div>
            </div>

            <form onSubmit={handleSubmit}>

              <div className="form-group">
                <label>Jenis LM</label>

                <select
                  name="jenisLM"
                  value={form.jenisLM}
                  onChange={handleChange}
                >
                  <option value="Antam">Antam</option>
                  <option value="UBS">UBS</option>
                  <option value="Galeri24">
                    Galeri24
                  </option>
                  <option value="Lotus Archi">
                    Lotus Archi
                  </option>
                  <option value="Lainnya">
                    Lainnya
                  </option>
                </select>
              </div>

              <div className="form-row">

                <div className="form-group">
                  <label>Gramasi</label>

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

                    <span>gram</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Jumlah Barang</label>

                  <input
                    type="number"
                    name="jumlah"
                    value={form.jumlah}
                    onChange={handleChange}
                    min="1"
                  />
                </div>

              </div>

              <div className="form-group">
                <label>Harga Pembelian</label>

                <div className="input-unit">
                  <span>Rp</span>

                  <input
                    type="number"
                    name="hargaTotal"
                    value={form.hargaTotal}
                    onChange={handleChange}
                    placeholder="Contoh: 15000000"
                    min="0"
                  />
                </div>
              </div>

              {/* PREVIEW */}
              <div className="calculation-box">

                <div className="calc-row">
                  <span>Total gram</span>

                  <strong>
                    {formatNumber(totalGramInput)} gram
                  </strong>
                </div>

                <div className="calc-row">
                  <span>Harga per gram</span>

                  <strong>
                    {formatRupiah(hargaPerGramInput)}
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

          {/* SUMMARY */}
          <div className="card summary-card">

            <div className="card-header">
              <div>
                <h2>Ringkasan</h2>
                <p>Posisi tabungan emas</p>
              </div>
            </div>

            <div className="summary-item">
              <div>
                <span>Total Kepemilikan</span>
                <small>Seluruh LM</small>
              </div>

              <strong>
                {formatNumber(totalGram)} g
              </strong>
            </div>

            <div className="summary-item">
              <div>
                <span>Total Modal</span>
                <small>Harga beli seluruh LM</small>
              </div>

              <strong>
                {formatRupiah(totalModal)}
              </strong>
            </div>

            <div className="summary-item">
              <div>
                <span>Harga Rata-rata</span>
                <small>Modal ÷ total gram</small>
              </div>

              <strong>
                {formatRupiah(hargaRataRata)}
              </strong>
            </div>

            <div className="info-box">
              <strong>💡 Cara perhitungan</strong>

              <p>
                Harga rata-rata dihitung dari total
                modal dibagi total gram emas yang
                dimiliki.
              </p>
            </div>

          </div>

        </section>

        {/* HISTORY */}
        <section className="card history-card">

          <div className="card-header">
            <div>
              <h2>Riwayat Pembelian</h2>
              <p>Daftar transaksi emas</p>
            </div>

            <span className="transaction-count">
              {transactions.length} transaksi
            </span>
          </div>

          {transactions.length === 0 ? (

            <div className="empty-state">
              <div className="empty-icon">
                ◇
              </div>

              <h3>Belum ada pembelian</h3>

              <p>
                Tambahkan pembelian emas pertama
                menggunakan form di atas.
              </p>
            </div>

          ) : (

            <div className="transaction-list">

              {transactions.map((item) => {

                const totalGramItem =
                  item.gramasi * item.jumlah;

                const hargaPerGram =
                  item.hargaTotal / totalGramItem;

                return (
                  <div
                    className="transaction"
                    key={item.id}
                  >

                    <div className="transaction-main">

                      <div className="gold-icon">
                        Au
                      </div>

                      <div>
                        <strong>
                          {item.jenisLM}
                        </strong>

                        <span>
                          {item.gramasi} gram ×{" "}
                          {item.jumlah} keping
                        </span>

                        <small>
                          {formatDate(item.tanggal)}
                        </small>
                      </div>

                    </div>

                    <div className="transaction-detail">

                      <div>
                        <span>Total Gram</span>
                        <strong>
                          {formatNumber(
                            totalGramItem
                          )} g
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

                      <div>
                        <span>Total Harga</span>
                        <strong>
                          {formatRupiah(
                            item.hargaTotal
                          )}
                        </strong>
                      </div>

                    </div>

                    <button
                      className="delete-button"
                      onClick={() =>
                        handleDelete(item.id)
                      }
                      title="Hapus transaksi"
                    >
                      ×
                    </button>

                  </div>
                );
              })}

            </div>
          )}

        </section>

      </main>

      <footer>
        GOLD SAVE • Personal Gold Savings
      </footer>

    </div>
  );
}

export default App;
