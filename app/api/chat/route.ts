import { GoogleGenerativeAI } from "@google/generative-ai";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Chat unavailable" }, { status: 503 });

  const { message, history } = await request.json() as {
    message: string;
    history: { role: "user" | "model"; parts: { text: string }[] }[];
  };

  if (!message?.trim()) return NextResponse.json({ error: "Empty message" }, { status: 400 });

  // Fetch live services from DB for accurate info
  const admin = createAdminClient();
  const { data: services } = await admin
    .from("services")
    .select("name, price, duration_minutes")
    .order("name");

  const serviceList = services?.length
    ? services.map((s) => `- ${s.name}: ₱${s.price} (${s.duration_minutes} min)`).join("\n")
    : "Services information currently unavailable.";

  const systemPrompt = `You are a friendly and helpful dental clinic assistant for Smurf Dental Clinic in the Philippines. Answer questions about the clinic, services, booking, and dental care.

CLINIC INFORMATION:
- Name: Smurf Dental Clinic
- Location: Philippines
- Hours: Monday–Saturday, 9:00 AM – 6:00 PM (Closed Sundays & holidays)
- Booking: Online via the website or walk-in
- Compliance: RA 10173 (Data Privacy Act)

CURRENT SERVICES & PRICING:
${serviceList}

POLICIES:
- Appointments can be cancelled up to 24 hours in advance
- First visit includes free consultation
- PhilHealth accepted for eligible procedures
- Please arrive 5–10 minutes early

INSTRUCTIONS:
- Be warm, concise, and professional
- Answer in English (switch to Filipino if the patient writes in Filipino)
- For medical advice or emergencies, always recommend visiting the clinic
- If you don't know something specific, say "Please call us or visit the clinic for more details"
- Keep responses short — 2-4 sentences max unless listing services
- Never make up prices or services not listed above`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: systemPrompt,
    });

    const chat = model.startChat({ history: history ?? [] });
    const result = await chat.sendMessage(message);
    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (err) {
    console.error("[chat] Gemini error:", err);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
}
