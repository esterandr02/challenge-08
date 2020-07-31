import React, {
    createContext,
    useState,
    useCallback,
    useContext,
    useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
    id: string;
    title: string;
    image_url: string;
    price: number;
    quantity: number;
}

interface CartContext {
    products: Product[];
    addToCart(item: Omit<Product, 'quantity'>): void;
    increment(id: string): void;
    decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
    const [products, setProducts] = useState<Product[]>([]);

    useEffect(() => {
        async function loadProducts(): Promise<void> {
            const items = await AsyncStorage.getItem(
                '@GoMarketplace:cart-items',
            );

            if (items) {
                setProducts(JSON.parse(items));
            }
        }
        loadProducts();
    }, []);

    const addToCart = useCallback(
        async (newItem: Product) => {
            const existingProductIndex = products.findIndex(
                item => item.id === newItem.id,
            );

            if (existingProductIndex !== -1) {
                products[existingProductIndex].quantity += 1;
            } else {
                const updatedItem = { ...newItem, quantity: 1 };

                products.push(updatedItem);
            }

            setProducts(products);

            await AsyncStorage.setItem(
                '@GoMarketplace:cart-items',
                JSON.stringify(products),
            );
        },
        [products],
    );

    const increment = useCallback(async (id: string) => {
        const items = await AsyncStorage.getItem('@GoMarketplace:cart-items');

        if (items) {
            let parsedItems = [] as Product[];
            parsedItems = JSON.parse(items);

            const index = parsedItems.findIndex(item => item.id === id);

            if (index !== -1) {
                parsedItems[index].quantity += 1;
            }

            await AsyncStorage.setItem(
                '@GoMarketplace:cart-items',
                JSON.stringify(parsedItems),
            );
        }
    }, []);

    const decrement = useCallback(async (id: string) => {
        const items = await AsyncStorage.getItem('@GoMarketplace:cart-items');

        if (items) {
            let parsedItems = [] as Product[];
            parsedItems = JSON.parse(items);

            const index = parsedItems.findIndex(item => item.id === id);

            parsedItems[index].quantity -= 1;

            if (parsedItems[index].quantity === 0) {
                parsedItems.splice(index, 1);
            }

            await AsyncStorage.setItem(
                '@GoMarketplace:cart-items',
                JSON.stringify(parsedItems),
            );
        }
    }, []);

    const value = React.useMemo(
        () => ({ addToCart, increment, decrement, products }),
        [products, addToCart, increment, decrement],
    );

    return (
        <CartContext.Provider value={value}>{children}</CartContext.Provider>
    );
};

function useCart(): CartContext {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error(`useCart must be used within a CartProvider`);
    }

    return context;
}

export { CartProvider, useCart };