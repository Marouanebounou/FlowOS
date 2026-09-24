package com.example.flowos.Controllers;

import com.example.flowos.Dto.DocumentRequest;
import com.example.flowos.Dto.DocumentResponse;
import com.example.flowos.Services.DocumentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/organisations/{organisationId}/documents")
@RequiredArgsConstructor
public class DocumentController {
    private final DocumentService documentService;

    @GetMapping
    public ResponseEntity<List<DocumentResponse>> list(
        Authentication authentication,
        @PathVariable Long organisationId,
        @RequestParam(required = false) Long teamId
    ) {
        return ResponseEntity.ok(documentService.list(authentication.getName(), organisationId, teamId));
    }

    @PostMapping
    public ResponseEntity<DocumentResponse> create(
        Authentication authentication,
        @PathVariable Long organisationId,
        @Valid @RequestBody DocumentRequest req,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(documentService.create(authentication.getName(), organisationId, req, httpRequest.getRemoteAddr()));
    }

    @PutMapping("/{documentId}")
    public ResponseEntity<DocumentResponse> update(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long documentId,
        @Valid @RequestBody DocumentRequest req,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(documentService.update(authentication.getName(), organisationId, documentId, req, httpRequest.getRemoteAddr()));
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> delete(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long documentId,
        HttpServletRequest httpRequest
    ) {
        documentService.delete(authentication.getName(), organisationId, documentId, httpRequest.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }
}
