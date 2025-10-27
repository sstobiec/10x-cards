# REST API Plan - 10xCards

## 1. Resources

| Resource | Database Table | Description |
|----------|---------------|-------------|
| Users | `auth.users` | User accounts (managed by Supabase Auth) |
| Flashcard Sets | `flashcard_sets` | Collections of flashcards owned by users |
| Flashcards | `flashcards` | Individual flashcards within sets |
| Error Logs | `error_logs` | System error tracking for analytics |

## 2. Endpoints

### 2.2 AI Flashcard Generation

#### Generate Flashcard Proposals from Text
- **Method:** POST
- **Path:** `/api/flashcards/generate`
- **Description:** Generate flashcards from text input using AI (temporary preview, not saved)
- **Authentication:** Required (JWT)
- **Request Body:**
```json
{
  "text": "String of notes/content to generate flashcards from",
  "model": "openai/gpt-4o" 
}
```
- **Validation:**
  - `text`: required, max 10,000 characters
  - `model`: optional, defaults to configured model
- **Success Response:** `200 OK`
```json
{
  "flashcard_proposals": [
    {
      "avers": "What is REST?",
      "rewers": "REST (Representational State Transfer) is an architectural style for distributed hypermedia systems."
    },
    {
      "avers": "What are HTTP methods?",
      "rewers": "GET, POST, PUT, DELETE, PATCH are common HTTP methods used in REST APIs."
    }
  ],
  "generation_duration": 2500,
  "model": "openai/gpt-4o"
}
```
- **Error Responses:**
  - `400 Bad Request` - Text exceeds 10,000 characters or validation failed
  - `401 Unauthorized` - Invalid or missing JWT token
  - `422 Unprocessable Entity` - Invalid input format
  - `500 Internal Server Error` - AI generation failed
  - `503 Service Unavailable` - AI service temporarily unavailable

**Note:** When AI generation fails, error details should be logged to `error_logs` table with input_payload containing the request text.

---

### 2.3 Flashcard Sets

#### List All Flashcard Sets
- **Method:** GET
- **Path:** `/api/flashcard-sets`
- **Description:** Get all flashcard sets owned by the authenticated user, sorted chronologically (newest first)
- **Authentication:** Required (JWT)
- **Query Parameters:**
  - `limit` (optional): Number of sets to return (default: 50, max: 100)
  - `offset` (optional): Number of sets to skip for pagination (default: 0)
  - `sort` (optional): Sort order - `created_at_desc` (default) or `created_at_asc`
- **Success Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Computer Science Basics",
      "model": "openai/gpt-4o",
      "generation_duration": 2500,
      "flashcard_count": 15,
      "created_at": "2025-10-27T12:00:00Z",
      "updated_at": "2025-10-27T12:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 50,
    "offset": 0
  }
}
```
- **Error Responses:**
  - `401 Unauthorized` - Invalid or missing JWT token
  - `400 Bad Request` - Invalid query parameters

#### Get Single Flashcard Set
- **Method:** GET
- **Path:** `/api/flashcard-sets/:id`
- **Description:** Get a specific flashcard set with all its flashcards
- **Authentication:** Required (JWT)
- **URL Parameters:**
  - `id` (required): UUID of the flashcard set
- **Success Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Computer Science Basics",
  "model": "openai/gpt-4o",
  "generation_duration": 2500,
  "created_at": "2025-10-27T12:00:00Z",
  "updated_at": "2025-10-27T12:00:00Z",
  "flashcards": [
    {
      "id": "uuid",
      "avers": "What is REST?",
      "rewers": "REST (Representational State Transfer) is an architectural style for distributed hypermedia systems.",
      "source": "ai-full",
      "flagged": false,
      "created_at": "2025-10-27T12:00:00Z",
      "updated_at": "2025-10-27T12:00:00Z"
    }
  ]
}
```
- **Error Responses:**
  - `401 Unauthorized` - Invalid or missing JWT token
  - `403 Forbidden` - Set belongs to another user (RLS)
  - `404 Not Found` - Set with given ID doesn't exist

