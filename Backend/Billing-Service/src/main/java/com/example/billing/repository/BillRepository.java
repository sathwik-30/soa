package com.example.billing.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.billing.entity.Bill;

public interface BillRepository extends JpaRepository<Bill, Long> {
    List<Bill> findByUsername(String username);
    Optional<Bill> findByBookingId(Long bookingId);
    void deleteByBookingId(Long bookingId);
}