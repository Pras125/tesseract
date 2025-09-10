import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';

// --- PASTE YOUR GEMINI API KEY HERE ---
// Get your free key from Google AI Studio.
// Follow the instructions in the `APIKeyGuide.md` file.
const GEMINI_API_KEY = "AIzaSyBqlMvNsS0xgSWjQqQ2tj0TKNSmgIDivJo";
// ------------------------------------

// --- YOUR FIREBASE CONFIGURATION ---
// IMPORTANT: Replace with your actual Firebase config.
// The config below is for demonstration purposes only.
const firebaseConfig = {
  apiKey: "AIzaSyBYVP69LzIyBubA0fc7RqoAajF_3sGSAQg",
  authDomain: "teseract-chatbot.firebaseapp.com",
  projectId: "teseract-chatbot",
  storageBucket: "teseract-chatbot.appspot.com",
  messagingSenderId: "217356385192",
  appId: "1:217356385192:web:3c3831fbf6a6c22a153b9d",
  measurementId: "G-F8MJ0REZD3"
};
// -----------------------------------

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const App = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userId, setUserId] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        signInAnonymously(auth).catch(error => console.error("Anonymous sign-in failed:", error));
      }
    });
  }, []);

  useEffect(() => {
    if (!userId) return;

    const messagesCollection = collection(db, 'chats', userId, 'messages');
    const q = query(messagesCollection, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
      
      if (msgs.length === 0) {
         setMessages([{
            id: 'initial',
            text: 'Welcome to Tesseract Sports Club! How can I assist you today?',
            sender: 'bot',
            timestamp: new Date()
        }]);
      } else {
        setMessages(msgs);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getBotResponse = async (userMessage) => {
    if (GEMINI_API_KEY === "PASTE_YOUR_GEMINI_API_KEY_HERE") {
      return "AI is not configured. Please get your free Gemini API Key and add it to the TesseractClubChatbot.jsx file.";
    }
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${GEMINI_API_KEY}`;

    const systemPrompt = `You are a helpful and friendly concierge for the Tesseract Sports Club. Your primary function is to answer user questions based *only* on the information provided below and the real-time information found on the official website: tesseractsportsclub.com.

**CRITICAL INSTRUCTIONS:**
1.  **USE PROVIDED DATA & WEBSITE:** Your answers MUST be derived from the content of tesseractsportsclub.com AND the detailed information listed in this prompt.
2.  **BE ACCURATE:** Provide the most current and accurate information available.
3.  **DO NOT HALLUCINATE:** If the answer cannot be found in the provided information or on the website, you MUST state, "I'm sorry, but I couldn't find that specific information. For more details, you can contact the club directly at +91-7851-895357." Do NOT invent information.
4.  **BE CONCISE AND FRIENDLY:** Keep your answers clear, to the point, and maintain a welcoming tone.

**TESSERACT SPORTS CLUB INFORMATION KNOWLEDGE BASE:**

**1. General Information:**
* **Area:** 30,000 sq ft.
* **Operational Hours:** 5:00 AM to 11:00 PM.
* **Availability:** Open 365 days. On festival days, the club is closed for members but remains open for hourly bookings.
* **Founded:** January 2024.
* **Facilities:** 50+ vehicle parking space, AC lobby, 18-person staff, secure environment for kids (access by Face ID only), green entryway, ultra-luxurious vibes, automated systems, sitting space for over 100 people.
* **Services:** Full solutions for events.
* **Reputation:** Trusted by 200+ families, 1000+ members, 2000+ guest entries, 100+ corporate houses. Rated 4.8 stars with over 350 reviews.

**2. Services Offered:**
* Memberships
* Coaching
* Personal Training
* Hourly Guest Bookings (Pay & Play)
* Corporate Events & Get-Together Parties

**3. Amenities & Quality:**
* **Gym:** Imported machines (leg press, bench press, squat rack, dumbbells, abductor, shoulder press, treadmill, cycles).
* **Badminton:** 3 Olympic standard courts (Wooden + PVC).
* **Football Turf:** 125ft long x 65ft wide, FIFA certified.
* **Swimming Pool:** 60ft long x 30ft wide (includes a 10ft x 30ft baby pool). Maintained with expensive Pentair filters and daily testing by SCM engineers.
* **Cafe:** Serves fast food and basic items.
* **Table Tennis**

**4. Coaching Information:**
* **Badminton:**
    * **Coaches:** 2.
    * **Timings:** 5-6 PM, 6-7 PM, 7-8 PM (Monday to Saturday).
    * **Rules:** Minimum age 6, no max age. Daily videos in the official Tesseract community. Members are not allowed during coaching hours. 1 free demo class. Max 8 kids per court.
* **Football:**
    * **Coaches:** 2 AIFF certified coaches.
    * **Timings (Mon-Fri):** 5-6 PM (Under 9), 6-7 PM (Under 13), 7-8 PM (Under 17).
    * **Details:** Held on the turf with professional equipment. Max 20 kids per batch.
* **Swimming:**
    * **Season:** Operational from March to October.
    * **Coaches:** 2 coaches, including a national-level coach.
    * **Timings (Mon-Sat):** Morning: 6-7, 7-8, 8-9 AM. Evening: 5-6, 6-7, 7-8 PM.
    * **Rules:** Nylon costume, glasses, and cap are compulsory. Max 25 per batch.
* **Gym:**
    * **Trainers:** 2 trainers available.
    * **Shifts:** Morning: 6 AM - 10 AM. Evening: 5 PM - 10 PM.
    * **Note:** No specific "coaching program" for the gym, but trainers are available for assistance.

**5. Membership & Hourly Prices:**
* **General Rule:** Members can come anytime except during coaching hours for swimming and badminton. There is no membership for the turf. Gym members can come anytime during club operational hours.
* **Hourly (Pay & Play) Prices:**
    * Football Turf: ₹1300 per hour.
    * Badminton: ₹160 per person, per hour.
    * Swimming: ₹200 per person, per hour.
    * Gym: ₹300 per person, for a session.
* **Coaching & Membership Price List:**
    * **Monthly:**
        * Coaching: Badminton (₹3,500), Football (₹3,000), Swimming (₹3,500), Table Tennis (₹2,000).
        * Membership: Badminton (₹2,200), Gym (₹3,000), Swimming (₹3,000), All Access (₹5,000).
    * **Quarterly:**
        * Coaching: Badminton (₹8,400), Football (₹7,500), Swimming (₹8,400), Table Tennis (₹5,100).
        * Membership: Badminton (₹5,999), Gym (₹7,500), Swimming (₹7,500), All Access (₹10,500).
    * **Half-Yearly:**
        * Coaching: Badminton (₹15,400), Football (₹13,200), Swimming (₹14,700), Table Tennis (₹7,999).
        * Membership: Badminton (₹10,500), Gym (₹12,000), Swimming (₹13,499), All Access (₹15,000).
    * **Annually:**
        * Coaching: Badminton (₹26,500), Football (₹21,999), Table Tennis (₹14,160).
        * Membership: Badminton (₹18,899), Gym (₹18,000), All Access (₹20,999).

**6. Contact Information:**
* **Phone:** +91-7851-895357
* **Email:** TESSERACTSPORTSCLUB@GMAIL.COM
* **Website:** www.tesseractsportsclub.com
`;

    const payload = {
      contents: [{ parts: [{ text: userMessage }] }],
      tools: [{ "google_search": {} }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
          const errorBody = await response.json();
          console.error("API Error Response:", errorBody);
          return `I'm sorry, there was an error with the connection. (Status: ${response.status})`;
      }
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      return text || "I'm sorry, I couldn't process that. Could you ask in a different way?";
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      return "I'm having trouble connecting to the AI service right now. Please check your API key and try again in a moment.";
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !userId) return;

    const userMessage = { text: input, sender: 'user', timestamp: serverTimestamp() };
    const messagesCollection = collection(db, 'chats', userId, 'messages');
    await addDoc(messagesCollection, userMessage);
    const currentInput = input;
    setInput('');
    
    setIsTyping(true);

    const botResponseText = await getBotResponse(currentInput);
    const botMessage = { text: botResponseText, sender: 'bot', timestamp: serverTimestamp() };
    await addDoc(messagesCollection, botMessage);
    
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
        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-3 rounded-2xl ${isBot ? 'bg-gray-700 text-white rounded-tl-none' : 'bg-gradient-to-tr from-purple-600 to-pink-500 text-white rounded-br-none'}`}>
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
          {messages.map((msg) => <Message key={msg.id} msg={msg} />)}
          {isTyping && (
            <div className="flex items-start gap-3 justify-start">
               <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">T</div>
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
          <button type="submit" className="p-3 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-lg text-white disabled:opacity-50 hover:opacity-90 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-send"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default App;

