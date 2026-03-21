package com.jiwoo.pincloud.domain.user;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

  Optional<User> findByEmail(String email);

  Optional<User> findByKakaoId(String kakaoId);

  boolean existsByEmail(String email);
}
