const http = require('http');

const data = JSON.stringify({
  email: 'madgameraro@gmail.com',
  password: 'Password@123' // Guessing a password, if it fails I'll just check the db
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log(body));
});

req.write(data);
req.end();
