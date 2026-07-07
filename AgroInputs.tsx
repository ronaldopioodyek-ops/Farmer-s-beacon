import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { AgroInput } from "../types";
import { 
  Sprout, 
  Plus, 
  Trash2, 
  Phone, 
  Filter, 
  ShoppingBag, 
  DollarSign, 
  Loader2, 
  MessageSquare,
  Sparkles,
  Search,
  CheckCircle,
  AlertCircle,
  ShoppingCart,
  Minus,
  X,
  RotateCcw
} from "lucide-react";

interface AgroInputsProps {
  isAdmin: boolean;
}

const INITIAL_INPUTS: Omit<AgroInput, "id">[] = [
  {
    title: "Premium Hybrid Maize Seeds (DK8031)",
    description: "Drought-tolerant, disease-resistant hybrid maize seeds. Excellent choice for high-yield harvests under varying rain patterns.",
    price: 18.50,
    unit: "per 2kg bag",
    category: "Seeds",
    imageUrl: "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&q=80&w=400",
    stock: 120,
    contactPhone: "+256772123456",
    createdAt: Date.now() - 500000
  },
  {
    title: "Organic NPK Leaf Fertilizer",
    description: "Natural organic liquid foliar fertilizer rich in Nitrogen, Phosphorus, and Potassium. Boosts crop growth and improves leaf structure.",
    price: 12.00,
    unit: "per 1L bottle",
    category: "Fertilizers",
    imageUrl: "https://images.unsplash.com/photo-1599599810769-bcde5a160d32?auto=format&fit=crop&q=80&w=400",
    stock: 45,
    contactPhone: "+256772123456",
    createdAt: Date.now() - 400000
  },
  {
    title: "Eco-Shield Neem Pest Guard",
    description: "Broad-spectrum organic insecticide made from neem seed extract. Highly effective against aphids, armyworms, and whiteflies.",
    price: 24.00,
    unit: "per 500ml can",
    category: "Pesticides",
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&q=80&w=400",
    stock: 30,
    contactPhone: "+256772123456",
    createdAt: Date.now() - 300000
  },
  {
    title: "Ergonomic Hand Pruning Shears",
    description: "High-grade stainless steel blade hand shears for clean pruning of tree branches, vines, and shrubs. Non-slip handles.",
    price: 9.99,
    unit: "per unit",
    category: "Tools",
    imageUrl: "https://images.unsplash.com/photo-1598965402049-74e5ad5db132?auto=format&fit=crop&q=80&w=400",
    stock: 15,
    contactPhone: "+256772123456",
    createdAt: Date.now() - 200000
  }
];

