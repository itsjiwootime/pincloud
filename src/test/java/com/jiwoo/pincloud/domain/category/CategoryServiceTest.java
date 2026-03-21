package com.jiwoo.pincloud.domain.category;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

import com.jiwoo.pincloud.domain.place.SavedPlace;
import com.jiwoo.pincloud.domain.place.SavedPlaceRepository;
import com.jiwoo.pincloud.domain.place.VisitStatus;
import com.jiwoo.pincloud.domain.user.User;
import com.jiwoo.pincloud.domain.user.UserService;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

  @Mock private CategoryRepository categoryRepository;

  @Mock private SavedPlaceRepository savedPlaceRepository;

  @Mock private UserService userService;

  @InjectMocks private CategoryService categoryService;

  @Test
  void create_카테고리를_생성한다() {
    // given
    Long userId = 1L;
    User user = 사용자(userId);
    CategoryCreateRequest request = new CategoryCreateRequest("카페", "#112233");

    given(categoryRepository.findByUserIdAndName(userId, request.name()))
        .willReturn(Optional.empty());
    given(userService.findById(userId)).willReturn(user);
    given(categoryRepository.save(any(Category.class)))
        .willAnswer(
            invocation -> {
              Category category = invocation.getArgument(0);
              ReflectionTestUtils.setField(category, "id", 10L);
              return category;
            });

    // when
    CategoryResponse response = categoryService.create(userId, request);

    // then
    assertThat(response.id()).isEqualTo(10L);
    assertThat(response.name()).isEqualTo("카페");
    assertThat(response.colorCode()).isEqualTo("#112233");
    then(categoryRepository).should().save(any(Category.class));
  }

  @Test
  void create_같은_사용자와_이름이_중복되면_예외가_발생한다() {
    // given
    Long userId = 1L;
    CategoryCreateRequest request = new CategoryCreateRequest("카페", "#112233");
    Category existingCategory = 카테고리(10L, userId, "카페", "#abcdef");

    given(categoryRepository.findByUserIdAndName(userId, request.name()))
        .willReturn(Optional.of(existingCategory));

    // when
    // then
    assertThatThrownBy(() -> categoryService.create(userId, request))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("이미 같은 이름의 카테고리가 있습니다");
    then(categoryRepository).should(never()).save(any(Category.class));
  }

  @Test
  void findAll_사용자의_카테고리_목록을_반환한다() {
    // given
    Long userId = 1L;
    Category category1 = 카테고리(10L, userId, "카페", "#112233");
    Category category2 = 카테고리(20L, userId, "맛집", "#445566");
    given(categoryRepository.findAllByUserId(userId)).willReturn(List.of(category1, category2));

    // when
    List<CategoryResponse> response = categoryService.findAll(userId);

    // then
    assertThat(response).hasSize(2);
    assertThat(response).extracting(CategoryResponse::name).containsExactly("카페", "맛집");
    assertThat(response)
        .extracting(CategoryResponse::colorCode)
        .containsExactly("#112233", "#445566");
  }

  @Test
  void delete_본인_카테고리를_삭제한다() {
    // given
    Long userId = 1L;
    Category category = 카테고리(10L, userId, "카페", "#112233");
    SavedPlace savedPlace =
        SavedPlace.builder()
            .user(사용자(userId))
            .category(category)
            .name("성수 팝업")
            .address("서울 성동구 성수동")
            .latitude(37.5444)
            .longitude(127.0557)
            .memo("메모")
            .visitStatus(VisitStatus.WANT)
            .build();

    given(categoryRepository.findById(category.getId())).willReturn(Optional.of(category));
    given(savedPlaceRepository.findAllByCategoryId(category.getId()))
        .willReturn(List.of(savedPlace));

    // when
    categoryService.delete(category.getId(), userId);

    // then
    assertThat(savedPlace.getCategory()).isNull();
    then(categoryRepository).should().delete(category);
  }

  @Test
  void delete_다른_사용자의_카테고리를_삭제하면_예외가_발생한다() {
    // given
    Long userId = 1L;
    Category category = 카테고리(10L, 2L, "카페", "#112233");
    given(categoryRepository.findById(category.getId())).willReturn(Optional.of(category));

    // when
    // then
    assertThatThrownBy(() -> categoryService.delete(category.getId(), userId))
        .isInstanceOf(IllegalArgumentException.class)
        .hasMessage("카테고리를 찾을 수 없습니다");
    then(categoryRepository).should(never()).delete(any(Category.class));
  }

  @Test
  void update_이름과_색상을_수정한다() {
    // given
    Long userId = 1L;
    Category category = 카테고리(10L, userId, "카페", "#112233");
    CategoryUpdateRequest request = new CategoryUpdateRequest("맛집", "#445566");

    given(categoryRepository.findById(category.getId())).willReturn(Optional.of(category));
    given(categoryRepository.findByUserIdAndName(userId, request.name()))
        .willReturn(Optional.empty());

    // when
    CategoryResponse response = categoryService.update(category.getId(), userId, request);

    // then
    assertThat(category.getName()).isEqualTo("맛집");
    assertThat(category.getColorCode()).isEqualTo("#445566");
    assertThat(response.name()).isEqualTo("맛집");
    assertThat(response.colorCode()).isEqualTo("#445566");
  }

  private Category 카테고리(Long id, Long userId, String name, String colorCode) {
    Category category =
        Category.builder().user(사용자(userId)).name(name).colorCode(colorCode).build();
    ReflectionTestUtils.setField(category, "id", id);
    return category;
  }

  private User 사용자(Long id) {
    User user =
        User.builder()
            .email("tester" + id + "@example.com")
            .nickname("테스터")
            .password("password")
            .build();
    ReflectionTestUtils.setField(user, "id", id);
    return user;
  }
}
