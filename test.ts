// // scripts/fill-slugs.ts
// import prisma from './src/shared/config/db-connection';
// import { toSlug } from './src/api/blog/utils';


// async function main() {
//   console.log('🔄 기존 데이터 Slug 채우기 시작...');

//   // 1. 카테고리 Slug 채우기
//   const categories = await prisma.category.findMany({ where: { slug: null } });
//   for (const category of categories) {
//     let slug = toSlug(category.name);
//     await prisma.category.update({
//       where: { id: category.id },
//       data: { slug },
//     });
//   }

//   // 2. 포스트 Slug 채우기 (중복 방지를 위해 CUID 끝자리 조합)
//   const posts = await prisma.post.findMany({ where: { slug: null } });
//   for (const post of posts) {
//     let baseSlug = toSlug(post.title);
//     if (!baseSlug) baseSlug = 'post';

//     // 고유성을 위해 CUID 끝 5자리 조합
//     const uniqueSlug = `${baseSlug}-${post.id.slice(-5)}`;

//     await prisma.post.update({
//       where: { id: post.id },
//       data: { slug: uniqueSlug },
//     });
//   }

//   console.log('✅ 모든 기존 데이터의 Slug가 채워졌습니다.');
// }

// main()
//   .catch((e) => console.error(e))
//   .finally(async () => await prisma.$disconnect());
