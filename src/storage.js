const STORAGE_KEY = "gold-save-data";

const BIN_ID =
  import.meta.env.VITE_JSONBIN_BIN_ID;

const ACCESS_KEY =
  import.meta.env.VITE_JSONBIN_ACCESS_KEY;

const JSONBIN_URL =
  `https://api.jsonbin.io/v3/b/${BIN_ID}`;

const JSONBIN_LATEST_URL =
  `${JSONBIN_URL}/latest`;

const MODE_KEY = "gold-save-mode";

const DEMO_TRANSACTIONS = [
  {
    id: 1001,
    type: "buy",
    jenisLM: "Antam",
    gramasi: 10,
    jumlah: 2,
    hargaTotal: 47000000,
    tanggal: "2026-08-01T09:00:00.000Z",
  },
  {
    id: 1002,
    type: "buy",
    jenisLM: "UBS",
    gramasi: 5,
    jumlah: 2,
    hargaTotal: 23200000,
    tanggal: "2026-08-05T09:00:00.000Z",
  },
  {
    id: 1003,
    type: "buy",
    jenisLM: "Hartadinata",
    gramasi: 2,
    jumlah: 4,
    hargaTotal: 9400000,
    tanggal: "2026-08-10T09:00:00.000Z",
  },
  {
    id: 1004,
    type: "sale",
    jenisLM: "Antam",
    gramasi: 5,
    jumlah: 1,
    hargaJualTotal: 11500000,
    purchasePricePerGram: 2350000,
    costBasis: 11750000,
    differencePerGram: -50000,
    differenceTotal: -250000,
    tanggal: "2026-08-20T09:00:00.000Z",
  },
];

function isGuestMode() {
  return (
    sessionStorage.getItem(MODE_KEY) === "guest"
  );
}

export function loadGoldData() {
  // Guest tidak boleh membaca data pribadi
  if (isGuestMode()) {
    return DEMO_TRANSACTIONS;
  }

  try {
    const data =
      localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data);
  } catch (error) {
    console.error(
      "Gagal membaca data lokal:",
      error
    );

    return [];
  }
}

export async function loadGoldDataFromCloud() {
  // Guest TIDAK BOLEH mengakses cloud
  if (isGuestMode()) {
    return null;
  }

  if (!BIN_ID || !ACCESS_KEY) {
    console.warn(
      "JSONBin belum dikonfigurasi."
    );

    return null;
  }

  try {
    const response = await fetch(
      JSONBIN_LATEST_URL,
      {
        method: "GET",
        headers: {
          "X-Access-Key": ACCESS_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `JSONBin READ gagal: ${response.status}`
      );
    }

    const result =
      await response.json();

    return result.record || null;
  } catch (error) {
    console.error(
      "Gagal membaca JSONBin:",
      error
    );

    return null;
  }
}

export async function saveGoldDataToCloud(
  transactions,
  brands = null
) {
  // Guest TIDAK BOLEH menulis ke cloud
  if (isGuestMode()) {
    return false;
  }

  if (!BIN_ID || !ACCESS_KEY) {
    console.warn(
      "JSONBin belum dikonfigurasi."
    );

    return false;
  }

  try {
    let currentRecord = null;

    try {
      const response = await fetch(
        JSONBIN_LATEST_URL,
        {
          method: "GET",
          headers: {
            "X-Access-Key": ACCESS_KEY,
          },
        }
      );

      if (response.ok) {
        const result =
          await response.json();

        currentRecord =
          result.record || null;
      }
    } catch (error) {
      console.warn(
        "Tidak dapat membaca data lama JSONBin:",
        error
      );
    }

    const updatedRecord = {
      transactions,
      brands:
        brands ??
        currentRecord?.brands ??
        [],
    };

    const response = await fetch(
      JSONBIN_URL,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Access-Key": ACCESS_KEY,
        },
        body: JSON.stringify(
          updatedRecord
        ),
      }
    );

    if (!response.ok) {
      throw new Error(
        `JSONBin UPDATE gagal: ${response.status}`
      );
    }

    return true;
  } catch (error) {
    console.error(
      "Gagal menyimpan ke JSONBin:",
      error
    );

    return false;
  }
}

export function saveGoldData(
  transactions,
  brands = null
) {
  // Guest tidak menyimpan data transaksi
  // ke localStorage maupun JSONBin.
  if (isGuestMode()) {
    return;
  }

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(transactions)
    );

    saveGoldDataToCloud(
      transactions,
      brands
    );
  } catch (error) {
    console.error(
      "Gagal menyimpan data:",
      error
    );
  }
}
