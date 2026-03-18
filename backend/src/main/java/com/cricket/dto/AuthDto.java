package com.cricket.dto;

import lombok.Data;

public class AuthDto {

    @Data
    public static class RegisterRequest {
        private String email;
        private String password;
    }

    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private String email;

        public AuthResponse(String token, String email) {
            this.token = token;
            this.email = email;
        }
    }
}
