/**
 * Seed demo homepage banners and a published blog post when collections are empty.
 *
 * Usage:
 *   npm run seed:demo
 *   npm run seed:demo -- --force   # add samples even if content already exists
 */
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const FORCE = process.argv.includes("--force");

const HERO_IMAGE =
  "/images/m/products/image/d55a7ca800bRKFzzzI1LkoPdgD1ymbxu18tLjQgI.png?width=1600&height=700&fit=cover&format=webp&quality=85";
const STUDIO_IMAGE =
  "/images/m/products/image/2cdf4bf761DZWztWMTXvRjefZynBO9RTcVrcDe0F.jpg?width=1600&height=700&fit=cover&format=webp&quality=85";
const DRUMS_IMAGE =
  "/images/m/promotions/2026/0603-Drum-Month/homepage/superhero/0603-DrumMonth-Superhero-Images-1.jpg?width=1600&height=700&fit=cover&format=webp&quality=85";

const BLOG_COVER =
  "/images/m/products/image/2cdf4bf761DZWztWMTXvRjefZynBO9RTcVrcDe0F.jpg?width=1200&height=630&fit=cover&format=webp&quality=85";

const BLOG_CONTENT = JSON.stringify({
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2 },
      content: [{ type: "text", text: "Start with the essentials" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "A great home studio does not need dozens of boxes on day one. Focus on a reliable interface, one versatile microphone, and monitoring you can trust.",
        },
      ],
    },
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: "Our top three priorities" }],
    },
    {
      type: "orderedList",
      content: [
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Audio interface with low-latency drivers" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Studio headphones or nearfield monitors" }],
            },
          ],
        },
        {
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "DAW and one go-to recording mic" }],
            },
          ],
        },
      ],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Browse our studio collection or chat with a gear advisor before you buy — we are happy to help you build a rig that fits your room and budget.",
        },
      ],
    },
  ],
});

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0]!;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin env vars. Copy .env.example to .env.local.");
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

function now(): string {
  return new Date().toISOString();
}

async function seedBanners(db: Firestore): Promise<number> {
  const existing = await db.collection("banners").limit(1).get();
  if (!existing.empty && !FORCE) {
    console.log("Banners already exist — skipping (use --force to add demo banners anyway).");
    return 0;
  }

  const timestamp = now();
  const banners = [
    {
      title: "Pro gear, delivered across India",
      subtitle: "Guitars, studio, live sound & more",
      image: HERO_IMAGE,
      ctaText: "Shop all gear",
      ctaLink: "/search",
      startDate: null,
      endDate: null,
      priority: 0,
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      title: "Build your home studio",
      subtitle: "Interfaces, mics & monitors",
      image: STUDIO_IMAGE,
      ctaText: "Explore studio",
      ctaLink: "/category/studio-recording",
      startDate: null,
      endDate: null,
      priority: 1,
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    {
      title: "Hot deals this week",
      subtitle: "Limited-time offers on top brands",
      image: DRUMS_IMAGE,
      ctaText: "View deals",
      ctaLink: "/search/results?q=deals",
      startDate: null,
      endDate: null,
      priority: 2,
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];

  const batch = db.batch();
  for (const banner of banners) {
    const ref = db.collection("banners").doc();
    batch.set(ref, { ...banner, id: ref.id });
  }
  await batch.commit();
  console.log(`Created ${banners.length} demo banner(s).`);
  return banners.length;
}

async function seedBlogPosts(db: Firestore): Promise<number> {
  const published = await db
    .collection("blog_posts")
    .where("status", "==", "published")
    .limit(1)
    .get();

  if (!published.empty && !FORCE) {
    console.log("Published blog posts already exist — skipping.");
    return 0;
  }

  const slug = "home-studio-essentials-2026";
  const duplicate = await db
    .collection("blog_posts")
    .where("slug", "==", slug)
    .limit(1)
    .get();

  if (!duplicate.empty && !FORCE) {
    console.log(`Blog post "${slug}" already exists — skipping.`);
    return 0;
  }

  const timestamp = now();
  const ref = db.collection("blog_posts").doc();
  const post = {
    id: ref.id,
    slug,
    title: "Home Studio Essentials for 2026",
    excerpt:
      "The three pieces of gear that matter most when you are setting up your first recording space.",
    content: BLOG_CONTENT,
    contentFormat: "tiptap_json",
    coverImage: BLOG_COVER,
    tags: ["studio", "buying-guide", "beginner"],
    seoTitle: "Home Studio Essentials | Vibe Music Blog",
    seoDescription:
      "Start your home studio with the right interface, microphone, and monitoring — a practical buying guide from Vibe Music.",
    status: "published",
    authorId: "seed-demo",
    authorName: "Vibe Music Team",
    publishedAt: timestamp,
    scheduledAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await ref.set(post);
  console.log(`Created demo blog post: /blog/${slug}`);
  return 1;
}

async function main() {
  const db = getFirestore(getAdminApp());
  const bannerCount = await seedBanners(db);
  const blogCount = await seedBlogPosts(db);

  if (bannerCount === 0 && blogCount === 0) {
    console.log("Nothing to seed.");
  } else {
    console.log("Done. Refresh the homepage and /blog to see demo content.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
