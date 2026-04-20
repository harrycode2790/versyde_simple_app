# Versyde Backend

Express + Prisma backend for Versyde with PostgreSQL, JWT-based app sessions, and social login support for Google and LinkedIn.

## Current Status

- Express app structure is in place
- Prisma is connected through a singleton client
- PostgreSQL is the configured database
- Google OAuth works end to end
- LinkedIn OAuth works end to end
- JWT protection works for authenticated routes
- Local email/password auth is still placeholder code
- Apple OAuth is not implemented because Apple platform prerequisites are not available in this environment

## Stack

- Node.js
- Express
- PostgreSQL
- Prisma
- JSON Web Tokens
- Google OAuth 2.0 / OpenID Connect
- LinkedIn OpenID Connect

## Project Structure

```txt
src/
  app.js
  server.js
  config/
  controllers/
  lib/
  middlewares/
  routes/
  services/
prisma/
  schema.prisma
```

## Environment Variables

Create a `.env` file in the project root.

```env
PORT=5000
DATABASE_URL="postgresql://postgres:password@localhost:5432/versyde?schema=public"
JWT_SECRET="replace-with-a-strong-secret"
JWT_EXPIRES_IN="1d"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:5000/api/auth/google/callback"
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"
LINKEDIN_REDIRECT_URI="http://localhost:5000/api/auth/linkedin/callback"
```

## Database Setup

1. Make sure PostgreSQL is running locally.
2. Create the `versyde` database.
3. Generate the Prisma client.
4. Run the migration.

Commands:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name add-social-auth
```

## Prisma Auth Model

The database supports one local user record linked to one or more auth providers.

- `User`
  Main application user
- `AuthAccount`
  Stores provider-specific account links
- `AuthProvider`
  Enum values:
  - `LOCAL`
  - `GOOGLE`
  - `LINKEDIN`
  - `APPLE`

Current account-linking rule:

- If a provider account already exists, use its linked user
- If the provider returns a trusted email that already exists, link the provider to that user
- If no user exists yet, create one and attach the provider
- If the provider does not return a trusted email, do not auto-link

## Running The Server

Development:

```bash
npm run dev
```

Production:

```bash
npm start
```

## API Routes

Base API prefix:

```txt
/api
```

Routes:

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/google/start`
- `GET /api/auth/google/callback`
- `POST /api/auth/google`
- `GET /api/auth/linkedin/start`
- `GET /api/auth/linkedin/callback`
- `POST /api/auth/linkedin`
- `GET /api/auth/me`
- `POST /api/jobs`
- `GET /api/jobs`
- `GET /api/jobs/:jobId`
- `POST /api/jobs/:jobId/apply`
- `GET /api/jobs/me`

## Google OAuth Setup

Create a Google OAuth client in Google Cloud Console with:

- Application type: `Web application`
- Authorized redirect URI:

```txt
http://localhost:5000/api/auth/google/callback
```

For testing mode in Google Auth Platform:

- User type: `External`
- Add your Google account under `Audience` as a test user

## Testing Google OAuth Without A Frontend

This backend supports browser-based testing without a frontend app.

1. Start the server:

```bash
npm run dev
```

2. Open this URL in your browser:

```txt
http://localhost:5000/api/auth/google/start
```

3. Sign in with Google.

4. After a successful sign-in, Google redirects back to:

```txt
http://localhost:5000/api/auth/google/callback
```

5. The backend responds with JSON like:

```json
{
  "message": "Google authentication successful.",
  "token": "your-jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "fullName": "Example User",
    "avatarUrl": "https://...",
    "createdAt": "2026-04-20T19:46:47.755Z"
  }
}
```

## LinkedIn OAuth Setup

Create a LinkedIn app in the LinkedIn Developer Portal and configure:

- Product: `Sign In with LinkedIn using OpenID Connect`
- Redirect URI:

```txt
http://localhost:5000/api/auth/linkedin/callback
```

Then set the LinkedIn values in `.env`:

```env
LINKEDIN_CLIENT_ID="your-linkedin-client-id"
LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"
LINKEDIN_REDIRECT_URI="http://localhost:5000/api/auth/linkedin/callback"
```

## Testing LinkedIn OAuth Without A Frontend

This backend also supports browser-based LinkedIn testing without a frontend app.

1. Start the server:

```bash
npm run dev
```

2. Open this URL in your browser:

```txt
http://localhost:5000/api/auth/linkedin/start
```

3. Sign in with LinkedIn.

4. After a successful sign-in, LinkedIn redirects back to:

```txt
http://localhost:5000/api/auth/linkedin/callback
```

5. The backend responds with JSON like:

```json
{
  "message": "LinkedIn authentication successful.",
  "token": "your-jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "fullName": "Example User",
    "avatarUrl": "https://...",
    "createdAt": "2026-04-20T19:46:47.755Z"
  }
}
```

## Apple OAuth Status

Apple OAuth is intentionally not implemented in this project at the moment.

Reason:

- A paid Apple Developer account is required
- Access to Apple Certificates, Identifiers & Profiles is required
- A Services ID for web login is required
- A Sign in with Apple private key is required
- Apple-specific configuration such as Team ID, Key ID, and a signed client secret JWT is required

Those Apple platform prerequisites were not available in this environment, so a live Apple Sign In flow could not be created or verified honestly.

For this reason, the project includes working Google and LinkedIn integrations that demonstrate the multi-provider auth architecture, while Apple is documented as a known external dependency rather than presented as a finished feature.

## Testing The Protected Route

Use the returned JWT token against `/api/auth/me`:

```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

Expected result:

```json
{
  "message": "Current user profile fetched successfully.",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "fullName": "Example User",
    "avatarUrl": "https://...",
    "createdAt": "2026-04-20T19:46:47.755Z"
  }
}
```

## Notes

- Restart the server after changing `.env`
- Google redirect URIs must match exactly between `.env` and Google Cloud Console
- LinkedIn redirect URIs must match exactly between `.env` and the LinkedIn app settings
- Authorization codes are short-lived and single-use
- Local register/login services are still placeholders and need implementation
- Google and LinkedIn both use the same provider-linking pattern in the auth service
- Apple would follow the same provider-linking pattern once Apple Developer prerequisites are available
# versyde_simple_app
