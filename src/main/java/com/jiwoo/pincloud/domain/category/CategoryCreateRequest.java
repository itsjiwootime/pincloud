package com.jiwoo.pincloud.domain.category;

import jakarta.validation.constraints.NotBlank;

public record CategoryCreateRequest(
        @NotBlank(message = "카테고리 이름은 필수입니다")
        String name,
        @NotBlank(message = "색상 코드는 필수입니다")
        String colorCode
) {
}
