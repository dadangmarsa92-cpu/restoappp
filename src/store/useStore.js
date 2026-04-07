import { create } from 'zustand';

export const useStore = create((set) => ({
  tableNumber: null,
  tableId: null,
  userInfo: { name: '', phone: '' },
  cart: [],
  setTableNumber: (num) => set({ tableNumber: num }),
  setTableId: (id) => set({ tableId: id }),
  setUserInfo: (info) => set((state) => ({ userInfo: { ...state.userInfo, ...info } })),
  addToCart: (item) => set((state) => {
    const existing = state.cart.find(i => i.id === item.id);
    if (existing) {
      return { 
        cart: state.cart.map(i => 
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ) 
      };
    }
    return { cart: [...state.cart, { ...item, quantity: 1 }] };
  }),
  updateQuantity: (id, delta) => set((state) => ({
    cart: state.cart.map(item => 
      item.id === id ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    ).filter(item => item.quantity > 0)
  })),
  removeFromCart: (id) => set((state) => ({
    cart: state.cart.filter(item => item.id !== id)
  })),
  clearCart: () => set({ cart: [] }),
  resetOrder: () => set({ tableNumber: null, userInfo: { name: '', phone: '' }, cart: [] })
}));
