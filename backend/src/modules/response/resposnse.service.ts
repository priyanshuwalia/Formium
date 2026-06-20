import prisma from "../../config/db.js";

type ConversationalMessage = {
    role: "user" | "assistant";
    content: string;
};

type ExtractedAnswer = {
    blockId: string;
    value: string | string[] | number | null;
};

type ExtractionResult = {
    answers: ExtractedAnswer[];
};

type InterviewResult = ExtractionResult & {
    assistantMessage: string;
    isComplete: boolean;
};

export class ConversationalResponseError extends Error {
    statusCode: number;
    publicMessage: string;

    constructor(message: string, statusCode = 500, publicMessage = message) {
        super(message);
        this.name = "ConversationalResponseError";
        this.statusCode = statusCode;
        this.publicMessage = publicMessage;
    }
}

type ConversationalLogger = (message: string, meta?: Record<string, unknown>) => void;

const inputBlockTypes = new Set([
    "SHORT_ANS",
    "LONG_ANS",
    "EMAIL",
    "NUM",
    "CHECKBOXES",
    "MULT_CHOICE",
    "DROPDOWN",
    "PHONE_NUM",
    "LINK",
    "FILE_UPLOAD",
    "DATE",
    "RATING",
]);

export const createResponse = async (formId: string,
    items: { blockId: string; value: string }[]
) => {
    return await prisma.response.create({
        data: {
            formId,
            items: {
                createMany: {
                    data: items
                }
            }

        }, include: { items: true }
    })
}
export const getResponseByForm = async (formId: string) => {
    return await prisma.response.findMany({ where: { formId }, include: { items: true } })
}

export const getResponseById = async (id: string) => {
    return await prisma.response.findUnique({
        where: { id },
        include: {
            items: true,
            form: {
                include: {
                    blocks: {
                        orderBy: { order: 'asc' }
                    }
                }
            }
        }
    });
}

const normalizeOptions = (options: unknown): string[] => {
    if (!Array.isArray(options)) {
        return [];
    }

    return options.filter((option): option is string => typeof option === "string");
}

const stringifyAnswer = (value: string | string[] | number | null | undefined) => {
    if (Array.isArray(value)) {
        return value.filter(Boolean).join(", ");
    }

    if (value === null || value === undefined) {
        return "";
    }

    return String(value).trim();
}

const normalizeOpenRouterApiKey = (apiKey: string) => {
    return apiKey
        .trim()
        .replace(/^Bearer\s+/i, "")
        .replace(/^["']|["']$/g, "")
        .trim();
}

const coerceAnswerValue = (type: string, value: string | string[] | number | null | undefined, options: string[]) => {
    if (value === null || value === undefined) {
        return "";
    }

    if (type === "CHECKBOXES") {
        const values = Array.isArray(value)
            ? value.map(String)
            : String(value).split(",").map((item) => item.trim());

        if (options.length === 0) {
            return values.filter(Boolean).join(", ");
        }

        return values.filter((item) => options.includes(item)).join(", ");
    }

    if (["MULT_CHOICE", "DROPDOWN"].includes(type)) {
        const answer = stringifyAnswer(value);
        return options.includes(answer) ? answer : "";
    }

    if (type === "EMAIL") {
        const answer = stringifyAnswer(value);
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(answer) ? answer : "";
    }

    if (type === "NUM") {
        const answer = stringifyAnswer(value);
        return answer && Number.isFinite(Number(answer)) ? answer : "";
    }

    if (type === "DATE") {
        const answer = stringifyAnswer(value);
        return /^\d{4}-\d{2}-\d{2}$/.test(answer) ? answer : "";
    }

    if (type === "LINK") {
        const answer = stringifyAnswer(value);
        try {
            const url = new URL(answer);
            return ["http:", "https:"].includes(url.protocol) ? answer : "";
        } catch {
            return "";
        }
    }

    if (type === "RATING") {
        const answer = Number(stringifyAnswer(value));
        return Number.isInteger(answer) && answer >= 1 && answer <= 5 ? String(answer) : "";
    }

    return stringifyAnswer(value);
}

const extractJsonObject = (content: string) => {
    const trimmed = content.trim();

    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
        return trimmed;
    }

    const fencedJson = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (fencedJson?.[1]) {
        return fencedJson[1].trim();
    }

    const firstBrace = trimmed.indexOf("{");
    const lastBrace = trimmed.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace > firstBrace) {
        return trimmed.slice(firstBrace, lastBrace + 1);
    }

    throw new ConversationalResponseError(
        "LLM_INVALID_JSON",
        502,
        "The selected OpenRouter model did not return valid structured output. Try again or switch OPENROUTER_MODEL to a chat model that follows JSON instructions.",
    );
}

