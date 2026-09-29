package com.example.gateway.security;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;

import org.springframework.web.server.ServerWebExchange;

import reactor.core.publisher.Mono;

@Component
public class JwtAuthenticationFilter implements GlobalFilter {

    private final JwtService jwtService;

    public JwtAuthenticationFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public Mono<Void> filter(
            ServerWebExchange exchange,
            GatewayFilterChain chain) {

        String path = exchange.getRequest()
                .getURI()
                .getPath();

        HttpMethod method = exchange.getRequest()
                .getMethod();

        // Public endpoints
        if (path.startsWith("/auth/")
                || path.startsWith("/actuator/")) {
            return chain.filter(exchange);
        }

        // Get Authorization header
        String authHeader = exchange.getRequest()
                .getHeaders()
                .getFirst(HttpHeaders.AUTHORIZATION);

        // JWT required
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return unauthorized(exchange);
        }

        String token = authHeader.substring(7);

        try {

            String username = jwtService.extractUsername(token);
            String role = jwtService.extractRole(token);

            if (username == null || role == null) {
                return unauthorized(exchange);
            }

            // Validate JWT
            if (!jwtService.isTokenValid(token, username)) {
                return unauthorized(exchange);
            }

            role = role.toUpperCase();

            // Check role permission
            if (!isAllowed(path, method, role)) {
                return forbidden(exchange);
            }

            // JWT + role are valid
            ServerWebExchange modifiedExchange =
                    exchange.mutate()
                            .request(request -> request
                                    .header("X-Username", username))
                            .build();

            return chain.filter(modifiedExchange);

        } catch (Exception e) {
            return unauthorized(exchange);
        }
    }

    private boolean isAllowed(
            String path,
            HttpMethod method,
            String role) {

        boolean isAdmin = "ADMIN".equals(role);
        boolean isUser = "USER".equals(role);

        // =========================
        // PARKING
        // =========================
        if (path.startsWith("/parking/")) {

            // USER + ADMIN can view parking
            if (HttpMethod.GET.equals(method)) {
                return isUser || isAdmin;
            }

            // Only ADMIN can modify parking
            if (HttpMethod.POST.equals(method)
                    || HttpMethod.PUT.equals(method)
                    || HttpMethod.DELETE.equals(method)) {
                return isAdmin;
            }
        }

        // =========================
        // BOOKINGS
        // =========================
        if (path.startsWith("/bookings")) {

            // USER + ADMIN can create booking
            if (HttpMethod.POST.equals(method)) {
                return isUser || isAdmin;
            }

            // Only ADMIN can view all bookings
            if (HttpMethod.GET.equals(method)) {
                return isAdmin;
            }
        }

        // =========================
        // BILLING
        // =========================
        if (path.startsWith("/billing")) {

            // USER + ADMIN can view bills
            if (HttpMethod.GET.equals(method)) {
                return isUser || isAdmin;
            }

            // Only ADMIN can create/modify bills
            if (HttpMethod.POST.equals(method)
                    || HttpMethod.PUT.equals(method)
                    || HttpMethod.DELETE.equals(method)) {
                return isAdmin;
            }
        }

        return false;
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange) {

        exchange.getResponse()
                .setStatusCode(HttpStatus.UNAUTHORIZED);

        return exchange.getResponse().setComplete();
    }

    private Mono<Void> forbidden(ServerWebExchange exchange) {

        exchange.getResponse()
                .setStatusCode(HttpStatus.FORBIDDEN);

        return exchange.getResponse().setComplete();
    }
}