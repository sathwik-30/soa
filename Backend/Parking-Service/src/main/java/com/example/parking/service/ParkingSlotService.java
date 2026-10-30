package com.example.parking.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.example.parking.entity.ParkingSlot;
import com.example.parking.repository.ParkingSlotRepository;

@Service
public class ParkingSlotService {
    private final ParkingSlotRepository repository;

    public ParkingSlotService(ParkingSlotRepository repository) {
        this.repository = repository;
    }

    public List<ParkingSlot> getAllSlots() {
        return repository.findAll();
    }

    public ParkingSlot getSlot(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Parking slot not found"));
    }

    public ParkingSlot createSlot(ParkingSlot slot) {
        String number = slot.getSlotNumber().trim();
        if (repository.existsBySlotNumberIgnoreCase(number)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Slot number already exists");
        }
        slot.setSlotNumber(number);
        slot.setLocation(slot.getLocation().trim());
        slot.setAvailable(true);
        return repository.save(slot);
    }

    @Transactional
    public ParkingSlot updateAvailability(Long id, boolean available) {
        int changed = available ? repository.release(id) : repository.reserveIfAvailable(id);
        if (changed == 0) {
            if (!repository.existsById(id)) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Parking slot not found");
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Parking slot is not available");
        }
        return getSlot(id);
    }

    public void deleteSlot(Long id) {
        if (!repository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Parking slot not found");
        }
        repository.deleteById(id);
    }
}