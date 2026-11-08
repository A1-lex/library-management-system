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

## Implementation Reference

Contents of the key files, copied from the repo.

### api/prisma/schema.prisma

```
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum Role {
  PATRON
  LIBRARIAN
}

model User {
  id           Int      @id @default(autoincrement())
  email        String   @unique
  name         String
  passwordHash String
  role         Role     @default(PATRON)
  createdAt    DateTime @default(now())
  reviews      Review[]
}

model Genre {
  id    Int    @id @default(autoincrement())
  name  String @unique
  slug  String @unique
  books Book[]
}

model Book {
  id              Int      @id @default(autoincrement())
  title           String
  author          String
  isbn            String   @unique
  totalCopies     Int      @default(1)
  availableCopies Int      @default(1)
  createdAt       DateTime @default(now())
  genreId         Int
  genre           Genre    @relation(fields: [genreId], references: [id])
  reviews         Review[]

  @@index([genreId])
}

model Review {
  id        Int      @id @default(autoincrement())
  rating    Int
  comment   String?
  createdAt DateTime @default(now())
  bookId    Int
  userId    Int
  book      Book     @relation(fields: [bookId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // one review per user per book
  @@unique([bookId, userId])
  @@index([bookId])
}
```

### api/src/prisma/prisma.service.ts

```
import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    // connect once when the app starts
    await this.$connect();
  }
}
```

### api/.env.example

```
# pooled connection, used by the running app
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require&pgbouncer=true"
# direct connection, used by prisma migrate
DIRECT_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
```

### api/prisma/seed.ts

```
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const genres = [
  { name: 'Fiction', slug: 'fiction' },
  { name: 'Science', slug: 'science' },
  { name: 'Technology', slug: 'technology' },
  { name: 'History', slug: 'history' },
];

// isbn values are sample placeholders, not real ISBNs
const books = [
  { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-1-000-00001-1', genre: 'fiction', copies: 3 },
  { title: 'Nineteen Eighty-Four', author: 'George Orwell', isbn: '978-1-000-00002-2', genre: 'fiction', copies: 4 },
  { title: 'Things Fall Apart', author: 'Chinua Achebe', isbn: '978-1-000-00003-3', genre: 'fiction', copies: 2 },
  { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-1-000-00004-4', genre: 'fiction', copies: 3 },
  { title: 'Half of a Yellow Sun', author: 'Chimamanda Ngozi Adichie', isbn: '978-1-000-00005-5', genre: 'fiction', copies: 2 },
  { title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '978-1-000-00006-6', genre: 'science', copies: 3 },
  { title: 'Cosmos', author: 'Carl Sagan', isbn: '978-1-000-00007-7', genre: 'science', copies: 2 },
  { title: 'The Selfish Gene', author: 'Richard Dawkins', isbn: '978-1-000-00008-8', genre: 'science', copies: 2 },
  { title: 'Silent Spring', author: 'Rachel Carson', isbn: '978-1-000-00009-9', genre: 'science', copies: 1 },
  { title: 'Astrophysics for People in a Hurry', author: 'Neil deGrasse Tyson', isbn: '978-1-000-00010-0', genre: 'science', copies: 4 },
  { title: 'Clean Code', author: 'Robert C. Martin', isbn: '978-1-000-00011-1', genre: 'technology', copies: 5 },
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt and David Thomas', isbn: '978-1-000-00012-2', genre: 'technology', copies: 3 },
  { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', isbn: '978-1-000-00013-3', genre: 'technology', copies: 3 },
  { title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '978-1-000-00014-4', genre: 'technology', copies: 2 },
  { title: 'Refactoring', author: 'Martin Fowler', isbn: '978-1-000-00015-5', genre: 'technology', copies: 2 },
  { title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '978-1-000-00016-6', genre: 'history', copies: 4 },
  { title: 'Guns, Germs, and Steel', author: 'Jared Diamond', isbn: '978-1-000-00017-7', genre: 'history', copies: 2 },
  { title: 'The Diary of a Young Girl', author: 'Anne Frank', isbn: '978-1-000-00018-8', genre: 'history', copies: 3 },
  { title: 'Long Walk to Freedom', author: 'Nelson Mandela', isbn: '978-1-000-00019-9', genre: 'history', copies: 2 },
  { title: "A People's History of the United States", author: 'Howard Zinn', isbn: '978-1-000-00020-0', genre: 'history', copies: 1 },
];

async function main() {
  // upsert makes the seed safe to run more than once
  const genreIds: Record<string, number> = {};
  for (const g of genres) {
    const row = await prisma.genre.upsert({
      where: { slug: g.slug },
      update: {},
      create: g,
    });
    genreIds[g.slug] = row.id;
  }

  for (const b of books) {
    await prisma.book.upsert({
      where: { isbn: b.isbn },
      update: {},
      create: {
        title: b.title,
        author: b.author,
        isbn: b.isbn,
        totalCopies: b.copies,
        availableCopies: b.copies,
        genreId: genreIds[b.genre],
      },
    });
  }

  const [g, b] = await Promise.all([prisma.genre.count(), prisma.book.count()]);
  console.log(`Seeded: ${g} genres, ${b} books`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```
