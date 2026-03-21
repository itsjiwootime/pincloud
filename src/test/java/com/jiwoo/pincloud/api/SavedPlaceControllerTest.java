package com.jiwoo.pincloud.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jiwoo.pincloud.auth.JwtTokenProvider;
import com.jiwoo.pincloud.auth.KakaoAuthClient;
import com.jiwoo.pincloud.domain.link.Platform;
import com.jiwoo.pincloud.domain.link.SourceLink;
import com.jiwoo.pincloud.domain.link.SourceLinkRepository;
import com.jiwoo.pincloud.domain.place.SavedPlace;
import com.jiwoo.pincloud.domain.place.SavedPlaceCreateRequest;
import com.jiwoo.pincloud.domain.place.SavedPlaceRepository;
import com.jiwoo.pincloud.domain.place.SavedPlaceUpdateRequest;
import com.jiwoo.pincloud.domain.place.VisitStatus;
import com.jiwoo.pincloud.domain.user.User;
import com.jiwoo.pincloud.domain.user.UserRepository;
import com.jiwoo.pincloud.external.KakaoPlaceClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "jwt.secret=testSecretKeyForIntegrationTestsShouldBeLongEnough12345",
        "jwt.access-expiration=3600000",
        "jwt.refresh-expiration=604800000"
})
@AutoConfigureMockMvc
class SavedPlaceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SavedPlaceRepository savedPlaceRepository;

    @Autowired
    private SourceLinkRepository sourceLinkRepository;

    @MockitoBean
    private KakaoAuthClient kakaoAuthClient;

    @MockitoBean
    private KakaoPlaceClient kakaoPlaceClient;

    @BeforeEach
    void setUp() {
        sourceLinkRepository.deleteAll();
        savedPlaceRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void POST_savedPlaces_201_Created를_반환한다() throws Exception {
        // given
        User user = 사용자_저장();
        SavedPlaceCreateRequest request = 저장_요청();

        // when
        // then
        mockMvc.perform(post("/api/saved-places")
                        .header(HttpHeaders.AUTHORIZATION, 인증_헤더(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("성수 팝업"))
                .andExpect(jsonPath("$.data.visitStatus").value("WANT"));
    }

    @Test
    void GET_savedPlaces_id_200_OK를_반환한다() throws Exception {
        // given
        User user = 사용자_저장();
        SavedPlace savedPlace = 장소_저장(user);

        // when
        // then
        mockMvc.perform(get("/api/saved-places/{id}", savedPlace.getId())
                        .header(HttpHeaders.AUTHORIZATION, 인증_헤더(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(savedPlace.getId()))
                .andExpect(jsonPath("$.data.name").value("성수 팝업"));
    }

    @Test
    void PATCH_savedPlaces_id_200_OK를_반환한다() throws Exception {
        // given
        User user = 사용자_저장();
        SavedPlace savedPlace = 장소_저장(user);
        SavedPlaceUpdateRequest request = new SavedPlaceUpdateRequest();
        request.setMemo("업데이트된 메모");
        request.setVisitStatus(VisitStatus.VISITED);

        // when
        mockMvc.perform(patch("/api/saved-places/{id}", savedPlace.getId())
                        .header(HttpHeaders.AUTHORIZATION, 인증_헤더(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.memo").value("업데이트된 메모"))
                .andExpect(jsonPath("$.data.visitStatus").value("VISITED"));

        // then
        SavedPlace updated = savedPlaceRepository.findById(savedPlace.getId()).orElseThrow();
        assertThat(updated.getMemo()).isEqualTo("업데이트된 메모");
        assertThat(updated.getVisitStatus()).isEqualTo(VisitStatus.VISITED);
    }

    @Test
    void DELETE_savedPlaces_id_204_No_Content를_반환한다() throws Exception {
        // given
        User user = 사용자_저장();
        SavedPlace savedPlace = 장소_저장(user);

        // when
        mockMvc.perform(delete("/api/saved-places/{id}", savedPlace.getId())
                        .header(HttpHeaders.AUTHORIZATION, 인증_헤더(user)))
                .andExpect(status().isNoContent());

        // then
        assertThat(savedPlaceRepository.findById(savedPlace.getId())).isEmpty();
        assertThat(sourceLinkRepository.findBySavedPlaceId(savedPlace.getId())).isEmpty();
    }

    @Test
    void GET_savedPlaces_id_인증이_없으면_403_Forbidden을_반환한다() throws Exception {
        // given
        User user = 사용자_저장();
        SavedPlace savedPlace = 장소_저장(user);

        // when
        // then
        mockMvc.perform(get("/api/saved-places/{id}", savedPlace.getId()))
                .andExpect(status().isForbidden());
    }

    private SavedPlaceCreateRequest 저장_요청() {
        SavedPlaceCreateRequest request = new SavedPlaceCreateRequest();
        request.setName("성수 팝업");
        request.setAddress("서울 성동구 성수동");
        request.setLatitude(37.5444);
        request.setLongitude(127.0557);
        request.setMemo("주말에 방문");
        request.setOriginalUrl("https://www.instagram.com/p/test");
        request.setPlatform(Platform.INSTAGRAM);
        request.setTitle("성수 팝업 스토어");
        request.setThumbnailUrl("https://image.example.com/thumb.jpg");
        return request;
    }

    private User 사용자_저장() {
        return userRepository.save(User.builder()
                .email("tester" + System.nanoTime() + "@example.com")
                .nickname("테스터")
                .password("password")
                .build());
    }

    private SavedPlace 장소_저장(User user) {
        SavedPlace savedPlace = savedPlaceRepository.save(SavedPlace.builder()
                .user(user)
                .name("성수 팝업")
                .address("서울 성동구 성수동")
                .latitude(37.5444)
                .longitude(127.0557)
                .memo("주말에 방문")
                .visitStatus(VisitStatus.WANT)
                .build());

        sourceLinkRepository.save(SourceLink.builder()
                .savedPlace(savedPlace)
                .originalUrl("https://www.instagram.com/p/test")
                .platform(Platform.INSTAGRAM)
                .title("성수 팝업 스토어")
                .thumbnailUrl("https://image.example.com/thumb.jpg")
                .build());
        return savedPlace;
    }

    private String 인증_헤더(User user) {
        return "Bearer " + jwtTokenProvider.createAccessToken(user.getId());
    }
}
