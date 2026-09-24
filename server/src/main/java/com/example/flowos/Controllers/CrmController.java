package com.example.flowos.Controllers;

import com.example.flowos.Dto.CrmContactRequest;
import com.example.flowos.Dto.CrmContactResponse;
import com.example.flowos.Services.CrmService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/organisations/{organisationId}/crm")
@RequiredArgsConstructor
public class CrmController {
    private final CrmService crmService;

    @GetMapping
    public ResponseEntity<List<CrmContactResponse>> list(
        Authentication authentication,
        @PathVariable Long organisationId,
        @RequestParam(required = false) Long teamId
    ) {
        return ResponseEntity.ok(crmService.list(authentication.getName(), organisationId, teamId));
    }

    @PostMapping
    public ResponseEntity<CrmContactResponse> create(
        Authentication authentication,
        @PathVariable Long organisationId,
        @Valid @RequestBody CrmContactRequest req,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.status(HttpStatus.CREATED).body(crmService.create(authentication.getName(), organisationId, req, httpRequest.getRemoteAddr()));
    }

    @PutMapping("/{contactId}")
    public ResponseEntity<CrmContactResponse> update(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long contactId,
        @Valid @RequestBody CrmContactRequest req,
        HttpServletRequest httpRequest
    ) {
        return ResponseEntity.ok(crmService.update(authentication.getName(), organisationId, contactId, req, httpRequest.getRemoteAddr()));
    }

    @DeleteMapping("/{contactId}")
    public ResponseEntity<Void> delete(
        Authentication authentication,
        @PathVariable Long organisationId,
        @PathVariable Long contactId,
        HttpServletRequest httpRequest
    ) {
        crmService.delete(authentication.getName(), organisationId, contactId, httpRequest.getRemoteAddr());
        return ResponseEntity.noContent().build();
    }
}
