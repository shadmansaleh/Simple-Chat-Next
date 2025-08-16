import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    const completions = await openai.chat.completions.create({
      model: "gemma-3-27b-it",
      messages: [{ role: "user", content: messages }],
      max_tokens: 1000,
    });

    return Response.json({
      response: completions.choices[0].message.content,
    });
  } catch (error) {
    return Response.json(
      {
        error: "An error occurred while processing your request.",
      },
      { status: 500 }
    );
  }
}
