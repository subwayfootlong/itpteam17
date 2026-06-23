import type { DiscussionGroup, DiscussionThread } from "@/lib/communityTypes";

export const fallbackGroups: DiscussionGroup[] = [
  {
    id: "general",
    title: "General Community",
    posts: 124,
    icon: "message",
    tone: "green",
  },
  {
    id: "spiritual",
    title: "Spiritual Reflections",
    posts: 86,
    icon: "spark",
    tone: "gold",
  },
];

export const fallbackThreads: DiscussionThread[] = [
  {
    id: "1",
    groupId: "general",
    author: "Brother Ahmad",
    postedAt: "2h ago",
    title: "Thoughts on the upcoming Majlis Ilmu?",
    body:
      "I am really looking forward to the community gathering next Saturday. The topic of sustainable living within our faith tradition feels timely.",
    votes: 142,
    status: "approved",
    comments: [
      {
        id: "101",
        author: "Sister Sarah",
        role: "Active Member",
        body: "The topic looks useful. I hope the recording is shared after the session.",
        postedAt: "1h ago",
        status: "approved",
      },
      {
        id: "102",
        author: "Ustaz Ridzuan",
        role: "Moderator",
        body: "We will update the thread once the programme team confirms post-event resources.",
        postedAt: "35m ago",
        status: "approved",
      },
    ],
  },
  {
    id: "2",
    groupId: "general",
    author: "Sister Sarah",
    postedAt: "5h ago",
    title: "Beautiful morning at the community center",
    body:
      "The new garden layout has made the center a peaceful spot for reflection before class.",
    votes: 89,
    hasImage: true,
    status: "approved",
    comments: [
      {
        id: "201",
        author: "Ahmad Khalid",
        role: "Active Member",
        body: "It looks welcoming. Thank you for sharing this.",
        postedAt: "3h ago",
        status: "approved",
      },
    ],
  },
  {
    id: "3",
    groupId: "general",
    author: "Ustaz Ridzuan",
    postedAt: "1d ago",
    title: "New Membership Portal Feedback",
    body:
      "We have just launched the new digital membership features. Please share your experience so the team can keep improving the portal.",
    votes: 305,
    status: "approved",
    comments: [
      {
        id: "301",
        author: "Nur Aisyah",
        role: "Associate Member",
        body: "The digital card is easy to find. The benefits page is also clearer now.",
        postedAt: "20h ago",
        status: "approved",
      },
    ],
  },
  {
    id: "4",
    groupId: "spiritual",
    author: "Sister Mariam",
    postedAt: "4h ago",
    title: "A short reflection after class",
    body:
      "Today reminded me how small consistent acts can make community learning more meaningful.",
    votes: 76,
    status: "approved",
    comments: [],
  },
];
