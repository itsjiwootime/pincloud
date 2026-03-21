package com.jiwoo.pincloud.domain.category;

import java.time.LocalDateTime;

public record CategoryResponse(
        Long id,
        String name,
        String colorCode,
        LocalDateTime createdAt
) {
}
