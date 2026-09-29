package com.example.flowos.Utils;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

public final class PaginationUtils {
    public static final int DEFAULT_SIZE = 20;
    public static final int MAX_SIZE = 100;

    private PaginationUtils() {
    }

    public static Pageable normalize(Pageable pageable) {
        return normalize(pageable, DEFAULT_SIZE);
    }

    public static Pageable normalize(Pageable pageable, int defaultSize) {
        if (pageable == null || pageable.isUnpaged()) {
            return PageRequest.of(0, defaultSize);
        }
        int page = Math.max(0, pageable.getPageNumber());
        int size = pageable.getPageSize();
        if (size <= 0) {
            size = defaultSize;
        }
        size = Math.min(size, MAX_SIZE);
        return PageRequest.of(page, size, pageable.getSort());
    }
}
