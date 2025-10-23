import React, { useState, useEffect, useRef } from 'react';

// --- PASTE YOUR GEMINI API KEY HERE ---
const GEMINI_API_KEY = "AIzaSyBqlMvNsS0xgSWjQqQ2tj0TKNSmgIDivJo";
// --------------------------------------

const App = () => {
  const [messages, setMessages] = useState([
    {
      id: 'initial',
      text: 'Welcome to Tesseract Sports Club! How can I assist you today?',
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getBotResponse = async (userMessage) => {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
      return "AI is not configured. Please add your Gemini API Key.";
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

    const systemPrompt = `You are a helpful and friendly concierge for the Tesseract Sports Club. Your primary function is to answer user questions based *only* on the information provided below and the real-time information found on the official website: tesseractsportsclub.com.

**CRITICAL INSTRUCTIONS:**
1. **USE PROVIDED DATA & WEBSITE:** Your answers MUST be derived from the content of tesseractsportsclub.com AND the detailed information listed in this prompt.
2. **BE ACCURATE:** Provide the most current and accurate information available.
3. **DO NOT HALLUCINATE:** If the answer cannot be found in the provided information or on the website, say, "I'm sorry, but I couldn't find that specific information. For more details, contact the club directly at +91-7851-895357."
4. **BE CONCISE AND FRIENDLY:** Keep answers clear, short, and welcoming.

**TESSERACT SPORTS CLUB INFORMATION KNOWLEDGE BASE:**
(keep all the detailed info you provided here)
`;

    const payload = {
      contents: [{ parts: [{ text: userMessage }] }],
      tools: [{ google_search: {} }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        console.error("API Error:", errorBody);
        return `I'm sorry, there was a connection issue. (Status: ${response.status})`;
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || "I'm sorry, I couldn't process that. Could you rephrase your question?";
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return "I'm having trouble connecting to the AI service. Please check your API key and try again.";
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { id: Date.now(), text: input, sender: 'user', timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput('');

    setIsTyping(true);

    const botResponseText = await getBotResponse(currentInput);
    const botMessage = {
      id: Date.now() + 1,
      text: botResponseText,
      sender: 'bot',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, botMessage]);
    setIsTyping(false);
  };

  const Message = ({ msg }) => {
    const isBot = msg.sender === 'bot';
    return (
      <div className={`flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}>
        {isBot && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            T
          </div>
        )}
        <div
          className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${
            isBot
              ? 'bg-gray-700 text-white rounded-tl-none'
              : 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white rounded-br-none'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
      <header className="p-4 border-b border-gray-700/50 shadow-lg bg-gray-900/50 backdrop-blur-sm">
        <h1 className="text-xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          Tesseract Sports Club Concierge
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="space-y-6">
          {messages.map((msg) => (
            <Message key={msg.id} msg={msg} />
          ))}
          {isTyping && (
            <div className="flex items-start gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                T
              </div>
              <div className="bg-gray-700 text-white rounded-2xl rounded-tl-none px-4 py-3 text-sm">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="h-1.5 w-1.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="h-1.5 w-1.5 bg-white rounded-full animate-bounce"></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-gray-900/50 backdrop-blur-sm border-t border-gray-700/50">
        <form onSubmit={handleSendMessage} className="flex items-center gap-3 max-w-2xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about memberships, timings, prices..."
            className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="p-3 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-lg text-white disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="feather feather-send"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default App;
