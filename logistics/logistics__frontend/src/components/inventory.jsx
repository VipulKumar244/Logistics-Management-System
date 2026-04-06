import React, { useState, useEffect, useMemo, useCallback } from 'react';

import {

  Package, PlusCircle, Search, Edit3, Trash2, X,

  ClipboardEdit, HardDrive, MapPin, CheckCircle2, Clock,

  ChevronRight

} from "lucide-react";



// ✅ 1. STATIC DATA

const professionalInventory = [

  { id: 1, name: "iPhone 15 Pro Max 256GB", variant: "Natural Titanium", brand: "Apple", category: "Electronics", sku: "AP-IP15PM-256", stock: 247, price: 159999, warehouse: "Chennai DC", location: "Zone A-12" },

  { id: 2, name: "Samsung Galaxy S24 Ultra", variant: "Titanium Black", brand: "Samsung", category: "Electronics", sku: "SA-GS24U-TB", stock: 189, price: 129999, warehouse: "Bengaluru DC", location: "Zone B-8" },

  { id: 3, name: "MacBook Air M3 16GB", variant: "Space Gray", brand: "Apple", category: "Electronics", sku: "AP-MBA-M3-16", stock: 76, price: 134900, warehouse: "Mumbai DC", location: "Zone C-5" },

  { id: 4, name: "Sony WH-1000XM5", variant: "Wireless ANC", brand: "Sony", category: "Electronics", sku: "SO-WHXM5-BK", stock: 542, price: 34999, warehouse: "Hyderabad DC", location: "Zone D-3" },

  { id: 5, name: "Apple Watch Series 9", variant: "45mm GPS", brand: "Apple", category: "Electronics", sku: "AP-AWS9-45", stock: 312, price: 44900, warehouse: "Delhi DC", location: "Zone E-7" },

  { id: 6, name: "Cotton Oversized T-Shirt", variant: "Black XL", brand: "Roadster", category: "Apparel", sku: "RD-OT-BLK-XL", stock: 1247, price: 599, warehouse: "Chennai DC", location: "Zone F-2" },

  { id: 7, name: "Slim Fit Denim Jeans", variant: "Blue Wash 32", brand: "Jack & Jones", category: "Apparel", sku: "JJ-SFD-BLW-32", stock: 876, price: 2499, warehouse: "Bengaluru DC", location: "Zone F-9" },

  { id: 8, name: "Nike Air Max 270", variant: "Triple Black", brand: "Nike", category: "Apparel", sku: "NK-AM270-TB", stock: 198, price: 12495, warehouse: "Mumbai DC", location: "Zone G-4" },

  { id: 9, name: "Leather Wallet RFID", variant: "Brown", brand: "Wildhorn", category: "Apparel", sku: "WH-LWRF-BRN", stock: 1567, price: 1299, warehouse: "Hyderabad DC", location: "Zone H-1" },

  { id: 10, name: "Philips Air Fryer XXL", variant: "Digital 7.3L", brand: "Philips", category: "Home & Kitchen", sku: "PH-AFXXL-D7", stock: 89, price: 16995, warehouse: "Delhi DC", location: "Zone I-6" },

  { id: 11, name: "Non-Stick Kadhai Set", variant: "3-Piece Triply", brand: "Prestige", category: "Home & Kitchen", sku: "PR-NSK-3PC", stock: 342, price: 2149, warehouse: "Chennai DC", location: "Zone J-2" },

  { id: 12, name: "Memory Foam Queen Pillow", variant: "Anti-Microbial", brand: "Sleepwell", category: "Home & Kitchen", sku: "SL-MFQP-AM", stock: 654, price: 1799, warehouse: "Bengaluru DC", location: "Zone K-8" },

  { id: 13, name: "Minimalist Vitamin C Serum", variant: "20% + E Ferulic", brand: "Minimalist", category: "Beauty", sku: "MN-VCS-20E", stock: 987, price: 699, warehouse: "Mumbai DC", location: "Zone L-3" },

  { id: 14, name: "Philips OneBlade Hybrid", variant: "Trimmer QP2724", brand: "Philips", category: "Beauty", sku: "PH-OBHQ-2724", stock: 432, price: 2999, warehouse: "Hyderabad DC", location: "Zone M-5" },

  { id: 15, name: "India Gate Basmati Rice", variant: "5kg Classic", brand: "India Gate", category: "Grocery", sku: "IG-BR5-C", stock: 2567, price: 749, warehouse: "Delhi DC", location: "Zone N-1" },

  { id: 16, name: "Surf Excel Liquid Detergent", variant: "2L Easy Wash", brand: "Surf Excel", category: "Grocery", sku: "SX-LD2-EW", stock: 1892, price: 499, warehouse: "Chennai DC", location: "Zone O-9" },

  { id: 17, name: "IKEA MALM Bed Frame", variant: "Queen White", brand: "IKEA", category: "Furniture", sku: "IK-MALM-QW", stock: 34, price: 24999, warehouse: "Bengaluru DC", location: "Zone P-4" },

  { id: 18, name: "Yonex Carbon Badminton Racket", variant: "Nanoray Light 18i", brand: "Yonex", category: "Sports", sku: "YX-NRL18I", stock: 123, price: 3290, warehouse: "Mumbai DC", location: "Zone Q-7" }

];



