'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { CpuArchitecture } from '@/components/ui/cpu-architecture';

const suggestions = [
  'What are the tracks?',
  'How to register?',
  'Is this paid?',
];

const initialMessage = `Hey there! 👋 I'm **Navic**, your UDP assistant!

I can help you with:

✨ Tracks & pricing
📚 What you'll learn
📝 How to register
💻 Prerequisites
🎓 Certificates & stipends

Just ask me anything or pick a suggestion below! 😊`;

const loadingMessages = [
  'Thinking...',
  'Let me check that...',
  'One sec...',
  'Pulling up the details...',
];

function getAnswer(query: string): string {
  const q = query.toLowerCase();

  const trackPricing = `We've got two awesome tracks for you:

**🌐 Web Development Program** — ₹249 _(6 Weeks)_
**🤖 AI SaaS Product Development Program** — ₹299 _(4 Weeks)_

Both are packed with mentorship, real-world projects, and hands-on learning! 🚀`;

  const register = `Here's how to register for **UDP 2026**:

1. **Apply** — Go to [careers.ujjwalit.co.in](https://careers.ujjwalit.co.in) and fill out the application form
2. **Submit your details** — Takes just 2 minutes. Make sure your email and phone are correct
3. **Check your email** — Onboarding instructions will arrive in your inbox shortly after submission
4. **Pick your track** — Choose between **Web Development** (₹249) or **AI SaaS** (₹299) and complete your enrollment
5. **Join the UDP community** — You'll get a WhatsApp group invite to connect with mentors and peers
6. **Receive your Offer Letter** — Within **24–48 hours** after verification 🎉

The **batch starts July 2026** and seats are limited — applications are reviewed on a first-verified basis! ⏳`;

  const webDev = `The **Web Development Program** (₹249, 6 Weeks) covers:

- **⚛️ React.js** — Build modern, component-based UIs
- **🎨 Tailwind CSS** — Utility-first styling
- **📜 JavaScript** — Core language fundamentals
- **🖥️ UI/UX Fundamentals** — Design thinking & user experience
- **🌍 Hosting & Deployment** — Ship your projects live
- **🔗 CMS Integration** — Content management basics
- **📂 Domain Management** — Custom domains & DNS
- **🏭 Industry Development Practices** — Git, CI/CD, code reviews

Plus you'll build **one Major Project** (mentor guided) + **one Minor Project** (self assessment). You'll walk away with a real portfolio! 💪`;

  const aiDev = `The **AI SaaS Product Development Program** (₹299, 4 Weeks) covers:

- **🤖 Prompt Engineering** — Craft effective prompts for AI models
- **🧠 Generative AI Workflows** — Build with LLMs
- **🔌 Gemini API Integration** — Google's powerful AI API
- **📚 RAG Fundamentals** — Give AI access to your data
- **🔗 LangChain Fundamentals** — Orchestrate AI workflows
- **🏗️ Building AI-Powered Applications** — From idea to deployment

You'll build **one Major Project** (mentor guided) + **one Minor Project** (self assessment). Imagine having AI apps in your portfolio! 🚀`;

  const stipend = `Great question! Here's the honest truth 💙

UDP is designed as a **skill-building journey** — it's an unpaid training internship.

But here's the exciting part:

- **🏆 Top performers** get stipends and incentives based on project quality, participation, and evaluation scores
- **📜 Outstanding participants** receive **Recommendation Letters**
- **🎯 Future opportunities** with Ujjwalit Technologies for exceptional candidates

The more you put in, the more you get out! Think of it as proving yourself through real work — just like in the actual industry. 💪`;

  const certificate = `Absolutely! 🎓

Upon successful completion, you'll receive:

- ✅ A **verifiable internship certificate** — Recruiters can verify it instantly at [verify.ujjwalit.co.in](https://verify.ujjwalit.co.in)
- ✅ **Letter of Recommendation** — For outstanding participants
- ✅ **Project excellence recognition**

Your certificate is **cryptographically verifiable**, so it's trusted by employers! ✨`;

  const prerequisites = `Good news — it's **beginner friendly**! 🙌

Here's what you need:

- **💻 A Laptop/Desktop** — Any modern laptop works
- **🌐 Stable Internet Connection** — For mentorship sessions and research
- **📦 Node.js** (Web Track) or **Python** (AI Track) — Free to install
- **💡 Curiosity & willingness to learn** — The most important ingredient!

No prior experience required — just bring your enthusiasm and we'll handle the rest! 🔥`;

  const mentorship = `You'll get amazing support! 🎯

- **✅ 4+ hours** of dedicated mentorship every week
- **✅ GitHub Resources & Project Support** — Code reviews, repos, and more
- **✅ One Major Project** — Fully guided by your mentor
- **✅ One Minor Project** — Self assessment to test your skills
- **✅ Industry-Oriented Learning** — Real workflows, not just theory

Our mentors are active developers who know what the industry needs — they'll guide you like a real team lead would!`;

  const benefits = `Here's what makes UDP special:

📚 **What You'll Get:**

- 4+ hours of mentorship every week ⏰
- Verifiable internship certificate 🎓
- LOR for outstanding participants 📜
- GitHub resources & project support 🐙
- One major + one minor project 🏗️
- Real development workflows 🏭

🏆 **Program Benefits:**

- Recommendation Letters
- Project Excellence Recognition
- Future Opportunities with Ujjwalit Tech

🎯 **Bonus:** Top performers get stipends and incentives!`;

  const duration = `Program durations at a glance:

- **🌐 Web Development** — 6 Weeks (₹249)
- **🤖 AI SaaS Product Development** — 4 Weeks (₹299)

Both packed with mentorship, projects, and hands-on learning! 📅`;

  if (q.includes('track') || q.includes('program') || (q.includes('web') && q.includes('ai'))) return trackPricing;
  if (q.includes('price') || q.includes('fee') || q.includes('cost') || q.includes('\u20b9') || q.includes('rupee') || q.includes('money')) return trackPricing;
  if (q.includes('register') || q.includes('apply') || q.includes('enroll') || q.includes('sign up') || q.includes('how to')) return register;
  if ((q.includes('web') || q.includes('react') || q.includes('frontend')) && !q.includes('ai')) return webDev;
  if (q.includes('ai') || q.includes('saas') || q.includes('python') || q.includes('langchain') || q.includes('gemini') || q.includes('llm')) return aiDev;
  if (q.includes('stipend') || q.includes('paid') || q.includes('unpaid') || q.includes('salary') || q.includes('incentive')) return stipend;
  if (q.includes('certificate') || q.includes('certification') || q.includes('verify') || q.includes('degree')) return certificate;
  if (q.includes('prerequisite') || q.includes('require') || q.includes('need') || q.includes('eligib') || q.includes('qualification') || q.includes('beginner')) return prerequisites;
  if (q.includes('mentor') || q.includes('guidance') || q.includes('support') || q.includes('help') || q.includes('teach')) return mentorship;
  if (q.includes('benefit') || q.includes('get') || q.includes('learn') || q.includes('outcome') || q.includes('skill')) return benefits;
  if (q.includes('duration') || q.includes('weeks') || q.includes('long') || q.includes('time') || q.includes('months')) return duration;
  if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('namaste') || q.includes('yo') || q.includes('whats up')) {
    return `Hey hey! 👋 I'm **Navic**, your UDP buddy. Ask me anything about the program! 😊🔥`;
  }
  if (q.includes('thank') || q.includes('thanks') || q.includes('appreciate')) {
    return `You're welcome! 🥰 I'm always here if you have more questions. Apply at **careers.ujjwalit.co.in** when you're ready! 🚀`;
  }
  if (q.includes('batch') || q.includes('start') || q.includes('when') || q.includes('july')) {
    return `📍 **Batch starts July 2026!** 📅

Applications are reviewed on a **rolling basis** — seats are allocated on a first-verified basis.

⚠️ **Limited seats available** — apply early to secure your spot!`;
  }

  return `Hmm, not sure about that one! 😅

Here's the gist of **UDP 2026**:

- **Web Dev** — ₹249 (6 weeks)
- **AI SaaS** — ₹299 (4 weeks)
- 🎓 Verifiable certificate + LOR for top performers
- 💪 Mentorship, real projects, industry workflows

Try: *"What are the tracks?"* or *"How to register?"* 👇`;
}

