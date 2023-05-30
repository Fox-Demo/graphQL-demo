fetch("http://localhost:4000/", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  body: JSON.stringify({ query: "{ hello }" }),
})
  .then((r) => r.json())
  .then((data) => console.log("data returned:", data.data.hello));
