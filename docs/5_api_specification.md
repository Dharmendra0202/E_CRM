# API Specification
## Project Name: Educational E-CRM & Classes Management System

---

## 1. Document Control
*   **Version**: 1.0.0
*   **Status**: Draft
*   **Authors**: Antigravity AI & Dharmendra

---

## 2. API Global Conventions

*   **Protocol**: HTTPS
*   **Base URL**: `https://api.yourdomain.com/api/v1` (Production) / `http://localhost:5000/api/v1` (Development)
*   **Content Type**: `application/json` (Request & Response)
*   **Authentication**: Bearer Authorization Header (`Authorization: Bearer <JWT_ACCESS_TOKEN>`)
*   **Standard Error Format**:
    ```json
    {
      "status": "error",
      "code": "INVALID_PARAMETERS",
      "message": "Validation failed: 'email' must be a valid email address.",
      "details": []
    }
    ```

---

## 3. Route Groups & Specification

### 3.1. Authentication Module (`/auth`)

#### `POST /auth/login`
Logs in a user and returns authorization tokens.
*   **Public Access**: Yes
*   **Request Body**:
    ```json
    {
      "email": "admin@academy.com",
      "password": "SecurePassword123"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "c30fa728-4e8c-4a37-b31c-7cb058e1b6f0",
        "email": "admin@academy.com",
        "role": "ADMIN",
        "first_name": "Jane",
        "last_name": "Doe"
      }
    }
    ```
*   **Cookie (HttpOnly, Secure)**: Sets `refresh_token=...` cookie.

#### `POST /auth/refresh`
Refreshes access tokens using the background refresh token.
*   **Public Access**: Yes (Reads HTTP cookie or custom header payload for mobile)
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
    ```

---

### 3.2. Leads & CRM Module (`/leads`)

#### `GET /leads`
Fetches lead items. Supports pagination and status filtering.
*   **Allowed Roles**: `ADMIN`
*   **Query Parameters**: `status` (optional), `page` (default 1), `limit` (default 50)
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "pagination": { "page": 1, "totalPages": 3, "totalItems": 128 },
      "data": [
        {
          "id": "e4f012b1-09df-4c3e-908c-9a4cf309bca3",
          "name": "Sarah Connor",
          "email": "s.connor@sky.net",
          "phone": "+15550199",
          "status": "NEW",
          "source": "Web Form",
          "created_at": "2026-07-16T12:00:00Z"
        }
      ]
    }
    ```

#### `POST /leads`
Adds a new lead entry (used both internally by admins, and publicly by inquiry forms).
*   **Public Access**: Yes
*   **Request Body**:
    ```json
    {
      "name": "John Connor",
      "email": "jconnor@sky.net",
      "phone": "+15550200",
      "source": "Referral",
      "notes": "Interested in enrolling in high-school mathematics batch."
    }
    ```
*   **Response (201 Created)**:
    ```json
    {
      "status": "success",
      "data": {
        "id": "b182d8c3-2b3a-44ee-b9ef-92e105e4cb31",
        "name": "John Connor",
        "status": "NEW",
        "created_at": "2026-07-16T13:00:00Z"
      }
    }
    ```

#### `PATCH /leads/:id`
Updates lead state (e.g. status transition for Kanban drag-and-drop).
*   **Allowed Roles**: `ADMIN`
*   **Request Body**:
    ```json
    {
      "status": "DEMO_SCHEDULED",
      "notes": "Scheduled chemistry trial for Saturday at 10 AM."
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": {
        "id": "b182d8c3-2b3a-44ee-b9ef-92e105e4cb31",
        "status": "DEMO_SCHEDULED"
      }
    }
    ```

---

### 3.3. Attendance Module (`/attendance`)

#### `GET /attendance`
Queries history.
*   **Allowed Roles**: `ADMIN`, `TEACHER`
*   **Query Parameters**: `batch_id` (required), `date` (format YYYY-MM-DD, optional)
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "data": [
        {
          "student_id": "f5b610c3-1d0c-4e89-9e8a-e9fa7f9b8c01",
          "student_name": "Alice Green",
          "status": "PRESENT",
          "remarks": ""
        }
      ]
    }
    ```

#### `POST /attendance`
Submits a day's checklist for a scheduled class block.
*   **Allowed Roles**: `ADMIN`, `TEACHER`
*   **Request Body**:
    ```json
    {
      "schedule_id": "67b848c1-1579-4ad3-a3eb-b8e1a123fbc0",
      "class_date": "2026-07-16",
      "records": [
        {
          "student_id": "f5b610c3-1d0c-4e89-9e8a-e9fa7f9b8c01",
          "status": "PRESENT",
          "remarks": ""
        },
        {
          "student_id": "78c93de4-2f3b-49ef-ae9b-0ab78f3cdef1",
          "status": "ABSENT",
          "remarks": "Informed: family emergency"
        }
      ]
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "message": "Attendance recorded. 2 records processed, 1 absence alert queued."
    }
    ```

#### `POST /attendance/sync`
Batch synchronization route accepting queued client inputs from mobile devices.
*   **Allowed Roles**: `ADMIN`, `TEACHER`
*   **Request Body**: Array of attendance sub-payloads with timestamps.
*   **Response (200 OK)**: Returns lists of successfully synced keys and failed items with conflict details.

---

### 3.4. Billing & Fees Module (`/invoices`)

#### `GET /invoices`
*   **Allowed Roles**: `ADMIN` (sees all), `PARENT`/`STUDENT` (sees only their own)
*   **Response (200 OK)**: List of invoice schemas.

#### `POST /invoices/:id/pay`
Creates a Stripe checkout session for paying an invoice.
*   **Allowed Roles**: `ADMIN`, `PARENT`, `STUDENT`
*   **Response (200 OK)**:
    ```json
    {
      "status": "success",
      "stripe_checkout_url": "https://checkout.stripe.com/pay/cs_test_..."
    }
    ```
