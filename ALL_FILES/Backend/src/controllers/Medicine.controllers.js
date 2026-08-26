import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Medicine } from "../models/Medicine.models.js";

// Comprehensive verified initial catalog for RemedyEase Pharmacy
const SEED_MEDICINES = [
  // Pain Relief & Fever
  { name: "Paracetamol 500mg", genericName: "Acetaminophen", brand: "Crocin", company: "GlaxoSmithKline", category: "Pain Relief", price: 25, mrp: 30, discountPercent: 16, inStock: true, stockQuantity: 250, prescriptionRequired: false, dosageForm: "Tablet", strength: "500mg", description: "Fast-acting relief for mild to moderate pain and fever reduction." },
  { name: "Paracetamol 650mg", genericName: "Acetaminophen", brand: "Dolo 650", company: "Micro Labs", category: "Pain Relief", price: 30, mrp: 35, discountPercent: 14, inStock: true, stockQuantity: 300, prescriptionRequired: false, dosageForm: "Tablet", strength: "650mg", description: "High-strength antipyretic and analgesic for fever and body ache." },
  { name: "Paracetamol 500mg", genericName: "Acetaminophen", brand: "Calpol", company: "GlaxoSmithKline", category: "Pain Relief", price: 28, mrp: 32, discountPercent: 12, inStock: true, stockQuantity: 180, prescriptionRequired: false, dosageForm: "Tablet", strength: "500mg", description: "Trusted pain relief and fever control for families." },
  { name: "Ibuprofen 400mg", genericName: "Ibuprofen", brand: "Brufen", company: "Abbott", category: "Pain Relief", price: 42, mrp: 50, discountPercent: 16, inStock: true, stockQuantity: 120, prescriptionRequired: false, dosageForm: "Tablet", strength: "400mg", description: "Non-steroidal anti-inflammatory drug (NSAID) for muscle and joint pain." },

  // Antibiotics & Anti-Infectives
  { name: "Amoxicillin 250mg", genericName: "Amoxicillin", brand: "Novamox", company: "Cipla", category: "Antibiotics", price: 120, mrp: 145, discountPercent: 17, inStock: true, stockQuantity: 95, prescriptionRequired: true, dosageForm: "Capsule", strength: "250mg", description: "Broad-spectrum penicillin antibiotic for bacterial infections." },
  { name: "Amoxicillin 500mg", genericName: "Amoxicillin", brand: "Mox", company: "Ranbaxy / Sun Pharma", category: "Antibiotics", price: 115, mrp: 140, discountPercent: 18, inStock: true, stockQuantity: 80, prescriptionRequired: true, dosageForm: "Capsule", strength: "500mg", description: "Effective treatment for respiratory and skin bacterial infections." },
  { name: "Azithromycin 500mg", genericName: "Azithromycin", brand: "Azithral", company: "Alembic", category: "Antibiotics", price: 130, mrp: 160, discountPercent: 19, inStock: true, stockQuantity: 110, prescriptionRequired: true, dosageForm: "Tablet", strength: "500mg", description: "Macrolide antibiotic commonly used for chest, throat, and sinus infections." },
  { name: "Ciprofloxacin 500mg", genericName: "Ciprofloxacin", brand: "Ciplox", company: "Cipla", category: "Antibiotics", price: 65, mrp: 80, discountPercent: 19, inStock: true, stockQuantity: 75, prescriptionRequired: true, dosageForm: "Tablet", strength: "500mg", description: "Fluoroquinolone antibiotic for urinary tract and gastrointestinal infections." },

  // Allergy & Respiratory
  { name: "Cetirizine 10mg", genericName: "Cetirizine HCl", brand: "Zyrtec", company: "Dr. Reddy's", category: "Allergy", price: 45, mrp: 55, discountPercent: 18, inStock: true, stockQuantity: 220, prescriptionRequired: false, dosageForm: "Tablet", strength: "10mg", description: "Second-generation antihistamine for seasonal allergies and hives." },
  { name: "Cetirizine 10mg", genericName: "Cetirizine HCl", brand: "Alerid", company: "Cipla", category: "Allergy", price: 40, mrp: 48, discountPercent: 17, inStock: true, stockQuantity: 190, prescriptionRequired: false, dosageForm: "Tablet", strength: "10mg", description: "Relief from runny nose, sneezing, and watery eyes." },
  { name: "Montelukast 10mg", genericName: "Montelukast", brand: "Montair", company: "Cipla", category: "Allergy", price: 165, mrp: 195, discountPercent: 15, inStock: true, stockQuantity: 65, prescriptionRequired: true, dosageForm: "Tablet", strength: "10mg", description: "Leukotriene receptor antagonist for asthma maintenance and allergic rhinitis." },

  // Digestive & Gastrointestinal
  { name: "Omeprazole 20mg", genericName: "Omeprazole", brand: "Omez", company: "Dr. Reddy's", category: "Digestive", price: 65, mrp: 78, discountPercent: 17, inStock: true, stockQuantity: 160, prescriptionRequired: false, dosageForm: "Capsule", strength: "20mg", description: "Proton pump inhibitor (PPI) that decreases stomach acid production." },
  { name: "Pantoprazole 40mg", genericName: "Pantoprazole", brand: "Pan 40", company: "Alkem", category: "Digestive", price: 110, mrp: 135, discountPercent: 19, inStock: true, stockQuantity: 140, prescriptionRequired: false, dosageForm: "Tablet", strength: "40mg", description: "Effective relief for acid reflux, GERD, and heartburn." },
  { name: "Digene Gel 200ml", genericName: "Magnesium Hydroxide + Aluminium Hydroxide", brand: "Digene", company: "Abbott", category: "Digestive", price: 145, mrp: 160, discountPercent: 9, inStock: true, stockQuantity: 70, prescriptionRequired: false, dosageForm: "Syrup", strength: "200ml", description: "Soothing mint antacid syrup for immediate acid and gas relief." },

  // Heart Health & Blood Pressure
  { name: "Aspirin 75mg", genericName: "Acetylsalicylic Acid", brand: "Ecosprin", company: "USV", category: "Heart Health", price: 30, mrp: 36, discountPercent: 17, inStock: true, stockQuantity: 280, prescriptionRequired: true, dosageForm: "Tablet", strength: "75mg", description: "Low-dose blood thinner for cardiovascular protection." },
  { name: "Amlodipine 5mg", genericName: "Amlodipine", brand: "Amlong", company: "Micro Labs", category: "Heart Health", price: 48, mrp: 60, discountPercent: 20, inStock: true, stockQuantity: 130, prescriptionRequired: true, dosageForm: "Tablet", strength: "5mg", description: "Calcium channel blocker for hypertension and angina." },
  { name: "Atorvastatin 10mg", genericName: "Atorvastatin", brand: "Atorva", company: "Zydus Cadila", category: "Heart Health", price: 115, mrp: 140, discountPercent: 18, inStock: true, stockQuantity: 90, prescriptionRequired: true, dosageForm: "Tablet", strength: "10mg", description: "Statin medication to lower LDL cholesterol and triglycerides." },

  // Vitamins & Supplements
  { name: "Vitamin D3 60k IU", genericName: "Cholecalciferol", brand: "Uprise-D3", company: "Alkem", category: "Supplements", price: 280, mrp: 330, discountPercent: 15, inStock: true, stockQuantity: 170, prescriptionRequired: false, dosageForm: "Capsule", strength: "60,000 IU", description: "Weekly vitamin D3 supplement for bone density and immunity." },
  { name: "Calcium + Vit D3", genericName: "Calcium Carbonate + Cholecalciferol", brand: "Shelcal 500", company: "Torrent Pharma", category: "Supplements", price: 135, mrp: 160, discountPercent: 16, inStock: true, stockQuantity: 210, prescriptionRequired: false, dosageForm: "Tablet", strength: "500mg", description: "Essential calcium supplement for healthy bones and joint support." },
  { name: "Vitamin C 500mg", genericName: "Ascorbic Acid", brand: "Limcee", company: "Abbott", category: "Supplements", price: 35, mrp: 42, discountPercent: 17, inStock: true, stockQuantity: 320, prescriptionRequired: false, dosageForm: "Tablet", strength: "500mg", description: "Orange chewable vitamin C for antioxidant and daily immune defence." },

  // Dermatology & Skin Care
  { name: "Betamethasone Cream", genericName: "Betamethasone Valerate", brand: "Betnovate-C", company: "GlaxoSmithKline", category: "Dermatology", price: 68, mrp: 80, discountPercent: 15, inStock: true, stockQuantity: 85, prescriptionRequired: true, dosageForm: "Cream", strength: "20g", description: "Topical corticosteroid for inflammatory skin conditions." },
  { name: "Clotrimazole 1%", genericName: "Clotrimazole", brand: "Candid", company: "Glenmark", category: "Dermatology", price: 95, mrp: 115, discountPercent: 17, inStock: true, stockQuantity: 105, prescriptionRequired: false, dosageForm: "Cream", strength: "30g", description: "Antifungal cream for skin infections, athlete's foot, and ringworm." }
];

