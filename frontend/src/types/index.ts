// ─── Mediantem — TypeScript Interfaces ─────────────────────

export interface Category {
    id: number;
    name: string;
    slug: string;
}

export interface ProductImage {
    id: number;
    productId: number;
    url: string;
    position: number;
}

export interface ProductVariant {
    id: number;
    productId: number;
    color: string;
    colorHex: string;
    size: string;
    stock: number;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    price: number;
    originalPrice: number | null;
    categoryId: number;
    isLimited: boolean;
    createdAt: string;
    images: string[];
    variants: ProductVariant[];
    rating: number;
    reviewCount: number;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: 'customer' | 'admin';
    createdAt: string;
}

export interface CartItem {
    productId: number;
    variantId: number;
    name: string;
    image: string;
    color: string;
    size: string;
    price: number;
    quantity: number;
}

export interface Order {
    id: number;
    userId: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    subtotal: number;
    shippingCost: number;
    total: number;
    shippingName: string;
    shippingAddress: string;
    shippingCity: string;
    shippingPhone: string;
    createdAt: string;
    items: OrderItem[];
}

export interface OrderItem {
    id: number;
    orderId: number;
    productId: number;
    variantId: number;
    productName: string;
    price: number;
    quantity: number;
}

export interface Review {
    id: number;
    userId: number;
    productId: number;
    rating: number;
    title: string;
    body: string;
    createdAt: string;
    userName?: string;
}

export interface ReviewSummary {
    average: number;
    total: number;
    distribution: Record<number, number>; // { 5: 200, 4: 150, ... }
}

export interface ForumPost {
    id: number;
    userId: number;
    title: string | null;
    body: string;
    parentId: number | null;
    createdAt: string;
    userName?: string;
    replyCount?: number;
    replies?: ForumPost[];
}

export interface AuthState {
    user: User | null;
    accessToken: string | null;
}

export interface ApiResponse<T> {
    ok: boolean;
    data?: T;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}
