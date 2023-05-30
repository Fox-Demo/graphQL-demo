const meId = 1;
const users = [
  {
    id: 1,
    email: "fong@test.com",
    password: "$2b$04$wcwaquqi5ea1Ho0aKwkZ0e51/RUkg6SGxaumo8fxzILDmcrv4OBIO", // 123456
    name: "Fong",
    age: 23,
    friendIds: [2, 3],
  },
  {
    id: 2,
    email: "kevin@test.com",
    passwrod: "$2b$04$uy73IdY9HVZrIENuLwZ3k./0azDvlChLyY1ht/73N4YfEZntgChbe", // 123456
    name: "Kevin",
    age: 40,
    friendIds: [1],
  },
  {
    id: 3,
    email: "mary@test.com",
    password: "$2b$04$UmERaT7uP4hRqmlheiRHbOwGEhskNw05GHYucU73JRf8LgWaqWpTy", // 123456
    name: "Mary",
    age: 18,
    friendIds: [1],
  },
];

const posts = [
  {
    id: 1,
    authorId: 1,
    title: "Hello World",
    body: "This is my first post",
    likeGiverIds: [1, 2],
    createdAt: "2018-10-22T01:40:14.941Z",
  },
  {
    id: 2,
    authorId: 2,
    title: "Nice Day",
    body: "Hello My Friend!",
    likeGiverIds: [1],
    createdAt: "2018-10-24T01:40:14.941Z",
  },
];

module.exports = {
  meId,
  users,
  posts,
};
