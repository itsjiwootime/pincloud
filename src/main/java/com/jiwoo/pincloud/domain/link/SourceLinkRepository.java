package com.jiwoo.pincloud.domain.link;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface SourceLinkRepository extends JpaRepository<SourceLink, Long> {

    Optional<SourceLink> findBySavedPlaceId(Long savedPlaceId);

    List<SourceLink> findAllBySavedPlaceIdIn(Collection<Long> savedPlaceIds);
}