#### Create Flashcard Set
- **Method:** POST
- **Path:** `/api/flashcard-sets`
- **Description:** Create a new flashcard set (manual or from generated flashcards)
- **Authentication:** Required (JWT)
- **Request Body:**
```json
{
  "name": "Computer Science Basics",
  "model": "manual",
  "generation_duration": 0,
  "flashcards": [
    {
      "avers": "What is REST?",
      "rewers": "REST is an architectural style...",
      "source": "manual"
    }
  ]
}
```
- **Validation:**
  - `name`: required, max 100 characters, unique per user
  - `model`: required, max 100 characters (use "manual" for manually created sets)
  - `generation_duration`: required, integer >= 0 (milliseconds, use 0 for manual sets)
  - `flashcards`: optional array (can be empty for manual sets)
  - `flashcards[].avers`: required, max 200 characters, non-empty when trimmed
  - `flashcards[].rewers`: required, max 750 characters, non-empty when trimmed
  - `flashcards[].source`: required, enum: 'manual', 'ai-full', 'ai-edited'
- **Success Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Computer Science Basics",
  "model": "manual",
  "generation_duration": 0,
  "flashcard_count": 1,
  "created_at": "2025-10-27T12:00:00Z",
  "updated_at": "2025-10-27T12:00:00Z"
}
```
- **Error Responses:**
  - `400 Bad Request` - Validation failed
  - `401 Unauthorized` - Invalid or missing JWT token
  - `409 Conflict` - Set name already exists for this user
  - `422 Unprocessable Entity` - Invalid data format

#### Update Flashcard Set
- **Method:** PATCH
- **Path:** `/api/flashcard-sets/:id`
- **Description:** Update flashcard set name
- **Authentication:** Required (JWT)
- **URL Parameters:**
  - `id` (required): UUID of the flashcard set
- **Request Body:**
```json
{
  "name": "Updated Set Name"
}
```
- **Validation:**
  - `name`: required, max 100 characters, unique per user
- **Success Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Updated Set Name",
  "model": "openai/gpt-4o",
  "generation_duration": 2500,
  "flashcard_count": 15,
  "created_at": "2025-10-27T12:00:00Z",
  "updated_at": "2025-10-27T14:30:00Z"
}
```
- **Error Responses:**
  - `400 Bad Request` - Validation failed
  - `401 Unauthorized` - Invalid or missing JWT token
  - `403 Forbidden` - Set belongs to another user (RLS)
  - `404 Not Found` - Set with given ID doesn't exist
  - `409 Conflict` - New name conflicts with existing set

#### Delete Flashcard Set
- **Method:** DELETE
- **Path:** `/api/flashcard-sets/:id`
- **Description:** Delete a flashcard set and all its flashcards (cascade)
- **Authentication:** Required (JWT)
- **URL Parameters:**
  - `id` (required): UUID of the flashcard set
- **Success Response:** `204 No Content`
- **Error Responses:**
  - `401 Unauthorized` - Invalid or missing JWT token
  - `403 Forbidden` - Set belongs to another user (RLS)
  - `404 Not Found` - Set with given ID doesn't exist

---

### 2.4 Flashcards

#### Add Flashcard to Set
- **Method:** POST
- **Path:** `/api/flashcard-sets/:setId/flashcards`
- **Description:** Add a new flashcard to an existing set
- **Authentication:** Required (JWT)
- **URL Parameters:**
  - `setId` (required): UUID of the flashcard set
- **Request Body:**
```json
{
  "avers": "What is HTTP?",
  "rewers": "HTTP is the Hypertext Transfer Protocol...",
  "source": "manual"
}
```
- **Validation:**
  - `avers`: required, max 200 characters, non-empty when trimmed
  - `rewers`: required, max 750 characters, non-empty when trimmed
  - `source`: required, enum: 'manual', 'ai-full', 'ai-edited'
- **Success Response:** `201 Created`
```json
{
  "id": "uuid",
  "set_id": "uuid",
  "avers": "What is HTTP?",
  "rewers": "HTTP is the Hypertext Transfer Protocol...",
  "source": "manual",
  "flagged": false,
  "created_at": "2025-10-27T12:00:00Z",
  "updated_at": "2025-10-27T12:00:00Z"
}
```
- **Error Responses:**
  - `400 Bad Request` - Validation failed
  - `401 Unauthorized` - Invalid or missing JWT token
  - `403 Forbidden` - Set belongs to another user (RLS)
  - `404 Not Found` - Set with given ID doesn't exist
  - `422 Unprocessable Entity` - Invalid data format

#### Update Flashcard
- **Method:** PATCH
- **Path:** `/api/flashcards/:id`
- **Description:** Update an existing flashcard's content
- **Authentication:** Required (JWT)
- **URL Parameters:**
  - `id` (required): UUID of the flashcard
- **Request Body:**
```json
{
  "avers": "Updated question?",
  "rewers": "Updated answer..."
}
```
- **Validation:**
  - `avers`: optional, max 200 characters, non-empty when trimmed
  - `rewers`: optional, max 750 characters, non-empty when trimmed
