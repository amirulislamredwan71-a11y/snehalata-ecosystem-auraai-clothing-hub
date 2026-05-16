
import * as genai from "@google/genai";

const apiKey = "dummy";
const ai = new genai.GoogleGenAI({ apiKey });
if (ai.chats) {
    console.log("ai.chats properties:", Object.getOwnPropertyNames(ai.chats));
    console.log("ai.chats proto properties:", Object.getOwnPropertyNames(Object.getPrototypeOf(ai.chats)));
}
