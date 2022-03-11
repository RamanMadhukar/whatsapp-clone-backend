// importing
import express from 'express'
import mongoose from 'mongoose'
import Messages from './dbMessages.js';
import Pusher from "pusher";
import cors from 'cors'



// app config
const app = express();
const port = process.env.PORT || 5000;

// middleware

app.use(express.json());
app.use(cors());


// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*");
//     res.setHeader("Access-Control-Allow-Headers", "*");
//     next();
// });

// db config
const connection_url = 'mongodb+srv://raman:4563@cluster0.dcjqp.mongodb.net/whatsappDatabase?retryWrites=true&w=majority'

mongoose.connect(connection_url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// pusher


const pusher = new Pusher({
    appId: "1360098",
    key: "3822b630f6be9ca8b1ca",
    secret: "d591c693454fcbfab6ad",
    cluster: "ap2",
    useTLS: true
});

const db = mongoose.connection;
db.once("open", () => {
    console.log("db is connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();
    changeStream.on('change', (change) => {
        // console.log(change);
        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger("messages", 'inserted',
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp
                }
            );
        } else {
            console.log('Error triggering Pusher');
        }
    });
});

// api routes

app.get("/messages/sync", (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(200).send(data);
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        } else {
            res.status(201).send(data)
        }
    })
})

// listen 

app.listen(port, () => console.log("server running at port 5000"));