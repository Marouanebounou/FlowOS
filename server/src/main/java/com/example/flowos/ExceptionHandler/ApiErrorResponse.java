package com.example.flowos.ExceptionHandler;

import java.util.Map;

public record ApiErrorResponse(String message, Map<String, String> errors) {
}
