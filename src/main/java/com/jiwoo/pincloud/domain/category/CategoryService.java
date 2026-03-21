package com.jiwoo.pincloud.domain.category;

import com.jiwoo.pincloud.domain.place.SavedPlace;
import com.jiwoo.pincloud.domain.place.SavedPlaceRepository;
import com.jiwoo.pincloud.domain.user.User;
import com.jiwoo.pincloud.domain.user.UserService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

  private final CategoryRepository categoryRepository;
  private final SavedPlaceRepository savedPlaceRepository;
  private final UserService userService;

  public List<CategoryResponse> findAll(Long userId) {
    return categoryRepository.findAllByUserId(userId).stream().map(this::toResponse).toList();
  }

  public CategoryResponse findById(Long id, Long userId) {
    return toResponse(getCategory(id, userId));
  }

  @Transactional
  public CategoryResponse create(Long userId, CategoryCreateRequest request) {
    validateDuplicateName(userId, request.name(), null);

    User user = userService.findById(userId);
    Category category =
        categoryRepository.save(
            Category.builder()
                .user(user)
                .name(request.name())
                .colorCode(request.colorCode())
                .build());

    return toResponse(category);
  }

  @Transactional
  public CategoryResponse update(Long id, Long userId, CategoryUpdateRequest request) {
    Category category = getCategory(id, userId);
    validateDuplicateName(userId, request.name(), id);
    category.update(request.name(), request.colorCode());
    return toResponse(category);
  }

  @Transactional
  public void delete(Long id, Long userId) {
    Category category = getCategory(id, userId);
    for (SavedPlace savedPlace : savedPlaceRepository.findAllByCategoryId(category.getId())) {
      savedPlace.update(null, null, null);
    }
    categoryRepository.delete(category);
  }

  private Category getCategory(Long id, Long userId) {
    Category category =
        categoryRepository
            .findById(id)
            .orElseThrow(() -> new IllegalArgumentException("카테고리를 찾을 수 없습니다"));

    if (!category.getUser().getId().equals(userId)) {
      throw new IllegalArgumentException("카테고리를 찾을 수 없습니다");
    }

    return category;
  }

  private void validateDuplicateName(Long userId, String name, Long categoryId) {
    categoryRepository
        .findByUserIdAndName(userId, name)
        .filter(existing -> !existing.getId().equals(categoryId))
        .ifPresent(
            existing -> {
              throw new IllegalArgumentException("이미 같은 이름의 카테고리가 있습니다");
            });
  }

  private CategoryResponse toResponse(Category category) {
    return new CategoryResponse(
        category.getId(), category.getName(), category.getColorCode(), category.getCreatedAt());
  }
}
