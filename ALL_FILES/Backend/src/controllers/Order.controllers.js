import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Order } from "../models/Order.models.js";
import { Medicine } from "../models/Medicine.models.js";

// 1. Create Order (with Idempotency, Inventory Check, and Server-Side Pricing)
export const createOrder = asyncHandler(async (req, res) => {
  const {
    idempotencyKey,
    userEmail,
    userName,
    items,
    deliveryAddress,
    paymentMethod = "cod",
    prescriptionFile,
  } = req.body;

  if (!userEmail || !userName) {
    throw new ApiError(400, "User authentication information is required");
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Your order must contain at least one item");
  }

  if (
    !deliveryAddress ||
    !deliveryAddress.fullName ||
    !deliveryAddress.phone ||
    !deliveryAddress.address ||
    !deliveryAddress.city ||
    !deliveryAddress.state ||
    !deliveryAddress.pincode
  ) {
    throw new ApiError(400, "Complete delivery address is required");
  }

  // Check Idempotency Key (Return existing order if request was already processed)
  if (idempotencyKey) {
    const existingOrder = await Order.findOne({ idempotencyKey }).lean();
    if (existingOrder) {
      console.log(`[ORDER] Idempotent hit: returning existing order ${existingOrder.orderId}`);
      return res
        .status(200)
        .json(new ApiResponse(200, existingOrder, "Order already placed successfully (idempotent)"));
    }
  }

  // 2. Server-Side Verification & Pricing of each item
  let computedSubtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    const requestedQty = Math.max(1, parseInt(item.quantity, 10) || 1);
    const daysSupply = parseInt(item.daysSupply, 10) || 30;

    // Search by medicine ID or name + company
    let medicineDoc = null;
    if (item.medicineId) {
      medicineDoc = await Medicine.findById(item.medicineId);
    }
    if (!medicineDoc && item.name && item.company) {
      medicineDoc = await Medicine.findOne({
        name: new RegExp(`^${item.name.trim()}$`, "i"),
        company: new RegExp(`^${item.company.trim()}$`, "i"),
      });
    }

    if (!medicineDoc) {
      // Fallback to name search
      medicineDoc = await Medicine.findOne({
        name: new RegExp(`^${(item.name || "").trim()}$`, "i"),
      });
    }

    // Determine verified price
    const verifiedPrice = medicineDoc ? medicineDoc.price : Number(item.price) || 50;
    const verifiedName = medicineDoc ? medicineDoc.name : item.name;
    const verifiedCompany = medicineDoc ? medicineDoc.company : item.company || "Standard";
    const verifiedCategory = medicineDoc ? medicineDoc.category : item.category || "General";

    // Stock check
    if (medicineDoc && medicineDoc.stockQuantity < requestedQty) {
      throw new ApiError(
        400,
        `Insufficient stock for "${verifiedName} (${verifiedCompany})". Only ${medicineDoc.stockQuantity} available.`
      );
    }

    const itemSubtotal = verifiedPrice * requestedQty;
    computedSubtotal += itemSubtotal;

    verifiedItems.push({
      medicineId: medicineDoc?._id || undefined,
      name: verifiedName,
      company: verifiedCompany,
      category: verifiedCategory,
      price: verifiedPrice,
      quantity: requestedQty,
      daysSupply,
      subtotal: itemSubtotal,
    });

    // Decrement stock atomically
    if (medicineDoc) {
      await Medicine.findByIdAndUpdate(medicineDoc._id, {
        $inc: { stockQuantity: -requestedQty },
      });
    }
  }

  // 3. Server-Side Fee & Total Calculation
  const deliveryFee = computedSubtotal >= 500 ? 0 : 40; // Free delivery above ₹500
  const discount = 0;
  const grandTotal = computedSubtotal + deliveryFee - discount;

  // 4. Generate Unique Order ID
  const orderId = `RE-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;

  const order = await Order.create({
    orderId,
    idempotencyKey: idempotencyKey || undefined,
    userEmail: userEmail.trim().toLowerCase(),
    userName: userName.trim(),
    items: verifiedItems,
    deliveryAddress: {
      fullName: deliveryAddress.fullName.trim(),
      phone: deliveryAddress.phone.trim(),
      email: deliveryAddress.email?.trim() || userEmail.trim(),
      address: deliveryAddress.address.trim(),
      city: deliveryAddress.city.trim(),
      state: deliveryAddress.state.trim(),
      pincode: deliveryAddress.pincode.trim(),
    },
    prescriptionFile: prescriptionFile || "",
    paymentMethod: paymentMethod === "online" ? "online" : "cod",
    paymentStatus: paymentMethod === "online" ? "paid" : "pending",
    subtotal: computedSubtotal,
    deliveryFee,
    discount,
    totalAmount: grandTotal,
    status: "confirmed",
    statusHistory: [
      {
        status: "confirmed",
        timestamp: new Date(),
        note: "Order received and confirmed by RemedyEase Pharmacy.",
      },
    ],
  });

  console.log(`[ORDER] Order created successfully: ${order.orderId} for ${userEmail}`);
  return res.status(201).json(new ApiResponse(201, order, "Order placed successfully"));
});

// 2. Get User Orders
export const getUserOrders = asyncHandler(async (req, res) => {
  const { userEmail } = req.params;
  const { status, page = 1, limit = 15 } = req.query;

  if (!userEmail) {
    throw new ApiError(400, "User email is required");
  }

  const query = { userEmail: userEmail.trim().toLowerCase() };

  if (status && status !== "all" && status !== "All") {
    if (status === "active") {
      query.status = { $in: ["confirmed", "processing", "shipped", "out_for_delivery"] };
    } else {
      query.status = status;
    }
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 15));
  const skip = (pageNum - 1) * limitNum;

  const [orders, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    Order.countDocuments(query),
  ]);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        orders,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
      "User orders fetched successfully"
    )
  );
});

// 3. Get Single Order by Order ID
export const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { userEmail } = req.query;

  const query = { orderId };
  if (userEmail) {
    query.userEmail = userEmail.trim().toLowerCase();
  }

  const order = await Order.findOne(query).lean();
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  return res.status(200).json(new ApiResponse(200, order, "Order details fetched successfully"));
});

// 4. Cancel Order (Restores Inventory)
export const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { userEmail, reason } = req.body;

  const query = { orderId };
  if (userEmail) {
    query.userEmail = userEmail.trim().toLowerCase();
  }

  const order = await Order.findOne(query);
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (order.status === "delivered") {
    throw new ApiError(400, "Delivered orders cannot be cancelled");
  }

  if (order.status === "cancelled") {
    throw new ApiError(400, "Order is already cancelled");
  }

  order.status = "cancelled";
  order.cancellationReason = reason || "Cancelled by customer";
  order.statusHistory.push({
    status: "cancelled",
    timestamp: new Date(),
    note: `Order cancelled. Reason: ${order.cancellationReason}`,
  });

  await order.save();

  // Restore inventory stock
  for (const item of order.items) {
    if (item.medicineId) {
      await Medicine.findByIdAndUpdate(item.medicineId, {
        $inc: { stockQuantity: item.quantity },
      });
    }
  }

  console.log(`[ORDER] Order cancelled and inventory restored: ${orderId}`);
  return res.status(200).json(new ApiResponse(200, order, "Order cancelled successfully"));
});
