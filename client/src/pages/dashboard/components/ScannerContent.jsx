import { useEffect, useRef, useState } from "react";
import { Camera, Upload, ScanLine, FileText, RotateCcw, X, CheckCircle2, Image as ImageIcon } from "lucide-react";

const ScannerContent = () => {
    const [mode, setMode] = useState("upload");
    const [image, setImage] = useState(null);
    const [scanned, setScanned] = useState(false);
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const objectUrlRef = useRef(null);
    const handleImageChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
        }

        const imageUrl = URL.createObjectURL(file);
        objectUrlRef.current = imageUrl;
        setImage(imageUrl);
        setScanned(false);
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
            setScanned(false);
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
        setScanned(false);
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
        setScanned(false);
    };

    const resetImage = () => {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current);
            objectUrlRef.current = null;
        }

        setImage(null);
        setScanned(false);
    };

    const handleScan = () => {
        if (!image) return;

        setScanned(true);
    };

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
                        disabled={!image}
                        className={`
                            w-full
                            mt-4
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
                        <ScanLine className="w-5 h-5" />

                        Scan Resep
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

                    {!scanned ? (
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
                    ) : (
                        <div className="mt-6 space-y-4 animate-[fadeIn_0.4s_ease-out]">
                            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0">
                                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Status
                                        </p>

                                        <p className="font-semibold text-blue-700 mt-0.5">
                                            Preview hasil scan
                                        </p>

                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                            Integrasi OCR sedang dalam tahap
                                            pengembangan.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-gray-100 rounded-2xl p-5 hover:bg-gray-50/70 transition-colors duration-200">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                    Obat terdeteksi
                                </p>

                                <p className="font-semibold text-gray-800 mt-1">
                                    Rifampicin
                                </p>
                            </div>

                            {/* DOSIS */}
                            <div className="border border-gray-100 rounded-2xl p-5 hover:bg-gray-50/70 transition-colors duration-200">
                                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                    Dosis
                                </p>

                                <p className="font-semibold text-gray-800 mt-1">
                                    Sesuai resep dokter
                                </p>
                            </div>

                            <div className="border border-gray-100 rounded-2xl p-5 hover:bg-gray-50/70 transition-colors duration-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                                            Confidence
                                        </p>

                                        <p className="font-semibold text-green-600 mt-1">
                                            92%
                                        </p>
                                    </div>

                                    <div className="w-12 h-12 rounded-full border-4 border-green-100 flex items-center justify-center">
                                        <span className="text-xs font-bold text-green-600">
                                            92
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="
                                    w-full
                                    flex
                                    items-center
                                    justify-center
                                    gap-2
                                    py-3.5
                                    rounded-2xl
                                    bg-gradient-to-r
                                    from-teal-600
                                    to-cyan-500
                                    hover:from-teal-700
                                    hover:to-cyan-600
                                    text-white
                                    font-semibold
                                    shadow-md
                                    shadow-teal-500/20
                                    hover:shadow-lg
                                    hover:shadow-teal-500/25
                                    hover:-translate-y-0.5
                                    transition-all
                                    duration-300
                                "
                            >
                                <CheckCircle2 className="w-5 h-5" />

                                Gunakan Hasil Scan
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScannerContent;