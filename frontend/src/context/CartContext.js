import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getCart } from "../api";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { isLoggedIn } = useAuth();
  const [cart, setCart] = useState({ items: [], subtotal: 0, itemCount: 0 });
  const [cartLoading, setCartLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) { setCart({ items: [], subtotal: 0, itemCount: 0 }); return; }
    setCartLoading(true);
    try {
      const { data } = await getCart();
      setCart(data.data.cart || { items: [], subtotal: 0, itemCount: 0 });
    } catch { /* silent */ }
    finally { setCartLoading(false); }
  }, [isLoggedIn]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  return (
    <CartContext.Provider value={{ cart, cartLoading, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
