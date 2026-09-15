package com.example.flowos.Repositories;

import com.example.flowos.Models.Module;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ModuleRepository extends JpaRepository<Module, Long> {
    Optional<Module> findByKey(String key);
}
