package com.example.booking.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.booking.entity.Booking;

public interface BookingRepository extends JpaRepository<Booking, Long> {

}