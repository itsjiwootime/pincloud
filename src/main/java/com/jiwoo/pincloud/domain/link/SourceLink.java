package com.jiwoo.pincloud.domain.link;

import com.jiwoo.pincloud.domain.place.SavedPlace;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "source_links")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class SourceLink {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @OneToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "saved_place_id", nullable = false)
  private SavedPlace savedPlace;

  @Column(nullable = false, length = 2048)
  private String originalUrl;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Platform platform;

  @Column private String title;

  @Column(length = 2048)
  private String thumbnailUrl;

  @CreatedDate
  @Column(nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Builder
  public SourceLink(
      SavedPlace savedPlace,
      String originalUrl,
      Platform platform,
      String title,
      String thumbnailUrl) {
    this.savedPlace = savedPlace;
    this.originalUrl = originalUrl;
    this.platform = platform;
    this.title = title;
    this.thumbnailUrl = thumbnailUrl;
  }
}
