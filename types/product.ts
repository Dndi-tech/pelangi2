export type Product = {
  id: number;
  name: string;
  category: "male" | "female" | "uniform";
  brand?: string;
  price: number;
  sizes: string[];
  badge?: "new" | "sale" | "popular";
  image?: string;
};
