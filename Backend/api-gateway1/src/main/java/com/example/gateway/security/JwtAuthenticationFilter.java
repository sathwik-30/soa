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

        String path = exchange.getRequest().getURI().getPath();
        HttpMethod method = exchange.getRequest().getMethod();

        if (path.startsWith("/auth/")
                || path.startsWith("/actuator/")) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest()
                .getHeaders()
                .getFirst(HttpHeaders.AUTHORIZATION);

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return unauthorized(exchange);
        }

        String token = authHeader.substring(7);

        try {
            String username = jwtService.extractUsername(token);
            String role = jwtService.extractRole(token);

            if (username == null || role == null
                    || !jwtService.isTokenValid(token, username)) {
                return unauthorized(exchange);
            }

            role = role.toUpperCase();

            if (!isAllowed(path, method, role)) {
                return forbidden(exchange);
            }

            // Never trust a client-supplied identity header.
            ServerWebExchange modifiedExchange = exchange.mutate()
                    .request(request -> request.headers(headers -> {
                        headers.remove("X-Username");
                        headers.set("X-Username", username);
                    }))
                    .build();

            return chain.filter(modifiedExchange);
        } catch (Exception e) {
            return unauthorized(exchange);
        }
    }

    private boolean isAllowed(String path, HttpMethod method, String role) {
        boolean isAdmin = "ADMIN".equals(role);
        boolean isUser = "USER".equals(role);

        if (path.startsWith("/parking/")) {
            if (HttpMethod.GET.equals(method)) {
                return isUser || isAdmin;
            }
            if (HttpMethod.POST.equals(method)
                    || HttpMethod.PUT.equals(method)
                    || HttpMethod.DELETE.equals(method)) {
                return isAdmin;
            }
        }

        if (path.startsWith("/bookings")) {
            if (HttpMethod.POST.equals(method)) {
                return isUser || isAdmin;
            }
            if (HttpMethod.GET.equals(method)) {
                return isAdmin;
            }
        }

        if (path.startsWith("/billing")) {
            // Users may only access their own bills endpoint.
            if (HttpMethod.GET.equals(method)
                    && "/billing/my".equals(path)) {
                return isUser || isAdmin;
            }
            // Listing all bills or looking up a bill by ID is admin-only.
            if (HttpMethod.GET.equals(method)) {
                return isAdmin;
            }
            if (HttpMethod.POST.equals(method)
                    || HttpMethod.PUT.equals(method)
                    || HttpMethod.DELETE.equals(method)) {
                return isAdmin;
            }
        }

        return false;
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    private Mono<Void> forbidden(ServerWebExchange exchange) {
        exchange.getResponse().setStatusCode(HttpStatus.FORBIDDEN);
        return exchange.getResponse().setComplete();
    }
}