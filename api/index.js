// Load npm packages
require('dotenv').config();
const express = require('express');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const Razorpay = require('razorpay');
const nodemailer = require('nodemailer');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const serverless = require('serverless-http');

// ✅ Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    const { host, port, name } = mongoose.connection;
    console.log(`✅ Connected to MongoDB`);
    console.log(`🔍 Host: ${host}`);
    console.log(`🔍 Database: ${name}`);

    if (host.includes('mongodb.net')) {
      console.log("🌍 Connected to MongoDB Atlas");
    } else {
      console.log("💻 Connected to Local MongoDB");
    }
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));
// ✅ Set view engine
app.set('view engine', 'ejs');
app.set('view options', { debug: true });
const viewsDir = path.join(__dirname, 'views');

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Session
app.use(session({
    secret: process.env.SESSION_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 } // 1 hour
}));

// ✅ Razorpay
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});




// ✅ Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, 'public/images'));
    },
    filename: function (req, file, cb) {
        const uniqueName = `temp_${Date.now()}_${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage }).single('image');

// ============ ROUTES ============

//this is to route to homepage
app.get('/', (req, res) => {
    res.render('user');
});
app.get('/signup', (req, res) => {
    res.render('signin');
});
// when user signin then route to complete profile and this page come from signup
app.post('/nextpage', async (req, res) => {
    const { name, number, email, password } = req.body;
    try {
        const create_user = await login_user.create({ name, number, email, password });
        res.render('complete_profile', create_user); // ✔️ Pass user object here
    } catch (err) {
        console.error(err);
        res.status(500).send("Error creating user");
    }
});

// after completion of profile go to login page for re login
app.post('/upload', (req, res) => {
    upload(req, res, async function (err) {
        if (err) {
            console.error(err);
            return res.status(500).send('File upload error');
        }

        try {
            const { name, family, room, doj, number } = req.body;
            const originalFile = req.file;
            const old= await user_profile.findOne({room});
            if(old){
                res.render('user_exist');
            }

            if (!originalFile) {
                return res.status(400).send("No file uploaded");
            }

            const roomNumber = room || 'unknown';
            const oldPath = path.join(__dirname, 'public/images', originalFile.filename);
            const newFileName = `${roomNumber}.png`;
            const newPath = path.join(__dirname, 'public/images', newFileName);

            fs.renameSync(oldPath, newPath);

            const create_user = await user_profile.create({
                name,
                image: newFileName,
                family,
                number,
                room: parseInt(room),
                doj: new Date(doj)

            });

            // ✅ Use redirect here instead of sending JSON and redirecting immediately
            res.redirect('/login');
        } catch (err) {
            console.error(err);
            res.status(500).send('Something went wrong');
        }
    });
});

// this is to authenticate user from login page
app.post('/cheak_user', async (req, res) => {
    const { number, password } = req.body;

    try {
        const user = await login_user.findOne({ number });

        if (!user) {
            return res.render('login', { error: 'User not found' });
        }

        if (user.password !== password) {
            return res.render('login', { error: 'Incorrect password' });
        }

        req.session.userId = user._id;
        req.session.phone = user.number;

        res.redirect(`/dashboard/${number}`);
    } catch (error) {
        console.error(error);
        res.render('login', { error: 'Something went wrong. Please try again.' });
    }
});

// to get login page
app.get('/login',function(req,res){
    res.render('login');
})

//for owner login page
app.get('/owner',function(req,res){
    res.render('owner');
})

//for owner authentication
app.post('/owner_login', async (req, res) => {
    const { name, password } = req.body;
    try {
        const user = await owner.findOne({username:name});

        if (!user) {
            return res.render('owner', { error: 'Not a Owner' });
        }

        if (user.password !== password) {
            return res.render('owner', { error: 'Incorrect password' });
        }
        req.session.userId = user._id;
        req.session.phone = user.number;
        res.redirect('/alluser');
    } catch (error) {
        console.error(error);
        res.render('login', { error: 'Something went wrong. Please try again.' });
        
    }
});

// when user submit complaint
app.post('/add_complaint', async (req, res) => {
    try {
      const { name, room, subject, description } = req.body;
  
      const newComplaint = new Complaint({
        name,
        room,
        subject,
        description
      });
  
      await newComplaint.save();
  
      const user = await user_profile.findOne({ room });
      const number = user.number;
  
      res.redirect(`/dashboard/${number}`);
    } catch (error) {
      console.error(error);
      res.status(500).send('There was an error submitting your complaint.');
    }
  });

// this is dashboard of user and req parameter has phone number as we are diff user with their number
app.get('/dashboard/:number', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not logged in' });
      }
    
    const { number } = req.params; // <-- this line is needed

    try {
        const user = await user_profile.findOne({ number });
        console.log(user);
        if (!user) {
            return res.render('error', { message: 'User profile not found' });
        }

        res.render('dashboard', { user });
    } catch (error) {
        console.error(error);
        res.render('error', { message: 'Something went wrong' });
    }
});

// this is the dashboard for owner
app.get('/alluser', async (req, res) => {
    if (!req.session.userId) {
        return res.render('');
        
      }
    try {
        const users = await user_profile.find({});
        res.render('all_user', { users });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching users');
    }
});

// this will help in logout for both owner and user
app.get('/logout', (req, res) => {
    req.session.destroy(err => {
      if (err) return res.status(500).json({ message: 'Logout failed' });
  
      res.clearCookie('connect.sid');
      return res.redirect('/');
    });
  });

//for password reset of user
app.get('/reset_password',function(req,res){
    res.render('forgot_pass');
})

//to create new password
app.post('/reset_pass',async function(req,res){
    const {number,password}=req.body;
    const user = await login_user.findOne({number});
    console.log(user);
    if(!user){
        res.render("not_signed");
    }
    else{
        const id=user._id;
        const update= await login_user.findByIdAndUpdate(id, { $set: { password: password } },{new:true});
        console.log(update);
        res.render('login');
    }
})

// to edit user, this is the edit page that owner can do
app.post('/change_user/:id', async (req, res) => {
    try {
        console.log('🔧 Incoming Data:', req.body);
        console.log('🔧 ID to update:', req.params.id);

        const { name, family, room, doj } = req.body;

        const updatedData = {
            name,
            family,
            room: parseInt(room),
            doj: new Date(doj)
        };

        const result = await user_profile.findByIdAndUpdate(req.params.id, updatedData);

        if (!result) {
            console.log('⚠️ User not found');
            return res.status(404).send('User not found');
        }

        console.log('✅ User updated:', result);

        res.redirect('/alluser');
    } catch (err) {
        console.error('❌ Error:', err);
        res.status(500).send('Something went wrong');
    }
});

//edit user by user itself
app.post('/change_user_own/:id', async (req, res) => {
        const userId = req.params.id;
        console.log(userId);
        console.log(req.body);
        const {name, family, doj} = req.body;
        console.log(req.body);
    
        const user = await user_profile.findByIdAndUpdate(userId, {
            name,
            family,
            doj
        },{new:true});
    
        res.redirect(`/dashboard/${user.number}`); // redirect back to dashboard
});

//this will open the edit page of user by owner
app.get('/edit_user/:id', async function (req, res) {
    const user = await user_profile.findById(req.params.id);
    res.render('edit_user', { user });
})

// open edit page for user itseld
app.get('/edit/:id', async function (req, res) {
    const user = await user_profile.findById(req.params.id);
    res.render('edit', { user });
})

// to delete user by owner open delete page
app.get('/delete_user/:id', async function (req, res) {

    const user = await user_profile.findById(req.params.id);
    res.render('delete_user', { user });
})

// this will delete the user  , here id is user profile id
app.get('/delete/:id', async (req, res) => {
    try {
        const deletedUser = await user_profile.findByIdAndDelete(req.params.id);

        if (!deletedUser) {
            return res.status(404).send('User not found');
        }

        console.log('🗑️ User deleted:', deletedUser);
        res.redirect('/alluser');
    } catch (err) {
        console.error('❌ Error deleting user:', err);
        res.status(500).send('Something went wrong');
    }
});

// Pay Bill , here req param is room number , we are managing meter by room number
app.get('/pay/:id', async (req, res) => {
    const userId = parseInt(req.params.id); // Assuming room number is an integer

    try {
        const bill = await meter.findOne({ userId });

        // Find the user whose `room` matches this userId
        const user = await user_profile.findOne({ room: userId });

        if (!bill || !user) {
            return res.status(404).send('Bill or User not found');
        }
        console.log(bill);

        res.render('pay_bill', { bill, user });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

// this will add bill by user when payment , this will create bill_payment
app.post('/add_bill/:userId', async (req, res) => {
    try {
      console.log(req.body);

      console.error(req.params.userId);
      console.log(req.params.userId);
  
      const {
        userId,
        billMonth,
        amountPaid,
        paymentMethod,
        meterStartReading,
        meterEndReading,
        notes,
        status,
        razorpay_payment_id
      } = req.body;
      console.log("isko cheeak krna");
      console.log("isko cheeak krna",req.body);
  
      // Create a new bill document
      const newBill = new bill_payment({
        userId,
        billMonth,
        amountPaid,
        paymentMethod: "UPI",
        meterStartReading,
        meterEndReading,
        notes:razorpay_payment_id ,
        status, // this should still be like "Paid"
        // optional: store this if you want
      });

      console.log("bill Updated :", newBill);
  
      // Update status in meter collection
      const updatedBill = await meter.findOneAndUpdate(
        { userId: req.params.userId },
        { $set: { status } },
        { new: true }
      );
  
      console.log("Meter updated:", updatedBill);
  
      // Save the bill
      await newBill.save();
  
      const user = await user_profile.findById(userId);
      const loginUser = await login_user.findOne({ number: user.number });
      console.log(loginUser);

        res.render('receipt', {
            user,
            number: user.number,
            billMonth,
            amountPaid,
            paymentDate: new Date().toLocaleDateString(),
            paymentMethod,
            meterStartReading,
            meterEndReading,
            status,
            notes: razorpay_payment_id
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Payment failed' });
    }
});

// this is the monthly bill sent by owner
  app.post('/update_bill', async (req, res) => {
    try {
        const {
            userId,
            billMonth,
            paymentDate,
            amountPaid,
            paymentMethod,
            status,
            meterStartReading,
            meterEndReading,
            notes
        } = req.body;

        const newBill = await bill_payment.create({
            userId,
            billMonth,
            paymentDate,
            amountPaid,
            paymentMethod,
            status,
            meterStartReading,
            meterEndReading,
            notes
        });

        // Use userId from body instead of req.params
        const updatedBill = await meter.findOneAndUpdate(
            { userId: userId },
            { $set: { status } },
            { new: true }
        );
        console.log(updatedBill);

        const user = await user_profile.findById(userId);
        console.log(user.number);

        res.redirect(`/dashboard/${user.number}`);
    } catch (err) {
        console.error('Error saving bill:', err);
        res.status(500).send('Failed to save bill payment.');
    }
});

// this is to open all the past bill, user id is _id of user_profile
app.get('/past_bills/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        const bills = await bill_payment.find({ userId }).populate('userId');

        res.render('past_bill', { bills });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error fetching bill payments');
    }
});

// to approve the payment done by user from owner
app.get('/approve_payment', async function(req, res) {
    try {
      const users = await meter.find({ status: 'Pending' });
      console.log(users);
      res.render('approve_payment', { user: users });
    } catch (err) {
      console.error('Error fetching meter readings:', err);
      res.status(500).send('Server Error');
    }
  });

// to cheak which user has not paid bill
app.get('/new_payment', async function(req, res) {
    try {
      const users = await meter.find({ status: 'New',status :'None' });
      res.render('new_payment', { user: users });
    } catch (err) {
      console.error('Error fetching meter readings:', err);
      res.status(500).send('Server Error');
    }
  });

// to cheak which user paid bill monthly
app.get('/paid_payment', async function(req, res) {
    try {
      const users = await meter.find({ status: 'Paid' });
      res.render('paid_payment', { user: users });
    } catch (err) {
      console.error('Error fetching meter readings:', err);
      res.status(500).send('Server Error');
    }
});

// approve bill
  app.post('/approve_payment/:id', async (req, res) => {
    try {
      // 1. Update meter status to "Paid"
      const updatedMeter = await meter.findByIdAndUpdate(
        req.params.id,
        { status: 'Paid' },
        { new: true }
      );
      if (!updatedMeter) {
        return res.status(404).send("Meter not found.");
      }
  
      const roomNumber = updatedMeter.userId; // userId in meter is actually room number
  
      // 2. Find the user profile by room number
      const user = await user_profile.findOne({ room: roomNumber });
  
      if (!user) {
        return res.status(404).send("User profile not found.");
      }
  
      // 3. Get the _id to use in bill
      const userId = user._id;
      const month = updatedMeter.month;
  
      // 4. Update the bill_payment using userId
      const updatedBill = await bill_payment.findOneAndUpdate(
        { userId: userId,billMonth: month, }, // you can also match on billMonth if needed
        { status: 'Paid' },
        { new: true }
      );
      
  
      if (!updatedBill) {
        console.warn("No matching bill found to update.");
      }
  
      res.redirect('/approve_payment');
    } catch (err) {
      console.error(err);
      res.status(500).send("Error updating payment status.");
    }
  });

// Upload Meter Reading 
app.get('/meter_reading', async function (req, res) {
    try {
        const users = await meter.find({});
        res.render('create_bill', { users });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).send('Error retrieving users');
    }
});

// to add new meter reading of each user
app.post('/submit_bill', async function (req, res) {
    const { start_reading, start_date, room, rent } = req.body;
    const new_meter = await meter.create({
        userId: room,
        previousReading: start_reading,
        previousReadingDate: start_date,
        rent: rent
    });
    res.redirect('/meter_reading');
});
// to update meter reading by owner so that it become new bill
app.post('/update_meter_reading/:room', async function (req, res) {
    try {
      const userId = req.params.room;
      const { currentReading, currentReadingDate, month, notes ,totalRent} = req.body;
      console.log(month);
  
      const user = await meter.findById(userId);
      if (!user) return res.status(404).send('User not found');
  
      const updatedData = {
        oldpreviousReading: user.previousReading,
        oldpreviousReadingDate: user.previousReadingDate,

        previousReading: currentReading,
        previousReadingDate: currentReadingDate,
        currentReading: parseFloat(currentReading),
        currentReadingDate: new Date(currentReadingDate),
        totalrent: totalRent,
        month,
        status: 'None',
        notes
      };
      
      console.log(updatedData);
  
      await meter.findByIdAndUpdate(userId, updatedData,{ new: true });

      
  
      res.redirect('/meter_reading');
    } catch (err) {
      console.error(err);
      res.status(500).send('Server Error');
    }
  });

// to redection to making bill page 
app.get('/create_meter_reading', function (req, res) {
    res.render('meter_user');
});

// Edit User Profile
app.post('/edit_user/:id', async (req, res) => {
    const userId = req.params.id;
    const { name, family, room } = req.body;

    await user_profile.findByIdAndUpdate(userId, {
        name,
        family,
        room
    });

    res.redirect(`/dashboard/${userId}`); // redirect back to dashboard
});

// Submit Feedback
app.post('/feedback/:id', async (req, res) => {
    const userId = req.params.id;
    const { message } = req.body;

    // Save feedback to database
    // Example: await feedback.create({ userId, message });

    res.send(`Feedback submitted for user: ${userId}`);
});

// Submit Complaint
app.get('/complain/:id', async (req, res) => {
   res.render('complain');
});


// to delete user meter record
app.post('/delete_meter_user/:id', async (req, res) => {
    const userId = req.params.id;
    try {
      await meter.findByIdAndDelete(userId); // Or your appropriate model name
      res.redirect('/meter_reading'); // Redirect to your meter page
    } catch (err) {
      console.error('Delete error:', err);
      res.status(500).send('Error deleting user');
    }
  });
// Logout
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).send("Logout failed");
        res.redirect('/login');
    });
});

// Server
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
module.exports = app;
module.exports.handler = serverless(app);

