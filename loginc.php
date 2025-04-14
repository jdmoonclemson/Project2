<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Login</title>
</head>
<body>
  <h1>Login</h1>
  <form id="login-form">
    <input type="email" placeholder="Email" name="email" required /><br />
    <input type="password" placeholder="Password" name="password" required /><br />
    <button type="submit">Login</button>
  </form>

  <script>
    document.getElementById('login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = {
        email: formData.get('email'),
        password: formData.get('password')
      };

      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();
      if (response.ok) {
        localStorage.setItem('token', result.token);
        alert('Login successful!');
        window.location.href = 'pokeIndex.html';
      } else {
        alert(result.error);
      }
    });
  </script>
</body>
</html>
