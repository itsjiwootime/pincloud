package com.jiwoo.pincloud.domain.link;

import com.jiwoo.pincloud.external.KakaoPlaceClient;
import com.jiwoo.pincloud.external.KakaoPlaceResult;
import com.jiwoo.pincloud.external.LlmExtractionResult;
import com.jiwoo.pincloud.external.LlmPlaceCandidate;
import com.jiwoo.pincloud.external.OgTagExtractor;
import com.jiwoo.pincloud.external.OgTagResult;
import com.jiwoo.pincloud.external.OpenAiClient;
import com.jiwoo.pincloud.external.PlaceCandidate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

@ExtendWith(MockitoExtension.class)
class LinkExtractServiceTest {

    @Mock
    private KakaoPlaceClient kakaoPlaceClient;

    @Mock
    private OgTagExtractor ogTagExtractor;

    @Mock
    private OpenAiClient openAiClient;

    @InjectMocks
    private LinkExtractService linkExtractService;

    @Test
    void extract_인스타그램_URL이면_INSTAGRAM을_반환한다() {
        // given
        String url = "https://www.instagram.com/p/test";
        given(ogTagExtractor.extract(url)).willReturn(ogTag("인스타 게시물"));
        given(openAiClient.extractPlaces("인스타 게시물", null)).willReturn(emptyLlmResult());

        // when
        LinkExtractResult result = linkExtractService.extract(url);

        // then
        assertThat(result.getPlatform()).isEqualTo(Platform.INSTAGRAM);
    }

    @Test
    void extract_유튜브_URL이면_YOUTUBE를_반환한다() {
        // given
        String url = "https://youtu.be/test";
        given(ogTagExtractor.extract(url)).willReturn(ogTag("유튜브 영상"));
        given(openAiClient.extractPlaces("유튜브 영상", null)).willReturn(emptyLlmResult());

        // when
        LinkExtractResult result = linkExtractService.extract(url);

        // then
        assertThat(result.getPlatform()).isEqualTo(Platform.YOUTUBE);
    }

    @Test
    void extract_네이버_블로그_URL이면_BLOG를_반환한다() {
        // given
        String url = "https://blog.naver.com/test";
        given(ogTagExtractor.extract(url)).willReturn(ogTag("블로그 글"));
        given(openAiClient.extractPlaces("블로그 글", null)).willReturn(emptyLlmResult());

        // when
        LinkExtractResult result = linkExtractService.extract(url);

        // then
        assertThat(result.getPlatform()).isEqualTo(Platform.BLOG);
    }

    @Test
    void extract_일반_URL이면_OTHER를_반환한다() {
        // given
        String url = "https://example.com/place";
        given(ogTagExtractor.extract(url)).willReturn(ogTag("일반 링크"));
        given(openAiClient.extractPlaces("일반 링크", null)).willReturn(emptyLlmResult());

        // when
        LinkExtractResult result = linkExtractService.extract(url);

        // then
        assertThat(result.getPlatform()).isEqualTo(Platform.OTHER);
    }

    @Test
    void extract_카카오_API_매칭에_성공하면_매칭된_후보를_반환한다() {
        // given
        String url = "https://example.com/place";
        KakaoPlaceResult kakaoPlaceResult = KakaoPlaceResult.builder()
                .name("성수 팝업")
                .address("서울 성동구 성수동")
                .latitude(37.5444)
                .longitude(127.0557)
                .build();
        given(ogTagExtractor.extract(url)).willReturn(ogTag("성수 팝업"));
        given(openAiClient.extractPlaces("성수 팝업", null))
                .willReturn(llmResultWithCandidate(llmCandidate("성수 팝업")));
        given(kakaoPlaceClient.searchPlace("성수 팝업")).willReturn(kakaoPlaceResult);

        // when
        LinkExtractResult result = linkExtractService.extract(url);

        // then
        PlaceCandidate candidate = result.getTopCandidates().getFirst();
        assertThat(result.hasCandidates()).isTrue();
        assertThat(candidate.isKakaoMatched()).isTrue();
        assertThat(candidate.getMatchedName()).isEqualTo("성수 팝업");
        assertThat(candidate.getAddress()).isEqualTo("서울 성동구 성수동");
        assertThat(candidate.getLatitude()).isEqualTo(37.5444);
        assertThat(candidate.getLongitude()).isEqualTo(127.0557);
        then(kakaoPlaceClient).should().searchPlace("성수 팝업");
    }

    @Test
    void extract_카카오_API_반환이_null이면_미매칭_후보를_반환한다() {
        // given
        String url = "https://example.com/place";
        given(ogTagExtractor.extract(url)).willReturn(ogTag("성수 팝업"));
        given(openAiClient.extractPlaces("성수 팝업", null))
                .willReturn(llmResultWithCandidate(llmCandidate("성수 팝업")));
        given(kakaoPlaceClient.searchPlace("성수 팝업")).willReturn(null);

        // when
        LinkExtractResult result = linkExtractService.extract(url);

        // then
        PlaceCandidate candidate = result.getTopCandidates().getFirst();
        assertThat(result.hasCandidates()).isTrue();
        assertThat(candidate.isKakaoMatched()).isFalse();
        assertThat(candidate.getMatchedName()).isNull();
        assertThat(candidate.getLatitude()).isNull();
        assertThat(candidate.getLongitude()).isNull();
    }

    private OgTagResult ogTag(String title) {
        return OgTagResult.builder()
                .title(title)
                .thumbnailUrl("https://image.example.com/thumb.jpg")
                .build();
    }

    private LlmExtractionResult emptyLlmResult() {
        return LlmExtractionResult.builder()
                .contentType(ContentType.REVIEW_REQUIRED)
                .candidates(List.of())
                .build();
    }

    private LlmExtractionResult llmResultWithCandidate(LlmPlaceCandidate candidate) {
        return LlmExtractionResult.builder()
                .contentType(ContentType.SINGLE_PLACE)
                .candidates(List.of(candidate))
                .build();
    }

    private LlmPlaceCandidate llmCandidate(String rawName) {
        return LlmPlaceCandidate.builder()
                .rawName(rawName)
                .normalizedName(rawName)
                .searchQueries(List.of(rawName))
                .build();
    }
}
