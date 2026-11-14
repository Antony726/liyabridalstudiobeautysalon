export const money = (value, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(value || 0));

export const imageUrl = (path) => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const base = import.meta.env.VITE_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/product-images/${path}` : "";
};
