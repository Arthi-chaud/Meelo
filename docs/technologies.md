# What is Meelo made of?

Meelo is a mono-repository project, divisible into two parts

## Back-End

Meelo's core is written in TypeScript with [NestJs](https://nestjs.com/). This allows easily extensible and maintainable code base. Through the repository pattern, each main functionalities of the core are cleanly separated from one another.

Regarding database management, Meelo's core rely on [Prisma ORM](https://www.prisma.io/), and uses code generators to manipulate types easily, as well as an quick and efficient documentation generation.

## Front-End

Meelo's Web App is written in React (TypeScript) with [NextJs](https://nextjs.org/). associated with [React Query](https://github.com/tanstack/query), NextJs' SSR feature makes the application smooth and dynamic.

Regarding Media Playback, the application relies on the client's browser's media playback functionalities.
