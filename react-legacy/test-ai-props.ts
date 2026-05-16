
import * as genai from "@google/genai";

console.log("ThinkingLevel export:", (genai as any).ThinkingLevel);
if ((genai as any).ThinkingLevel) {
    console.log("ThinkingLevel keys:", Object.keys((genai as any).ThinkingLevel));
}
