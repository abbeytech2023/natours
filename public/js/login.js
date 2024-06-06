/*eslint-disable*/

// const login = async (email, password) => {
//   console.log(email, password);
//   try {
//     const res = await axios({
//       method: 'POST',
//       url: 'http://127.0.0.1:3000/api/v1/users/login',
//       data: {
//         email,
//         password,
//       },
//     });
//     console.log(res);
//   } catch (err) {
//     console.log(err);
//   }
// };

// document.querySelector('.form').addEventListener('submit', function (e) {
//   e.preventDefault();

//   const email = document.getElementById('email').textContent;
//   const password = document.getElementById('password').textContent;
//   login(email, password);
// });

const form = document.querySelector('form');

form.addEventListener('submit', async function (e) {
  e.preventDefault();
  const email = document.querySelector('#email').value;
  const password = document.querySelector('#password').value;
  console.log(email, password);

  const res = await fetch('/loginme', {
    method: 'post',
    body: JSON.stringify({ email, password }),
    headers: { 'content-type': 'application/json' },
  });

  const data = await res.json();
  console.log(data);
});
