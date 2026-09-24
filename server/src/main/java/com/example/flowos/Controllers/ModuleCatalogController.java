package com.example.flowos.Controllers;

import com.example.flowos.Dto.ModuleResponse;
import com.example.flowos.Services.ModuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/modules")
@RequiredArgsConstructor
public class ModuleCatalogController {
    private final ModuleService moduleService;

    @GetMapping
    public ResponseEntity<List<ModuleResponse>> catalog(Authentication authentication) {
        return ResponseEntity.ok(moduleService.catalog(authentication.getName()));
    }
}
