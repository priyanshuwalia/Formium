import * as ResponseService from "./response.service.js";
import { ResponseError } from "./response.service.js";
import { ApiError, asyncHandler } from "../../utils/errors.js";
import prisma from "../../config/db.js";
const handleError = (res, err, context) => {
    if (err instanceof ResponseError) {
        res.status(err.status).json({ error: err.message });
        return;
    }
    console.error(`${context} error:`, err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
};
export const createResponseHandler = async (req, res) => {
    try {
        const { formId, items } = req.body;
        const response = await ResponseService.createResponse(formId, items);
        res.status(201).json(response);
    }
    catch (err) {
        handleError(res, err, "Create response");
    }
};
export const getResponsesHandler = async (req, res) => {
    try {
        const { formId } = req.params;
        const responses = await ResponseService.getResponseByForm(formId);
        res.json(responses);
    }
    catch (err) {
        handleError(res, err, "Fetch responses");
    }
};
export const getResponseHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const response = await ResponseService.getResponseById(id);
        if (!response) {
            res.status(404).json({ error: "Response not found" });
            return;
        }
        res.json(response);
    }
    catch (err) {
        handleError(res, err, "Fetch response");
    }
};
export const exportResponsesHandler = asyncHandler(async (req, res) => {
    const formId = typeof req.query.formId === "string" ? req.query.formId : undefined;
    if (!formId)
        throw new ApiError("Missing formId query param", 400);
    const form = await prisma.form.findUnique({
        where: { id: formId },
        select: { userId: true },
    });
    if (!form)
        throw new ApiError("Form not found", 404);
    if (form.userId !== req.user.id)
        throw new ApiError("Form not found", 404);
    const { csv, filename } = await ResponseService.buildResponsesCsv(formId);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
});
