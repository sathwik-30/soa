package com.example.parking.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.parking.entity.ParkingSlot;
import com.example.parking.service.ParkingSlotService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/parking/slots")
public class ParkingSlotController {
    private final ParkingSlotService service;

    public ParkingSlotController(ParkingSlotService service) {
        this.service = service;
    }

    @GetMapping
    public List<ParkingSlot> getAllSlots() {
        return service.getAllSlots();
    }

    @GetMapping("/{id}")
    public ParkingSlot getSlot(@PathVariable Long id) {
        return service.getSlot(id);
    }

    @PostMapping
    public ResponseEntity<ParkingSlot> createSlot(@Valid @RequestBody ParkingSlot slot) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.createSlot(slot));
    }

    @PutMapping("/{id}/availability")
    public ParkingSlot updateAvailability(
            @PathVariable Long id,
            @RequestParam("available") boolean available) {
        return service.updateAvailability(id, available);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSlot(@PathVariable Long id) {
        service.deleteSlot(id);
        return ResponseEntity.noContent().build();
    }
}