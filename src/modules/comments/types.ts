export type Comment = {
    id?: string;
    userId?: string;
    productId?: string;
    content: string;
    status?: "pending" | "approved" | "rejected";
    rating: number;
}
