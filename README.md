# Library Management System

Full-stack library app: NestJS + Prisma + PostgreSQL (API), React (frontend, coming in Week 3).

## Setup (API)

    cd api
    npm install
    cp .env.example .env     # then fill in your own Postgres URLs
    npx prisma migrate deploy
    npx prisma db seed
    npm run start:dev

## Schema Decisions

**Book references Genre instead of embedding it.** Each Book stores a
`genreId` foreign key pointing at one row in the Genre table.

- Single source of truth: a genre's name lives in one place, so renaming
  "Science" is one update, not an edit across every book.
- No inconsistency: embedded copies could drift ("Sci-Fi" vs "Science").
- Easy queries: "all books in a genre" and "how many books per genre" are
  simple indexed lookups (`Book.genreId` is indexed).
- Integrity: the database rejects a book with a nonexistent genre and blocks
  deleting a genre that still has books (`ON DELETE RESTRICT`).

**Other decisions**
- `Role` is an enum (PATRON, LIBRARIAN) so the database rejects invalid
  roles; new users default to PATRON (least privilege).
- Users store `passwordHash`, never a plain password.
- `email` and `isbn` are unique, enforced by the database.
- `totalCopies` and `availableCopies` are separate so borrowing (Week 5)
  can change availability without losing the total.

## Prisma vs a document database

The biggest difference was that relationships are explicit. In a document
database I would have embedded the genre inside each book and accepted some
duplication. In Prisma, you declare a foreign key, and the database enforces it,
so invalid links are rejected instead of silently stored.
