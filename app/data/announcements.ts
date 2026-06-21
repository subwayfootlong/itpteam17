export type AnnouncementCategory =
  | "Official"
  | "Events"
  | "Membership"
  | "Community";

export type CommentStatus = "approved" | "pending" | "flagged";

export type CommunityComment = {
  id: string;
  author: string;
  role: string;
  body: string;
  postedAt: string;
  status: CommentStatus;
  isOwn?: boolean;
};

export type Announcement = {
  id: string;
  title: string;
  category: AnnouncementCategory;
  date: string;
  readTime: string;
  summary: string;
  body: string;
  imageUrl?: string;
  pinned?: boolean;
  commentsEnabled: boolean;
  comments: CommunityComment[];
};

export const announcements: Announcement[] = [
  {
    id: "1",
    title: "Membership renewal reminder for active members",
    category: "Membership",
    date: "18 Jun 2026",
    readTime: "2 min read",
    pinned: true,
    summary:
      "Members are encouraged to check their renewal status before upcoming programmes and benefit redemptions.",
    body:
      "Please review your membership status and renewal date in your profile before registering for members-only programmes or redeeming Friends of Pergas benefits. This helps ensure that your digital card remains valid for verification.",
    commentsEnabled: true,
    comments: [
      {
        id: "101",
        author: "Nur Aisyah",
        role: "Associate Member",
        body: "Thank you for the reminder. It would help if renewal alerts also appear on the dashboard.",
        postedAt: "Today, 10:12 AM",
        status: "approved",
      },
      {
        id: "102",
        author: "Ahmad Khalid",
        role: "Ordinary Member",
        body: "Clear and useful. I checked mine through the profile page.",
        postedAt: "Today, 11:05 AM",
        status: "approved",
      },
    ],
  },
  {
    id: "2",
    title: "Registration opens for community learning circle",
    category: "Events",
    date: "17 Jun 2026",
    readTime: "3 min read",
    summary:
      "A new learning circle is open for registration with limited seats for active members.",
    body:
      "Pergas members may register for the upcoming community learning circle through the events page. Priority access will be given to active members during the first registration window.",
    commentsEnabled: true,
    comments: [
      {
        id: "201",
        author: "Siti Mariam",
        role: "Student Member",
        body: "Will this session be recorded for those who cannot attend in person?",
        postedAt: "Yesterday, 4:40 PM",
        status: "approved",
      },
    ],
  },
  {
    id: "3",
    title: "Community guidelines for respectful discussion",
    category: "Community",
    date: "15 Jun 2026",
    readTime: "4 min read",
    pinned: true,
    summary:
      "A reminder that all discussion threads are moderated to keep exchanges respectful, relevant and beneficial.",
    body:
      "Members are welcome to ask questions, share reflections and respond to announcements. Comments should remain respectful, relevant to the thread and aligned with Pergas' professional tone. Comments may be held for moderator review before publication.",
    commentsEnabled: true,
    comments: [
      {
        id: "301",
        author: "Faris Hamdan",
        role: "Ordinary Member",
        body: "Appreciate having a clear standard for discussions. This makes the space more useful.",
        postedAt: "15 Jun, 8:30 PM",
        status: "approved",
      },
    ],
  },
  {
    id: "4",
    title: "Quarterly Ar-Risalah magazine delivery update",
    category: "Official",
    date: "12 Jun 2026",
    readTime: "2 min read",
    summary:
      "The latest quarterly Ar-Risalah magazine delivery schedule has been prepared for eligible members.",
    body:
      "Eligible members can expect the quarterly Ar-Risalah magazine delivery according to the updated delivery schedule. Please ensure your contact and mailing details remain current in your profile.",
    commentsEnabled: false,
    comments: [],
  },
];
