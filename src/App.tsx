import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { 
  ShoppingCart, X, Plus, Minus, Trash2, ChevronRight, ChevronLeft, Menu, Instagram, Facebook, Music2, 
  LayoutDashboard, Package, FileText, Settings, Shield, LogOut, Bell, CheckCircle, Clock, AlertCircle, MapPin, CreditCard, Upload, ChefHat
} from 'lucide-react';
import { get, set, keys, del } from 'idb-keyval';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Product, Category, SiteSettings, CartItem, Article, Order, Venue } from './types';
import { supabase } from './supabase';

// Default Fallback Data
const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, name: 'Signatures' },
  { id: 2, name: 'Street Food' },
  { id: 3, name: 'Drinks' },
  { id: 4, name: 'Desserts' }
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 101,
    name: 'Signature Banh Mi',
    description: 'Crispy baguette with premium pate, house-made mayo, and slow-roasted pork belly.',
    price: 65000,
    quantity: 50,
    category_id: 1,
    category_name: 'Signatures',
    image_url: 'https://images.unsplash.com/photo-1600454021970-351feb4a5149?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 102,
    name: 'Fresh Saigon Oysters',
    description: 'Freshly shucked oysters served with our signature lime and chili dipping sauce.',
    price: 120000,
    quantity: 30,
    category_id: 1,
    category_name: 'Signatures',
    image_url: 'https://images.unsplash.com/photo-1599481238505-b8b0537a3f77?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 103,
    name: 'Crispy Spring Rolls',
    description: 'Hand-rolled with minced pork, shrimp, and wood-ear mushrooms. Served with fresh herbs.',
    price: 45000,
    quantity: 100,
    category_id: 2,
    category_name: 'Street Food',
    image_url: 'https://images.unsplash.com/photo-1544435253-f09633887013?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 104,
    name: 'Lotus Tea with Milk',
    description: 'Fragrant lotus tea blended with creamy milk and honey.',
    price: 35000,
    quantity: 80,
    category_id: 3,
    category_name: 'Drinks',
    image_url: 'https://images.unsplash.com/photo-1544787210-2827443cb39b?auto=format&fit=crop&q=80&w=800'
  }
];

const DEFAULT_ARTICLES: Article[] = [
  {
    id: 201,
    title: 'The Art of Street Food Reimagined',
    content: 'At CHEFSBAR., we believe that street food is the heart of Saigon. Our mission is to take these beloved classics and elevate them with premium ingredients and modern techniques.',
    image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=1200',
    created_at: new Date().toISOString()
  },
  {
    id: 202,
    title: 'Celebrating Local Ingredients',
    content: 'We source our seafood daily from local fishermen and our herbs from sustainable farms around the city. Freshness is the key to our signature flavors.',
    image_url: 'https://images.unsplash.com/photo-1490818387583-1baba5e638af?auto=format&fit=crop&q=80&w=1200',
    created_at: new Date().toISOString()
  }
];

const DEFAULT_VENUES: Venue[] = [
  {
    id: 301,
    address: '123 Le Loi Street, District 1, HCMC',
    hours: '08:00 - 22:00',
    map_url: 'https://goo.gl/maps/example1'
  },
  {
    id: 302,
    address: '45 Thao Dien Tower, District 2, HCMC',
    hours: '10:00 - 23:30',
    map_url: 'https://goo.gl/maps/example2'
  }
];

const DEFAULT_SETTINGS: SiteSettings = { 
  title: 'CHEFSBAR', 
  description: 'Premium Street Food', 
  favicon: '',
  og_image: '',
  primary_color: '#0038FF',
  bg_color: '#F5F2ED',
  marquee_text: 'CHEFSBAR PREMIUM STREET FOOD • FRESH OYSTERS DAILY • SIGNATURE BANH MI •',
  footer_description: 'CHEFSBAR PREMIUM STREET FOOD\nRedefining Vietnamese street food with passion and precision.',
  social_instagram: 'https://instagram.com/chefsbar',
  social_facebook: 'https://facebook.com/chefsbar',
  social_tiktok: 'https://tiktok.com/@chefsbar',
  contact_phone: '090 110 98 80',
  contact_email: 'HELLO@CHEFSBAR.VN',
  header_icon: 'ChefHat'
};

const STORAGE_KEYS = {
  products: 'chefsbar.showcase.products',
  categories: 'chefsbar.showcase.categories',
  articles: 'chefsbar.showcase.articles',
  settings: 'chefsbar.showcase.settings',
  venues: 'chefsbar.showcase.venues',
  orders: 'chefsbar.showcase.orders',
} as const;

const readShowcaseState = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeShowcaseState = <T,>(key: string, value: T) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore local persistence failures in showcase mode.
  }
};

// Components
const ConditionalNavbar = ({ cartCount, onOpenCart, onOpenLogin, isAdmin, settings }: { cartCount: number, onOpenCart: () => void, onOpenLogin: () => void, isAdmin: boolean, settings: SiteSettings }) => {
  const location = useLocation();
  if (location.pathname === '/admin') return null;
  return (
    <Navbar 
      cartCount={cartCount} 
      onOpenCart={onOpenCart} 
      onOpenLogin={onOpenLogin} 
      isAdmin={isAdmin} 
      settings={settings}
    />
  );
};

