import { STYLE_STORY } from "@/data/styleStory";
import StyleStoryCard from "./StyleStoryCard";
import "./styleStory.css";

/** Homepage reel thumbnail showcase (`#shop-style-story`). */
export default function StyleStory() {
  return (
    <section
      id={STYLE_STORY.sectionId}
      className="style-story"
      aria-labelledby="style-story-heading"
    >
      <h2 id="style-story-heading" className="style-story__title">
        {STYLE_STORY.heading}
      </h2>

      <div className="style-story__grid">
        {STYLE_STORY.reels.map((item) => (
          <StyleStoryCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
