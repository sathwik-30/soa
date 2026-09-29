package com.example.billing.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestHeader;
import com.example.billing.entity.Bill;
import com.example.billing.service.BillingService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/billing")
public class BillingController {

    private final BillingService billingService;

    public BillingController(BillingService billingService) {
        this.billingService = billingService;
    }

    @PostMapping
    public ResponseEntity<Bill> createBill(
            @Valid @RequestBody Bill bill) {

        return ResponseEntity.ok(billingService.createBill(bill));
    }

    @GetMapping
    public ResponseEntity<List<Bill>> getAllBills() {
        return ResponseEntity.ok(billingService.getAllBills());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Bill> getBillById(@PathVariable Long id) {
        return ResponseEntity.ok(billingService.getBillById(id));
    }
    
    @GetMapping("/my")
    public ResponseEntity<List<Bill>> getMyBills(
            @RequestHeader("X-Username") String username) {

        return ResponseEntity.ok(
            billingService.getBillsByUsername(username)
        );
    }
}