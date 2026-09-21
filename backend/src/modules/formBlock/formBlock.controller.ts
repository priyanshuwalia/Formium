
import * as FormBlockService from "./formBlock.service.js";
import { FormBlockError } from "./formBlock.service.js";
import { Request, Response } from "express";

export const createFormBlockHandler = async (req: Request, res: Response) => {
    try {

        const block = await FormBlockService.createFormBlock(req.user.id, req.body);
        res.status(201).json(block);
    }
    catch (err: any) {
        if (err instanceof FormBlockError) {
            res.status(err.status).json({ error: err.message });
            return;
        }
        console.error("Error creating FormBlock:", err);
        res.status(500).json({ error: "Something went wrong. Please try again." })
    }
}

export const getBlocksByFormIdHandler = async (req: Request, res: Response) => {
    try {
        const { formId } = req.params;
        const blocks = await FormBlockService.getBlocksByFormId(formId);
        res.json(blocks ?? []);
    }
    catch (err) {
        console.error("Error fetching form blocks:", err);
        res.status(500).json({ error: "Failed to fetch form blocks" })
    }
}
export const updateBlockHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const userId = req.user.id;

        const updated = await FormBlockService.updateBlockById(id, userId, updateData);

        if (updated.count === 0) {
            res.status(404).json({ error: "block not found or unauthorized" })
            return
        }

        res.json({ message: "Block updated successfully" });
    } catch (err) {
        console.error("Error updating block:", err);
        res.status(500).json({ error: "Failed to update block" })
    }
}
export const deleteBlockHandler = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        
        const userId = req.user.id;
        const deleted = await FormBlockService.deleteBlockById(id, userId);

        if (deleted.count === 0) {
            res.status(404).json({ error: "Block not found or unauthorized" });
            return
        }

        res.json({ message: "Block deleted successfully" });
    } catch (err) {
        console.error("Error deleting block:", err);
        res.status(500).json({ error: "Failed to delete block" });
    }
};
