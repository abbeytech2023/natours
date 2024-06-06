/* eslint-disable*/

const form = document.querySelector('form');

form.addEventListener('submit', async function (e) {
  e.preventDefault();
  const email = document.querySelector('#email').value;
  const password = document.querySelector('#password').value;
  console.log(email, password);

  const res = await fetch('/signup', {
    method: 'post',
    body: JSON.stringify({ email, password }),
    headers: { 'content-type': 'application/json' },
  });
  const data = await res.json();
  console.log(data);
});
