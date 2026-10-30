# ParkGrid backend

## Services and ports

| Component | Port |
|---|---:|
| API Gateway | 8080 |
| Auth Service | 8081 |
| Booking Service | 8083 |
| Billing Service | 8084 |
| Parking Service | 8085 |
| Eureka Server | 8761 |

All application services use the existing PostgreSQL database configured by `DB_URL`. The default URL is `jdbc:postgresql://localhost:5432/parkgrid_auth`; each service owns its own tables.

## Required environment variables

Set these variables on the machine running the services. Auth Service and API Gateway MUST use the exact same JWT secret.

- `DB_PASSWORD`: password for the PostgreSQL user.
- `JWT_SECRET`: random secret of at least 32 bytes. Do not commit it.
- Optional: `DB_URL`, `DB_USERNAME`, `JWT_EXPIRATION_MS`, `EUREKA_URL`.

### Windows CMD (one-time setup)

Open CMD and run the following, replacing the password and secret with your own values:

```cmd
setx DB_USERNAME "postgres"
setx DB_PASSWORD "YOUR_POSTGRES_PASSWORD"
setx DB_URL "jdbc:postgresql://localhost:5432/parkgrid_auth"
setx JWT_SECRET "REPLACE_WITH_A_RANDOM_SECRET_AT_LEAST_32_CHARACTERS_LONG"
setx JWT_EXPIRATION_MS "3600000"
setx EUREKA_URL "http://localhost:8761/eureka/"
```

Close and reopen every terminal after using `setx`. The JWT secret must be identical for Auth Service and API Gateway. Rotating it invalidates previously issued tokens, so log in again after deployment.

## Start order

Ensure PostgreSQL is running and the `parkgrid_auth` database exists. From separate terminals, start:

1. `Eurekaserver2`
2. `Auth-Service`
3. `Parking-Service`
4. `Booking-Service`
5. `Billing-Service`
6. `api-gateway1`

Example for each service (run inside that service folder):

```cmd
mvnw.cmd spring-boot:run
```

The API Gateway is the frontend entry point at `http://localhost:8080`. Eureka dashboard: `http://localhost:8761`.

## Parking API (through Gateway)

- `GET /parking/slots`
- `GET /parking/slots/{id}`
- `POST /parking/slots` (ADMIN)
- `PUT /parking/slots/{id}/availability?available=true|false` (ADMIN through Gateway; internal Booking Service call uses service discovery)
- `DELETE /parking/slots/{id}` (ADMIN)

Create-slot JSON:

```json
{
  "slotNumber": "A-01",
  "location": "Ground Floor",
  "available": true
}
```

The service always creates new slots as available. Slot numbers are unique (case-insensitive check). Reservation uses a conditional database update so two simultaneous booking requests cannot reserve the same available slot.

## Booking consistency

Booking Service reserves the parking slot first, then persists the booking and creates the bill. If a later step fails, it attempts compensating actions: delete any bill, delete the booking, and release the slot. This is a small synchronous Saga/compensation flow, not a distributed ACID transaction. Monitor and reconcile failed compensations in production.

Billing creation is idempotent by booking ID and the database enforces uniqueness.

## Security notes

- Public registration always creates USER accounts. Provision ADMIN users out-of-band.
- Users can read only `GET /billing/my`; all-bills and bill-by-ID reads are ADMIN-only at the Gateway.
- Booking ownership is derived from the JWT-verified `X-Username` header inserted by the Gateway.
- Keep service ports private in deployed environments. Internal Feign endpoints, including the billing compensation endpoint, must not be exposed directly to untrusted networks.
- Do not commit secrets or production database credentials.

## Verification

Build each service with `mvnw.cmd test` from its service folder. Then run the services and test registration, login, slot listing, slot creation (ADMIN), booking, bill generation, and user bill listing through the Gateway.
