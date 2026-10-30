package com.example.parking.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "parking_slots")
public class ParkingSlot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Slot number is required")
    @Column(nullable = false, unique = true)
    private String slotNumber;

    @NotBlank(message = "Location is required")
    @Column(nullable = false)
    private String location;

    @Column(nullable = false)
    private boolean available = true;

    public ParkingSlot() {}

    public ParkingSlot(String slotNumber, String location, boolean available) {
        this.slotNumber = slotNumber;
        this.location = location;
        this.available = available;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getSlotNumber() { return slotNumber; }
    public void setSlotNumber(String slotNumber) { this.slotNumber = slotNumber; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }
}