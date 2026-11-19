import { useMemo, useState } from 'react'
import {
  Activity, ArrowRight, ArrowUpRight, Bell, Boxes, ChartNoAxesCombined,
  Check, ChevronDown, ChevronRight, CircleHelp, Clock3, Coins, House,
  Layers3, Menu, PackageCheck, Plus, Search, ShoppingBag, Sparkles,
  Store, Truck, Users, X,
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis,
} from 'recharts'
import './dashboard.css'

const initialGroups = [
  { id: 'rice', name: 'Sona Masoori Rice', detail: 'Premium raw rice · 25 kg bag', supplier: 'Shree Ganesh Wholesale', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=240&q=85', current: 760, target: 1000, unit: 'kg', price: 48, oldPrice: 56, retailers: 18, timeLeft: '14h 20m left', accent: 'green' },
  { id: 'oil', name: 'Sunflower Oil', detail: 'Fortune · 1 litre pouch', supplier: 'Metro Cash & Carry', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=240&q=85', current: 310, target: 500, unit: 'litres', price: 112, oldPrice: 126, retailers: 12, timeLeft: '1d 6h left', accent: 'orange' },
]

const savingsData = [
  { month: 'Jun', amount: 9200 }, { month: 'Jul', amount: 11200 },
  { month: 'Aug', amount: 10100 }, { month: 'Sep', amount: 14800 },
  { month: 'Oct', amount: 13600 }, { month: 'Nov', amount: 18420 },
]

const orders = [
  { id: 'BC-24081', item: 'Toor Dal · 50 kg', supplier: 'Kaveri Distributors', date: 'Today, 10:42 am', status: 'At distribution hub', tone: 'blue' },
  { id: 'BC-24065', item: 'Tata Salt · 30 packs', supplier: 'Shree Ganesh Wholesale', date: 'Yesterday', status: 'Out for delivery', tone: 'green' },
  { id: 'BC-23992', item: 'Aashirvaad Atta · 75 kg', supplier: 'Metro Cash & Carry', date: '18 Nov 2026', status: 'Delivered', tone: 'gray' },
]

const navItems = [
  { label: 'Overview', icon: House }, { label: 'Group orders', icon: Users, count: '04' },
  { label: 'Browse products', icon: ShoppingBag }, { label: 'Orders & tracking', icon: Truck },
]

function MetricCard({ icon: Icon, label, value, suffix, note, accent }) {
  return <article className="metric-card"><div className={`metric-icon ${accent}`}><Icon size={18} /></div><div className="metric-copy"><span className="metric-label">{label}</span><strong>{value}{suffix && <small>{suffix}</small>}</strong><span className="metric-note">{note}</span></div></article>
}

function GroupCard({ group, joined, onJoin }) {
  const progress = Math.min(100, Math.round(group.current / group.target * 100))
  const discount = group.price ? Math.round((1 - group.price / group.oldPrice) * 100) : null
  return <article className="group-row">
    <div className={`product-photo ${group.accent}`}><img src={group.image} alt="" loading="lazy" />{discount && <span className="deal-tag">{discount}% off</span>}</div>
    <div className="group-details">
      <div className="group-title-line"><div><h3>{group.name}</h3><p>{group.detail}</p></div><span className="time-left"><Clock3 size={13} /> {group.timeLeft}</span></div>
      <div className="supplier-line"><Store size={13} /> {group.supplier}</div>
      <div className="progress-meta"><span><strong>{group.current}</strong> / {group.target} {group.unit} pooled</span><span>{progress}%</span></div>
      <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
      <div className="group-footer"><span className="people-count"><Users size={14} /> {group.retailers} retailers joined</span><div className="price-and-join">
        <span className="group-price">{group.price ? <>₹{group.price}<small>/{group.unit === 'kg' ? 'kg' : 'L'}</small><del>₹{group.oldPrice}</del></> : 'Price pending'}</span>
        <button className={`join-button ${joined ? 'is-joined' : ''}`} onClick={() => onJoin(group.id)} disabled={joined}>{joined ? <><Check size={14} /> Joined</> : <>Join group <ArrowRight size={14} /></>}</button>
      </div></div>
    </div>
  </article>
}

function App() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [groups, setGroups] = useState(initialGroups)
  const [joinedGroups, setJoinedGroups] = useState([])
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All groups')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showStoreMenu, setShowStoreMenu] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newProduct, setNewProduct] = useState('')
  const [newQuantity, setNewQuantity] = useState('')
  const [toast, setToast] = useState('')

  const filteredGroups = useMemo(() => groups.filter((group) => {
    const matchesQuery = `${group.name} ${group.supplier}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (filter === 'All groups' || group.timeLeft.startsWith('14h'))
  }), [filter, groups, query])

  function notify(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  function joinGroup(groupId) {
    setJoinedGroups((joined) => [...joined, groupId])
    setGroups((current) => current.map((group) => group.id === groupId ? { ...group, current: Math.min(group.current + 25, group.target), retailers: group.retailers + 1 } : group))
    notify('You joined the collective order')
  }

  function createGroup(event) {
    event.preventDefault()
    if (!newProduct.trim() || !newQuantity) return
    setGroups((current) => [{
      id: `custom-${Date.now()}`, name: newProduct.trim(), detail: 'Your neighbourhood group · New request',
      supplier: 'Finding wholesale suppliers', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=240&q=85',
      current: Number(newQuantity), target: Number(newQuantity) * 2, unit: 'units', price: null,
      oldPrice: null, retailers: 1, timeLeft: 'Just started', accent: 'green',
    }, ...current])
    setShowCreateGroup(false)
    setNewProduct('')
    setNewQuantity('')
    notify('Your group order request is ready')
  }

  const description = activeNav === 'Overview'
    ? 'Here’s what’s happening with your procurement today.'
    : activeNav === 'Group orders'
      ? 'Pool your demand with nearby retailers to unlock better prices.'
      : activeNav === 'Browse products'
        ? 'Find wholesale deals and join a neighbourhood buying group.'
        : 'Follow every order from supplier confirmation to your storefront.'

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      <a className="brand" href="#overview" onClick={() => setActiveNav('Overview')}><span className="brand-mark"><Boxes size={21} /></span><span className="brand-name">bizz<span>connect</span><small>RETAILER WORKSPACE</small></span></a>
      <button className="store-switcher" onClick={() => setShowStoreMenu((open) => !open)}><span className="store-avatar"><Store size={16} /></span><span className="store-copy"><strong>Sharma General Store</strong><small>Indiranagar, Bengaluru</small></span><ChevronDown size={15} /></button>
      {showStoreMenu && <div className="store-popover">Retailer account<strong>Verified store</strong><span>Member since March 2025</span></div>}
      <div className="nav-caption">WORKSPACE</div>
      <nav className="main-nav" aria-label="Main navigation">{navItems.map(({ label, icon: Icon, count }) => <button key={label} className={`nav-link ${activeNav === label ? 'active' : ''}`} onClick={() => { setActiveNav(label); setMobileMenuOpen(false) }}><Icon size={17} /><span>{label}</span>{count && <span className="nav-count">{count}</span>}</button>)}</nav>
      <div className="nav-caption tools-caption">YOUR BUSINESS</div>
      <nav className="main-nav" aria-label="Business tools"><button className="nav-link" onClick={() => setActiveNav('Savings & insights')}><ChartNoAxesCombined size={17} /><span>Savings & insights</span></button><button className="nav-link" onClick={() => setActiveNav('Suppliers')}><Layers3 size={17} /><span>My suppliers</span></button></nav>
      <div className="sidebar-spacer" />
      <div className="power-card"><div className="power-heading"><span><Sparkles size={14} /> RETAILER POWER</span><strong>84</strong></div><div className="power-bar"><span /></div><p>You’re in the top 18% of active retailers.</p><button onClick={() => setActiveNav('Savings & insights')}>See your insights <ArrowRight size={13} /></button></div>
      <button className="sidebar-help" onClick={() => setShowStoreMenu((open) => !open)}><CircleHelp size={17} /> Help & support <ChevronRight size={15} /></button>
      <div className="profile-row"><div className="profile-avatar">AS</div><div><strong>Asha Sharma</strong><span>Store owner</span></div><button aria-label="Open profile menu"><ChevronDown size={15} /></button></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><button className="mobile-menu-button" aria-label="Toggle navigation" onClick={() => setMobileMenuOpen((open) => !open)}><Menu size={19} /></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{activeNav}</strong></div><div className="topbar-actions">
        <label className="search-box"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, suppliers..." /><kbd>⌘ K</kbd></label>
        <div className="notification-wrap"><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setShowNotifications((visible) => !visible)}><Bell size={18} /><i /></button>{showNotifications && <div className="notification-popover"><strong>Notifications</strong><p><span className="notification-dot" />Sunflower oil group order closes in 1 day.</p><p><span className="notification-dot blue-dot" />Toor Dal order reached the distribution hub.</p><button onClick={() => setShowNotifications(false)}>Mark all as read</button></div>}</div>
        <button className="top-avatar" aria-label="Asha Sharma profile">AS</button>
      </div></header>

      <div className="page-content">
        <section className="welcome-row"><div><div className="eyebrow"><span /> THURSDAY, 19 NOVEMBER 2026</div><h1>{activeNav === 'Overview' ? 'Good morning, Asha' : activeNav}</h1><p>{description}</p></div><button className="primary-button" onClick={() => setShowCreateGroup(true)}><Plus size={17} /> Start a group order</button></section>
        <section className="metrics-grid" aria-label="Procurement summary">
          <MetricCard icon={Coins} label="Savings this month" value="₹18,420" note="↗ 14.8% vs last month" accent="mint" />
          <MetricCard icon={Users} label="Active group orders" value="04" note="2 closing soon" accent="blue" />
          <MetricCard icon={Truck} label="Orders in transit" value="02" note="1 arriving today" accent="orange" />
          <MetricCard icon={Activity} label="Retailer power index" value="84" suffix=" / 100" note="Top 18% in your area" accent="pink" />
        </section>

        <section className="dashboard-grid">
          <article className="panel group-panel"><div className="panel-heading"><div><div className="section-kicker">BUY TOGETHER</div><h2>Collective buying</h2><p>Join other stores to unlock wholesale pricing.</p></div><button className="text-button" onClick={() => setActiveNav('Group orders')}>View all <ArrowRight size={15} /></button></div>
            <div className="group-toolbar"><span className="live-indicator"><i /> LIVE GROUPS <b>04</b></span><button className={`filter-button ${filter === 'Ending soon' ? 'selected' : ''}`} onClick={() => setFilter(filter === 'All groups' ? 'Ending soon' : 'All groups')}><Clock3 size={13} /> {filter} <ChevronDown size={13} /></button></div>
            <div className="group-list">{filteredGroups.length ? filteredGroups.map((group) => <GroupCard key={group.id} group={group} joined={joinedGroups.includes(group.id)} onJoin={joinGroup} />) : <div className="empty-state"><Search size={20} /><strong>No matching group orders</strong><span>Try a different product or supplier name.</span></div>}</div>
            <button className="browse-link" onClick={() => setActiveNav('Browse products')}>Explore all wholesale deals <ArrowRight size={15} /></button>
          </article>

          <article className="panel savings-panel"><div className="panel-heading compact-heading"><div><div className="section-kicker">YOUR BUYING POWER</div><h2>Savings over time</h2></div><button className="period-button">6 months <ChevronDown size={13} /></button></div>
            <div className="savings-total"><strong>₹18,420</strong><span><ArrowUpRight size={13} /> 14.8%</span></div><p className="chart-caption">Saved through collective orders</p>
            <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={savingsData} margin={{ top: 12, right: 2, left: -24, bottom: 0 }}><defs><linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#55b989" stopOpacity={0.24} /><stop offset="100%" stopColor="#55b989" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e9eeeb" strokeDasharray="3 4" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8a9690', fontSize: 11 }} dy={8} /><Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Saved']} contentStyle={{ border: '1px solid #e6ece8', borderRadius: 7, fontSize: 12 }} /><Area type="monotone" dataKey="amount" stroke="#349c6b" strokeWidth={2.5} fill="url(#savingsFill)" activeDot={{ r: 4 }} /></AreaChart></ResponsiveContainer></div>
            <div className="chart-footnote"><span><i /> Collective buying</span><button onClick={() => setActiveNav('Savings & insights')}>Full report <ArrowRight size={13} /></button></div><div className="insight-note"><span><Sparkles size={15} /></span><p><strong>Nice work!</strong> You saved ₹4,280 more than nearby stores this month.</p></div>
          </article>
        </section>

        <section className="lower-grid"><article className="panel orders-panel"><div className="panel-heading orders-heading"><div><div className="section-kicker">KEEP AN EYE ON IT</div><h2>Recent orders</h2></div><button className="text-button" onClick={() => setActiveNav('Orders & tracking')}>All orders <ArrowRight size={15} /></button></div><div className="order-table-wrap"><table className="order-table"><thead><tr><th>ORDER</th><th>SUPPLIER</th><th>LAST UPDATE</th><th>STATUS</th><th /></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><strong>{order.item}</strong><span>{order.id}</span></td><td>{order.supplier}</td><td>{order.date}</td><td><span className={`status-pill ${order.tone}`}>{order.status}</span></td><td><button className="row-action" aria-label={`Track ${order.id}`} onClick={() => setActiveNav('Orders & tracking')}><ChevronRight size={16} /></button></td></tr>)}</tbody></table></div></article>
          <article className="panel recommendation-panel"><div className="panel-heading compact-heading"><div><div className="section-kicker">SMART REORDER</div><h2>Worth a look</h2></div><span className="sparkle-mark"><Sparkles size={15} /></span></div><div className="recommendation-item"><div className="recommendation-photo"><img src="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=180&q=85" alt="Wheat grains" loading="lazy" /></div><div className="recommendation-copy"><span className="recommendation-label">PRICE DROP · 3 STORES NEARBY</span><strong>Whole wheat atta</strong><span>Current price <b>₹34/kg</b> <del>₹39/kg</del></span></div></div><div className="recommendation-footer"><span><PackageCheck size={14} /> MOQ 100 kg · 68 kg pledged</span><button aria-label="View atta group order" onClick={() => { setQuery('atta'); setActiveNav('Group orders') }}><ArrowRight size={15} /></button></div></article>
        </section>
        <footer className="page-footer"><span>© 2026 BizzConnect</span><span>Better prices, built together <span className="footer-heart">♥</span></span></footer>
      </div>
    </main>

    {showCreateGroup && <div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setShowCreateGroup(false) }}><form className="create-modal" onSubmit={createGroup}><div className="modal-heading"><span className="modal-icon"><Users size={18} /></span><button type="button" className="icon-button" aria-label="Close dialog" onClick={() => setShowCreateGroup(false)}><X size={18} /></button></div><div className="section-kicker">COLLECTIVE BUYING</div><h2>Start a group order</h2><p>Tell nearby retailers what you need. We’ll help find a wholesale deal.</p><label>Product name<input autoFocus value={newProduct} onChange={(event) => setNewProduct(event.target.value)} placeholder="e.g. Basmati rice" required /></label><label>Your quantity<input type="number" min="1" value={newQuantity} onChange={(event) => setNewQuantity(event.target.value)} placeholder="e.g. 50" required /><small>Other stores can add their quantity once your group is live.</small></label><div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setShowCreateGroup(false)}>Cancel</button><button type="submit" className="primary-button"><Plus size={16} /> Create group</button></div></form></div>}
    {toast && <div className="toast-message"><span><Check size={15} /></span>{toast}</div>}
  </div>
}

export default App
