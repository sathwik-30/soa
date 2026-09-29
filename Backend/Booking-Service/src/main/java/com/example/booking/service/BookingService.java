package com.example.booking.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.booking.client.BillingClient;
import com.example.booking.client.ParkingClient;
import com.example.booking.dto.BillingRequest;
import com.example.booking.dto.ParkingSlotResponse;
import com.example.booking.entity.Booking;
import com.example.booking.repository.BookingRepository;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ParkingClient parkingClient;
    private final BillingClient billingClient;

    public BookingService(
            BookingRepository bookingRepository,
            ParkingClient parkingClient,
            BillingClient billingClient) {

        this.bookingRepository = bookingRepository;
        this.parkingClient = parkingClient;
        this.billingClient = billingClient;
    }

    public Booking createBooking(Booking booking) {

        // 1. Check parking slot
        ParkingSlotResponse slot =
                parkingClient.getParkingSlot(
                        booking.getParkingSlotId()
                );

        // 2. Check availability
        if (!slot.isAvailable()) {
            throw new RuntimeException(
                    "Parking slot is not available"
            );
        }

        // 3. Set booking status
        booking.setStatus("BOOKED");

        // 4. Save booking
        Booking savedBooking =
                bookingRepository.save(booking);

        // 5. Make parking slot unavailable
        parkingClient.updateAvailability(
                booking.getParkingSlotId(),
                false
        );

        // 6. Automatically create billing record
        BillingRequest billingRequest =
                new BillingRequest(
                        savedBooking.getId(),
                        savedBooking.getUsername(),
                        1000.0
                );

        billingClient.createBill(
                billingRequest
        );

        // 7. Return booking
        return savedBooking;
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }
}