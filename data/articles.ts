import type { SectionManifest } from "@/lib/plan/manifest";

export type ArticleSummary = Pick<
  SectionManifest,
  "id" | "title" | "ref" | "default_image_url" | "book_image_url"
> & {
  overline: string;
  subtitle: string;
  bookTitle: string;
  author: string;
};

export const homeArticleData: {
  featured: ArticleSummary;
  sidebar: ArticleSummary[];
  list: ArticleSummary[];
} = {
  featured: {
    id: "article-featured-witness",
    title: "Witness in a World of Stories",
    ref: "GEN 11",
    default_image_url: "/recast-1.jpg",
    book_image_url: "/recast-1.jpg",
    overline: "Cultural analysis",
    subtitle: "The gospel amid competing narratives",
    bookTitle: "Storytelling and the Gospel",
    author: "K. M. Lewis",
  },
  sidebar: [
    {
      id: "article-truth-neutrality",
      title: "Truth After Neutrality",
      ref: "ROM 1",
      default_image_url: "/recast-1.jpg",
      book_image_url: "/recast-1.jpg",
      overline: "Dialectic",
      subtitle: "Why every society already worships something",
      bookTitle: "Truth After Neutrality",
      author: "J. Rivera",
    },
    {
      id: "article-common-life",
      title: "The Spirit and Common Life",
      ref: "ACTS 2",
      default_image_url: "/recast-1.jpg",
      book_image_url: "/recast-1.jpg",
      overline: "Practical theology",
      subtitle: "Practicing discernment in fragmented communities",
      bookTitle: "Common Life",
      author: "S. Osei",
    },
    {
      id: "article-witness-sidebar",
      title: "Witness in a World of Stories",
      ref: "GEN 11",
      default_image_url: "/recast-1.jpg",
      book_image_url: "/recast-1.jpg",
      overline: "Cultural analysis",
      subtitle: "The gospel amid competing narratives",
      bookTitle: "Stories that Shape Us",
      author: "K. M. Lewis",
    },
  ],
  list: [
    {
      id: "article-pneuma-polis",
      title: "Pneuma and Polis",
      ref: "ACTS 17",
      default_image_url: "/recast-1.jpg",
      book_image_url: "/recast-1.jpg",
      overline: "Translation study",
      subtitle: "Rethinking politics through the life of the Spirit",
      bookTitle: "Pneuma and Polis",
      author: "M. Grant",
    },
    {
      id: "article-beyond-private-faith",
      title: "Beyond Private Faith",
      ref: "JAS 2",
      default_image_url: "/recast-1.jpg",
      book_image_url: "/recast-1.jpg",
      overline: "Dialectic",
      subtitle: "Why belief must become embodied practice",
      bookTitle: "Embodied Faith",
      author: "L. Ortiz",
    },
    {
      id: "article-secular-space",
      title: "The End of Secular Space",
      ref: "PS 24",
      default_image_url: "/recast-1.jpg",
      book_image_url: "/recast-1.jpg",
      overline: "Word study",
      subtitle: "Reclaiming public life as sacred space",
      bookTitle: "Secular Space",
      author: "T. Price",
    },
    {
      id: "article-spirit-interpreter",
      title: "Spirit as Interpreter",
      ref: "LUK 24",
      default_image_url: "/recast-1.jpg",
      book_image_url: "/recast-1.jpg",
      overline: "Hermeneutics",
      subtitle: "How truth emerges through communal reading",
      bookTitle: "Spirit as Interpreter",
      author: "A. Jennings",
    },
  ],
};
