const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const hbs = require('hbs');
const mysql = require('mysql2');
const multer = require("multer");

// Create MySQL connection
const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'vk18@ro45',
  database: 'myorg'
});

// Connect to the database
conn.connect((err) => {
  if (err) throw err;
  console.log('MySQL Connected...');
});

// Set view engine to hbs and configure views directory
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/myasset', express.static(__dirname + '/public'));
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Multer storage setup for handling image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Route for homepage - view all products
app.get('/', (req, res) => {
  let sql = 'SELECT * FROM product';
  conn.query(sql, (err, mydata) => {
    if (err) throw err;
    res.render('viewproducts', { results: mydata });
  });
});

// Route to show add product form
app.get('/add', (req, res) => {
  res.render('add');
});

// Route to save a new product (with image)
app.post('/saveproduct', upload.single('imageName'), (req, res) => {
  // Use parameterized queries to prevent SQL injection
  let sql = `INSERT INTO product (product_image, product_name, product_price, p_date) 
             VALUES (?, ?, ?, ?)`;

  // Extract values from the request
  const values = [
    req.file ? req.file.filename : '', // Handle missing image
    req.body.t1,
    req.body.t2,
    req.body.t3
  ];

  conn.query(sql, values, (err) => {
    if (err) {
      console.error("Error saving product:", err);
      return res.status(500).send("Error saving product");
    }
    res.redirect('/');
  });
});

// Route to delete a product by ID
app.get('/deleteproduct/:id', (req, res) => {
  let sql = `DELETE FROM product WHERE id = ${req.params.id}`;
  conn.query(sql, (err) => {
    if (err) throw err;
    res.redirect('/');
  });
});

// Route to render the edit product form
app.get('/editproduct/:id', (req, res) => {
  let sql = `SELECT * FROM product WHERE id = ${req.params.id}`;
  conn.query(sql, (err, mydata) => {
    if (err) throw err;
    res.render('editproduct', { results: mydata });
  });
});

// Route to update product details
app.post('/updateproduct', upload.single('imageName'), (req, res) => {
  let sql = `UPDATE product 
             SET product_image = '${req.file ? req.file.filename : req.file.oldImage}', 
                 product_name = '${req.body.t1}',
                 product_price = '${req.body.t2}',
                 p_date = '${req.body.t3}'
             WHERE id = '${req.body.myid}'`;

  conn.query(sql, (err) => {
    if (err) throw err;
    res.redirect('/');
  });
});

// Server listening on port 8000
app.listen(3000, () => {
  console.log('Server is running at port 3000');
});
