import mongoose from 'mongoose';
import {connect, createChannel, declareQueue, publishToQueue} from './utils/rabbitMq/rabbitMQ.js';
import express from 'express';
import http from 'http';
import {Server} from 'socket.io';
// Connect to MongoDB database
mongoose
  .connect('mongodb://mongo/domains')
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('Error connecting to MongoDB:', error));
 
let channel,connection;
connect()
.then(async(_connection) => {createChannel(_connection)
    .then((_channel => { 
        channel = _channel;
        connection = _connection; }));
  })
  .catch((error) => console.error('Error connecting to rabbitmq:', error));

const app = express();
const port = 3000;

app.use(express.urlencoded());
app.use(express.json());  


const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: process.env.SERVER_URL,
        method: ['POST']
    }
})

io.on('new_message', async (data) => {
    const message = data?.message;
    if(!message){
        console.error('No message specified');
        io.emit('error');
        return;
    }

    if(!channel){
        console.log('no connection');
        io.emit('error');
        return;
    }

    try{
        const existMessagesQueue = await channel.assertQueue(process.env.PUBLISH_MESSAGES_QUEUE_NAME)
        if(!existMessagesQueue){
            await declareQueue(channel, process.env.UPDATE_DATA_QUEUE_NAME);
        }
    }catch(error){
        console.error('Error creating queue');
        io.emit('error');
        return;
    }
    try{
        const task = {
            id: Date.now(),
            data: message
          };
        await publishToQueue(channel, process.env.PUBLISH_MESSAGES_QUEUE_NAME, JSON.stringify(task));

        io.emit('pending', task);
    }catch(err){
        console.log('error publish to queue', err);
        io.emit('error');
    }
});


io.on("connection", (socket) => {
    console.log(socket)
})


server.listen(port, async(err) => {
    if (err) {
        console.log("Error in server setup")
        console.error(error);
        await channel.close();
        await connection.close();
    }
    console.log(`Server is running on port ${port}`);
});

