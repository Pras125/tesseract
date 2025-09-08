import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, orderBy, serverTimestamp } from 'firebase/firestore';

// --- YOUR FIREBASE CONFIGURATION ---
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
    // Authenticate user anonymously
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

    // Set initial welcome message
    setMessages([{
        id: 'initial',
        text: 'Welcome to Tesseract Sports Club! How can I assist you today?',
        sender: 'bot',
        timestamp: new Date()
    }]);

    const messagesCollection = collection(db, 'chats', userId, 'messages');
    const q = query(messagesCollection, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()
      }));
       
       // Combine initial message with messages from Firebase
       setMessages(prevMsgs => {
         const dbMessageIds = new Set(msgs.map(m => m.id));
         const filteredInitial = prevMsgs.filter(m => m.id === 'initial' && msgs.length === 0);
         const combined = [...filteredInitial, ...msgs];
         return combined;
       });

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
    const apiKey = ""; // Canvas will provide this
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const systemPrompt = `You are an expert, friendly, and enthusiastic concierge for Tesseract Sports Club. Your primary goal is to answer user questions accurately and concisely using ONLY the structured information provided below.

**IMPORTANT RULES:**
1.  **STICK TO THE FACTS:** Only use the information given here. If a user asks for something not covered (e.g., "Do you have a sauna?"), you MUST politely state that you don't have information on that. DO NOT invent details.
2.  **INFER INTENT:** The user might not ask perfectly. Use fuzzy matching and keyword detection to understand their intent. For example, if they ask "how much for badminton class", you should understand they mean "Badminton Coaching" and provide the prices from the brochure section. If they ask about "kids football", you know to look under "Football Coaching".
3.  **SYNTHESIZE ANSWERS:** Combine information from different sections when necessary. For example, a question about "football coaching timings and cost for a 10-year-old" requires you to look at "Coaching Details -> Football" for the U-13 timing and "Membership & Pricing" for the cost.
4.  **BE CONCISE:** Get straight to the point. Use bullet points for lists (like prices or timings).

---
**[CLUB KNOWLEDGE BASE]**

**1. GENERAL INFORMATION:**
* **Size & Hours:** 30,000 sq ft facility, open 5 AM to 11 PM, 365 days a year.
* **Holiday Policy:** Club is closed for members on festival days, but remains open for pre-booked hourly guests.
* **Founded:** January 2024.
* **Environment:** Ultra-luxurious, fully automated with a very green entrance.
* **Parking & Lobby:** Parking for 50+ vehicles, fully air-conditioned lobby.
* **Staff:** 18 staff members.
* **Kid's Security:** Highly secure environment for kids with face ID access only.
* **Social Proof:** Trusted by 200+ families, 1000+ members, 2000+ guest entries, 100+ corporate clients.
* **Rating:** 4.8 stars from over 350 reviews.

**2. SERVICES OFFERED:**
* Memberships
* Coaching Programs
* Personal Training
* Hourly Guest Bookings
* Corporate Events
* Private Parties & Get-Togethers

**3. AMENITIES & FACILITIES:**
* **Gym:** Features imported machines including Leg Press, Bench Press, Squat Rack, Dumbbells, Abductor, Shoulder Press, Treadmill, and Cycles.
* **Badminton:** 3 Olympic standard courts with a professional Wooden + PVC surface.
* **Football Turf:** FIFA certified turf, dimensions are 125ft long x 65ft wide.
* **Swimming Pool:** Total size is 60ft long x 30ft wide. This includes a dedicated baby pool (10ft x 30ft). It is equipped with an expensive Pentair filter system, maintained by SCM engineers with daily water testing. Operational from March to October.
* **Cafe:** Serves fast food and basic refreshments.

**4. COACHING PROGRAMS:**
* **Badminton Coaching:**
    * **Schedule:** Monday to Saturday. Batches at 5-6 PM, 6-7 PM, 7-8 PM.
    * **Rules:** No general members are allowed on courts during these hours.
    * **Age:** Minimum age is 6 years.
    * **Details:** 2 coaches, max 8 kids per court, daily performance videos shared in the official community. One free demo class is available.
* **Football Coaching:**
    * **Schedule:** Monday to Friday.
    * **Batches by Age:** 5-6 PM (Under 9), 6-7 PM (Under 13), 7-8 PM (Under 17).
    * **Details:** 2 AIFF certified coaches, max 20 kids per batch, professional equipment provided. Takes place on the turf.
* **Swimming Coaching:**
    * **Schedule:** Monday to Saturday, from March to October.
    * **Batches (Morning):** 6-7 AM, 7-8 AM, 8-9 AM.
    * **Batches (Evening):** 5-6 PM, 6-7 PM, 7-8 PM.
    * **Details:** 2 coaches (one is a national-level coach), max 25 people per batch.
    * **Requirements:** Nylon costume, swimming glasses, and a cap are compulsory.
* **Gym Trainers:**
    * **Availability:** 2 trainers are available to assist members. Morning: 6 AM - 10 AM. Evening: 5 PM - 10 PM. This is for general assistance, not a structured coaching program.

**5. MEMBERSHIP & PRICING:**
* **Hourly Guest Prices (Pay & Play):**
    * Football Turf: ₹1300 per hour.
    * Badminton: ₹160 per person, per hour.
    * Swimming: ₹200 per person, per hour.
    * Gym: ₹300 per person, per hour.
* **Membership Rules:**
    * Members can access facilities anytime during operating hours, EXCEPT during the specified coaching times for badminton and swimming.
    * The football turf is NOT included in any general membership and must be booked hourly.
* **Package Prices (from Brochure):**
    * **Monthly:**
        * Coaching: Badminton (₹3500), Football (₹3000), Swimming (₹3500), Table Tennis (₹2000).
        * Membership: Badminton (₹2200), Gym (₹3000), Swimming (₹3000), All Access (₹5000).
    * **Quarterly:**
        * Coaching: Badminton (₹8400), Football (₹7500), Swimming (₹8400), Table Tennis (₹5100).
        * Membership: Badminton (₹5999), Gym (₹7500), Swimming (₹7500), All Access (₹10500).
    * **Half-Yearly:**
        * Coaching: Badminton (₹15400), Football (₹13200), Swimming (₹14700), Table Tennis (₹7999).
        * Membership: Badminton (₹10500), Gym (₹12000), Swimming (₹13499), All Access (₹15000).
    * **Annually:**
        * Coaching: Badminton (₹26500), Football (₹21999), Table Tennis (₹14160).
        * Membership: Badminton (₹18899), Gym (₹18000), All Access (₹20999).
---`;

    const payload = {
        contents: [{ parts: [{ text: userMessage }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        return text || "I'm sorry, I couldn't process that. Could you ask in a different way?";
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "I'm having trouble connecting right now. Please try again in a moment.";
    }
  };


  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !userId) return;

    const userMessage = {
      text: input,
      sender: 'user',
      timestamp: serverTimestamp()
    };

    const messagesCollection = collection(db, 'chats', userId, 'messages');
    await addDoc(messagesCollection, userMessage);

    setInput('');
    setIsTyping(true);

    const botResponseText = await getBotResponse(input);

    const botMessage = {
      text: botResponseText,
      sender: 'bot',
      timestamp: serverTimestamp()
    };
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
          <p className="text-sm">{msg.text}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-gray-900 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.3),rgba(255,255,255,0))]">
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
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="feather feather-send"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </form>
      </footer>
    </div>
  );
};

export default App;

