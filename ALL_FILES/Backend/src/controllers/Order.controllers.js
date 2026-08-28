import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Order } from "../models/Order.models.js";
import { Medicine } from "../models/Medicine.models.js";

function sanitizeText(str, maxLen = 300) {
  if (typeof str !== "string") return "";
  return str.replace(/<[^>]*>/g, "").trim().slice(0, maxLen);
}

// 1. Create Order (with Idempotency, Inventory Check, and Server-Side Pricing)
export const createOrder = asyncHandler(async (req, res) => {
  const {
    idempotencyKey,
    userEmail: bodyEmail,
    userName: bodyName,
    items,
    deliveryAddress,
    paymentMethod = "cod",
    prescriptionFile,
  } = req.body;

  // Use authenticated user if logged in, otherwise fallback to validated body email
  const userEmail = (req.user?.email || bodyEmail)?.trim()?.toLowerCase();
  const userName = (req.user?.fullname || bodyName)?.trim();

  if (!userEmail || !userName) {
    throw new ApiError(400, "Customer contact details are required");
  }

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, "Your order must contain at least one medication or product");
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

  // Idempotency check
  if (idempotencyKey) {
    const existingOrder = await Order.findOne({ idempotencyKey }).lean();
    if (existingOrder) {
      return res
        .status(200)
        .json(new ApiResponse(200, existingOrder, "Order already placed successfully (idempotent)"));
    }
  }

  // Server-Side Verification & Pricing of each item
  let computedSubtotal = 0;
  const verifiedItems = [];

  for (const item of items) {
    const requestedQty = Math.max(1, Math.min(100, parseInt(item.quantity, 10) || 1));
    const daysSupply = Math.max(1, Math.min(365, parseInt(item.daysSupply, 10) || 30));

    let medicineDoc = null;
    if (item.medicineId) {
      medicineDoc = await Medicine.findById(item.medicineId);
    }
    if (!medicineDoc && item.name && item.company) {
      medicineDoc = await Medicine.findOne({
        name: new RegExp(`^${sanitizeText(item.name)}$`, "i"),
        company: new RegExp(`^${sanitizeText(item.company)}$`, "i"),
      });
    }
    if (!medicineDoc && item.name) {
      medicineDoc = await Medicine.findOne({
        name: new RegExp(`^${sanitizeText(item.name)}$`, "i"),
      });
    }

    const verifiedPrice = medicineDoc ? medicineDoc.price : Math.max(10, Number(item.price) || 50);
    const verifiedName = medicineDoc ? medicineDoc.name : sanitizeText(item.name || "Medicine", 100);
    const verifiedCompany = medicineDoc ? medicineDoc.company : sanitizeText(item.company || "Standard", 100);
    const verifiedCategory = medicineDoc ? medicineDoc.category : sanitizeText(item.category || "General", 100);

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

    if (medicineDoc) {
      await Medicine.findByIdAndUpdate(medicineDoc._id, {
        $inc: { stockQuantity: -requestedQty },
      });
    }
  }

  const deliveryFee = computedSubtotal >= 500 ? 0 : 40;
  const discount = 0;
  const grandTotal = computedSubtotal + deliveryFee - discount;
  const orderId = `RE-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;

  const order = await Order.create({
    orderId,
    idempotencyKey: idempotencyKey ? sanitizeText(idempotencyKey, 100) : undefined,
    userEmail,
    userName: sanitizeText(userName, 100),
    items: verifiedItems,
    deliveryAddress: {
      fullName: sanitizeText(deliveryAddress.fullName, 100),
      phone: sanitizeText(deliveryAddress.phone, 20),
      email: sanitizeText(deliveryAddress.email || userEmail, 100),
      address: sanitizeText(deliveryAddress.address, 300),
      city: sanitizeText(deliveryAddress.city, 100),
      state: sanitizeText(deliveryAddress.state, 100),
      pincode: sanitizeText(deliveryAddress.pincode, 20),
    },
    prescriptionFile: prescriptionFile ? sanitizeText(prescriptionFile, 500) : "",
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

  return res.status(201).json(new ApiResponse(201, order, "Order placed successfully"));
});

// 2. Get User Orders (Protected by verifyUser)
export const getUserOrders = asyncHandler(async (req, res) => {
  const requestedEmail = req.params.userEmail?.toLowerCase()?.trim();
  const authenticatedEmail = req.user.email.toLowerCase();

  // IDOR Protection
  if (requestedEmail && requestedEmail !== authenticatedEmail) {
    throw new ApiError(403, "Access denied: You cannot view orders of another account.");
  }

  const { status, page = 1, limit = 15 } = req.query;
  const query = { userEmail: authenticatedEmail };

  if (status && status !== "all" && status !== "All") {
    if (status === "active") {
      query.status = { $in: ["confirmed", "processing", "shipped", "out_for_delivery"] };
    } else {
      query.status = sanitizeText(status, 30);
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

// 3. Get Single Order by Order ID (Protected)
export const getOrderById = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userEmail = (req.user?.email || req.query.userEmail)?.trim()?.toLowerCase();

  const query = { orderId };
  if (userEmail) {
    query.userEmail = userEmail;
  }

  const order = await Order.findOne(query).lean();
  if (!order) {
    throw new ApiError(404, "Order not found or access unauthorized");
  }

  // If user is authenticated, ensure they own the order
  if (req.user && order.userEmail.toLowerCase() !== req.user.email.toLowerCase()) {
    throw new ApiError(403, "Access denied: You do not have permission to view this order.");
  }

  return res.status(200).json(new ApiResponse(200, order, "Order details fetched successfully"));
});

// 4. Cancel Order (Restores Inventory, IDOR Protected)
export const cancelOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const userEmail = (req.user?.email || req.body.userEmail)?.trim()?.toLowerCase();
  const reason = sanitizeText(req.body.reason || "Cancelled by customer", 200);

  const order = await Order.findOne({ orderId });
  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  if (userEmail && order.userEmail.toLowerCase() !== userEmail.toLowerCase()) {
    throw new ApiError(403, "Access denied: You cannot cancel another user's order.");
  }

  if (order.status === "delivered") {
    throw new ApiError(400, "Delivered orders cannot be cancelled");
  }

  if (order.status === "cancelled") {
    throw new ApiError(400, "Order is already cancelled");
  }

  order.status = "cancelled";
  order.cancellationReason = reason;
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

  return res.status(200).json(new ApiResponse(200, order, "Order cancelled successfully"));
});