// ✅ 2. SUB-COMPONENTS

function InventoryStat({ title, value, color, icon, onClick }) {

  const colors = { slate: "text-slate-900", green: "text-green-600", amber: "text-amber-500", red: "text-red-500" };

  return (

    <div onClick={onClick} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all cursor-pointer hover:scale-[1.02] hover:shadow-xl">

      <div className="flex justify-between items-start">

        <div>

          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>

          <h2 className={`text-3xl font-black mt-2 ${colors[color]}`}>{value}</h2>

        </div>

        {icon}

      </div>

    </div>

  );

}



function StockBadge({ qty }) {

  const status = qty === 0 ? "Out of Stock" : qty <= 200 ? "Low Stock" : "In Stock";

  const styles = {

    "In Stock": "bg-green-50 text-green-700 border-green-100",

    "Low Stock": "bg-amber-50 text-amber-700 border-amber-100",

    "Out of Stock": "bg-red-50 text-red-700 border-red-100"

  };

  return <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${styles[status]}`}>{status}</span>;

}



// ✅ 3. MAIN COMPONENT

export default function Inventory() {

  //const [itemsList, setItemsList] = useState([]); // Start empty

  const [itemsList, setItemsList] = useState(() => {
    try {
      const stored = localStorage.getItem('logistics_inventory');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to read inventory from localStorage', error);
    }
    return professionalInventory;
  });

  const [activeTab, setActiveTab] = useState('all');

  const [searchQuery, setSearchQuery] = useState('');

// Add these to your state declarations
const [editingId, setEditingId] = useState(null);
const [editForm, setEditForm] = useState({});

// Toggle Edit Mode
const startEdit = (item) => {
  setEditingId(item.id);
  setEditForm({ ...item });
};

const handleUpdate = () => {
  if (!editingId) return;

  setItemsList(prev => prev.map(item =>
    item.id === editingId ? { ...item, ...editForm, stock: Number(editForm.stock) } : item
  ));

  setEditingId(null);
  setEditForm({});
};

  // --- NEW: Add Item States ---

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [newItem, setNewItem] = useState({

    name: '', brand: '', variant: '', category: 'Electronics',

    sku: '', stock: 0, warehouse: '', location: ''

  });



  // Handlers

  const handleDeleteItem = useCallback((id) => {

    if(window.confirm("Remove this item from inventory?")) {

      setItemsList(prev => prev.filter(item => item.id !== id));

    }

  }, []);



  // Add this handler alongside handleDeleteItem

const handleEditItem = useCallback((item) => {

  setNewItem(item); // Pre-fill the form with existing data

  setIsAddModalOpen(true); // Open the same modal

}, []);







  // --- NEW: Handle Add Submission ---

  const handleSaveItem = (e) => {

    e.preventDefault();

    const id = Date.now(); // Generate a unique ID

    setItemsList(prev => [...prev, { ...newItem, id }]);

    setIsAddModalOpen(false); // Close modal

    // Reset form

    setNewItem({ name: '', brand: '', variant: '', category: 'Electronics', sku: '', stock: 0, warehouse: '', location: '' });

  };

  useEffect(() => {
    try {
      localStorage.setItem('logistics_inventory', JSON.stringify(itemsList));
    } catch (error) {
      console.warn('Failed to save inventory to localStorage', error);
    }
  }, [itemsList]);



  // Filter Logic

  const filteredItems = useMemo(() => {

    let result = itemsList;

   

    // Category/Tab filter

    if (activeTab !== 'all' && activeTab !== 'low-stock') {

      result = result.filter(item => item.category?.toLowerCase() === activeTab);

    } else if (activeTab === 'low-stock') {

      result = result.filter(item => (item.stock || 0) <= 50 && (item.stock || 0) > 0);

    }



    // Search filter (Functional with Black Text in UI)

    if (searchQuery.trim()) {

      const query = searchQuery.toLowerCase();

      result = result.filter(item =>

        item.name.toLowerCase().includes(query) ||

        item.sku?.toLowerCase().includes(query) ||

        item.brand?.toLowerCase().includes(query)

      );

    }

    return result;

  }, [itemsList, activeTab, searchQuery]);



  // ... (rest of the component JSX)

  // Categories Calculation

  const categories = useMemo(() => {

    return [

      { id: 'all', label: 'All Items' },

      { id: 'electronics', label: 'Electronics' },

      { id: 'apparel', label: 'Apparel' },

      { id: 'home & kitchen', label: 'Home & Kitchen' },

      { id: 'beauty', label: 'Beauty' },

      { id: 'grocery', label: 'Grocery' },

      { id: 'low-stock', label: 'Low Stock' }

    ];

  }, []);



  return (

    <div className="p-6 lg:p-12 space-y-10 bg-slate-50 min-h-screen">

     

      {/* Stats Grid */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <InventoryStat title="Total SKUs" value={itemsList.length} color="slate" icon={<Package className="text-slate-400" size={24}/>}/>

        <InventoryStat title="In Stock" value={itemsList.filter(i => i.stock > 50).length} color="green" icon={<CheckCircle2 size={24} className="text-green-400"/>}/>

        <InventoryStat title="Low Stock" value={itemsList.filter(i => i.stock <= 50 && i.stock > 0).length} color="amber" icon={<Clock size={24} className="text-amber-400"/>}/>

        <InventoryStat title="Out of Stock" value={itemsList.filter(i => i.stock === 0).length} color="red" icon={<X size={24} className="text-red-400"/>}/>

      </div>



      {/* Main Table Container */}

      <div className="bg-white rounded-[2.5rem] shadow-2xl border-2 border-slate-100 overflow-hidden flex flex-col">

       

    {/* Header Section */}

<div className="p-8 border-b-2 border-slate-100 bg-gradient-to-r from-slate-50 to-indigo-50">

  <div className="flex flex-col lg:flex-row justify-between items-center gap-6">

   

    {/* Left Side: Title & Icon */}

    <div className="flex items-center gap-4">

      <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg">

        <HardDrive className="text-white" size={20} />

      </div>

      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Stock Ledger</h2>

    </div>



    {/* Right Side: Toolbar (Search + Add Button) */}

    <div className="flex items-center gap-2 w-full lg:w-auto">

     

      {/* Search Bar Wrapper */}

      <div className="relative flex-1 lg:w-80 group">

        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />

        <input

          type="text"

          value={searchQuery}

          onChange={(e) => setSearchQuery(e.target.value)}

          placeholder="Search SKUs..."

          className="w-full pl-14 pr-5 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-semibold text-slate-900 outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400 shadow-sm"

        />

      </div>



      {/* Add Button - Aligned Beside Search */}

      <button

        onClick={() => setIsAddModalOpen(true)}

        title="Add New Asset"

        className="flex items-center justify-center px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl transition-all active:scale-95 shadow-md border border-slate-800 shrink-0 h-[48px]"

      >

        <PlusCircle size={18} className="text-indigo-400" />

        <span className="ml-2 text-xs font-bold whitespace-nowrap">Add</span>

      </button>



    </div>

  </div>

</div>





        {/* Tab Navigation */}

        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50 overflow-x-auto flex gap-2">

          {categories.map(cat => (

            <button

              key={cat.id}

              onClick={() => setActiveTab(cat.id)}

              className={`px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${

                activeTab === cat.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'

              }`}

            >

              {cat.label}

            </button>

          ))}

        </div>







{isAddModalOpen && (

  <div className="fixed inset-0 z-[50] flex items-center justify-center bg-slate-900/20 backdrop-blur-md p-4 animate-in fade-in duration-300">

    <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform animate-in zoom-in-95 duration-200">

     

      {/* Header */}

      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">

        <div>

          <h2 className="text-lg font-bold text-slate-900">Add New Asset</h2>

          <p className="text-xs text-slate-500">Register all product and logistics details below.</p>

        </div>

        <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">

          <X size={20} />

        </button>

      </div>



      {/* Form Body */}

      <form onSubmit={handleSaveItem} className="p-6 space-y-5">

       

        {/* Row 1: Product & Brand */}

        <div className="grid grid-cols-2 gap-4">

          <div className="space-y-1.5">

            <label className="text-[12px] font-semibold text-slate-700">Product Name</label>

            <input required

              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"

              placeholder="e.g. MacBook Pro"

              onChange={(e) => setNewItem({...newItem, name: e.target.value})}

            />

          </div>

          <div className="space-y-1.5">

            <label className="text-[12px] font-semibold text-slate-700">Brand</label>

            <input required

              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"

              placeholder="e.g. Apple"

              onChange={(e) => setNewItem({...newItem, brand: e.target.value})}

            />

          </div>

        </div>



        {/* Row 2: Variant & Category */}

        <div className="grid grid-cols-2 gap-4">

          <div className="space-y-1.5">

            <label className="text-[12px] font-semibold text-slate-700">Variant/Model</label>

            <input

              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"

              placeholder="e.g. 16GB / 512GB"

              onChange={(e) => setNewItem({...newItem, variant: e.target.value})}

            />

          </div>

          <div className="space-y-1.5">

            <label className="text-[12px] font-semibold text-slate-700">Category</label>

            <select

              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"

              onChange={(e) => setNewItem({...newItem, category: e.target.value})}

            >

              <option value="Electronics">Electronics</option>

              <option value="grocery">Grocery</option>

              <option value="beauty">Beauty</option>

              <option value="Home & kitchen">Home & kitchen</option>
<option value="Apparel">Apparel</option>

            </select>

          </div>

        </div>



        {/* Row 3: SKU & Stock */}

        <div className="grid grid-cols-2 gap-4">

          <div className="space-y-1.5">

            <label className="text-[12px] font-semibold text-slate-700">SKU Code</label>

            <input required

              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"

              placeholder="AP-MBP-16"

              onChange={(e) => setNewItem({...newItem, sku: e.target.value})}

            />

          </div>

          <div className="space-y-1.5">

            <label className="text-[12px] font-semibold text-slate-700">Stock Count</label>

            <input type="number" required

              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"

              onChange={(e) => setNewItem({...newItem, stock: parseInt(e.target.value) || 0})}

            />

          </div>

        </div>



        {/* Row 4: Logistics (Warehouse & Location) */}

        <div className="grid grid-cols-2 gap-4">

          <div className="space-y-1.5">

            <label className="text-[12px] font-semibold text-slate-700">Warehouse</label>

            <input required

              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"

              placeholder="Main DC"

              onChange={(e) => setNewItem({...newItem, warehouse: e.target.value})}

            />

          </div>

          <div className="space-y-1.5">

            <label className="text-[12px] font-semibold text-slate-700">Zone / Location</label>

            <input required

              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"

              placeholder="Zone B-12"

              onChange={(e) => setNewItem({...newItem, location: e.target.value})}

            />

          </div>

        </div>



        {/* Action Buttons */}

        <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">

       

          <button

            type="submit"

            className="px-8 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-lg active:scale-95 transition-all"

          >

            Confirm & Save

          </button>

        </div>

      </form>

    </div>

  </div>

)}




<table className="w-full">
  <thead className="bg-slate-50">
    <tr>
      <th className="px-28 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-600">Product Details</th>
      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-600">SKU</th>
      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-600">Stock</th>
      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-600">Price</th>
      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-600">Warehouse</th>
      <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-widest text-slate-600">Actions</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-slate-50">
  {filteredItems.map((item) => (
    <tr key={item.id} className={`group transition-all ${editingId === item.id ? 'bg-indigo-50/30' : 'hover:bg-slate-50/80'}`}>
      
      {/* 1. PRODUCT DETAILS */}
      <td className="px-28 py-4"> {/* Tightened padding from 8 to 6, 6 to 4 */}
        {editingId === item.id ? (
          <div className="flex flex-col gap-1">
            <input 
              value={editForm.name} 
              onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              placeholder="Product Name"
              className="w-full px-3 py-1.5 bg-white border-2 border-indigo-200 rounded-lg text-sm font-bold text-black outline-none focus:border-indigo-500 shadow-sm"
            />
            <input 
              value={editForm.brand} 
              onChange={(e) => setEditForm({...editForm, brand: e.target.value})}
              placeholder="Brand"
              className="w-full px-3 py-1 bg-white border border-slate-200 rounded-md text-[10px] font-black uppercase text-black outline-none"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-400 shrink-0">
              {item.category?.charAt(0) || 'P'}
            </div>
            <div className="truncate">
              <p className="font-black text-slate-900 text-sm truncate">{item.name}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{item.brand} • {item.variant}</p>
            </div>
          </div>
        )}
      </td>

      {/* 2. SKU CODE */}
      <td className="px-12 py-8">
        {editingId === item.id ? (
          <input 
            value={editForm.sku} 
            onChange={(e) => setEditForm({...editForm, sku: e.target.value})}
            className="w-28 px-3 py-1.5 bg-white border-2 border-slate-200 rounded-lg font-mono text-xs text-black outline-none focus:border-indigo-500"
          />
        ) : (
          <span className="font-mono text-[11px] font-bold bg-slate-100 px-2.5 py-1 rounded-md text-slate-600">
            {item.sku}
          </span>
        )}
      </td>

      {/* 3. STOCK LEVEL + SLIDER */}
      <td className="px-12 py-8">
        {editingId === item.id ? (
          <div className="flex flex-col gap-1.5 w-40">
            <div className="flex justify-between items-center px-1">
              <span className={`text-[11px] font-black ${editForm.stock < 100 ? "text-red-600" : "text-black"}`}>
                {editForm.stock} Qty
              </span>
              <span className="text-[9px] font-bold text-slate-400">MAX 1000</span>
            </div>
            <input 
              type="range" min="0" max="1000" step="10" value={editForm.stock}
              onChange={(e) => setEditForm({...editForm, stock: parseInt(e.target.value)})}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="text-base font-black text-slate-900">{item.stock}</span>
            <StockBadge qty={item.stock} />
          </div>
        )}
      </td>

      {/* 4. WAREHOUSE */}
      <td className="px-12 py-8">
        {editingId === item.id ? (
          <div className="flex flex-col gap-1">
            <input 
              value={editForm.warehouse} 
              onChange={(e) => setEditForm({...editForm, warehouse: e.target.value})}
              className="w-full px-3 py-1.5 bg-white border-2 border-slate-200 rounded-lg text-xs font-bold text-black outline-none focus:border-indigo-500"
            />
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600">
              <MapPin size={12} /> {item.warehouse}
            </div>
            <p className="text-[9px] text-slate-400 uppercase font-black mt-0.5">{item.location}</p>
          </div>
        )}
      </td>

      {/* 5. ACTIONS */}
      <td className="px-12 py-8 text-right">
        <div className="flex justify-end gap-1.5">
          {editingId === item.id ? (
            <>
              <button onClick={handleUpdate} className="p-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all active:scale-90">
                <CheckCircle2 size={16} />
              </button>
              <button onClick={() => { setEditingId(null); setEditForm({}); }} className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-all active:scale-90">
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => startEdit(item)} className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Edit">
                <Edit3 size={16} />
              </button>
              <button onClick={() => handleDeleteItem(item.id)} className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all" title="Delete">
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  ))}
</tbody>
</table>

{filteredItems.length === 0 && (

            <div className="p-20 text-center">

              <Package size={48} className="mx-auto text-slate-200 mb-4" />

              <p className="text-slate-400 font-bold">No items found matching your criteria.</p>

            </div>

          )}

        </div>

      </div>

    

  );

}