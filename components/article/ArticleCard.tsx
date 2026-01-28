import Image from "next/image";
import type { ArticleSummary } from "@/data/articles";

type ArticleCardVariant = "featured" | "stacked" | "wide";

interface ArticleCardProps {
  article: ArticleSummary;
  variant?: ArticleCardVariant;
  className?: string;
}

const coverShadow =
  "0px 35.03703689575195px 22.814815521240234px -13.037036895751953px rgba(0, 0, 0, 0.1), -3.2592592239379883px 4.888888359069824px 16.296297073364258px 0px rgba(0, 0, 0, 0.15), 0.8148148059844971px 9.777776718139648px 24.44444465637207px -8.148148536682129px rgba(0, 0, 0, 0.2)";

export default function ArticleCard({
  article,
  variant = "stacked",
  className,
}: ArticleCardProps) {
  const isWide = variant === "wide";
  const isFeatured = variant === "featured";
  const mainImage = article.default_image_url ?? "/recast-1.jpg";
  const bookImage = article.book_image_url ?? mainImage;
  const stackedSizes = isFeatured
    ? "(min-width: 1024px) 452px, 100vw"
    : "(min-width: 1024px) 232px, 100vw";

  const rootClassName = [
    "bg-white",
    isWide
      ? "flex items-stretch gap-3 border-b border-[#DADADC] pb-6"
      : "flex flex-col gap-3",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const titleClassName = isFeatured
    ? "text-2xl font-bold"
    : "text-base font-bold";
  const subtitleClassName = isFeatured ? "text-base" : "text-sm";

  const content = (
    <div className="flex flex-col gap-4 pt-4">
      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-bold uppercase tracking-[0.08em] text-chat-rebinder-fg font-lora">
          {article.overline}
        </span>
        <h3
          className={`${titleClassName} text-black`}
          style={{ fontFamily: "var(--font-libre-caslon-text), serif" }}
        >
          {article.title}
        </h3>
        <p className={`${subtitleClassName} text-[#3C3D47] font-lora`}>
          {article.subtitle}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div
          className="relative h-[54px] w-[36px] shrink-0 overflow-hidden rounded-[5px] bg-white"
          style={{ boxShadow: coverShadow }}
        >
          <Image
            src={bookImage}
            alt={`${article.bookTitle} cover`}
            fill
            sizes="36px"
            className="object-cover"
          />
        </div>
        <div
          className="flex flex-col"
          style={{ fontFamily: "var(--font-inter), sans-serif" }}
        >
          <span className="text-[15px] leading-[1.268] text-black">
            {article.bookTitle}
          </span>
          <span className="text-[13px] leading-[1.268] text-[#3C3D47]">
            {article.author}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <article className={rootClassName}>
      {isWide ? (
        <>
          <div className="flex-1">{content}</div>
          <div className="relative w-[77px] shrink-0 overflow-hidden rounded-sm bg-[#5A7D56]">
            <Image
              src={mainImage}
              alt={article.title}
              fill
              sizes="77px"
              className="object-cover"
            />
          </div>
        </>
      ) : (
        <>
          <div className="relative h-[160px] w-full overflow-hidden rounded-sm bg-[#5A7D56]">
            <Image
              src={mainImage}
              alt={article.title}
              fill
              sizes={stackedSizes}
              className="object-cover"
            />
          </div>
          {content}
        </>
      )}
    </article>
  );
}
