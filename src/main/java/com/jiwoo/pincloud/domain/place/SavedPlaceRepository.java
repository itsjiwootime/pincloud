package com.jiwoo.pincloud.domain.place;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface SavedPlaceRepository extends JpaRepository<SavedPlace, Long> {

    List<SavedPlace> findAllByUserId(Long userId);

    List<SavedPlace> findAllByCategoryId(Long categoryId);

    Optional<SavedPlace> findByIdAndUserId(Long id, Long userId);

    @Query("""
            SELECT sp
            FROM SavedPlace sp
            WHERE sp.user.id = :userId
            AND sp.latitude BETWEEN :minLat AND :maxLat
            AND sp.longitude BETWEEN :minLng AND :maxLng
            """)
    List<SavedPlace> findByUserIdAndBbox(
            @Param("userId") Long userId,
            @Param("minLat") Double minLat,
            @Param("maxLat") Double maxLat,
            @Param("minLng") Double minLng,
            @Param("maxLng") Double maxLng
    );
}
