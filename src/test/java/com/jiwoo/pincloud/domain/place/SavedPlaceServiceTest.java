package com.jiwoo.pincloud.domain.place;

import com.jiwoo.pincloud.domain.category.Category;
import com.jiwoo.pincloud.domain.category.CategoryRepository;
import com.jiwoo.pincloud.domain.link.Platform;
import com.jiwoo.pincloud.domain.link.SourceLink;
import com.jiwoo.pincloud.domain.link.SourceLinkRepository;
import com.jiwoo.pincloud.domain.user.User;
import com.jiwoo.pincloud.domain.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
class SavedPlaceServiceTest {

    @Mock
    private SavedPlaceRepository savedPlaceRepository;

    @Mock
    private SourceLinkRepository sourceLinkRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private SavedPlaceService savedPlaceService;

    @Test
    void create_정상적으로_저장한다() {
        // given
        Long userId = 1L;
        User user = 사용자(userId);
        SavedPlaceCreateRequest request = 저장_요청("서울 성동구 성수동", "https://www.instagram.com/p/test");

        given(userRepository.findById(userId)).willReturn(Optional.of(user));
        given(savedPlaceRepository.save(any(SavedPlace.class))).willAnswer(invocation -> {
            SavedPlace savedPlace = invocation.getArgument(0);
            ReflectionTestUtils.setField(savedPlace, "id", 10L);
            return savedPlace;
        });
        given(sourceLinkRepository.save(any(SourceLink.class))).willAnswer(invocation -> {
            SourceLink sourceLink = invocation.getArgument(0);
            ReflectionTestUtils.setField(sourceLink, "id", 20L);
            return sourceLink;
        });

        // when
        SavedPlaceResponse response = savedPlaceService.create(userId, request);

        // then
        ArgumentCaptor<SavedPlace> savedPlaceCaptor = ArgumentCaptor.forClass(SavedPlace.class);
        ArgumentCaptor<SourceLink> sourceLinkCaptor = ArgumentCaptor.forClass(SourceLink.class);
        then(savedPlaceRepository).should().save(savedPlaceCaptor.capture());
        then(sourceLinkRepository).should().save(sourceLinkCaptor.capture());

        SavedPlace savedPlace = savedPlaceCaptor.getValue();
        SourceLink sourceLink = sourceLinkCaptor.getValue();
        assertThat(savedPlace.getUser()).isSameAs(user);
        assertThat(savedPlace.getName()).isEqualTo("성수 팝업");
        assertThat(savedPlace.getAddress()).isEqualTo("서울 성동구 성수동");
        assertThat(savedPlace.getLatitude()).isEqualTo(37.5444);
        assertThat(savedPlace.getLongitude()).isEqualTo(127.0557);
        assertThat(sourceLink.getSavedPlace()).isSameAs(savedPlace);
        assertThat(sourceLink.getOriginalUrl()).isEqualTo("https://www.instagram.com/p/test");
        assertThat(sourceLink.getPlatform()).isEqualTo(Platform.INSTAGRAM);
        assertThat(response.getId()).isEqualTo(10L);
        assertThat(response.getOriginalUrl()).isEqualTo("https://www.instagram.com/p/test");
    }

    @Test
    void create_visitStatus_기본값을_WANT로_저장한다() {
        // given
        Long userId = 1L;
        User user = 사용자(userId);
        SavedPlaceCreateRequest request = 저장_요청("서울 성동구 성수동", "https://example.com/place");

        given(userRepository.findById(userId)).willReturn(Optional.of(user));
        given(savedPlaceRepository.save(any(SavedPlace.class))).willAnswer(invocation -> invocation.getArgument(0));
        given(sourceLinkRepository.save(any(SourceLink.class))).willAnswer(invocation -> invocation.getArgument(0));

        // when
        SavedPlaceResponse response = savedPlaceService.create(userId, request);

        // then
        ArgumentCaptor<SavedPlace> savedPlaceCaptor = ArgumentCaptor.forClass(SavedPlace.class);
        then(savedPlaceRepository).should().save(savedPlaceCaptor.capture());
        assertThat(savedPlaceCaptor.getValue().getVisitStatus()).isEqualTo(VisitStatus.WANT);
        assertThat(response.getVisitStatus()).isEqualTo(VisitStatus.WANT);
    }

    @Test
    void findById_존재하는_ID를_조회한다() {
        // given
        Long userId = 1L;
        Long savedPlaceId = 10L;
        SavedPlace savedPlace = 저장된_장소(savedPlaceId, 사용자(userId), null);
        SourceLink sourceLink = 소스_링크(savedPlace, "https://youtu.be/test", Platform.YOUTUBE);

        given(savedPlaceRepository.findByIdAndUserId(savedPlaceId, userId)).willReturn(Optional.of(savedPlace));
        given(sourceLinkRepository.findBySavedPlaceId(savedPlaceId)).willReturn(Optional.of(sourceLink));

        // when
        SavedPlaceResponse response = savedPlaceService.findById(savedPlaceId, userId);

        // then
        assertThat(response.getId()).isEqualTo(savedPlaceId);
        assertThat(response.getName()).isEqualTo("성수 팝업");
        assertThat(response.getPlatform()).isEqualTo(Platform.YOUTUBE);
        assertThat(response.getOriginalUrl()).isEqualTo("https://youtu.be/test");
    }

