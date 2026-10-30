package com.example.booking.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.example.booking.dto.BillingRequest;

@FeignClient(name = "billing-service")
public interface BillingClient {
    @PostMapping("/billing")
    Object createBill(@RequestBody BillingRequest request);

    @DeleteMapping("/billing/booking/{bookingId}")
    void deleteBillForBooking(@PathVariable("bookingId") Long bookingId);
}