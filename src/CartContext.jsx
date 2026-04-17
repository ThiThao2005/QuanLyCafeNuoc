import React, { createContext, useState, useContext } from 'react';

const CartContext = createContext();

const getItemKey = (item) => {
  const toppingIds = (item.options?.toppings || []).map((tp) => tp.id).sort().join(',');
  return [
    item.productId,
    item.options?.size || '',
    item.options?.ice || '',
    item.options?.sugar || '',
    toppingIds,
    item.note || '',
  ].join('|');
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = (payload) => {
    setCartItems((prev) => {
      const payloadKey = getItemKey(payload);
      const existedIndex = prev.findIndex((item) => getItemKey(item) === payloadKey);

      if (existedIndex === -1) return [...prev, payload];

      const next = [...prev];
      const mergedQuantity = next[existedIndex].quantity + payload.quantity;
      next[existedIndex] = {
        ...next[existedIndex],
        quantity: mergedQuantity,
        pricing: {
          ...next[existedIndex].pricing,
          totalPrice: next[existedIndex].pricing.unitPrice * mergedQuantity,
        },
      };
      return next;
    });
  };

  const updateItemQuantity = (itemKey, delta) => {
    setCartItems((prev) => {
      const next = prev
        .map((item) => {
          if (getItemKey(item) !== itemKey) return item;

          const quantity = Math.max(1, item.quantity + delta);
          return {
            ...item,
            quantity,
            pricing: {
              ...item.pricing,
              totalPrice: item.pricing.unitPrice * quantity,
            },
          };
        });

      return next;
    });
  };

  const removeFromCart = (itemKey) => {
    setCartItems((prev) => prev.filter((item) => getItemKey(item) !== itemKey));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.pricing.totalPrice, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateItemQuantity,
        removeFromCart,
        clearCart,
        cartCount,
        cartTotal,
        getItemKey,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);