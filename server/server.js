import mongoose from 'mongoose';
import {connect, createChannel, declareQueue, publishToQueue, consumeFromQueue} from './utils/rabbitMq/rabbitMQ.js';
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
        origin: '*',
        method: ['GET', 'POST']

    }
})

io.on("connection", (socket) => {
    console.log('connection', socket.id)
    socket.emit('connected');
    let count = 0;
    socket.on('new_message', async(data) => {
        const {message, messageId} = data;
        console.log('start new message', message);
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
                clientId: socket.id,
                data: message,
                messageId,
                count: ++count
              };
            await publishToQueue(channel, process.env.PUBLISH_MESSAGES_QUEUE_NAME, JSON.stringify(task));
            io.emit('pending', task);
        }catch(err){
            console.log('error publish to queue', err);
            io.emit('error');
        }
    });

 
})


server.listen(port, async(err) => {
    if (err) {
        console.log("Error in server setup", err)
        await channel.close();
        await connection.close();
    }
    console.log(`Server is running on port ${port}`);
});

  
async function incomingMessage(){
  try{
    if(!channel){
      console.log('No connection');
      return;
    }

    let isQueueEmpty = false;
    const existQueue = await channel.assertQueue(process.env.SAVED_MESSAGES_QUEUE_NAME)
    if(!existQueue){
        await declareQueue(channel, process.env.SAVED_MESSAGES_QUEUE_NAME);
    }
    while (!isQueueEmpty) {
      await consumeFromQueue(channel, process.env.SAVED_MESSAGES_QUEUE_NAME, async (message) => {
        if (message !== null) {
          console.log('message consumed from queue');
          const task = JSON.parse(message.content.toString());
          if(task.status === 'success'){
              io.to(task.clientId).emit('recieve_message', task.count);
          }else if(task.status === 'error'){
              io.to(task.clientId).emit('error', task.count);
          }
        } else {
          isQueueEmpty = true;
          console.log("No tasks remaining. Queue is empty.");
        }
      });
    }
  }catch(error){
    console.error('error while updating data', error);
  }
  
};

try{
  // setInterval(incomingMessage, parseInt(process.env.SERVER_INTERVAL)); 
    setInterval(incomingMessage, 5000); 
  }catch(err){
    console.log('error publish messages', err);
  }

