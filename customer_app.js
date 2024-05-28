// Importing necessary libraries and modules
const mongoose = require('mongoose');            // MongoDB ODM library
const express = require('express');
const cors = require('cors');              // Express.js web framework
const bodyParser = require('body-parser');       // Middleware for parsing JSON requests
const path = require('path');                    // Node.js path module for working with file and directory paths
const jwt = require('jsonwebtoken');
const {config} = require('dotenv');
const bcrypt = require('bcrypt');
const saltRounds = 5;

const Customers = require('./customer');         // Imported MongoDB model for 'customers'
const Employees = require('./employee');
const vendorPaymentsRouter = require('./vendor_router');
const { ValidationError, InvalidUserError, AuthenticationFailed } = require('./CustomError');         // Imported MongoDB model for 'customers'
config()

// Creating an instance of the Express application
const app = express();

const secretKey = process.env.SecretKey;
// Setting the port number for the server
const port = 3000;

// MongoDB connection URI and database name
const uri =  process.env.MONGODB_URI;
mongoose.connect(uri, {'dbName': 'customerDB'});

// Middleware to parse JSON requests
app.use("*", bodyParser.json());

app.use(cors());

// Serving static files from the 'frontend' directory under the '/static' route
app.use('/static', express.static(path.join(".", 'frontend')));

// Middleware to handle URL-encoded form data
app.use(bodyParser.urlencoded({ extended: true }));

app.use((err, req, res, next) => {
    // Set default values for status code and status if not provided in the error object
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "Error";
    // Log the error stack to the console for debugging purposes
    console.log(err.stack);
    // Send a JSON response with formatted error details
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
    });
});


// POST endpoint for user login
app.post('/api/login', async (req, res, next) => {
  const data = req.body;
  console.log(data["password"]);
  let user_name = data['user_name'];
  let password = data['password'];
  try {
    const user = await Customers.findOne({ user_name: user_name });
    if (!user) {
        throw new InvalidUserError("No such user in database");
    }
    else {
      let result = await bcrypt.compare(password, user.password);
      if(result == true) {
          const token = jwt.sign({ username: user_name }, secretKey);
          res.send(`User Logged In`);
      } else {
        throw new AuthenticationFailed("Passwords don't match");
      }
    }
  } catch (error) {
    next(error);
  }
});

// POST endpoint for adding a new customer
app.post('/api/add_customer',async (req, res, next) => {
    try {
        const data = req.body;

        const age = parseInt(data['age']);
        console.log(typeof(data["user_name"]))
 
    try {
        if (age < 21) {
            throw new ValidationError("Customer Under required age limit");
        }
        if (typeof(data["user_name"])!="string") {
            throw new ValidationError("Customer name must be string");
        }
        const saltValue = bcrypt.genSaltSync(saltRounds);
        const hashed = bcrypt.hashSync(data['password'], saltValue);
        console.log(hashed);
        // Create a new customer instance with the hashed password
        const customer = new Customers({
          "user_name": data['user_name'],
          "age": age,
          "password": hashed,
          "email": data['email']
        });
        // Save the new customer to the MongoDB 'customers' collection
        customer.save();
        res.send("Customer added successfully");
      } catch (error) {
        console.error(error);
        res.status(500).send("Error adding customer");
      }} catch(error){
        next(error);
      }
    });

    app.get('/api/logout', async (req, res) => {
      res.cookie('username', '', { expires: new Date(0) });
      res.redirect('/');
    });
    
    app.get('/', async (req, res) => {
      res.sendFile(path.join(__dirname, 'frontend', 'home.html'));
    });
    
    app.get('/api/employees', verifyToken, async (req, res) => {
      const documents = await Employees.find();
      res.json(documents);
    });
    app.post('/api/add_employee', verifyToken, async (req, res) => {
      console.log(req);
      const data = req.body;
    const emp = new Employees({
      "emp_name": data['name'],
      "age": data['age'],
      "location": data['location'],
      "email": data['email']
    });
    // Save the employee to the database
    await emp.save();
    res.json({ message: 'Employee added successfully' });
  });
  
  app.use('/vendorPayments', vendorPaymentsRouter);
  

  function verifyToken(req, res, next) {
    const token = req.headers['authorization'];
    if (typeof token !== 'undefined') {
      jwt.verify(token, secretKey, (err, authData) => {
        if (err) {
          res.sendStatus(403);
        } else {
          req.authData = authData;
          next();
        }
      });
    } else {
      res.sendStatus(401);
    }
  }
  
  
  app.all("*",(req,res,next)=>{
    const err = new Error(`Cannot find the URL ${req.originalUrl} in this application. Please check.`);
    err.status = "Endpoint Failure";
    err.statusCode = 404.
    next(err);
  })
  // Starting the server and listening on the specified port
  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
  