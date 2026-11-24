import { fetchFeed } from "./rss";

/** FTC competition press releases. */
export const ftcPress = () =>
  fetchFeed("https://www.ftc.gov/feeds/press-release-competition.xml", { source: "FTC", sourceType: "agency" }).catch(() =>
    fetchFeed("https://www.ftc.gov/feeds/press-release.xml", { source: "FTC", sourceType: "agency" })
  );

/**
 * DOJ press releases. DOJ's feed ignores topic filters, so this returns ALL DOJ news
 * and the relevance scorer keeps only the antitrust/railroad/regulatory items.
 */
export const dojPress = () =>
  fetchFeed("https://www.justice.gov/news/rss?type=press_release", { source: "DOJ", sourceType: "agency" });
