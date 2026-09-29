package com.example.booking.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.example.booking.dto.BillingRequest;

@FeignClient(name = "billing-service")
public interface BillingClient {

    @PostMapping("/billing")
    Object createBill(
            @RequestBody BillingRequest request);
}