export type Product = {
    id?: string;
    slug?: string;
    title: string;
    images: string[];
    rating: string;
    price: string;
    size: string;
    attributes?: {key: string; value: string}[];

}
