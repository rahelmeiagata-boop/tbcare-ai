import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMedications,
  createMedication,
  updateMedication,
  deleteMedication,
} from "../../../services/medicationService";

const RULE_OPTIONS = [
  { value: "before_breakfast", label: "Sebelum Sarapan" },
  { value: "after_breakfast", label: "Sesudah Sarapan" },

  { value: "before_lunch", label: "Sebelum Makan Siang" },
  { value: "after_lunch", label: "Sesudah Makan Siang" },

  { value: "before_dinner", label: "Sebelum Makan Malam" },
  { value: "after_dinner", label: "Sesudah Makan Malam" },

  { value: "before_sleep", label: "Sebelum Tidur" },
];

const MedicineContent = () => {
  const navigate = useNavigate();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    med_name: "",
    dosage: "",
    frequency: "",
    duration_days: "",
    stock: "",
    consumption_rule: "",
    consumption_schedule: [],
  });

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const response = await getMedications();
      setMedications(response.data);
    } catch (err) {
      console.error(err);
      toast.error("Gagal mengambil data obat.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {

    const max = parseInt(formData.frequency);

    if (
      !isNaN(max) &&
      formData.consumption_schedule.length !== max
    ) {
      toast.error(`Pilih tepat ${max} waktu minum obat.`);
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

      setShowModal(false);

      setEditingId(null);

      setFormData({
        med_name: "",
        dosage: "",
        frequency: "",
        duration_days: "",
        stock: "",
        consumption_rule: "",
        consumption_schedule: [],
      });

      fetchMedications();

    } catch (err) {

      console.error(err);

      toast.error("Gagal menyimpan obat.");

    }

  };

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

  if (loading) {
    return <h2>Loading...</h2>;
  }

  const handleEdit = (item) => {
    console.log(item);
    console.log(item.consumption_schedule);
    console.log(typeof item.consumption_schedule);

    setEditingId(item.id);

    setFormData({
  med_name: item.med_name,
  dosage: item.dosage,
  frequency: item.frequency,
  duration_days: item.duration_days,
  stock: item.stock,
  consumption_rule: item.consumption_rule,
  consumption_schedule:
    item.consumption_schedule || [],
});

    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Yakin ingin menghapus obat ini?"
    );

    if (!confirmDelete) return;

    try {
      await deleteMedication(id);

      toast.success("Obat berhasil dihapus.");

      fetchMedications();
    } catch (err) {
      console.error(err);
      toast.error("Gagal menghapus obat.");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          Obat Saya
        </h2>

        <button
          onClick={() => {
            setEditingId(null);

            setFormData({
              med_name: "",
              dosage: "",
              frequency: "",
              duration_days: "",
              stock: "",
              consumption_rule: "",
              consumption_schedule: [],
            });

            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
        >
          + Tambah Obat
        </button>
      </div>

      {medications.length === 0 ? (
        <p className="text-gray-500">
          Belum ada data obat.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="w-full border border-gray-300 bg-white">
              <thead className="bg-blue-50">
                <tr>
                  <th className="border p-3">Nama Obat</th>
                  <th className="border p-3">Dosis</th>
                  <th className="border p-3">Frekuensi</th>
                  <th className="border p-3">Durasi</th>
                  <th className="border p-3">Stok</th>
                  <th className="border p-3">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {medications.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="border p-3">{item.med_name}</td>
                    <td className="border p-3">{item.dosage}</td>
                    <td className="border p-3">{item.frequency}</td>
                    <td className="border p-3">
                      {item.duration_days} Hari
                    </td>
                    <td className="border p-3">{item.stock}</td>

                    <td className="border p-3">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleEdit(item)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(item.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={() => navigate("/routine")}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold"
            >
              ✨ Buat Jadwal dengan AI
            </button>
          </div>
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[550px] p-6">

            <h2 className="text-2xl font-bold mb-6">
              {editingId ? "Edit Obat" : "Tambah Obat"}
            </h2>

            <div className="space-y-4">

              <input
                className="w-full border rounded-lg p-3"
                placeholder="Nama Obat"
                value={formData.med_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    med_name: e.target.value,
                  })
                }
              />

              <select
                className="w-full border rounded-lg p-3"
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    frequency: Number(e.target.value),
                  })
                }
              >
                <option value="">Pilih Frekuensi</option>
                <option value={1}>1x Sehari</option>
                <option value={2}>2x Sehari</option>
                <option value={3}>3x Sehari</option>
              </select>

              <input
                className="w-full border rounded-lg p-3"
                placeholder="Dosis"
                value={formData.dosage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dosage: e.target.value,
                  })
                }
              />

              <input
                type="number"
                className="w-full border rounded-lg p-3"
                placeholder="Durasi (Hari)"
                value={formData.duration_days}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_days: e.target.value,
                  })
                }
              />

              <input
                type="number"
                className="w-full border rounded-lg p-3"
                placeholder="Stok"
                value={formData.stock}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    stock: e.target.value,
                  })
                }
              />

              <div className="border rounded-lg p-4">

                <p className="font-semibold mb-3">
                  Pilih Waktu Minum Obat
                </p>

                <div className="grid grid-cols-2 gap-3">

                  {RULE_OPTIONS.map((rule) => {

                    const checked = formData.consumption_schedule.includes(rule.value);
                    const maxSelected =
                      formData.consumption_schedule.length >= parseInt(formData.frequency);

                    return (

                      <label
                        key={rule.value}
                        className="flex items-center gap-2"
                      >

                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!checked && maxSelected}
                          onChange={(e) => {

                            if (e.target.checked) {

                              setFormData({
                                ...formData,
                                consumption_schedule: [
                                  ...formData.consumption_schedule,
                                  rule.value,
                                ],
                              });

                            } else {

                              setFormData({
                                ...formData,
                                consumption_schedule:
                                  formData.consumption_schedule.filter(
                                    (item) => item !== rule.value
                                  ),
                              });

                            }

                          }}
                        />

                        {rule.label}

                      </label>

                    );

                  })}

                </div>

              </div>

            </div>

            <div className="flex justify-end gap-3 mt-8">

              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg"
              >
                Batal
              </button>

              <button
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
              >
                {editingId ? "Update" : "Simpan"}
              </button>

            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default MedicineContent;