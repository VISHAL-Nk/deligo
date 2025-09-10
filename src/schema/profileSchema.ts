import User from "@/models/User.models";
import {z} from "zod";

const genders = ["Male", "Female", "Other", "Prefer not to say"] as const;

export const profileSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    phone: z.string().length(10, "Phone number must be at least 10 digits"),
    gender: z.enum(genders),
    dateOfBirth: z
        .string()
        .refine((date) => !isNaN(Date.parse(date)), {
            message: "Invalid date format",
        })
});

export type ProfileType = z.infer<typeof profileSchema>;