import { useCallback, useEffect, useState } from 'react'
import {
  Activity, ArrowRight, ArrowUpRight, Bell, Boxes, ChartNoAxesCombined,
  Check, ChevronDown, ChevronRight, CircleHelp, Clock3, Coins, House,
  FileText, Layers3, Menu, PackageCheck, Plus, RefreshCw, Search, ShoppingBag,
  Sparkles, Store, Truck, UserRound, Users, Wallet, X,
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis,
} from 'recharts'
import { AdminWorkspace, InvoiceDialog, ProfileDialog, WholesalerWorkspace } from './Workspaces.jsx'
import './dashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const savingsMonths = Array.from({ length: 6 }, (_, index) => {
  const date = new Date()
  date.setDate(1)
  date.setMonth(date.getMonth() - 5 + index)
  return { key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`, month: date.toLocaleDateString('en-IN', { month: 'short' }) }
})
const todayLabel = new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).format(new Date()).toUpperCase()

async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('bizzconnect_token')
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.message || 'Request failed')
  return payload
}

const navItems = [
  { label: 'Overview', icon: House }, { label: 'Group orders', icon: Users },
  { label: 'Browse products', icon: ShoppingBag }, { label: 'Orders & tracking', icon: Truck },
  { label: 'Billing & records', icon: FileText },
]

function MetricCard({ icon: Icon, label, value, suffix, note, accent }) {
  return <article className="metric-card"><div className={`metric-icon ${accent}`}><Icon size={18} /></div><div className="metric-copy"><span className="metric-label">{label}</span><strong>{value}{suffix && <small>{suffix}</small>}</strong><span className="metric-note">{note}</span></div></article>
}

function GroupCard({ group, joined, ordered, onJoin, onCheckout }) {
  const progress = Math.min(100, Math.round(group.current / group.target * 100))
  const discount = group.price ? Math.round((1 - group.price / group.oldPrice) * 100) : null
  return <article className="group-row">
    <div className={`product-photo ${group.accent}`}><img src={group.image} alt="" loading="lazy" />{discount && <span className="deal-tag">{discount}% off</span>}</div>
    <div className="group-details">
      <div className="group-title-line"><div><h3>{group.name}</h3><p>{group.detail}</p></div><span className="time-left"><Clock3 size={13} /> {group.timeLeft}</span></div>
      <div className="supplier-line" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Store size={13} />
        <span>{group.supplier}</span>
        {group.status === 'bidding' && <span className="status-pill blue">Wholesalers bidding</span>}
        {(group.status === 'supplier_selected' || group.status === 'checkout') && <span className="status-pill green">Supplier selected</span>}
        {group.status === 'threshold_reached' && <span className="status-pill orange">Target reached</span>}
      </div>
      <div className="progress-meta"><span><strong>{group.current}</strong> / {group.target} {group.unit} pooled</span><span>{progress}%</span></div>
      <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
      <div className="group-footer"><span className="people-count"><Users size={14} /> {group.retailers} retailers joined</span><div className="price-and-join">
        <span className="group-price">{group.price ? <>₹{group.price}<small>/{group.unit === 'kg' ? 'kg' : 'L'}</small><del>₹{group.oldPrice}</del></> : 'Price pending'}</span>
        {ordered
          ? <button className="join-button is-joined" disabled><Check size={14} /> Order placed</button>
          : group.status === 'supplier_selected' || group.status === 'confirmed' || group.status === 'checkout'
          ? <button className="join-button" disabled={!joined} onClick={() => onCheckout(group)}>{joined ? <>Checkout <ArrowRight size={14} /></> : 'Not in group'}</button>
          : <button className={`join-button ${joined ? 'is-joined' : ''}`} onClick={() => onJoin(group)} disabled={joined}>{joined ? <><Check size={14} /> Joined</> : <>Join group <ArrowRight size={14} /></>}</button>}
      </div></div>
    </div>
  </article>
}

function getGroupPledge(group, userId) {
  return group.raw?.participants?.find((participant) => String(participant.retailer?._id || participant.retailer) === String(userId))?.quantity || 0
}

function getCheckoutTotal(group, userId) {
  const subtotal = getGroupPledge(group, userId) * Number(group.raw?.finalPricePerUnit || group.price || 0)
  return subtotal + (subtotal >= 5000 ? 0 : 150)
}

function getDeliveryFee(group, userId) {
  const subtotal = getGroupPledge(group, userId) * Number(group.raw?.finalPricePerUnit || group.price || 0)
  return subtotal >= 5000 ? 0 : 150
}

function App() {
  const [activeNav, setActiveNav] = useState('Overview')
  const [groups, setGroups] = useState([])
  const [joinedGroups, setJoinedGroups] = useState([])
  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [filter, setFilter] = useState('All groups')
  const [showNotifications, setShowNotifications] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [newProduct, setNewProduct] = useState('')
  const [newQuantity, setNewQuantity] = useState('')
  const [toast, setToast] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const [authReady, setAuthReady] = useState(() => !localStorage.getItem('bizzconnect_token'))
  const [authMode, setAuthMode] = useState('login')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', role: 'retailer', storeName: '', storeAddress: '', neighbourhood: '', city: '', businessName: '', businessAddress: '', gstin: '' })
  const [apiProducts, setApiProducts] = useState([])
  const [serverOrders, setServerOrders] = useState([])
  const [payments, setPayments] = useState([])
  const [profileOpen, setProfileOpen] = useState(false)
  const [joinTarget, setJoinTarget] = useState(null)
  const [joinQuantity, setJoinQuantity] = useState('25')
  const [checkoutGroup, setCheckoutGroup] = useState(null)
  const [checkoutOrder, setCheckoutOrder] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [simulateFailure, setSimulateFailure] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [invoice, setInvoice] = useState(null)

  const notify = useCallback((message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('bizzconnect_token')
    if (!token) return

    apiRequest('/auth/me')
      .then((payload) => setCurrentUser(payload.data))
      .catch(() => {
        localStorage.removeItem('bizzconnect_token')
        localStorage.removeItem('bizzconnect_user')
      })
      .finally(() => setAuthReady(true))
  }, [])

  const loadData = useCallback(async (quiet = false) => {
    if (!currentUser) return
    try {
      const [productPayload, groupPayload, orderPayload, paymentPayload] = await Promise.all([
        apiRequest('/products'), apiRequest('/group-orders'), apiRequest('/orders'), apiRequest('/payments')
      ])
      setApiProducts(productPayload.data || [])
      setServerOrders(orderPayload.data || [])
      setPayments(paymentPayload.data || [])
      const loadedGroups = (groupPayload.data || []).map((group) => ({
        id: group._id,
        name: group.title,
        detail: group.description || `${group.unit} collective order`,
        supplier: group.selectedSupplier?.businessName || 'Supplier selection pending',
        image: group.product?.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=240&q=85',
        current: group.currentQuantity,
        target: group.targetQuantity,
        unit: group.unit,
        price: group.finalPricePerUnit || group.estimatedPricePerUnit,
        oldPrice: group.product?.retailPrice || group.estimatedPricePerUnit,
        retailers: group.participants?.length || 0,
        timeLeft: `${Math.max(0, Math.ceil((new Date(group.deadline) - Date.now()) / 3600000))}h left`,
        status: group.status,
        raw: group,
        accent: 'green',
      }))
      setGroups(loadedGroups)
      setJoinedGroups(loadedGroups.filter((group) => group.raw.participants?.some((participant) => String(participant.retailer?._id || participant.retailer) === String(currentUser._id))).map((group) => group.id))
    } catch (error) {
      if (!quiet) notify(error.message)
    }
  }, [currentUser, notify])

  useEffect(() => {
    if (!currentUser) return undefined
    loadData(true)
    const interval = setInterval(() => { loadData(true) }, 3500)
    const onFocus = () => loadData(true)
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [currentUser, loadData])

  async function switchDemoRole(role) {
    const accounts = {
      retailer: { email: 'retailer@bizzconnect.local', password: 'Retailer123!' },
      wholesaler: { email: 'wholesaler@bizzconnect.local', password: 'Wholesaler123!' },
      admin: { email: 'admin@bizzconnect.local', password: 'Admin123!' },
    }
    const acc = accounts[role]
    if (!acc) return
    try {
      const payload = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(acc) })
      localStorage.setItem('bizzconnect_token', payload.data.token)
      localStorage.setItem('bizzconnect_user', JSON.stringify(payload.data.user))
      setCurrentUser(payload.data.user)
      notify(`Switched to ${payload.data.user.name} (${payload.data.user.role})`)
    } catch (err) {
      notify(`Switch failed: ${err.message}`)
    }
  }

  const searchTerm = query.trim().toLowerCase()
  const filteredGroups = groups.filter((group) => {
    const matchesQuery = `${group.name} ${group.supplier} ${group.detail}`.toLowerCase().includes(searchTerm)
    const hoursLeft = Number(group.timeLeft.match(/^\d+/)?.[0] || Number.POSITIVE_INFINITY)
    return matchesQuery && (filter === 'All groups' || hoursLeft <= 24)
  })
  const filteredProducts = apiProducts.filter((product) => `${product.name} ${product.category} ${product.wholesaler?.businessName || ''}`.toLowerCase().includes(searchTerm))
  const filteredOrders = serverOrders.filter((order) => `${order.orderNumber} ${order.status} ${order.paymentStatus} ${order.wholesaler?.businessName || order.wholesaler?.name || ''} ${(order.items || []).map((item) => item.product?.name || '').join(' ')}`.toLowerCase().includes(searchTerm))
  const filteredPayments = payments.filter((payment) => `${payment.transactionId || ''} ${payment.method} ${payment.status} ${payment.order?.orderNumber || ''} ${payment.order?.wholesaler?.businessName || ''} ${(payment.order?.items || []).map((item) => item.product?.name || '').join(' ')}`.toLowerCase().includes(searchTerm))
  const supplierDirectory = Array.from(new Map([...apiProducts.map((product) => product.wholesaler), ...serverOrders.map((order) => order.wholesaler)].filter(Boolean).map((supplier) => [supplier._id, supplier])).values())
  const filteredSuppliers = supplierDirectory.filter((supplier) => `${supplier.businessName || ''} ${supplier.name || ''} ${supplier.email || ''}`.toLowerCase().includes(searchTerm))
  const actionGroups = groups.filter((group) => ['open', 'threshold_reached', 'bidding'].includes(group.status)).slice(0, 2)
  const activeShipments = serverOrders.filter((order) => ['at_distribution_hub', 'out_for_delivery', 'processing'].includes(order.status)).slice(0, 2)

  const orderSavings = serverOrders.reduce((total, order) => {
    if (order.paymentStatus !== 'completed') return total
    return total + (order.items || []).reduce((itemTotal, item) => {
      const retailPrice = Number(item.product?.retailPrice || item.pricePerUnit)
      return itemTotal + Math.max(0, (retailPrice - Number(item.pricePerUnit)) * Number(item.quantity))
    }, 0)
  }, 0)
  const savedAmount = Math.max(Number(currentUser?.totalSavings || 0), orderSavings)

  const orderSavingsByMonth = savingsMonths.map((month) => {
      const monthOrders = serverOrders.filter((order) => order.paymentStatus === 'completed' && order.createdAt?.slice(0, 7) === month.key)
      const amount = monthOrders.reduce((sum, order) => sum + (order.items || []).reduce((itemSum, item) => itemSum + Math.max(0, (Number(item.product?.retailPrice || item.pricePerUnit) - Number(item.pricePerUnit)) * Number(item.quantity)), 0), 0)
      return { month: month.month, amount }
  })
  const savingsData = currentUser?.savingsHistory?.length
    ? currentUser.savingsHistory.map((entry, index) => ({
      month: entry.month,
      amount: Math.max(Number(entry.amount || 0), orderSavingsByMonth[index]?.amount || 0),
    }))
    : orderSavingsByMonth

  async function joinGroup(groupId) {
    setJoinTarget(groups.find((group) => group.id === groupId))
  }

  async function submitJoinGroup(event) {
    event.preventDefault()
    if (!joinTarget || !joinQuantity) return
    try {
      const payload = await apiRequest(`/group-orders/${joinTarget.id}/join`, { method: 'POST', body: JSON.stringify({ quantity: Number(joinQuantity) }) })
      setGroups((current) => current.map((group) => group.id === joinTarget.id ? { ...group, current: payload.data.currentQuantity, retailers: payload.data.participants.length, status: payload.data.status, raw: payload.data } : group))
      setJoinedGroups((joined) => joined.includes(joinTarget.id) ? joined : [...joined, joinTarget.id])
      setJoinTarget(null)
      notify('You joined the collective order')
    } catch (error) {
      notify(error.message)
    }
  }

  async function checkout(group) {
    setCheckoutGroup(group)
    setCheckoutOrder(null)
    setSimulateFailure(false)
  }

  async function payForGroup(event) {
    event.preventDefault()
    setPaymentLoading(true)
    try {
      let order = checkoutOrder
      if (!order) {
        const orderPayload = await apiRequest(`/orders/from-group/${checkoutGroup.id}`, { method: 'POST', body: JSON.stringify({ deliveryAddress: currentUser.storeAddress }) })
        order = orderPayload.data
        setCheckoutOrder(order)
      }
      const paymentPayload = await apiRequest('/payments/process', { method: 'POST', body: JSON.stringify({ order: order._id, method: paymentMethod, simulateFailure }) })
      if (!paymentPayload.success) throw new Error(paymentPayload.message || 'Simulated payment failed')
      const completeOrder = {
        ...order,
        retailer: currentUser,
        wholesaler: checkoutGroup.raw.selectedSupplier,
        items: order.items?.map((item) => ({ ...item, product: { name: checkoutGroup.name, unit: checkoutGroup.unit, retailPrice: checkoutGroup.oldPrice } })),
        paymentStatus: 'completed',
        updatedAt: new Date().toISOString(),
      }
      setInvoice({ order: completeOrder, payment: paymentPayload.data })
      setCheckoutGroup(null)
      loadData(true)
      notify('Payment successful. Invoice is ready.')
    } catch (error) {
      notify(error.message)
    } finally {
      setPaymentLoading(false)
    }
  }

  async function retryPayment(order) {
    setPaymentLoading(true)
    try {
      const payload = await apiRequest('/payments/process', { method: 'POST', body: JSON.stringify({ order: order._id, method: paymentMethod }) })
      const refreshed = await apiRequest('/orders')
      setServerOrders(refreshed.data || [])
      setInvoice({ order: { ...order, retailer: currentUser, paymentStatus: 'completed', updatedAt: new Date().toISOString() }, payment: payload.data })
      notify('Payment successful. Invoice is ready.')
    } catch (error) {
      notify(error.message)
    } finally {
      setPaymentLoading(false)
    }
  }

  async function createGroup(event) {
    event.preventDefault()
    if (!newProduct.trim() || !newQuantity) return

    const matchedProduct = apiProducts.find((product) => product.name.toLowerCase().includes(newProduct.trim().toLowerCase()))
    if (!matchedProduct) {
      notify('No matching catalogue product found')
      return
    }

    try {
      const payload = await apiRequest('/group-orders', {
        method: 'POST',
        body: JSON.stringify({
          product: matchedProduct._id,
          title: matchedProduct.name,
          description: 'Retailer collective order',
          targetQuantity: Number(newQuantity) * 2,
          initialQuantity: Number(newQuantity),
          estimatedPricePerUnit: matchedProduct.wholesalePrice,
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }),
      })
      const group = payload.data
      setGroups((current) => [{
        id: group._id,
        name: group.title,
        detail: 'Retailer collective order',
        supplier: 'Supplier selection pending',
        image: matchedProduct.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=240&q=85',
        current: group.currentQuantity,
        target: group.targetQuantity,
        unit: matchedProduct.unit,
        price: matchedProduct.wholesalePrice,
        oldPrice: matchedProduct.retailPrice,
        retailers: group.participants?.length || 1,
        timeLeft: '24h left',
        status: group.status,
        raw: group,
        accent: 'green',
      }, ...current])
      setJoinedGroups((joined) => joined.includes(group._id) ? joined : [...joined, group._id])
      setShowCreateGroup(false)
      setNewProduct('')
      setNewQuantity('')
      notify('Your group order is live')
      loadData(true)
    } catch (error) {
      notify(error.message)
    }
  }

  async function handleAuth(event) {
    event.preventDefault()
    setAuthError('')
    setAuthLoading(true)
    try {
      const path = authMode === 'login' ? '/auth/login' : '/auth/register'
      const body = authMode === 'login'
        ? { email: authForm.email, password: authForm.password }
        : authForm
      const payload = await apiRequest(path, { method: 'POST', body: JSON.stringify(body) })
      localStorage.setItem('bizzconnect_token', payload.data.token)
      localStorage.setItem('bizzconnect_user', JSON.stringify(payload.data.user))
      setCurrentUser(payload.data.user)
      notify(authMode === 'login' ? 'Welcome back' : 'Account created')
    } catch (error) {
      setAuthError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('bizzconnect_token')
    localStorage.removeItem('bizzconnect_user')
    setCurrentUser(null)
    setProfileOpen(false)
    setShowCreateGroup(false)
    setJoinTarget(null)
    setCheckoutGroup(null)
    setInvoice(null)
  }

  const description = activeNav === 'Overview'
    ? 'Here’s what’s happening with your procurement today.'
    : activeNav === 'Group orders'
      ? 'Pool your demand with nearby retailers to unlock better prices.'
      : activeNav === 'Browse products'
        ? 'Find wholesale deals and join a neighbourhood buying group.'
        : activeNav === 'Billing & records'
          ? 'Review paid bills, payment attempts, and your past procurement records.'
        : 'Follow every order from supplier confirmation to your storefront.'

  if (!authReady) return <div className="auth-loading"><span className="brand-mark"><Boxes size={21} /></span><strong>Loading BizzConnect...</strong></div>

  if (!currentUser) return <main className="auth-page">
    <section className="auth-brand-panel">
      <div className="auth-brand"><span className="brand-mark"><Boxes size={21} /></span><span className="brand-name">bizz<span>connect</span><small>RETAILER WORKSPACE</small></span></div>
      <div className="auth-brand-copy"><div className="auth-kicker">COLLECTIVE PROCUREMENT</div><h1>Buy together.<br />Grow together.</h1><p>Pool demand with nearby retailers, unlock wholesale prices, and follow every order from supplier to store.</p></div>
    </section>
    <section className="auth-form-panel">
      <form className="auth-form" onSubmit={handleAuth}>
        <div className="auth-tabs"><button type="button" className={authMode === 'login' ? 'active' : ''} onClick={() => { setAuthMode('login'); setAuthError('') }}>Sign in</button><button type="button" className={authMode === 'register' ? 'active' : ''} onClick={() => { setAuthMode('register'); setAuthError('') }}>Create account</button></div>
        <div className="auth-heading"><div className="section-kicker">BIZZCONNECT ACCOUNT</div><h2>{authMode === 'login' ? 'Welcome back' : `Create your ${authForm.role} account`}</h2><p>{authMode === 'login' ? 'Sign in to manage your procurement workspace.' : 'Use your business details to set up your workspace.'}</p></div>
        {authMode === 'register' && <label>Full name<input value={authForm.name} onChange={(event) => setAuthForm((form) => ({ ...form, name: event.target.value }))} placeholder="Asha Sharma" required /></label>}
        <label>Email address<input type="email" value={authForm.email} onChange={(event) => setAuthForm((form) => ({ ...form, email: event.target.value }))} placeholder="you@store.com" required /></label>
        <label>Password<input type="password" value={authForm.password} onChange={(event) => setAuthForm((form) => ({ ...form, password: event.target.value }))} placeholder="At least 6 characters" required /></label>
        {authMode === 'register' && <>
          <label>Account type<select value={authForm.role} onChange={(event) => setAuthForm((form) => ({ ...form, role: event.target.value }))}><option value="retailer">Retailer</option><option value="wholesaler">Wholesaler</option></select></label>
          {authForm.role === 'retailer' ? <>
            <label>Store name<input value={authForm.storeName} onChange={(event) => setAuthForm((form) => ({ ...form, storeName: event.target.value }))} placeholder="Sharma General Store" required /></label>
            <label>Neighbourhood<input value={authForm.neighbourhood} onChange={(event) => setAuthForm((form) => ({ ...form, neighbourhood: event.target.value }))} placeholder="Indiranagar" /></label>
            <label>City<input value={authForm.city} onChange={(event) => setAuthForm((form) => ({ ...form, city: event.target.value }))} placeholder="Bengaluru" /></label>
            <label>Store address<input value={authForm.storeAddress} onChange={(event) => setAuthForm((form) => ({ ...form, storeAddress: event.target.value }))} placeholder="Street, area, city" /></label>
          </> : <>
            <label>Business name<input value={authForm.businessName} onChange={(event) => setAuthForm((form) => ({ ...form, businessName: event.target.value }))} placeholder="Metro Cash & Carry" required /></label>
            <label>Business address<input value={authForm.businessAddress} onChange={(event) => setAuthForm((form) => ({ ...form, businessAddress: event.target.value }))} placeholder="Warehouse address" /></label>
            <label>GSTIN<input value={authForm.gstin} onChange={(event) => setAuthForm((form) => ({ ...form, gstin: event.target.value }))} placeholder="Optional GSTIN" /></label>
          </>}
        </>}
        {authError && <div className="auth-error">{authError}</div>}
        <button className="auth-submit" type="submit" disabled={authLoading}>{authLoading ? 'Please wait...' : authMode === 'login' ? 'Sign in' : 'Create account'}<ArrowRight size={16} /></button>
        {authMode === 'login' && <div className="demo-login-group">
          <button type="button" className="demo-login-btn" onClick={() => setAuthForm((form) => ({ ...form, email: 'retailer@bizzconnect.local', password: 'Retailer123!' }))}>Demo Retailer (Asha Sharma)</button>
          <button type="button" className="demo-login-btn" onClick={() => setAuthForm((form) => ({ ...form, email: 'wholesaler@bizzconnect.local', password: 'Wholesaler123!' }))}>Demo Wholesaler (Metro Cash & Carry)</button>
          <button type="button" className="demo-login-btn" onClick={() => setAuthForm((form) => ({ ...form, email: 'admin@bizzconnect.local', password: 'Admin123!' }))}>Demo Admin (Platform Operations)</button>
        </div>}
      </form>
    </section>
  </main>

  if (currentUser.role === 'wholesaler' || currentUser.role === 'admin') {
    const Workspace = currentUser.role === 'admin' ? AdminWorkspace : WholesalerWorkspace
    return <><Workspace user={currentUser} apiRequest={apiRequest} searchValue={query} onSearch={setQuery} searchOpen={searchOpen} onToggleSearch={() => setSearchOpen((open) => !open)} onProfile={() => setProfileOpen(true)} onLogout={logout} onSwitchRole={switchDemoRole} notify={notify} />{profileOpen && <ProfileDialog user={currentUser} apiRequest={apiRequest} onClose={() => setProfileOpen(false)} onUpdated={(user) => { setCurrentUser(user); localStorage.setItem('bizzconnect_user', JSON.stringify(user)) }} onLogout={logout} notify={notify} />}{toast && <div className="toast-message"><span><Check size={15} /></span>{toast}</div>}</>
  }

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      <a className="brand" href="#overview" onClick={() => setActiveNav('Overview')}><span className="brand-mark"><Boxes size={21} /></span><span className="brand-name">bizz<span>connect</span><small>RETAILER WORKSPACE</small></span></a>
      <button className="store-switcher" onClick={() => setProfileOpen(true)}><span className="store-avatar"><Store size={16} /></span><span className="store-copy"><strong>{currentUser.storeName || currentUser.businessName || currentUser.name}</strong><small>{[currentUser.neighbourhood, currentUser.city].filter(Boolean).join(', ') || currentUser.storeAddress || currentUser.email}</small></span><ChevronDown size={15} /></button>
      <div className="nav-caption">WORKSPACE</div>
      <nav className="main-nav" aria-label="Main navigation">{navItems.map(({ label, icon: Icon }) => <button key={label} className={`nav-link ${activeNav === label ? 'active' : ''}`} onClick={() => { setActiveNav(label); setMobileMenuOpen(false) }}><Icon size={17} /><span>{label}</span>{label === 'Group orders' && groups.length > 0 && <span className="nav-count">{groups.length}</span>}</button>)}</nav>
      <div className="nav-caption tools-caption">YOUR BUSINESS</div>
      <nav className="main-nav" aria-label="Business tools"><button className="nav-link" onClick={() => setActiveNav('Savings & insights')}><ChartNoAxesCombined size={17} /><span>Savings & insights</span></button><button className="nav-link" onClick={() => setActiveNav('Suppliers')}><Layers3 size={17} /><span>My suppliers</span></button></nav>
      <div className="sidebar-spacer" />
      <div className="power-card"><div className="power-heading"><span><Sparkles size={14} /> RETAILER POWER</span><strong>{currentUser.powerIndex || 50}</strong></div><div className="power-bar"><span style={{ width: `${currentUser.powerIndex || 50}%` }} /></div><p>Your score is based on buying and fulfilment activity.</p><button onClick={() => setActiveNav('Savings & insights')}>See your insights <ArrowRight size={13} /></button></div>
      <button className="sidebar-help" onClick={() => notify('Support: contact support@bizzconnect.local')}><CircleHelp size={17} /> Help & support <ChevronRight size={15} /></button>
      <div className="profile-row"><div className="profile-avatar">{(currentUser.name || 'User').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div><div><strong>{currentUser.name}</strong><span>{currentUser.storeName || currentUser.businessName || currentUser.role}</span></div><button aria-label="Open profile details" title="Profile details" onClick={() => setProfileOpen(true)}><UserRound size={15} /></button></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><button className="mobile-menu-button" aria-label="Toggle navigation" onClick={() => setMobileMenuOpen((open) => !open)}><Menu size={19} /></button><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{activeNav}</strong></div><div className="topbar-actions">
        <span className="sync-live-badge"><span className="sync-live-dot" /> LIVE</span>
        <div className="demo-switch-bar"><span className="demo-switch-tag">ROLE:</span><button type="button" className="active">Retailer</button><button type="button" onClick={() => switchDemoRole('wholesaler')}>Wholesaler</button><button type="button" onClick={() => switchDemoRole('admin')}>Admin</button></div>
        <button type="button" className="icon-button" title="Refresh live data" onClick={() => loadData(false)}><RefreshCw size={15} /></button>
        <div className={`search-box ${searchOpen ? 'is-open' : ''}`}><button type="button" className="search-toggle" aria-label={searchOpen ? 'Close search' : 'Open search'} onClick={() => setSearchOpen((open) => !open)}><Search size={16} /></button><input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') setSearchOpen(false) }} placeholder={`Search ${activeNav.toLowerCase()}...`} /><kbd>⌘ K</kbd></div>
        <div className="notification-wrap"><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setShowNotifications((visible) => !visible)}><Bell size={18} /><i /></button>{showNotifications && <div className="notification-popover"><strong>Notifications</strong>{actionGroups.map((group) => <p key={group.id}><span className="notification-dot" />{group.name}: {group.current} / {group.target} {group.unit} pooled, {group.timeLeft}.</p>)}{activeShipments.map((order) => <p key={order._id}><span className="notification-dot blue-dot" />{order.orderNumber} is {order.status.replaceAll('_', ' ')}.</p>)}{!actionGroups.length && !activeShipments.length && <p>You’re all caught up. No active order alerts.</p>}<button onClick={() => setShowNotifications(false)}>Close notifications</button></div>}</div>
        <button className="top-avatar" aria-label="Open profile details" title="Profile details" onClick={() => setProfileOpen(true)}>{(currentUser.name || 'User').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</button>
      </div></header>

      <div className="page-content">
        <section className="welcome-row"><div><div className="eyebrow"><span /> {todayLabel}</div><h1>{activeNav === 'Overview' ? `Good morning, ${currentUser.name?.split(' ')[0] || 'there'}` : activeNav}</h1><p>{description}</p></div><button className="primary-button" onClick={() => setShowCreateGroup(true)}><Plus size={17} /> Start a group order</button></section>
        <section className="metrics-grid" aria-label="Procurement summary" hidden={activeNav !== 'Overview'}>
          <MetricCard icon={Coins} label="Lifetime savings" value={`₹${Number(currentUser.totalSavings || 0).toLocaleString('en-IN')}`} note="From completed orders" accent="mint" />
          <MetricCard icon={Users} label="Active group orders" value={String(groups.filter((group) => ['open', 'threshold_reached', 'bidding'].includes(group.status)).length).padStart(2, '0')} note="From your neighbourhood" accent="blue" />
          <MetricCard icon={Truck} label="Orders in transit" value={String(serverOrders.filter((order) => ['at_distribution_hub', 'out_for_delivery', 'processing'].includes(order.status)).length).padStart(2, '0')} note="Live order tracking" accent="orange" />
          <MetricCard icon={Activity} label="Retailer power index" value={currentUser.powerIndex || 50} suffix=" / 100" note="Your account score" accent="pink" />
        </section>

        {activeNav === 'Browse products' && <section className="panel retailer-page-panel"><div className="panel-heading"><div><div className="section-kicker">WHOLESALE CATALOGUE</div><h2>Browse products</h2><p>Current product listings and wholesale pricing from verified suppliers.</p></div></div><div className="retailer-product-grid">{filteredProducts.map((product) => <article className="retailer-product-card" key={product._id}><div className="retailer-product-image">{product.image ? <img src={product.image} alt="" /> : <PackageCheck size={24} />}</div><div className="section-kicker">{product.category}</div><h3>{product.name}</h3><p>{product.description || `MOQ ${product.moq} ${product.unit}`}</p><div className="retailer-product-meta"><span>Wholesale price</span><strong>₹{product.wholesalePrice} / {product.unit}</strong></div><div className="retailer-product-meta"><span>Supplier</span><strong>{product.wholesaler?.businessName || product.wholesaler?.name}</strong></div><button className="join-button" onClick={() => { setNewProduct(product.name); setNewQuantity(''); setShowCreateGroup(true) }}>Start a group order <ArrowRight size={14} /></button></article>)}{!filteredProducts.length && <div className="empty-state"><PackageCheck size={23} /><strong>{query ? 'No matching products' : 'No products listed yet'}</strong><span>{query ? 'Try another product, category, or supplier.' : 'Products published by wholesalers will appear here.'}</span></div>}</div></section>}

        {activeNav === 'Orders & tracking' && <section className="panel retailer-page-panel"><div className="panel-heading"><div><div className="section-kicker">ORDER HISTORY</div><h2>Orders & tracking</h2><p>Payment, invoice, and delivery status for your purchases.</p></div></div><div className="retailer-orders-list">{filteredOrders.map((order) => <article className="retailer-order-card" key={order._id}><div className="retailer-order-main"><div className="order-id-label">{order.orderNumber}</div><h3>{order.items?.map((item) => item.product?.name).filter(Boolean).join(', ') || 'Procurement order'}</h3><p>{order.wholesaler?.businessName || order.wholesaler?.name} · {new Date(order.createdAt).toLocaleDateString('en-IN')}</p></div><span className={`status-pill ${order.status === 'delivered' ? 'green' : 'blue'}`}>{order.status.replaceAll('_', ' ')}</span><div className="retailer-order-total"><small>{order.paymentStatus}</small><strong>₹{Number(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>{order.paymentStatus === 'failed' ? <button className="join-button" disabled={paymentLoading} onClick={() => retryPayment(order)}><Wallet size={14} /> Retry payment</button> : <button className="join-button" disabled={order.paymentStatus !== 'completed'} onClick={() => setInvoice({ order, payment: null })}><FileText size={14} /> Bill</button>}</article>)}{!filteredOrders.length && <div className="empty-state"><Truck size={23} /><strong>{query ? 'No matching orders' : 'No orders yet'}</strong><span>{query ? 'Try an order number, product, or supplier.' : 'Orders appear here after checkout.'}</span></div>}</div></section>}

        {activeNav === 'Billing & records' && <section className="panel retailer-page-panel billing-page"><div className="panel-heading"><div><div className="section-kicker">PAYMENT HISTORY</div><h2>Billing & past records</h2><p>Every payment attempt, completed bill, and refund for this account.</p></div><div className="billing-total"><small>COMPLETED PAYMENTS</small><strong>{payments.filter((payment) => payment.status === 'completed').length}</strong></div></div><div className="billing-table-wrap"><table className="billing-table"><thead><tr><th>RECORD</th><th>DATE</th><th>METHOD</th><th>AMOUNT</th><th>STATUS</th><th>BILL</th></tr></thead><tbody>{filteredPayments.map((payment) => { const order = payment.order || serverOrders.find((entry) => String(entry._id) === String(payment.order?._id || payment.order)); return <tr key={payment._id}><td><strong>{order?.orderNumber || 'Payment record'}</strong><span>{order?.items?.map((item) => item.product?.name).filter(Boolean).join(', ') || payment.transactionId || 'No transaction reference'}</span></td><td>{String(payment.paidAt || payment.createdAt || '').slice(0, 10)}</td><td>{payment.method}</td><td>₹{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td><td><span className={`status-pill ${payment.status === 'completed' ? 'green' : payment.status === 'failed' ? 'gray' : 'blue'}`}>{payment.status}</span></td><td><button className="row-action" aria-label={`Open bill for ${order?.orderNumber || 'payment'}`} disabled={payment.status !== 'completed' || !order} onClick={() => setInvoice({ order, payment })}><FileText size={15} /></button></td></tr> })}</tbody></table>{!filteredPayments.length && <div className="empty-state compact-empty"><FileText size={21} /><strong>{query ? 'No matching billing records' : 'No payment history yet'}</strong><span>{query ? 'Search an invoice number or payment method.' : 'Completed demo and real checkout receipts will appear here.'}</span></div>}</div></section>}

        {activeNav === 'Savings & insights' && <section className="panel retailer-page-panel"><div className="section-kicker">PURCHASE PERFORMANCE</div><h2>Savings & insights</h2><p className="panel-subtitle">Calculated from completed payments and listed product retail prices.</p><div className="savings-report-total"><span>Recorded savings</span><strong>₹{savedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div><div className="savings-month-list">{savingsData.map((item) => <div key={item.month}><span>{item.month}</span><div className="report-bar"><i style={{ width: `${savedAmount ? Math.max(4, item.amount / Math.max(...savingsData.map((point) => point.amount), 1) * 100) : 0}%` }} /></div><strong>₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></div>)}</div></section>}

        {activeNav === 'Suppliers' && <section className="panel retailer-page-panel"><div className="section-kicker">YOUR PROCUREMENT NETWORK</div><h2>My suppliers</h2><p className="panel-subtitle">Suppliers from your catalogue listings and order history.</p><div className="supplier-directory">{filteredSuppliers.map((supplier) => <article className="supplier-directory-card" key={supplier._id}><span className="store-avatar"><Store size={17} /></span><div><strong>{supplier.businessName || supplier.name}</strong><span>{supplier.name} · Reliability {supplier.reliabilityScore || 50}/100</span></div><span className={`status-pill ${supplier.isVerified ? 'green' : 'gray'}`}>{supplier.isVerified ? 'Verified' : 'Unverified'}</span></article>)}{!filteredSuppliers.length && <div className="empty-state"><Store size={23} /><strong>{query ? 'No matching suppliers' : 'No suppliers yet'}</strong><span>{query ? 'Try another supplier or business name.' : 'Suppliers appear when you browse products or place orders.'}</span></div>}</div></section>}

        {(activeNav === 'Overview' || activeNav === 'Group orders') && <section className="dashboard-grid">
          <article className="panel group-panel"><div className="panel-heading"><div><div className="section-kicker">BUY TOGETHER</div><h2>Collective buying</h2><p>Join other stores to unlock wholesale pricing.</p></div><button className="text-button" onClick={() => setActiveNav('Group orders')}>View all <ArrowRight size={15} /></button></div>
            <div className="group-toolbar"><span className="live-indicator"><i /> LIVE GROUPS <b>{groups.filter((group) => ['open', 'threshold_reached', 'bidding', 'supplier_selected'].includes(group.status)).length.toString().padStart(2, '0')}</b></span><button className={`filter-button ${filter === 'Ending soon' ? 'selected' : ''}`} onClick={() => setFilter(filter === 'All groups' ? 'Ending soon' : 'All groups')}><Clock3 size={13} /> {filter} <ChevronDown size={13} /></button></div>
            <div className="group-list">{filteredGroups.length ? filteredGroups.map((group) => <GroupCard key={group.id} group={group} joined={joinedGroups.includes(group.id)} ordered={serverOrders.some((order) => String(order.groupOrder?._id || order.groupOrder) === String(group.id))} onJoin={() => joinGroup(group.id)} onCheckout={checkout} />) : <div className="empty-state"><Search size={20} /><strong>No matching group orders</strong><span>{query ? 'Try another product or supplier.' : 'Create the first group in your area.'}</span></div>}</div>
            <button className="browse-link" onClick={() => setActiveNav('Browse products')}>Explore all wholesale deals <ArrowRight size={15} /></button>
          </article>

          <article className="panel savings-panel"><div className="panel-heading compact-heading"><div><div className="section-kicker">YOUR BUYING POWER</div><h2>Savings over time</h2></div><button className="period-button">6 months <ChevronDown size={13} /></button></div>
            <div className="savings-total"><strong>₹{savedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong><span><ArrowUpRight size={13} /> actual</span></div><p className="chart-caption">Price difference on paid orders</p>
            <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={savingsData} margin={{ top: 12, right: 2, left: -24, bottom: 0 }}><defs><linearGradient id="savingsFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#55b989" stopOpacity={0.24} /><stop offset="100%" stopColor="#55b989" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#e9eeeb" strokeDasharray="3 4" /><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#8a9690', fontSize: 11 }} dy={8} /><Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Saved']} contentStyle={{ border: '1px solid #e6ece8', borderRadius: 7, fontSize: 12 }} /><Area type="monotone" dataKey="amount" stroke="#349c6b" strokeWidth={2.5} fill="url(#savingsFill)" activeDot={{ r: 4 }} /></AreaChart></ResponsiveContainer></div>
            <div className="chart-footnote"><span><i /> Recorded order savings</span><button onClick={() => setActiveNav('Savings & insights')}>Full report <ArrowRight size={13} /></button></div><div className="insight-note"><span><Sparkles size={15} /></span><p><strong>Tracked from your orders.</strong> Savings compare catalogue retail prices with paid group prices.</p></div>
          </article>
        </section>}

        <section className="lower-grid" hidden={activeNav !== 'Overview'}><article className="panel orders-panel"><div className="panel-heading orders-heading"><div><div className="section-kicker">KEEP AN EYE ON IT</div><h2>Recent orders</h2></div><button className="text-button" onClick={() => setActiveNav('Orders & tracking')}>All orders <ArrowRight size={15} /></button></div><div className="order-table-wrap"><table className="order-table"><thead><tr><th>ORDER</th><th>SUPPLIER</th><th>LAST UPDATE</th><th>STATUS</th><th>BILL</th></tr></thead><tbody>{filteredOrders.slice(0, 5).map((order) => <tr key={order._id}><td><strong>{order.items?.map((item) => item.product?.name).filter(Boolean).join(', ') || 'Procurement order'}</strong><span>{order.orderNumber}</span></td><td>{order.wholesaler?.businessName || order.wholesaler?.name}</td><td>{new Date(order.updatedAt).toLocaleDateString('en-IN')}</td><td><span className={`status-pill ${order.status === 'delivered' ? 'green' : 'blue'}`}>{order.status.replaceAll('_', ' ')}</span></td><td><button className="row-action" aria-label={`Open bill for ${order.orderNumber}`} disabled={order.paymentStatus !== 'completed'} onClick={() => setInvoice({ order, payment: null })}><FileText size={15} /></button></td></tr>)}</tbody></table>{!filteredOrders.length && <div className="empty-state compact-empty"><strong>{query ? 'No matching orders' : 'No orders placed'}</strong><span>{query ? 'Try another order, product, or supplier.' : 'Finish a group checkout to see order updates.'}</span></div>}</div></article>
          <article className="panel recommendation-panel"><div className="panel-heading compact-heading"><div><div className="section-kicker">CATALOGUE PICK</div><h2>{apiProducts[0]?.name || 'Discover products'}</h2></div><span className="sparkle-mark"><Sparkles size={15} /></span></div>{apiProducts[0] ? <><div className="recommendation-item"><div className="recommendation-photo">{apiProducts[0].image ? <img src={apiProducts[0].image} alt="" loading="lazy" /> : <PackageCheck size={20} />}</div><div className="recommendation-copy"><span className="recommendation-label">{apiProducts[0].category}</span><strong>{apiProducts[0].wholesaler?.businessName || apiProducts[0].wholesaler?.name}</strong><span>Wholesale <b>₹{apiProducts[0].wholesalePrice}/{apiProducts[0].unit}</b></span></div></div><div className="recommendation-footer"><span><PackageCheck size={14} /> MOQ {apiProducts[0].moq} {apiProducts[0].unit}</span><button aria-label="Create group for product" onClick={() => { setNewProduct(apiProducts[0].name); setShowCreateGroup(true) }}><ArrowRight size={15} /></button></div></> : <div className="empty-state compact-empty"><span>Available catalogue items will appear here.</span><button className="text-button" onClick={() => setActiveNav('Browse products')}>Browse products <ArrowRight size={14} /></button></div>}</article>
        </section>
        <footer className="page-footer"><span>© 2026 BizzConnect</span><span>Better prices, built together <span className="footer-heart">♥</span></span></footer>
      </div>
    </main>

    {showCreateGroup && <div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setShowCreateGroup(false) }}><form className="create-modal" onSubmit={createGroup}><div className="modal-heading"><span className="modal-icon"><Users size={18} /></span><button type="button" className="icon-button" aria-label="Close dialog" onClick={() => setShowCreateGroup(false)}><X size={18} /></button></div><div className="section-kicker">COLLECTIVE BUYING</div><h2>Start a group order</h2><p>Your quantity will be pledged immediately. Other retailers can join to meet the target.</p><label>Product name<input autoFocus list="available-products" value={newProduct} onChange={(event) => setNewProduct(event.target.value)} placeholder="Choose a catalogue product" required /></label><datalist id="available-products">{apiProducts.map((product) => <option key={product._id} value={product.name} />)}</datalist><label>Your initial pledge<input type="number" min="1" value={newQuantity} onChange={(event) => setNewQuantity(event.target.value)} placeholder="e.g. 50" required /><small>We’ll set a starter target at twice your pledge.</small></label><div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setShowCreateGroup(false)}>Cancel</button><button type="submit" className="primary-button"><Plus size={16} /> Create group</button></div></form></div>}
    {joinTarget && <div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setJoinTarget(null) }}><form className="create-modal" onSubmit={submitJoinGroup}><div className="modal-heading"><span className="modal-icon"><Users size={18} /></span><button type="button" className="icon-button" aria-label="Close join form" onClick={() => setJoinTarget(null)}><X size={18} /></button></div><div className="section-kicker">JOIN COLLECTIVE ORDER</div><h2>{joinTarget.name}</h2><p>{joinTarget.current} of {joinTarget.target} {joinTarget.unit} pooled so far.</p><label>Your quantity ({joinTarget.unit})<input type="number" min="1" value={joinQuantity} onChange={(event) => setJoinQuantity(event.target.value)} required /></label><div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setJoinTarget(null)}>Cancel</button><button className="primary-button"><Users size={15} /> Join with {joinQuantity}</button></div></form></div>}
    {checkoutGroup && <div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget && !paymentLoading) setCheckoutGroup(null) }}>
      <form className="create-modal checkout-modal" onSubmit={payForGroup}>
        <div className="modal-heading"><span className="modal-icon"><Wallet size={18} /></span><button type="button" className="icon-button" aria-label="Close checkout" onClick={() => setCheckoutGroup(null)}><X size={18} /></button></div>
        <div className="section-kicker">SECURE CHECKOUT · SIMULATED PAYMENT</div><h2>Confirm your order</h2>
        <p>{checkoutGroup.name} · {checkoutGroup.raw.selectedSupplier?.businessName || checkoutGroup.supplier}</p>
        <div className="checkout-summary">
          <span>Quantity pledged</span><strong>{getGroupPledge(checkoutGroup, currentUser._id)} {checkoutGroup.unit}</strong>
          <span>Price per {checkoutGroup.unit}</span><strong>₹{checkoutGroup.raw.finalPricePerUnit || checkoutGroup.price}</strong>
          <span>Delivery charge</span><strong>₹{getDeliveryFee(checkoutGroup, currentUser._id).toFixed(2)}</strong>
          <span className="checkout-total-label">Amount due</span><strong className="checkout-total">₹{getCheckoutTotal(checkoutGroup, currentUser._id).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
        </div>
        <label>Payment method<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}><option value="upi">UPI</option><option value="card">Card</option><option value="netbanking">Net banking</option><option value="wallet">Wallet</option></select></label>
        <label className="simulation-toggle"><input type="checkbox" checked={simulateFailure} onChange={(event) => setSimulateFailure(event.target.checked)} /> Simulate a payment failure (test mode)</label>
        <p className="simulation-note">Demo payment only. No real money is charged.</p>
        <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setCheckoutGroup(null)}>Cancel</button><button className="primary-button" disabled={paymentLoading}>{paymentLoading ? 'Processing...' : <>Pay & place order <ArrowRight size={15} /></>}</button></div>
      </form>
    </div>}
    {profileOpen && <ProfileDialog user={currentUser} apiRequest={apiRequest} onClose={() => setProfileOpen(false)} onUpdated={(user) => { setCurrentUser(user); localStorage.setItem('bizzconnect_user', JSON.stringify(user)) }} onLogout={logout} notify={notify} />}
    {invoice && <InvoiceDialog order={invoice.order} payment={invoice.payment} onClose={() => setInvoice(null)} />}
    {toast && <div className="toast-message"><span><Check size={15} /></span>{toast}</div>}
  </div>
}

export default App
