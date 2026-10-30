package com.example.parking.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.example.parking.entity.ParkingSlot;
import com.example.parking.repository.ParkingSlotRepository;

@ExtendWith(MockitoExtension.class)
class ParkingSlotServiceTest {
    @Mock
    private ParkingSlotRepository repository;

    @InjectMocks
    private ParkingSlotService service;

    @Test
    void reservesAnAvailableSlot() {
        ParkingSlot slot = new ParkingSlot("A-01", "Ground Floor", false);
        when(repository.reserveIfAvailable(1L)).thenReturn(1);
        when(repository.findById(1L)).thenReturn(Optional.of(slot));

        ParkingSlot result = service.updateAvailability(1L, false);

        assertEquals("A-01", result.getSlotNumber());
        verify(repository).reserveIfAvailable(1L);
    }

    @Test
    void rejectsAlreadyReservedSlot() {
        when(repository.reserveIfAvailable(1L)).thenReturn(0);
        when(repository.existsById(1L)).thenReturn(true);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.updateAvailability(1L, false)
        );

        assertEquals(HttpStatus.CONFLICT, exception.getStatusCode());
    }

    @Test
    void returnsNotFoundForUnknownSlot() {
        when(repository.reserveIfAvailable(99L)).thenReturn(0);
        when(repository.existsById(99L)).thenReturn(false);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> service.updateAvailability(99L, false)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatusCode());
    }
}