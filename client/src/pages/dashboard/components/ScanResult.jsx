import { useState } from "react";
import toast from "react-hot-toast";
import {
    AlertTriangle,
    CheckCircle2,
    ChevronDown,
    FileText,
    Info,
    Layers,
    Loader2,
} from "lucide-react";

// Sama dengan pilihan di form Obat Saya (MedicineContent.jsx).
const SCHEDULE_OPTIONS = [
    { value: "before_breakfast", label: "Sebelum Sarapan" },
    { value: "after_breakfast", label: "Sesudah Sarapan" },
    { value: "before_lunch", label: "Sebelum Makan Siang" },
    { value: "after_lunch", label: "Sesudah Makan Siang" },
    { value: "before_dinner", label: "Sebelum Makan Malam" },
    { value: "after_dinner", label: "Sesudah Makan Malam" },
    { value: "before_sleep", label: "Sebelum Tidur" },
];

const FREQUENCY_OPTIONS = [1, 2, 3, 4];

const INPUT_CLASS =
    "w-full h-11 px-3.5 rounded-xl border bg-slate-50 text-sm outline-none focus:bg-white focus:ring-4 transition-all";

// ------------------------------------------------------------------ data
const toDraft = (med, index) => ({
    uid: index,
    // Obat yang tidak dikenal dataset tidak dicentang otomatis; pasien yang memutuskan.
    include: Boolean(med.matched),
    med_name: med.med_name ?? "",
    dosage: med.dosage ?? "",
    frequency: med.frequency ? String(med.frequency) : "",
    duration_days: med.duration_days ? String(med.duration_days) : "",
    stock: med.stock ? String(med.stock) : "",
    consumption_rule: med.consumption_rule ?? "",
    consumption_schedule: Array.isArray(med.consumption_schedule)
        ? med.consumption_schedule
        : [],
    meta: {
        matched: Boolean(med.matched),
        needsReview: Boolean(med.needs_review),
        confidence: med.confidence ?? 0,
        detectedName: med.detected_name ?? "",
        issues: med.issues ?? [],
        notes: med.notes ?? [],
        durationEstimated: Boolean(med.duration_estimated),
    },
});

// Aturan sama dengan form Obat Saya dan validasi di server.
const validateDraft = (draft) => {
    const errors = {};

    const name = draft.med_name.trim();
    if (!name) errors.med_name = "Nama obat wajib diisi.";
    else if (name.length > 100) errors.med_name = "Maksimal 100 karakter.";

    const dosage = draft.dosage.trim();
    if (!dosage) errors.dosage = "Dosis wajib diisi.";
    else if (dosage.length > 50) errors.dosage = "Maksimal 50 karakter.";

    const frequency = Number(draft.frequency);
    if (!Number.isInteger(frequency) || frequency < 1 || frequency > 4) {
        errors.frequency = "Pilih 1-4 kali sehari.";
    }

    const duration = Number(draft.duration_days);
    if (!draft.duration_days || !Number.isInteger(duration) || duration < 1 || duration > 1000) {
        errors.duration_days = "Isi 1-1000 hari.";
    }

    const stock = Number(draft.stock);
    if (!draft.stock || !Number.isInteger(stock) || stock < 1) {
        errors.stock = "Isi minimal 1.";
    }

    if (!errors.frequency && draft.consumption_schedule.length !== frequency) {
        errors.consumption_schedule = `Pilih ${frequency} waktu minum.`;
    }

    return errors;
};

const toPayload = (draft) => ({
    med_name: draft.med_name.trim(),
    dosage: draft.dosage.trim(),
    frequency: Number(draft.frequency),
    duration_days: Number(draft.duration_days),
    stock: Number(draft.stock),
    consumption_rule: draft.consumption_rule.trim(),
    consumption_schedule: draft.consumption_schedule,
});

// ------------------------------------------------------------ komponen kecil
const Badge = ({ meta }) => {
    if (!meta.matched) {
        return (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                Tidak ada di dataset TBC
            </span>
        );
    }
    if (meta.needsReview) {
        return (
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                Perlu dicek
            </span>
        );
    }
    return (
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700">
            Terbaca jelas
        </span>
    );
};

