import { useState } from "react";

const RoutinePage = () => {
  const [routine, setRoutine] = useState({
    wake_up: "06:00",
    breakfast: "07:00",
    lunch: "12:30",
    dinner: "19:00",
    sleep: "22:00",
  });

  const handleChange = (e) => {
    setRoutine({
      ...routine,
      [e.target.name]: e.target.value,
    });
  };

  const handleNext = () => {
    console.log(routine);

    // Nanti kita arahkan ke Recommendation Page
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
            name="wake_up"
            value={routine.wake_up}
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
            name="breakfast"
            value={routine.breakfast}
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
            name="lunch"
            value={routine.lunch}
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
            name="dinner"
            value={routine.dinner}
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
            name="sleep"
            value={routine.sleep}
            onChange={handleChange}
            className="w-full border rounded-lg p-3 mt-2"
          />
        </div>

      </div>

      <button
        onClick={handleNext}
        className="mt-8 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
      >
        Lanjutkan
      </button>

    </div>
  );
};

export default RoutinePage;