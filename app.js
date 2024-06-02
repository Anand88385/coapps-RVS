const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

const registrations = []; // In-memory array to store registrations temporarily
const approvedRegistrations = [];

// Middleware for parsing JSON and form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Nodemailer transporter setup with App Password
const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: 'ranmbc27@gmail.com',
        pass: 'ssob dygl ftfa ixhc' // Use the App Password here
    }
});

// Route to handle sending email with registration link
app.post('/send-email', (req, res) => {
    const { email } = req.body;

    const mailOptions = {
        from: 'ranjitha270803@gmail.com',
        to: email,
        subject: 'Registration Link',
        text: 'Click the following link to register: http://localhost:3000/register'
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Error sending email:', error);
            return res.status(500).send('Error sending email');
        } else {
            console.log('Email sent:', info.response);
            res.send('Email sent successfully');
        }
    });
});

// Route to handle employee registration
app.post('/register', upload.fields([{ name: 'idProof' }, { name: 'resume' }]), (req, res) => {
    const { name, email, address } = req.body;
    const idProof = req.files['idProof'][0].path;
    const resume = req.files['resume'][0].path;

    console.log(`Name: ${name}, Email: ${email}, Address: ${address}, ID Proof: ${idProof}, Resume: ${resume}`);

    // Add registration to the in-memory array
    registrations.push({ name, email, address, idProof, resume });

    let mailOptions = {
        from: 'ranmbc27@gmail.com',
        to: 'ranjitha270803@gmail.com', // Replace with the actual manager's email
        subject: 'New Employee Registration',
        text: `Name: ${name}, Email: ${email}, Address: ${address}, ID Proof: ${idProof}, Resume: ${resume}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(`Error sending email: ${error}`);
            return res.status(500).send('Error sending registration email.');
        }
        console.log('Email sent: ' + info.response);
        res.send('Registration successful, awaiting approval.');
    });
});

// Route to handle manager approval
app.post('/approve', (req, res) => {
    const { email } = req.body;
    const registration = registrations.find(r => r.email === email);

    if (registration) {
        // Mark registration as approved
        registration.approved = true;

        // Generate username and password
        const username = email.split('@')[0];
        const password = Math.random().toString(36).substring(2, 10);

        // Store the approved registration with credentials
        approvedRegistrations.push({ email, username, password });

        // Send email to the employee with username, password, and link to set credentials
        let mailOptions = {
            from: 'ranjitha270803@gmail.com',
            to: email,
            subject: 'Your Registration is Approved',
            text: `Your registration has been approved.\n\nUsername: ${username}\nPassword: ${password}\n\nPlease set your username and password by clicking the link below:\nhttp://localhost:3000/credentials.html`
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(`Error sending email: ${error}`);
                return res.status(500).send('Error sending approval email.');
            }
            console.log('Approval email sent: ' + info.response);
            res.send(`Registration for ${email} approved.`);
        });
    } else {
        res.status(404).send('Registration not found.');
    }
});

// Route to handle setting username and password
app.post('/set-credentials', (req, res) => {
    const { username, password } = req.body;
    const approvedRegistration = approvedRegistrations.find(r => r.username === username && r.password === password);

    if (approvedRegistration) {
        console.log(`Username: ${username}, Password: ${password}`);
        res.send('Username and password have been set successfully.');
    } else {
        res.status(400).send('Invalid credentials.');
    }
});

// Route to fetch all pending registrations
app.get('/pending-registrations', (req, res) => {
    res.json(registrations.filter(r => !r.approved));
});

// Route to serve the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route to serve the registration form page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Route to handle registration form submission
app.post('/register', (req, res) => {
    // Process registration form submission here
    res.send('Registration successful!');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
