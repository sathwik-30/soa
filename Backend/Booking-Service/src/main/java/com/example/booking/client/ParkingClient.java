package com.example.booking.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.example.booking.dto.ParkingSlotResponse;

@FeignClient(name = "parking-service")
public interface ParkingClient {

    @GetMapping("/parking/slots/{id}")
    ParkingSlotResponse getParkingSlot(@PathVariable Long id);

    @PutMapping("/parking/slots/{id}/availability")
    ParkingSlotResponse updateAvailability(
            @PathVariable Long id,
            @RequestParam boolean available);
}