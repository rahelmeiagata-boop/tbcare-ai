import { Navigate, useNavigate } from "react-router-dom";

import ScannerContent from "../dashboard/components/ScannerContent";

// Halaman mandiri /scan-resep. Memakai komponen scanner yang sama dengan tab
// "Scanning Resep AI" di dashboard, sehingga hanya ada satu implementasi.
function PrescriptionScanPage() {
    const navigate = useNavigate();

    // Scan resep memanggil API yang butuh login.
    if (!localStorage.getItem("token")) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="min-h-screen bg-[#f5f9ff] px-4 py-8 sm:px-6">
            <div className="mx-auto max-w-6xl">
                <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="mb-4 text-sm font-semibold text-teal-700 hover:underline"
                >
                    &larr; Kembali ke Dashboard
                </button>

                <h1
                    className="text-2xl font-bold text-[#123c78] sm:text-3xl"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                    Scan Resep
                </h1>

                <p
                    className="mb-6 mt-1 text-gray-500"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                    Foto resep dokter untuk menambahkan obat ke data pengobatan Anda.
                </p>

                <ScannerContent onSaved={() => navigate("/dashboard")} />
            </div>
        </div>
    );
}

export default PrescriptionScanPage;
