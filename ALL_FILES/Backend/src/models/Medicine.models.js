import mongoose from "mongoose";

const MedicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    genericName: {
      type: String,
      trim: true,
      default: "",
      index: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    mrp: {
      type: Number,
      min: 0,
      default: function () {
        return Math.round(this.price * 1.18);
      },
    },
    discountPercent: {
      type: Number,
      default: 0,
    },
    inStock: {
      type: Boolean,
      default: true,
      index: true,
    },
    stockQuantity: {
      type: Number,
      default: 100,
      min: 0,
    },
    prescriptionRequired: {
      type: Boolean,
      default: false,
      index: true,
    },
    dosageForm: {
      type: String,
      default: "Tablet", // Tablet, Capsule, Syrup, Injection, Cream, Drops
      trim: true,
    },
    strength: {
      type: String,
      default: "",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    supplyOptions: {
      type: [Number],
      default: [15, 30, 45, 60], // Days supply
    },
  },
  { timestamps: true }
);

// Compound text index for search
MedicineSchema.index({
  name: "text",
  genericName: "text",
  brand: "text",
  company: "text",
  category: "text",
});

export const Medicine = mongoose.model("medicines", MedicineSchema);
