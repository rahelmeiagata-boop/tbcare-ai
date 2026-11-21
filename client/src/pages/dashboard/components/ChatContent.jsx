import { useState, useRef, useEffect } from "react";
import { sendChatMessage } from "../../../services/chatService";

const ChatContent = () => {
    const [messages, setMessages] = useState([
        {
            sender: "ai",
            text: "Halo! Saya AI Treatment Companion TBCare. Saya dapat membantu Anda selama menjalani pengobatan TB.",
        },
    ]);

    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    const chatContainerRef = useRef(null);
    const messagesEndRef = useRef(null);

    const quickQuestions = [
        "Saya lupa minum obat hari ini",
        "Saya merasa kesulitan mengikuti jadwal obat",
        "Saya ingin menceritakan kondisi saya hari ini",
    ];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "end",
        });
    }, [messages, loading]);

    const sendMessage = async (text = input) => {
        if (!text.trim() || loading) return;

        const userMessage = text.trim();

        const updatedMessages = [
            ...messages,
            {
                sender: "user",
                text: userMessage,
            },
        ];

        setHasStarted(true);
        setMessages(updatedMessages);
        setInput("");
        setLoading(true);

        try {
            const answer = await sendChatMessage(updatedMessages);

            setMessages((prev) => [
                ...prev,
                {
                    sender: "ai",
                    text: answer,
                },
            ]);
        } catch (error) {
            console.error("CHAT ERROR:", error);

            setMessages((prev) => [
                ...prev,
                {
                    sender: "ai",
                    text: "Maaf, AI Treatment Companion sedang mengalami gangguan. Silakan coba lagi beberapa saat.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">

                <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-xl">
                            💬
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900">
                                AI Treatment Companion
                            </h3>

                            <p className="text-sm text-green-500 flex items-center gap-1 mt-0.5">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                Pendamping aktif
                            </p>
                        </div>
                    </div>

                    <span className="text-xs font-medium bg-green-50 text-green-600 px-3 py-1.5 rounded-full">
                        Treatment Support
                    </span>
                </div>

                <div
                    ref={chatContainerRef}
                    className="h-[400px] overflow-y-auto px-6 py-6 space-y-4 bg-white"
                >
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
                                        ? "bg-blue-600 text-white rounded-br-md shadow-sm"
                                        : "bg-gray-50 text-gray-700 border border-gray-100 rounded-bl-md"
                                }`}
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {message.text}
                                </p>
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-gray-50 border border-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
                                <p className="text-sm text-gray-400">
                                    Gemini sedang memproses...
                                </p>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {!hasStarted && (
                    <div className="px-6 pb-5">
                        <p className="text-sm font-medium text-gray-600 mb-3">
                            Mulai percakapan
                        </p>

                        <div className="flex flex-wrap gap-2">
                            {quickQuestions.map((question, index) => (
                                <button
                                    key={index}
                                    onClick={() => sendMessage(question)}
                                    disabled={loading}
                                    className="text-sm px-4 py-2 rounded-full border border-blue-100 bg-blue-50/50 text-blue-600 hover:bg-blue-100 transition-all disabled:opacity-50"
                                >
                                    {question}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

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
                            placeholder="Ceritakan kondisi atau kesulitan Anda..."
                            disabled={loading}
                            className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 placeholder:text-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
                        />

                        <button
                            onClick={() => sendMessage()}
                            disabled={loading || !input.trim()}
                            className="px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                        >
                            Kirim
                        </button>
                    </div>

                    <p className="text-xs text-gray-400 mt-3">
                        AI Treatment Companion bukan pengganti tenaga kesehatan.
                    </p>
                </div>

            </div>
        </div>
    );
};

export default ChatContent;