package com.jiwoo.pincloud.domain.link;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SourceLinkRepository extends JpaRepository<SourceLink, Long> {

  Optional<SourceLink> findBySavedPlaceId(Long savedPlaceId);

  List<SourceLink> findAllBySavedPlaceIdIn(Collection<Long> savedPlaceIds);
}
