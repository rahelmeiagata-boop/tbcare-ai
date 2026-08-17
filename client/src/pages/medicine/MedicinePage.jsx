import { useEffect, useState } from "react";
import { getMedications } from "../../services/medicationService";

const MedicinePage = () => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const response = await getMedications();
      setMedications(response.data);
    } catch (err) {
      console.error(err);
      alert("Gagal mengambil data obat");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <h2>Loading...</h2>;
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Obat Saya</h1>

      {medications.length === 0 ? (
        <p>Belum ada obat.</p>
      ) : (
        <table border="1" cellPadding="10">
          <thead>
            <tr>
              <th>Nama Obat</th>
              <th>Dosis</th>
              <th>Stok</th>
            </tr>
          </thead>

          <tbody>
            {medications.map((item) => (
              <tr key={item.id}>
                <td>{item.med_name}</td>
                <td>{item.dosage}</td>
                <td>{item.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MedicinePage;