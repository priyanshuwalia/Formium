


import * as FormService from "./form.service.js";
import { Request, Response } from "express";

export const createFormHandler = async (req: Request, res: Response) => {
   try {
    const form = await FormService.createForm({ ...req.body, userId: req.user.id });
    res.status(201).json(form);
   }
   catch (err) {
        console.error("Create form error:", err);
        res.status(400).json({ error: "Failed to create form" })
   }
}
export const getFormHandler = async (req: Request, res: Response) => {
    try {

        const form = await FormService.getFormBySlug(req.params.slug);
        if (!form) { res.status(404).json({ error: "Form not found" })
        return }
    res.json(form);
    }
    catch (err) {
        console.error("Fetch form error:", err);
        res.status(500).json({ error: "Failed to fetch form" });
    }
}
export const getUserFormsHandler = async (req: Request, res: Response) => {
  try {

    const userId = req.user.id;

    const forms = await FormService.getFormbyUserId(userId);


    if (!forms || forms.length === 0) {
       res.json({ error: "No forms found for this user" });
       return
    }
    res.json(forms);
  } catch (err) {
    console.error("Fetch user forms error:", err);
    res.status(500).json({ error: "Failed to fetch forms" });
  }
};
export const updateFormHandler = async (req: Request, res: Response) => {
  try {
    const {id} = req.params;
    const {title, description} = req.body;

    const userId= req.user.id;
    const updated = await FormService.updateFormById(id, userId, {title, description});

    if (updated.count === 0) {
       res.status(404).json({ error: "Form not found or you don’t have permission." });
       return
    }
    res.json({ message: "Form updated successfully." });
  } catch (err) {
    console.error("Update form error:", err);
    res.status(500).json({ error: "Failed to update form" })
  }}
  export const deleteFormHandler = async (req: Request, res: Response) => {
    try{
      const {id} = req.params;

      const userId= req.user.id;

      const deleted = await FormService.deleteFormById(id, userId);

      if(deleted.count === 0) {
        res.status(404).json({error: "Form Not Found or not owned by you"});
        return
      }
      res.json({message:"Form Deleted successfully"});
    } catch (err) {
      console.error("Delete form error:", err);
      res.status(500).json({ error: "Failed to delete form" })
    }
  }
