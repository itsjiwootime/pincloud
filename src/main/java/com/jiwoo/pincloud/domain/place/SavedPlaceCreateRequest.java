package com.jiwoo.pincloud.domain.place;

import com.jiwoo.pincloud.domain.link.Platform;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class SavedPlaceCreateRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String address;

    @NotNull
    private Double latitude;

    @NotNull
    private Double longitude;

    private String memo;

    private Long categoryId;

    @NotBlank
    private String originalUrl;

    private Platform platform;

    private String title;

    private String thumbnailUrl;
}
