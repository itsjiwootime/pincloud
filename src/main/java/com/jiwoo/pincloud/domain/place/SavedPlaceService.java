package com.jiwoo.pincloud.domain.place;

import com.jiwoo.pincloud.domain.category.Category;
import com.jiwoo.pincloud.domain.category.CategoryRepository;
import com.jiwoo.pincloud.domain.link.Platform;
import com.jiwoo.pincloud.domain.link.SourceLink;
import com.jiwoo.pincloud.domain.link.SourceLinkRepository;
import com.jiwoo.pincloud.domain.user.User;
import com.jiwoo.pincloud.domain.user.UserRepository;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SavedPlaceService {

  private static final int MAX_BBOX_RESULTS = 200;

  private final SavedPlaceRepository savedPlaceRepository;
  private final SourceLinkRepository sourceLinkRepository;
  private final UserRepository userRepository;
  private final CategoryRepository categoryRepository;

  @Transactional
  public SavedPlaceResponse create(Long userId, SavedPlaceCreateRequest request) {
    User user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    Category category = resolveCategory(userId, request.getCategoryId());

    SavedPlace savedPlace =
        savedPlaceRepository.save(
            SavedPlace.builder()
                .user(user)
                .category(category)
                .name(request.getName())
                .address(request.getAddress())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .memo(request.getMemo())
                .visitStatus(VisitStatus.WANT)
                .build());

    SourceLink sourceLink =
        sourceLinkRepository.save(
            SourceLink.builder()
                .savedPlace(savedPlace)
                .originalUrl(request.getOriginalUrl())
                .platform(resolvePlatform(request))
                .title(request.getTitle())
                .thumbnailUrl(request.getThumbnailUrl())
                .build());

    return toResponse(savedPlace, sourceLink);
  }

  public SavedPlaceResponse findById(Long id, Long userId) {
    SavedPlace savedPlace = getSavedPlace(id, userId);
    SourceLink sourceLink =
        sourceLinkRepository.findBySavedPlaceId(savedPlace.getId()).orElse(null);
    return toResponse(savedPlace, sourceLink);
  }

  public List<SavedPlaceResponse> findAll(Long userId) {
    List<SavedPlace> savedPlaces = savedPlaceRepository.findAllByUserId(userId);
    return toResponses(savedPlaces);
  }

  public List<SavedPlaceResponse> findByBbox(
      Long userId, Double minLat, Double maxLat, Double minLng, Double maxLng) {
    validateBbox(minLat, maxLat, minLng, maxLng);

    List<SavedPlace> savedPlaces =
        savedPlaceRepository.findByUserIdAndBbox(userId, minLat, maxLat, minLng, maxLng).stream()
            .limit(MAX_BBOX_RESULTS)
            .toList();
    return toResponses(savedPlaces);
  }

  @Transactional
  public SavedPlaceResponse update(Long id, Long userId, SavedPlaceUpdateRequest request) {
    SavedPlace savedPlace = getSavedPlace(id, userId);
    Category category =
        request.getCategoryId() != null
            ? resolveCategory(userId, request.getCategoryId())
            : savedPlace.getCategory();

    savedPlace.update(category, request.getMemo(), request.getVisitStatus());
    SourceLink sourceLink =
        sourceLinkRepository.findBySavedPlaceId(savedPlace.getId()).orElse(null);
    return toResponse(savedPlace, sourceLink);
  }

  @Transactional
  public void delete(Long id, Long userId) {
    SavedPlace savedPlace = getSavedPlace(id, userId);
    sourceLinkRepository
        .findBySavedPlaceId(savedPlace.getId())
        .ifPresent(sourceLinkRepository::delete);
    savedPlaceRepository.delete(savedPlace);
  }

  private Category resolveCategory(Long userId, Long categoryId) {
    if (categoryId == null) {
      return null;
    }

    Category category =
        categoryRepository
            .findById(categoryId)
            .orElseThrow(() -> new IllegalArgumentException("Category not found"));
    if (!category.getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("Category does not belong to user");
    }
    return category;
  }

  private SavedPlace getSavedPlace(Long id, Long userId) {
    return savedPlaceRepository
        .findByIdAndUserId(id, userId)
        .orElseThrow(() -> new IllegalArgumentException("Saved place not found"));
  }

  private Platform resolvePlatform(SavedPlaceCreateRequest request) {
    return request.getPlatform() != null
        ? request.getPlatform()
        : Platform.detect(request.getOriginalUrl());
  }

  private void validateBbox(Double minLat, Double maxLat, Double minLng, Double maxLng) {
    if (minLat > maxLat || minLng > maxLng) {
      throw new IllegalArgumentException("Invalid bbox coordinates");
    }
  }

  private List<SavedPlaceResponse> toResponses(List<SavedPlace> savedPlaces) {
    if (savedPlaces.isEmpty()) {
      return List.of();
    }

    Map<Long, SourceLink> sourceLinkMap =
        sourceLinkRepository
            .findAllBySavedPlaceIdIn(savedPlaces.stream().map(SavedPlace::getId).toList())
            .stream()
            .collect(
                Collectors.toMap(
                    sourceLink -> sourceLink.getSavedPlace().getId(), Function.identity()));

    return savedPlaces.stream()
        .map(savedPlace -> toResponse(savedPlace, sourceLinkMap.get(savedPlace.getId())))
        .toList();
  }

  private SavedPlaceResponse toResponse(SavedPlace savedPlace, SourceLink sourceLink) {
    Category category = savedPlace.getCategory();

    return SavedPlaceResponse.builder()
        .id(savedPlace.getId())
        .name(savedPlace.getName())
        .address(savedPlace.getAddress())
        .latitude(savedPlace.getLatitude())
        .longitude(savedPlace.getLongitude())
        .memo(savedPlace.getMemo())
        .visitStatus(savedPlace.getVisitStatus())
        .categoryId(category != null ? category.getId() : null)
        .categoryName(category != null ? category.getName() : null)
        .colorCode(category != null ? category.getColorCode() : null)
        .originalUrl(sourceLink != null ? sourceLink.getOriginalUrl() : null)
        .platform(sourceLink != null ? sourceLink.getPlatform() : null)
        .thumbnailUrl(sourceLink != null ? sourceLink.getThumbnailUrl() : null)
        .createdAt(savedPlace.getCreatedAt())
        .build();
  }
}