// Helper to seed initial catalog if collection is empty
const ensureSeedData = async () => {
  try {
    const count = await Medicine.countDocuments();
    if (count === 0) {
      await Medicine.insertMany(SEED_MEDICINES);
      console.log("✅ Seeded initial RemedyEase medicine catalog");
    }
  } catch (err) {
    console.error("Error seeding medicine catalog:", err.message);
  }
};

// 1. Get Medicines (Paginated + Filtered + Sorted)
export const getMedicines = asyncHandler(async (req, res) => {
  await ensureSeedData();

  const {
    search,
    category,
    company,
    minPrice,
    maxPrice,
    prescriptionRequired,
    inStock,
    sortBy = "popular",
    page = 1,
    limit = 20,
  } = req.query;

  const query = {};

  // Search by keyword
  if (search && search.trim()) {
    const s = search.trim();
    const searchRegex = new RegExp(s, "i");
    query.$or = [
      { name: searchRegex },
      { genericName: searchRegex },
      { brand: searchRegex },
      { company: searchRegex },
      { category: searchRegex },
    ];
  }

  // Category filter
  if (category && category !== "all" && category !== "All") {
    query.category = { $regex: new RegExp(`^${category.trim()}$`, "i") };
  }

  // Company filter
  if (company && company !== "all" && company !== "All") {
    query.company = { $regex: new RegExp(`^${company.trim()}$`, "i") };
  }

  // Price range
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined && !isNaN(Number(minPrice))) {
      query.price.$gte = Number(minPrice);
    }
    if (maxPrice !== undefined && !isNaN(Number(maxPrice))) {
      query.price.$lte = Number(maxPrice);
    }
  }

  // Prescription required filter
  if (prescriptionRequired === "true" || prescriptionRequired === true) {
    query.prescriptionRequired = true;
  } else if (prescriptionRequired === "false" || prescriptionRequired === false) {
    query.prescriptionRequired = false;
  }

  // In stock filter
  if (inStock === "true" || inStock === true) {
    query.inStock = true;
    query.stockQuantity = { $gt: 0 };
  }

  // Sorting
  let sort = { createdAt: -1 };
  if (sortBy === "price_asc") {
    sort = { price: 1 };
  } else if (sortBy === "price_desc") {
    sort = { price: -1 };
  } else if (sortBy === "name_asc") {
    sort = { name: 1 };
  } else if (sortBy === "discount") {
    sort = { discountPercent: -1 };
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [medicines, total] = await Promise.all([
    Medicine.find(query).sort(sort).skip(skip).limit(limitNum).lean(),
    Medicine.countDocuments(query),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        medicines,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
      "Medicines fetched successfully"
    )
  );
});

// 2. Get Medicine Metadata (Unique categories, companies, min/max price bounds)
export const getMedicineMetadata = asyncHandler(async (req, res) => {
  await ensureSeedData();

  const [categories, companies, priceStats] = await Promise.all([
    Medicine.distinct("category"),
    Medicine.distinct("company"),
    Medicine.aggregate([
      {
        $group: {
          _id: null,
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
    ]),
  ]);

  const minPrice = priceStats[0]?.minPrice || 0;
  const maxPrice = priceStats[0]?.maxPrice || 500;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        categories: categories.sort(),
        companies: companies.sort(),
        priceRange: { min: minPrice, max: maxPrice },
      },
      "Medicine metadata fetched successfully"
    )
  );
});

// 3. Get Single Medicine by ID
export const getMedicineById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const medicine = await Medicine.findById(id).lean();

  if (!medicine) {
    throw new ApiError(404, "Medicine not found");
  }

  return res.status(200).json(new ApiResponse(200, medicine, "Medicine details fetched"));
});
