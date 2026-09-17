import Anthropic from "@anthropic-ai/sdk";
let anthropic = null;
const getClient = () => {
    if (!anthropic) {
        anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    }
    return anthropic;
};
export const isAiConfigured = () => Boolean(process.env.ANTHROPIC_API_KEY);
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
export async function summarizeResponses(formTitle, itemsByLabel) {
    if (!isAiConfigured())
        return null;
    const sample = itemsByLabel.map((f) => ({
        field: f.label,
        answers: f.items.slice(0, 8),
    }));
    const prompt = `You are an analyst for a form builder tool. Analyze the form responses below and produce a JSON object.

Form title: "${formTitle}"

Responses:
${JSON.stringify(sample, null, 2)}

Return STRICT JSON (no markdown fences) with this shape:
{
  "summary": "2-3 sentence plain-text summary of the overall results",
  "themes": [{ "theme": "short theme name", "mentions": <count as number> }],
  "notableResponses": [{ "label": "field label", "answer": "the answer", "why": "one line why it stands out" }]
}
Keep themes to max 5, notableResponses to max 3.`;
    try {
        const message = await getClient().messages.create({
            model: MODEL,
            max_tokens: 1500,
            temperature: 0.4,
            messages: [{ role: "user", content: prompt }],
        });
        const rawText = message.content
            .filter((b) => b.type === "text")
            .map((b) => b.text)
            .join("");
        const cleaned = rawText.replace(/```json|```/g, "").trim();
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (!match)
            return null;
        return JSON.parse(match[0]);
    }
    catch (err) {
        console.error("AI summarization failed:", err);
        return null;
    }
}
