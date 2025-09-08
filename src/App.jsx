import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, doc, getDoc, setDoc, serverTimestamp, setLogLevel } from 'firebase/firestore';

// --- PASTE YOUR FIREBASE CONFIG OBJECT HERE ---
// IMPORTANT: Paste ONLY the object from the Firebase console.
// Do NOT paste any "import" statements here.
const firebaseConfig = {
  apiKey: "AIzaSyBYVP69LzIyBubA0fc7RqoAajF_3sGSAQg",
  authDomain: "teseract-chatbot.firebaseapp.com",
  projectId: "teseract-chatbot",
  storageBucket: "teseract-chatbot.firebasestorage.app",
  messagingSenderId: "217356385192",
  appId: "1:217356385192:web:3c3831fbf6a6c22a153b9d",
  measurementId: "G-F8MJ0REZD3"
};
// ---------------------------------------------


// Initialize Firebase
let app, db, auth;
try {
    // Check if firebaseConfig has been filled out
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("PASTE_")) {
        console.error("Firebase config is not filled out. Please paste your config from the Firebase console into App.jsx");
    } else {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
        setLogLevel('debug');
    }
} catch (error) {
    console.error("Error initializing Firebase. Please check your firebaseConfig object.", error);
}

const clubInfo = `
- General Info: 30000 sq ft, operational hours 5am to 11pm, opens 365 days (festivals off for regular members but not for hourly bookings). Founded in Jan 2024.
- Facilities: 50+ vehicle parking, AC lobby, 18 staff, secure environment for kids (face ID access), ultra-luxurious automated environment, seating for 100+ people.
- Reputation: Trusted by 200+ families, 1000+ members, 2000+ guest entries, 100+ corporate houses. Rated 4.8 stars with over 350 reviews.
- Services: Membership, coaching, personal training, hourly guest bookings, corporate events, and parties.
- Amenities: Gym, 3 badminton courts (wooden + PVC), turf (125ft x 65ft), swimming pool (60ft x 30ft, including a 10ft baby pool), and a cafe.
- Quality: FIFA certified turf, Pentair filters for the pool, Olympic standard badminton courts, imported gym machines.

- Coaching Details:
  - Badminton: 2 coaches, batches at 5-6pm, 6-7pm, 7-8pm. Min age 6. Daily videos in the official community. No members allowed during coaching. 1 free demo class. Monday to Saturday. Max 8 kids per court.
  - Football: 2 AIFF certified coaches. Batches: 5-6pm (under 9), 6-7pm (under 13), 7-8pm (under 17). On the turf. Professional equipment. Monday to Friday. Max 20 kids per batch.
  - Swimming: Operational March to October. Morning batches: 6-7am, 7-8am, 8-9am. Evening batches: 5-6pm, 6-7pm, 7-8pm. 2 coaches (one national level). Nylon costume, glasses, cap are compulsory. Mon to Sat. Max 25 per batch. Maintained by SCM engineers with daily testing.
  - Gym: All standard equipment (leg press, bench press, squat rack, dumbbells, etc.). 2 trainers: one from 6am-10am, one from 5pm-10pm.

- Membership Info:
  - Members can use facilities anytime except during coaching hours for badminton and swimming. No membership for turf. Gym members can come anytime during operational hours.

- Hourly Prices:
  - Turf: ₹1300/hour
  - Badminton: ₹160/hour per person
  - Swimming: ₹200/hour per person
  - Gym: ₹300/hour per person

- Brochure Prices (Monthly):
  - Badminton Coaching: ₹3,500
  - Football Coaching: ₹3,000
  - Swimming Coaching: ₹3,500
  - Table Tennis Coaching: ₹2,000
  - Badminton Membership: ₹2,200
  - Gym Membership: ₹3,000
  - Swimming Membership: ₹3,000
  - All Access Membership: ₹5,000
  - (Quarterly, Half-Yearly, and Annual plans are also available with significant discounts, please ask for specifics).
`;