- **Success Response:** `200 OK`
```json
{
  "id": "uuid",
  "set_id": "uuid",
  "avers": "Updated question?",
  "rewers": "Updated answer...",
  "source": "ai-edited",
  "flagged": false,
  "created_at": "2025-10-27T12:00:00Z",
  "updated_at": "2025-10-27T14:30:00Z"
}
```
- **Error Responses:**
  - `400 Bad Request` - Validation failed
  - `401 Unauthorized` - Invalid or missing JWT token
  - `403 Forbidden` - Flashcard's set belongs to another user (RLS)
  - `404 Not Found` - Flashcard with given ID doesn't exist
  - `422 Unprocessable Entity` - Invalid data format

**Note:** Database trigger automatically updates `source` from 'ai-full' to 'ai-edited' when AI-generated flashcard content is modified.

#### Delete Flashcard
- **Method:** DELETE
- **Path:** `/api/flashcards/:id`
- **Description:** Delete a specific flashcard from its set
- **Authentication:** Required (JWT)
- **URL Parameters:**
  - `id` (required): UUID of the flashcard
- **Success Response:** `204 No Content`
- **Error Responses:**
  - `401 Unauthorized` - Invalid or missing JWT token
  - `403 Forbidden` - Flashcard's set belongs to another user (RLS)
  - `404 Not Found` - Flashcard with given ID doesn't exist

#### Toggle Flashcard Flag
- **Method:** PATCH
- **Path:** `/api/flashcards/:id/flag`
- **Description:** Toggle the flagged status of a flashcard (quality feedback mechanism)
- **Authentication:** Required (JWT)
- **URL Parameters:**
  - `id` (required): UUID of the flashcard
- **Request Body:**
```json
{
  "flagged": true
}
```
- **Validation:**
  - `flagged`: required, boolean
- **Success Response:** `200 OK`
```json
{
  "id": "uuid",
  "flagged": true,
  "updated_at": "2025-10-27T14:30:00Z"
}
```
- **Error Responses:**
  - `400 Bad Request` - Invalid boolean value
  - `401 Unauthorized` - Invalid or missing JWT token
  - `403 Forbidden` - Flashcard's set belongs to another user (RLS)
  - `404 Not Found` - Flashcard with given ID doesn't exist

---

### 2.5 Error Logs (Internal/Admin)

#### Create Error Log
- **Method:** POST
- **Path:** `/api/error-logs`
- **Description:** Log an error that occurred during operations (primarily AI generation failures)
- **Authentication:** Required (JWT)
- **Request Body:**
```json
{
  "model": "openai/gpt-4o",
  "error_type": "AI_GENERATION_FAILED",
  "error_message": "Rate limit exceeded",
  "input_payload": {
    "text": "Original input text...",
    "text_length": 5420
  }
}
```
- **Validation:**
  - `model`: required, max 100 characters
  - `error_type`: required, max 100 characters
  - `error_message`: required, text
  - `input_payload`: optional, valid JSON object
- **Success Response:** `201 Created`
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "model": "openai/gpt-4o",
  "error_type": "AI_GENERATION_FAILED",
  "error_message": "Rate limit exceeded",
  "created_at": "2025-10-27T12:00:00Z"
}
```
- **Error Responses:**
  - `400 Bad Request` - Validation failed
  - `401 Unauthorized` - Invalid or missing JWT token
  - `422 Unprocessable Entity` - Invalid JSON in input_payload

**Note:** Error logs are append-only (no UPDATE or DELETE operations allowed per RLS policies).

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

**Supabase Auth with JWT Tokens**

The application uses Supabase Auth as the authentication provider. This provides:

- **JWT-based authentication**: Access tokens are JSON Web Tokens (JWT) issued by Supabase
- **Automatic session management**: Refresh tokens handle session renewal
- **Secure token storage**: Supabase client handles secure storage
- **Built-in security features**: Password hashing, rate limiting, email verification

### 3.2 Implementation Details

**Client-Side:**
- Use `@supabase/supabase-js` client library
- Authentication methods: `signUp()`, `signInWithPassword()`, `signOut()`
- Client automatically includes JWT in request headers

**Server-Side (Astro Middleware):**
```typescript
// src/middleware/index.ts
export async function onRequest(context, next) {
  // Extract JWT from Authorization header or cookies
  const token = context.request.headers.get('Authorization')?.replace('Bearer ', '');
  
  // Verify JWT with Supabase
  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Attach user to context
  context.locals.user = user;
  
  return next();
}
```

**Database-Side:**
- Row-Level Security (RLS) policies automatically enforce data isolation
- All queries use authenticated Supabase client with user's JWT
- RLS policies use `auth.uid()` to verify ownership

### 3.3 Authorization Rules

**Resource Access:**
- Users can only access their own flashcard sets (enforced by RLS)
- Users can only access flashcards within their own sets (enforced by RLS via JOIN)
- Users can only view their own error logs (enforced by RLS)

**Public Endpoints:**
- Supabase Auth endpoints (signup, login) are public
- All other endpoints require valid JWT

### 3.4 Token Format

**Access Token (JWT) Claims:**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "user_metadata": {
    "username": "johndoe"
  },
  "role": "authenticated",
  "iat": 1698412800,
  "exp": 1698416400
}
```