const Field = ({ id, label, error, hint, children }) => (
    <div>
        <label htmlFor={id} className="block mb-1.5 text-xs font-semibold text-slate-600">
            {label}
            {hint && <span className="ml-1.5 font-normal text-amber-600">{hint}</span>}
        </label>
        {children}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
);

const inputClass = (hasError) =>
    `${INPUT_CLASS} ${
        hasError
            ? "border-red-300 focus:border-red-400 focus:ring-red-50"
            : "border-slate-200 focus:border-teal-500 focus:ring-teal-50"
    }`;

// ------------------------------------------------------------ komponen utama
const ScanResult = ({ result, onSave, saving }) => {
    const [drafts, setDrafts] = useState(() => (result.medications ?? []).map(toDraft));
    const [showErrors, setShowErrors] = useState(false);

    const steps = result.steps ?? [];
    const warnings = result.warnings ?? [];
    const rawText = result.ocr?.text ?? "";
    const reviewCount = drafts.filter((d) => d.meta.needsReview || !d.meta.matched).length;
    const selected = drafts.filter((d) => d.include);

    const update = (uid, patch) =>
        setDrafts((list) => list.map((d) => (d.uid === uid ? { ...d, ...patch } : d)));

    const changeFrequency = (draft, value) => {
        const limit = Number(value) || 0;
        update(draft.uid, {
            frequency: value,
            // Jumlah waktu minum tidak boleh melebihi frekuensi.
            consumption_schedule: draft.consumption_schedule.slice(0, limit),
        });
    };

    const toggleSchedule = (draft, value) => {
        const limit = Number(draft.frequency) || 0;
        const current = draft.consumption_schedule;

        if (current.includes(value)) {
            update(draft.uid, { consumption_schedule: current.filter((item) => item !== value) });
            return;
        }
        if (current.length >= limit) return;
        update(draft.uid, { consumption_schedule: [...current, value] });
    };

    const handleSave = () => {
        if (selected.length === 0 || saving) return;

        setShowErrors(true);
        const invalid = selected.find((d) => Object.keys(validateDraft(d)).length > 0);

        if (invalid) {
            toast.error("Lengkapi data obat yang ditandai merah terlebih dahulu.");
            document
                .getElementById(`scan-med-${invalid.uid}`)
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            return;
        }

        onSave(selected.map(toPayload));
    };

    return (
        <div className="mt-6 space-y-4">
            {/* RINGKASAN */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                    </div>

                    <div>
                        <p className="font-semibold text-blue-700">
                            {drafts.length} obat terdeteksi
                            {reviewCount > 0 && ` · ${reviewCount} perlu dicek`}
                        </p>

                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                            Keyakinan baca teks rata-rata {Math.round(result.ocr?.mean_confidence ?? 0)}%
                            {result.engine?.ocr && ` · ${result.engine.ocr} (${result.engine.lang})`}
                        </p>
                    </div>
                </div>
            </div>

            {/* PERINGATAN DARI SISTEM */}
            {warnings.map((warning) => (
                <div
                    key={warning}
                    className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50 border border-amber-100"
                >
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">{warning}</p>
                </div>
            ))}

            {/* PERINGATAN TETAP */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 leading-relaxed">
                    Hasil ini dibaca otomatis dan bisa keliru, terutama pada tulisan tangan.
                    <strong className="font-semibold"> Cocokkan setiap isian dengan resep asli</strong>{" "}
                    sebelum menyimpan, dan tanyakan ke dokter atau apoteker bila ragu.
                </p>
            </div>

            {drafts.length === 0 && (
                <div className="text-center py-8">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                        <FileText className="w-6 h-6 text-gray-300" />
                    </div>
                    <p className="font-medium text-gray-600">Tidak ada obat yang dikenali.</p>
                    <p className="text-sm text-gray-400 mt-1 max-w-xs mx-auto">
                        Coba foto ulang dengan cahaya merata, atau tambahkan obat secara manual di menu Obat Saya.
                    </p>
                </div>
            )}

            {/* KARTU OBAT */}
            <datalist id="scan-drug-names">
                {(result.drug_names ?? []).map((name) => (
                    <option key={name} value={name} />
                ))}
            </datalist>

            {drafts.map((draft) => {
                const errors = showErrors && draft.include ? validateDraft(draft) : {};
                const hasErrors = Object.keys(errors).length > 0;
                const limit = Number(draft.frequency) || 0;
                const prefix = `scan-${draft.uid}`;

                return (
                    <div
                        key={draft.uid}
                        id={`scan-med-${draft.uid}`}
                        className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
                            hasErrors
                                ? "border-red-300 bg-white ring-2 ring-red-50"
                                : draft.include
                                  ? "border-gray-200 bg-white"
                                  : "border-gray-100 bg-gray-50/70"
                        }`}
                    >
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={draft.include}
                                onChange={(e) => update(draft.uid, { include: e.target.checked })}
                                className="mt-1 h-4 w-4 accent-teal-600"
                            />

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-semibold text-gray-800 break-words">
                                        {draft.med_name || "Obat tanpa nama"}
                                    </p>
                                    <Badge meta={draft.meta} />
                                </div>

                                <p className="text-xs text-gray-400 mt-1">
                                    {draft.meta.detectedName && `Terbaca: “${draft.meta.detectedName}” · `}
                                    keyakinan {Math.round(draft.meta.confidence * 100)}%
                                </p>
                            </div>
                        </label>

                        {draft.meta.issues.length > 0 && (
                            <ul className="mt-3 space-y-1.5 rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-3">
                                {draft.meta.issues.map((issue) => (
                                    <li key={issue} className="flex items-start gap-2 text-xs text-amber-800 leading-relaxed">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                                        {issue}
                                    </li>
                                ))}
                            </ul>
                        )}

                        {!draft.include && (
                            <p className="mt-3 text-xs text-gray-400">
                                Obat ini tidak akan disimpan. Centang bila ingin tetap menyimpannya.
                            </p>
                        )}

                        {draft.include && (
                            <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <Field id={`${prefix}-name`} label="Nama Obat" error={errors.med_name}>
                                            <input
                                                id={`${prefix}-name`}
                                                type="text"
                                                list="scan-drug-names"
                                                autoComplete="off"
                                                value={draft.med_name}
                                                onChange={(e) => update(draft.uid, { med_name: e.target.value })}
                                                className={inputClass(errors.med_name)}
                                            />
                                        </Field>
                                    </div>

                                    <Field id={`${prefix}-dosage`} label="Dosis" error={errors.dosage}>
                                        <input
                                            id={`${prefix}-dosage`}
                                            type="text"
                                            value={draft.dosage}
                                            placeholder="Contoh: 450 mg"
                                            onChange={(e) => update(draft.uid, { dosage: e.target.value })}
                                            className={inputClass(errors.dosage)}
                                        />
                                    </Field>

                                    <Field id={`${prefix}-freq`} label="Frekuensi" error={errors.frequency}>
                                        <select
                                            id={`${prefix}-freq`}
                                            value={draft.frequency}
                                            onChange={(e) => changeFrequency(draft, e.target.value)}
                                            className={inputClass(errors.frequency)}
                                        >
                                            <option value="">Pilih frekuensi</option>
                                            {FREQUENCY_OPTIONS.map((n) => (
                                                <option key={n} value={n}>
                                                    {n}x sehari
                                                </option>
                                            ))}
                                        </select>
                                    </Field>

                                    <Field
                                        id={`${prefix}-days`}
                                        label="Durasi (hari)"
                                        error={errors.duration_days}
                                        hint={draft.meta.durationEstimated ? "perkiraan" : ""}
                                    >
                                        <input
                                            id={`${prefix}-days`}
                                            type="number"
                                            min="1"
                                            value={draft.duration_days}
                                            onChange={(e) => update(draft.uid, { duration_days: e.target.value })}
                                            className={inputClass(errors.duration_days)}
                                        />
                                    </Field>

                                    <Field id={`${prefix}-stock`} label="Jumlah Obat (stok)" error={errors.stock}>
                                        <input
                                            id={`${prefix}-stock`}
                                            type="number"
                                            min="1"
                                            value={draft.stock}
                                            onChange={(e) => update(draft.uid, { stock: e.target.value })}
                                            className={inputClass(errors.stock)}
                                        />
                                    </Field>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-semibold text-slate-600">
                                            Waktu Minum
                                            {draft.consumption_rule && (
                                                <span className="ml-1.5 font-normal text-slate-400">
                                                    (resep: {draft.consumption_rule.toLowerCase()})
                                                </span>
                                            )}
                                        </p>
                                        <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">
                                            {draft.consumption_schedule.length}/{limit || "-"}
                                        </span>
                                    </div>

                                    {limit === 0 ? (
                                        <p className="text-xs text-gray-400">Pilih frekuensi terlebih dahulu.</p>
                                    ) : (
                                        <div className="flex flex-wrap gap-2">
                                            {SCHEDULE_OPTIONS.map((option) => {
                                                const active = draft.consumption_schedule.includes(option.value);
                                                const locked = !active && draft.consumption_schedule.length >= limit;

                                                return (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        disabled={locked}
                                                        onClick={() => toggleSchedule(draft, option.value)}
                                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                                            active
                                                                ? "bg-teal-600 border-teal-600 text-white shadow-sm"
                                                                : locked
                                                                  ? "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed"
                                                                  : "bg-white border-slate-200 text-slate-600 hover:border-teal-400 hover:text-teal-700"
                                                        }`}
                                                    >
                                                        {option.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {errors.consumption_schedule && (
                                        <p className="mt-1.5 text-xs text-red-500">{errors.consumption_schedule}</p>
                                    )}
                                </div>

                                {draft.meta.notes.length > 0 && (
                                    <ul className="space-y-1">
                                        {draft.meta.notes.map((note) => (
                                            <li key={note} className="flex items-start gap-2 text-xs text-gray-400 leading-relaxed">
                                                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                {note}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}

            {/* SIMPAN */}
            {drafts.length > 0 && (
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={selected.length === 0 || saving}
                    className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold transition-all duration-300 ${
                        selected.length === 0 || saving
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-teal-600 to-cyan-500 hover:from-teal-700 hover:to-cyan-600 text-white shadow-md shadow-teal-500/20 hover:shadow-lg hover:shadow-teal-500/25 hover:-translate-y-0.5"
                    }`}
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <CheckCircle2 className="w-5 h-5" />
                    )}
                    {saving
                        ? "Menyimpan..."
                        : selected.length > 0
                          ? `Simpan ${selected.length} Obat ke Obat Saya`
                          : "Pilih obat yang akan disimpan"}
                </button>
            )}

            {/* TAHAPAN IMAGE PROCESSING */}
            {steps.length > 0 && (
                <details className="group rounded-2xl border border-gray-100 bg-white">
                    <summary className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer list-none select-none">
                        <span className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                            <Layers className="w-4 h-4 text-teal-600" />
                            Tahapan image processing ({steps.length})
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" />
                    </summary>

                    <div className="px-4 pb-4">
                        <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                            Foto resep diperbaiki dengan OpenCV sebelum dibaca, supaya tulisan lebih jelas dan akurat.
                        </p>

                        <div className="grid grid-cols-2 gap-3">
                            {steps.map((step, index) => (
                                <figure key={step.key} className="space-y-1.5">
                                    <img
                                        src={step.image}
                                        alt={step.title}
                                        loading="lazy"
                                        className="w-full h-40 object-contain rounded-lg border border-gray-100 bg-gray-50"
                                    />
                                    <figcaption>
                                        <p className="text-xs font-semibold text-gray-700">
                                            {index + 1}. {step.title}
                                        </p>
                                        <p className="text-[11px] text-gray-400 leading-snug">{step.description}</p>
                                    </figcaption>
                                </figure>
                            ))}
                        </div>
                    </div>
                </details>
            )}

            {/* TEKS MENTAH OCR */}
            {rawText && (
                <details className="group rounded-2xl border border-gray-100 bg-white">
                    <summary className="flex items-center justify-between gap-3 px-4 py-3.5 cursor-pointer list-none select-none">
                        <span className="flex items-center gap-2.5 text-sm font-semibold text-gray-700">
                            <FileText className="w-4 h-4 text-teal-600" />
                            Teks hasil baca (OCR)
                        </span>
                        <ChevronDown className="w-4 h-4 text-gray-400 transition-transform group-open:rotate-180" />
                    </summary>

                    <pre className="px-4 pb-4 text-xs text-gray-600 whitespace-pre-wrap break-words font-mono leading-relaxed">
                        {rawText}
                    </pre>
                </details>
            )}
        </div>
    );
};

export default ScanResult;
