export interface product {
    id?: string;
    slug?: string;
    title: string;
    images: string[];
    rating: string;
    price: string;
    size: string;
    attributes?: { key: string; value: string }[];
    category?: string;
    categoryId?: string
    comments: any[];
    similarProducts: product[];
}
