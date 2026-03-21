package com.jiwoo.pincloud.api;

import com.jiwoo.pincloud.common.ApiResponse;
import com.jiwoo.pincloud.domain.link.LinkExtractResult;
import com.jiwoo.pincloud.domain.link.LinkExtractService;
import com.jiwoo.pincloud.security.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/links")
@RequiredArgsConstructor
public class LinkExtractController {

  private final LinkExtractService linkExtractService;

  @PostMapping("/extract")
  public ResponseEntity<ApiResponse<LinkExtractResult>> extract(
      @Valid @RequestBody LinkExtractRequest request) {
    SecurityUtils.getCurrentUserId();
    LinkExtractResult result = linkExtractService.extract(request.url());
    return ResponseEntity.ok(ApiResponse.ok(result));
  }
}
