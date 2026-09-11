package com.example.flowos.Repositories;

import com.example.flowos.Models.BlacklistedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;

public interface BlacklistedTokenRepository extends JpaRepository<BlacklistedToken, Long> {
    boolean existsByToken(String token);

    @Modifying
    @Query("delete from BlacklistedToken token where token.expiresAt < :now")
    void deleteAllExpiredBefore(LocalDateTime now);
}
