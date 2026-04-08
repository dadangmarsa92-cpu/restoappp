import { create } from 'zustand';

export const useStore = create((set) => ({
  tableNumber: null,
  tableId: null,
  userInfo: { name: '', phone: '' },
  cart: [],
  setTableNumber: (num) => set({ tableNumber: num }),
  setTableId: (id) => set({ tableId: id }),
  setUserInfo: (info) => set((state) => ({ userInfo: { ...state.userInfo, ...info } })),
  addToCart: (item, selectedAddOns = []) => set((state) => {
    // Unique ID for cart item based on product ID and selected add-ons
    const cartId = item.id + JSON.stringify(selectedAddOns);
    const existing = state.cart.find(i => i.cartId === cartId);
    
    if (existing) {
      return { 
        cart: state.cart.map(i => 
          i.cartId === cartId ? { ...i, quantity: i.quantity + (item.quantity || 1) } : i
        ) 
      };
    }
    
    return { 
      cart: [...state.cart, { 
        ...item, 
        cartId, 
        selectedAddOns, 
        quantity: item.quantity || 1 
      }] 
    };
  }),
  updateQuantity: (cartId, delta) => set((state) => ({
    cart: state.cart.map(item => 
      item.cartId === cartId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    ).filter(item => item.quantity > 0)
  })),
  removeFromCart: (cartId) => set((state) => ({
    cart: state.cart.filter(item => item.cartId !== cartId)
  })),
  clearCart: () => set({ cart: [] }),
  resetOrder: () => set({ tableNumber: null, userInfo: { name: '', phone: '' }, cart: [] })
}));
