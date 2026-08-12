# Contratos API

## Public Guest

```txt
GET    /public/services
GET    /public/availability?serviceIds=id1,id2&date=2026-08-20&staffId=optional
POST   /public/bookings
GET    /public/bookings/:publicToken/status
POST   /public/bookings/:publicToken/cancel
```

### POST /public/bookings

```json
{
  "clientName": "Maria Lopez",
  "phone": "3001234567",
  "serviceIds": ["uuid-1", "uuid-2"],
  "date": "2026-08-20",
  "startTime": "10:00",
  "notes": "Diseno frances",
  "idempotencyKey": "browser-generated-uuid",
  "website": ""
}
```

`website` es un honeypot. Debe llegar vacio.

## Sobre los precios

Los servicios no tienen precio y ninguna respuesta lo devuelve. La tarifa se
acuerda con cada clienta fuera del sistema. Las columnas `price`,
`total_price` y `price_snapshot` siguen en la base pero son nulas y no se leen
ni se escriben.

## Admin Protected

```txt
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me

GET    /admin/services
POST   /admin/services
PATCH  /admin/services/:id
DELETE /admin/services/:id

GET    /admin/bookings?scope=active|today|all&date=2026-08-20
PATCH  /admin/bookings/:id/status

GET    /admin/availability
PUT    /admin/business-hours
POST   /admin/availability/blocks
DELETE /admin/availability/blocks/:id
```
