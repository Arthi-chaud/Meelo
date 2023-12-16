/**
 * Order to sort items
 */
export const availableSortingOrders = ["asc", "desc"] as const;
type SortingOrder = typeof availableSortingOrders[number];
export default SortingOrder;
