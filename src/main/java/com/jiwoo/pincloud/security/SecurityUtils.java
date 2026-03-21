package com.jiwoo.pincloud.security;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtils {

  private SecurityUtils() {}

  public static Long getCurrentUserId() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null
        || !authentication.isAuthenticated()
        || authentication instanceof AnonymousAuthenticationToken) {
      throw new AccessDeniedException("Authentication is required");
    }

    Object principal = authentication.getPrincipal();
    if (principal instanceof Long userId) {
      return userId;
    }
    if (principal instanceof String userIdText) {
      return Long.parseLong(userIdText);
    }

    throw new AccessDeniedException("Invalid authentication principal");
  }
}
