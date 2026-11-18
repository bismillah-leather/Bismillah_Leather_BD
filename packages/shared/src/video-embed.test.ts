import { describe, expect, it } from "vitest";
import { parseVideoEmbed } from "./video-embed";

describe("parseVideoEmbed", () => {
  it("accepts Facebook share, reel, and watch links", () => {
    const share = parseVideoEmbed("https://www.facebook.com/share/v/17AbCdEfGh/");
    expect(share?.provider).toBe("facebook");
    expect(share?.embedUrl).toContain("plugins/video.php");

    const reel = parseVideoEmbed("https://www.facebook.com/reel/1234567890");
    expect(reel?.provider).toBe("facebook");

    const watch = parseVideoEmbed("https://fb.watch/abcDE/");
    expect(watch?.provider).toBe("facebook");
  });

  it("accepts YouTube watch links", () => {
    const yt = parseVideoEmbed("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(yt?.provider).toBe("youtube");
    expect(yt?.embedUrl).toContain("dQw4w9WgXcQ");
  });

  it("rejects a Facebook profile URL", () => {
    expect(
      parseVideoEmbed("https://www.facebook.com/people/Bismillah-leather/61560749383224/"),
    ).toBeNull();
  });
});
