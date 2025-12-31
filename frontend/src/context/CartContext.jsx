import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const CartContext = createContext();

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  // Cargar carrito del localStorage al iniciar
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCartItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => 
        (item.id_producto ?? item.id ?? item._id) === (product.id_producto ?? product.id ?? product._id)
      );

      if (existingItem) {
        // Producto ya existe, incrementar cantidad
        toast.success('Cantidad actualizada', {
          description: `${product.nombre_producto || product.title || 'Producto'} ahora tiene ${existingItem.quantity + 1} unidades`,
          icon: '🛒',
        });
        
        return prevItems.map(item =>
          (item.id_producto ?? item.id ?? item._id) === (product.id_producto ?? product.id ?? product._id)
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        // Producto nuevo
        toast.success('Producto agregado al carrito', {
          description: `${product.nombre_producto || product.title || 'Producto'} agregado exitosamente`,
          icon: '✅',
        });
        
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => {
      const removedItem = prevItems.find(item => 
        (item.id_producto ?? item.id ?? item._id) === productId
      );
      
      if (removedItem) {
        toast.error('Producto eliminado', {
          description: `${removedItem.nombre_producto || removedItem.title || 'Producto'} eliminado del carrito`,
          icon: '🗑️',
        });
      }
      
      return prevItems.filter(item => 
        (item.id_producto ?? item.id ?? item._id) !== productId
      );
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        (item.id_producto ?? item.id ?? item._id) === productId
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = item.precio_venta || 0;
      return total + (price * item.quantity);
    }, 0);
  };

  const clearCart = () => {
    if (cartItems.length > 0) {
      toast.info('Carrito vaciado', {
        description: 'Todos los productos fueron eliminados del carrito',
        icon: '🧹',
      });
    }
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      getTotalItems,
      getTotalPrice,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}