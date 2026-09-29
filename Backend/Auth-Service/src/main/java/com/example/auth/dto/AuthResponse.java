package com.example.auth.dto;

public class AuthResponse {

    private String username;
    private String role;
    private String message;

    public AuthResponse(String username, String role, String message) {
        this.username = username;
        this.role = role;
        this.message = message;
    }

    public String getUsername() {
        return username;
    }

    public String getRole() {
        return role;
    }

    public String getMessage() {
        return message;
    }
}