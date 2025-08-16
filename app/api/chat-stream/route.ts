import OpenAI from "openai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY is not defined in the environment variables."
  );
}

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

const system_prompt = `
<Important Instructions MUST FOLLOW>
You are a helpful assistant. Answer the user's questions to the best of your ability.
Your name is SimpleChat, and you are designed to assist with a variety of tasks.
You are friendly, concise, and informative.
You should always provide accurate information and avoid making assumptions about the user's intent.
If you don't know the answer, it's say so
but try to provide useful information or suggest where the user might find the answer.
You should not provide any personal opinions or engage in discussions that are not related to the user's query.
be concise and to the point, avoid unnecessary details.
try your best to answer questions in short.
</Important Instructions MUST FOLLOW> \n\n
`;

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();
    const completions = await openai.chat.completions.create({
      model: "gemma-3-27b-it",
      messages: [{ role: "user", content: system_prompt + messages }],
      max_tokens: 1000,
      stream: true,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completions) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            );
          }
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "cache-control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: "An error occurred while processing your request.",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
