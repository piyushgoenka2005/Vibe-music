/**
 * Seed production blog articles.
 * Usage: npx tsx --env-file=.env.local scripts/catalog/seed-blog.mts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function doc(...blocks: Array<Record<string, unknown>>) {
  return JSON.stringify({ type: "doc", content: blocks });
}

function paragraph(text: string) {
  return {
    type: "paragraph",
    content: [{ type: "text", text }],
  };
}

function heading(text: string, level = 2) {
  return {
    type: "heading",
    attrs: { level },
    content: [{ type: "text", text }],
  };
}

const AUTHOR = {
  authorId: "seed-vibe-team",
  authorName: "Vibe Music Team",
  authorBio:
    "Product specialists and working musicians helping India choose the right gear with honest buying guides.",
  authorAvatar: "",
};

async function main() {
  const now = new Date();
  const publishedAt = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const ts = now.toISOString();

  const posts = [
    {
      id: "blog-home-studio-2026",
      slug: "home-studio-essentials-2026",
      title: "Home Studio Essentials for 2026",
      excerpt:
        "The three pieces of gear that matter most when you are setting up your first recording space.",
      categorySlug: "studio",
      categoryLabel: "Studio",
      featured: true,
      tags: ["Studio", "Buying guide", "Recording"],
      coverImage: "/images/m/home/cats/LPR59VOWCSNH.png",
      seoTitle: "Home Studio Essentials for 2026 | Vibe Music",
      seoDescription:
        "Build a reliable home studio with an audio interface, monitoring headphones, and a versatile microphone.",
      content: doc(
        heading("Start with an interface you will not outgrow"),
        paragraph(
          "A 2-in/2-out USB interface with clean preamps and stable drivers saves hours of troubleshooting. Look for direct monitoring and enough headroom for condenser mics."
        ),
        heading("Choose one microphone that covers vocals and instruments"),
        paragraph(
          "A large-diaphragm condenser handles vocals, acoustic guitar, and podcast use. Pair it with a basic reflection filter if your room is reflective."
        ),
        heading("Invest in headphones before studio monitors"),
        paragraph(
          "Closed-back headphones give you an honest baseline in untreated rooms. Add monitors later when you can treat the space."
        )
      ),
    },
    {
      id: "blog-first-electric-guitar",
      slug: "first-electric-guitar",
      title: "How to choose your first electric guitar",
      excerpt:
        "Body styles, pickups, and price tiers explained — so your first axe feels right from day one.",
      categorySlug: "guitars",
      categoryLabel: "Guitars",
      featured: true,
      tags: ["Guitars", "Beginner"],
      coverImage: "/images/guitar-1.webp",
      seoTitle: "How to Choose Your First Electric Guitar",
      seoDescription:
        "Compare body styles, pickup types, and starter budgets before buying your first electric guitar in India.",
      content: doc(
        heading("Pick a body style that matches your music"),
        paragraph(
          "Solid-body guitars are versatile for rock and pop. Semi-hollow models add warmth for jazz and blues. Try both seated and standing before you decide."
        ),
        heading("Single-coils vs humbuckers"),
        paragraph(
          "Single-coils are bright and articulate. Humbuckers are thicker and quieter. Many starter guitars offer HSS layouts so you can explore both."
        ),
        heading("Budget for setup and accessories"),
        paragraph(
          "Reserve part of your budget for setup, strings, a tuner, cable, and a practice amp. A well-set-up affordable guitar often plays better than an neglected premium model."
        )
      ),
    },
    {
      id: "blog-live-sound-checklist",
      slug: "live-sound-checklist",
      title: "Live sound checklist for small venues",
      excerpt:
        "PA placement, monitor mixes, and the gear we reach for when the room is tight on time.",
      categorySlug: "live-sound",
      categoryLabel: "Live Sound",
      featured: false,
      tags: ["Live sound", "Guides"],
      coverImage: "/images/drum-1.webp",
      seoTitle: "Live Sound Checklist for Small Venues",
      seoDescription:
        "A practical live sound checklist for small venues: PA placement, gain staging, and monitor mixes.",
      content: doc(
        heading("Walk the room before you plug in"),
        paragraph(
          "Identify reflective surfaces, stage width, and power outlet locations. Place mains slightly in front of the band to reduce bleed into vocal mics."
        ),
        heading("Line-check inputs in priority order"),
        paragraph(
          "Start with kick and bass, then snare, guitars, keys, and vocals. Set conservative gains and high-pass filters before you open the master."
        ),
        heading("Give musicians usable monitor mixes quickly"),
        paragraph(
          "Ask for one or two priority instruments in each wedge. Small improvements early prevent long sound-check delays."
        )
      ),
    },
  ];

  for (const post of posts) {
    await prisma.blogPost.upsert({
      where: { id: post.id },
      create: {
        ...post,
        ...AUTHOR,
        contentFormat: "tiptap_json",
        content: post.content,
        tags: post.tags,
        status: "published",
        publishedAt,
        scheduledAt: null,
        viewCount: 0,
        createdAt: ts,
        updatedAt: ts,
      },
      update: {
        title: post.title,
        excerpt: post.excerpt,
        content: post.content,
        tags: post.tags,
        categorySlug: post.categorySlug,
        categoryLabel: post.categoryLabel,
        featured: post.featured,
        coverImage: post.coverImage,
        seoTitle: post.seoTitle,
        seoDescription: post.seoDescription,
        status: "published",
        publishedAt,
        updatedAt: ts,
      },
    });
  }

  console.log(`Seeded ${posts.length} published blog posts.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
