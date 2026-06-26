export type PartnerCategory = "Books & Learning" | "Lifestyle";

export type SingaporeRegion = "Central" | "East" | "North" | "West";

export type Partner = {
  id: string;
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
  imageUrl?: string;
  logoUrl?: string;
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
    id: "1",
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
    id: "2",
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
  {
    id: "3",
    name: "Barakah Bites Cafe",
    initials: "BB",
    category: "Lifestyle",
    region: "East",
    offer: "15% off dine-in meals",
    description:
      "A halal family cafe serving local favourites, weekend brunch and community-friendly dining options.",
    address: "201 Joo Chiat Road, Singapore 427472",
    distance: "East Singapore",
    terms:
      "Valid for dine-in orders from Monday to Thursday. Present an active Pergas membership before payment. Not valid with other promotions or set meals.",
    website: "https://example.com/barakah-bites",
    mapPosition: { x: 72, y: 55 },
  },
  {
    id: "4",
    name: "IlmWorks Learning Studio",
    initials: "IW",
    category: "Books & Learning",
    region: "Central",
    offer: "Free trial class for members",
    description:
      "An enrichment studio offering Arabic literacy, study skills and values-based workshops for families.",
    address: "420 North Bridge Road, Singapore 188727",
    distance: "Central Singapore",
    terms:
      "One free trial class per member household. Booking is required and subject to class availability.",
    website: "https://example.com/ilmworks",
    featured: true,
    mapPosition: { x: 51, y: 45 },
  },
  {
    id: "5",
    name: "Sakinah Wellness",
    initials: "SW",
    category: "Lifestyle",
    region: "North",
    offer: "12% off wellness packages",
    description:
      "A wellness provider offering massage therapy, guided relaxation sessions and family wellness packages.",
    address: "930 Yishun Avenue 2, Singapore 769098",
    distance: "North Singapore",
    terms:
      "Valid for selected wellness packages. Members must book in advance and present their digital membership card at reception.",
    website: "https://example.com/sakinah-wellness",
    mapPosition: { x: 47, y: 24 },
  },
  {
    id: "6",
    name: "Nusa Reads",
    initials: "NR",
    category: "Books & Learning",
    region: "West",
    offer: "Buy 2 get 1 selected children titles",
    description:
      "A neighbourhood bookstore with children titles, Islamic learning resources and stationery.",
    address: "21 Jurong East Central 1, Singapore 609732",
    distance: "West Singapore",
    terms:
      "The lowest-priced eligible title is complimentary. Valid for selected children titles while stocks last.",
    website: "https://example.com/nusa-reads",
    mapPosition: { x: 26, y: 54 },
  },
  {
    id: "7",
    name: "Amanah Family Pharmacy",
    initials: "AF",
    category: "Lifestyle",
    region: "East",
    offer: "8% off health essentials",
    description:
      "A community pharmacy carrying health supplements, first-aid essentials and family care products.",
    address: "10 Tampines Central 1, Singapore 529536",
    distance: "East Singapore",
    terms:
      "Valid for regular-priced health essentials. Prescription medication and controlled items are excluded.",
    website: "https://example.com/amanah-pharmacy",
    mapPosition: { x: 82, y: 47 },
  },
];
