import { useState } from "react";
const ChatContent = () => {
    const [messages, setMessages] = useState([
        {
            sender: "ai",
            text: "Halo! Saya AI Chat Doctor TBCare. Saya siap membantu menjawab pertanyaan seputar terapi dan kepatuhan minum obat.",
        },
    ]);
    const [input, setInput] = useState("");
    const quickQuestions = [
        "Apa yang harus dilakukan jika lupa minum obat?",
        "Bagaimana cara menjaga kepatuhan minum obat?",
        "Apa fungsi obat TB?",
    ];
    const sendMessage = (text = input) => {
        if (!text.trim()) return;
        setMessages((prev) => [
            ...prev,
            {
                sender: "user",
                text: text,
            },
            {
                sender: "ai",
                text: "Terima kasih atas pertanyaannya. Fitur AI Chat Doctor sedang dalam tahap pengembangan.",
            },
        ]);

        setInput("");
    };

    return (
        <div className="w-full">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-xl">
                            🤖
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900">
                                AI Chat Doctor
                            </h3>
                            <p className="text-sm text-green-500 flex items-center gap-1 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Aktif
                            </p>
                        </div>
                    </div>
                    <span className="text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full">
                        Tahap Pengembangan
                    </span>
                </div>

                <div className="h-[400px] overflow-y-auto px-6 py-6 space-y-4 bg-white">
                    {messages.map((message, index) => (
                        <div
                            key={index}
                            className={`flex ${
                                message.sender === "user"
                                    ? "justify-end"
                                    : "justify-start"
                            }`}
                        >
                            <div
                                className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                                    message.sender === "user"
                                        ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-md shadow-sm"
                                        : "bg-gray-50 text-gray-700 border border-gray-100 rounded-bl-md"
                                }`}
                            >
                                <p className="text-sm leading-relaxed">
                                    {message.text}
                                </p>
                            </div>
                        </div>
                    ))}

                </div>

                <div className="px-6 pb-5">

                    <p className="text-sm font-medium text-gray-600 mb-3">
                        Pertanyaan cepat
                    </p>

                    <div className="flex flex-wrap gap-2">

                        {quickQuestions.map((question, index) => (
                            <button
                                key={index}
                                onClick={() => sendMessage(question)}
                                className="
                                    text-sm
                                    px-4
                                    py-2
                                    rounded-full
                                    border
                                    border-blue-100
                                    bg-blue-50/50
                                    text-blue-600
                                    hover:bg-blue-100
                                    hover:border-blue-200
                                    transition-all
                                    duration-200
                                "
                            >
                                {question}
                            </button>
                        ))}

                    </div>
                </div>

                <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/40">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    sendMessage();
                                }
                            }}
                            placeholder="Tulis pertanyaan Anda..."
                            className="
                                flex-1
                                px-4
                                py-3
                                rounded-xl
                                border
                                border-gray-200
                                bg-white
                                text-sm
                                text-gray-700
                                placeholder:text-gray-400
                                outline-none
                                transition-all
                                focus:border-blue-400
                                focus:ring-2
                                focus:ring-blue-100
                            "
                        />

                        <button
                            onClick={() => sendMessage()}
                            className="
                                px-6
                                py-3
                                rounded-xl
                                bg-gradient-to-r
                                from-blue-600
                                to-blue-500
                                text-white
                                text-sm
                                font-semibold
                                shadow-sm
                                hover:from-blue-700
                                hover:to-blue-600
                                hover:shadow-md
                                active:scale-95
                                transition-all
                                duration-200
                            "
                        >
                            Kirim
                        </button>

                    </div>

                </div>
            </div>
        </div>
    );
};

export default ChatContent;