const TesseractClubChatbot = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [userId, setUserId] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const [sessionId, setSessionId] = useState(null);

    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                setUserId(user.uid);
            } else {
                signInAnonymously(auth).catch(error => console.error("Anonymous sign-in failed:", error));
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (userId) {
            const newSessionId = `session_${Date.now()}`;
            setSessionId(newSessionId);
            setMessages([{
                text: "Welcome to Tesseract Sports Club! How can I assist you today?",
                sender: 'bot',
                id: 'initial_welcome'
            }]);
        }
    }, [userId]);


    useEffect(() => {
        if (userId && sessionId && db) {
            const q = query(collection(db, `chats/${userId}/${sessionId}`));
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const fetchedMessages = [];
                querySnapshot.forEach((doc) => {
                    fetchedMessages.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                // Simple sort by timestamp, assuming it exists
                fetchedMessages.sort((a, b) => (a.timestamp?.toMillis() || 0) - (b.timestamp?.toMillis() || 0));

                setMessages(prevMessages => {
                    // This logic prevents duplicating initial messages on every snapshot update
                    const existingIds = new Set(prevMessages.map(m => m.id));
                    const newMessages = fetchedMessages.filter(m => !existingIds.has(m.id));
                    if (newMessages.length > 0) {
                        return [...prevMessages, ...newMessages];
                    }
                    return prevMessages;
                });
            });
            return () => unsubscribe();
        }
    }, [userId, sessionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: "smooth"
        });
    }, [messages, isTyping]);


    const callGeminiAPI = async (messageHistory) => {
        // This is a simplified mock. In a real scenario, you'd call the Gemini API.
        // For this example, we'll use a rule-based response for demonstration.
        const userMessage = messageHistory[messageHistory.length - 1].parts[0].text.toLowerCase();
        let botResponse = "I'm sorry, I don't have information about that. Can you ask about our club's amenities, coaching, memberships, or prices?";
        
        const keywords = {
            "hours": "The club is open from 5am to 11pm, 365 days a year.",
            "parking": "Yes, we have a parking space for over 50 vehicles.",
            "badminton": "We have 3 Olympic standard courts. Coaching is from 5-8pm, Mon-Sat. Membership is ₹2,200/month and hourly booking is ₹160/person.",
            "football": "We have a FIFA certified turf (125ft x 65ft). Coaching for different age groups is from 5-8pm, Mon-Fri. Hourly booking is ₹1300.",
            "swimming": "Our pool is 60ft x 30ft and open from March to October. We have morning and evening coaching batches. Membership is ₹3,000/month and hourly access is ₹200/person.",
            "gym": "Our gym has all imported machines and is open 5am to 11pm. Membership is ₹3,000/month and hourly access is ₹300/person.",
            "price": "We have monthly, quarterly, and annual plans with big savings! For example, monthly gym membership is ₹3,000. What are you interested in?",
            "membership": "We offer memberships for Badminton, Gym, Swimming, and an All-Access pass starting from ₹5,000/month. What sport are you interested in?",
            "coaching": "We offer professional coaching for Badminton, Football, and Swimming. Which one would you like to know more about?",
             "contact": "You can reach us at +91-7851-895357 or TesseractSportsClub@gmail.com.",
            "address": "While not explicitly provided, we are a major sports club in the area. You can find us on our website www.tesseractsportsclub.com or by searching for Tesseract Sports Club online.",
            "hello": "Hi there! How can I help you with information about Tesseract Sports Club?",
            "hi": "Hi there! How can I help you with information about Tesseract Sports Club?",
            "hey": "Hello! What would you like to know about our club?",
        };

        for (const key in keywords) {
            if (userMessage.includes(key)) {
                botResponse = keywords[key];
                break;
            }
        }
        
        return { text: botResponse };
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || !userId || !sessionId) return;

        const userMessage = {
            text: input,
            sender: 'user',
            timestamp: serverTimestamp()
        };
        setInput('');

        // Add user message to Firestore
        try {
            await addDoc(collection(db, `chats/${userId}/${sessionId}`), userMessage);
        } catch (error) {
            console.error("Error sending message:", error);
            return; // Don't proceed if message fails to send
        }

        setIsTyping(true);

        // Prepare history for API
        const messageHistory = [...messages.slice(1), { // slice(1) to remove initial welcome
            text: userMessage.text,
            sender: 'user'
        }].map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'model',
            parts: [{
                text: msg.text
            }]
        }));


        const apiResponse = await callGeminiAPI(messageHistory);
        setIsTyping(false);

        const botMessage = {
            text: apiResponse.text,
            sender: 'bot',
            timestamp: serverTimestamp()
        };

        // Add bot message to Firestore
        try {
            await addDoc(collection(db, `chats/${userId}/${sessionId}`), botMessage);
        } catch (error) {
            console.error("Error saving bot response:", error);
        }
    };


    return (
        <div className="font-sans bg-gray-900 text-white flex flex-col h-screen">
            <header className="bg-gray-800/50 backdrop-blur-sm shadow-lg p-4 border-b border-purple-500/30">
                <h1 className="text-2xl font-bold text-center bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                    Tesseract Sports Club Concierge
                </h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                <div className="flex flex-col space-y-4">
                    {messages.map((msg, index) => (
                         <div key={msg.id || index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {msg.sender === 'bot' && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                    T
                                </div>
                            )}
                            <div className={`max-w-xs md:max-w-md lg:max-w-2xl px-4 py-2.5 rounded-2xl shadow-md ${
                                msg.sender === 'user'
                                ? 'bg-purple-600 rounded-br-none'
                                : 'bg-gray-700 rounded-bl-none'
                            }`}>
                                <p className="text-sm md:text-base whitespace-pre-wrap">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                     {isTyping && (
                        <div className="flex items-end gap-2 justify-start">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center font-bold text-sm flex-shrink-0">
                                T
                            </div>
                            <div className="max-w-xs md:max-w-md lg:max-w-2xl px-4 py-2.5 rounded-2xl shadow-md bg-gray-700 rounded-bl-none">
                                <div className="flex items-center justify-center space-x-1">
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

            <footer className="bg-gray-800/50 backdrop-blur-sm p-4 border-t border-purple-500/30">
                <form onSubmit={handleSend} className="flex items-center space-x-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask about memberships, timings, prices..."
                        className="flex-1 p-3 bg-gray-700 rounded-lg border border-transparent focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-300"
                        disabled={!userId}
                    />
                    <button
                        type="submit"
                        className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-300 transform hover:scale-105"
                        disabled={!input.trim() || isTyping || !userId}
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default TesseractClubChatbot;