**Request Header:**
```
Authorization: Bearer <jwt_access_token>
```

**Cookie (Alternative):**
Supabase client can also use httpOnly cookies for web applications:
```
sb-access-token=<jwt>; HttpOnly; Secure; SameSite=Lax
```

---

## 4. Validation and Business Logic

### 4.1 Input Validation Rules

#### Flashcard Sets
- **name**: 
  - Required
  - Max length: 100 characters
  - Must be unique per user (enforced by database constraint)
  - No whitespace-only names
- **model**: 
  - Required
  - Max length: 100 characters
  - Use "manual" for manually created sets
- **generation_duration**: 
  - Required
  - Integer >= 0
  - Milliseconds (use 0 for manual sets)

#### Flashcards
- **avers** (front):
  - Required
  - Max length: 200 characters
  - Must be non-empty after trimming whitespace (database CHECK constraint)
- **rewers** (back):
  - Required
  - Max length: 750 characters
  - Must be non-empty after trimming whitespace (database CHECK constraint)
- **source**:
  - Required
  - Enum: 'manual', 'ai-full', 'ai-edited'
  - Automatically updated by trigger when edited
- **flagged**:
  - Boolean
  - Defaults to false

#### AI Generation Input
- **text**:
  - Required
  - Max length: 10,000 characters (PRD requirement FW-008)
  - Must contain meaningful content (not just whitespace)
- **model**:
  - Optional
  - If provided, must be a valid model identifier
  - Defaults to configured default model

#### Error Logs
- **model**: Required, max 100 characters
- **error_type**: Required, max 100 characters
- **error_message**: Required, text (no max length)
- **input_payload**: Optional, must be valid JSON

### 4.2 Business Logic Implementation

#### AI Flashcard Generation Workflow
1. **Validation Phase:**
   - Validate text length (≤ 10,000 chars)
   - Validate user is authenticated
   - Check for rate limiting (if implemented)

2. **Generation Phase:**
   - Start timer for `generation_duration` tracking
   - Send request to OpenRouter API with configured model
   - Parse AI response into flashcard format
   - Stop timer and calculate duration

3. **Error Handling:**
   - On failure, log error to `error_logs` table
   - Include original input in `input_payload` for debugging
   - Return appropriate error response to client

4. **Success Response:**
   - Return generated flashcards as temporary preview
   - Include `generation_duration` and `model` for later use
   - Do NOT save to database yet (awaiting user review)

#### Flashcard Source Tracking (Automatic)
Database trigger handles automatic source tracking:
- When flashcard is created with `source='ai-full'`
- If user later updates `avers` or `rewers`
- Trigger automatically changes `source` to `'ai-edited'`
- This supports success metric: "75% of AI-generated flashcards are accepted"

#### Set Creation Workflow
1. **From AI Generation:**
   - User reviews generated flashcards
   - User can edit individual cards (changes source to 'ai-edited')
   - User can delete unwanted cards
   - User provides set name
   - POST to `/api/flashcard-sets` with:
     - Reviewed flashcards array
     - Set name
     - Model used
     - Generation duration

2. **Manual Creation:**
   - POST to `/api/flashcard-sets` with:
     - Set name
     - `model='manual'`
     - `generation_duration=0`
     - Empty flashcards array
   - User adds flashcards one-by-one via POST to `/api/flashcard-sets/:id/flashcards`

#### Flagging Quality Feedback
- Users can flag any flashcard via PATCH `/api/flashcards/:id/flag`
- Sets `flagged=true` in database
- Used for analytics to calculate success metric
- Flagged flashcards remain in set (not deleted)
- Partial index on `flagged=true` optimizes analytics queries

