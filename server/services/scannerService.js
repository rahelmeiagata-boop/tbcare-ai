import db from "../config/db.js";

import { createMedication } from "./medicationService.js";

// Sama dengan pilihan jadwal di form Obat Saya (MedicineContent.jsx).
export const SCHEDULE_KEYS = [
  "before_breakfast",
  "after_breakfast",
  "before_lunch",
  "after_lunch",
  "before_dinner",
  "after_dinner",
  "before_sleep",
];

export const MAX_FREQUENCY = 4;
export const MAX_MEDICATIONS_PER_CONFIRM = 20;

export class ScannerInputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "ScannerInputError";
    this.status = status;
  }
}

// ---------------------------------------------------------------- validasi
const toInteger = (value) => {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/.test(value.trim())) return Number(value.trim());
  return NaN;
};

const toText = (value) => (typeof value === "string" ? value.trim() : "");

/**
 * Validasi satu obat hasil scan yang sudah diperiksa pasien.
 * Aturannya mengikuti form Obat Saya dan batas kolom database.
 * Mengembalikan { value } bila valid atau { error } berisi pesan untuk pengguna.
 */
export const validateScannedMedication = (item, index = 0) => {
  const name = toText(item?.med_name);
  const label = name ? `"${name}"` : `obat ke-${index + 1}`;

  if (!name) return { error: `Nama obat wajib diisi (${label}).` };
  if (name.length > 100) return { error: `Nama obat ${label} terlalu panjang (maksimal 100 karakter).` };

  const dosage = toText(item?.dosage);
  if (!dosage) return { error: `Dosis ${label} wajib diisi.` };
  if (dosage.length > 50) return { error: `Dosis ${label} terlalu panjang (maksimal 50 karakter).` };

  const frequency = toInteger(item?.frequency);
  if (!(frequency >= 1 && frequency <= MAX_FREQUENCY)) {
    return { error: `Frekuensi ${label} harus 1 sampai ${MAX_FREQUENCY} kali sehari.` };
  }

  const durationDays = toInteger(item?.duration_days);
  if (!(durationDays >= 1 && durationDays <= 1000)) {
    return { error: `Durasi ${label} harus berupa jumlah hari antara 1 dan 1000.` };
  }

  const stock = toInteger(item?.stock);
  if (!(stock >= 1 && stock <= 100000)) {
    return { error: `Jumlah obat ${label} harus berupa angka minimal 1.` };
  }

  const rule = toText(item?.consumption_rule);
  if (rule.length > 255) return { error: `Aturan minum ${label} terlalu panjang (maksimal 255 karakter).` };

  const schedule = Array.isArray(item?.consumption_schedule) ? item.consumption_schedule : [];
  if (schedule.some((key) => !SCHEDULE_KEYS.includes(key))) {
    return { error: `Waktu minum ${label} tidak dikenali.` };
  }
  if (new Set(schedule).size !== schedule.length) {
    return { error: `Waktu minum ${label} tidak boleh dipilih dua kali.` };
  }
  if (schedule.length !== frequency) {
    return { error: `Pilih ${frequency} waktu minum untuk ${label} (sesuai frekuensi).` };
  }

  return {
    value: {
      med_name: name,
      dosage,
      frequency,
      duration_days: durationDays,
      stock,
      consumption_rule: rule,
      consumption_schedule: schedule,
    },
  };
};

/** Validasi seluruh daftar; berhenti pada kesalahan pertama. */
export const validateScannedMedications = (medications) => {
  if (!Array.isArray(medications) || medications.length === 0) {
    throw new ScannerInputError("Pilih minimal satu obat untuk disimpan.");
  }
  if (medications.length > MAX_MEDICATIONS_PER_CONFIRM) {
    throw new ScannerInputError(`Maksimal ${MAX_MEDICATIONS_PER_CONFIRM} obat sekali simpan.`);
  }

  return medications.map((item, index) => {
    const { value, error } = validateScannedMedication(item, index);
    if (error) throw new ScannerInputError(error);
    return value;
  });
};