    @Test
    void findById_다른_사용자의_장소를_조회하면_예외가_발생한다() {
        // given
        Long savedPlaceId = 10L;
        Long userId = 1L;
        given(savedPlaceRepository.findByIdAndUserId(savedPlaceId, userId)).willReturn(Optional.empty());

        // when
        // then
        assertThatThrownBy(() -> savedPlaceService.findById(savedPlaceId, userId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Saved place not found");
    }

    @Test
    void update_메모_방문상태_카테고리를_수정한다() {
        // given
        Long userId = 1L;
        Category 기존_카테고리 = 카테고리(100L, userId, "카페", "#111111");
        Category 새_카테고리 = 카테고리(200L, userId, "맛집", "#222222");
        SavedPlace savedPlace = 저장된_장소(10L, 사용자(userId), 기존_카테고리);
        SourceLink sourceLink = 소스_링크(savedPlace, "https://blog.naver.com/test", Platform.BLOG);
        SavedPlaceUpdateRequest request = new SavedPlaceUpdateRequest();
        request.setCategoryId(새_카테고리.getId());
        request.setMemo("다음 주 방문 예정");
        request.setVisitStatus(VisitStatus.VISITED);

        given(savedPlaceRepository.findByIdAndUserId(10L, userId)).willReturn(Optional.of(savedPlace));
        given(categoryRepository.findById(새_카테고리.getId())).willReturn(Optional.of(새_카테고리));
        given(sourceLinkRepository.findBySavedPlaceId(10L)).willReturn(Optional.of(sourceLink));

        // when
        SavedPlaceResponse response = savedPlaceService.update(10L, userId, request);

        // then
        assertThat(savedPlace.getCategory()).isSameAs(새_카테고리);
        assertThat(savedPlace.getMemo()).isEqualTo("다음 주 방문 예정");
        assertThat(savedPlace.getVisitStatus()).isEqualTo(VisitStatus.VISITED);
        assertThat(response.getCategoryId()).isEqualTo(새_카테고리.getId());
        assertThat(response.getMemo()).isEqualTo("다음 주 방문 예정");
        assertThat(response.getVisitStatus()).isEqualTo(VisitStatus.VISITED);
    }

    @Test
    void delete_삭제한_후_조회하면_예외가_발생한다() {
        // given
        Long userId = 1L;
        Long savedPlaceId = 10L;
        SavedPlace savedPlace = 저장된_장소(savedPlaceId, 사용자(userId), null);
        SourceLink sourceLink = 소스_링크(savedPlace, "https://example.com/test", Platform.OTHER);

        given(savedPlaceRepository.findByIdAndUserId(savedPlaceId, userId))
                .willReturn(Optional.of(savedPlace), Optional.empty());
        given(sourceLinkRepository.findBySavedPlaceId(savedPlaceId)).willReturn(Optional.of(sourceLink));

        // when
        savedPlaceService.delete(savedPlaceId, userId);

        // then
        then(sourceLinkRepository).should().delete(sourceLink);
        then(savedPlaceRepository).should().delete(savedPlace);
        assertThatThrownBy(() -> savedPlaceService.findById(savedPlaceId, userId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Saved place not found");
    }

    private SavedPlaceCreateRequest 저장_요청(String address, String originalUrl) {
        SavedPlaceCreateRequest request = new SavedPlaceCreateRequest();
        request.setName("성수 팝업");
        request.setAddress(address);
        request.setLatitude(37.5444);
        request.setLongitude(127.0557);
        request.setMemo("주말에 가보기");
        request.setOriginalUrl(originalUrl);
        request.setTitle("성수 팝업 스토어");
        request.setThumbnailUrl("https://image.example.com/thumb.jpg");
        return request;
    }

    private SavedPlace 저장된_장소(Long id, User user, Category category) {
        SavedPlace savedPlace = SavedPlace.builder()
                .user(user)
                .category(category)
                .name("성수 팝업")
                .address("서울 성동구 성수동")
                .latitude(37.5444)
                .longitude(127.0557)
                .memo("주말에 가보기")
                .visitStatus(VisitStatus.WANT)
                .build();
        ReflectionTestUtils.setField(savedPlace, "id", id);
        return savedPlace;
    }

    private SourceLink 소스_링크(SavedPlace savedPlace, String originalUrl, Platform platform) {
        return SourceLink.builder()
                .savedPlace(savedPlace)
                .originalUrl(originalUrl)
                .platform(platform)
                .title("원본 링크")
                .thumbnailUrl("https://image.example.com/thumb.jpg")
                .build();
    }

    private Category 카테고리(Long id, Long userId, String name, String colorCode) {
        Category category = Category.builder()
                .user(사용자(userId))
                .name(name)
                .colorCode(colorCode)
                .build();
        ReflectionTestUtils.setField(category, "id", id);
        return category;
    }

    private User 사용자(Long id) {
        User user = User.builder()
                .email("tester" + id + "@example.com")
                .nickname("테스터")
                .password("password")
                .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}
