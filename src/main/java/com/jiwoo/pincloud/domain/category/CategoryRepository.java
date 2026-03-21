package com.jiwoo.pincloud.domain.category;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Long> {

  List<Category> findAllByUserId(Long userId);

  Optional<Category> findByUserIdAndName(Long userId, String name);

  boolean existsByUserIdAndName(Long userId, String name);
}
