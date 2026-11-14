import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Camera, Upload, ScanLine, FileText, RotateCcw, X, Image as ImageIcon, Loader2, AlertTriangle } from "lucide-react";

import ScanResult from "./ScanResult";
import { confirmScan, getScannerStatus, scanPrescription } from "../../../services/scannerService";
import { resizeImageToBlob } from "../../../utils/imageUtils";

// Pesan galat yang ramah untuk pengguna.
const readApiError = (err, fallback) => {
    if (err.code === "ECONNABORTED") return "Pemindaian memakan waktu terlalu lama. Silakan coba lagi.";
    if (err.response?.status === 413) return "Ukuran gambar terlalu besar. Coba foto dengan resolusi lebih rendah.";
    if (!err.response && err.message === "Network Error") {
        return "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
    }
    return err.response?.data?.message || err.message || fallback;
};

// onSaved dipanggil setelah obat berhasil disimpan (mis. untuk pindah ke tab Obat Saya).
const ScannerContent = ({ onSaved }) => {
    const [mode, setMode] = useState("upload");
    const [image, setImage] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [saving, setSaving] = useState(false);
    const [result, setResult] = useState(null);
    const [resultKey, setResultKey] = useState(0);
    const [scanError, setScanError] = useState(null);
    const [serviceAvailable, setServiceAvailable] = useState(true);
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const objectUrlRef = useRef(null);

    const clearScan = () => {
        setResult(null);
        setScanError(null);
    };

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
        }

        const imageUrl = URL.createObjectURL(file);
        objectUrlRef.current = imageUrl;
        setImage(imageUrl);
        clearScan();
    };

    const startCamera = async () => {
        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                alert("Browser Anda tidak mendukung akses kamera.");
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: "environment",
                },
                audio: false,
            });

            streamRef.current = stream;
            setCameraActive(true);
            setImage(null);
            clearScan();
        } catch (error) {
            console.error("Camera error:", error);

            alert(
                "Kamera tidak dapat diakses. Pastikan browser sudah diberi izin menggunakan kamera."
            );
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => {
                track.stop();
            });

            streamRef.current = null;
        }

        setCameraActive(false);
    };

    const capturePhoto = () => {
        const video = videoRef.current;
        if (!video) return;
        if (!video.videoWidth || !video.videoHeight) {
            return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext("2d");
        if (!context) return;
        context.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );

        const photo = canvas.toDataURL("image/jpeg", 0.9);
        setImage(photo);
        clearScan();
        stopCamera();
    };

    const handleModeChange = (newMode) => {
        if (newMode === mode) return;
        stopCamera();
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }
        setMode(newMode);
        setImage(null);
        clearScan();
    };

    const resetImage = () => {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }

        setImage(null);
        clearScan();
    };

    const handleScan = async () => {
        if (!image || scanning) return;

        setScanning(true);
        clearScan();

        try {
            // Foto diperkecil di browser dulu agar upload cepat dan muat di batas server.
            const blob = await resizeImageToBlob(image);
            const response = await scanPrescription(blob);

            setResult(response.data);
            setResultKey((key) => key + 1);
        } catch (err) {
            console.error("Scan resep gagal:", err);
            setScanError(readApiError(err, "Resep gagal dipindai. Silakan coba lagi."));
        } finally {
            setScanning(false);
        }
    };

    const handleSave = async (medications) => {
        if (saving) return;

        setSaving(true);

        try {
            const response = await confirmScan({
                scanId: result?.scan_id ?? null,
                medications,
            });

            const failed = response?.data?.failed?.length ?? 0;
            toast.success(response.message || "Obat berhasil disimpan.");
            if (failed > 0) {
                toast.error(`${failed} obat gagal disimpan. Tambahkan manual di menu Obat Saya.`);
            }

            resetImage();
            onSaved?.();
        } catch (err) {
            toast.error(readApiError(err, "Obat gagal disimpan. Silakan coba lagi."));
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        let active = true;

        getScannerStatus()
            .then((response) => {
                if (active) setServiceAvailable(response?.data?.available !== false);
            })
            .catch(() => {
                // Gagal cek status (mis. token kedaluwarsa) bukan berarti layanan mati.
            });

        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        if (
            cameraActive &&
            videoRef.current &&
            streamRef.current
        ) {
            videoRef.current.srcObject = streamRef.current;

            videoRef.current.play().catch((error) => {
                console.error("Video play error:", error);
            });
        }
    }, [cameraActive]);

    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current
                    .getTracks()
                    .forEach((track) => track.stop());

                streamRef.current = null;
            }
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
            }
        };
    }, []);

    return (
        <div
            className="space-y-6"
            style={{
                fontFamily: "'Poppins', sans-serif",
            }}
        >
            {!serviceAvailable && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800">Layanan scan sedang tidak tersedia</p>
                        <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                            Anda masih bisa mencoba, tetapi pemindaian kemungkinan gagal. Coba lagi nanti atau
                            tambahkan obat secara manual di menu Obat Saya.
                        </p>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-3xl p-2 shadow-sm border border-gray-100 flex gap-2 transition-all duration-300">
                <button
                    onClick={() => handleModeChange("upload")}
                    className={`
                        flex-1
                        flex
                        items-center
                        justify-center
                        gap-2
                        py-3.5
                        rounded-2xl
                        font-semibold
                        text-sm
                        transition-all
                        duration-300
                        ease-out
                        ${
                            mode === "upload"
                                ? "bg-gradient-to-r from-teal-600 to-teal-400 text-white shadow-md shadow-teal-500/20 scale-[1.01]"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                        }
                    `}
                >
                    <Upload className="w-5 h-5" />

                    <span>
                        Upload Foto
                    </span>
                </button>

                {/* CAMERA */}
                <button
                    onClick={() => handleModeChange("camera")}
                    className={`
                        flex-1
                        flex
                        items-center
                        justify-center
                        gap-2
                        py-3.5
                        rounded-2xl
                        font-semibold
                        text-sm
                        transition-all
                        duration-300
                        ease-out
                        ${
                            mode === "camera"
                                ? "bg-gradient-to-r from-teal-600 to-teal-400 text-white shadow-md shadow-teal-500/20 scale-[1.01]"
                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                        }
                    `}
                >
                    <Camera className="w-5 h-5" />

                    <span>
                        Kamera
                    </span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                {mode === "upload"
                                    ? "Upload Foto Resep"
                                    : "Ambil Foto Resep"}
                            </h2>

                            <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                                {mode === "upload"
                                    ? "Pilih foto resep dokter dari perangkat Anda."
                                    : "Gunakan kamera untuk mengambil foto resep secara langsung."}
                            </p>
                        </div>

                        <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                            {mode === "upload" ? (
                                <ImageIcon className="w-5 h-5 text-blue-600" />
                            ) : (
                                <Camera className="w-5 h-5 text-blue-600" />
                            )}
                        </div>
                    </div>
                    
                    {mode === "upload" ? (
                        <>
                            <label
                                htmlFor="prescription-upload"
                                className={`
                                    mt-6
                                    flex
                                    flex-col
                                    items-center
                                    justify-center
                                    rounded-2xl
                                    h-72
                                    cursor-pointer
                                    overflow-hidden
                                    transition-all
                                    duration-300
                                    ${
                                        image
                                            ? "border border-gray-200 bg-gray-50"
                                            : "border-2 border-dashed border-blue-200 bg-blue-50/30 hover:bg-blue-50 hover:border-blue-300"
                                    }
                                `}
                            >
                                {image ? (
                                    <div className="relative w-full h-full flex items-center justify-center p-4">
                                        <img
                                            src={image}
                                            alt="Preview resep"
                                            className="max-h-full max-w-full object-contain rounded-xl transition-transform duration-300 hover:scale-[1.01]"
                                        />

                                        <div className="absolute top-3 right-3">
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    resetImage();
                                                }}
                                                className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm shadow-md flex items-center justify-center text-gray-600 hover:text-red-500 hover:scale-105 transition-all duration-200"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                                            <Upload className="w-7 h-7 text-blue-600" />
                                        </div>
                                        <p className="font-semibold text-gray-700">
                                            Klik untuk upload resep
                                        </p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            JPG, PNG, atau JPEG
                                        </p>
                                    </>
                                )}
                            </label>

                            <input
                                id="prescription-upload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="hidden"
                            />
                        </>
                    ) : (
                        <>
                            <div className="mt-6 border border-gray-200 rounded-2xl overflow-hidden h-72 bg-slate-50 flex items-center justify-center relative">
                                {cameraActive ? (
                                    <>
                                        <video
                                            ref={videoRef}
                                            autoPlay
                                            playsInline
                                            muted
                                            className="w-full h-full object-cover"
                                        />

                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute inset-8 border-2 border-white/70 rounded-2xl" />
                                        </div>

                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                                            <div className="px-4 py-2 rounded-full bg-black/45 backdrop-blur-sm text-white text-xs font-medium">
                                                Posisikan resep di dalam area
                                            </div>
                                        </div>
                                    </>
                                ) : image ? (
                                    <div className="relative w-full h-full flex items-center justify-center p-4">
                                        <img
                                            src={image}
                                            alt="Foto resep"
                                            className="max-h-full max-w-full object-contain rounded-xl"
                                        />

                                        <div className="absolute top-3 right-3">
                                            <button
                                                type="button"
                                                onClick={resetImage}
                                                className="w-9 h-9 rounded-full bg-white/95 shadow-md flex items-center justify-center text-gray-600 hover:text-red-500 hover:scale-105 transition-all duration-200"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center px-6">
                                        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                                            <Camera className="w-7 h-7 text-blue-600" />
                                        </div>

                                        <p className="font-semibold text-gray-600">
                                            Kamera belum aktif
                                        </p>

                                        <p className="text-sm text-gray-400 mt-1">
                                            Tekan tombol di bawah untuk membuka kamera.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-3 mt-4">
                                {!cameraActive && !image && (
                                    <button
                                        onClick={startCamera}
                                        className="
                                            w-full
                                            flex
                                            items-center
                                            justify-center
                                            gap-2
                                            py-3.5
                                            rounded-2xl
                                            bg-gradient-to-r
                                            from-blue-700
                                            via-blue-600
                                            to-cyan-500
                                            text-white
                                            font-semibold
                                            shadow-md
                                            shadow-blue-500/20
                                            hover:shadow-lg
                                            hover:shadow-blue-500/25
                                            hover:-translate-y-0.5
                                            active:translate-y-0
                                            transition-all
                                            duration-300
                                        "
                                    >
                                        <Camera className="w-5 h-5" />

                                        Buka Kamera
                                    </button>
                                )}

                                {cameraActive && (
                                    <>
                                        <button
                                            onClick={capturePhoto}
                                            className="
                                                flex-1
                                                flex
                                                items-center
                                                justify-center
                                                gap-2
                                                py-3.5
                                                rounded-2xl
                                                bg-gradient-to-r
                                                from-blue-700
                                                via-blue-600
                                                to-cyan-500
                                                text-white
                                                font-semibold
                                                shadow-md
                                                shadow-blue-500/20
                                                hover:shadow-lg
                                                hover:shadow-blue-500/25
                                                hover:-translate-y-0.5
                                                active:translate-y-0
                                                transition-all
                                                duration-300
                                            "
                                        >
                                            <Camera className="w-5 h-5" />

                                            Ambil Foto
                                        </button>

                                        <button
                                            onClick={stopCamera}
                                            className="
                                                px-5
                                                py-3.5
                                                rounded-2xl
                                                bg-gray-100
                                                hover:bg-gray-200
                                                text-gray-600
                                                font-semibold
                                                transition-all
                                                duration-300
                                            "
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </>
                                )}

                                {!cameraActive && image && (
                                    <button
                                        onClick={() => {
                                            resetImage();
                                            startCamera();
                                        }}
                                        className="
                                            w-full
                                            flex
                                            items-center
                                            justify-center
                                            gap-2
                                            py-3.5
                                            rounded-2xl
                                            bg-gradient-to-r
                                            from-blue-700
                                            via-blue-600
                                            to-cyan-500
                                            text-white
                                            font-semibold
                                            shadow-md
                                            shadow-blue-500/20
                                            hover:shadow-lg
                                            hover:shadow-blue-500/25
                                            hover:-translate-y-0.5
                                            transition-all
                                            duration-300
                                        "
                                    >
                                        <RotateCcw className="w-5 h-5" />

                                        Ambil Ulang
                                    </button>
                                )}
                            </div>
                        </>
                    )}

                    <button
                        onClick={handleScan}
                        disabled={!image || scanning}
                        className={`
                            w-full
                            mt-4
                            ${scanning ? "opacity-70 cursor-wait" : ""}
                            flex
                            items-center
                            justify-center
                            gap-2
                            py-3.5
                            rounded-2xl
                            font-semibold
                            transition-all
                            duration-300
                            ${
                                image
                                    ? `
                                        bg-gradient-to-r
                                        from-blue-700
                                        via-blue-600
                                        to-cyan-500
                                        text-white
                                        shadow-md
                                        shadow-blue-500/20
                                        hover:shadow-lg
                                        hover:shadow-blue-500/25
                                        hover:-translate-y-0.5
                                        active:translate-y-0
                                    `
                                    : `
                                        bg-gray-100
                                        text-gray-400
                                        cursor-not-allowed
                                    `
                            }
                        `}
                    >
                        {scanning ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <ScanLine className="w-5 h-5" />
                        )}

                        {scanning ? "Memproses..." : "Scan Resep"}
                    </button>
                </div>

                <div className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-md">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Hasil Scan
                            </h2>

                            <p className="text-sm text-gray-500 mt-1.5">
                                Informasi resep yang berhasil dipindai.
                            </p>
                        </div>

                        <div className="w-11 h-11 rounded-2xl bg-teal-50 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-teal-600" />
                        </div>
                    </div>

                    {scanning ? (
                        <div className="h-72 flex flex-col items-center justify-center text-center">
                            <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />

                            <p className="font-medium text-gray-600 mt-4">
                                Memproses gambar dan membaca teks resep...
                            </p>

                            <p className="text-sm text-gray-400 mt-1 max-w-xs">
                                Biasanya 2-10 detik. Jika layanan baru aktif, bisa sedikit lebih lama.
                            </p>
                        </div>
                    ) : scanError ? (
                        <div className="mt-6 p-5 rounded-2xl bg-red-50 border border-red-100">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />

                                <div>
                                    <p className="font-semibold text-red-700">
                                        Resep belum dapat dipindai
                                    </p>

                                    <p className="text-sm text-red-600/90 mt-1 leading-relaxed">
                                        {scanError}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={handleScan}
                                        className="mt-3 text-sm font-semibold text-red-700 underline underline-offset-2 hover:text-red-800"
                                    >
                                        Coba lagi
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : result ? (
                        <ScanResult
                            key={resultKey}
                            result={result}
                            saving={saving}
                            onSave={handleSave}
                        />
                    ) : (
                        <div className="h-72 flex flex-col items-center justify-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                                <FileText className="w-7 h-7 text-gray-300" />
                            </div>

                            <p className="font-medium text-gray-500">
                                Hasil scan resep akan tampil di sini.
                            </p>

                            <p className="text-sm text-gray-400 mt-1 max-w-xs">
                                Upload atau ambil foto resep terlebih dahulu,
                                kemudian tekan tombol Scan Resep.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScannerContent;