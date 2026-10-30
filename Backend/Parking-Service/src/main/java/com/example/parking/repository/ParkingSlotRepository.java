package com.example.parking.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.parking.entity.ParkingSlot;

public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Long> {
    boolean existsBySlotNumberIgnoreCase(String slotNumber);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update ParkingSlot p set p.available = false where p.id = :id and p.available = true")
    int reserveIfAvailable(@Param("id") Long id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update ParkingSlot p set p.available = true where p.id = :id")
    int release(@Param("id") Long id);
}