export default function AgroInputs({ isAdmin }: AgroInputsProps) {
  const [inputs, setInputs] = useState<AgroInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Form States
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("per bag");
  const [category, setCategory] = useState<AgroInput["category"]>("Seeds");
  const [imageUrl, setImageUrl] = useState("");
  const [stock, setStock] = useState("");
  const [contactPhone, setContactPhone] = useState("+256772123456");
  const [submitting, setSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Cart State
  const [cart, setCart] = useState<{ product: AgroInput; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Navigation and History State
  const [activeTab, setActiveTab] = useState<"Marketplace" | "Orders">("Marketplace");
  const [orderHistory, setOrderHistory] = useState<{ id: string, date: number, items: {product: AgroInput, quantity: number}[], total: number }[]>([]);

  const addToCart = (product: AgroInput) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, product.stock) }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setCheckoutSuccess(false);
  };

  const updateCartQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === id) {
          const newQty = Math.max(1, Math.min(item.quantity + delta, item.product.stock));
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleCheckout = () => {
    // In a real app, this would create an order in Firestore
    const newOrder = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      date: Date.now(),
      items: [...cart],
      total: cartTotal
    };
    
    setOrderHistory((prev) => [newOrder, ...prev]);
    setCart([]);
    setCheckoutSuccess(true);
    setTimeout(() => {
      setCheckoutSuccess(false);
      setIsCartOpen(false);
    }, 3000);
  };

  const handleReorder = (order: { items: {product: AgroInput, quantity: number}[] }) => {
    setCart((prev) => {
      const newCart = [...prev];
      order.items.forEach(orderItem => {
        const existing = newCart.find(item => item.product.id === orderItem.product.id);
        if (existing) {
          existing.quantity = Math.min(existing.quantity + orderItem.quantity, existing.product.stock);
        } else {
          newCart.push({ ...orderItem, quantity: Math.min(orderItem.quantity, orderItem.product.stock) });
        }
      });
      return newCart;
    });
    setCheckoutSuccess(false);
    setIsCartOpen(true);
  };

  const fetchInputs = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "agro_inputs"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const loadedInputs: AgroInput[] = [];
      snapshot.forEach((doc) => {
        loadedInputs.push({ id: doc.id, ...doc.data() } as AgroInput);
      });

      if (loadedInputs.length === 0) {
        // Seed initial data if database is empty
        const promises = INITIAL_INPUTS.map(async (item) => {
          try {
            const docRef = await addDoc(collection(db, "agro_inputs"), item);
            return { id: docRef.id, ...item } as AgroInput;
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, "agro_inputs");
            throw err;
          }
        });
        const seeded = await Promise.all(promises);
        setInputs(seeded);
      } else {
        setInputs(loadedInputs);
      }
    } catch (error) {
      console.error("Error reading agro inputs:", error);
      handleFirestoreError(error, OperationType.LIST, "agro_inputs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInputs();
  }, []);

  const handleCreateInput = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFormSuccess(false);

    try {
      const parsedPrice = parseFloat(price);
      const parsedStock = parseInt(stock);

      if (isNaN(parsedPrice) || parsedPrice <= 0) {
        throw new Error("Please enter a valid positive price.");
      }
      if (isNaN(parsedStock) || parsedStock < 0) {
        throw new Error("Please enter a valid non-negative stock quantity.");
      }

      // Default stock photo if none is provided
      const finalImageUrl = imageUrl.trim() || "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?auto=format&fit=crop&q=80&w=400";

      const newItem: Omit<AgroInput, "id"> = {
        title: title.trim(),
        description: description.trim(),
        price: parsedPrice,
        unit: unit.trim(),
        category,
        imageUrl: finalImageUrl,
        stock: parsedStock,
        contactPhone: contactPhone.trim(),
        createdAt: Date.now()
      };

      let docRef;
      try {
        docRef = await addDoc(collection(db, "agro_inputs"), newItem);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, "agro_inputs");
        throw err;
      }
      
      setInputs((prev) => [{ id: docRef.id, ...newItem }, ...prev]);
      setFormSuccess(true);
      
      // Clear Form fields
      setTitle("");
      setDescription("");
      setPrice("");
      setUnit("per bag");
      setCategory("Seeds");
      setImageUrl("");
      setStock("");
      
      setTimeout(() => {
        setShowForm(false);
        setFormSuccess(false);
      }, 1500);

    } catch (err: any) {
      console.error("Error creating input item:", err);
      setFormError(err.message || "Failed to list item. Make sure you are authenticated.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInput = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this listing?")) return;

    try {
      await deleteDoc(doc(db, "agro_inputs", id));
      setInputs((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Error deleting input item:", err);
      handleFirestoreError(err, OperationType.DELETE, `agro_inputs/${id}`);
      alert("Failed to delete input. Verify credentials.");
    }
  };

  const filteredInputs = inputs.filter((item) => {
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="agro-inputs-section" className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-semibold text-2xl text-slate-900 dark:text-white flex items-center gap-2">
            <Sprout className="w-6 h-6 text-emerald-600" />
            <span>Agro-Input Marketplace</span>
          </h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Purchase premium-grade certified seeds, fertilizers, livestock vaccines, and agricultural tools.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("Marketplace")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "Marketplace" 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" 
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Catalog
            </button>
            <button
              onClick={() => setActiveTab("Orders")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === "Orders" 
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs" 
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Order History
            </button>
          </div>

          {activeTab === "Marketplace" && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xs transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {cart.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          )}
          
          {isAdmin && activeTab === "Marketplace" && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-md transition-all"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>{showForm ? "Close Form" : "List New Input"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Marketplace Catalog Tab */}
      {activeTab === "Marketplace" && (
        <>
          {/* Admin New Item Form */}
          {showForm && isAdmin && (
        <form onSubmit={handleCreateInput} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-display font-semibold text-base text-slate-800 dark:text-white">
            List a New Agro-Input Item
          </h3>

          {formSuccess && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 p-3 rounded-lg text-xs border border-emerald-100">
              <CheckCircle className="w-4 h-4" />
              <span>Item listed successfully!</span>
            </div>
          )}

          {formError && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-lg text-xs border border-red-100">
              <AlertCircle className="w-4 h-4" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Item Title *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Premium Hybrid Maize Seeds"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AgroInput["category"])}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="Seeds">Seeds</option>
                <option value="Fertilizers">Fertilizers</option>
                <option value="Pesticides">Pesticides</option>
                <option value="Tools">Tools</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Price ($ USD) *</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Unit description *</label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g., per 5kg bag, per 1L container"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Stock Available *</label>
              <input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="e.g., 50"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Contact Number *</label>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+256772123456"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Image URL (Optional)</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://images.unsplash.com/... or leave empty for generic placeholder"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Description *</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about certifications, usage guidelines, active ingredients, or organic properties."
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Listing Item...</span>
              </>
            ) : (
              <span>Add Agro-Input Item</span>
            )}
          </button>
        </form>
      )}

      {/* Filter and Search controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl shadow-2xs">
        <div className="flex flex-wrap gap-2 flex-1">
          {["All", "Seeds", "Fertilizers", "Pesticides", "Tools", "Other"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all border ${
                activeCategory === cat
                  ? "bg-emerald-600 border-emerald-600 text-white"
                  : "bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-750"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search inputs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-850 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <span className="text-xs font-medium">Loading agro-inputs marketplace...</span>
        </div>
      ) : filteredInputs.length === 0 ? (
        <div className="bg-slate-50 border border-slate-100 text-center py-12 rounded-2xl">
          <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-semibold text-slate-700">No agro-inputs found</h4>
          <p className="text-slate-400 text-xs mt-1">Try resetting the filters or your search query.</p>
        </div>
      ) : (
        /* Grid of Inputs */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredInputs.map((item) => (
            <div 
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden flex flex-col hover:shadow-xs transition-shadow relative group"
            >
              <div className="h-40 bg-slate-100 relative overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-md text-[10px] font-bold text-emerald-800 border border-emerald-100 shadow-2xs">
                  {item.category}
                </span>

                {isAdmin && (
                  <button
                    onClick={() => handleDeleteInput(item.id)}
                    className="absolute top-3 right-3 p-2 bg-white hover:bg-red-50 text-red-500 hover:text-red-700 rounded-full shadow-md transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-display font-semibold text-sm text-slate-800 dark:text-white line-clamp-1">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 h-8">
                    {item.description}
                  </p>

                  <div className="mt-4 flex items-baseline justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-bold text-slate-900 dark:text-white">
                        ${item.price.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {item.unit}
                      </span>
                    </div>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      item.stock > 10 
                        ? "bg-emerald-50 text-emerald-700" 
                        : item.stock > 0 
                        ? "bg-amber-50 text-amber-700" 
                        : "bg-red-50 text-red-700"
                    }`}>
                      {item.stock > 0 ? `${item.stock} in stock` : "Out of stock"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-50 dark:border-slate-800 flex gap-2">
                  <button
                    onClick={() => addToCart(item)}
                    disabled={item.stock <= 0}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-medium text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Add to Cart</span>
                  </button>
                  <a
                    href={`tel:${item.contactPhone}`}
                    className="px-3 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl flex items-center justify-center transition-colors"
                    title="Call Seller"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}

      {/* Order History Tab */}
      {activeTab === "Orders" && (
        <div className="space-y-6">
          {orderHistory.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center">
              <ShoppingBag className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">No Past Orders</h3>
              <p className="text-sm text-slate-500 mb-6 max-w-sm">
                You haven't purchased any agro-inputs yet. Browse the catalog to find seeds, fertilizers, and tools for your farm.
              </p>
              <button
                onClick={() => setActiveTab("Marketplace")}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {orderHistory.map((order) => (
                <div key={order.id} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col">
                  <div className="flex justify-between items-start mb-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Order #{order.id}
                      </span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {new Date(order.date).toLocaleDateString(undefined, { 
                          year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                      Completed
                    </span>
                  </div>
                  
                  <div className="flex-1 space-y-3 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-100">
                            <img src={item.product.imageUrl} alt={item.product.title} className="w-full h-full object-cover" />
                          </div>
                          <span className="text-slate-600 dark:text-slate-300 truncate">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{item.quantity}x</span> {item.product.title}
                          </span>
                        </div>
                        <span className="font-medium text-slate-700 dark:text-slate-300 shrink-0 ml-4">
                          ${(item.product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center mt-auto">
                    <div>
                      <span className="font-semibold text-slate-500 text-xs block mb-0.5">Total Paid</span>
                      <span className="font-display font-bold text-lg text-slate-900 dark:text-white">
                        ${order.total.toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleReorder(order)}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-slate-50 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800/50 rounded-xl transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Reorder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Cart Modal Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2 text-slate-800 dark:text-white">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                Your Cart
              </h3>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {checkoutSuccess ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full flex items-center justify-center mb-2">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="font-display font-bold text-xl text-slate-800 dark:text-white">Order Confirmed!</h4>
                  <p className="text-slate-500 text-sm">Thank you for your purchase. We'll contact you shortly for delivery.</p>
                </div>
              ) : cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 dark:bg-slate-800 rounded-full flex items-center justify-center mb-2">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <h4 className="font-medium text-slate-800 dark:text-white">Your cart is empty</h4>
                  <p className="text-slate-500 text-sm">Add some agro-inputs to get started.</p>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="mt-4 px-6 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 font-medium text-sm rounded-xl transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
                        <img src={item.product.imageUrl} alt={item.product.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-semibold text-sm text-slate-800 dark:text-white line-clamp-1">{item.product.title}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">${item.product.price.toFixed(2)} {item.product.unit}</p>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-xs">
                            <button 
                              onClick={() => updateCartQuantity(item.product.id, -1)}
                              className="px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-2 text-xs font-semibold w-8 text-center border-x border-slate-200 dark:border-slate-700">
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => updateCartQuantity(item.product.id, 1)}
                              disabled={item.quantity >= item.product.stock}
                              className="px-2 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-50 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.product.id)}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!checkoutSuccess && cart.length > 0 && (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-4 text-slate-800 dark:text-white">
                  <span className="font-medium text-sm">Total</span>
                  <span className="font-display font-bold text-xl">${cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleCheckout}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md transition-colors flex justify-center items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Checkout Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
