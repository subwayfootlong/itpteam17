export type PartnerCategory = "Books & Learning" | "Lifestyle";

export type SingaporeRegion = "Central" | "East";

export type Partner = {
  id: number;
  name: string;
  initials: string;
  category: PartnerCategory;
  region: SingaporeRegion | "Online";
  offer: string;
  description: string;
  address: string;
  distance: string;
  terms: string;
  website: string;
  featured?: boolean;
  mapPosition?: { x: number; y: number };
};

export type MembershipBenefit = {
  title: string;
  description: string;
  ordinaryOnly?: boolean;
};

export const membershipBenefits: MembershipBenefit[] = [
  {
    title: "Reference library access",
    description: "Access more than 2,000 books at the Syed Ahmad Semait Reference Library.",
  },
  {
    title: "10% off programme fees",
    description: "Receive a member discount on eligible Pergas programmes.",
  },
  {
    title: "15% off book purchases",
    description: "Save on eligible publications and book purchases from Pergas.",
  },
  {
    title: "VIP early registration",
    description: "Register earlier for selected Pergas programmes and national events.",
  },
  {
    title: "Members-only programmes",
    description: "Gain exclusive access to programmes reserved for active members.",
  },
  {
    title: "Scholarship priority",
    description: "Receive priority registration for the Pergas Postgraduate Scholarship.",
  },
  {
    title: "Friends of Pergas benefits",
    description: "Enjoy exclusive offers from participating merchants and establishments.",
  },
  {
    title: "Board nominations",
    description: "Eligible Ordinary Members may stand for nomination to the board.",
    ordinaryOnly: true,
  },
  {
    title: "Voting rights",
    description: "Eligible Ordinary Members may vote in accordance with Pergas rules.",
    ordinaryOnly: true,
  },
];

export const partners: Partner[] = [
  {
    id: 1,
    name: "Muslimedia Distributors",
    initials: "MD",
    category: "Books & Learning",
    region: "Online",
    offer: "Up to 20% off selected titles",
    description:
      "An Islamic bookseller offering religious, educational and reference titles.",
    address: "Available through the Muslimedia online store",
    distance: "Online benefit",
    terms:
      "Receive 20% off Indonesian and Malaysian titles, including all types of Quran, and 10% off titles published in Singapore. Present or verify an active Pergas membership when redeeming.",
    website: "https://muslimediabooks.com",
    featured: true,
  },
  {
    id: 2,
    name: "Swing Suroor Store",
    initials: "SS",
    category: "Lifestyle",
    region: "Central",
    offer: "10% off regular items",
    description:
      "A Muslim lifestyle store offering faith-inspired gifts, books and everyday products.",
    address: "52 Bussorah Street, Singapore 199468",
    distance: "Central Singapore",
    terms:
      "Receive 10% off regular-priced items and a 20% birthday discount on regular-priced items. Present an active Pergas membership when redeeming. Merchant terms and exclusions may apply.",
    website: "https://swingstore.com.sg",
    featured: true,
    mapPosition: { x: 55, y: 52 },
  },
];
