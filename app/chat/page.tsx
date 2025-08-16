"use client";
import React from "react";
import Markdown from "react-markdown";
import { useState } from "react";

function chat() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamResponse, setStreamResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChat = async () => {
    setLoading(true);
    setResponse("");
    setStreamResponse("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ messages: message }),
      });

      if (res.ok) {
        const data = await res.json();
        setResponse(data.response);
      } else {
        const errorData = await res.json();
        setResponse(errorData.error || "An error occurred");
      }
    } catch (error) {
      if (error instanceof Error) {
        setResponse("Error: " + error.message);
      }
    }
    setLoading(false);
  };

  const handleStreamChat = async () => {
    setLoading(true);
    setStreamResponse("");
    setStreaming(true);
    try {
      const res = await fetch("/api/chat-stream", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ messages: message }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        setResponse(errorData.error || "An error occurred");
        setLoading(false);
        return;
      }
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) {
        throw new Error("Failed to get reader from response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          setStreaming(false);
          break;
        }
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.trim() === "") continue;
          if (line.startsWith("data: ")) {
            const parsedChunk = JSON.parse(line.replace(/^data: /, ""));
            setStreamResponse((prev) => prev + parsedChunk.content);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setResponse("Error: " + error.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-[75%] sm:w-[50%]">
        <h1 className="text-2xl bold text-amber-500">chat</h1>
        <div className="w-full">
          {streamResponse && (
            <div className="mt-4 p-4 text-gray-100 rounded-lg shadow-md whitespace-pre-wrap border border-gray-300 w-full">
              <h2 className="text-lg font-semibold">Response:</h2>
              <Markdown>{streamResponse}</Markdown>
            </div>
          )}
        </div>
        <div className="w-full">
          <textarea
            name="message-box"
            id="message-box"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Your message"
            rows={2}
            className="w-full p-4 text-lg mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          ></textarea>
          <button
            className="shadow-xl bg-amber-700 rounded-xl px-4 py-2 text-white hover:bg-amber-600 transition-colors duration-300 mx-auto w-full"
            onClick={handleStreamChat}
            disabled={loading}
          >
            {loading ? "Loading..." : "Send"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default chat;
