import { useState } from "react";

function PrescriptionScanPage() {
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [scanned, setScanned] = useState(false);

    const handleImageChange = (event) => {
        const file = event.target.files[0];

        if (!file) return;

        setImage(file);
        setPreview(URL.createObjectURL(file));
        setScanned(false);
    };

    const handleScan = () => {
        if (!image) {
            alert("Silakan upload foto resep terlebih dahulu.");
            return;
        }

        setScanned(true);
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                background: "#f5f9ff",
                padding: "40px 20px",
                fontFamily: "Arial, sans-serif",
            }}
        >
            <div
                style={{
                    maxWidth: "900px",
                    margin: "0 auto",
                }}
            >
                <div style={{ marginBottom: "30px" }}>
                    <h1
                        style={{
                            margin: 0,
                            color: "#123c78",
                            fontSize: "32px",
                        }}
                    >
                        Scan Resep
                    </h1>

                    <p
                        style={{
                            color: "#667085",
                            fontSize: "16px",
                            marginTop: "8px",
                        }}
                    >
                        Upload foto resep untuk membantu mengenali informasi
                        obat Anda.
                    </p>
                </div>

                <div
                    style={{
                        background: "#ffffff",
                        borderRadius: "20px",
                        padding: "30px",
                        boxShadow: "0 8px 25px rgba(0, 0, 0, 0.08)",
                    }}
                >
                    <div
                        style={{
                            border: "2px dashed #b8c7dc",
                            borderRadius: "16px",
                            padding: "35px 20px",
                            textAlign: "center",
                            background: "#f9fbff",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "48px",
                                marginBottom: "15px",
                            }}
                        >
                            📄
                        </div>

                        <h2
                            style={{
                                margin: "0 0 8px",
                                color: "#1d2939",
                            }}
                        >
                            Upload Foto Resep
                        </h2>

                        <p
                            style={{
                                color: "#667085",
                                marginBottom: "20px",
                            }}
                        >
                            Pilih foto resep dari perangkat Anda.
                        </p>

                        <label
                            style={{
                                display: "inline-block",
                                background: "#155eef",
                                color: "#ffffff",
                                padding: "12px 24px",
                                borderRadius: "10px",
                                cursor: "pointer",
                                fontWeight: "600",
                            }}
                        >
                            Pilih Foto
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: "none" }}
                            />
                        </label>
                    </div>

                    {preview && (
                        <div style={{ marginTop: "30px" }}>
                            <h3 style={{ color: "#1d2939" }}>
                                Preview Resep
                            </h3>

                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "center",
                                    background: "#f8fafc",
                                    borderRadius: "14px",
                                    padding: "20px",
                                }}
                            >
                                <img
                                    src={preview}
                                    alt="Preview resep"
                                    style={{
                                        maxWidth: "100%",
                                        maxHeight: "400px",
                                        objectFit: "contain",
                                        borderRadius: "10px",
                                    }}
                                />
                            </div>

                            <button
                                onClick={handleScan}
                                style={{
                                    width: "100%",
                                    marginTop: "20px",
                                    padding: "14px",
                                    border: "none",
                                    borderRadius: "10px",
                                    background: "#12b76a",
                                    color: "#ffffff",
                                    fontSize: "16px",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                }}
                            >
                                🔍 Scan Resep
                            </button>
                        </div>
                    )}

                    {scanned && (
                        <div
                            style={{
                                marginTop: "30px",
                                padding: "24px",
                                borderRadius: "16px",
                                background: "#f0fdf4",
                                border: "1px solid #a6f4c5",
                            }}
                        >
                            <h2
                                style={{
                                    marginTop: 0,
                                    color: "#027a48",
                                }}
                            >
                                Hasil Scan
                            </h2>

                            <p
                                style={{
                                    color: "#475467",
                                    fontSize: "14px",
                                }}
                            >
                                Hasil berikut merupakan simulasi fitur OCR
                                tahap pengembangan.
                            </p>

                            <div
                                style={{
                                    display: "grid",
                                    gap: "12px",
                                    marginTop: "20px",
                                }}
                            >
                                <div
                                    style={{
                                        background: "#ffffff",
                                        padding: "16px",
                                        borderRadius: "10px",
                                    }}
                                >
                                    <strong>Nama Obat</strong>
                                    <p
                                        style={{
                                            margin: "6px 0 0",
                                            color: "#344054",
                                        }}
                                    >
                                        Rifampicin
                                    </p>
                                </div>

                                <div
                                    style={{
                                        background: "#ffffff",
                                        padding: "16px",
                                        borderRadius: "10px",
                                    }}
                                >
                                    <strong>Dosis</strong>
                                    <p
                                        style={{
                                            margin: "6px 0 0",
                                            color: "#344054",
                                        }}
                                    >
                                        450 mg
                                    </p>
                                </div>

                                <div
                                    style={{
                                        background: "#ffffff",
                                        padding: "16px",
                                        borderRadius: "10px",
                                    }}
                                >
                                    <strong>Confidence Score</strong>
                                    <p
                                        style={{
                                            margin: "6px 0 0",
                                            color: "#344054",
                                        }}
                                    >
                                        92%
                                    </p>
                                </div>
                            </div>

                            <button
                                style={{
                                    width: "100%",
                                    marginTop: "20px",
                                    padding: "13px",
                                    border: "none",
                                    borderRadius: "10px",
                                    background: "#155eef",
                                    color: "#ffffff",
                                    fontWeight: "700",
                                    cursor: "pointer",
                                }}
                            >
                                Gunakan Hasil
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PrescriptionScanPage;