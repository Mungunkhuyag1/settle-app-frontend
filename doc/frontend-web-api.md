# Frontend Web API Guide

Энэ документ нь frontend web хөгжүүлэлтэд зориулсан нэгтгэсэн API гарын авлага.

Base URL:

```txt
http://localhost:3002/api/v1
```

Auth header:

```http
Authorization: Bearer <jwt-access-token>
```

## 1. Ерөнхий frontend flow

1. Хэрэглэгч `sign-up` эсвэл `sign-in` хийнэ
2. Frontend `accessToken`-ийг хадгална
3. Хамгаалагдсан бүх хүсэлт дээр `Authorization` header явуулна
4. Эхний ачаалал дээр `GET /auth/me`
5. Дараа нь:
   - `GET /groups`
   - `GET /users/me/balances`
   - шаардлагатай үед `GET /users/me/expenses`
   - шаардлагатай үед `GET /users/me/settlements`

## 2. Auth

### `POST /auth/sign-up`

Request:

```json
{
  "email": "bataa@mezorn.com",
  "password": "StrongPass123",
  "firstName": "Батаа",
  "lastName": "Батболд"
}
```

Response:

```json
{
  "accessToken": "jwt-token",
  "tokenType": "Bearer",
  "expiresIn": "7d",
  "user": {
    "id": "uuid",
    "email": "bataa@mezorn.com",
    "firstName": "Батаа",
    "lastName": "Батболд",
    "imageUrl": null,
    "lastSeenAt": "2026-04-01T03:35:00.000Z",
    "createdAt": "2026-04-01T03:00:00.000Z",
    "updatedAt": "2026-04-01T03:35:00.000Z"
  }
}
```

### `POST /auth/sign-in`

Request:

```json
{
  "email": "bataa@mezorn.com",
  "password": "StrongPass123"
}
```

Response:
- `sign-up`-тай ижил

### `GET /auth/me`

Зорилго:
- token хүчинтэй эсэх шалгах
- нэвтэрсэн хэрэглэгчийн профайл авах

## 3. Current User

### `GET /users/me`

Зорилго:
- profile page дээр өөрийн профайл авах

### `PATCH /users/me`

Request:

```json
{
  "firstName": "Батаа",
  "lastName": "Б",
  "imageUrl": "https://cdn.example.com/avatar.png"
}
```

### `GET /users/me/expenses`

Зорилго:
- өөрийн оролцсон эсвэл төлсөн expense-үүдийг timeline байдлаар авах

### `GET /users/me/settlements`

Зорилго:
- өөртэй холбоотой settlement-үүдийг авах

### `GET /users/me/balances`

Зорилго:
- group бүр дээрх өөрийн balance-ийг dashboard дээр харуулах

Response санаа:

```json
[
  {
    "groupId": "group-1",
    "groupName": "Lunch Team",
    "groupDescription": "Мезорны өдрийн хоолны групп",
    "myRole": "owner",
    "memberCount": 4,
    "netBalance": 24000,
    "receivables": [
      {
        "userId": "user-2",
        "email": "ganaa@mezorn.com",
        "firstName": "Ганаа",
        "lastName": null,
        "amount": 15000
      }
    ],
    "payables": []
  }
]
```

## 4. Groups

### `GET /groups`

Зорилго:
- sidebar, group list page, home screen дээр харуулах

### `POST /groups`

Request:

```json
{
  "name": "Lunch Team",
  "description": "Мезорны өдрийн хоолны групп"
}
```

### `GET /groups/:groupId`

Зорилго:
- group detail screen

### `GET /groups/:groupId/members`

Зорилго:
- members tab

### `POST /groups/:groupId/members`

Request:

```json
{
  "userId": "user-uuid"
}
```

### `DELETE /groups/:groupId/members/:userId`

Зорилго:
- owner хэрэглэгч member remove хийх

## 5. Expenses

### `GET /groups/:groupId/expenses`

Зорилго:
- group expense list screen

### `POST /groups/:groupId/expenses`

Request:

```json
{
  "title": "KFC lunch",
  "description": "4 хүн хамт хооллосон",
  "paidByUserId": "user-1",
  "totalAmount": 42000,
  "currency": "MNT",
  "expenseDate": "2026-04-01",
  "participants": [
    {
      "userId": "user-1",
      "shareAmount": 12000
    },
    {
      "userId": "user-2",
      "shareAmount": 15000
    },
    {
      "userId": "user-3",
      "shareAmount": 9000
    },
    {
      "userId": "user-4",
      "shareAmount": 6000
    }
  ]
}
```

## 6. Balances

### `GET /groups/:groupId/balances`

Зорилго:
- group balance screen
- member бүрийн `netBalance`
- member бүрийн `receivables`
- member бүрийн `payables`
- `pairwiseSettlements`

Response санаа:

```json
{
  "members": [
    {
      "userId": "user-1",
      "email": "bataa@mezorn.com",
      "firstName": "Батаа",
      "lastName": null,
      "netBalance": 24000,
      "receivables": [
        {
          "userId": "user-2",
          "email": "ganaa@mezorn.com",
          "firstName": "Ганаа",
          "lastName": null,
          "amount": 15000
        },
        {
          "userId": "user-3",
          "email": "bayaraa@mezorn.com",
          "firstName": "Баяраа",
          "lastName": null,
          "amount": 9000
        }
      ],
      "payables": []
    }
  ],
  "pairwiseSettlements": [
    {
      "fromUserId": "user-2",
      "fromUserEmail": "ganaa@mezorn.com",
      "toUserId": "user-1",
      "toUserEmail": "bataa@mezorn.com",
      "amount": 15000
    },
    {
      "fromUserId": "user-3",
      "fromUserEmail": "bayaraa@mezorn.com",
      "toUserId": "user-1",
      "toUserEmail": "bataa@mezorn.com",
      "amount": 9000
    }
  ]
}
```

## 7. Settlements

### `GET /groups/:groupId/settlements`

Зорилго:
- group settlement history screen

### `POST /groups/:groupId/settlements`

Request:

```json
{
  "fromUserId": "user-2",
  "toUserId": "user-1",
  "amount": 15000,
  "currency": "MNT",
  "settledAt": "2026-04-01T12:30:00.000Z",
  "note": "Сарын эцсийн тооцоо"
}
```

## 8. Frontend-д анхаарах зүйл

- `401` ирвэл token хүчингүй болсон гэж үзээд sign-in руу буцаах
- `403` ирвэл тухайн group-ийн эрхгүй гэж үзэх
- `400` ирвэл form validation message болгон харуулах
- мөнгөн дүнг frontend дээр `MNT` форматтай харуулах
- pairwise өрийн жагсаалтыг settlement хийх screen дээр шууд ашиглаж болно