// ----------------------------------------------------------- riwayat scan
const truncate = (value, max) => (value == null ? null : String(value).slice(0, max));

/**
 * Catat hasil scan ke prescription_scans + ocr_results.
 *
 * Yang disimpan hanya baris resep yang berisi obat (bukan seluruh teks, agar
 * nama dokter/pasien tidak ikut tersimpan) dan GAMBAR TIDAK DISIMPAN: kolom
 * image_path hanya berisi nama file asli. Kegagalan mencatat tidak boleh
 * membatalkan scan, jadi mengembalikan null bila gagal.
 */
export const saveScanRecord = async (userId, filename, result) => {
  let scanId;

  try {
    const safeName = String(filename || "resep").replace(/[^\w.\- ]/g, "_").slice(0, 200);

    const [scan] = await db.execute(
      `INSERT INTO prescription_scans (user_id, image_path, scan_status)
       VALUES (?, ?, 'processed')`,
      [userId, `not-stored:${safeName}`]
    );
    scanId = scan.insertId;
  } catch (err) {
    console.error("Gagal mencatat riwayat scan (scan tetap dikembalikan):", err.message);
    return null;
  }

  try {
    for (const med of result.medications) {
      await db.execute(
        `INSERT INTO ocr_results
         (scan_id, raw_text, extracted_med_name, extracted_dosage, confidence_score)
         VALUES (?, ?, ?, ?, ?)`,
        [
          scanId,
          truncate(med.source_text, 2000),
          truncate(med.med_name, 100),
          truncate(med.dosage, 50),
          Number.isFinite(med.confidence) ? med.confidence : null,
        ]
      );
    }
  } catch (err) {
    console.error("Gagal mencatat detail hasil OCR:", err.message);
  }

  return scanId;
};

// -------------------------------------------------------------- konfirmasi
const setScanStatus = async (userId, scanId, status) => {
  try {
    await db.execute(
      `UPDATE prescription_scans SET scan_status = ? WHERE id = ? AND user_id = ?`,
      [status, scanId, userId]
    );
  } catch (err) {
    console.error("Gagal memperbarui status scan:", err.message);
  }
};

/**
 * Simpan obat hasil scan yang sudah dikonfirmasi pasien ke data obat pasien.
 * Memakai createMedication yang sama dengan form Obat Saya, sehingga jadwal
 * pengingat dibuat dengan cara yang sama.
 */
export const confirmScannedMedications = async (userId, { scanId, medications }) => {
  const validated = validateScannedMedications(medications);

  // "Klaim" scan secara atomik supaya klik ganda tidak menggandakan obat.
  let claimed = false;
  if (scanId) {
    const [claim] = await db.execute(
      `UPDATE prescription_scans
       SET scan_status = 'confirmed'
       WHERE id = ? AND user_id = ? AND scan_status <> 'confirmed'`,
      [scanId, userId]
    );

    if (claim.affectedRows === 1) {
      claimed = true;
    } else {
      const [rows] = await db.execute(
        `SELECT scan_status FROM prescription_scans WHERE id = ? AND user_id = ?`,
        [scanId, userId]
      );
      if (rows.length > 0 && rows[0].scan_status === "confirmed") {
        throw new ScannerInputError("Resep ini sudah pernah disimpan.", 409);
      }
    }
  }

  const created = [];
  const failed = [];

  for (const [index, medication] of validated.entries()) {
    try {
      created.push(await createMedication(userId, medication));
    } catch (err) {
      console.error(`Gagal menyimpan obat hasil scan "${medication.med_name}":`, err.message);
      failed.push({ index, med_name: medication.med_name });
    }
  }

  // Tidak ada yang tersimpan -> kembalikan status agar pasien bisa mencoba lagi.
  if (claimed && created.length === 0) {
    await setScanStatus(userId, scanId, "processed");
  }

  return { created, failed };
};
