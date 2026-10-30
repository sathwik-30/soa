package com.example.booking.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.example.booking.client.BillingClient;
import com.example.booking.client.ParkingClient;
import com.example.booking.dto.BillingRequest;
import com.example.booking.entity.Booking;
import com.example.booking.repository.BookingRepository;

@Service
public class BookingService {
    private final BookingRepository bookingRepository;
    private final ParkingClient parkingClient;
    private final BillingClient billingClient;

    public BookingService(BookingRepository bookingRepository,
                          ParkingClient parkingClient,
                          BillingClient billingClient) {
        this.bookingRepository = bookingRepository;
        this.parkingClient = parkingClient;
        this.billingClient = billingClient;
    }

    public Booking createBooking(Booking booking) {
        // Parking Service reserves the slot atomically before this service
        // creates a booking, preventing two requests from taking one slot.
        parkingClient.updateAvailability(booking.getParkingSlotId(), false);

        Booking savedBooking = null;
        try {
            booking.setStatus("BOOKED");
            savedBooking = bookingRepository.save(booking);

            BillingRequest billingRequest = new BillingRequest(
                    savedBooking.getId(),
                    savedBooking.getUsername(),
                    1000.0
            );
            billingClient.createBill(billingRequest);
            return savedBooking;
        } catch (RuntimeException failure) {
            if (savedBooking != null && savedBooking.getId() != null) {
                try {
                    billingClient.deleteBillForBooking(savedBooking.getId());
                } catch (RuntimeException cleanupFailure) {
                    failure.addSuppressed(cleanupFailure);
                }
                try {
                    bookingRepository.deleteById(savedBooking.getId());
                } catch (RuntimeException cleanupFailure) {
                    failure.addSuppressed(cleanupFailure);
                }
            }

            try {
                parkingClient.updateAvailability(booking.getParkingSlotId(), true);
            } catch (RuntimeException cleanupFailure) {
                failure.addSuppressed(cleanupFailure);
            }

            throw new IllegalStateException(
                    "Booking failed. Compensation was attempted for the bill, booking, and parking slot.",
                    failure
            );
        }
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }
}