import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { saveRoutine } from "../../services/routineService";

const RoutinePage = () => {
  const navigate = useNavigate();

  const [routine, setRoutine] = useState({
    wake_time: "06:00",
    breakfast_time: "07:00",
    lunch_time: "12:30",
    dinner_time: "19:00",
    sleep_time: "22:00",
  });

  const handleChange = (e) => {
    setRoutine({
      ...routine,
      [e.target.name]: e.target.value,
    });
  };

  const handleNext = async () => {
  try {
    console.log("DATA YANG DIKIRIM:", routine);

    const response = await saveRoutine(routine);

    console.log(response);

    toast.success("Rutinitas berhasil disimpan.");
    navigate("/recommendation");
  } catch (err) {
    console.log("FULL ERROR:", err);
    console.log("RESPONSE:", err.response);
    console.log("DATA:", err.response?.data);

    toast.error("Gagal menyimpan rutinitas.");
  }
};

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8">
      <h1 className="text-3xl font-bold text-blue-700 mb-2">
        🤖 AI Scheduler
      </h1>

      <p className="text-gray-500 mb-8">
        AI akan menggunakan rutinitas harian Anda
        untuk membuat rekomendasi jadwal minum obat.
      </p>

      <div className="space-y-5">

        <div>
          <label className="font-medium">
            Jam Bangun
          </label>

          <input
            type="time"
            name="wake_time"
            value={routine.wake_time}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 mt-2"
          />
        </div>

        <div>
          <label className="font-medium">
            Jam Sarapan
          </label>

          <input
            type="time"
            name="breakfast_time"
            value={routine.breakfast_time}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 mt-2"
          />
        </div>

        <div>
          <label className="font-medium">
            Jam Makan Siang
          </label>

          <input
            type="time"
            name="lunch_time"
            value={routine.lunch_time}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 mt-2"
          />
        </div>

        <div>
          <label className="font-medium">
            Jam Makan Malam
          </label>

          <input
            type="time"
            name="dinner_time"
            value={routine.dinner_time}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 mt-2"
          />
        </div>

        <div>
          <label className="font-medium">
            Jam Tidur
          </label>

          <input
            type="time"
            name="sleep_time"
            value={routine.sleep_time}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 mt-2"
          />
        </div>

      </div>

      <button
        onClick={handleNext}
        className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
      >
        ✨ Lihat Rekomendasi AI
      </button>
    </div>
  );
};

export default RoutinePage;