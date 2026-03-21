package com.jiwoo.pincloud.domain.place;

import com.jiwoo.pincloud.domain.link.Platform;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class SavedPlaceResponse {

    private Long id;
    private String name;
    private String address;
    private Double latitude;
    private Double longitude;
    private String memo;
    private VisitStatus visitStatus;
    private Long categoryId;
    private String categoryName;
    private String colorCode;
    private String originalUrl;
    private Platform platform;
    private String thumbnailUrl;
    private LocalDateTime createdAt;
}
