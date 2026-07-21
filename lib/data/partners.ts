export type Partner = {
  id: string;
  name: string;
  initials: string;
  category: string;
  region: "Singapore" | "Online";
  offer: string;
  description: string;
  address: string;
  distance: string;
  terms: string;
  imageUrl?: string;
  logoUrl?: string;
};
