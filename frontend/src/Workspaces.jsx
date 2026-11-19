import { useCallback, useEffect, useEffectEvent, useState } from 'react'
import {
  ArrowRight, BadgeCheck, Boxes, BriefcaseBusiness, Check, ChevronRight, CircleDollarSign,
  FileText, LogOut, Package, Plus, RefreshCw, Search, Store, Truck, UserRound, Users, X,
} from 'lucide-react'

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function ProfileDialog({ user, apiRequest, onClose, onUpdated, onLogout, notify }) {
  const [form, setForm] = useState({
    name: user.name || '', phone: user.phone || '', storeName: user.storeName || '',
    storeAddress: user.storeAddress || '', neighbourhood: user.neighbourhood || '', city: user.city || '',
    businessName: user.businessName || '', businessAddress: user.businessAddress || '', gstin: user.gstin || '',
  })
  const [saving, setSaving] = useState(false)
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }))

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = await apiRequest('/users/profile', { method: 'PATCH', body: JSON.stringify(form) })
      onUpdated(payload.data)
      notify('Profile saved')
      onClose()
    } catch (error) {
      notify(error.message)
    } finally {
      setSaving(false)
    }
  }

  return <div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <form className="profile-modal" onSubmit={saveProfile}>
      <div className="modal-heading"><span className="modal-icon"><UserRound size={18} /></span><button type="button" className="icon-button" aria-label="Close profile" onClick={onClose}><X size={18} /></button></div>
      <div className="section-kicker">ACCOUNT SETTINGS</div><h2>Your profile</h2><p className="profile-email">{user.email} · {user.role}</p>
      <div className="profile-form-grid">
        <label>Full name<input value={form.name} onChange={(event) => update('name', event.target.value)} required /></label>
        <label>Phone<input value={form.phone} onChange={(event) => update('phone', event.target.value)} /></label>
        {user.role === 'retailer' ? <>
          <label>Store name<input value={form.storeName} onChange={(event) => update('storeName', event.target.value)} /></label>
          <label>Neighbourhood<input value={form.neighbourhood} onChange={(event) => update('neighbourhood', event.target.value)} /></label>
          <label className="wide-field">Store address<input value={form.storeAddress} onChange={(event) => update('storeAddress', event.target.value)} /></label>
          <label>City<input value={form.city} onChange={(event) => update('city', event.target.value)} /></label>
        </> : <>
          <label>Business name<input value={form.businessName} onChange={(event) => update('businessName', event.target.value)} /></label>
          <label>GSTIN<input value={form.gstin} onChange={(event) => update('gstin', event.target.value)} /></label>
          <label className="wide-field">Business address<input value={form.businessAddress} onChange={(event) => update('businessAddress', event.target.value)} /></label>
        </>}
      </div>
      <div className="modal-actions profile-actions"><button type="button" className="logout-button" onClick={onLogout}><LogOut size={15} /> Sign out</button><button type="button" className="cancel-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button></div>
    </form>
  </div>
}

export function InvoiceDialog({ order, payment, onClose }) {
  const item = order.items?.[0] || {}
  const product = item.product || {}
  return <div className="modal-backdrop invoice-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="invoice-modal" aria-label="Invoice">
      <header className="invoice-top"><div><div className="invoice-brand"><span className="brand-mark"><Boxes size={18} /></span><strong>BizzConnect</strong></div><span className="invoice-caption">TAX INVOICE / PAYMENT RECEIPT</span></div><span className="invoice-paid"><Check size={14} /> PAID</span></header>
      <div className="invoice-number-row"><div><small>INVOICE NUMBER</small><strong>{order.orderNumber}</strong></div><div><small>ISSUED ON</small><strong>{String(order.updatedAt || order.createdAt || '').slice(0, 10)}</strong></div></div>
      <div className="invoice-parties"><div><small>BILLED TO</small><strong>{order.retailer?.name || 'Retailer'}</strong><span>{order.deliveryAddress || order.retailer?.storeAddress || 'Store address not provided'}</span><span>{order.retailer?.email || ''}</span></div><div><small>SUPPLIED BY</small><strong>{order.wholesaler?.businessName || order.wholesaler?.name || 'BizzConnect supplier'}</strong><span>{order.wholesaler?.businessAddress || ''}</span></div></div>
      <table className="invoice-table"><thead><tr><th>ITEM</th><th>QTY</th><th>UNIT PRICE</th><th>AMOUNT</th></tr></thead><tbody><tr><td>{product.name || 'Collective order item'}</td><td>{item.quantity} {product.unit || ''}</td><td>{money(item.pricePerUnit)}</td><td>{money(item.totalPrice)}</td></tr></tbody></table>
      <div className="invoice-totals"><div><span>Subtotal</span><strong>{money(order.subtotal)}</strong></div><div><span>Delivery</span><strong>{money(order.deliveryCharge)}</strong></div><div className="invoice-grand-total"><span>Total paid</span><strong>{money(order.totalAmount)}</strong></div></div>
      <footer className="invoice-payment"><span>Payment method</span><strong>{payment?.method || 'Simulated payment'} · {payment?.transactionId || 'Transaction recorded'}</strong><span>Payment status: {payment?.status || order.paymentStatus || 'completed'}</span></footer>
      <div className="modal-actions invoice-actions"><button className="cancel-button" onClick={onClose}>Close</button><button className="primary-button" onClick={() => window.print()}><FileText size={15} /> Print / Save PDF</button></div>
    </section>
  </div>
}

