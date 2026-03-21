package com.jiwoo.pincloud.external;

import java.io.IOException;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class OgTagExtractor {

  public OgTagResult extract(String url) {
    try {
      Document doc = Jsoup.connect(url).userAgent("Mozilla/5.0").timeout(5000).get();

      String title = getMetaContent(doc, "og:title");
      if (title == null) {
        title = doc.title();
      }

      String description = getMetaContent(doc, "og:description");
      String thumbnail = getMetaContent(doc, "og:image");

      return OgTagResult.builder()
          .title(title)
          .description(description)
          .thumbnailUrl(thumbnail)
          .build();
    } catch (IOException e) {
      log.warn("OG tag extraction failed for {}: {}", url, e.getMessage());
      return OgTagResult.builder().build();
    }
  }

  private String getMetaContent(Document doc, String property) {
    Element el = doc.selectFirst(String.format("meta[property='%s']", property));
    if (el != null) {
      return el.attr("content");
    }

    el = doc.selectFirst(String.format("meta[name='%s']", property));
    return el != null ? el.attr("content") : null;
  }
}
