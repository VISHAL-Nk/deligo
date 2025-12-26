/*
WISHLIST {
    userId: ObjectId,          // Reference to USER
    products: [
        {
            productId: ObjectId,  // Reference to PRODUCTS
            addedAt: Date,        // When product was added
            priceAtAdd: Number,   // Price when added (for price drop alerts)
            priceAlertEnabled: Boolean  // Notify when price drops
        }
    ],
    updatedAt: Date
}
*/

import mongoose, { Document, Model } from "mongoose";

// TypeScript interfaces
export interface IWishlistItem {
  productId: mongoose.Types.ObjectId;
  addedAt: Date;
  priceAtAdd: number;
  priceAlertEnabled: boolean;
  notifiedAt: Date | null;
}

export interface IWishlist extends Document {
  userId: mongoose.Types.ObjectId;
  products: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IWishlistModel extends Model<IWishlist> {
  getByUserId(userId: string): Promise<IWishlist | null>;
  addProduct(userId: string, productId: string, priceAtAdd: number): Promise<IWishlist>;
  removeProduct(userId: string, productId: string): Promise<IWishlist | null>;
  hasProduct(userId: string, productId: string): Promise<boolean>;
  togglePriceAlert(userId: string, productId: string, enabled: boolean): Promise<IWishlist | null>;
  findUsersWithPriceAlert(productId: string): Promise<unknown[]>;
  getProductWishlistCount(productId: string): Promise<number>;
}

const WishlistItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    addedAt: { 
      type: Date, 
      default: Date.now 
    },
    priceAtAdd: { 
      type: Number, 
      required: true 
    },
    priceAlertEnabled: { 
      type: Boolean, 
      default: false 
    },
    notifiedAt: {
      type: Date,  // Last time user was notified of price drop
      default: null,
    },
  },
  { _id: false }
);

const WishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    products: {
      type: [WishlistItemSchema],
      default: [],
      validate: {
        validator: function (v: unknown[]) {
          return v.length <= 50; // Max 50 items
        },
        message: "Wishlist cannot contain more than 50 items",
      },
    },
  },
  { timestamps: true }
);

// Index for faster user lookups
WishlistSchema.index({ userId: 1 });

// Index for finding products in wishlists (useful for price drop notifications)
WishlistSchema.index({ "products.productId": 1 });

// Index for price alert queries
WishlistSchema.index({ 
  "products.priceAlertEnabled": 1, 
  "products.productId": 1 
});

// Static method to get wishlist by user ID
WishlistSchema.statics.getByUserId = async function (userId: string) {
  return this.findOne({ userId })
    .populate({
      path: "products.productId",
      select: "_id name price discount images stock status categoryId sellerId",
    })
    .lean();
};

// Static method to add product to wishlist
WishlistSchema.statics.addProduct = async function (
  userId: string,
  productId: string,
  priceAtAdd: number
) {
  return this.findOneAndUpdate(
    { userId },
    {
      $addToSet: {
        products: {
          productId,
          priceAtAdd,
          addedAt: new Date(),
        },
      },
    },
    { upsert: true, new: true }
  );
};

// Static method to remove product from wishlist
WishlistSchema.statics.removeProduct = async function (
  userId: string,
  productId: string
) {
  return this.findOneAndUpdate(
    { userId },
    {
      $pull: { products: { productId } },
    },
    { new: true }
  );
};

// Static method to check if product is in wishlist
WishlistSchema.statics.hasProduct = async function (
  userId: string,
  productId: string
): Promise<boolean> {
  const count = await this.countDocuments({
    userId,
    "products.productId": productId,
  });
  return count > 0;
};

// Static method to toggle price alert
WishlistSchema.statics.togglePriceAlert = async function (
  userId: string,
  productId: string,
  enabled: boolean
) {
  return this.findOneAndUpdate(
    { userId, "products.productId": productId },
    {
      $set: { "products.$.priceAlertEnabled": enabled },
    },
    { new: true }
  );
};

// Static method to find users with price alerts for a product
WishlistSchema.statics.findUsersWithPriceAlert = async function (
  productId: string
) {
  return this.find({
    "products.productId": productId,
    "products.priceAlertEnabled": true,
  })
    .select("userId products.$")
    .populate("userId", "email name")
    .lean();
};

// Static method to get product count in wishlists (for popularity metrics)
WishlistSchema.statics.getProductWishlistCount = async function (
  productId: string
): Promise<number> {
  const result = await this.aggregate([
    { $unwind: "$products" },
    { $match: { "products.productId": new mongoose.Types.ObjectId(productId) } },
    { $count: "count" },
  ]);
  return result.length > 0 ? result[0].count : 0;
};

const Wishlist =
  (mongoose.models?.Wishlist as IWishlistModel) ||
  mongoose.model<IWishlist, IWishlistModel>("Wishlist", WishlistSchema);

export default Wishlist;
