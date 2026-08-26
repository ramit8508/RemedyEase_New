import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiShoppingCart,
  FiPackage,
  FiFileText,
  FiFilter,
  FiCheck,
  FiAlertCircle,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiShield,
  FiTruck,
  FiPlus,
} from "react-icons/fi";
import "../../Css_for_all/MedicalStore.css";

const CATEGORIES = [
  "All",
  "Pain Relief",
  "Antibiotics",
  "Allergy",
  "Digestive",
  "Heart Health",
  "Supplements",
  "Dermatology",
];

export default function MedicalStoreHome() {
  const navigate = useNavigate();

  // State
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState({ categories: [], companies: [], priceRange: { min: 0, max: 500 } });
  const [prescriptions, setPrescriptions] = useState([]);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCompany, setSelectedCompany] = useState("All");
  const [maxPrice, setMaxPrice] = useState(500);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [prescriptionFilter, setPrescriptionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("popular");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // Selected supply duration map for cards: { [medId]: days }
  const [supplyMap, setSupplyMap] = useState({});
  // Add to cart animated button state: { [medId]: boolean }
  const [addedAnimation, setAddedAnimation] = useState({});

  // Toast
  const [toast, setToast] = useState(null);

  // Cart
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("medicalStoreCart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const abortControllerRef = useRef(null);

  // Load initial cart & prescriptions
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (user?.email) {
      fetch(`/api/v1/users/prescriptions?email=${encodeURIComponent(user.email)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.data)) {
            setPrescriptions(data.data);
          }
        })
        .catch(() => {});
    }

    // Fetch Metadata
    fetch("/api/v1/medicines/meta")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setMetadata(data.data);
          if (data.data.priceRange?.max) {
            setMaxPrice(data.data.priceRange.max);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Save cart changes
  useEffect(() => {
    try {
      localStorage.setItem("medicalStoreCart", JSON.stringify(cart));
    } catch (err) {
      console.error("Failed to save cart:", err);
    }
  }, [cart]);

  // Fetch medicines with debounce & AbortController
  const fetchMedicines = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);

    const params = new URLSearchParams();
    if (searchQuery.trim()) params.append("search", searchQuery.trim());
    if (selectedCategory !== "All") params.append("category", selectedCategory);
    if (selectedCompany !== "All") params.append("company", selectedCompany);
    if (maxPrice) params.append("maxPrice", maxPrice);
    if (inStockOnly) params.append("inStock", "true");
    if (prescriptionFilter !== "all") {
      params.append("prescriptionRequired", prescriptionFilter === "required" ? "true" : "false");
    }
    params.append("sortBy", sortBy);
    params.append("page", page);
    params.append("limit", 16);

    try {
      const res = await fetch(`/api/v1/medicines?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
      });
      const data = await res.json();
      if (data.success && data.data) {
        setMedicines(data.data.medicines || []);
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.totalPages || 1);
          setTotalResults(data.data.pagination.total || 0);
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error fetching medicines:", err);
      }
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedCompany, maxPrice, inStockOnly, prescriptionFilter, sortBy, page]);

  // 350ms debounced trigger for filter changes
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchMedicines();
    }, 350);

    return () => clearTimeout(handler);
  }, [fetchMedicines]);

  // Handle Add to Cart
  const handleAddToCart = (medicine) => {
    const medId = medicine._id || medicine.name;
    const days = supplyMap[medId] || 30;

    const existingIndex = cart.findIndex(
      (item) => item.name === medicine.name && item.company === medicine.company && item.daysSupply === days
    );

    let updatedCart = [...cart];
    if (existingIndex > -1) {
      updatedCart[existingIndex].quantity += 1;
    } else {
      updatedCart.push({
        medicineId: medicine._id,
        name: medicine.name,
        brand: medicine.brand || medicine.name,
        company: medicine.company,
        category: medicine.category,
        price: medicine.price,
        mrp: medicine.mrp,
        prescriptionRequired: Boolean(medicine.prescriptionRequired),
        daysSupply: days,
        quantity: 1,
        image: medicine.image,
      });
    }

    setCart(updatedCart);

    // Animation feedback
    setAddedAnimation((prev) => ({ ...prev, [medId]: true }));
    setTimeout(() => {
      setAddedAnimation((prev) => ({ ...prev, [medId]: false }));
    }, 1200);

    setToast({
      type: "success",
      message: `Added ${medicine.brand || medicine.name} (${days} days) to cart`,
    });
    setTimeout(() => setToast(null), 3000);
  };

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setSelectedCompany("All");
    setMaxPrice(metadata.priceRange?.max || 500);
    setInStockOnly(false);
    setPrescriptionFilter("all");
    setSortBy("popular");
    setPage(1);
  };

  return (
    <div className="ms-container">
      {/* Toast */}
      {toast && (
        <div className={`ms-toast ${toast.type === "success" ? "ms-toast--success" : "ms-toast--error"}`}>
          <FiCheck size={16} /> {toast.message}
        </div>
      )}

      {/* ─── Header ─── */}
      <header className="ms-header">
        <div className="ms-header-info">
          <h1>
            RemedyEase Medical Store <span className="ms-header-badge">✓ Verified Pharmacy</span>
          </h1>
          <p>Authentic medicines, wellness essentials, and prescription refills delivered to your door.</p>
        </div>

        <div className="ms-header-actions">
          <Link to="/user/dashboard/medical-store/orders" className="ms-btn-nav">
            <FiPackage size={16} /> My Orders
          </Link>
          <Link to="/user/dashboard/medical-store/cart" className="ms-btn-cart">
            <FiShoppingCart size={16} />
            <span>Cart</span>
            {totalCartCount > 0 && <span className="ms-cart-count-badge">{totalCartCount}</span>}
          </Link>
        </div>
      </header>

      {/* ─── Prescriptions Banner ─── */}
      {prescriptions.length > 0 && (
        <div className="ms-prescriptions-banner">
          <div className="ms-rx-info">
            <div className="ms-rx-icon">
              <FiFileText />
            </div>
            <div>
              <h3>Doctor Prescriptions Available ({prescriptions.length})</h3>
              <p>You have verified prescriptions from your previous RemedyEase consultations.</p>
            </div>
          </div>
          <div className="ms-rx-actions">
            <button
              className="ms-btn-nav"
              type="button"
              onClick={() => {
                if (prescriptions[0]?.prescriptionFile) {
                  window.open(prescriptions[0].prescriptionFile, "_blank");
                }
              }}
            >
              View Recent Rx PDF
            </button>
          </div>
        </div>
      )}

      {/* ─── Search & Category Filter Carousel ─── */}
      <section className="ms-search-section">
        <div className="ms-search-input-wrapper">
          <FiSearch size={18} className="ms-search-icon" />
          <input
            type="text"
            className="ms-search-input"
            placeholder="Search medicines by brand, generic name, category, or manufacturer..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
          />
          {searchQuery && (
            <button className="ms-search-clear" onClick={() => setSearchQuery("")} type="button">
              <FiX size={12} />
            </button>
          )}
        </div>

        <div className="ms-category-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`ms-category-pill ${selectedCategory === cat ? "ms-category-pill--active" : ""}`}
              onClick={() => {
                setSelectedCategory(cat);
                setPage(1);
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ─── Store Layout (Filters + Product Grid) ─── */}
      <div className="ms-store-layout">
        {/* Sidebar Filters */}
        <aside className="ms-filter-panel">
          <div className="ms-filter-header">
            <h3 className="ms-filter-title">
              <FiFilter size={16} /> Filters
            </h3>
            <button className="ms-filter-reset" onClick={handleResetFilters} type="button">
              Reset All
            </button>
          </div>

          {/* Manufacturer / Company */}
          <div className="ms-filter-group">
            <label className="ms-filter-label">Manufacturer</label>
            <select
              className="ms-filter-select"
              value={selectedCompany}
              onChange={(e) => {
                setSelectedCompany(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Manufacturers</option>
              {metadata.companies.map((comp) => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
          </div>

          {/* Max Price Range Slider */}
          <div className="ms-filter-group">
            <label className="ms-filter-label">Max Price: ₹{maxPrice}</label>
            <div className="ms-price-range-slider">
              <input
                type="range"
                className="ms-range-input"
                min="20"
                max={metadata.priceRange?.max || 500}
                step="10"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(Number(e.target.value));
                  setPage(1);
                }}
              />
              <div className="ms-price-limits">
                <span>₹20</span>
                <span>₹{metadata.priceRange?.max || 500}</span>
              </div>
            </div>
          </div>

          {/* Prescription Requirement */}
          <div className="ms-filter-group">
            <label className="ms-filter-label">Prescription Type</label>
            <select
              className="ms-filter-select"
              value={prescriptionFilter}
              onChange={(e) => {
                setPrescriptionFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Medicines</option>
              <option value="otc">Over-The-Counter (OTC)</option>
              <option value="required">Prescription Required</option>
            </select>
          </div>

          {/* In-Stock Only Toggle */}
          <div className="ms-filter-group">
            <label className="ms-toggle-item">
              <span>In-Stock Only</span>
              <input
                type="checkbox"
                className="ms-toggle-input"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  setPage(1);
                }}
              />
            </label>
          </div>

          {/* Quality Trust Box */}
          <div style={{ marginTop: "24px", padding: "14px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "#15803d", fontWeight: "700", fontSize: "13px", marginBottom: "4px" }}>
              <FiShield size={16} /> 100% Genuine Care
            </div>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "0", lineHeight: "1.4" }}>
              All medicines are verified by licensed pharmacists and stored in temperature-controlled facilities.
            </p>
          </div>
        </aside>

        {/* Main Product Area */}
        <main className="ms-products-area">
          {/* Results Bar & Sorting */}
          <div className="ms-results-bar">
            <span className="ms-results-count">
              Showing {medicines.length} of {totalResults} products
            </span>

            <div className="ms-sort-wrapper">
              <span>Sort by:</span>
              <select
                className="ms-sort-select"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(1);
                }}
              >
                <option value="popular">Popularity</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
                <option value="discount">Highest Discount</option>
              </select>
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="ms-medicine-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="ms-skeleton-card">
                  <div className="ms-shimmer" style={{ height: "90px", width: "100%" }} />
                  <div className="ms-shimmer" style={{ height: "18px", width: "70%" }} />
                  <div className="ms-shimmer" style={{ height: "14px", width: "50%" }} />
                  <div className="ms-shimmer" style={{ height: "24px", width: "40%" }} />
                  <div className="ms-shimmer" style={{ height: "36px", width: "100%", marginTop: "auto" }} />
                </div>
              ))}
            </div>
          ) : medicines.length === 0 ? (
            /* No Results Empty State */
            <div className="ms-empty-state">
              <div className="ms-empty-icon">
                <FiAlertCircle />
              </div>
              <h3>No medicines found</h3>
              <p>Try adjusting your search terms, changing the category, or clearing your active filters.</p>
              <button className="ms-btn-nav" onClick={handleResetFilters} type="button">
                Clear Filters
              </button>
            </div>
          ) : (
            /* Medicine Cards Grid */
            <div className="ms-medicine-grid">
              {medicines.map((med) => {
                const medId = med._id || med.name;
                const currentSupply = supplyMap[medId] || 30;
                const isAdded = Boolean(addedAnimation[medId]);
                const supplyOptions = med.supplyOptions || [15, 30, 45, 60];

                return (
                  <div key={medId} className="ms-card">
                    {/* Top Badges */}
                    <div className="ms-card-top">
                      {med.prescriptionRequired ? (
                        <span className="ms-badge-rx" title="Prescription required from a doctor">
                          Rx Required
                        </span>
                      ) : (
                        <span style={{ fontSize: "11px", color: "#15803d", fontWeight: "600" }}>✓ In Stock</span>
                      )}

                      {med.discountPercent > 0 && (
                        <span className="ms-badge-discount">Save {med.discountPercent}%</span>
                      )}
                    </div>

                    {/* Card Visual Container */}
                    <div className="ms-card-visual">
                      💊
                    </div>

                    {/* Category & Title */}
                    <span className="ms-card-category">{med.category}</span>
                    <h4 className="ms-card-title">{med.brand || med.name}</h4>
                    <p className="ms-card-brand">{med.name}</p>
                    <p className="ms-card-company">{med.company} • {med.dosageForm || "Tablet"}</p>

                    {/* Pricing */}
                    <div className="ms-card-pricing">
                      <span className="ms-card-price">₹{med.price}</span>
                      {med.mrp > med.price && <span className="ms-card-mrp">₹{med.mrp}</span>}
                    </div>

                    {/* Days Supply Selector */}
                    <div className="ms-supply-selector">
                      <span className="ms-supply-label">Supply duration</span>
                      <div className="ms-supply-chips">
                        {supplyOptions.map((days) => (
                          <button
                            key={days}
                            type="button"
                            className={`ms-supply-chip ${currentSupply === days ? "ms-supply-chip--active" : ""}`}
                            onClick={() =>
                              setSupplyMap((prev) => ({
                                ...prev,
                                [medId]: days,
                              }))
                            }
                          >
                            {days}d
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="ms-card-actions">
                      <button
                        type="button"
                        className={`ms-btn-add-cart ${isAdded ? "ms-btn-add-cart--added" : ""}`}
                        onClick={() => handleAddToCart(med)}
                      >
                        {isAdded ? (
                          <>
                            <FiCheck size={16} /> Added
                          </>
                        ) : (
                          <>
                            <FiPlus size={15} /> Add to Cart
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="ms-pagination">
              <button
                className="ms-page-btn"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                type="button"
              >
                <FiChevronLeft size={16} /> Previous
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNum = idx + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    className={`ms-page-btn ${page === pageNum ? "ms-page-btn--active" : ""}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                className="ms-page-btn"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                type="button"
              >
                Next <FiChevronRight size={16} />
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
