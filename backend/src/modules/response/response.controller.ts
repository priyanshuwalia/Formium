import { Request, Response } from "express";
import * as ResponseService from "./resposnse.service.js"
import { ConversationalResponseError } from "./resposnse.service.js";

export const createResponseHandler = async (req: Request, res: Response) => {
    if (!req.body) {
        res.status(400).json({ error: "Request body is empty" });
        return;
    }
    const { formId, items } = req.body;
    try {
        if (!formId || !items || !Array.isArray(items)) {
            res.status(400).json({ error: "formId and Items[] required" })
            return
        }
        const response = await ResponseService.createResponse(formId, items);
        res.status(201).json(response);
    } catch (err) {
        res.status(500).json({ error: "Couldnt submit Response", err });
    }
}
export const getResponsesHandler = async (req: Request, res: Response) => {
    try {
        const { formId } = req.params;
        const responses = await ResponseService.getResponseByForm(formId);
        res.status(201).json(responses)


    } catch (err) {
        res.status(500).json({ error: "Failed to fetch responses" });
    }
}

export const getResponseHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const response = await ResponseService.getResponseById(id);
        if (!response) {
            res.status(404).json({ error: "Response not found" });
            return;
        }
        res.json(response);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch response details" });
    }
}

export const createConversationalResponseHandler = async (req: Request, res: Response) => {
    const requestId = `conv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const log = (message: string, meta?: Record<string, unknown>) => {
        console.log(`[conversational-response:${requestId}] ${message}`, meta || "");
    };

    if (!req.body) {
        log("Rejected empty request body");
        res.status(400).json({ error: "Request body is empty" });
        return;
    }

    const { formId, messages, apiKey } = req.body;
    log("Request received", {
        formId,
        hasMessagesArray: Array.isArray(messages),
        messageCount: Array.isArray(messages) ? messages.length : undefined,
        hasApiKey: typeof apiKey === "string" && Boolean(apiKey.trim()),
        keySuffix: typeof apiKey === "string" ? apiKey.trim().slice(-4) : undefined,
    });

    try {
        if (!formId || typeof formId !== "string" || !Array.isArray(messages) || typeof apiKey !== "string") {
            log("Rejected invalid request payload", {
                formIdType: typeof formId,
                messagesType: Array.isArray(messages) ? "array" : typeof messages,
                apiKeyType: typeof apiKey,
            });
            res.status(400).json({ error: "formId, messages[], and apiKey required", requestId });
            return;
        }

        const normalizedMessages = messages
            .filter((message) => (
                message
                && ["user", "assistant"].includes(message.role)
                && typeof message.content === "string"
                && message.content.trim()
            ))
            .map((message) => ({
                role: message.role as "user" | "assistant",
                content: message.content.trim(),
            }));
        log("Messages normalized", { normalizedMessageCount: normalizedMessages.length });

        const result = await ResponseService.createConversationalResponse(formId, normalizedMessages, apiKey, log);

        log("Sending conversational response", {
            submitted: result.submitted,
            status: result.submitted ? 201 : 200,
            assistantMessage: result.assistantMessage,
        });
        res.status(result.submitted ? 201 : 200).json({ ...result, requestId });
    } catch (err) {
        console.error(`[conversational-response:${requestId}] Handler error`, err);

        if (err instanceof Error) {
            if (err.message === "FORM_NOT_FOUND") {
                res.status(404).json({ error: "Form not found", requestId });
                return;
            }

        }

        if (err instanceof ConversationalResponseError) {
            res.status(err.statusCode).json({ error: err.publicMessage, requestId });
            return;
        }

        const message = err instanceof Error ? err.message : "Unknown server error";
        res.status(500).json({
            error: `Couldnt submit conversational response: ${message}`,
            requestId,
        });
    }
}
