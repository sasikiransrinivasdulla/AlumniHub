package com.alumnihub.exception;

import lombok.Getter;

@Getter
public class InTouchException extends RuntimeException {
    private final String code;

    public InTouchException(String message, String code) {
        super(message);
        this.code = code;
    }
}
