import React, { useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { RfqModal } from './components/RfqModal';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { BuyerHubPage } from './pages/BuyerHubPage';
import { CartCheckoutPage } from './pages/CartCheckoutPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { SellerDashboardPage } from './pages/SellerDashboardPage';
import { SupplierStorefrontPage } from './pages/SupplierStorefrontPage';
import { CategorySlug, Product } from './types';

function AppShell() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'products' | 'suppliers'>('products');
  const [activeCategory, setActiveCategory] = useState<CategorySlug | ''>('');

  const [rfqOpen, setRfqOpen] = useState(false);
  const [rfqProduct, setRfqProduct] = useState<Product | null>(null);

  const openRfqModal = (product?: Product | null) => {
    setRfqProduct(product || null);
    setRfqOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header
        searchQuery={searchQuery}
        searchType={searchType}
        activeCategory={activeCategory}
        onSearchSubmit={(q, type) => {
          setSearchQuery(q);
          setSearchType(type);
        }}
        onCategorySelect={(cat) => setActiveCategory(cat)}
        onOpenRfq={() => openRfqModal(null)}
      />

      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                searchQuery={searchQuery}
                searchType={searchType}
                activeCategory={activeCategory}
                onCategorySelect={(cat) => setActiveCategory(cat)}
                onRequestQuote={openRfqModal}
              />
            }
          />
          <Route
            path="/products/:id"
            element={<ProductDetailPage onRequestQuote={(p) => openRfqModal(p)} />}
          />
          <Route
            path="/suppliers/:id"
            element={<SupplierStorefrontPage onRequestQuote={(p) => openRfqModal(p)} />}
          />
          <Route path="/cart" element={<CartCheckoutPage />} />
          <Route
            path="/account"
            element={<BuyerHubPage onRequestQuote={(p) => openRfqModal(p)} />}
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/seller" element={<SellerDashboardPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
        </Routes>
      </main>

      <Footer />

      <RfqModal
        isOpen={rfqOpen}
        product={rfqProduct}
        onClose={() => setRfqOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppShell />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
