import ArticleCard from "@/components/article/ArticleCard";
import { homeArticleData } from "@/data/articles";

export default function ArticlesPage() {
  return (
    <main className="px-6 pb-16">
      <div className="mx-auto w-full max-w-[918px]">
        <div className="grid gap-10 lg:grid-cols-[232px_1fr]">
          <div className="flex flex-col gap-7">
            {homeArticleData.sidebar.map((article) => (
              <ArticleCard key={article.id} article={article} variant="stacked" />
            ))}
          </div>
          <div className="flex flex-col">
            <ArticleCard article={homeArticleData.featured} variant="featured" />
            <div className="mt-8 flex flex-col">
              {homeArticleData.list.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  variant="wide"
                  className="last:border-b-0 last:pb-0"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
