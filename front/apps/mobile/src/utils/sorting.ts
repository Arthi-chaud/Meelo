import type { Order } from "@/models/sorting";

// Typing for route query parameters for sorting
export type Sorting<T extends string> = { sort?: T; order?: Order };
