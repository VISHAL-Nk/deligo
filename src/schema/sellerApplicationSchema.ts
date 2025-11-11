import {z} from "zod";

export const sellerApplicationSchema = z.object({
    businessName: z.string().min(1, "Business name is required"),
    gstNumber: z.string(),
    panNumber: z.string(),
    bankDetails: z.object({
        accountMasked: z.string().min(1, "Account number is required"),
        ifsc: z.string().min(1, "IFSC code is required"),
        bankName: z.string().min(1, "Bank name is required"),
    }),
    store: z.array(
        z.object({
            name: z.string().min(1, "Store name is required"),
            address: z.string().min(1, "Store address is required"),
        })
    ).min(1, "At least one store is required"),
});

export type SellerApplicationType = z.infer<typeof sellerApplicationSchema>;