const parseInterviewResult = (content: string): InterviewResult => {
    let parsed: Partial<InterviewResult>;

    try {
        parsed = JSON.parse(extractJsonObject(content)) as Partial<InterviewResult>;
    } catch (err) {
        if (err instanceof ConversationalResponseError) {
            throw err;
        }

        throw new ConversationalResponseError(
            "LLM_INVALID_JSON",
            502,
            "The selected OpenRouter model returned a response I could not read. Please try again.",
        );
    }

    const answers = Array.isArray(parsed.answers)
        ? parsed.answers.filter((answer): answer is ExtractedAnswer => (
            typeof answer === "object"
            && answer !== null
            && typeof answer.blockId === "string"
            && "value" in answer
        ))
        : [];

    return {
        assistantMessage: typeof parsed.assistantMessage === "string"
            ? parsed.assistantMessage
            : "Could you share the next answer?",
        isComplete: parsed.isComplete === true,
        answers,
    };
}

export const createConversationalResponse = async (
    formId: string,
    messages: ConversationalMessage[],
    apiKey: string,
    log: ConversationalLogger = () => undefined,
) => {
    log("Loading form", { formId, messageCount: messages.length });

    const form = await prisma.form.findUnique({
        where: { id: formId },
        include: {
            blocks: {
                orderBy: { order: "asc" },
            },
        },
    });

    if (!form) {
        log("Form not found", { formId });
        throw new Error("FORM_NOT_FOUND");
    }

    const answerableBlocks = form.blocks.filter((block) => inputBlockTypes.has(block.type));
    log("Loaded form", {
        formId,
        title: form.title,
        blockCount: form.blocks.length,
        answerableBlockCount: answerableBlocks.length,
    });

    if (answerableBlocks.length === 0) {
        log("No answerable blocks", { formId });
        throw new Error("NO_ANSWERABLE_BLOCKS");
    }

    const openRouterApiKey = normalizeOpenRouterApiKey(apiKey);

    if (!openRouterApiKey) {
        log("Missing OpenRouter API key");
        throw new ConversationalResponseError(
            "OPENROUTER_API_KEY_REQUIRED",
            400,
            "Your OpenRouter API key is required for conversational responses.",
        );
    }

    const fields = answerableBlocks.map((block) => ({
        blockId: block.id,
        label: block.label,
        type: block.type,
        required: block.required,
        placeholder: block.placeholder,
        options: normalizeOptions(block.options),
    }));
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

    log("Calling OpenRouter", {
        model,
        fieldCount: fields.length,
        keyPrefix: openRouterApiKey.slice(0, 8),
        keySuffix: openRouterApiKey.slice(-4),
    });

    const openRouterHeaders = new Headers();
    openRouterHeaders.set("authorization", `Bearer ${openRouterApiKey}`);
    openRouterHeaders.set("content-type", "application/json");
    openRouterHeaders.set("http-referer", process.env.APP_URL || "http://localhost:5173");
    openRouterHeaders.set("x-title", "FormBuddy");

    log("Prepared OpenRouter headers", {
        hasAuthorization: openRouterHeaders.has("authorization"),
        authorizationPrefix: openRouterHeaders.get("authorization")?.slice(0, 15),
    });

    const completionResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: openRouterHeaders,
        body: JSON.stringify({
            model,
            temperature: 0,
            messages: [
                {
                    role: "system",
                    content: [
                        "You are conducting a friendly conversational form interview.",
                        "You have the full form schema and the complete conversation so far.",
                        "Ask the user for missing answers in a natural tone, usually one field at a time.",
                        "Do not ask for headings, dividers, or non-answer fields.",
                        "For optional fields, the user may answer or explicitly skip.",
                        "Return strict JSON only in this shape: {\"assistantMessage\":\"...\",\"isComplete\":false,\"answers\":[{\"blockId\":\"...\",\"value\":\"...\"}]}",
                        "Use the provided blockId values exactly.",
                        "Coerce values to each field type: EMAIL must be an email, NUM a number, DATE YYYY-MM-DD, LINK an http/https URL, RATING 1-5.",
                        "For MULT_CHOICE and DROPDOWN, choose exactly one listed option. For CHECKBOXES, return an array of listed options.",
                        "Use null when the conversation does not contain enough information for a field or when an optional field is skipped.",
                        "Set isComplete true only when every required field has a valid value and every optional field has either a value or was skipped.",
                        "When isComplete is true, assistantMessage should briefly say you have everything and are submitting the form.",
                    ].join(" "),
                },
                {
                    role: "user",
                    content: JSON.stringify({
                        form: {
                            title: form.title,
                            description: form.description,
                            fields,
                        },
                        conversation: messages,
                    }),
                },
            ],
        }),
    });

    log("OpenRouter responded", {
        ok: completionResponse.ok,
        status: completionResponse.status,
        statusText: completionResponse.statusText,
    });

    if (!completionResponse.ok) {
        const errorBody = await completionResponse.text();
        let openRouterMessage = errorBody;

        try {
            const parsed = JSON.parse(errorBody) as { error?: { message?: string } };
            openRouterMessage = parsed.error?.message || errorBody;
        } catch {
            openRouterMessage = errorBody;
        }

        log("OpenRouter error body", {
            status: completionResponse.status,
            message: openRouterMessage,
        });

        throw new ConversationalResponseError(
            `OPENROUTER_REQUEST_FAILED_${completionResponse.status}`,
            completionResponse.status >= 400 && completionResponse.status < 500 ? completionResponse.status : 502,
            `OpenRouter rejected the request: ${openRouterMessage || completionResponse.statusText}`,
        );
    }

    const completion = await completionResponse.json() as {
        choices?: { message?: { content?: string } }[];
    };
    const content = completion.choices?.[0]?.message?.content;
    log("OpenRouter completion parsed", {
        choiceCount: completion.choices?.length || 0,
        hasContent: Boolean(content),
        contentPreview: content?.slice(0, 240),
    });

    if (!content) {
        throw new ConversationalResponseError(
            "LLM_EMPTY_RESPONSE",
            502,
            "OpenRouter returned an empty model response. Please try again.",
        );
    }

    const interview = parseInterviewResult(content);
    log("Interview JSON parsed", {
        isComplete: interview.isComplete,
        answerCount: interview.answers.length,
        assistantMessage: interview.assistantMessage,
    });
    const extractedByBlockId = new Map(interview.answers.map((answer) => [answer.blockId, answer.value]));

    const items = answerableBlocks.map((block) => ({
        blockId: block.id,
        value: coerceAnswerValue(block.type, extractedByBlockId.get(block.id), normalizeOptions(block.options)),
    }));

    const missingRequired = answerableBlocks
        .filter((block) => block.required && !items.find((item) => item.blockId === block.id)?.value)
        .map((block) => ({
            blockId: block.id,
            label: block.label,
            type: block.type,
            options: normalizeOptions(block.options),
        }));
    log("Validated extracted answers", {
        itemCount: items.length,
        missingRequiredCount: missingRequired.length,
        missingRequiredLabels: missingRequired.map((field) => field.label),
    });

    if (missingRequired.length > 0) {
        return {
            submitted: false,
            assistantMessage: interview.assistantMessage,
            isComplete: false,
            items,
            missingRequired,
        };
    }

    if (!interview.isComplete) {
        log("Interview continuing");
        return {
            submitted: false,
            assistantMessage: interview.assistantMessage,
            isComplete: false,
            items,
            missingRequired: [],
        };
    }

    const response = await createResponse(formId, items);
    log("Conversational response submitted", { responseId: response.id });

    return {
        submitted: true,
        assistantMessage: interview.assistantMessage,
        isComplete: true,
        response,
        items,
        missingRequired: [],
    };
}
