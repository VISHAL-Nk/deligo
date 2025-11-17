import { z } from "zod";

export const deliveryApplicationSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must not exceed 15 digits"),
  vehicleType: z.enum(["bike", "scooter", "car", "van"]),
  licenseNumber: z
    .string()
    .min(5, "License number must be at least 5 characters")
    .max(20, "License number must not exceed 20 characters"),
  region: z.string().min(2, "Region must be at least 2 characters"),
  hasInsurance: z.boolean(),
  hasVehicleRegistration: z.boolean(),
  accountHolderName: z
    .string()
    .min(3, "Account holder name must be at least 3 characters")
    .optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  upiId: z.string().optional(),
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
});

export type DeliveryApplicationInput = z.infer<
  typeof deliveryApplicationSchema
>;
