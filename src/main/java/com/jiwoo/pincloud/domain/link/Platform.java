package com.jiwoo.pincloud.domain.link;

import java.util.Locale;

public enum Platform {
    INSTAGRAM, YOUTUBE, BLOG, OTHER;

    public static Platform detect(String url) {
        if (url == null) {
            return OTHER;
        }

        String lower = url.toLowerCase(Locale.ROOT);
        if (lower.contains("instagram.com")) {
            return INSTAGRAM;
        }
        if (lower.contains("youtube.com") || lower.contains("youtu.be")) {
            return YOUTUBE;
        }
        if (lower.contains("blog.naver.com") || lower.contains("tistory.com") || lower.contains("brunch.co.kr")) {
            return BLOG;
        }
        return OTHER;
    }
}
