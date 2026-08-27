const STORAGE_KEY = "gold-save-data";

export function loadGoldData() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data);
  } catch (error) {
    console.error("Gagal membaca data:", error);
    return [];
  }
}

export function saveGoldData(data) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );
  } catch (error) {
    console.error("Gagal menyimpan data:", error);
  }
}