export function AdminWorkspace({ user, apiRequest, searchValue, onSearch, searchOpen, onToggleSearch, onProfile, onLogout, onSwitchRole, notify }) {
  const [view, setView] = useState('Operations overview')
  const [overview, setOverview] = useState({})
  const [suppliers, setSuppliers] = useState([])
  const [groups, setGroups] = useState([])
  const [bids, setBids] = useState([])
  const [busyId, setBusyId] = useState('')

  const loadOperations = useCallback(async (quiet = false) => {
    try {
      const [overviewPayload, userPayload, groupPayload] = await Promise.all([
        apiRequest('/admin/overview'), apiRequest('/users'), apiRequest('/group-orders'),
      ])
      setOverview(overviewPayload.data || {})
      setSuppliers((userPayload.data || []).filter((entry) => entry.role === 'wholesaler'))
      const allGroups = groupPayload.data || []
      const bidGroups = allGroups.filter((group) => ['bidding', 'threshold_reached', 'supplier_selected'].includes(group.status))
      setGroups(bidGroups)
      const bidPayloads = await Promise.all(bidGroups.map((group) => apiRequest(`/bids/group/${group._id}`)))
      setBids(bidPayloads.flatMap((payload) => payload.data || []))
    } catch (error) {
      if (!quiet) notify(error.message)
    }
  }, [apiRequest, notify])

  const loadOperationsOnMount = useEffectEvent(loadOperations)
  useEffect(() => {
    loadOperationsOnMount(true)
    const interval = setInterval(() => { loadOperations(true) }, 3500)
    const onFocus = () => loadOperations(true)
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [loadOperations])

  async function verifySupplier(supplier, verified) {
    setBusyId(supplier._id)
    try {
      await apiRequest(`/admin/suppliers/${supplier._id}/verify`, { method: 'PATCH', body: JSON.stringify({ verified }) })
      notify(verified ? 'Wholesaler verified' : 'Wholesaler verification removed')
      await loadOperations()
    } catch (error) {
      notify(error.message)
    } finally {
      setBusyId('')
    }
  }

  async function acceptBid(bid) {
    setBusyId(bid._id)
    try {
      await apiRequest(`/bids/${bid._id}/accept`, { method: 'POST' })
      notify('Supplier selected. Retailers can now check out.')
      await loadOperations()
    } catch (error) {
      notify(error.message)
    } finally {
      setBusyId('')
    }
  }

  const navigation = [
    { label: 'Operations overview', icon: BriefcaseBusiness },
    { label: 'Supplier verification', icon: BadgeCheck, count: suppliers.filter((supplier) => !supplier.isVerified).length },
    { label: 'Compare supplier bids', icon: CircleDollarSign, count: bids.length },
  ]
  const searchTerm = searchValue.trim().toLowerCase()
  const visibleSuppliers = suppliers.filter((supplier) => `${supplier.name} ${supplier.email} ${supplier.businessName || ''} ${supplier.gstin || ''}`.toLowerCase().includes(searchTerm))
  const visibleGroups = groups.filter((group) => `${group.title} ${group.product?.name || ''}`.toLowerCase().includes(searchTerm))
  const visibleBids = bids.filter((bid) => !searchTerm || `${bid.wholesaler?.businessName || ''} ${bid.wholesaler?.name || ''} ${bid.status}`.toLowerCase().includes(searchTerm) || visibleGroups.some((group) => group._id === String(bid.groupOrder?._id || bid.groupOrder)))

  return <div className="app-shell supplier-shell">
    <aside className="sidebar"><a className="brand" href="#admin" onClick={() => setView('Operations overview')}><span className="brand-mark"><Boxes size={21} /></span><span className="brand-name">bizz<span>connect</span><small>ADMIN OPERATIONS</small></span></a><div className="nav-caption">PLATFORM</div><nav className="main-nav" aria-label="Admin navigation">{navigation.map(({ label, icon: Icon, count }) => <button key={label} className={`nav-link ${view === label ? 'active' : ''}`} onClick={() => setView(label)}><Icon size={17} /><span>{label}</span>{count > 0 && <span className="nav-count">{count}</span>}</button>)}</nav><div className="sidebar-spacer" /><button className="supplier-profile-button" onClick={onProfile}><UserRound size={16} /> Account profile</button><button className="supplier-profile-button" onClick={onLogout}><LogOut size={16} /> Sign out</button></aside>
    <main className="main-area"><header className="topbar"><div className="breadcrumb"><span>Admin</span><ChevronRight size={14} /><strong>{view}</strong></div><div className="topbar-actions"><span className="sync-live-badge"><span className="sync-live-dot" /> LIVE</span>{onSwitchRole && <div className="demo-switch-bar"><span className="demo-switch-tag">ROLE:</span><button type="button" onClick={() => onSwitchRole('retailer')}>Retailer</button><button type="button" onClick={() => onSwitchRole('wholesaler')}>Wholesaler</button><button type="button" className="active">Admin</button></div>}<button type="button" className="icon-button" title="Refresh live data" onClick={() => loadOperations(false)}><RefreshCw size={15} /></button><div className={`search-box ${searchOpen ? 'is-open' : ''}`}><button type="button" className="search-toggle" aria-label={searchOpen ? 'Close search' : 'Open search'} onClick={onToggleSearch}><Search size={16} /></button><input value={searchValue} onChange={(event) => onSearch(event.target.value)} placeholder="Search suppliers, groups, bids..." /></div><button className="top-avatar" onClick={onProfile} aria-label="Open profile">{user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</button></div></header><div className="page-content"><section className="welcome-row"><div><div className="eyebrow"><span /> PLATFORM OPERATIONS</div><h1>{view}</h1><p>Verify suppliers, compare bids, and monitor procurement activity.</p></div><button className="text-button" onClick={loadOperations}>Refresh data <ArrowRight size={14} /></button></section>
      <section className="metrics-grid supplier-metrics"><article className="metric-card"><div className="metric-icon mint"><Users size={18} /></div><div className="metric-copy"><span className="metric-label">Platform users</span><strong>{overview.users || 0}</strong></div></article><article className="metric-card"><div className="metric-icon blue"><Boxes size={18} /></div><div className="metric-copy"><span className="metric-label">Group orders</span><strong>{overview.groupOrders || 0}</strong></div></article><article className="metric-card"><div className="metric-icon orange"><Truck size={18} /></div><div className="metric-copy"><span className="metric-label">Orders</span><strong>{overview.orders || 0}</strong></div></article><article className="metric-card"><div className="metric-icon pink"><CircleDollarSign size={18} /></div><div className="metric-copy"><span className="metric-label">Payments</span><strong>{overview.payments || 0}</strong></div></article></section>
      {view === 'Operations overview' && <section className="supplier-home-grid"><article className="panel supplier-feature"><div className="section-kicker">PENDING REVIEWS</div><h2>{suppliers.filter((supplier) => !supplier.isVerified).length} wholesalers need verification</h2><p>Verified suppliers can compete in reverse auctions for retailer group orders.</p><button className="primary-button" onClick={() => setView('Supplier verification')}>Review suppliers <ArrowRight size={15} /></button></article><article className="panel supplier-activity"><div className="section-kicker">ACTIVE AUCTIONS</div><h2>{groups.length} groups awaiting supplier selection</h2><p className="muted-copy">Compare submitted offers and select the best fit for pooled retailer demand.</p><button className="text-button" onClick={() => setView('Compare supplier bids')}>Compare bids <ArrowRight size={14} /></button></article></section>}
      {view === 'Supplier verification' && <section className="panel supplier-table-panel"><div className="section-kicker">WHOLESALER ONBOARDING</div><h2>Supplier verification</h2><div className="supplier-order-list">{visibleSuppliers.map((supplier) => <article className="supplier-order-row" key={supplier._id}><div><strong>{supplier.businessName || supplier.name}</strong><span>{supplier.name} · {supplier.email}</span><small>{supplier.businessAddress || 'Business address not provided'} {supplier.gstin ? `· GSTIN ${supplier.gstin}` : ''}</small></div><span className={`status-pill ${supplier.isVerified ? 'green' : 'gray'}`}>{supplier.isVerified ? 'Verified' : 'Pending'}</span><button className="join-button" disabled={busyId === supplier._id} onClick={() => verifySupplier(supplier, !supplier.isVerified)}>{supplier.isVerified ? 'Revoke' : 'Verify'}</button></article>)}{!visibleSuppliers.length && <div className="empty-state"><BriefcaseBusiness size={22} /><strong>{searchTerm ? 'No matching wholesalers' : 'No wholesalers registered'}</strong></div>}</div></section>}
      {view === 'Compare supplier bids' && <section className="panel supplier-table-panel"><div className="section-kicker">SUPPLIER SELECTION</div><h2>Compare supplier bids</h2>{visibleGroups.map((group) => <div className="admin-bid-group" key={group._id}><h3>{group.title} <small>{group.currentQuantity}/{group.targetQuantity} {group.unit} pooled</small></h3>{visibleBids.filter((bid) => String(bid.groupOrder?._id || bid.groupOrder) === String(group._id)).map((bid) => <article className="admin-bid-row" key={bid._id}><div><strong>{bid.wholesaler?.businessName || bid.wholesaler?.name}</strong><span>MOQ {bid.moq} · {bid.deliveryDays} day delivery · {bid.deliveryTerms || 'Terms not specified'}</span><small>Reliability {bid.wholesaler?.reliabilityScore || 50}/100</small></div><b>{money(bid.pricePerUnit)} / {group.unit}</b><button className="join-button" disabled={busyId === bid._id || !bid.wholesaler?.isVerified} onClick={() => acceptBid(bid)}>{busyId === bid._id ? 'Selecting...' : 'Select supplier'}</button></article>)}</div>)}{!visibleGroups.length && <div className="empty-state"><CircleDollarSign size={22} /><strong>{searchTerm ? 'No matching bids or groups' : 'No bids awaiting selection'}</strong><span>Retailer groups appear here once they reach their target.</span></div>}</section>}
    </div></main>
  </div>
}

export function WholesalerWorkspace({ user, apiRequest, searchValue, onSearch, searchOpen, onToggleSearch, onProfile, onLogout, onSwitchRole, notify }) {
  const [view, setView] = useState('Overview')
  const [products, setProducts] = useState([])
  const [groups, setGroups] = useState([])
  const [bids, setBids] = useState([])
  const [orders, setOrders] = useState([])
  const [showProductForm, setShowProductForm] = useState(false)
  const [bidGroup, setBidGroup] = useState(null)
  const [productForm, setProductForm] = useState({ name: '', category: '', unit: 'kg', retailPrice: '', wholesalePrice: '', moq: '', stockQuantity: '', description: '' })
  const [bidForm, setBidForm] = useState({ pricePerUnit: '', moq: '', deliveryDays: '3', deliveryTerms: 'Delivery to BizzConnect distribution hub' })
  const [saving, setSaving] = useState(false)

  const loadWorkspace = useCallback(async (quiet = false) => {
    try {
      const [productData, groupData, orderData, bidData] = await Promise.all([
        apiRequest('/products/mine'),
        apiRequest('/group-orders'),
        apiRequest('/orders'),
        apiRequest('/bids/mine'),
      ])
      setProducts(productData.data || [])
      const activeGroups = (groupData.data || []).filter((g) => ['open', 'threshold_reached', 'bidding', 'supplier_selected'].includes(g.status))
      setGroups(activeGroups)
      setOrders(orderData.data || [])
      setBids(bidData.data || [])
    } catch (error) {
      if (!quiet) notify(error.message)
    }
  }, [apiRequest, notify])

  const loadWorkspaceOnMount = useEffectEvent(loadWorkspace)
  useEffect(() => {
    loadWorkspaceOnMount(true)
    const interval = setInterval(() => { loadWorkspace(true) }, 3500)
    const onFocus = () => loadWorkspace(true)
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [loadWorkspace])

  async function createProduct(event) {
    event.preventDefault()
    setSaving(true)
    try {
      await apiRequest('/products', { method: 'POST', body: JSON.stringify({ ...productForm, retailPrice: Number(productForm.retailPrice), wholesalePrice: Number(productForm.wholesalePrice), moq: Number(productForm.moq), stockQuantity: Number(productForm.stockQuantity || 0) }) })
      setProductForm({ name: '', category: '', unit: 'kg', retailPrice: '', wholesalePrice: '', moq: '', stockQuantity: '', description: '' })
      setShowProductForm(false)
      notify('Product added to your catalogue')
      await loadWorkspace()
    } catch (error) {
      notify(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleProductAvailability(product) {
    try {
      await apiRequest(`/products/${product._id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable: !product.isAvailable }),
      })
      notify(product.isAvailable ? 'Product listing paused' : 'Product listing activated')
      await loadWorkspace(true)
    } catch (error) {
      notify(error.message)
    }
  }

  async function submitBid(event) {
    event.preventDefault()
    setSaving(true)
    try {
      const price = Number(bidForm.pricePerUnit)
      await apiRequest('/bids', { method: 'POST', body: JSON.stringify({
        groupOrder: bidGroup._id, pricePerUnit: price, totalPrice: price * bidGroup.targetQuantity,
        moq: Number(bidForm.moq), deliveryDays: Number(bidForm.deliveryDays), deliveryTerms: bidForm.deliveryTerms,
      }) })
      setBidGroup(null)
      notify('Your supplier bid was submitted')
      await loadWorkspace()
    } catch (error) {
      notify(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function updateOrder(order, status) {
    try {
      await apiRequest(`/orders/${order._id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
      notify(`Order moved to ${status.replaceAll('_', ' ')}`)
      await loadWorkspace()
    } catch (error) {
      notify(error.message)
    }
  }

  const nav = [
    { label: 'Overview', icon: BriefcaseBusiness }, { label: 'Product catalogue', icon: Package, count: products.length },
    { label: 'Group opportunities', icon: Users, count: groups.length }, { label: 'Orders & fulfilment', icon: Truck, count: orders.length },
  ]
  const searchTerm = searchValue.trim().toLowerCase()
  const visibleProducts = products.filter((product) => `${product.name} ${product.category}`.toLowerCase().includes(searchTerm))
  const visibleGroups = groups.filter((group) => `${group.title} ${group.product?.name || ''} ${group.neighbourhood || ''}`.toLowerCase().includes(searchTerm))
  const visibleOrders = orders.filter((order) => `${order.orderNumber} ${order.status} ${order.retailer?.storeName || order.retailer?.name || ''} ${(order.items || []).map((item) => item.product?.name || '').join(' ')}`.toLowerCase().includes(searchTerm))
  const visibleBids = bids.filter((bid) => `${bid.groupOrder?.title || ''} ${bid.status}`.toLowerCase().includes(searchTerm))

  return <div className="app-shell supplier-shell">
    <aside className="sidebar">
      <a className="brand" href="#supplier" onClick={() => setView('Overview')}><span className="brand-mark"><Boxes size={21} /></span><span className="brand-name">bizz<span>connect</span><small>WHOLESALER PORTAL</small></span></a>
      <div className="supplier-account"><span className="store-avatar"><Store size={16} /></span><span><strong>{user.businessName || user.name}</strong><small>{user.isVerified ? 'Verified supplier' : 'Verification pending'}</small></span></div>
      <div className="nav-caption">SUPPLIER WORKSPACE</div>
      <nav className="main-nav" aria-label="Wholesaler navigation">{nav.map(({ label, icon: Icon, count }) => <button key={label} className={`nav-link ${view === label ? 'active' : ''}`} onClick={() => setView(label)}><Icon size={17} /><span>{label}</span>{count > 0 && <span className="nav-count">{count}</span>}</button>)}</nav>
      <div className="sidebar-spacer" />
      <div className="supplier-verify-card"><span className={user.isVerified ? 'verified-dot' : 'pending-dot'} />{user.isVerified ? 'Supplier account verified' : 'Verification required to bid'}</div>
      <button className="supplier-profile-button" onClick={onProfile}><UserRound size={16} /> Account profile <ChevronRight size={14} /></button>
      <button className="supplier-profile-button" onClick={onLogout}><LogOut size={16} /> Sign out</button>
    </aside>
    <main className="main-area">
      <header className="topbar"><div className="breadcrumb"><span>Supplier portal</span><ChevronRight size={14} /><strong>{view}</strong></div><div className="topbar-actions"><span className="sync-live-badge"><span className="sync-live-dot" /> LIVE</span>{onSwitchRole && <div className="demo-switch-bar"><span className="demo-switch-tag">ROLE:</span><button type="button" onClick={() => onSwitchRole('retailer')}>Retailer</button><button type="button" className="active">Wholesaler</button><button type="button" onClick={() => onSwitchRole('admin')}>Admin</button></div>}<button type="button" className="icon-button" title="Refresh live data" onClick={() => loadWorkspace(false)}><RefreshCw size={15} /></button><div className={`search-box ${searchOpen ? 'is-open' : ''}`}><button type="button" className="search-toggle" aria-label={searchOpen ? 'Close search' : 'Open search'} onClick={onToggleSearch}><Search size={16} /></button><input value={searchValue} onChange={(event) => onSearch(event.target.value)} placeholder={`Search ${view.toLowerCase()}...`} /></div><button className="top-avatar" onClick={onProfile} aria-label="Open profile">{user.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</button></div></header>
      <div className="page-content">
        <section className="welcome-row"><div><div className="eyebrow"><span /> WHOLESALER WORKSPACE</div><h1>{view === 'Overview' ? `Welcome, ${user.businessName || user.name}` : view}</h1><p>{view === 'Overview' ? 'Manage your catalogue, compete for pooled demand, and fulfil retailer orders.' : 'Your supplier activity, managed in one place.'}</p></div>{view === 'Product catalogue' && <button className="primary-button" onClick={() => setShowProductForm(true)}><Plus size={16} /> Add product</button>}</section>
        <section className="metrics-grid supplier-metrics"><article className="metric-card"><div className="metric-icon mint"><Package size={18} /></div><div className="metric-copy"><span className="metric-label">Listed products</span><strong>{products.length}</strong><span className="metric-note">In your catalogue</span></div></article><article className="metric-card"><div className="metric-icon blue"><Users size={18} /></div><div className="metric-copy"><span className="metric-label">Open opportunities</span><strong>{groups.length}</strong><span className="metric-note">Pooled demand ready for bids</span></div></article><article className="metric-card"><div className="metric-icon orange"><Truck size={18} /></div><div className="metric-copy"><span className="metric-label">Active orders</span><strong>{orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)).length}</strong><span className="metric-note">Awaiting fulfilment</span></div></article><article className="metric-card"><div className="metric-icon pink"><CircleDollarSign size={18} /></div><div className="metric-copy"><span className="metric-label">Reliability score</span><strong>{user.reliabilityScore || 50}<small> / 100</small></strong><span className="metric-note">Supplier performance</span></div></article></section>

        {view === 'Overview' && <section className="supplier-home-grid"><article className="panel supplier-feature"><div className="section-kicker">NEXT ACTION</div><h2>{groups.length ? 'Retailers are waiting on bids' : 'Build your wholesale catalogue'}</h2><p>{groups.length ? `${groups.length} pooled order${groups.length === 1 ? '' : 's'} active. Submit competitive offers to win supply.` : 'Add your products with MOQ, wholesale price, and delivery terms so retailers can discover your catalogue.'}</p><button className="primary-button" onClick={() => setView(groups.length ? 'Group opportunities' : 'Product catalogue')}>{groups.length ? 'Review opportunities' : 'Manage products'} <ArrowRight size={15} /></button></article><article className="panel supplier-activity"><div className="section-kicker">RECENT ACTIVITY</div><h2>Latest orders</h2>{visibleOrders.slice(0, 4).map((order) => <div className="supplier-activity-row" key={order._id}><span><strong>{order.orderNumber}</strong><small>{order.items?.[0]?.product?.name || 'Procurement order'}</small></span><b className={`status-pill ${order.status === 'delivered' ? 'green' : 'blue'}`}>{order.status.replaceAll('_', ' ')}</b></div>)}{!visibleOrders.length && <p className="muted-copy">{searchTerm ? 'No matching orders.' : 'No orders yet. Successful bids will appear here.'}</p>}</article></section>}

        {view === 'Product catalogue' && <section className="panel supplier-table-panel"><div className="panel-heading"><div><div className="section-kicker">YOUR LISTINGS</div><h2>Product catalogue</h2><p>Pricing and stock shown to retailer accounts.</p></div></div><div className="supplier-product-list">{visibleProducts.map((product) => <article className="supplier-product-row" key={product._id}><div className="supplier-product-icon"><Package size={19} /></div><div className="supplier-product-name"><strong>{product.name}</strong><span>{product.category} · MOQ {product.moq} {product.unit}</span></div><div className="supplier-price"><small>WHOLESALE / RETAIL</small><strong>{money(product.wholesalePrice)} / {money(product.retailPrice)}</strong></div><div className="supplier-stock"><small>STOCK</small><strong>{product.stockQuantity} {product.unit}</strong></div><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span className={`status-pill ${product.isAvailable ? 'green' : 'gray'}`}>{product.isAvailable ? 'Available' : 'Paused'}</span><button type="button" className="text-button" style={{ fontSize: 11, padding: '2px 4px' }} onClick={() => toggleProductAvailability(product)}>{product.isAvailable ? 'Pause' : 'Activate'}</button></div></article>)}{!visibleProducts.length && <div className="empty-state"><Package size={23} /><strong>{searchTerm ? 'No matching products' : 'Your catalogue is empty'}</strong><span>{searchTerm ? 'Search another product or category.' : 'Add a product to get retailer enquiries.'}</span>{!searchTerm && <button className="primary-button" onClick={() => setShowProductForm(true)}><Plus size={15} /> Add first product</button>}</div>}</div></section>}

        {view === 'Group opportunities' && <section className="panel supplier-table-panel"><div className="panel-heading"><div><div className="section-kicker">REVERSE AUCTION</div><h2>Group opportunities</h2><p>Submit your price, MOQ, and delivery commitment.</p></div></div><div className="opportunity-list">{visibleGroups.map((group) => { const existingBid = visibleBids.find((bid) => String(bid.groupOrder?._id || bid.groupOrder) === String(group._id)); const pct = Math.min(100, Math.round((group.currentQuantity / (group.targetQuantity || 1)) * 100)); return <article className="opportunity-card" key={group._id} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, alignItems: 'center' }}><div><div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}><span className={`status-pill ${group.status === 'bidding' || group.status === 'supplier_selected' ? 'green' : group.status === 'threshold_reached' ? 'orange' : 'blue'}`}>{group.status === 'open' ? `Forming (${pct}% pooled)` : group.status === 'threshold_reached' ? 'Target reached' : group.status.replaceAll('_', ' ')}</span><small style={{ color: '#7c8981' }}>{group.neighbourhood || 'Indiranagar'}</small></div><h3>{group.title}</h3><div className="progress-track" style={{ marginTop: 6, marginBottom: 6, height: 6, width: '100%', maxWidth: 280 }}><span style={{ width: `${pct}%`, height: '100%' }} /></div><p>{group.product?.name || 'Wholesale product'} · <strong>{group.currentQuantity}</strong> / {group.targetQuantity} {group.unit} pooled ({pct}%)</p><small>{group.participants?.length || 0} retailers joined · closes {new Date(group.deadline).toLocaleDateString()}</small></div><div className="opportunity-right" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>{existingBid ? <><b>{money(existingBid.pricePerUnit)} / unit</b><span className={`status-pill ${existingBid.status === 'accepted' ? 'green' : 'gray'}`}>Bid {existingBid.status}</span></> : <button className="join-button" disabled={!user.isVerified} onClick={() => setBidGroup(group)}>{user.isVerified ? 'Submit bid' : 'Verification required'}</button>}</div></article> })}{!visibleGroups.length && <div className="empty-state"><Users size={23} /><strong>{searchTerm ? 'No matching opportunities' : 'No open opportunities yet'}</strong><span>{searchTerm ? 'Try another group or product.' : 'New pooled retailer orders that meet their target will appear here.'}</span></div>}</div></section>}

        {view === 'Orders & fulfilment' && <section className="panel supplier-table-panel"><div className="panel-heading"><div><div className="section-kicker">FULFILMENT</div><h2>Orders & fulfilment</h2><p>Confirm, prepare, and dispatch your retailer orders.</p></div></div><div className="supplier-order-list">{visibleOrders.map((order) => <article className="supplier-order-row" key={order._id}><div><strong>{order.orderNumber}</strong><span>{order.items?.map((item) => `${item.product?.name || 'Product'} · ${item.quantity}`).join(', ')}</span><small>{order.retailer?.storeName || order.retailer?.name} · {money(order.totalAmount)}</small></div><span className={`status-pill ${order.status === 'delivered' ? 'green' : 'blue'}`}>{order.status.replaceAll('_', ' ')}</span><select aria-label={`Update ${order.orderNumber} status`} value={order.status} onChange={(event) => updateOrder(order, event.target.value)}><option value="pending">Pending</option><option value="confirmed">Confirmed</option><option value="processing">Processing</option><option value="at_distribution_hub">At hub</option><option value="out_for_delivery">Out for delivery</option><option value="delivered">Delivered</option></select></article>)}{!visibleOrders.length && <div className="empty-state"><Truck size={23} /><strong>{searchTerm ? 'No matching orders' : 'No orders to fulfil'}</strong><span>{searchTerm ? 'Try another order, retailer, or product.' : 'Orders appear after your bid is selected and payment is placed.'}</span></div>}</div></section>}
      </div>
    </main>

    {showProductForm && <div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setShowProductForm(false) }}><form className="create-modal supplier-form" onSubmit={createProduct}><div className="modal-heading"><span className="modal-icon"><Package size={18} /></span><button type="button" className="icon-button" aria-label="Close product form" onClick={() => setShowProductForm(false)}><X size={18} /></button></div><div className="section-kicker">WHOLESALE CATALOGUE</div><h2>Add a product</h2><label>Product name<input required value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} /></label><label>Category<input required value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} placeholder="Rice & Grains" /></label><div className="form-two-columns"><label>Unit<select value={productForm.unit} onChange={(event) => setProductForm({ ...productForm, unit: event.target.value })}>{['kg', 'g', 'litre', 'ml', 'piece', 'pack', 'box', 'dozen'].map((unit) => <option key={unit}>{unit}</option>)}</select></label><label>Minimum order<input type="number" min="1" required value={productForm.moq} onChange={(event) => setProductForm({ ...productForm, moq: event.target.value })} /></label><label>Wholesale price<input type="number" min="0" step="0.01" required value={productForm.wholesalePrice} onChange={(event) => setProductForm({ ...productForm, wholesalePrice: event.target.value })} /></label><label>Retail price<input type="number" min="0" step="0.01" required value={productForm.retailPrice} onChange={(event) => setProductForm({ ...productForm, retailPrice: event.target.value })} /></label><label>Stock quantity<input type="number" min="0" value={productForm.stockQuantity} onChange={(event) => setProductForm({ ...productForm, stockQuantity: event.target.value })} /></label></div><label>Description<input value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} /></label><div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setShowProductForm(false)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Saving...' : 'Add listing'}</button></div></form></div>}

    {bidGroup && <div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setBidGroup(null) }}><form className="create-modal supplier-form" onSubmit={submitBid}><div className="modal-heading"><span className="modal-icon"><CircleDollarSign size={18} /></span><button type="button" className="icon-button" aria-label="Close bid form" onClick={() => setBidGroup(null)}><X size={18} /></button></div><div className="section-kicker">REVERSE AUCTION</div><h2>Bid on {bidGroup.title}</h2><p>{bidGroup.currentQuantity} {bidGroup.unit} pooled from {bidGroup.participants?.length || 0} retailers.</p><div className="form-two-columns"><label>Price per {bidGroup.unit}<input type="number" min="0.01" step="0.01" required value={bidForm.pricePerUnit} onChange={(event) => setBidForm({ ...bidForm, pricePerUnit: event.target.value })} /></label><label>Minimum order<input type="number" min="1" required value={bidForm.moq} onChange={(event) => setBidForm({ ...bidForm, moq: event.target.value })} /></label><label>Delivery days<input type="number" min="1" required value={bidForm.deliveryDays} onChange={(event) => setBidForm({ ...bidForm, deliveryDays: event.target.value })} /></label></div><label>Delivery terms<input value={bidForm.deliveryTerms} onChange={(event) => setBidForm({ ...bidForm, deliveryTerms: event.target.value })} /></label><div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setBidGroup(null)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? 'Submitting...' : 'Submit bid'}</button></div></form></div>}
  </div>
}
