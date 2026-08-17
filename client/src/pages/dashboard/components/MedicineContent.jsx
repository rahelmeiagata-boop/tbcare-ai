import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pill, Pencil, Trash2, X, Save, Clock3, Package } from "lucide-react";
import { getMedications, createMedication, updateMedication, deleteMedication } from "../../../services/medicationService";

const RULE_OPTIONS = [
    {
        value: "before_breakfast",
        label: "Sebelum Sarapan",
    },
    {
        value: "after_breakfast",
        label: "Sesudah Sarapan",
    },
    {
        value: "before_lunch",
        label: "Sebelum Makan Siang",
    },
    {
        value: "after_lunch",
        label: "Sesudah Makan Siang",
    },
    {
        value: "before_dinner",
        label: "Sebelum Makan Malam",
    },
    {
        value: "after_dinner",
        label: "Sesudah Makan Malam",
    },
    {
        value: "before_sleep",
        label: "Sebelum Tidur",
    },
];

const INITIAL_FORM = {
    med_name: "",
    dosage: "",
    frequency: "",
    duration_days: "",
    stock: "",
    consumption_rule: "",
    consumption_schedule: [],
};

const MedicineContent = () => {
    const navigate = useNavigate();

    const [medications, setMedications] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState(INITIAL_FORM);
    const fetchMedications = async () => {
        try {
            setLoading(true);

            const response = await getMedications();

            setMedications(response?.data || []);
        } catch (error) {
            console.error("Gagal mengambil data obat:", error);

            toast.error("Gagal mengambil data obat.");

            setMedications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMedications();
    }, []);

    const resetForm = () => {
        setFormData({ ...INITIAL_FORM });
        setEditingId(null);
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        resetForm();
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.med_name.trim()) {
            toast.error("Nama obat wajib diisi.");
            return;
        }

        if (!formData.dosage.trim()) {
            toast.error("Dosis obat wajib diisi.");
            return;
        }

        if (!formData.frequency) {
            toast.error("Frekuensi obat wajib dipilih.");
            return;
        }

        if (!formData.duration_days) {
            toast.error("Durasi obat wajib diisi.");
            return;
        }

        if (!formData.stock) {
            toast.error("Stok obat wajib diisi.");
            return;
        }

        const frequencyNumber = Number(formData.frequency);

        if (
            frequencyNumber > 0 &&
            formData.consumption_schedule.length !== frequencyNumber
        ) {
            toast.error(
                `Pilih tepat ${frequencyNumber} waktu minum obat.`
            );
            return;
        }

        try {
            if (editingId) {
                await updateMedication(editingId, formData);

                toast.success("Obat berhasil diperbarui.");
            } else {
                await createMedication(formData);

                toast.success("Obat berhasil ditambahkan.");
            }

            closeModal();

            await fetchMedications();
        } catch (error) {
            console.error("Gagal menyimpan obat:", error);

            toast.error("Gagal menyimpan obat.");
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);

        setFormData({
            med_name: item.med_name || "",
            dosage: item.dosage || "",
            frequency: item.frequency || "",
            duration_days: item.duration_days || "",
            stock: item.stock || "",
            consumption_rule: item.consumption_rule || "",
            consumption_schedule:
                item.consumption_schedule || [],
        });

        setShowModal(true);
    };

    const handleDelete = async (id) => {
        const confirmed = window.confirm(
            "Yakin ingin menghapus obat ini?"
        );

        if (!confirmed) return;

        try {
            await deleteMedication(id);

            toast.success("Obat berhasil dihapus.");

            await fetchMedications();
        } catch (error) {
            console.error("Gagal menghapus obat:", error);

            toast.error("Gagal menghapus obat.");
        }
    };

    const handleScheduleChange = (value) => {
        setFormData((prev) => {
            const current = prev.consumption_schedule || [];

            if (current.includes(value)) {
                return {
                    ...prev,
                    consumption_schedule: current.filter(
                        (item) => item !== value
                    ),
                };
            }

            const max = Number(prev.frequency);

            if (max && current.length >= max) {
                toast.error(
                    `Maksimal ${max} waktu minum untuk frekuensi ini.`
                );

                return prev;
            }

            return {
                ...prev,
                consumption_schedule: [...current, value],
            };
        });
    };

    if (loading) {
        return (
            <div className="w-full min-h-[420px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />

                    <p className="text-sm text-slate-500 font-medium">
                        Memuat data obat...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full font-['Poppins']">
            <div className="w-full max-w-[1280px] mx-auto px-6 lg:px-8 pb-10">
                <div className="flex items-center justify-between mb-6">

                    <div>
                        <h2 className="text-2xl font-bold text-[#101828]">
                            Daftar Obat
                        </h2>

                        <p className="mt-1 text-sm text-[#667085]">
                            Daftar obat yang sedang Anda konsumsi.
                        </p>
                    </div>

                    {medications.length > 0 && (
                        <button
                            type="button"
                            onClick={openAddModal}
                            className="
                                hidden
                                sm:inline-flex
                                items-center
                                gap-2
                                px-5
                                py-3
                                rounded-xl
                                text-white
                                font-semibold
                                bg-gradient-to-r
                                from-[#14B8A6]
                                to-[#078B9C]
                                shadow-[0_8px_20px_rgba(8,145,178,0.18)]
                                hover:-translate-y-0.5
                                hover:shadow-[0_12px_25px_rgba(8,145,178,0.24)]
                                active:scale-[0.98]
                                transition-all
                            "
                        >
                            <Plus size={19} strokeWidth={2.5} />
                            Tambah Obat
                        </button>
                    )}
                </div>

                {medications.length === 0 ? (
                    <div
                        className="
                            w-full
                            bg-white
                            rounded-2xl
                            border
                            border-slate-100
                            shadow-[0_8px_30px_rgba(15,23,42,0.05)]
                            min-h-[360px]
                            flex
                            flex-col
                            items-center
                            justify-center
                            text-center
                            px-6
                            py-12
                        "
                    >
                        <div
                            className="
                                w-20
                                h-20
                                rounded-2xl
                                bg-gradient-to-br
                                from-cyan-50
                                to-blue-50
                                flex
                                items-center
                                justify-center
                                mb-5
                            "
                        >
                            <Pill
                                size={40}
                                strokeWidth={1.8}
                                className="text-[#0891A5]"
                            />
                        </div>

                        <h3 className="text-xl font-bold text-[#172B4D]">
                            Belum ada data obat
                        </h3>

                        <p className="mt-2 max-w-md text-sm sm:text-base text-[#667085] leading-relaxed">
                            Tambahkan obat pertama Anda untuk mulai
                            mengatur daftar dan dosis obat harian.
                        </p>

                        <button
                            type="button"
                            onClick={openAddModal}
                            className="
                                mt-6
                                inline-flex
                                items-center
                                gap-2
                                px-6
                                py-3
                                rounded-xl
                                text-white
                                font-semibold
                                bg-gradient-to-r
                                from-[#14B8A6]
                                to-[#078B9C]
                                shadow-[0_8px_20px_rgba(8,145,178,0.18)]
                                hover:-translate-y-0.5
                                hover:shadow-[0_12px_25px_rgba(8,145,178,0.24)]
                                active:scale-[0.98]
                                transition-all
                            "
                        >
                            <Plus size={19} />
                            Tambahkan Obat
                        </button>
                    </div>
                ) : (
                    <>
                        <div
                            className="
                                hidden
                                md:block
                                bg-white
                                rounded-2xl
                                border
                                border-slate-100
                                shadow-[0_8px_30px_rgba(15,23,42,0.05)]
                                overflow-hidden
                            "
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full">

                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Nama Obat
                                            </th>

                                            <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Dosis
                                            </th>

                                            <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Frekuensi
                                            </th>

                                            <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Durasi
                                            </th>

                                            <th className="text-left px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Stok
                                            </th>

                                            <th className="text-right px-6 py-4 text-xs font-bold uppercase tracking-wide text-slate-500">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {medications.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="hover:bg-slate-50/70 transition-colors"
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
                                                            <Pill
                                                                size={20}
                                                                className="text-[#0891A5]"
                                                            />
                                                        </div>

                                                        <div>
                                                            <p className="font-semibold text-[#172B4D]">
                                                                {item.med_name}
                                                            </p>

                                                            {item.consumption_rule && (
                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    {item.consumption_rule}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <span className="inline-flex px-3 py-1 rounded-lg bg-blue-50 text-blue-700 text-sm font-medium">
                                                        {item.dosage}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                                        <Clock3 size={16} />
                                                        {item.frequency}x sehari
                                                    </span>
                                                </td>

                                                <td className="px-6 py-5 text-sm text-slate-600">
                                                    {item.duration_days} hari
                                                </td>

                                                <td className="px-6 py-5">
                                                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                                        <Package size={16} />
                                                        {item.stock}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-5">
                                                    <div className="flex justify-end gap-2">

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleEdit(item)
                                                            }
                                                            className="
                                                                w-10
                                                                h-10
                                                                rounded-xl
                                                                flex
                                                                items-center
                                                                justify-center
                                                                text-blue-600
                                                                bg-blue-50
                                                                hover:bg-blue-100
                                                                transition-colors
                                                            "
                                                            title="Edit obat"
                                                        >
                                                            <Pencil size={17} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    item.id
                                                                )
                                                            }
                                                            className="
                                                                w-10
                                                                h-10
                                                                rounded-xl
                                                                flex
                                                                items-center
                                                                justify-center
                                                                text-red-600
                                                                bg-red-50
                                                                hover:bg-red-100
                                                                transition-colors
                                                            "
                                                            title="Hapus obat"
                                                        >
                                                            <Trash2 size={17} />
                                                        </button>

                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="md:hidden space-y-4">
                            {medications.map((item) => (
                                <div
                                    key={item.id}
                                    className="
                                        bg-white
                                        rounded-2xl
                                        border
                                        border-slate-100
                                        shadow-[0_8px_25px_rgba(15,23,42,0.05)]
                                        p-5
                                    "
                                >
                                    <div className="flex items-start justify-between gap-4">

                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="w-11 h-11 rounded-xl bg-cyan-50 flex items-center justify-center shrink-0">
                                                <Pill
                                                    size={22}
                                                    className="text-[#0891A5]"
                                                />
                                            </div>

                                            <div className="min-w-0">
                                                <h3 className="font-bold text-[#172B4D] break-words">
                                                    {item.med_name}
                                                </h3>

                                                <p className="mt-1 text-sm text-slate-500">
                                                    {item.dosage}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-1 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleEdit(item)
                                                }
                                                className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"
                                            >
                                                <Pencil size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDelete(item.id)
                                                }
                                                className="w-9 h-9 rounded-lg bg-red-50 text-red-600 flex items-center justify-center"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-5">

                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <p className="text-xs text-slate-400">
                                                Frekuensi
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                                {item.frequency}x sehari
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <p className="text-xs text-slate-400">
                                                Durasi
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                                {item.duration_days} hari
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <p className="text-xs text-slate-400">
                                                Stok
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                                {item.stock}
                                            </p>
                                        </div>

                                        <div className="rounded-xl bg-slate-50 p-3">
                                            <p className="text-xs text-slate-400">
                                                Waktu minum
                                            </p>

                                            <p className="mt-1 text-sm font-semibold text-slate-700">
                                                {item.consumption_schedule?.length || 0} waktu
                                            </p>
                                        </div>

                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={() => navigate("/routine")}
                                className="
                                    inline-flex
                                    items-center
                                    gap-2
                                    px-5
                                    py-3
                                    rounded-xl
                                    text-white
                                    font-semibold
                                    bg-gradient-to-r
                                    from-[#2563EB]
                                    to-[#1D4ED8]
                                    shadow-[0_8px_20px_rgba(37,99,235,0.18)]
                                    hover:-translate-y-0.5
                                    hover:shadow-[0_12px_25px_rgba(37,99,235,0.25)]
                                    active:scale-[0.98]
                                    transition-all
                                "
                            >
                                Buat Jadwal dengan AI
                            </button>
                        </div>
                    </>
                )}
            </div>

            {showModal && (
                <div
                    className="
                        fixed
                        inset-0
                        z-[9999]
                        flex
                        items-center
                        justify-center
                        p-4
                        bg-slate-950/40
                        backdrop-blur-sm
                    "
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            closeModal();
                        }
                    }}
                >
                    <div
                        className="
                            relative
                            w-full
                            max-w-[620px]
                            max-h-[90vh]
                            overflow-y-auto
                            bg-white
                            rounded-2xl
                            shadow-[0_30px_80px_rgba(15,23,42,0.25)]
                        "
                    >
                        <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between">

                            <div>
                                <h2 className="text-xl font-bold text-[#172B4D]">
                                    {editingId
                                        ? "Edit Obat"
                                        : "Tambah Obat"}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Lengkapi informasi obat Anda.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closeModal}
                                className="
                                    w-10
                                    h-10
                                    rounded-xl
                                    flex
                                    items-center
                                    justify-center
                                    text-slate-400
                                    hover:text-slate-700
                                    hover:bg-slate-100
                                    transition-colors
                                "
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="p-6"
                        >
                            <div className="space-y-5">
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-slate-700">
                                        Nama Obat
                                    </label>

                                    <input
                                        type="text"
                                        value={formData.med_name}
                                        onChange={(e) =>
                                            handleChange(
                                                "med_name",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Masukkan nama obat"
                                        className="
                                            w-full
                                            h-12
                                            px-4
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-slate-50
                                            outline-none
                                            focus:bg-white
                                            focus:border-teal-500
                                            focus:ring-4
                                            focus:ring-teal-50
                                            transition-all
                                        "
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-slate-700">
                                        Dosis Obat
                                    </label>

                                    <input
                                        type="text"
                                        value={formData.dosage}
                                        onChange={(e) =>
                                            handleChange(
                                                "dosage",
                                                e.target.value
                                            )
                                        }
                                        placeholder="Contoh: 300 Mg/tablet"
                                        className="
                                            w-full
                                            h-12
                                            px-4
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-slate-50
                                            outline-none
                                            focus:bg-white
                                            focus:border-teal-500
                                            focus:ring-4
                                            focus:ring-teal-50
                                            transition-all
                                        "
                                    />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-slate-700">
                                        Frekuensi Obat
                                    </label>

                                    <select
                                        value={formData.frequency}
                                        onChange={(e) => {
                                            handleChange(
                                                "frequency",
                                                Number(e.target.value)
                                            );

                                            handleChange(
                                                "consumption_schedule",
                                                []
                                            );
                                        }}
                                        className="
                                            w-full
                                            h-12
                                            px-4
                                            rounded-xl
                                            border
                                            border-slate-200
                                            bg-slate-50
                                            outline-none
                                            focus:bg-white
                                            focus:border-teal-500
                                            focus:ring-4
                                            focus:ring-teal-50
                                            transition-all
                                        "
                                    >
                                        <option value="">
                                            Pilih frekuensi
                                        </option>

                                        <option value={1}>
                                            1x Sehari
                                        </option>

                                        <option value={2}>
                                            2x Sehari
                                        </option>

                                        <option value={3}>
                                            3x Sehari
                                        </option>

                                        <option value={4}>
                                            4x Sehari
                                        </option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                    <div>
                                        <label className="block mb-2 text-sm font-semibold text-slate-700">
                                            Durasi
                                        </label>

                                        <input
                                            type="number"
                                            min="1"
                                            value={
                                                formData.duration_days
                                            }
                                            onChange={(e) =>
                                                handleChange(
                                                    "duration_days",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Contoh: 7"
                                            className="
                                                w-full
                                                h-12
                                                px-4
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-slate-50
                                                outline-none
                                                focus:bg-white
                                                focus:border-teal-500
                                                focus:ring-4
                                                focus:ring-teal-50
                                            "
                                        />
                                    </div>

                                    <div>
                                        <label className="block mb-2 text-sm font-semibold text-slate-700">
                                            Stok
                                        </label>

                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.stock}
                                            onChange={(e) =>
                                                handleChange(
                                                    "stock",
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Contoh: 20"
                                            className="
                                                w-full
                                                h-12
                                                px-4
                                                rounded-xl
                                                border
                                                border-slate-200
                                                bg-slate-50
                                                outline-none
                                                focus:bg-white
                                                focus:border-teal-500
                                                focus:ring-4
                                                focus:ring-teal-50
                                            "
                                        />
                                    </div>

                                </div>
                                <div className="rounded-xl border border-slate-200 p-4">

                                    <div className="flex items-center justify-between mb-4">

                                        <div>
                                            <p className="font-semibold text-slate-700">
                                                Waktu Minum Obat
                                            </p>

                                            <p className="text-xs text-slate-400 mt-1">
                                                Pilih sesuai frekuensi
                                                obat.
                                            </p>
                                        </div>

                                        {formData.frequency && (
                                            <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-full">
                                                {
                                                    formData
                                                        .consumption_schedule
                                                        .length
                                                }{" "}
                                                /{" "}
                                                {formData.frequency}
                                            </span>
                                        )}

                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                                        {RULE_OPTIONS.map((rule) => {
                                            const checked =
                                                formData.consumption_schedule.includes(
                                                    rule.value
                                                );

                                            const maxSelected =
                                                formData.frequency &&
                                                formData
                                                    .consumption_schedule
                                                    .length >=
                                                    Number(
                                                        formData.frequency
                                                    );

                                            return (
                                                <label
                                                    key={rule.value}
                                                    className={`
                                                        flex
                                                        items-center
                                                        gap-3
                                                        p-3
                                                        rounded-xl
                                                        border
                                                        cursor-pointer
                                                        transition-all
                                                        ${
                                                            checked
                                                                ? "border-teal-300 bg-teal-50"
                                                                : "border-slate-200 bg-white hover:bg-slate-50"
                                                        }
                                                    `}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        disabled={
                                                            !checked &&
                                                            maxSelected
                                                        }
                                                        onChange={() =>
                                                            handleScheduleChange(
                                                                rule.value
                                                            )
                                                        }
                                                        className="w-4 h-4 accent-teal-600"
                                                    />

                                                    <span className="text-sm text-slate-700">
                                                        {rule.label}
                                                    </span>
                                                </label>
                                            );
                                        })}

                                    </div>
                                </div>

                            </div>
                            <div className="mt-7 pt-5 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-between gap-3">

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="
                                        inline-flex
                                        items-center
                                        justify-center
                                        gap-2
                                        px-5
                                        py-3
                                        rounded-xl
                                        text-white
                                        font-semibold
                                        bg-gradient-to-r
                                        from-[#EF4444]
                                        to-[#B91C1C]
                                        shadow-[0_8px_18px_rgba(185,28,28,0.15)]
                                        hover:-translate-y-0.5
                                        active:scale-[0.98]
                                        transition-all
                                    "
                                >
                                    <Trash2 size={17} />
                                    Batal
                                </button>

                                <button
                                    type="submit"
                                    className="
                                        inline-flex
                                        items-center
                                        justify-center
                                        gap-2
                                        px-6
                                        py-3
                                        rounded-xl
                                        text-white
                                        font-semibold
                                        bg-gradient-to-r
                                        from-[#2563EB]
                                        to-[#1D4ED8]
                                        shadow-[0_8px_20px_rgba(37,99,235,0.18)]
                                        hover:-translate-y-0.5
                                        active:scale-[0.98]
                                        transition-all
                                    "
                                >
                                    <Save size={17} />

                                    {editingId
                                        ? "Update Obat"
                                        : "Simpan Obat"}
                                </button>

                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MedicineContent;