import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  ClipboardEdit, PlusCircle, Package, MapPin, 
  Search, Trash2, Edit3, X, CheckCircle2, 
  ExternalLink, Printer, Clock, FileText 
} from "lucide-react";


export default function Orders() {
  const [orders, setOrders] = useState(() => {
    const saved = localStorage.getItem("fleet_orders");
    return saved ? JSON.parse(saved) : [
      { id: "ORD-1021", customer: "Amazon Warehouse", location: "Chennai", status: "Delivered", date: "2026-03-12" },
      { id: "ORD-1022", customer: "Flipkart Hub", location: "Bangalore", status: "In Transit", date: "2026-03-11" },
    ];
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null); 
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newOrder, setNewOrder] = useState({
    id: "", customer: "", location: "", status: "Pending", date: new Date().toISOString().split('T')[0]
  });

 
  useEffect(() => {
    localStorage.setItem("fleet_orders", JSON.stringify(orders));
  }, [orders]);

  const handleCreate = (e) => {
    e.preventDefault();
    setOrders([...orders, { ...newOrder }]);
    setIsAddModalOpen(false);
    setNewOrder({ id: "", customer: "", location: "", status: "Pending", date: new Date().toISOString().split('T')[0] });
  };

  const startEdit = (order) => {
    setEditingId(order.id);
    setEditForm({ ...order });
  };

  const saveEdit = () => {
    setOrders(orders.map(o => o.id === editingId ? editForm : o));
    setEditingId(null);
  };

  const handleDelete = (id) => {
    if (window.confirm("Delete this transaction from history?")) {
      setOrders(orders.filter(o => o.id !== id));
    }
  };

  const stats = useMemo(() => ({
    total: orders.length,
    delivered: orders.filter(o => o.status === "Delivered").length,
    transit: orders.filter(o => o.status === "In Transit").length,
    pending: orders.filter(o => o.status === "Pending").length,
  }), [orders]);

  const filteredOrders = orders.filter(o => 
    o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-10 space-y-8 bg-slate-50 min-h-screen font-sans">
      
   
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
            <ClipboardEdit className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Order Ledger</h1>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Transaction Tracking System</p>
          </div>
        </div>

        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl hover:bg-black transition-all shadow-xl active:scale-95 font-bold text-sm"
        >
          <PlusCircle size={18} className="text-blue-400" />
          Add New Dispatch
        </button>
      </div>

     
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Volume" value={stats.total} color="slate" icon={<Package size={20}/>} />
        <StatCard title="Successful" value={stats.delivered} color="green" icon={<CheckCircle2 size={20}/>} />
        <StatCard title="On Route" value={stats.transit} color="amber" icon={<Clock size={20}/>} />
        <StatCard title="Awaiting" value={stats.pending} color="red" icon={<X size={20}/>} />
      </div>

     
      <div className="bg-white rounded-[2.5rem] shadow-2xl border-2 border-slate-100 overflow-hidden">
       
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/30">
          <h2 className="font-black text-slate-800 text-lg">Recent Dispatches</h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search Ledger..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">Order Reference</th>
                <th className="px-8 py-5">Client Entity</th>
                <th className="px-8 py-5">Hub Location</th>
                <th className="px-8 py-5">Dispatch Date</th>
                <th className="px-8 py-5">Status</th>
                <th className="px-8 py-5 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOrders.map((order) => (
                <tr key={order.id} className={`group transition-all ${editingId === order.id ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'}`}>
                  
                 
                  <td className="px-8 py-6">
                    {editingId === order.id ? (
                      <input value={editForm.id} onChange={e => setEditForm({...editForm, id: e.target.value})} className="w-24 p-2 border-2 border-blue-200 text-slate-900 rounded-xl bg-white font-bold text-xs" />
                    ) : (
                      <span className="font-black text-slate-900">{order.id}</span>
                    )}
                  </td>

                
                  <td className="px-8 py-6">
                    {editingId === order.id ? (
                      <input value={editForm.customer} onChange={e => setEditForm({...editForm, customer: e.target.value})} className="w-full p-2 border-2 border-blue-200 rounded-xl bg-white text-slate-900 font-bold text-xs" />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-xl text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all"><Package size={14}/></div>
                        <span className="font-bold text-slate-700 text-sm">{order.customer}</span>
                      </div>
                    )}
                  </td>

               
                  <td className="px-8 py-6">
                    {editingId === order.id ? (
                      <input value={editForm.location} onChange={e => setEditForm({...editForm, location: e.target.value})} className="w-full p-2 border-2 border-blue-200 rounded-xl bg-white text-slate-900 font-bold text-xs" />
                    ) : (
                      <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
                        <MapPin size={14} className="text-blue-500" />
                        {order.location}
                      </div>
                    )}
                  </td>

                  <td className="px-8 py-6">
                    {editingId === order.id ? (
                      <input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} className="p-2 border-2 border-blue-200 rounded-xl bg-white text-slate-900 text-xs font-bold"  style={{ colorScheme: "light" }}/>
                    ) : (
                      <span className="text-xs font-black text-slate-400">{order.date}</span>
                    )}
                  </td>

                 
                  <td className="px-8 py-6">
                    {editingId === order.id ? (
                      <select value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})} className="p-2 border-2 border-blue-200 rounded-xl bg-white text-xs text-slate-900 font-bold">
                        <option>Pending</option>
                        <option>In Transit</option>
                        <option>Delivered</option>
                      </select>
                    ) : (
                      <StatusBadge status={order.status} />
                    )}
                  </td>

                 
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                      {editingId === order.id ? (
                        <>
                          <button onClick={saveEdit} className="p-2.5 bg-blue-600 text-slate rounded-xl shadow-lg hover:bg-blue-700"><CheckCircle2 size={16}/></button>
                          <button onClick={() => setEditingId(null)} className="p-2.5 bg-slate-200 text-slate-500 rounded-xl hover:bg-slate-300"><X size={16}/></button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setSelectedOrder(order)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all font-black text-[10px] uppercase tracking-tighter">View Detail</button>
                          <button onClick={() => startEdit(order)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl"><Edit3 size={16}/></button>
                          <button onClick={() => handleDelete(order.id)} className="p-2.5 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-xl"><Trash2 size={16}/></button>
                        </>
                      )}
                    </div>
                    
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && <div className="p-20 text-center font-black text-black-300 uppercase tracking-widest text-xs">No Records Found</div>}
        </div>
      </div>

     
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-3xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black text-slate-900">Initiate Dispatch</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors"><X size={20}/></button>
            </div>
            <form onSubmit={handleCreate} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Order ID" placeholder="ORD-XXXX" value={newOrder.id} onChange={v => setNewOrder({...newOrder, id: v})} required />
                <Input label="Hub City" placeholder="e.g. Mumbai" value={newOrder.location} onChange={v => setNewOrder({...newOrder, location: v})} required />
              </div>
              <Input label="Customer Entity" placeholder="Legal Name" value={newOrder.customer} onChange={v => setNewOrder({...newOrder, customer: v})} required />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Initial Status</label>
                  <select 
                    className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500"
                    value={newOrder.status}
                    onChange={e => setNewOrder({...newOrder, status: e.target.value})}
                  >
                    <option>Pending</option>
                    <option>In Transit</option>
                  </select>
                </div>
                <Input label="Date" type="date" value={newOrder.date} onChange={v => setNewOrder({...newOrder, date: v})} required />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl">Deploy Transaction</button>
            </form>
          </div>
        </div>
      )}

  
      {selectedOrder && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-4xl overflow-hidden animate-in slide-in-from-bottom-10 duration-300">
            <div className="p-10 bg-blue-600 text-white text-center relative">
              <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 p-2 bg-white/20 rounded-full hover:bg-white/40"><X size={20}/></button>
              <div className="bg-white w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl text-blue-600">
                <FileText size={32} />
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter">FLEET SLIP</h2>
              <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-2">{selectedOrder.id}</p>
            </div>
            
            <div className="p-10 space-y-6">
              <div className="space-y-4 border-b border-dashed border-slate-200 pb-6">
                <DetailRow label="Consignee" value={selectedOrder.customer} />
                <DetailRow label="Terminal" value={selectedOrder.location} />
                <DetailRow label="Timestamp" value={selectedOrder.date} />
                <DetailRow label="System Status" value={selectedOrder.status} />
              </div>
              
              <div className="flex gap-3">
                <button className="flex-1 flex items-center justify-center gap-2 bg-blue-100 text-white-900 py-3 rounded-2xl font-bold text-xs hover:bg-slate-200">
                  <Printer size={16}/> Print Slip
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-2xl font-bold text-xs hover:bg-blue-700 shadow-lg shadow-blue-200">
                  <ExternalLink size={16}/> Track Live
                </button>
              </div>
            </div>
            <div className="bg-slate-50 p-6 text-center">
              <p className="text-[10px] font-bold text-slate-400">LOGISTICS MANAGEMENT SYSTEM v2.0</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



function StatCard({ title, value, color, icon }) {
  const styles = {
    slate: "text-slate-900 bg-white",
    green: "text-emerald-600 bg-white",
    amber: "text-amber-500 bg-white",
    red: "text-rose-500 bg-white"
  };
  return (
    <div className={`p-8 rounded-[2rem] shadow-sm border border-slate-100 transition-all hover:shadow-xl group hover:-translate-y-1 ${styles[color]}`}>
      <div className="flex justify-between items-start mb-4">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</p>
        <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:text-blue-600 transition-colors">{icon}</div>
      </div>
      <h2 className="text-4xl font-black tracking-tighter">{value}</h2>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    "Delivered": "bg-emerald-50 text-emerald-700 border-emerald-100",
    "In Transit": "bg-amber-50 text-amber-700 border-amber-100",
    "Pending": "bg-rose-50 text-rose-700 border-rose-100",
  };
  return (
    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border-2 ${styles[status]}`}>
      {status}
    </span>
  );
}

function Input({ label, value, onChange, ...props }) {
  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-[10px] font-black uppercase text-slate-400 ml-1">{label}</label>
      <input 
        className="w-full p-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-900 outline-none focus:border-blue-500 transition-all"
        value={value}
        onChange={e => onChange(e.target.value)}
        {...props}
      />
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm font-black text-slate-900">{value}</span>
    </div>
  );
}