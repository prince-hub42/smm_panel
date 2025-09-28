import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlusCircle, TrendingUp, Wallet, Settings, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function App() {
  const [balance, setBalance] = useState(0);
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newService, setNewService] = useState({ name:'', pricePerUnit:'', min:'', max:'' });
  const [placing, setPlacing] = useState(false);

  useEffect(()=>{ fetchWallet(); fetchServices(); fetchOrders(); }, []);

  async function fetchWallet(){ const res=await fetch(`${API}/api/wallet`); const data=await res.json(); setBalance(data.balance || 0); }
  async function fetchServices(){ const res=await fetch(`${API}/api/services`); setServices(await res.json()); }
  async function fetchOrders(){ const res=await fetch(`${API}/api/orders`); setOrders(await res.json()); }

  async function topUp(){ const amount=25; const res=await fetch(`${API}/api/wallet/topup`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({amount})}); const data=await res.json(); setBalance(data.balance); }

  async function createService(e){ e.preventDefault(); const payload={ name:newService.name, price_per_unit:parseFloat(newService.pricePerUnit), min_qty:parseInt(newService.min), max_qty:parseInt(newService.max) }; await fetch(`${API}/api/services`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)}); setNewService({name:'', pricePerUnit:'', min:'', max:''}); setShowCreate(false); fetchServices(); }

  async function placeOrder(serviceId){ const qty=services.find(s=>s.id===serviceId)?.min || 10; setPlacing(true); await fetch(`${API}/api/orders`, {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({service_id:serviceId, quantity:qty})}); setPlacing(false); fetchOrders(); }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 p-6 font-sans">
      <motion.header initial={{ y:-40, opacity:0 }} animate={{ y:0, opacity:1 }} transition={{ duration:0.5 }} className="max-w-6xl mx-auto flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', stiffness:120 }} className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">S</motion.div>
          <div><h1 className="text-3xl font-bold text-slate-800">SMM Panel</h1><p className="text-sm text-slate-500">Manage services, orders, balance and analytics</p></div>
        </div>
        <div className="flex items-center gap-4"><div className="text-right"><div className="text-sm text-slate-500 flex items-center gap-1"><Wallet size={14}/> Balance</div><div className="text-lg font-semibold">${balance.toFixed(2)}</div></div><button onClick={topUp} className="px-4 py-2 bg-indigo-600 text-white rounded-xl shadow hover:bg-indigo-700 transition">Top Up</button></div>
      </motion.header>

      <main className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
        <section className="col-span-12 lg:col-span-4 space-y-6">
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.2 }} className="p-5 bg-white rounded-2xl shadow-xl">
            <h2 className="font-semibold text-lg mb-3 flex items-center gap-2"><PlusCircle size={18}/> Quick Actions</h2>
            <div className="flex flex-col gap-3"><button onClick={()=>setShowCreate(true)} className="w-full py-2 rounded-lg border border-dashed border-indigo-200 hover:bg-indigo-50 transition">Create Service</button></div>
          </motion.div>
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.3 }} className="p-5 bg-white rounded-2xl shadow-xl">
            <h2 className="font-semibold text-lg mb-3 flex items-center gap-2"><TrendingUp size={18}/> Active Services</h2>
            <ul className="space-y-3">{services.map(s=>(<li key={s.id} className="flex items-center justify-between"><div><div className="font-semibold">{s.name}</div><div className="text-xs text-slate-400">Min: {s.min_qty} • Max: {s.max_qty} • ${s.price_per_unit}/unit</div></div><div className='flex gap-2 items-center'><button onClick={()=>placeOrder(s.id)} disabled={placing} className="px-3 py-1 text-sm rounded bg-indigo-50 hover:bg-indigo-100">Order</button></div></li>))}</ul>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