const Navbar = ({ cartCount, onOpenCart, onOpenLogin, isAdmin, settings }: { cartCount: number, onOpenCart: () => void, onOpenLogin: () => void, isAdmin: boolean, settings: SiteSettings }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isTransparent = isHomePage && !isScrolled;
  const navClasses = isTransparent 
    ? 'bg-transparent text-white' 
    : 'bg-chefs-blue text-white shadow-xl';

  const isImageUrl = settings.header_icon && (settings.header_icon.startsWith('http') || settings.header_icon.startsWith('data:') || settings.header_icon.startsWith('/'));
  const IconComponent = !isImageUrl ? ((LucideIcons as any)[settings.header_icon] || ChefHat) : null;

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 py-4 px-6 flex justify-between items-center ${navClasses}`}>
      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-3 text-3xl font-display uppercase tracking-tight transition-colors">
          {isImageUrl ? (
            <img src={settings.header_icon} alt="Logo" className="w-8 h-8 object-contain" />
          ) : (
            IconComponent && <IconComponent className="w-8 h-8" />
          )}
          <span>CHEFSBAR.</span>
        </Link>
      </div>
      <div className="flex items-center gap-6">
        <button onClick={onOpenCart} className="relative cursor-pointer group">
          <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
          {cartCount > 0 && (
            <span className={`absolute -top-2 -right-2 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center brutal-border border ${isTransparent ? 'bg-white text-chefs-blue' : 'bg-white text-chefs-blue'}`}>
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};

const AdminLogin = ({ isOpen, onClose, onLogin }: { isOpen: boolean, onClose: () => void, onLogin: (u: string, p: string) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return setError('Please fill all fields');
    onLogin(username, password);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-chefs-cream w-full max-w-md p-8 rounded-2xl shadow-2xl brutal-border border-2"
          >
            <h2 className="text-4xl font-display mb-8 uppercase">Admin Login</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full p-4 bg-white brutal-border border-2 focus:outline-none" 
                  placeholder="admin"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold mb-2">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full p-4 bg-white brutal-border border-2 focus:outline-none" 
                  placeholder="admin"
                />
              </div>
              {error && <p className="text-red-500 text-xs font-bold uppercase">{error}</p>}
              <button type="submit" className="w-full py-4 bg-chefs-blue text-white font-bold uppercase tracking-widest brutal-btn">
                Sign In
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const ProductModal = ({ product, isOpen, onClose, onAddToCart, onBuyNow }: { product: Product | null, isOpen: boolean, onClose: () => void, onAddToCart: (p: Product, qty: number) => void, onBuyNow: (p: Product, qty: number) => void }) => {
  const [qty, setQty] = useState(1);

  if (!product) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-chefs-cream w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row brutal-border border-2"
          >
            <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-white brutal-border border hover:bg-zinc-100 transition-colors">
              <X className="w-6 h-6" />
            </button>
            
            <div className="w-full md:w-1/2 h-64 md:h-auto">
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            
            <div className="w-full md:w-1/2 p-8 flex flex-col">
              <span className="text-xs uppercase tracking-widest text-chefs-blue font-bold mb-2">{product.category_name}</span>
              <h2 className="text-5xl font-display mb-4 uppercase">{product.name}</h2>
              <p className="text-zinc-600 mb-8 leading-relaxed font-medium">{product.description}</p>
              
              <div className="mt-auto">
                <div className="flex items-center justify-between mb-6">
                  <span className="text-3xl font-display text-chefs-blue">{(product.price * qty).toLocaleString()} VNĐ</span>
                  <div className="flex items-center bg-white brutal-border border-2 px-4 py-2">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="hover:text-chefs-blue"><Minus className="w-4 h-4" /></button>
                    <span className="mx-6 font-bold">{qty}</span>
                    <button onClick={() => setQty(qty + 1)} className="hover:text-chefs-blue"><Plus className="w-4 h-4" /></button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => { onAddToCart(product, qty); onClose(); }}
                    className="w-full py-4 brutal-border border-2 text-chefs-blue font-bold uppercase tracking-widest hover:bg-chefs-blue hover:text-white transition-all"
                  >
                    Add to Cart
                  </button>
                  <button 
                    onClick={() => { onBuyNow(product, qty); onClose(); }}
                    className="w-full py-4 bg-chefs-blue text-white font-bold uppercase tracking-widest brutal-btn"
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const CartDrawer = ({ isOpen, onClose, cart, updateQty, removeItem, onCheckout }: { isOpen: boolean, onClose: () => void, cart: CartItem[], updateQty: (id: number, delta: number) => void, removeItem: (id: number) => void, onCheckout: (nav: any) => void }) => {
  const navigate = useNavigate();
  const total = cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-chefs-cream z-[120] shadow-2xl flex flex-col brutal-border border-l-2"
          >
            <div className="p-6 border-b-2 border-chefs-blue flex justify-between items-center bg-chefs-blue text-white">
              <h2 className="text-3xl font-display uppercase">Your Cart</h2>
              <button onClick={onClose} className="hover:rotate-90 transition-transform"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-400">
                  <ShoppingCart className="w-12 h-12 mb-4 opacity-20" />
                  <p className="font-bold uppercase tracking-widest text-xs">Your cart is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4 p-4 bg-white brutal-border border-2">
                    <img src={item.image_url} className="w-20 h-20 object-cover brutal-border border" referrerPolicy="no-referrer" />
                    <div className="flex-1">
                      <h3 className="font-display text-xl uppercase leading-none mb-1">{item.name}</h3>
                      <p className="text-sm font-bold text-chefs-blue mb-2">{item.price.toLocaleString()} VNĐ</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center bg-zinc-50 brutal-border border px-2 py-1">
                          <button onClick={() => updateQty(item.id, -1)}><Minus className="w-3 h-3" /></button>
                          <span className="mx-3 text-sm font-bold">{item.cartQuantity}</span>
                          <button onClick={() => updateQty(item.id, 1)}><Plus className="w-3 h-3" /></button>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="text-red-500 hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-6 border-t-2 border-chefs-blue bg-white">
              <div className="flex justify-between items-center mb-6">
                <span className="text-zinc-500 uppercase tracking-widest text-xs font-bold">Total</span>
                <span className="text-3xl font-display text-chefs-blue">{total.toLocaleString()} VNĐ</span>
              </div>
              <button 
                disabled={cart.length === 0}
                onClick={() => onCheckout(navigate)}
                className="w-full py-4 bg-chefs-blue text-white font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed brutal-btn"
              >
                Checkout
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Pages
const ArticlePage = ({ articles }: { articles: Article[] }) => {
  const { id } = useParams<{ id: string }>();
  const article = articles.find(a => a.id === Number(id));

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-chefs-cream">
        <h1 className="text-4xl font-display uppercase">Article Not Found</h1>
      </div>
    );
  }

  const similarArticles = articles.filter(a => a.id !== Number(id)).slice(0, 3);

  return (
    <div className="min-h-screen bg-chefs-cream pt-32 pb-32">
      <Helmet>
        <title>{article.title} | CHEFSBAR.</title>
        <meta name="description" content={article.content.substring(0, 150)} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.content.substring(0, 150)} />
        <meta property="og:image" content={article.image_url} />
      </Helmet>
      <div className="max-w-7xl mx-auto px-6">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-chefs-blue mb-12 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-8">
            <h1 className="text-5xl md:text-7xl font-display uppercase leading-tight mb-8 text-chefs-blue">{article.title}</h1>
            <div className="aspect-[21/9] w-full mb-16 brutal-border border-2 border-chefs-blue overflow-hidden">
              <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="text-lg md:text-xl text-zinc-800 font-medium leading-relaxed space-y-8">
              {article.content.split('\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
          <div className="lg:col-span-4">
            <h3 className="text-2xl font-display uppercase mb-8 text-chefs-blue border-b-2 border-chefs-blue pb-4">Similar Stories</h3>
            <div className="space-y-8">
              {similarArticles.map(similar => (
                <Link to={`/article/${similar.id}`} key={similar.id} className="group block">
                  <div className="aspect-video w-full mb-4 overflow-hidden brutal-border border-2 border-transparent group-hover:border-chefs-blue transition-colors">
                    <img src={similar.image_url} alt={similar.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  </div>
                  <h4 className="text-xl font-display uppercase group-hover:text-chefs-blue transition-colors line-clamp-2">{similar.title}</h4>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePage = ({ products, articles, venues, settings, onProductClick, isShowcaseMode }: { products: Product[], articles: Article[], venues: Venue[], settings: SiteSettings, onProductClick: (p: Product) => void, isShowcaseMode: boolean }) => {
  return (
    <div className="pt-0">
      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden flex items-center justify-center">
        <img 
          src="https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?auto=format&fit=crop&q=80&w=1920" 
          className="absolute inset-0 w-full h-full object-cover" 
          referrerPolicy="no-referrer" 
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-white text-center p-6 max-w-5xl">
          <motion.h1 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-7xl md:text-9xl font-display mb-6 tracking-tight uppercase leading-none drop-shadow-2xl"
          >
            STREET FOOD <br/> REIMAGINED
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-3xl font-medium mb-12 opacity-90 uppercase tracking-widest drop-shadow-lg"
          >
            Saigon's soul, modern vibes
          </motion.p>
          <motion.button 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-16 py-6 bg-white text-chefs-blue font-bold uppercase tracking-widest brutal-btn text-xl"
          >
            Explore Menu
          </motion.button>
        </div>
      </section>

      {/* Marquee */}
      <div className="bg-chefs-blue text-white py-6 overflow-hidden border-y-2 border-white/20">
        <div className="marquee-text flex gap-12 text-4xl font-display uppercase tracking-tight whitespace-nowrap">
          <span>{settings.marquee_text}</span>
          <span>{settings.marquee_text}</span>
          <span>{settings.marquee_text}</span>
          <span>{settings.marquee_text}</span>
        </div>
      </div>

      {/* Featured Products */}
      <section id="menu" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div>
            <span className="text-xs uppercase tracking-widest font-bold text-chefs-blue mb-4 block">Our Selection</span>
            <h2 className="text-6xl md:text-8xl font-display uppercase leading-none">THE MENU</h2>
          </div>
          <p className="max-w-md text-zinc-500 font-medium italic">Hand-crafted street food favorites reimagined with premium ingredients and modern techniques.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map(product => (
            <motion.div 
              key={product.id}
              whileHover={{ y: -10 }}
              onClick={() => onProductClick(product)}
              className="group cursor-pointer bg-white brutal-border border-2 p-4"
            >
              <div className="aspect-square overflow-hidden mb-6 brutal-border border">
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-2xl font-display uppercase leading-tight group-hover:text-chefs-blue transition-colors">{product.name}</h3>
                <span className="font-display text-chefs-blue whitespace-nowrap ml-4">{product.price.toLocaleString()}</span>
              </div>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">{product.category_name}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Articles Section */}
      <section className="py-32 bg-chefs-blue text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <span className="text-xs uppercase tracking-widest font-bold mb-4 block opacity-70">Latest News</span>
            <h2 className="text-6xl md:text-8xl font-display uppercase leading-none">STORIES</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {articles.map(article => (
              <Link 
                to={`/article/${article.id}`}
                key={article.id}
                className="group cursor-pointer block"
              >
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                >
                  <div className="aspect-[16/9] overflow-hidden mb-8 brutal-border border-2 border-white">
                    <img 
                      src={article.image_url} 
                      alt={article.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <h3 className="text-4xl font-display uppercase mb-4 group-hover:underline">{article.title}</h3>
                  <p className="text-lg opacity-80 line-clamp-2 mb-6 font-medium">{article.content}</p>
                  <button className="text-xs uppercase tracking-widest font-bold flex items-center gap-2 group-hover:gap-4 transition-all">
                    Read More <ChevronRight className="w-4 h-4" />
                  </button>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Venues */}
      <section className="py-32 bg-chefs-cream">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-7xl md:text-9xl font-display text-chefs-blue text-center mb-24 uppercase leading-none">VENUES</h2>
          <div className="space-y-4">
            {venues.map((venue) => (
              <a 
                key={venue.id} 
                href={venue.map_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-8 bg-white brutal-border border-2 flex flex-col md:flex-row justify-between items-center group cursor-pointer hover:bg-chefs-blue hover:text-white transition-all"
              >
                <span className="text-3xl md:text-4xl font-display uppercase">{venue.address}</span>
                <span className="text-xs uppercase tracking-widest font-bold opacity-60 group-hover:opacity-100">{venue.hours}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white pt-24 md:pt-32 pb-12 px-6 border-t-8 border-chefs-blue">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-8">
          <div className="md:col-span-5">
            <Link to="/admin" className="group inline-block">
              <h2 className="text-6xl md:text-8xl font-display mb-2 group-hover:text-chefs-blue transition-colors leading-none">CHEFSBAR.</h2>
              <span className="text-[10px] uppercase tracking-widest font-bold opacity-20 group-hover:opacity-100 transition-opacity">
                {isShowcaseMode ? 'Showcase Dashboard' : 'Admin Dashboard'}
              </span>
            </Link>
            <p className="text-sm opacity-60 leading-relaxed max-w-sm font-medium uppercase tracking-wider mt-8 whitespace-pre-line">
              {settings.footer_description}
            </p>
          </div>
          
          <div className="md:col-span-3 md:col-start-7">
            <h4 className="text-xs uppercase tracking-widest font-bold mb-8 opacity-40">Quick Links</h4>
            <div className="flex flex-col gap-4">
              <button onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })} className="text-left text-lg font-display uppercase hover:text-chefs-blue transition-colors w-fit">Menu</button>
              <button onClick={() => document.getElementById('stories')?.scrollIntoView({ behavior: 'smooth' })} className="text-left text-lg font-display uppercase hover:text-chefs-blue transition-colors w-fit">Stories</button>
              <button onClick={() => document.getElementById('locations')?.scrollIntoView({ behavior: 'smooth' })} className="text-left text-lg font-display uppercase hover:text-chefs-blue transition-colors w-fit">Locations</button>
            </div>
          </div>

          <div className="md:col-span-3">
            <h4 className="text-xs uppercase tracking-widest font-bold mb-8 opacity-40">Follow Us</h4>
            <div className="flex gap-6 mb-12">
              {settings.social_instagram && (
                <a href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="bg-white/5 p-3 rounded-full hover:bg-chefs-blue hover:text-white transition-all">
                  <Instagram className="w-6 h-6" />
                </a>
              )}
              {settings.social_facebook && (
                <a href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="bg-white/5 p-3 rounded-full hover:bg-chefs-blue hover:text-white transition-all">
                  <Facebook className="w-6 h-6" />
                </a>
              )}
              {settings.social_tiktok && (
                <a href={settings.social_tiktok} target="_blank" rel="noopener noreferrer" className="bg-white/5 p-3 rounded-full hover:bg-chefs-blue hover:text-white transition-all">
                  <Music2 className="w-6 h-6" />
                </a>
              )}
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest font-bold mb-4 opacity-40">Contact</h4>
              <p className="text-xl font-display mb-1">{settings.contact_phone}</p>
              <p className="text-sm opacity-60 font-bold hover:text-chefs-blue transition-colors cursor-pointer">{settings.contact_email}</p>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold uppercase tracking-widest opacity-40">
          <p>© {new Date().getFullYear()} CHEFSBAR. All rights reserved.</p>
          <p>Designed with passion</p>
        </div>
      </footer>
    </div>
  );
};

const AdminPage = ({ 
  products, 
  categories, 
  settings, 
  articles,
  orders,
  venues,
  onUpdateProduct, 
  onDeleteProduct, 
  onAddProduct, 
  onUpdateSettings,
  onAddArticle,
  onUpdateArticle,
  onDeleteArticle,
  onChangePassword,
  onUpdateOrderStatus,
  onLogout,
  onAddVenue,
  onUpdateVenue,
  onDeleteVenue,
  onUploadImage,
  isUploading,
  isShowcaseMode
}: { 
  products: Product[], 
  categories: Category[], 
  settings: SiteSettings, 
  articles: Article[],
  orders: Order[],
  venues: Venue[],
  onUpdateProduct: (p: Product) => void, 
  onDeleteProduct: (id: number) => void, 
  onAddProduct: (p: Partial<Product>) => void, 
  onUpdateSettings: (s: SiteSettings) => void,
  onAddArticle: (a: Partial<Article>) => void,
  onUpdateArticle: (a: Article) => void,
  onDeleteArticle: (id: number) => void,
  onChangePassword: (p: string) => void,
  onUpdateOrderStatus: (id: number, status: string) => void,
  onLogout: (nav: any) => void,
  onAddVenue: (v: Partial<Venue>) => void,
  onUpdateVenue: (v: Venue) => void,
  onDeleteVenue: (id: number) => void,
  onUploadImage: (file: File) => Promise<string>,
  isUploading: boolean,
  isShowcaseMode: boolean
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'articles' | 'venues' | 'settings' | 'password'>('orders');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingArticle, setEditingArticle] = useState<Partial<Article> | null>(null);
  const [editingVenue, setEditingVenue] = useState<Partial<Venue> | null>(null);
  const [newPass, setNewPass] = useState('');
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    if (pendingOrders > 0) setShowNotification(true);
  }, [orders]);

  const menuItems = [
    { id: 'orders', label: 'Orders', icon: Bell, count: orders.filter(o => o.status === 'pending').length },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'articles', label: 'Articles', icon: FileText },
    { id: 'venues', label: 'Venues', icon: MapPin },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'password', label: 'Security', icon: Shield },
    { id: 'home', label: 'Back to Home', icon: ChevronRight, action: () => navigate('/') },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-zinc-200 flex flex-col sticky top-0 h-screen">
        <div className="p-8 border-b border-zinc-100">
          <img src="/logo.png" alt="Logo" className="h-12 w-auto mb-2" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }} />
          <h1 className="text-2xl font-display text-chefs-blue hidden">CHEFSBAR.</h1>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Admin Dashboard</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                if ('action' in item && item.action) {
                  item.action();
                } else {
                  setActiveTab(item.id as any);
                }
              }}
              className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${activeTab === item.id ? 'bg-chefs-blue text-white shadow-lg shadow-chefs-blue/20' : 'text-zinc-500 hover:bg-zinc-100'}`}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
              </div>
              {item.count ? (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeTab === item.id ? 'bg-white text-chefs-blue' : 'bg-red-500 text-white'}`}>
                  {item.count}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-100">
          <button 
            onClick={() => onLogout(navigate)}
            className="w-full flex items-center gap-3 p-4 text-zinc-500 hover:text-red-500 hover:bg-red-50 transition-all rounded-xl"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-12 overflow-y-auto">
        {isShowcaseMode && (
          <div className="mb-8 rounded-3xl border border-chefs-blue/20 bg-chefs-blue/5 px-6 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-chefs-blue">Showcase mode</p>
            <p className="mt-2 max-w-2xl text-sm font-medium text-zinc-600">
              This dashboard is running from local demo data only. Changes stay in this browser and do not require Supabase.
            </p>
          </div>
        )}
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-4xl font-display uppercase text-zinc-900">{activeTab}</h2>
            <p className="text-sm text-zinc-400 font-medium">Manage your store {activeTab} here.</p>
          </div>
          
          {activeTab === 'products' && (
            <button 
              onClick={() => setEditingProduct({ name: '', price: 0, quantity: 0, description: '', image_url: '', category_id: categories[0]?.id })}
              className="bg-chefs-blue text-white px-8 py-3 rounded-xl shadow-lg shadow-chefs-blue/20 text-xs uppercase tracking-widest font-bold hover:scale-105 transition-transform"
            >
              Add Product
            </button>
          )}
          {activeTab === 'articles' && (
            <button 
              onClick={() => setEditingArticle({ title: '', content: '', image_url: '' })}
              className="bg-chefs-blue text-white px-8 py-3 rounded-xl shadow-lg shadow-chefs-blue/20 text-xs uppercase tracking-widest font-bold hover:scale-105 transition-transform"
            >
              Add Article
            </button>
          )}
          {activeTab === 'venues' && (
            <button 
              onClick={() => setEditingVenue({ address: '', hours: '', map_url: '' })}
              className="bg-chefs-blue text-white px-8 py-3 rounded-xl shadow-lg shadow-chefs-blue/20 text-xs uppercase tracking-widest font-bold hover:scale-105 transition-transform"
            >
              Add Venue
            </button>
          )}
        </header>

        {activeTab === 'orders' && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-white p-20 rounded-3xl border border-zinc-100 text-center">
                <Bell className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">No orders yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                  <thead className="bg-zinc-50 text-[10px] uppercase tracking-widest font-bold text-zinc-400 border-b border-zinc-100">
                    <tr>
                      <th className="px-8 py-6">Order ID</th>
                      <th className="px-8 py-6">Customer</th>
                      <th className="px-8 py-6">Items</th>
                      <th className="px-8 py-6">Total</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6">Date</th>
                      <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                    {orders.map(order => (
                      <tr key={order.id} className="group hover:bg-zinc-50 transition-colors">
                        <td className="px-8 py-6 font-mono text-xs text-zinc-400">#{order.id.toString().padStart(4, '0')}</td>
                        <td className="px-8 py-6">
                          <p className="font-bold text-sm text-zinc-900">{order.customer_name}</p>
                          <p className="text-[10px] text-zinc-400 font-medium">{order.customer_email}</p>
                          <p className="text-[10px] text-zinc-400 font-medium">{order.customer_phone}</p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="space-y-1">
                            {(() => {
                              try {
                                const items = JSON.parse(order.items);
                                return items.map((item: any, idx: number) => (
                                  <div key={idx} className="text-xs text-zinc-600 font-medium">
                                    <span className="font-bold">{item.cartQuantity}x</span> {item.name}
                                  </div>
                                ));
                              } catch (e) {
                                return <span className="text-xs text-red-400">Invalid items</span>;
                              }
                            })()}
                          </div>
                        </td>
                        <td className="px-8 py-6 font-display text-chefs-blue">{order.total.toLocaleString()}</td>
                        <td className="px-8 py-6">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
                            order.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 
                            order.status === 'pending' ? 'bg-amber-100 text-amber-600' : 
                            'bg-red-100 text-red-600'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-xs text-zinc-400 font-medium">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <select 
                            value={order.status}
                            onChange={(e) => onUpdateOrderStatus(order.id, e.target.value)}
                            className="text-[10px] font-bold uppercase tracking-widest bg-zinc-100 border-none rounded-lg px-3 py-1 focus:ring-2 focus:ring-chefs-blue"
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 text-[10px] uppercase tracking-widest font-bold text-zinc-400 border-b border-zinc-100">
                <tr>
                  <th className="px-8 py-6">Product</th>
                  <th className="px-8 py-6">Category</th>
                  <th className="px-8 py-6">Price</th>
                  <th className="px-8 py-6">Stock</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {products.map(p => (
                  <tr key={p.id} className="group hover:bg-zinc-50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img src={p.image_url} className="w-12 h-12 object-cover rounded-xl border border-zinc-100" referrerPolicy="no-referrer" />
                        <span className="font-bold text-sm text-zinc-900">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-chefs-blue bg-chefs-blue/5 px-3 py-1 rounded-full">
                        {p.category_name}
                      </span>
                    </td>
                    <td className="px-8 py-6 font-display text-zinc-900">{p.price.toLocaleString()}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${p.quantity > 10 ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        <span className="text-xs font-bold text-zinc-500">{p.quantity}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right space-x-4">
                      <button onClick={() => setEditingProduct(p)} className="text-xs font-bold uppercase tracking-widest text-chefs-blue hover:underline">Edit</button>
                      <button onClick={() => onDeleteProduct(p.id)} className="text-xs font-bold uppercase tracking-widest text-red-500 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'articles' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map(a => (
              <div key={a.id} className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm group">
                <div className="relative h-48 overflow-hidden">
                  <img src={a.image_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <h3 className="absolute bottom-6 left-6 right-6 font-display text-xl text-white uppercase leading-tight">{a.title}</h3>
                </div>
                <div className="p-6">
                  <p className="text-xs text-zinc-400 line-clamp-3 mb-6 font-medium leading-relaxed">{a.content}</p>
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setEditingArticle(a)}
                      className="text-[10px] font-bold uppercase tracking-widest text-chefs-blue hover:underline flex items-center gap-2"
                    >
                      Edit Article
                    </button>
                    <button 
                      onClick={() => onDeleteArticle(a.id)}
                      className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:underline flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'venues' && (
          <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden shadow-sm">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 text-[10px] uppercase tracking-widest font-bold text-zinc-400 border-b border-zinc-100">
                <tr>
                  <th className="px-8 py-6">Address</th>
                  <th className="px-8 py-6">Hours</th>
                  <th className="px-8 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {venues.map(v => (
                  <tr key={v.id} className="group hover:bg-zinc-50 transition-colors">
                    <td className="px-8 py-6 font-bold text-sm text-zinc-900">{v.address}</td>
                    <td className="px-8 py-6 text-xs text-zinc-500">{v.hours}</td>
                    <td className="px-8 py-6 text-right space-x-4">
                      <button onClick={() => setEditingVenue(v)} className="text-xs font-bold uppercase tracking-widest text-chefs-blue hover:underline">Edit</button>
                      <button onClick={() => onDeleteVenue(v.id)} className="text-xs font-bold uppercase tracking-widest text-red-500 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-white p-12 rounded-3xl border border-zinc-100 shadow-sm">
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Page Title</label>
                  <input 
                    type="text" 
                    defaultValue={settings.title} 
                    onBlur={(e) => onUpdateSettings({ ...settings, title: e.target.value })}
                    className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-chefs-blue font-bold" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Favicon URL</label>
                  <input 
                    type="text" 
                    defaultValue={settings.favicon} 
                    onBlur={(e) => onUpdateSettings({ ...settings, favicon: e.target.value })}
                    className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-chefs-blue font-bold" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Page Description</label>
                <textarea 
                  defaultValue={settings.description} 
                  onBlur={(e) => onUpdateSettings({ ...settings, description: e.target.value })}
                  className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-chefs-blue h-32 font-bold" 
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">OG Image URL</label>
                <input 
                  type="text" 
                  defaultValue={settings.og_image} 
                  onBlur={(e) => onUpdateSettings({ ...settings, og_image: e.target.value })}
                  className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-chefs-blue font-bold" 
                />
              </div>
              <div className="pt-8 border-t border-zinc-100">
                <h3 className="text-xl font-display uppercase mb-6">Content Settings</h3>
                <div className="space-y-8">
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Header Icon (Lucide Icon Name or Image URL)</label>
                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        key={settings.header_icon}
                        defaultValue={settings.header_icon} 
                        onBlur={(e) => onUpdateSettings({ ...settings, header_icon: e.target.value })}
                        className="flex-1 p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-chefs-blue font-bold" 
                      />
                      <label className="cursor-pointer bg-zinc-100 p-4 rounded-xl border border-zinc-200 hover:bg-zinc-200 transition-colors flex items-center justify-center">
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const url = await onUploadImage(file);
                              if (url) onUpdateSettings({...settings, header_icon: url});
                            }
                          }}
                        />
                        {isUploading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-chefs-blue border-t-transparent" />
                        ) : (
                          <Upload className="w-5 h-5 text-zinc-500" />
                        )}
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Marquee Text (Under Hero)</label>
                    <input 
                      type="text" 
                      defaultValue={settings.marquee_text} 
                      onBlur={(e) => onUpdateSettings({ ...settings, marquee_text: e.target.value })}
                      className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-chefs-blue font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Footer Description</label>
                    <textarea 
                      defaultValue={settings.footer_description} 
                      onBlur={(e) => onUpdateSettings({ ...settings, footer_description: e.target.value })}
                      className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-chefs-blue h-32 font-bold" 
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Contact Phone</label>
                      <input 
                        type="text" 
                        defaultValue={settings.contact_phone} 
                        onBlur={(e) => onUpdateSettings({ ...settings, contact_phone: e.target.value })}
                        className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-chefs-blue font-bold" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Contact Email</label>
                      <input 
                        type="text" 
                        defaultValue={settings.contact_email} 
                        onBlur={(e) => onUpdateSettings({ ...settings, contact_email: e.target.value })}
                        className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-chefs-blue font-bold" 
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Instagram URL</label>
                      <input 
                        type="text" 
                        defaultValue={settings.social_instagram} 
                        onBlur={(e) => onUpdateSettings({ ...settings, social_instagram: e.target.value })}
                        className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-chefs-blue font-bold" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Facebook URL</label>
                      <input 
                        type="text" 
                        defaultValue={settings.social_facebook} 
                        onBlur={(e) => onUpdateSettings({ ...settings, social_facebook: e.target.value })}
                        className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-chefs-blue font-bold" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">TikTok/Music URL</label>
                      <input 
                        type="text" 
                        defaultValue={settings.social_tiktok} 
                        onBlur={(e) => onUpdateSettings({ ...settings, social_tiktok: e.target.value })}
                        className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-chefs-blue font-bold" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'password' && (
          <div className="max-w-md bg-white p-12 rounded-3xl border border-zinc-100 shadow-sm">
            <div className="space-y-8">
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">New Password</label>
                <input 
                  type="password" 
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-chefs-blue font-bold" 
                />
              </div>
              <button 
                onClick={() => { onChangePassword(newPass); setNewPass(''); }}
                className="w-full py-4 bg-chefs-blue text-white font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-chefs-blue/20 hover:scale-105 transition-transform"
              >
                Update Password
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals remain similar but with rounded-3xl and cleaner styling */}
      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingProduct(null)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative bg-white w-full max-w-4xl p-8 rounded-[32px] shadow-2xl border border-zinc-100 flex flex-col md:flex-row gap-8"
            >
              <div className="w-full md:w-1/3 flex flex-col gap-4">
                <div className="aspect-square bg-zinc-50 rounded-2xl border-2 border-dashed border-zinc-200 overflow-hidden flex items-center justify-center">
                  {editingProduct.image_url ? (
                    <img src={editingProduct.image_url} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Package className="w-12 h-12 text-zinc-200" />
                  )}
                </div>
                <label className="cursor-pointer bg-zinc-100 p-3 rounded-xl border border-zinc-200 hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest">
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await onUploadImage(file);
                        if (url) setEditingProduct({...editingProduct, image_url: url});
                      }
                    }}
                  />
                  {isUploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-chefs-blue border-t-transparent" />
                  ) : (
                    <Upload className="w-4 h-4 text-zinc-500" />
                  )}
                  Upload Image
                </label>
              </div>

              <div className="flex-1 flex flex-col">
                <h2 className="text-2xl font-display mb-6 uppercase text-zinc-900">{editingProduct.id ? 'Edit Product' : 'Add Product'}</h2>
                <div className="grid grid-cols-2 gap-4 flex-1">
                  <div className="col-span-2">
                    <label className="block text-[9px] uppercase tracking-widest font-bold text-zinc-400 mb-1">Product Name</label>
                    <input 
                      placeholder="Product Name"
                      value={editingProduct.name}
                      onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                      className="w-full p-3 bg-zinc-50 rounded-xl border border-zinc-100 font-bold focus:ring-2 focus:ring-chefs-blue outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[9px] uppercase tracking-widest font-bold text-zinc-400 mb-1">Description</label>
                    <textarea 
                      placeholder="Description"
                      value={editingProduct.description}
                      onChange={e => setEditingProduct({...editingProduct, description: e.target.value})}
                      className="w-full p-3 bg-zinc-50 rounded-xl border border-zinc-100 h-20 font-bold focus:ring-2 focus:ring-chefs-blue outline-none text-sm resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest font-bold text-zinc-400 mb-1">Price</label>
                    <input 
                      type="number"
                      placeholder="Price"
                      value={editingProduct.price}
                      onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})}
                      className="w-full p-3 bg-zinc-50 rounded-xl border border-zinc-100 font-bold focus:ring-2 focus:ring-chefs-blue outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-widest font-bold text-zinc-400 mb-1">Quantity</label>
                    <input 
                      type="number"
                      placeholder="Quantity"
                      value={editingProduct.quantity}
                      onChange={e => setEditingProduct({...editingProduct, quantity: Number(e.target.value)})}
                      className="w-full p-3 bg-zinc-50 rounded-xl border border-zinc-100 font-bold focus:ring-2 focus:ring-chefs-blue outline-none text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[9px] uppercase tracking-widest font-bold text-zinc-400 mb-1">Category</label>
                    <select 
                      value={editingProduct.category_id}
                      onChange={e => setEditingProduct({...editingProduct, category_id: Number(e.target.value)})}
                      className="w-full p-3 bg-zinc-50 rounded-xl border border-zinc-100 font-bold focus:ring-2 focus:ring-chefs-blue outline-none text-sm"
                    >
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="mt-8 flex gap-4">
                  <button 
                    onClick={() => setEditingProduct(null)}
                    className="flex-1 py-3 rounded-xl border border-zinc-200 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:bg-zinc-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      if (editingProduct.id) onUpdateProduct(editingProduct as Product);
                      else onAddProduct(editingProduct);
                      setEditingProduct(null);
                    }}
                    className="flex-1 py-3 bg-chefs-blue text-white text-[10px] uppercase tracking-widest font-bold rounded-xl shadow-lg shadow-chefs-blue/20 hover:scale-105 transition-transform"
                  >
                    Save Product
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Article Modal */}
      <AnimatePresence>
        {editingArticle && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingArticle(null)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative bg-white w-full max-w-4xl p-8 rounded-[32px] shadow-2xl border border-zinc-100 flex flex-col md:flex-row gap-8"
            >
              <div className="flex-1 space-y-6">
                <h2 className="text-4xl font-display mb-4 uppercase text-zinc-900">{editingArticle.id ? 'Edit Article' : 'Add Article'}</h2>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Article Title</label>
                  <input 
                    placeholder="Article Title"
                    value={editingArticle.title}
                    onChange={e => setEditingArticle({...editingArticle, title: e.target.value})}
                    className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 font-bold focus:ring-2 focus:ring-chefs-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Image URL</label>
                  <div className="flex gap-4">
                    <input 
                      placeholder="Image URL"
                      value={editingArticle.image_url}
                      onChange={e => setEditingArticle({...editingArticle, image_url: e.target.value})}
                      className="flex-1 p-4 bg-zinc-50 rounded-xl border border-zinc-100 font-bold focus:ring-2 focus:ring-chefs-blue outline-none"
                    />
                    <label className="cursor-pointer bg-zinc-100 p-4 rounded-xl border border-zinc-200 hover:bg-zinc-200 transition-colors flex items-center justify-center">
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const url = await onUploadImage(file);
                            if (url) setEditingArticle({...editingArticle, image_url: url});
                          }
                        }}
                      />
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-chefs-blue border-t-transparent" />
                      ) : (
                        <Upload className="w-5 h-5 text-zinc-500" />
                      )}
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex-1 flex flex-col">
                <div className="flex-1 mb-6">
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Content</label>
                  <textarea 
                    placeholder="Content"
                    value={editingArticle.content}
                    onChange={e => setEditingArticle({...editingArticle, content: e.target.value})}
                    className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 h-full min-h-[200px] font-bold focus:ring-2 focus:ring-chefs-blue outline-none resize-none"
                  />
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setEditingArticle(null)}
                    className="flex-1 py-4 rounded-xl border border-zinc-200 text-xs uppercase tracking-widest font-bold text-zinc-400 hover:bg-zinc-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      if (editingArticle.id) onUpdateArticle(editingArticle as Article);
                      else onAddArticle(editingArticle);
                      setEditingArticle(null);
                    }}
                    className="flex-1 py-4 bg-chefs-blue text-white text-xs uppercase tracking-widest font-bold rounded-xl shadow-lg shadow-chefs-blue/20 hover:scale-105 transition-transform"
                  >
                    Save Article
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Order Toast */}
      <AnimatePresence>
        {editingVenue && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingVenue(null)} />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative bg-white w-full max-w-xl p-12 rounded-[32px] shadow-2xl border border-zinc-100"
            >
              <h2 className="text-4xl font-display mb-8 uppercase text-zinc-900">{editingVenue.id ? 'Edit Venue' : 'Add Venue'}</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Address</label>
                  <input 
                    placeholder="Address"
                    value={editingVenue.address}
                    onChange={e => setEditingVenue({...editingVenue, address: e.target.value})}
                    className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 font-bold focus:ring-2 focus:ring-chefs-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Hours</label>
                  <input 
                    placeholder="Hours (e.g. 08:00 - 22:00)"
                    value={editingVenue.hours}
                    onChange={e => setEditingVenue({...editingVenue, hours: e.target.value})}
                    className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 font-bold focus:ring-2 focus:ring-chefs-blue outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Google Maps URL</label>
                  <input 
                    placeholder="Google Maps URL"
                    value={editingVenue.map_url}
                    onChange={e => setEditingVenue({...editingVenue, map_url: e.target.value})}
                    className="w-full p-4 bg-zinc-50 rounded-xl border border-zinc-100 font-bold focus:ring-2 focus:ring-chefs-blue outline-none"
                  />
                </div>
              </div>
              <div className="mt-12 flex gap-6">
                <button 
                  onClick={() => setEditingVenue(null)}
                  className="flex-1 py-4 rounded-xl border border-zinc-200 text-xs uppercase tracking-widest font-bold text-zinc-400 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (editingVenue.id) onUpdateVenue(editingVenue as Venue);
                    else onAddVenue(editingVenue);
                    setEditingVenue(null);
                  }}
                  className="flex-1 py-4 bg-chefs-blue text-white text-xs uppercase tracking-widest font-bold rounded-xl shadow-lg shadow-chefs-blue/20 hover:scale-105 transition-transform"
                >
                  Save Venue
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Order Toast */}
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            className="fixed bottom-8 right-8 bg-white p-6 rounded-2xl shadow-2xl border border-zinc-100 flex items-center gap-4 z-[300]"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-900">New Orders Pending!</p>
              <p className="text-xs text-zinc-400 font-medium">You have {orders.filter(o => o.status === 'pending').length} new orders to process.</p>
            </div>
            <button onClick={() => setShowNotification(false)} className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-zinc-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CheckoutPage = ({ cart, onComplete, onPlaceOrder, isShowcaseMode }: { cart: CartItem[], onComplete: (nav: any) => void, onPlaceOrder: (order: Omit<Order, 'id' | 'status' | 'created_at'>) => Promise<boolean>, isShowcaseMode: boolean }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Banking'>('COD');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });
  const total = cart.reduce((sum, item) => sum + item.price * item.cartQuantity, 0);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const success = await onPlaceOrder({
      customer_name: customerInfo.name,
      customer_email: customerInfo.email,
      customer_phone: customerInfo.phone,
      customer_address: customerInfo.address,
      total,
      items: JSON.stringify(cart),
      payment_method: paymentMethod || 'COD'
    });

    if (success) {
      setTimeout(() => {
        setLoading(false);
        onComplete(navigate);
      }, 1200);
    } else {
      setLoading(false);
      alert('Failed to process order');
    }
  };

  return (
    <div className="pt-32 px-6 max-w-6xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row gap-16">
        <div className="flex-1">
          <h1 className="text-6xl font-display mb-12 uppercase text-chefs-blue">Checkout</h1>

          {isShowcaseMode && (
            <div className="mb-8 rounded-2xl border border-chefs-blue/20 bg-chefs-blue/5 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-chefs-blue">Demo checkout</p>
              <p className="mt-2 text-sm font-medium text-zinc-600">
                Orders are saved locally for portfolio demo purposes and are not sent to a live backend.
              </p>
            </div>
          )}
          
          <form onSubmit={handleCheckout} className="space-y-12">
            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-8 bg-chefs-blue text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                <h2 className="text-2xl font-display uppercase">Customer Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Full Name</label>
                  <input 
                    required 
                    value={customerInfo.name}
                    onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                    placeholder="John Doe" 
                    className="w-full p-4 bg-white rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-chefs-blue outline-none font-bold text-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Email Address (Optional)</label>
                  <input 
                    type="email" 
                    value={customerInfo.email}
                    onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})}
                    placeholder="john@example.com" 
                    className="w-full p-4 bg-white rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-chefs-blue outline-none font-bold text-sm" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 ml-1">Phone Number</label>
                  <input 
                    required 
                    value={customerInfo.phone}
                    onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    placeholder="090 123 4567" 
                    className="w-full p-4 bg-white rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-chefs-blue outline-none font-bold text-sm" 
                  />
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-8 bg-chefs-blue text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                <h2 className="text-2xl font-display uppercase">Delivery Address</h2>
              </div>
              <textarea 
                required 
                value={customerInfo.address}
                onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}
                placeholder="Enter your full delivery address..." 
                className="w-full p-4 bg-white rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-chefs-blue outline-none font-bold text-sm h-32" 
              />
            </section>

            <section>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-8 h-8 bg-chefs-blue text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                <h2 className="text-2xl font-display uppercase">Payment Method</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${paymentMethod === 'COD' ? 'bg-chefs-blue/5 border-chefs-blue shadow-md' : 'bg-zinc-50 border-zinc-200 hover:border-chefs-blue/50'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${paymentMethod === 'COD' ? 'bg-chefs-blue text-white' : 'bg-white text-chefs-blue'}`}>
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-sm uppercase tracking-widest">COD</p>
                      <p className="text-[10px] text-zinc-400 font-medium">Cash on Delivery</p>
                    </div>
                  </div>
                  {paymentMethod === 'COD' && <CheckCircle className="w-6 h-6 text-chefs-blue" />}
                </div>

                <div 
                  onClick={() => setPaymentMethod('Banking')}
                  className={`p-6 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${paymentMethod === 'Banking' ? 'bg-chefs-blue/5 border-chefs-blue shadow-md' : 'bg-zinc-50 border-zinc-200 hover:border-chefs-blue/50'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${paymentMethod === 'Banking' ? 'bg-chefs-blue text-white' : 'bg-white text-chefs-blue'}`}>
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-sm uppercase tracking-widest">Banking</p>
                      <p className="text-[10px] text-zinc-400 font-medium">VietQR / Momo</p>
                    </div>
                  </div>
                  {paymentMethod === 'Banking' && <CheckCircle className="w-6 h-6 text-chefs-blue" />}
                </div>
              </div>

              {paymentMethod === 'Banking' && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 p-8 bg-white rounded-3xl border border-chefs-blue/20 shadow-xl flex flex-col md:flex-row gap-8 items-center"
                >
                  <div className="text-center space-y-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Scan to pay via VietQR</p>
                    <img 
                      src={`https://img.vietqr.io/image/MB-123456789-compact.png?amount=${total}&addInfo=ORDER_${Math.random().toString(36).substr(2, 5).toUpperCase()}&accountName=CHEFSBAR`} 
                      alt="VietQR" 
                      className="w-48 h-48 mx-auto brutal-border border-2"
                    />
                    <p className="text-[10px] font-bold text-chefs-blue">MB BANK • 123456789</p>
                  </div>
                  <div className="hidden md:block w-px h-48 bg-zinc-100" />
                  <div className="text-center space-y-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Pay via Momo</p>
                    <div className="w-48 h-48 bg-pink-50 rounded-2xl flex flex-col items-center justify-center border-2 border-pink-200 gap-2">
                       <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" className="w-12 h-12" />
                       <p className="text-[10px] font-bold text-pink-600">090 110 98 80</p>
                       <p className="text-[8px] uppercase tracking-widest font-bold text-pink-400">Scan in Momo App</p>
                    </div>
                    <p className="text-[10px] font-bold text-pink-600">MOMO • 0901109880</p>
                  </div>
                </motion.div>
              )}
            </section>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-chefs-blue text-white font-bold uppercase tracking-widest rounded-2xl shadow-xl shadow-chefs-blue/20 hover:scale-[1.02] transition-transform text-lg flex items-center justify-center gap-4"
            >
              {loading ? (
                <>
                  <Clock className="w-6 h-6 animate-spin" />
                  Processing...
                </>
              ) : (
                `Place Order • ${total.toLocaleString()} VNĐ`
              )}
            </button>
          </form>
        </div>

        <div className="w-full md:w-[400px]">
          <div className="bg-white p-8 rounded-[32px] border border-zinc-100 shadow-xl sticky top-32">
            <h2 className="text-2xl font-display mb-8 uppercase">Order Summary</h2>
            <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <img src={item.image_url} className="w-16 h-16 object-cover rounded-xl border border-zinc-100" referrerPolicy="no-referrer" />
                    <div>
                      <p className="font-bold text-sm text-zinc-900 leading-tight">{item.name}</p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Qty: {item.cartQuantity}</p>
                    </div>
                  </div>
                  <span className="font-display text-chefs-blue">{(item.price * item.cartQuantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            
            <div className="space-y-4 pt-8 border-t border-zinc-100">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-400">
                <span>Subtotal</span>
                <span>{total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-400">
                <span>Delivery</span>
                <span className="text-emerald-500">FREE</span>
              </div>
              <div className="flex justify-between items-center pt-4">
                <span className="text-sm uppercase tracking-widest font-bold text-zinc-900">Total</span>
                <span className="text-3xl font-display text-chefs-blue">{total.toLocaleString()} VNĐ</span>
              </div>
            </div>

            <div className="mt-8 p-4 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-[10px] text-amber-700 font-medium leading-relaxed">
                Orders are usually delivered within 30-45 minutes. Please keep your phone reachable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, message, onConfirm, onCancel }: { isOpen: boolean, message: string, onConfirm: () => void, onCancel: () => void }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border-2 border-zinc-100">
        <h3 className="text-2xl font-display uppercase mb-4">Confirm Action</h3>
        <p className="text-zinc-500 font-medium mb-8">{message}</p>
        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 py-3 bg-zinc-100 text-zinc-900 font-bold uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-colors">Cancel</button>
          <button onClick={() => { onConfirm(); onCancel(); }} className="flex-1 py-3 bg-red-500 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">Confirm</button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const isShowcaseMode = !supabase;
  const [products, setProducts] = useState<Product[]>(() => readShowcaseState(STORAGE_KEYS.products, DEFAULT_PRODUCTS));
  const [categories, setCategories] = useState<Category[]>(() => readShowcaseState(STORAGE_KEYS.categories, DEFAULT_CATEGORIES));
  const [articles, setArticles] = useState<Article[]>(() => readShowcaseState(STORAGE_KEYS.articles, DEFAULT_ARTICLES));
  const [settings, setSettings] = useState<SiteSettings>(() => readShowcaseState(STORAGE_KEYS.settings, DEFAULT_SETTINGS));
  const [venues, setVenues] = useState<Venue[]>(() => readShowcaseState(STORAGE_KEYS.venues, DEFAULT_VENUES));
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean, message: string, onConfirm: () => void }>({ isOpen: false, message: '', onConfirm: () => {} });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin-token'));
  const [orders, setOrders] = useState<Order[]>(() => readShowcaseState(STORAGE_KEYS.orders, [] as Order[]));

  useEffect(() => {
    fetchData();
    if (token) fetchOrders();

    if (supabase) {
      const channel = supabase
        .channel('public-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public' },
          (payload) => {
            console.log('Realtime change received!', payload);
            fetchData();
            if (token) fetchOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [token]);

  const fetchOrders = async () => {
    if (supabase) {
      const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
      if (data && !error) setOrders(data);
    } else {
      setOrders(readShowcaseState(STORAGE_KEYS.orders, [] as Order[]));
    }
  };

  useEffect(() => {
    if (!isShowcaseMode) return;

    writeShowcaseState(STORAGE_KEYS.products, products);
    writeShowcaseState(STORAGE_KEYS.categories, categories);
    writeShowcaseState(STORAGE_KEYS.articles, articles);
    writeShowcaseState(STORAGE_KEYS.settings, settings);
    writeShowcaseState(STORAGE_KEYS.venues, venues);
    writeShowcaseState(STORAGE_KEYS.orders, orders);
  }, [articles, categories, isShowcaseMode, orders, products, settings, venues]);

  useEffect(() => {
    const syncLocalImages = async () => {
      if (!supabase) return;
      const allKeys = await keys();
      for (const key of allKeys) {
        if (typeof key === 'string' && key.startsWith('img_')) {
          const file = await get(key);
          if (file instanceof File) {
            try {
              const fileExt = file.name.split('.').pop();
              const fileName = `${Math.random()}.${fileExt}`;
              const filePath = `uploads/${fileName}`;
              const { error } = await supabase.storage.from('images').upload(filePath, file);
              if (!error) {
                await del(key);
                console.log(`Synced ${file.name} to Supabase`);
              }
            } catch (err) {
              console.error('Sync failed for', key, err);
            }
          }
        }
      }
    };
    syncLocalImages();
  }, [supabase]);

  const fetchData = async () => {
    // Set defaults first as initial state
    const setDefaults = () => {
      setProducts(DEFAULT_PRODUCTS);
      setCategories(DEFAULT_CATEGORIES);
      setArticles(DEFAULT_ARTICLES);
      setVenues(DEFAULT_VENUES);
      setSettings(DEFAULT_SETTINGS);
    };

    const setShowcaseSnapshot = () => {
      setProducts(readShowcaseState(STORAGE_KEYS.products, DEFAULT_PRODUCTS));
      setCategories(readShowcaseState(STORAGE_KEYS.categories, DEFAULT_CATEGORIES));
      setArticles(readShowcaseState(STORAGE_KEYS.articles, DEFAULT_ARTICLES));
      setVenues(readShowcaseState(STORAGE_KEYS.venues, DEFAULT_VENUES));
      setSettings(readShowcaseState(STORAGE_KEYS.settings, DEFAULT_SETTINGS));
    };

    if (supabase) {
      try {
        const [pSup, cSup, sSup, aSup, vSup] = await Promise.all([
          supabase.from('products').select('*'),
          supabase.from('categories').select('*'),
          supabase.from('settings').select('*'),
          supabase.from('articles').select('*'),
          supabase.from('venues').select('*')
        ]);

        if (pSup.error || cSup.error) {
          console.error("Supabase fetch error:", pSup.error || cSup.error);
          setDefaults();
        } else {
          // If all data is empty, it might be a new DB or connection issue that didn't error out
          if (!pSup.data?.length && !cSup.data?.length && !aSup.data?.length) {
            console.warn("Supabase returned empty data, using defaults.");
            setDefaults();
          } else {
            const productsWithCategory = (pSup.data || []).map((p: any) => ({
              ...p,
              category_name: cSup.data?.find((c: any) => c.id === p.category_id)?.name
            }));
            setProducts(productsWithCategory.length > 0 ? productsWithCategory : DEFAULT_PRODUCTS);
            setCategories(cSup.data && cSup.data.length > 0 ? cSup.data : DEFAULT_CATEGORIES);
            setArticles(aSup.data && aSup.data.length > 0 ? aSup.data : DEFAULT_ARTICLES);
            setVenues(vSup.data && vSup.data.length > 0 ? vSup.data : DEFAULT_VENUES);
            
            if (sSup.data && sSup.data.length > 0) {
              const settingsObj = sSup.data.reduce((acc: any, curr: any) => {
                acc[curr.key] = curr.value;
                return acc;
              }, {});
              setSettings(prev => ({ ...prev, ...settingsObj }));
            } else {
              setSettings(DEFAULT_SETTINGS);
            }
          }
        }
      } catch (e) {
        console.error('Supabase fetch exception:', e);
        setDefaults();
      }
    } else {
      console.warn("Supabase client not initialized, loading showcase data.");
      setShowcaseSnapshot();
    }
  };

  const handleLogin = async (username: string, password: string) => {
    if (supabase) {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();
      
      if (data && !error) {
        setToken('admin-token');
        localStorage.setItem('admin-token', 'admin-token');
        setIsLoginOpen(false);
      } else {
        alert('Invalid credentials');
      }
    } else {
      alert('Supabase is not connected');
    }
  };

  const handleAddToCart = (product: Product, qty: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + qty } : item);
      }
      return [...prev, { ...product, cartQuantity: qty }];
    });
    notify(`Added ${qty} ${product.name} to cart`);
  };

  const notify = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleBuyNow = (product: Product, qty: number) => {
    handleAddToCart(product, qty);
    setIsCartOpen(true);
  };

  const updateCartQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, cartQuantity: Math.max(1, item.cartQuantity + delta) } : item));
  };

  const removeCartItem = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    setIsUploading(true);
    try {
      if (supabase) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError, data } = await supabase.storage
          .from('images')
          .upload(filePath, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filePath);
          
          return publicUrl;
        } else {
          console.error('Supabase upload error:', uploadError);
          notify('Failed to upload image to Supabase');
          return '';
        }
      } else {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        notify('Image saved locally for showcase mode');
        return dataUrl;
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      return '';
    } finally {
      setIsUploading(false);
    }
  };

  const handleAdminUpdateProduct = async (p: Product) => {
    if (supabase) {
      const { category_name, id, ...cleanProduct } = p;
      const { error } = await supabase.from('products').update(cleanProduct).eq('id', p.id);
      if (error) {
        console.error('Supabase update error:', error);
        notify('Failed to update product');
      } else {
        fetchData();
        notify('Product updated successfully');
      }
    } else {
      const category_name = categories.find(category => category.id === p.category_id)?.name || p.category_name || 'Menu';
      setProducts(prev => prev.map(product => product.id === p.id ? { ...p, category_name } : product));
      notify('Product updated locally');
    }
  };

  const handleAdminAddProduct = async (p: Partial<Product>) => {
    if (supabase) {
      const { category_name, id, ...cleanProduct } = p;
      const { error } = await supabase.from('products').insert([cleanProduct]);
      if (error) {
        console.error('Supabase insert error:', error);
        notify('Failed to add product');
      } else {
        fetchData();
        notify('Product added successfully');
      }
    } else {
      const category_id = p.category_id ?? categories[0]?.id ?? DEFAULT_CATEGORIES[0].id;
      const category_name = categories.find(category => category.id === category_id)?.name || DEFAULT_CATEGORIES[0].name;
      setProducts(prev => [
        ...prev,
        {
          id: Date.now(),
          name: p.name || 'New Product',
          description: p.description || '',
          price: p.price || 0,
          quantity: p.quantity || 0,
          image_url: p.image_url || '',
          category_id,
          category_name
        }
      ]);
      notify('Product added locally');
    }
  };

  const handleAdminDeleteProduct = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Are you sure you want to delete this product?',
      onConfirm: async () => {
        if (supabase) {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) {
            console.error('Supabase delete error:', error);
            notify('Failed to delete product');
          } else {
            fetchData();
            notify('Product deleted successfully');
          }
        } else {
          setProducts(prev => prev.filter(product => product.id !== id));
          notify('Product removed locally');
        }
      }
    });
  };

  const handleAdminUpdateSettings = async (s: SiteSettings) => {
    if (supabase) {
      const settingsArray = Object.entries(s).map(([key, value]) => ({ key, value }));
      const { error } = await supabase.from('settings').upsert(settingsArray);
      if (error) {
        console.error('Supabase update settings error:', error);
        notify('Failed to update settings');
      } else {
        fetchData();
        notify('Settings updated successfully');
      }
    } else {
      setSettings(s);
      notify('Settings updated locally');
    }
  };

  const handleAdminAddArticle = async (a: Partial<Article>) => {
    if (supabase) {
      const { error } = await supabase.from('articles').insert([a]);
      if (error) {
        console.error('Supabase add article error:', error);
        notify('Failed to add article');
      } else {
        fetchData();
        notify('Article added successfully');
      }
    } else {
      setArticles(prev => [
        {
          id: Date.now(),
          title: a.title || 'New Story',
          content: a.content || '',
          image_url: a.image_url || '',
          created_at: new Date().toISOString()
        },
        ...prev
      ]);
      notify('Article added locally');
    }
  };

  const handleAdminUpdateArticle = async (a: Article) => {
    if (supabase) {
      const { error } = await supabase.from('articles').update(a).eq('id', a.id);
      if (error) {
        console.error('Supabase update article error:', error);
        notify('Failed to update article');
      } else {
        fetchData();
        notify('Article updated successfully');
      }
    } else {
      setArticles(prev => prev.map(article => article.id === a.id ? a : article));
      notify('Article updated locally');
    }
  };

  const handleAdminDeleteArticle = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Are you sure you want to delete this article?',
      onConfirm: async () => {
        if (supabase) {
          const { error } = await supabase.from('articles').delete().eq('id', id);
          if (error) {
            console.error('Supabase delete article error:', error);
            notify('Failed to delete article');
          } else {
            fetchData();
            notify('Article deleted successfully');
          }
        } else {
          setArticles(prev => prev.filter(article => article.id !== id));
          notify('Article removed locally');
        }
      }
    });
  };

  const handleAdminAddVenue = async (v: Partial<Venue>) => {
    if (supabase) {
      const { error } = await supabase.from('venues').insert([v]);
      if (error) {
        console.error('Supabase add venue error:', error);
        notify('Failed to add venue');
      } else {
        fetchData();
        notify('Venue added successfully');
      }
    } else {
      setVenues(prev => [
        ...prev,
        {
          id: Date.now(),
          address: v.address || 'New venue',
          hours: v.hours || '',
          map_url: v.map_url || '#'
        }
      ]);
      notify('Venue added locally');
    }
  };

  const handleAdminUpdateVenue = async (v: Venue) => {
    if (supabase) {
      const { error } = await supabase.from('venues').update(v).eq('id', v.id);
      if (error) {
        console.error('Supabase update venue error:', error);
        notify('Failed to update venue');
      } else {
        fetchData();
        notify('Venue updated successfully');
      }
    } else {
      setVenues(prev => prev.map(venue => venue.id === v.id ? v : venue));
      notify('Venue updated locally');
    }
  };

  const handleAdminDeleteVenue = async (id: number) => {
    setConfirmDialog({
      isOpen: true,
      message: 'Are you sure you want to delete this venue?',
      onConfirm: async () => {
        if (supabase) {
          const { error } = await supabase.from('venues').delete().eq('id', id);
          if (error) {
            console.error('Supabase delete venue error:', error);
            notify('Failed to delete venue');
          } else {
            fetchData();
            notify('Venue deleted successfully');
          }
        } else {
          setVenues(prev => prev.filter(venue => venue.id !== id));
          notify('Venue removed locally');
        }
      }
    });
  };

  const handleChangePassword = async (newPassword: string) => {
    if (supabase) {
      const { error } = await supabase
        .from('admins')
        .update({ password: newPassword })
        .eq('username', 'admin');
        
      if (error) {
        console.error('Supabase change password error:', error);
        notify('Failed to change password');
      } else {
        notify('Password updated successfully');
      }
    } else {
      notify('Showcase mode does not use a live admin password');
    }
  };

  const handleUpdateOrderStatus = async (id: number, status: string) => {
    if (supabase) {
      const { error } = await supabase.from('orders').update({ status }).eq('id', id);
      if (error) {
        console.error('Supabase update order status error:', error);
        notify('Failed to update order status');
      } else {
        fetchOrders();
        notify('Order status updated');
      }
    } else {
      setOrders(prev => prev.map(order => order.id === id ? { ...order, status: status as Order['status'] } : order));
      notify('Order status updated locally');
    }
  };

  const handlePlaceOrder = async (orderInput: Omit<Order, 'id' | 'status' | 'created_at'>) => {
    if (supabase) {
      const { error } = await supabase.from('orders').insert([orderInput]);

      if (error) {
        console.error('Checkout error:', error);
        return false;
      }

      return true;
    }

    const localOrder: Order = {
      id: Date.now(),
      status: 'pending',
      created_at: new Date().toISOString(),
      ...orderInput
    };

    setOrders(prev => [localOrder, ...prev]);
    return true;
  };

  const handleLogout = (navigate: any) => {
    setToken(null);
    localStorage.removeItem('admin-token');
    navigate('/');
  };

  return (
    <HelmetProvider>
      <Router>
        <Helmet>
          <title>{settings.title}</title>
          <meta name="description" content={settings.description} />
          <link rel="icon" href={settings.favicon} />
          <meta property="og:title" content={settings.title} />
          <meta property="og:description" content={settings.description} />
          <meta property="og:image" content={settings.og_image} />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
        </Helmet>
        
        <ConditionalNavbar 
          cartCount={cart.reduce((s, i) => s + i.cartQuantity, 0)} 
          onOpenCart={() => setIsCartOpen(true)} 
          onOpenLogin={() => setIsLoginOpen(true)}
          isAdmin={!!token}
          settings={settings}
        />
        
        <Routes>
          <Route path="/" element={<HomePage products={products} articles={articles} venues={venues} settings={settings} onProductClick={setSelectedProduct} isShowcaseMode={isShowcaseMode} />} />
          <Route path="/admin" element={
            isShowcaseMode ? (
              <AdminPage 
                products={products} 
                categories={categories} 
                settings={settings}
                articles={articles}
                orders={orders}
                venues={venues}
                onUpdateProduct={handleAdminUpdateProduct}
                onDeleteProduct={handleAdminDeleteProduct}
                onAddProduct={handleAdminAddProduct}
                onUpdateSettings={handleAdminUpdateSettings}
                onAddArticle={handleAdminAddArticle}
                onUpdateArticle={handleAdminUpdateArticle}
                onDeleteArticle={handleAdminDeleteArticle}
                onChangePassword={handleChangePassword}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onLogout={handleLogout}
                onAddVenue={handleAdminAddVenue}
                onUpdateVenue={handleAdminUpdateVenue}
                onDeleteVenue={handleAdminDeleteVenue}
                onUploadImage={handleImageUpload}
                isUploading={isUploading}
                isShowcaseMode={isShowcaseMode}
              />
            ) : token ? (
              <AdminPage 
                products={products} 
                categories={categories} 
                settings={settings}
                articles={articles}
                orders={orders}
                venues={venues}
                onUpdateProduct={handleAdminUpdateProduct}
                onDeleteProduct={handleAdminDeleteProduct}
                onAddProduct={handleAdminAddProduct}
                onUpdateSettings={handleAdminUpdateSettings}
                onAddArticle={handleAdminAddArticle}
                onUpdateArticle={handleAdminUpdateArticle}
                onDeleteArticle={handleAdminDeleteArticle}
                onChangePassword={handleChangePassword}
                onUpdateOrderStatus={handleUpdateOrderStatus}
                onLogout={handleLogout}
                onAddVenue={handleAdminAddVenue}
                onUpdateVenue={handleAdminUpdateVenue}
                onDeleteVenue={handleAdminDeleteVenue}
                onUploadImage={handleImageUpload}
                isUploading={isUploading}
                isShowcaseMode={isShowcaseMode}
              />
            ) : (
              <div className="pt-48 text-center">
                <h2 className="text-4xl font-display mb-8 uppercase">Please Login to Access Dashboard</h2>
                <button onClick={() => setIsLoginOpen(true)} className="px-12 py-4 bg-chefs-blue text-white font-bold uppercase tracking-widest brutal-btn">Login Now</button>
              </div>
            )
          } />
          <Route path="/checkout" element={<CheckoutPage cart={cart} onComplete={(nav) => { setCart([]); notify(isShowcaseMode ? 'Demo order saved locally' : 'Order Placed Successfully!'); nav('/'); }} onPlaceOrder={handlePlaceOrder} isShowcaseMode={isShowcaseMode} />} />
          <Route path="/article/:id" element={<ArticlePage articles={articles} />} />
        </Routes>

        <ProductModal 
          product={selectedProduct} 
          isOpen={!!selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />
        
        <CartDrawer 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
          cart={cart}
          updateQty={updateCartQty}
          removeItem={removeCartItem}
          onCheckout={(nav) => { setIsCartOpen(false); nav('/checkout'); }}
        />

        <AdminLogin 
          isOpen={isLoginOpen} 
          onClose={() => setIsLoginOpen(false)} 
          onLogin={handleLogin} 
        />

        <ConfirmModal 
          isOpen={confirmDialog.isOpen} 
          message={confirmDialog.message} 
          onConfirm={confirmDialog.onConfirm} 
          onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })} 
        />

        {/* Toast Notification */}
        <AnimatePresence>
          {showToast && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] bg-chefs-blue text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest shadow-2xl brutal-border border-2"
            >
              {toastMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </Router>
    </HelmetProvider>
  );
}
