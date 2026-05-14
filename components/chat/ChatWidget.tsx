"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface Message {
  id: string;
  role: "bot" | "user";
  text: string;
}

const SUGGESTIONS = [
  "What services do you offer?",
  "How do I book an appointment?",
  "What are your clinic hours?",
  "Do you accept PhilHealth?",
];

const MOCK_RESPONSES: Record<string, string> = {
  "What services do you offer?":
    "We offer a full range of dental services including general check-ups, cleaning, tooth extraction, fillings, orthodontics (braces), veneers, teeth whitening, and root canal treatment. You can view all services and pricing when you book an appointment.",
  "How do I book an appointment?":
    "Booking is easy! Click the 'Book an Appointment' button on the home page, choose your preferred dentist and service, pick a date and time, and you're all set. You'll receive a confirmation email once your appointment is reviewed.",
  "What are your clinic hours?":
    "Our clinic is open Monday to Saturday, 9:00 AM – 6:00 PM. We are closed on Sundays and public holidays. Same-day appointments may be available — book early to secure a slot!",
  "Do you accept PhilHealth?":
    "Yes, we accept PhilHealth for eligible procedures. Please bring your PhilHealth ID and MDR on your appointment day. For specific coverage questions, feel free to call us directly.",
};

function TypingIndicator() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "10px 14px" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: "6px", height: "6px", borderRadius: "50%",
            background: "var(--ink-muted)",
            animation: "chatBounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Hi! I'm the Smurf Dental assistant 👋 How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, thinking]);

  function sendMessage(text: string) {
    if (!text.trim() || thinking) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", text: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setThinking(true);

    setTimeout(() => {
      const response =
        MOCK_RESPONSES[text.trim()] ??
        "Thanks for your question! For detailed information, please call us or book a consultation — our staff will be happy to assist you.";
      setThinking(false);
      setMessages((m) => [
        ...m,
        { id: (Date.now() + 1).toString(), role: "bot", text: response },
      ]);
    }, 1200);
  }

  if (!mounted) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes chatBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatPop {
          0%   { transform: scale(0.8); opacity: 0; }
          70%  { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed", bottom: "calc(88px + env(safe-area-inset-bottom, 0px))", right: "16px", zIndex: 9998,
          width: "360px", maxWidth: "calc(100vw - 32px)",
          maxHeight: "calc(100svh - 120px - env(safe-area-inset-bottom, 0px))",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "1.25rem", boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          animation: "chatSlideUp 0.25s ease-out",
          transformOrigin: "bottom right",
        }}>

          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", gap: "10px",
            padding: "1rem 1.125rem",
            background: "var(--sidebar-bg)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "rgba(110,231,183,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="18" height="18" viewBox="0 0 60 72" fill="none">
                <path d="M10 22C10 11 18 4 30 4C42 4 50 11 50 22V42C50 54 43 60 36 63L33 68C31.5 71.5 28.5 71.5 27 68L24 63C17 60 10 54 10 42V22Z" stroke="#6EE7B7" strokeWidth="3" strokeLinejoin="round"/>
                <path d="M20 22C20 16 24.5 13 30 13C35.5 13 40 16 40 22" stroke="#6EE7B7" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "white", lineHeight: 1.2 }}>
                Smurf Dental
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#6EE7B7", flexShrink: 0 }} />
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)" }}>Online · Usually replies instantly</span>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: "rgba(255,255,255,0.08)", border: "none",
                color: "rgba(255,255,255,0.6)", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: "auto", padding: "1rem",
            display: "flex", flexDirection: "column", gap: "0.625rem",
            minHeight: "0",
          }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div style={{
                  maxWidth: "82%",
                  padding: "0.625rem 0.875rem",
                  borderRadius: msg.role === "user"
                    ? "1rem 1rem 0.25rem 1rem"
                    : "1rem 1rem 1rem 0.25rem",
                  background: msg.role === "user"
                    ? "var(--accent)"
                    : "var(--bg)",
                  border: msg.role === "user" ? "none" : "1px solid var(--border)",
                  color: msg.role === "user" ? "white" : "var(--ink)",
                  fontSize: "0.8125rem",
                  lineHeight: 1.55,
                }}>
                  {msg.text}
                </div>
              </div>
            ))}

            {thinking && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{
                  background: "var(--bg)", border: "1px solid var(--border)",
                  borderRadius: "1rem 1rem 1rem 0.25rem",
                }}>
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion chips — show after every bot reply */}
          {!thinking && messages[messages.length - 1]?.role === "bot" && (
            <div style={{
              padding: "0 1rem 0.75rem",
              display: "flex", flexWrap: "wrap", gap: "0.375rem",
            }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  style={{
                    padding: "0.375rem 0.75rem", borderRadius: "999px",
                    border: "1px solid var(--border)", background: "var(--bg)",
                    color: "var(--ink)", fontSize: "0.75rem", cursor: "pointer",
                    fontWeight: 500, transition: "all 0.15s",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{
            padding: "0.75rem 1rem",
            borderTop: "1px solid var(--border)",
            display: "flex", gap: "0.5rem", alignItems: "center",
          }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
              placeholder="Ask something…"
              disabled={thinking}
              style={{
                flex: 1, padding: "0.5rem 0.875rem",
                borderRadius: "999px", border: "1px solid var(--border)",
                background: "var(--bg)", color: "var(--ink)",
                fontSize: "0.8125rem", outline: "none",
                opacity: thinking ? 0.6 : 1,
              }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || thinking}
              style={{
                width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0,
                background: input.trim() && !thinking ? "var(--accent)" : "var(--border)",
                border: "none", cursor: input.trim() && !thinking ? "pointer" : "not-allowed",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z"/>
              </svg>
            </button>
          </div>

          {/* Footer */}
          <p style={{
            textAlign: "center", fontSize: "0.65rem", color: "var(--ink-muted)",
            padding: "0 1rem 0.625rem", opacity: 0.6,
          }}>
            Powered by Smurf Dental · RA 10173 Compliant
          </p>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed", bottom: "calc(24px + env(safe-area-inset-bottom, 0px))", right: "16px", zIndex: 9999,
          width: "56px", height: "56px", borderRadius: "50%",
          background: open ? "var(--sidebar-bg)" : "var(--accent)",
          border: "none", cursor: "pointer",
          boxShadow: "0 8px 24px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.2s, transform 0.2s",
          animation: "chatPop 0.3s ease-out",
        }}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 60 72" fill="none">
            <path d="M10 22C10 11 18 4 30 4C42 4 50 11 50 22V42C50 54 43 60 36 63L33 68C31.5 71.5 28.5 71.5 27 68L24 63C17 60 10 54 10 42V22Z" stroke="white" strokeWidth="3.5" strokeLinejoin="round"/>
            <path d="M20 22C20 16 24.5 13 30 13C35.5 13 40 16 40 22" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        )}
      </button>
    </>,
    document.body
  );
}
