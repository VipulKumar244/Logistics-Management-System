import { useState, useEffect, useCallback, useRef } from "react";

// ─── CONFIG ────────────────────────────────────────────────────────────────
const USERS = {
  "vendor@acme.com":     { password: "acme123",   id: "VENDOR-001", name: "Acme Corp",          role: "vendor" },
  "vendor@globex.com":   { password: "globex123", id: "VENDOR-002", name: "Globex Industries",  role: "vendor" },
  "admin@logistics.com": { password: "admin123",  id: "ADMIN-001",  name: "Platform Admin",     role: "admin"  },
};

// ─── THEME ─────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #f5f4f0;
    --surface: #ffffff;
    --surface2: #f0ede8;
    --border: #e2ddd8;
    --border2: #ccc8c2;
    --ink: #1a1916;
    --ink2: #6b6760;
    --ink3: #9c9890;
    --accent: #1a1916;
    --green: #2d6a4f;
    --green-bg: #d8f3dc;
    --amber: #92400e;
    --amber-bg: #fef3c7;
    --red: #991b1b;
    --red-bg: #fee2e2;
    --blue: #1e40af;
    --blue-bg: #dbeafe;
    --purple: #5b21b6;
    --purple-bg: #ede9fe;
    --radius: 10px;
    --radius-sm: 6px;
    --sidebar: 220px;
    --shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04);
  }

  html { font-size: 14px; }
  body { background: var(--bg); color: var(--ink); font-family: 'Space Grotesk', sans-serif; min-height: 100vh; }

  /* ── SCROLLBAR ── */
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 99px; }

  /* ── LAYOUT ── */
  .app { display: flex; min-height: 100vh; }
  .sidebar {
    width: var(--sidebar); min-height: 100vh;
    background: var(--ink); color: #e8e6e1;
    display: flex; flex-direction: column;
    position: fixed; top: 0; left: 0; bottom: 0;
    z-index: 50;
  }
  .main { margin-left: var(--sidebar); flex: 1; padding: 32px 40px; max-width: 1200px; }

  /* ── SIDEBAR ── */
  .sidebar-logo {
    padding: 24px 20px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .sidebar-logo .wordmark {
    font-size: 1.15rem; font-weight: 700; letter-spacing: -0.5px; color: #fff;
  }
  .sidebar-logo .tagline { font-size: 0.7rem; color: rgba(255,255,255,0.35); margin-top: 2px; font-family: 'JetBrains Mono', monospace; }
  .sidebar-nav { flex: 1; padding: 12px 0; overflow-y: auto; }
  .nav-section { padding: 14px 20px 4px; font-size: 0.62rem; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.25); }
  .nav-link {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 20px; cursor: pointer; color: rgba(255,255,255,0.5);
    font-size: 0.85rem; transition: all 0.15s; border-left: 2px solid transparent;
    user-select: none;
  }
  .nav-link:hover { color: rgba(255,255,255,0.85); background: rgba(255,255,255,0.05); }
  .nav-link.active { color: #fff; border-left-color: #fff; background: rgba(255,255,255,0.08); }
  .nav-link .ico { width: 16px; text-align: center; font-size: 0.9rem; opacity: 0.7; }
  .nav-sep { margin: 8px 14px; border: none; border-top: 1px solid rgba(255,255,255,0.07); }
  .admin-badge {
    display: inline-block; font-size: 0.6rem; letter-spacing: 1.5px; text-transform: uppercase;
    background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.6);
    padding: 2px 6px; border-radius: 4px; margin-left: 6px; vertical-align: middle;
  }
  .sidebar-footer { padding: 16px 20px; border-top: 1px solid rgba(255,255,255,0.08); }
  .user-chip { background: rgba(255,255,255,0.07); border-radius: 8px; padding: 10px 12px; margin-bottom: 10px; }
  .user-chip .uname { color: #fff; font-size: 0.82rem; font-weight: 500; }
  .user-chip .uid { color: rgba(255,255,255,0.35); font-size: 0.72rem; font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
  .logout-btn {
    width: 100%; padding: 8px; background: transparent;
    border: 1px solid rgba(255,255,255,0.12); border-radius: 7px;
    color: rgba(255,255,255,0.4); cursor: pointer; font-family: 'Space Grotesk', sans-serif;
    font-size: 0.78rem; transition: all 0.2s;
  }
  .logout-btn:hover { border-color: #ef4444; color: #ef4444; }

  /* ── PAGE ── */
  .page-head { margin-bottom: 28px; display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
  .page-head h1 { font-size: 1.6rem; font-weight: 700; letter-spacing: -0.5px; }
  .page-head p { color: var(--ink2); font-size: 0.85rem; margin-top: 3px; }
  .api-bar {
    display: flex; align-items: center; gap: 8px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 6px 12px; margin-bottom: 24px;
    font-size: 0.75rem; color: var(--ink3);
  }
  .api-bar input {
    border: none; outline: none; background: transparent;
    color: var(--green); font-family: 'JetBrains Mono', monospace;
    font-size: 0.78rem; flex: 1;
  }

  /* ── STAT CARDS ── */
  .stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
  .stat-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 18px 20px;
    transition: border-color 0.2s, transform 0.2s;
  }
  .stat-card:hover { border-color: var(--border2); transform: translateY(-1px); }
  .stat-label { font-size: 0.7rem; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink3); margin-bottom: 8px; }
  .stat-val { font-size: 2.2rem; font-weight: 700; letter-spacing: -1px; }
  .stat-sub { font-size: 0.7rem; color: var(--ink3); margin-top: 4px; }

  /* ── TABLE ── */
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); overflow: hidden; margin-bottom: 20px; }
  .card-head { padding: 14px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .card-head h3 { font-size: 0.88rem; font-weight: 600; }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  th { padding: 10px 16px; text-align: left; font-size: 0.68rem; letter-spacing: 1.5px; text-transform: uppercase; color: var(--ink3); border-bottom: 1px solid var(--border); font-weight: 500; white-space: nowrap; }
  td { padding: 12px 16px; font-size: 0.83rem; border-bottom: 1px solid var(--border); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: var(--bg); }

  /* ── BADGES ── */
  .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 0.68rem; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; white-space: nowrap; }
  .badge-green  { background: var(--green-bg); color: var(--green); }
  .badge-amber  { background: var(--amber-bg); color: var(--amber); }
  .badge-red    { background: var(--red-bg); color: var(--red); }
  .badge-blue   { background: var(--blue-bg); color: var(--blue); }
  .badge-purple { background: var(--purple-bg); color: var(--purple); }
  .badge-gray   { background: var(--surface2); color: var(--ink2); }

  /* ── FORMS ── */
  .form-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 22px 24px; margin-bottom: 18px; }
  .form-card h3 { font-size: 0.88rem; font-weight: 600; margin-bottom: 16px; }
  .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .form-grid.cols3 { grid-template-columns: 1fr 1fr 1fr; }
  .form-grid.cols1 { grid-template-columns: 1fr; }
  .field { display: flex; flex-direction: column; gap: 5px; }
  .field.full { grid-column: 1/-1; }
  .field label { font-size: 0.68rem; letter-spacing: 1px; text-transform: uppercase; color: var(--ink3); font-weight: 500; }
  .field input, .field select {
    padding: 9px 12px;
    background: var(--bg); border: 1px solid var(--border);
    border-radius: var(--radius-sm); color: var(--ink);
    font-family: 'Space Grotesk', sans-serif; font-size: 0.85rem;
    outline: none; transition: border-color 0.15s;
  }
  .field input:focus, .field select:focus { border-color: var(--ink); }
  .field select option { background: var(--surface); }

  /* ── ITEM ROWS ── */
  .item-row { display: grid; grid-template-columns: 1fr 110px 34px; gap: 8px; align-items: center; margin-bottom: 8px; }
  .item-row input {
    padding: 9px 12px; background: var(--bg); border: 1px solid var(--border);
    border-radius: var(--radius-sm); color: var(--ink);
    font-family: 'Space Grotesk', sans-serif; font-size: 0.85rem; outline: none;
    transition: border-color 0.15s; width: 100%;
  }
  .item-row input:focus { border-color: var(--ink); }
  .btn-icon {
    width: 34px; height: 34px; border-radius: var(--radius-sm);
    border: 1px solid var(--border); background: var(--bg);
    color: var(--ink3); cursor: pointer; font-size: 1rem;
    display: flex; align-items: center; justify-content: center; transition: all 0.15s;
  }
  .btn-icon:hover { border-color: #ef4444; color: #ef4444; }
  .btn-add {
    width: 100%; padding: 8px; background: transparent;
    border: 1px dashed var(--border2); border-radius: var(--radius-sm);
    color: var(--ink3); cursor: pointer; font-family: 'Space Grotesk', sans-serif;
    font-size: 0.8rem; transition: all 0.15s; margin-top: 4px;
  }
  .btn-add:hover { border-color: var(--ink); color: var(--ink); }

  /* ── BUTTONS ── */
  .btn {
    padding: 10px 22px; background: var(--ink); color: #fff;
    border: none; border-radius: var(--radius-sm);
    font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 0.85rem;
    cursor: pointer; transition: opacity 0.15s, transform 0.1s; white-space: nowrap;
  }
  .btn:hover { opacity: 0.85; }
  .btn:active { transform: scale(0.98); }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
  .btn-sm { padding: 6px 14px; font-size: 0.78rem; }
  .btn-outline {
    background: transparent; color: var(--ink);
    border: 1px solid var(--border2);
  }
  .btn-outline:hover { background: var(--surface2); opacity: 1; }
  .btn-danger { background: #ef4444; }
  .tbl-btn {
    padding: 4px 10px; border-radius: 4px; border: 1px solid var(--border);
    background: transparent; color: var(--ink2); cursor: pointer;
    font-family: 'Space Grotesk', sans-serif; font-size: 0.72rem; transition: all 0.15s;
    white-space: nowrap;
  }
  .tbl-btn:hover { background: var(--surface2); }
  .tbl-btn.danger:hover { border-color: #ef4444; color: #ef4444; }

  /* ── ETA RESULT ── */
  .eta-box {
    background: #f0fdf4; border: 1px solid #bbf7d0;
    border-radius: var(--radius); padding: 20px 24px; margin-top: 16px;
    animation: slideUp 0.25s ease;
  }
  .eta-box h4 { font-size: 0.82rem; font-weight: 600; color: var(--green); margin-bottom: 14px; }
  .eta-stats { display: grid; grid-template-columns: repeat(5,1fr); gap: 10px; margin-bottom: 16px; }
  .eta-stat { text-align: center; }
  .eta-stat .ev { font-size: 1.5rem; font-weight: 700; color: var(--ink); }
  .eta-stat .el { font-size: 0.65rem; letter-spacing: 1px; text-transform: uppercase; color: var(--ink3); margin-top: 2px; }
  .trk-box {
    display: flex; align-items: center; justify-content: space-between;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 10px 14px;
  }
  .trk-num { font-family: 'JetBrains Mono', monospace; font-size: 0.88rem; color: var(--green); font-weight: 500; }
  .dist-note { margin-top: 8px; font-size: 0.72rem; color: var(--ink3); }

  /* ── TRACK PAGE ── */
  .track-row { display: flex; gap: 10px; margin-bottom: 22px; }
  .track-row input {
    flex: 1; padding: 10px 14px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius-sm); color: var(--ink);
    font-family: 'JetBrains Mono', monospace; font-size: 0.88rem;
    outline: none; transition: border-color 0.15s; text-transform: uppercase;
  }
  .track-row input:focus { border-color: var(--ink); }
  .ship-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px 26px; animation: slideUp 0.25s ease; }
  .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .detail-item label { font-size: 0.68rem; letter-spacing: 1px; text-transform: uppercase; color: var(--ink3); display: block; margin-bottom: 4px; }
  .detail-item span { font-size: 0.85rem; }
  .progress { display: flex; align-items: flex-start; margin-bottom: 24px; padding: 20px 0; position: relative; }
  .progress::before { content: ''; position: absolute; top: 30px; left: calc(12.5% - 0px); right: calc(12.5% - 0px); height: 2px; background: var(--border); }
  .step { flex: 1; display: flex; flex-direction: column; align-items: center; position: relative; z-index: 1; }
  .step-dot {
    width: 28px; height: 28px; border-radius: 50%;
    background: var(--surface); border: 2px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    font-size: 0.7rem; transition: all 0.3s; color: var(--ink3);
    margin-bottom: 8px; font-weight: 600;
  }
  .step.done .step-dot { background: var(--ink); border-color: var(--ink); color: #fff; }
  .step.current .step-dot { border-color: var(--ink); color: var(--ink); box-shadow: 0 0 0 4px rgba(26,25,22,0.08); }
  .step-label { font-size: 0.68rem; color: var(--ink3); text-align: center; line-height: 1.3; }
  .step.done .step-label, .step.current .step-label { color: var(--ink); font-weight: 500; }

  /* ── INVENTORY ── */
  .inv-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; margin-bottom: 22px; }
  .inv-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 18px 20px;
    transition: border-color 0.2s, transform 0.2s;
  }
  .inv-card:hover { transform: translateY(-1px); }
  .inv-card.low { border-color: #fcd34d; }
  .inv-card.out { border-color: #fca5a5; }
  .inv-sku { font-size: 0.68rem; letter-spacing: 1px; color: var(--ink3); margin-bottom: 5px; font-family: 'JetBrains Mono', monospace; }
  .inv-name { font-weight: 600; font-size: 0.92rem; margin-bottom: 12px; }
  .inv-qty { font-size: 2.2rem; font-weight: 700; letter-spacing: -1px; margin-bottom: 2px; }
  .inv-meta { display: flex; justify-content: space-between; margin-top: 10px; font-size: 0.72rem; color: var(--ink3); }

  /* ── MODAL ── */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.4);
    display: flex; align-items: center; justify-content: center;
    z-index: 200; animation: fadeIn 0.15s ease;
  }
  .modal {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 26px 28px;
    width: 480px; max-width: 95vw; max-height: 90vh; overflow-y: auto;
    animation: slideUp 0.2s ease; box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  }
  .modal-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
  .modal-head h3 { font-size: 0.95rem; font-weight: 600; }
  .modal-close { width: 28px; height: 28px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: transparent; color: var(--ink2); cursor: pointer; font-size: 1rem; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .modal-close:hover { border-color: #ef4444; color: #ef4444; }
  .modal-foot { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }

  /* ── TOAST ── */
  .toast {
    position: fixed; bottom: 24px; right: 24px;
    background: var(--ink); color: #fff;
    border-radius: var(--radius-sm); padding: 12px 18px;
    font-size: 0.83rem; z-index: 9999;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    animation: slideUp 0.25s ease; max-width: 280px; line-height: 1.4;
  }
  .toast.error { background: #ef4444; }
  .toast.success { background: var(--green); }

  /* ── LOGIN ── */
  .login-page {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--ink);
  }
  .login-box {
    width: 400px; background: #fff; border-radius: 14px;
    padding: 40px 36px; box-shadow: 0 24px 80px rgba(0,0,0,0.3);
  }
  .login-logo { font-size: 1.4rem; font-weight: 700; letter-spacing: -0.5px; margin-bottom: 4px; }
  .login-sub { font-size: 0.82rem; color: var(--ink2); margin-bottom: 24px; }
  .role-tabs { display: flex; gap: 0; border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; margin-bottom: 20px; }
  .role-tab { flex: 1; padding: 9px; text-align: center; cursor: pointer; font-size: 0.8rem; color: var(--ink2); background: transparent; border: none; font-family: 'Space Grotesk', sans-serif; transition: all 0.15s; }
  .role-tab.active { background: var(--ink); color: #fff; }
  .hint-box { border-radius: var(--radius-sm); padding: 10px 14px; margin-bottom: 18px; font-size: 0.76rem; line-height: 1.6; }
  .hint-vendor { background: #f0fdf4; border: 1px solid #bbf7d0; color: var(--green); }
  .hint-admin  { background: var(--purple-bg); border: 1px solid #c4b5fd; color: var(--purple); }
  .login-field { margin-bottom: 14px; }
  .login-field label { display: block; font-size: 0.7rem; letter-spacing: 1px; text-transform: uppercase; color: var(--ink3); margin-bottom: 6px; }
  .login-field input {
    width: 100%; padding: 11px 14px; border: 1px solid var(--border);
    border-radius: var(--radius-sm); color: var(--ink);
    font-family: 'Space Grotesk', sans-serif; font-size: 0.88rem; outline: none;
    transition: border-color 0.15s; background: var(--bg);
  }
  .login-field input:focus { border-color: var(--ink); }
  .login-err { color: #ef4444; font-size: 0.78rem; text-align: center; margin-top: 10px; min-height: 18px; }

  /* ── EMPTY ── */
  .empty { text-align: center; padding: 44px 20px; color: var(--ink3); }
  .empty .ei { font-size: 2rem; margin-bottom: 10px; }
  .spin { display: inline-block; width: 13px; height: 13px; border: 2px solid var(--border); border-top-color: var(--ink); border-radius: 50%; animation: spin 0.6s linear infinite; vertical-align: middle; margin-right: 6px; }

  /* ── MONO ── */
  .mono { font-family: 'JetBrains Mono', monospace; }

  @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
  @keyframes slideUp { from { opacity: 0; transform: translateY(10px) } to { opacity: 1; transform: translateY(0) } }
  @keyframes spin    { to { transform: rotate(360deg) } }
`;

// ─── HELPERS ───────────────────────────────────────────────────────────────
const BADGE_MAP = {
  pending: "badge-gray", confirmed: "badge-blue", processing: "badge-blue",
  shipped: "badge-amber", delivered: "badge-green", cancelled: "badge-red",
  created: "badge-gray", in_transit: "badge-amber", out_for_delivery: "badge-blue",
  failed: "badge-red", in_stock: "badge-green", low_stock: "badge-amber", out_of_stock: "badge-red",
};
const Badge = ({ s }) => <span className={`badge ${BADGE_MAP[s] || "badge-gray"}`}>{s?.replace(/_/g, " ")}</span>;
const fmtDate = iso => iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const Spinner = () => <span className="spin" />;

// ─── API HOOK ───────────────────────────────────────────────────────────────
function useApi(baseRef) {
  return useCallback(async (method, path, body) => {
    const opts = { method, headers: { "Content-Type": "application/json" } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(baseRef.current + path, opts);
    if (!res.ok) {
      const e = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(Array.isArray(e.detail) ? e.detail.map(d => d.msg).join(", ") : (e.detail || res.statusText));
    }
    if (res.status === 204) return null;
    return res.json();
  }, [baseRef]);
}

// ─── TOAST ─────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
  return <div className={`toast ${type}`}>{msg}</div>;
}

// ─── MODAL ─────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, foot }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {children}
        {foot && <div className="modal-foot">{foot}</div>}
      </div>
    </div>
  );
}

// ─── LOGIN ─────────────────────────────────────────────────────────────────
function Login({ onLogin }) {
  const [tab, setTab] = useState("vendor");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");

  const submit = () => {
    const u = USERS[email];
    if (!u || u.password !== pass) { setErr("Invalid credentials."); return; }
    setErr("");
    onLogin({ email, ...u });
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">VendorPort</div>
        <p className="login-sub">Logistics management system</p>
        <div className="role-tabs">
          <button className={`role-tab ${tab === "vendor" ? "active" : ""}`} onClick={() => setTab("vendor")}>Vendor</button>
          <button className={`role-tab ${tab === "admin" ? "active" : ""}`} onClick={() => setTab("admin")}>Admin</button>
        </div>
        {tab === "vendor"
          ? <div className="hint-box hint-vendor"><strong>Vendor demo</strong><br />vendor@acme.com / acme123<br />vendor@globex.com / globex123</div>
          : <div className="hint-box hint-admin"><strong>Admin demo</strong><br />admin@logistics.com / admin123</div>
        }
        <div className="login-field"><label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>
        <div className="login-field"><label>Password</label><input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === "Enter" && submit()} /></div>
        <button className="btn" style={{ width: "100%", marginTop: "4px" }} onClick={submit}>Sign in →</button>
        <div className="login-err">{err}</div>
      </div>
    </div>
  );
}

// ─── OVERVIEW ──────────────────────────────────────────────────────────────
function Overview({ me, api, addToast }) {
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    const q = me.role === "admin" ? "" : `?vendor_id=${me.id}`;
    api("GET", "/orders/" + q).then(setOrders).catch(e => addToast(e.message, "error"));
  }, []);

  const stats = orders ? {
    total: orders.length,
    transit: orders.filter(o => ["processing", "shipped"].includes(o.status)).length,
    delivered: orders.filter(o => o.status === "delivered").length,
    pending: orders.filter(o => ["pending", "confirmed"].includes(o.status)).length,
  } : null;

  return (
    <div>
      <div className="page-head"><div><h1>Overview</h1><p>Your logistics snapshot</p></div></div>
      <div className="stat-grid">
        {[["Total Orders", stats?.total, "all time"], ["In Transit", stats?.transit, "active shipments"], ["Delivered", stats?.delivered, "completed"], ["Pending", stats?.pending, "awaiting"]].map(([label, val, sub]) => (
          <div className="stat-card" key={label}>
            <div className="stat-label">{label}</div>
            <div className="stat-val">{val ?? <Spinner />}</div>
            <div className="stat-sub">{sub}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-head"><h3>Recent orders</h3></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order ID</th><th>Status</th><th>Items</th><th>Amount</th><th>Date</th></tr></thead>
            <tbody>
              {!orders ? <tr><td colSpan={5}><div className="empty"><Spinner />Loading…</div></td></tr>
                : orders.length === 0 ? <tr><td colSpan={5}><div className="empty"><div className="ei">◈</div>No orders yet</div></td></tr>
                : [...orders].reverse().slice(0, 8).map(o => (
                  <tr key={o.id}>
                    <td className="mono" style={{ fontSize: "0.78rem", color: "var(--ink2)" }}>{o.id.slice(0, 8)}…</td>
                    <td><Badge s={o.status} /></td>
                    <td>{o.items.length} item{o.items.length !== 1 ? "s" : ""}</td>
                    <td>₹{o.total_amount.toFixed(2)}</td>
                    <td style={{ color: "var(--ink3)" }}>{fmtDate(o.created_at)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── PLACE ORDER ───────────────────────────────────────────────────────────
function PlaceOrder({ me, api, addToast }) {
  const [addr, setAddr] = useState("");
  const [notes, setNotes] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [items, setItems] = useState([{ sku: "", qty: "" }]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const addRow = () => setItems(p => [...p, { sku: "", qty: "" }]);
  const removeRow = i => setItems(p => p.length > 1 ? p.filter((_, idx) => idx !== i) : p);
  const updateRow = (i, k, v) => setItems(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));

  const submit = async () => {
    if (!addr || !lat || !lon) { addToast("Fill in address and coordinates.", "error"); return; }
    const orderItems = [];
    for (const r of items) {
      if (!r.sku || !r.qty || parseInt(r.qty) < 1) { addToast("Fill all SKU and qty fields.", "error"); return; }
      orderItems.push({ sku: r.sku.trim().toUpperCase(), quantity: parseInt(r.qty) });
    }
    setLoading(true); setResult(null);
    try {
      const r = await api("POST", "/orders/", {
        vendor_id: me.id, vendor_name: me.name,
        delivery_address: addr, delivery_lat: parseFloat(lat), delivery_lon: parseFloat(lon),
        notes: notes || undefined, items: orderItems,
      });
      setResult(r); addToast("Order placed successfully!");
    } catch (e) { addToast(e.message, "error"); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="page-head"><div><h1>Place Order</h1><p>Submit a new logistics order</p></div></div>
      <div className="form-card">
        <h3>Delivery details</h3>
        <div className="form-grid">
          <div className="field"><label>Delivery Address</label><input value={addr} onChange={e => setAddr(e.target.value)} placeholder="123 MG Road, Bengaluru" /></div>
          <div className="field"><label>Notes</label><input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Leave at reception" /></div>
          <div className="field"><label>Latitude</label><input type="number" value={lat} onChange={e => setLat(e.target.value)} placeholder="12.9352" step="0.0001" /></div>
          <div className="field"><label>Longitude</label><input type="number" value={lon} onChange={e => setLon(e.target.value)} placeholder="77.6245" step="0.0001" /></div>
        </div>
      </div>
      <div className="form-card">
        <h3>Order items</h3>
        {items.map((r, i) => (
          <div className="item-row" key={i}>
            <input value={r.sku} onChange={e => updateRow(i, "sku", e.target.value)} placeholder="SKU (e.g. BOLT-M8)" />
            <input type="number" value={r.qty} onChange={e => updateRow(i, "qty", e.target.value)} placeholder="Qty" min="1" />
            <button className="btn-icon" onClick={() => removeRow(i)}>✕</button>
          </div>
        ))}
        <button className="btn-add" onClick={addRow}>+ Add item</button>
        <div style={{ marginTop: "16px" }}>
          <button className="btn" onClick={submit} disabled={loading}>
            {loading ? <><Spinner />Processing…</> : "Place Order →"}
          </button>
        </div>
      </div>

      {result && (
        <div className="eta-box">
          <h4>✓ Order confirmed — ETA breakdown</h4>
          <div className="eta-stats">
            {[["Mean", result.eta?.mean], ["Median", result.eta?.median], ["Best p5", result.eta?.percentile_5], ["p90", result.eta?.percentile_90], ["Worst p95", result.eta?.percentile_95]].map(([l, v]) => (
              <div className="eta-stat" key={l}>
                <div className="ev">{v ? Math.round(v) : "—"}</div>
                <div className="el">{l}</div>
              </div>
            ))}
          </div>
          <div className="trk-box">
            <span style={{ fontSize: "0.75rem", color: "var(--ink3)" }}>Tracking number</span>
            <span className="trk-num">{result.shipment?.tracking_number}</span>
            <button className="btn btn-sm btn-outline" onClick={() => { navigator.clipboard.writeText(result.shipment?.tracking_number); addToast("Copied!"); }}>Copy</button>
          </div>
          <div className="dist-note">Distance: {result.shipment?.distance_km.toFixed(1)} km</div>
        </div>
      )}
    </div>
  );
}

// ─── ORDER HISTORY ─────────────────────────────────────────────────────────
function OrderHistory({ me, api, addToast }) {
  const [orders, setOrders] = useState(null);
  const [trkMap, setTrkMap] = useState({});

  const load = useCallback(async () => {
    try {
      const q = me.role === "admin" ? "" : `?vendor_id=${me.id}`;
      const [ords, ships] = await Promise.all([
        api("GET", "/orders/" + q),
        api("GET", "/shipments/").catch(() => []),
      ]);
      const map = {};
      ships.forEach(s => { map[s.order_id] = s.tracking_number; });
      setOrders(ords); setTrkMap(map);
    } catch (e) { addToast(e.message, "error"); }
  }, [me, api, addToast]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="page-head">
        <div><h1>Order History</h1><p>All orders for your account</p></div>
        <button className="btn btn-sm btn-outline" onClick={load}>↻ Refresh</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order ID</th><th>Status</th><th>Items</th><th>Amount (₹)</th><th>Tracking #</th><th>Address</th><th>Date</th></tr></thead>
            <tbody>
              {!orders ? <tr><td colSpan={7}><div className="empty"><Spinner />Loading…</div></td></tr>
                : orders.length === 0 ? <tr><td colSpan={7}><div className="empty"><div className="ei">≡</div>No orders yet</div></td></tr>
                : [...orders].reverse().map(o => {
                  const trk = trkMap[o.id];
                  return (
                    <tr key={o.id}>
                      <td className="mono" style={{ fontSize: "0.75rem", color: "var(--ink2)" }}>{o.id.slice(0, 8)}…</td>
                      <td><Badge s={o.status} /></td>
                      <td style={{ fontSize: "0.8rem" }}>{o.items.map(i => `${i.sku} ×${i.quantity}`).join(", ")}</td>
                      <td>₹{o.total_amount.toFixed(2)}</td>
                      <td>
                        {trk
                          ? <span className="mono" style={{ fontSize: "0.76rem", color: "var(--green)", cursor: "pointer" }} title="Click to copy" onClick={() => { navigator.clipboard.writeText(trk); addToast("Copied!"); }}>{trk}</span>
                          : <span style={{ color: "var(--ink3)" }}>—</span>}
                      </td>
                      <td style={{ color: "var(--ink2)", fontSize: "0.8rem", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.delivery_address}</td>
                      <td style={{ color: "var(--ink3)", whiteSpace: "nowrap" }}>{fmtDate(o.created_at)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TRACK SHIPMENT ────────────────────────────────────────────────────────
function TrackShipment({ api, addToast }) {
  const [num, setNum] = useState("");
  const [ship, setShip] = useState(null);
  const [loading, setLoading] = useState(false);

  const track = async () => {
    const n = num.trim().toUpperCase();
    if (!n) { addToast("Enter a tracking number.", "error"); return; }
    setLoading(true);
    try {
      const s = await api("GET", `/shipments/track/${n}`);
      setShip(s);
    } catch (e) { addToast("Not found: " + e.message, "error"); }
    finally { setLoading(false); }
  };

  const STEPS = ["created", "in_transit", "out_for_delivery", "delivered"];
  const LABELS = ["Created", "In Transit", "Out for Delivery", "Delivered"];
  const ICONS = ["·", "→", "◎", "✓"];

  return (
    <div>
      <div className="page-head"><div><h1>Track Shipment</h1><p>Enter a tracking number for live status</p></div></div>
      <div className="track-row">
        <input value={num} onChange={e => setNum(e.target.value)} placeholder="TRK-XXXXXXXXXX" onKeyDown={e => e.key === "Enter" && track()} />
        <button className="btn" onClick={track} disabled={loading}>{loading ? <Spinner /> : "Track →"}</button>
      </div>

      {ship && (
        <div className="ship-card">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <div>
              <div style={{ fontSize: "0.68rem", letterSpacing: "1px", textTransform: "uppercase", color: "var(--ink3)", marginBottom: "4px" }}>Tracking Number</div>
              <div className="mono" style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--green)" }}>{ship.tracking_number}</div>
            </div>
            <Badge s={ship.status} />
          </div>

          <div className="progress">
            {STEPS.map((s, i) => {
              const cur = STEPS.indexOf(ship.status);
              const cls = i < cur ? "done" : i === cur ? "current" : "";
              return (
                <div className={`step ${cls}`} key={s}>
                  <div className="step-dot">{ICONS[i]}</div>
                  <div className="step-label">{LABELS[i]}</div>
                </div>
              );
            })}
          </div>

          <div className="detail-grid">
            {[["Origin", ship.origin_address || `${ship.origin_lat}, ${ship.origin_lon}`], ["Destination", ship.destination_address], ["Distance", `${ship.distance_km?.toFixed(1)} km`], ["Weight", `${ship.total_weight_kg?.toFixed(2)} kg`], ["Carrier", ship.carrier || "—"], ["Created", fmtDate(ship.created_at)]].map(([l, v]) => (
              <div className="detail-item" key={l}><label>{l}</label><span>{v}</span></div>
            ))}
          </div>

          {ship.eta && (
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
              <div style={{ fontSize: "0.68rem", letterSpacing: "1px", textTransform: "uppercase", color: "var(--ink3)", marginBottom: "12px" }}>ETA estimates (minutes)</div>
              <div className="eta-stats">
                {[["Mean", ship.eta.mean_minutes], ["Median", ship.eta.median_minutes], ["Best p5", ship.eta.percentile_5_minutes], ["p90", ship.eta.percentile_90_minutes], ["Worst p95", ship.eta.percentile_95_minutes]].map(([l, v]) => (
                  <div className="eta-stat" key={l}>
                    <div className="ev">{v ? Math.round(v) : "—"}</div>
                    <div className="el">{l}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── INVENTORY VIEW ────────────────────────────────────────────────────────
function Inventory({ me, api, addToast }) {
  const [items, setItems] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await api("GET", `/inventory/?vendor_id=${me.id}`);
      setItems(data);
    } catch (e) { addToast(e.message, "error"); }
  }, [me, api, addToast]);

  useEffect(() => { load(); }, [load]);

  return (
    <div>
      <div className="page-head">
        <div><h1>Inventory</h1><p>Your warehouse stock levels</p></div>
        <button className="btn btn-sm btn-outline" onClick={load}>↻ Refresh</button>
      </div>

      {!items ? <div className="empty"><Spinner />Loading…</div> : items.length === 0 ? (
        <div className="empty"><div className="ei">▦</div>No inventory items assigned to your account</div>
      ) : (
        <>
          <div className="inv-grid">
            {items.slice(0, 6).map(item => {
              const s = item.status;
              const cls = s === "in_stock" ? "" : s === "low_stock" ? "low" : "out";
              const color = s === "in_stock" ? "var(--green)" : s === "low_stock" ? "var(--amber)" : "var(--red)";
              return (
                <div className={`inv-card ${cls}`} key={item.sku}>
                  <div className="inv-sku">{item.sku}</div>
                  <div className="inv-name">{item.name}</div>
                  <div className="inv-qty" style={{ color }}>{item.available_quantity}</div>
                  <div style={{ fontSize: "0.7rem", color: "var(--ink3)", marginTop: "2px" }}>available units</div>
                  <div className="inv-meta">
                    <span>Reserved: {item.reserved_quantity}</span>
                    <Badge s={item.status} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card">
            <div className="card-head"><h3>All SKUs</h3></div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>SKU</th><th>Name</th><th>Available</th><th>Reserved</th><th>Total</th><th>Price (₹)</th><th>Status</th></tr></thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.sku}>
                      <td className="mono" style={{ fontSize: "0.8rem", color: "var(--green)" }}>{item.sku}</td>
                      <td>{item.name}</td>
                      <td style={{ color: item.available_quantity > item.reorder_threshold ? "var(--green)" : "var(--amber)", fontWeight: 600 }}>{item.available_quantity}</td>
                      <td style={{ color: "var(--ink3)" }}>{item.reserved_quantity}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.unit_price.toFixed(2)}</td>
                      <td><Badge s={item.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── ADMIN: MANAGE INVENTORY ───────────────────────────────────────────────
function AdminInventory({ api, addToast }) {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState({ vendor_id: "", sku: "", name: "", qty: "", price: "", weight: "0.5", thresh: "10", wlat: "12.9716", wlon: "77.5946", desc: "" });
  const [adjModal, setAdjModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [delModal, setDelModal] = useState(null);
  const [adjDelta, setAdjDelta] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [editForm, setEditForm] = useState({});

  const load = useCallback(async () => {
    try { setItems(await api("GET", "/inventory/")); }
    catch (e) { addToast(e.message, "error"); }
  }, [api, addToast]);

  useEffect(() => { load(); }, [load]);

  const addSKU = async () => {
    if (!form.vendor_id || !form.sku || !form.name || !form.qty || !form.price) {
      addToast("Vendor ID, SKU, Name, Qty and Price required.", "error"); return;
    }
    try {
      await api("POST", "/inventory/", {
        vendor_id: form.vendor_id, sku: form.sku, name: form.name,
        description: form.desc || undefined, quantity: parseInt(form.qty),
        unit_price: parseFloat(form.price), unit_weight_kg: parseFloat(form.weight),
        reorder_threshold: parseInt(form.thresh),
        warehouse_lat: parseFloat(form.wlat), warehouse_lon: parseFloat(form.wlon),
      });
      addToast(`"${form.sku}" added for ${form.vendor_id}!`);
      setForm({ vendor_id: "", sku: "", name: "", qty: "", price: "", weight: "0.5", thresh: "10", wlat: "12.9716", wlon: "77.5946", desc: "" });
      load();
    } catch (e) { addToast(e.message, "error"); }
  };

  const submitAdj = async () => {
    const delta = parseInt(adjDelta);
    if (isNaN(delta) || delta === 0) { addToast("Enter a non-zero delta.", "error"); return; }
    try {
      await api("POST", `/inventory/${adjModal.sku}/adjust?vendor_id=${adjModal.vendor_id}`, { delta, reason: adjReason || undefined });
      addToast(`Stock adjusted by ${delta > 0 ? "+" : ""}${delta}`);
      setAdjModal(null); load();
    } catch (e) { addToast(e.message, "error"); }
  };

  const submitEdit = async () => {
    try {
      await api("PATCH", `/inventory/${editModal.sku}?vendor_id=${editModal.vendor_id}`, editForm);
      addToast(`"${editModal.sku}" updated.`);
      setEditModal(null); load();
    } catch (e) { addToast(e.message, "error"); }
  };

  const submitDel = async () => {
    try {
      await api("DELETE", `/inventory/${delModal.sku}?vendor_id=${delModal.vendor_id}`);
      addToast(`"${delModal.sku}" deleted.`);
      setDelModal(null); load();
    } catch (e) { addToast(e.message, "error"); }
  };

  const setF = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  return (
    <div>
      <div className="page-head"><div><h1>Manage Inventory <span className="admin-badge">admin</span></h1><p>Add, edit, adjust stock and delete SKUs</p></div></div>

      <div className="form-card">
        <h3>Add new SKU</h3>
        <div className="form-grid cols3">
          <div className="field"><label>Vendor ID *</label><input value={form.vendor_id} onChange={setF("vendor_id")} placeholder="VENDOR-001" /></div>
          <div className="field"><label>SKU *</label><input value={form.sku} onChange={setF("sku")} placeholder="BOLT-M8" /></div>
          <div className="field"><label>Name *</label><input value={form.name} onChange={setF("name")} placeholder="Industrial Bolt M8" /></div>
          <div className="field"><label>Qty *</label><input type="number" value={form.qty} onChange={setF("qty")} placeholder="500" min="0" /></div>
          <div className="field"><label>Unit Price (₹) *</label><input type="number" value={form.price} onChange={setF("price")} placeholder="2.50" step="0.01" /></div>
          <div className="field"><label>Weight kg/unit</label><input type="number" value={form.weight} onChange={setF("weight")} placeholder="0.5" step="0.01" /></div>
          <div className="field"><label>Reorder Threshold</label><input type="number" value={form.thresh} onChange={setF("thresh")} placeholder="10" /></div>
          <div className="field"><label>Warehouse Lat</label><input type="number" value={form.wlat} onChange={setF("wlat")} step="0.0001" /></div>
          <div className="field"><label>Warehouse Lon</label><input type="number" value={form.wlon} onChange={setF("wlon")} step="0.0001" /></div>
        </div>
        <button className="btn" style={{ marginTop: "14px" }} onClick={addSKU}>Add SKU →</button>
      </div>

      <div className="card">
        <div className="card-head"><h3>All items</h3><button className="btn btn-sm btn-outline" onClick={load}>↻ Refresh</button></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Vendor</th><th>SKU</th><th>Name</th><th>Available</th><th>Total</th><th>Price</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {!items ? <tr><td colSpan={8}><div className="empty"><Spinner />Loading…</div></td></tr>
                : items.length === 0 ? <tr><td colSpan={8}><div className="empty"><div className="ei">▦</div>No items</div></td></tr>
                : items.map(item => (
                  <tr key={item.id}>
                    <td className="mono" style={{ fontSize: "0.75rem", color: "var(--purple)" }}>{item.vendor_id}</td>
                    <td className="mono" style={{ fontSize: "0.8rem", color: "var(--green)" }}>{item.sku}</td>
                    <td>{item.name}</td>
                    <td style={{ color: item.available_quantity > item.reorder_threshold ? "var(--green)" : "var(--amber)", fontWeight: 600 }}>{item.available_quantity}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.unit_price.toFixed(2)}</td>
                    <td><Badge s={item.status} /></td>
                    <td>
                      <div style={{ display: "flex", gap: "5px" }}>
                        <button className="tbl-btn" onClick={() => { setAdjModal(item); setAdjDelta(""); setAdjReason(""); }}>± Stock</button>
                        <button className="tbl-btn" onClick={() => { setEditModal(item); setEditForm({ name: item.name, unit_price: item.unit_price, unit_weight_kg: item.unit_weight_kg, reorder_threshold: item.reorder_threshold }); }}>Edit</button>
                        <button className="tbl-btn danger" onClick={() => setDelModal(item)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {adjModal && (
        <Modal title={`Adjust stock — ${adjModal.sku}`} onClose={() => setAdjModal(null)}
          foot={<><button className="btn btn-outline" onClick={() => setAdjModal(null)}>Cancel</button><button className="btn" onClick={submitAdj}>Adjust</button></>}>
          <p style={{ fontSize: "0.82rem", color: "var(--ink2)", marginBottom: "12px" }}>Current available: <strong>{adjModal.available_quantity}</strong> units &nbsp;·&nbsp; Positive = add, negative = remove</p>
          <div className="field"><label>Delta</label><input type="number" value={adjDelta} onChange={e => setAdjDelta(e.target.value)} placeholder="+100 or -20" autoFocus /></div>
          <div className="field" style={{ marginTop: "10px" }}><label>Reason (optional)</label><input value={adjReason} onChange={e => setAdjReason(e.target.value)} placeholder="Restock from supplier" /></div>
        </Modal>
      )}

      {editModal && (
        <Modal title={`Edit — ${editModal.sku}`} onClose={() => setEditModal(null)}
          foot={<><button className="btn btn-outline" onClick={() => setEditModal(null)}>Cancel</button><button className="btn" onClick={submitEdit}>Save changes</button></>}>
          <div className="form-grid">
            <div className="field"><label>Name</label><input value={editForm.name || ""} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="field"><label>Unit Price (₹)</label><input type="number" value={editForm.unit_price || ""} onChange={e => setEditForm(p => ({ ...p, unit_price: parseFloat(e.target.value) }))} step="0.01" /></div>
            <div className="field"><label>Weight (kg)</label><input type="number" value={editForm.unit_weight_kg || ""} onChange={e => setEditForm(p => ({ ...p, unit_weight_kg: parseFloat(e.target.value) }))} step="0.01" /></div>
            <div className="field"><label>Reorder Threshold</label><input type="number" value={editForm.reorder_threshold || ""} onChange={e => setEditForm(p => ({ ...p, reorder_threshold: parseInt(e.target.value) }))} /></div>
          </div>
        </Modal>
      )}

      {delModal && (
        <Modal title="Delete SKU" onClose={() => setDelModal(null)}
          foot={<><button className="btn btn-outline" onClick={() => setDelModal(null)}>Cancel</button><button className="btn btn-danger" onClick={submitDel}>Delete</button></>}>
          <p style={{ fontSize: "0.86rem", lineHeight: 1.6, color: "var(--ink2)" }}>
            Delete <strong style={{ color: "var(--red)" }}>{delModal.sku}</strong> from vendor <strong>{delModal.vendor_id}</strong>?<br />
            This cannot be undone. SKUs with active reservations cannot be deleted.
          </p>
        </Modal>
      )}
    </div>
  );
}

// ─── ADMIN: MANAGE SHIPMENTS ───────────────────────────────────────────────
function AdminShipments({ api, addToast }) {
  const [ships, setShips] = useState(null);
  const [ssModal, setSsModal] = useState(null);
  const [ssStatus, setSsStatus] = useState("");

  const load = useCallback(async () => {
    try { setShips(await api("GET", "/shipments/")); }
    catch (e) { addToast(e.message, "error"); }
  }, [api, addToast]);

  useEffect(() => { load(); }, [load]);

  const submitStatus = async () => {
    try {
      await api("PATCH", `/shipments/${ssModal.id}/status`, { status: ssStatus });
      addToast("Shipment status updated.");
      setSsModal(null); load();
    } catch (e) { addToast(e.message, "error"); }
  };

  return (
    <div>
      <div className="page-head">
        <div><h1>Manage Shipments <span className="admin-badge">admin</span></h1><p>Update statuses across all vendors</p></div>
        <button className="btn btn-sm btn-outline" onClick={load}>↻ Refresh</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Tracking #</th><th>Order ID</th><th>Distance</th><th>Status</th><th>ETA Mean</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {!ships ? <tr><td colSpan={7}><div className="empty"><Spinner />Loading…</div></td></tr>
                : ships.length === 0 ? <tr><td colSpan={7}><div className="empty"><div className="ei">⟳</div>No shipments</div></td></tr>
                : [...ships].reverse().map(s => (
                  <tr key={s.id}>
                    <td className="mono" style={{ fontSize: "0.78rem", color: "var(--green)" }}>{s.tracking_number}</td>
                    <td className="mono" style={{ fontSize: "0.75rem", color: "var(--ink2)" }}>{s.order_id?.slice(0, 8)}…</td>
                    <td>{s.distance_km?.toFixed(1)} km</td>
                    <td><Badge s={s.status} /></td>
                    <td style={{ color: "var(--ink3)" }}>{s.eta ? Math.round(s.eta.mean_minutes) + " min" : "—"}</td>
                    <td style={{ color: "var(--ink3)", whiteSpace: "nowrap" }}>{fmtDate(s.created_at)}</td>
                    <td><button className="tbl-btn" onClick={() => { setSsModal(s); setSsStatus(s.status); }}>Update status</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {ssModal && (
        <Modal title="Update shipment status" onClose={() => setSsModal(null)}
          foot={<><button className="btn btn-outline" onClick={() => setSsModal(null)}>Cancel</button><button className="btn" onClick={submitStatus}>Update</button></>}>
          <p style={{ fontSize: "0.8rem", color: "var(--ink3)", marginBottom: "14px" }} className="mono">{ssModal.tracking_number}</p>
          <div className="field">
            <label>New status</label>
            <select value={ssStatus} onChange={e => setSsStatus(e.target.value)}>
              <option value="created">Created</option>
              <option value="in_transit">In Transit</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── APP SHELL ─────────────────────────────────────────────────────────────
export default function App() {
  const [me, setMe] = useState(null);
  const [page, setPage] = useState("overview");
  const [toast, setToast] = useState(null);
  const apiBase = useRef("http://localhost:8000");
  const [apiInput, setApiInput] = useState("http://localhost:8000");
  const api = useApi(apiBase);

  const addToast = useCallback((msg, type = "success") => {
    setToast({ msg, type, key: Date.now() });
  }, []);

  const logout = () => { setMe(null); setPage("overview"); };

  if (!me) return (
    <>
      <style>{css}</style>
      <Login onLogin={u => { setMe(u); setPage("overview"); }} />
    </>
  );

  const isAdmin = me.role === "admin";

  const NAV_VENDOR = [
    { id: "overview",  ico: "◈", label: "Overview" },
    { id: "orders",    ico: "⊕", label: "Place Order" },
    { id: "history",   ico: "≡", label: "Order History" },
    { id: "track",     ico: "◎", label: "Track Shipment" },
    { id: "inventory", ico: "▦", label: "Inventory" },
  ];
  const NAV_ADMIN = [
    { id: "admin-inv",  ico: "✦", label: "Manage Inventory" },
    { id: "admin-ship", ico: "⟳", label: "Manage Shipments" },
  ];

  const pages = {
    overview:   <Overview me={me} api={api} addToast={addToast} />,
    orders:     <PlaceOrder me={me} api={api} addToast={addToast} />,
    history:    <OrderHistory me={me} api={api} addToast={addToast} />,
    track:      <TrackShipment api={api} addToast={addToast} />,
    inventory:  <Inventory me={me} api={api} addToast={addToast} />,
    "admin-inv":  <AdminInventory api={api} addToast={addToast} />,
    "admin-ship": <AdminShipments api={api} addToast={addToast} />,
  };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="wordmark">VendorPort</div>
            <div className="tagline">{me.id}</div>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-section">Vendor</div>
            {NAV_VENDOR.map(n => (
              <div key={n.id} className={`nav-link ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
                <span className="ico">{n.ico}</span>{n.label}
              </div>
            ))}
            {isAdmin && (
              <>
                <hr className="nav-sep" />
                <div className="nav-section">Admin</div>
                {NAV_ADMIN.map(n => (
                  <div key={n.id} className={`nav-link ${page === n.id ? "active" : ""}`} onClick={() => setPage(n.id)}>
                    <span className="ico">{n.ico}</span>{n.label}<span className="admin-badge">admin</span>
                  </div>
                ))}
              </>
            )}
          </nav>
          <div className="sidebar-footer">
            <div className="user-chip">
              <div className="uname">{me.name}</div>
              <div className="uid">{me.id}{isAdmin ? " · admin" : ""}</div>
            </div>
            <button className="logout-btn" onClick={logout}>↩ Sign out</button>
          </div>
        </aside>

        <main className="main">
          <div className="api-bar">
            <span>API</span>
            <input value={apiInput} onChange={e => { setApiInput(e.target.value); apiBase.current = e.target.value; }} />
          </div>
          {pages[page]}
        </main>
      </div>

      {toast && <Toast key={toast.key} msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </>
  );
}