export type Category = "men" | "women" | "kids" | "school" | "custom";

export type Product = {
  id: string;
  name: string;
  category: Category;
  brand?: string;
  price: number;
  salePrice?: number;
  sizes: string[];
  images: string[];
  description?: string;
  createdAt: string;
};
