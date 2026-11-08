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
