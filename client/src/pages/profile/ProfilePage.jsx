import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { User, Mail, Phone, Camera, ArrowLeft, Save, HeartPulse } from "lucide-react";

const ProfilePage = () => {
    const navigate = useNavigate();

    const [profile, setProfile] = useState({
    nama: "",
    email: "",
    nomor_hp: "",
    foto: "",
});

const [previewFoto, setPreviewFoto] = useState("");

useEffect(() => {
    const loadProfile = () => {
        const savedUser =
            localStorage.getItem("user");

        if (!savedUser) {
            return;
        }

        try {
            const user = JSON.parse(savedUser);

            if (!user?.id) {
                return;
            }

            const profileKey =
                `tbcare_profile_${user.id}`;

            const savedProfile =
                localStorage.getItem(profileKey);

            if (savedProfile) {
                const parsedProfile =
                    JSON.parse(savedProfile);

                setProfile({
                    id: user.id,
                    nama:
                        parsedProfile.nama ||
                        user.nama ||
                        "",
                    email:
                        parsedProfile.email ||
                        user.email ||
                        "",
                    nomor_hp:
                        parsedProfile.nomor_hp ||
                        user.nomor_hp ||
                        "",
                    foto:
                        parsedProfile.foto ||
                        "",
                });

                setPreviewFoto(
                    parsedProfile.foto || ""
                );
            } else {
                setProfile({
                    id: user.id,
                    nama: user.nama || "",
                    email: user.email || "",
                    nomor_hp:
                        user.nomor_hp || "",
                    foto: "",
                });

                setPreviewFoto("");
            }
        } catch (error) {
            console.error(
                "Gagal membaca data profile:",
                error
            );
        }
    };

    loadProfile();

    window.addEventListener(
        "profileUpdated",
        loadProfile
    );

    return () => {
        window.removeEventListener(
            "profileUpdated",
            loadProfile
        );
    };
}, []);

const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => ({
        ...prev,
        [name]: value,
    }));
};

    const handleFotoChange = (e) => {
        const file = e.target.files?.[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("File harus berupa gambar.");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            toast.error("Ukuran foto maksimal 2 MB.");
            return;
        }

        const reader = new FileReader();

        reader.onloadend = () => {
            const result = reader.result;

            setPreviewFoto(result);

            setProfile((prev) => ({
                ...prev,
                foto: result,
            }));
        };

        reader.readAsDataURL(file);
    };

    const handleSave = () => {
    if (!profile.nama.trim()) {
        toast.error("Nama lengkap belum diisi.");
        return;
    }

    if (!profile.email.trim()) {
        toast.error("Email belum diisi.");
        return;
    }

    const savedUser =
        localStorage.getItem("user");

    if (!savedUser) {
        toast.error("Sesi pengguna tidak ditemukan.");
        return;
    }

    try {
        const user = JSON.parse(savedUser);

        if (!user?.id) {
            toast.error("ID pengguna tidak ditemukan.");
            return;
        }

        const profileData = {
            id: user.id,
            nama: profile.nama.trim(),
            email: profile.email.trim(),
            nomor_hp: profile.nomor_hp.trim(),
            foto: profile.foto || "",
        };

        const profileKey =
            `tbcare_profile_${user.id}`;

        localStorage.setItem(
            profileKey,
            JSON.stringify(profileData)
        );

        // Tetap sinkronkan data user
        const updatedUser = {
            ...user,
            nama: profileData.nama,
            email: profileData.email,
            nomor_hp: profileData.nomor_hp,
        };

        localStorage.setItem(
            "user",
            JSON.stringify(updatedUser)
        );

        setProfile(profileData);

        window.dispatchEvent(
            new Event("profileUpdated")
        );

        toast.success(
            "Perubahan profil berhasil disimpan!"
        );

        navigate("/dashboard");
    } catch (error) {
        console.error(
            "Gagal menyimpan profil:",
            error
        );

        toast.error(
            "Gagal menyimpan profil."
        );
    }
};


    const getInitials = () => {
        if (!profile.nama) return "U";

        return profile.nama
            .split(" ")
            .filter(Boolean)
            .map((word) => word[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();
    };

    return (
        <div
            className="min-h-screen bg-[#F4F7FE]"
            style={{
                fontFamily: "'Poppins', sans-serif",
            }}
        >
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');
                `}
            </style>

            <main className="w-full px-6 py-8 md:px-10 lg:px-14">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">

                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <button
                                onClick={() => navigate("/dashboard")}
                                className="
                                    w-10 h-10
                                    rounded-xl
                                    bg-white
                                    flex items-center justify-center
                                    text-gray-600
                                    shadow-[0_4px_14px_rgba(15,23,42,0.07)]
                                    transition-all duration-200
                                    hover:-translate-x-0.5
                                    hover:text-blue-600
                                    hover:shadow-[0_6px_18px_rgba(37,99,235,0.12)]
                                    active:scale-95
                                "
                            >
                                <ArrowLeft
                                    className="w-5 h-5"
                                    strokeWidth={2}
                                />
                            </button>

                            <div>
                                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                                    Profil Saya
                                </h1>

                                <p className="text-sm text-gray-500 mt-1">
                                    Kelola informasi akun TBCare Anda
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2">
                        <div
                            className="
                                w-10 h-10
                                rounded-full
                                bg-gradient-to-br
                                from-blue-700
                                to-blue-500
                                flex items-center justify-center
                                shadow-[0_6px_18px_rgba(37,99,235,0.22)]
                            "
                        >
                            <HeartPulse
                                className="w-5 h-5 text-white"
                                strokeWidth={2.5}
                            />
                        </div>

                        <span className="font-bold text-gray-800">
                            TBCare
                        </span>
                    </div>
                </div>

                <div
                    className="
                        max-w-5xl
                        mx-auto
                        bg-white
                        rounded-3xl
                        shadow-[0_10px_35px_rgba(15,23,42,0.07)]
                        p-6
                        md:p-8
                    "
                >
                    <div
                        className="
                            relative
                            rounded-3xl
                            p-[1px]
                            bg-gradient-to-r
                            from-blue-700
                            via-blue-500
                            to-cyan-400
                            shadow-[0_8px_25px_rgba(37,99,235,0.08)]
                            mb-8
                        "
                    >
                        <div
                            className="
                                bg-white
                                rounded-[23px]
                                p-5
                                md:p-6
                            "
                        >
                            <div className="flex items-start gap-4">
                                <div
                                    className="
                                        w-12 h-12
                                        shrink-0
                                        rounded-2xl
                                        bg-gradient-to-br
                                        from-blue-700
                                        to-blue-500
                                        flex items-center justify-center
                                        shadow-[0_6px_18px_rgba(37,99,235,0.18)]
                                    "
                                >
                                    <HeartPulse
                                        className="w-6 h-6 text-white"
                                        strokeWidth={2.3}
                                    />
                                </div>

                                <div>
                                    <h2 className="text-lg md:text-xl font-bold text-gray-900">
                                        Akun TBCare Anda
                                    </h2>

                                    <p className="text-sm text-gray-500 leading-6 mt-1">
                                        Profil Anda digunakan untuk personalisasi
                                        layanan dan pemantauan terapi.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-8">
                        <div className="flex flex-col items-center">
                            <div className="relative">
                                {previewFoto ? (
                                    <img
                                        src={previewFoto}
                                        alt="Foto profil"
                                        className="
                                            w-40 h-40
                                            rounded-full
                                            object-cover
                                            shadow-[0_10px_30px_rgba(15,23,42,0.12)]
                                            ring-4 ring-white
                                        "
                                    />
                                ) : (
                                    <div
                                        className="
                                            w-40 h-40
                                            rounded-full
                                            bg-gradient-to-br
                                            from-slate-100
                                            to-slate-200
                                            flex items-center justify-center
                                            text-4xl
                                            font-bold
                                            text-gray-500
                                            shadow-[0_10px_30px_rgba(15,23,42,0.10)]
                                            ring-4 ring-white
                                        "
                                    >
                                        {getInitials()}
                                    </div>
                                )}

                                <label
                                    htmlFor="profile-photo"
                                    className="
                                        absolute
                                        bottom-1
                                        right-1
                                        w-11 h-11
                                        rounded-full
                                        bg-white
                                        flex items-center justify-center
                                        cursor-pointer
                                        shadow-[0_5px_18px_rgba(15,23,42,0.15)]
                                        text-blue-600
                                        transition-all duration-200
                                        hover:scale-105
                                        hover:text-blue-700
                                    "
                                >
                                    <Camera
                                        className="w-5 h-5"
                                        strokeWidth={2}
                                    />
                                </label>

                                <input
                                    id="profile-photo"
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFotoChange}
                                    className="hidden"
                                />
                            </div>

                            <p className="text-sm font-semibold text-gray-800 mt-5">
                                Foto Profil
                            </p>

                            <p className="text-xs text-gray-400 text-center mt-1 mb-4">
                                JPG, PNG maksimal 2 MB
                            </p>

                            <label
                                htmlFor="profile-photo"
                                className="
                                    cursor-pointer
                                    px-6 py-3
                                    rounded-xl
                                    bg-gradient-to-r
                                    from-blue-700
                                    via-blue-600
                                    to-blue-500
                                    text-white
                                    font-semibold
                                    text-sm
                                    shadow-[0_6px_18px_rgba(37,99,235,0.25)]
                                    transition-all duration-200
                                    hover:-translate-y-0.5
                                    hover:shadow-[0_8px_22px_rgba(37,99,235,0.32)]
                                    active:translate-y-0
                                    active:scale-[0.98]
                                "
                            >
                                Edit Foto
                            </label>
                        </div>

                        {/* FORM */}
                        <div className="space-y-5">

                            {/* NAMA */}
                            <div>
                                <label
                                    htmlFor="nama"
                                    className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2"
                                >
                                    <User className="w-4 h-4 text-blue-600" />
                                    Nama Lengkap
                                </label>

                                <input
                                    id="nama"
                                    name="nama"
                                    type="text"
                                    value={profile.nama}
                                    onChange={handleChange}
                                    placeholder="Masukkan nama lengkap"
                                    className="
                                        w-full
                                        bg-white
                                        px-4 py-3.5
                                        rounded-xl
                                        text-sm
                                        text-gray-800
                                        placeholder:text-gray-400
                                        outline-none
                                        ring-1 ring-gray-200
                                        shadow-[0_3px_12px_rgba(15,23,42,0.04)]
                                        transition-all duration-200
                                        focus:ring-2
                                        focus:ring-blue-400
                                        focus:shadow-[0_5px_18px_rgba(37,99,235,0.10)]
                                    "
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2"
                                >
                                    <Mail className="w-4 h-4 text-blue-600" />
                                    Email
                                </label>

                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={profile.email}
                                    onChange={handleChange}
                                    placeholder="Masukkan email"
                                    className="
                                        w-full
                                        bg-white
                                        px-4 py-3.5
                                        rounded-xl
                                        text-sm
                                        text-gray-800
                                        placeholder:text-gray-400
                                        outline-none
                                        ring-1 ring-gray-200
                                        shadow-[0_3px_12px_rgba(15,23,42,0.04)]
                                        transition-all duration-200
                                        focus:ring-2
                                        focus:ring-blue-400
                                        focus:shadow-[0_5px_18px_rgba(37,99,235,0.10)]
                                    "
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="nomor_hp"
                                    className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2"
                                >
                                    <Phone className="w-4 h-4 text-blue-600" />
                                    WhatsApp
                                </label>

                                <input
                                    id="nomor_hp"
                                    name="nomor_hp"
                                    type="tel"
                                    value={profile.nomor_hp}
                                    onChange={handleChange}
                                    placeholder="Contoh: 08123456789"
                                    className="
                                        w-full
                                        bg-white
                                        px-4 py-3.5
                                        rounded-xl
                                        text-sm
                                        text-gray-800
                                        placeholder:text-gray-400
                                        outline-none
                                        ring-1 ring-gray-200
                                        shadow-[0_3px_12px_rgba(15,23,42,0.04)]
                                        transition-all duration-200
                                        focus:ring-2
                                        focus:ring-blue-400
                                        focus:shadow-[0_5px_18px_rgba(37,99,235,0.10)]
                                    "
                                />
                            </div>

                            <div className="pt-3">
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="
                                        w-full
                                        flex items-center justify-center gap-2
                                        py-3.5
                                        rounded-xl
                                        bg-gradient-to-r
                                        from-cyan-500
                                        via-blue-500
                                        to-blue-600
                                        text-white
                                        font-bold
                                        text-sm
                                        shadow-[0_7px_20px_rgba(37,99,235,0.22)]
                                        transition-all duration-200
                                        hover:-translate-y-0.5
                                        hover:shadow-[0_10px_25px_rgba(37,99,235,0.28)]
                                        active:translate-y-0
                                        active:scale-[0.99]
                                    "
                                >
                                    <Save
                                        className="w-5 h-5"
                                        strokeWidth={2}
                                    />

                                    Simpan Perubahan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className="
                        max-w-5xl
                        mx-auto
                        mt-6
                        bg-white
                        rounded-3xl
                        p-6
                        shadow-[0_8px_25px_rgba(15,23,42,0.06)]
                    "
                >
                    <div className="flex items-start gap-4">
                        <div
                            className="
                                w-10 h-10
                                rounded-xl
                                bg-blue-50
                                flex items-center justify-center
                                shrink-0
                            "
                        >
                            <HeartPulse
                                className="w-5 h-5 text-blue-600"
                                strokeWidth={2}
                            />
                        </div>

                        <div>
                            <h3 className="font-bold text-gray-900">
                                Data profil Anda aman
                            </h3>

                            <p className="text-sm text-gray-500 mt-1 leading-6">
                                Informasi yang Anda masukkan digunakan untuk
                                membantu personalisasi layanan TBCare dan
                                pemantauan terapi.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;