const STORAGE_KEY = "gold-save-data";

const BIN_ID =
  import.meta.env.VITE_JSONBIN_BIN_ID;

const ACCESS_KEY =
  import.meta.env.VITE_JSONBIN_ACCESS_KEY;

const JSONBIN_URL =
  `https://api.jsonbin.io/v3/b/${BIN_ID}`;

const JSONBIN_LATEST_URL =
  `${JSONBIN_URL}/latest`;

// ========================================
// LOCAL STORAGE
// ========================================

export function loadGoldData() {
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

// ========================================
// JSONBIN - LOAD DATA
// ========================================

export async function loadGoldDataFromCloud() {
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

    const result = await response.json();

    return result.record || null;
  } catch (error) {
    console.error(
      "Gagal membaca JSONBin:",
      error
    );

    return null;
  }
}

// ========================================
// JSONBIN - SAVE DATA
// ========================================

export async function saveGoldDataToCloud(
  transactions,
  brands = null
) {
  if (!BIN_ID || !ACCESS_KEY) {
    console.warn(
      "JSONBin belum dikonfigurasi."
    );

    return false;
  }

  try {
    let currentRecord = null;

    // Ambil data yang sudah ada terlebih dahulu
    // supaya brands tidak terhapus.
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

// ========================================
// SAVE LOCAL + CLOUD
// ========================================

export function saveGoldData(
  transactions,
  brands = null
) {
  try {
    // Backup lokal
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(transactions)
    );

    // Simpan cloud
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