#### Set Deletion (Cascade)
- DELETE `/api/flashcard-sets/:id` removes set
- Database CASCADE constraint automatically deletes all flashcards in set
- No orphaned flashcards possible

### 4.3 Data Consistency Rules

#### Unique Set Names Per User
- Database enforces: `UNIQUE(user_id, name)` on `flashcard_sets`
- API returns `409 Conflict` if duplicate detected
- Case-sensitive comparison

#### Flashcard-Set Relationship Integrity
- Foreign key: `flashcards.set_id → flashcard_sets.id`
- Cannot create flashcard for non-existent set
- Cannot reference set belonging to another user (RLS prevents this)

#### User Data Isolation
- RLS policies prevent cross-user data access
- All queries automatically filtered by `auth.uid() = user_id`
- Even admin users cannot bypass RLS (unless explicitly granted)

### 4.4 Automatic Field Updates

#### Timestamps
- `created_at`: Set on INSERT (default: NOW())
- `updated_at`: Set on INSERT (default: NOW())
- `updated_at`: Automatically updated on UPDATE via trigger

#### Source Field Evolution
- Trigger: `update_flashcard_source_on_edit()`
- Monitors changes to `avers` or `rewers`
- If `old.source = 'ai-full'` and content changed
- Automatically sets `new.source = 'ai-edited'`

### 4.5 Error Handling Strategy

#### Client Errors (4xx)
- `400 Bad Request`: Invalid input, validation failure
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: Valid JWT but insufficient permissions (RLS)
- `404 Not Found`: Resource doesn't exist
- `409 Conflict`: Unique constraint violation (duplicate set name)
- `422 Unprocessable Entity`: Malformed request body

#### Server Errors (5xx)
- `500 Internal Server Error`: Unexpected server error
- `503 Service Unavailable`: External service (AI API) unavailable

#### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Flashcard set name already exists",
    "details": {
      "field": "name",
      "constraint": "unique"
    }
  }
}
```

### 4.6 Rate Limiting Considerations

While not explicitly defined in MVP requirements, consider implementing:
- AI generation endpoint: 10 requests per minute per user
- Other endpoints: 100 requests per minute per user
- Use Supabase Edge Functions rate limiting or custom middleware

### 4.7 Success Metrics Tracking

#### Metric 1: AI Quality (75% acceptance rate)
- Track via `flagged` field in `flashcards` table
- Query: `SELECT COUNT(*) WHERE source IN ('ai-full', 'ai-edited') AND flagged = false`
- Compare to total AI-generated flashcards

#### Metric 2: AI Adoption (75% of all flashcards)
- Track via `source` field in `flashcards` table
- Query: `SELECT COUNT(*) WHERE source IN ('ai-full', 'ai-edited')`
- Compare to total flashcard count

#### Generation Performance
- Track via `generation_duration` in `flashcard_sets`
- Analyze average, median, p95 generation times
- Correlate with model used

---

## 5. Additional Considerations

### 5.1 Pagination

List endpoints support pagination:
- `limit`: Number of items per page (default: 50, max: 100)
- `offset`: Number of items to skip
- Response includes `pagination` object with total count

### 5.2 Sorting

List endpoints default sorting:
- Flashcard sets: `created_at DESC` (newest first)
- Can be overridden with `sort` query parameter

### 5.3 Filtering

Not implemented in MVP but API design allows future additions:
- Filter sets by model: `/api/flashcard-sets?model=openai/gpt-4o`
- Filter flashcards by source: `/api/flashcards?source=ai-full`
- Filter flagged flashcards: `/api/flashcards?flagged=true`

### 5.4 Versioning

API is currently unversioned (v1 implicit)
- If breaking changes needed, introduce `/api/v2/` prefix
- Maintain v1 for backward compatibility

### 5.5 CORS

- Allow credentials: true (for cookies)
- Allowed origins: Production domain + localhost for development
- Allowed methods: GET, POST, PATCH, DELETE, OPTIONS
- Allowed headers: Authorization, Content-Type

### 5.6 Content Type

All requests and responses use `application/json`
- Request header: `Content-Type: application/json`
- Response header: `Content-Type: application/json; charset=utf-8`

### 5.7 OpenAPI/Swagger Documentation

Consider generating OpenAPI 3.0 specification from this plan for:
- Interactive API documentation
- Client SDK generation
- API testing tools integration

### 5.8 Future Enhancements (Post-MVP)

Based on database schema section 7.10, future API additions may include:
- Study progress tracking endpoints
- User profile management
- Set sharing and permissions
- Tags and categories
- Import/export functionality

