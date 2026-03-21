package com.jiwoo.pincloud.api;

import jakarta.validation.constraints.NotBlank;

public record LinkExtractRequest(@NotBlank String url) {
}