export default function NavicChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; sender: 'bot' | 'user' }[]>([
    { text: initialMessage, sender: 'bot' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const addMessage = (text: string, sender: 'bot' | 'user') => {
    setMessages((prev) => [...prev, { text, sender }]);
  };

  const handleSend = (text?: string) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');
    addMessage(msg, 'user');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addMessage(getAnswer(msg), 'bot');
    }, 600 + Math.random() * 400);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div className={`fixed bottom-0 sm:bottom-6 right-0 sm:right-6 z-50 flex flex-col items-end gap-3 ${isOpen ? '' : 'pointer-events-none'}`}>
      {/* Chat Panel */}
      <div
        className={`w-full sm:w-[390px] h-[100dvh] sm:h-[600px] sm:max-h-[80vh] flex flex-col rounded-none sm:rounded-2xl border-0 sm:border border-slate-800 bg-slate-950 shadow-2xl transition-all duration-300 origin-bottom-right overflow-hidden ${
          isOpen
            ? 'scale-100 opacity-100 pointer-events-auto'
            : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="relative shrink-0">
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
            <CpuArchitecture text="NAVIC" animateLines animateText animateMarkers width="100%" height="100%" />
          </div>
          <div className="relative flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900 to-slate-950">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-orange to-amber-500 shadow-md shadow-brand-orange/20">
                <Bot size={22} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Navic</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
            >
              <ChevronDown size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-gradient-to-b from-slate-950 to-[#07070d] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full">
          {messages.map((msg, i) => (
            <div key={i} className={`flex items-end gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.sender === 'bot' && (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-sm">
                  <Bot size={18} className="text-brand-orange" />
                </div>
              )}
              {msg.sender === 'user' ? (
                <div className="max-w-[82%] rounded-2xl rounded-br-sm px-4 py-3 text-sm leading-relaxed bg-brand-orange text-white shadow-md shadow-brand-orange/10">
                  {msg.text}
                </div>
              ) : (
                <div className="max-w-[82%] rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed bg-slate-900/90 text-slate-200 border border-slate-800/50 shadow-sm">
                  <div className="prose prose-invert prose-sm max-w-none prose-p:my-1 prose-strong:text-white prose-ul:my-1 prose-li:my-0.5">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Skeleton Loading */}
          {isLoading && (
            <div className="flex items-end gap-3 justify-start">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 shadow-sm">
                <Bot size={18} className="text-brand-orange/60" />
              </div>
              <div className="bg-slate-900/90 rounded-2xl rounded-bl-sm border border-slate-800/50 px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 rounded-full bg-slate-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 pt-2 pb-3 border-t border-slate-800/60 shrink-0 bg-slate-950">
          <div className="flex gap-1.5 mb-2 overflow-x-auto scrollbar-none">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-slate-700/50 bg-slate-900/80 text-slate-400 hover:border-brand-orange/40 hover:text-brand-orange transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                {s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-slate-900 rounded-xl border border-slate-700/60 px-3.5 py-2.5 focus-within:border-brand-orange/50 transition-all shadow-sm">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Navic anything..."
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orange text-white hover:bg-brand-orange/80 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0 active:scale-90"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Button */}
      {!isOpen && (
        <div className="sm:pr-0 pr-4 pb-4 sm:pb-0 pointer-events-auto">
          <button
            onClick={() => setIsOpen(true)}
            className="group flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-orange to-amber-500 shadow-lg shadow-brand-orange/20 hover:shadow-brand-orange/40 hover:scale-105 transition-all cursor-pointer active:scale-95"
            aria-label="Open Navic chat"
          >
            <Bot size={26} className="text-white group-hover:rotate-[-8deg] transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}
